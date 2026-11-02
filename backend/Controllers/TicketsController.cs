using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Entities;
using FlowDesk.Api.Domain.Enums;
using FlowDesk.Api.Dtos;
using FlowDesk.Api.Extensions;
using FlowDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : FlowDeskControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly ITicketStateMachine _stateMachine;
    private readonly ISlaEngine _slaEngine;

    public TicketsController(
        AppDbContext context,
        ICurrentTenantService tenantService,
        ITicketStateMachine stateMachine,
        ISlaEngine slaEngine)
    {
        _context = context;
        _tenantService = tenantService;
        _stateMachine = stateMachine;
        _slaEngine = slaEngine;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TicketSummaryDto>>> GetTickets(
        [FromQuery] TicketStatus? status,
        [FromQuery] TicketPriority? priority,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Tickets.AsNoTracking().AsQueryable();

        if (IsCustomer)
        {
            var userId = CurrentUserId;
            query = query.Where(t => t.CreatedByUserId == userId);
        }
        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }
        if (priority.HasValue)
        {
            query = query.Where(t => t.Priority == priority.Value);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(t =>
                t.Title.Contains(term) || t.TicketNumber.Contains(term) || t.Description.Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TicketSummaryDto(
                t.Id,
                t.TicketNumber,
                t.Title,
                t.Priority,
                t.Status,
                t.CreatedByUserId,
                t.CreatedByUser.FullName,
                t.AssignedAgentId,
                t.AssignedAgent != null ? t.AssignedAgent.FullName : null,
                t.SlaResponseDeadlineUtc,
                t.SlaResolutionDeadlineUtc,
                t.IsBreached,
                t.CreatedAtUtc,
                t.ResolvedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<TicketSummaryDto>(items, page, pageSize, totalCount));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TicketDetailDto>> GetTicket(int id, CancellationToken cancellationToken)
    {
        var ticket = await LoadTicketAsync(id, cancellationToken);

        if (ticket is null || !CanAccess(ticket))
        {
            return NotFound();
        }

        return Ok(MapDetail(ticket));
    }

    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> CreateTicket(
        CreateTicketRequest request, CancellationToken cancellationToken)
    {
        var ticket = new Ticket
        {
            TenantId = _tenantService.TenantId,
            TicketNumber = $"TICK-TMP-{Guid.NewGuid():N}",
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            Status = TicketStatus.New,
            CreatedByUserId = CurrentUserId,
            IsBreached = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        try
        {
            await _slaEngine.ApplySlaPolicyAsync(ticket, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync(cancellationToken);

        ticket.TicketNumber = $"TICK-{1000 + ticket.Id}";
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        await _context.Entry(ticket).Reference(t => t.CreatedByUser).LoadAsync(cancellationToken);

        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, MapDetail(ticket));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TicketDetailDto>> UpdateStatus(
        int id, UpdateTicketStatusRequest request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (ticket is null || !CanAccess(ticket))
        {
            return NotFound();
        }

        if (!_stateMachine.CanTransition(ticket.Status, request.NewStatus))
        {
            return UnprocessableEntity(new
            {
                message = $"Illegal ticket status transition: {ticket.Status} -> {request.NewStatus}.",
                allowedTransitions = _stateMachine.GetAllowedTransitions(ticket.Status)
            });
        }

        var oldStatus = ticket.Status;
        var now = DateTime.UtcNow;

        ticket.Status = request.NewStatus;
        if (request.NewStatus == TicketStatus.Resolved)
        {
            ticket.ResolvedAtUtc = now;
        }
        else if (oldStatus == TicketStatus.Resolved && request.NewStatus == TicketStatus.InProgress)
        {
            ticket.ResolvedAtUtc = null;
        }

        _context.TicketAuditLogs.Add(new TicketAuditLog
        {
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            ChangedByUserId = CurrentUserId,
            OldStatus = oldStatus,
            NewStatus = request.NewStatus,
            Note = string.IsNullOrWhiteSpace(request.Note)
                ? $"Status changed from {oldStatus} to {request.NewStatus}."
                : request.Note,
            TimestampUtc = now
        });

        await _context.SaveChangesAsync(cancellationToken);
        return await GetTicket(id, cancellationToken);
    }

    [HttpPatch("{id:int}/assign")]
    [Authorize(Policy = "AgentOrAdmin")]
    public async Task<ActionResult<TicketDetailDto>> Assign(
        int id, AssignTicketRequest request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (ticket is null)
        {
            return NotFound();
        }

        var agent = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.AgentId && u.TenantId == ticket.TenantId, cancellationToken);

        if (agent is null || agent.Role != UserRole.Agent)
        {
            return BadRequest(new { message = "Target user must be an agent of this tenant." });
        }

        var now = DateTime.UtcNow;
        var oldStatus = ticket.Status;
        ticket.AssignedAgentId = agent.Id;

        if (ticket.Status == TicketStatus.New)
        {
            ticket.Status = TicketStatus.Assigned;
        }

        _context.TicketAuditLogs.Add(new TicketAuditLog
        {
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            ChangedByUserId = CurrentUserId,
            OldStatus = oldStatus,
            NewStatus = ticket.Status,
            Note = $"Assigned to {agent.FullName}.",
            TimestampUtc = now
        });

        await _context.SaveChangesAsync(cancellationToken);
        return await GetTicket(id, cancellationToken);
    }

    [HttpPatch("{id:int}/priority")]
    [Authorize(Policy = "AgentOrAdmin")]
    public async Task<ActionResult<TicketDetailDto>> UpdatePriority(
        int id, UpdateTicketPriorityRequest request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (ticket is null)
        {
            return NotFound();
        }

        if (ticket.Priority == request.Priority)
        {
            return await GetTicket(id, cancellationToken);
        }

        var oldPriority = ticket.Priority;
        var note = $"Priority changed from {oldPriority} to {request.Priority}.";
        ticket.Priority = request.Priority;

        var isOpen = ticket.Status != TicketStatus.Resolved && ticket.Status != TicketStatus.Closed;
        if (isOpen)
        {
            try
            {
                await _slaEngine.ApplySlaPolicyAsync(ticket, cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            note += " SLA deadlines recalculated.";
        }

        _context.TicketAuditLogs.Add(new TicketAuditLog
        {
            TenantId = ticket.TenantId,
            TicketId = ticket.Id,
            ChangedByUserId = CurrentUserId,
            OldStatus = ticket.Status,
            NewStatus = ticket.Status,
            Note = note,
            TimestampUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return await GetTicket(id, cancellationToken);
    }

    private async Task<Ticket?> LoadTicketAsync(int id, CancellationToken cancellationToken)
        => await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Comments).ThenInclude(c => c.User)
            .Include(t => t.AuditLogs).ThenInclude(a => a.ChangedByUser)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

    private TicketDetailDto MapDetail(Ticket ticket)
    {
        var now = DateTime.UtcNow;
        var hideInternal = IsCustomer;

        var comments = ticket.Comments
            .Where(c => !hideInternal || !c.IsInternal)
            .OrderBy(c => c.CreatedAtUtc)
            .Select(c => new CommentDto(
                c.Id, c.TicketId, c.UserId, c.User?.FullName ?? string.Empty,
                c.Content, c.IsInternal, c.CreatedAtUtc))
            .ToList();

        var auditLogs = ticket.AuditLogs
            .OrderBy(a => a.TimestampUtc)
            .Select(a => new AuditLogDto(
                a.Id, a.ChangedByUserId, a.ChangedByUser?.FullName ?? string.Empty,
                a.OldStatus, a.NewStatus, a.Note, a.TimestampUtc))
            .ToList();

        return new TicketDetailDto(
            ticket.Id,
            ticket.TicketNumber,
            ticket.Title,
            ticket.Description,
            ticket.Priority,
            ticket.Status,
            ticket.CreatedByUserId,
            ticket.CreatedByUser?.FullName ?? string.Empty,
            ticket.AssignedAgentId,
            ticket.AssignedAgent?.FullName,
            ticket.SlaResponseDeadlineUtc,
            ticket.SlaResolutionDeadlineUtc,
            (ticket.SlaResponseDeadlineUtc - now).TotalSeconds,
            (ticket.SlaResolutionDeadlineUtc - now).TotalSeconds,
            ticket.IsBreached,
            ticket.CreatedAtUtc,
            ticket.ResolvedAtUtc,
            comments,
            auditLogs);
    }
}
