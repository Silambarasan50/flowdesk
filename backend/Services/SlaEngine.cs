using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Services;

public class SlaEngine : ISlaEngine
{
    private readonly AppDbContext _context;

    public SlaEngine(AppDbContext context)
    {
        _context = context;
    }

    public async Task ApplySlaPolicyAsync(Ticket ticket, CancellationToken cancellationToken = default)
    {
        var policy = await _context.SlaPolicies
            .FirstOrDefaultAsync(p => p.TenantId == ticket.TenantId && p.Priority == ticket.Priority,
                cancellationToken);

        if (policy is null)
        {
            throw new InvalidOperationException(
                $"No SLA policy configured for priority {ticket.Priority} in this tenant.");
        }

        ticket.SlaResponseDeadlineUtc = ticket.CreatedAtUtc.AddMinutes(policy.ResponseTimeMinutes);
        ticket.SlaResolutionDeadlineUtc = ticket.CreatedAtUtc.AddMinutes(policy.ResolutionTimeMinutes);
    }
}
