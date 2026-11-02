using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Enums;
using FlowDesk.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : FlowDeskControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var query = _context.Tickets.AsQueryable();

        if (IsCustomer)
        {
            var userId = CurrentUserId;
            query = query.Where(t => t.CreatedByUserId == userId);
        }

        var summary = await query
            .GroupBy(t => 1)
            .Select(g => new AnalyticsSummaryDto(
                g.Count(),
                g.Count(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed),
                g.Count(t => t.Status == TicketStatus.InProgress),
                g.Count(t => t.IsBreached),
                g.Count(t => t.Status == TicketStatus.Resolved)))
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(summary ?? new AnalyticsSummaryDto(0, 0, 0, 0, 0));
    }
}
