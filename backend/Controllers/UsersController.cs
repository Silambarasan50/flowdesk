using FlowDesk.Api.Data;
using FlowDesk.Api.Domain.Enums;
using FlowDesk.Api.Dtos;
using FlowDesk.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = "AgentOrAdmin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("agents")]
    public async Task<ActionResult<IReadOnlyList<AgentDto>>> GetAgents(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        var agents = await _context.Users
            .Where(u => u.TenantId == tenantId && u.Role == UserRole.Agent)
            .OrderBy(u => u.FullName)
            .Select(u => new AgentDto(u.Id, u.FullName))
            .ToListAsync(cancellationToken);

        return Ok(agents);
    }
}
