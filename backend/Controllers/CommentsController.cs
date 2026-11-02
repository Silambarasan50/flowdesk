using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Entities;
using FlowDesk.Api.Dtos;
using FlowDesk.Api.Extensions;
using FlowDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Controllers;

[ApiController]
[Route("api/tickets/{ticketId:int}/comments")]
[Authorize]
public class CommentsController : FlowDeskControllerBase
{
    private readonly AppDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CommentsController(AppDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CommentDto>>> GetComments(
        int ticketId, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket is null || !CanAccess(ticket))
        {
            return NotFound();
        }

        var isCustomer = IsCustomer;
        var comments = await _context.TicketComments
            .Where(c => c.TicketId == ticketId && (!isCustomer || !c.IsInternal))
            .OrderBy(c => c.CreatedAtUtc)
            .Select(c => new CommentDto(
                c.Id, c.TicketId, c.UserId, c.User.FullName, c.Content, c.IsInternal, c.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<CommentDto>> AddComment(
        int ticketId, CreateCommentRequest request, CancellationToken cancellationToken)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken);

        if (ticket is null || !CanAccess(ticket))
        {
            return NotFound();
        }

        if (request.IsInternal && !User.IsStaff())
        {
            return Forbid();
        }

        var comment = new TicketComment
        {
            TenantId = _tenantService.TenantId,
            TicketId = ticket.Id,
            UserId = CurrentUserId,
            Content = request.Content.Trim(),
            IsInternal = request.IsInternal,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.TicketComments.Add(comment);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new CommentDto(
            comment.Id, comment.TicketId, comment.UserId,
            User.FindFirst("name")?.Value ?? string.Empty,
            comment.Content, comment.IsInternal, comment.CreatedAtUtc);

        return CreatedAtAction(nameof(GetComments), new { ticketId }, dto);
    }
}
