using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Entities;
using FlowDesk.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Workers;

public class SlaMonitorWorker : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromSeconds(30);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaMonitorWorker> _logger;

    public SlaMonitorWorker(IServiceScopeFactory scopeFactory, ILogger<SlaMonitorWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SLA monitor worker started (interval: {Interval}s)", CheckInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckForBreachesAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SLA monitor sweep failed");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task CheckForBreachesAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        var overdueTickets = await context.Tickets
            .IgnoreQueryFilters()
            .Where(t => !t.IsBreached
                && t.Status != TicketStatus.Resolved
                && t.Status != TicketStatus.Closed
                && t.SlaResolutionDeadlineUtc < now)
            .ToListAsync(cancellationToken);

        if (overdueTickets.Count == 0)
        {
            return;
        }

        var tenantIds = overdueTickets.Select(t => t.TenantId).Distinct().ToList();
        var admins = await context.Users
            .Where(u => tenantIds.Contains(u.TenantId) && u.Role == UserRole.Admin)
            .ToListAsync(cancellationToken);
        var adminByTenant = admins
            .GroupBy(u => u.TenantId)
            .ToDictionary(g => g.Key, g => g.First().Id);

        foreach (var ticket in overdueTickets)
        {
            ticket.IsBreached = true;

            var changedBy = adminByTenant.TryGetValue(ticket.TenantId, out var adminId)
                ? adminId
                : ticket.AssignedAgentId ?? ticket.CreatedByUserId;

            context.TicketAuditLogs.Add(new TicketAuditLog
            {
                TenantId = ticket.TenantId,
                TicketId = ticket.Id,
                ChangedByUserId = changedBy,
                OldStatus = ticket.Status,
                NewStatus = ticket.Status,
                Note = $"SLA breached: resolution deadline {ticket.SlaResolutionDeadlineUtc:u} exceeded (system).",
                TimestampUtc = now
            });
        }

        await context.SaveChangesAsync(cancellationToken);
        _logger.LogWarning("SLA monitor flagged {Count} ticket(s) as breached", overdueTickets.Count);
    }
}
