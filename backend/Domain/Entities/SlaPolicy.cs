using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Domain.Entities;

public class SlaPolicy
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public TicketPriority Priority { get; set; }
    public int ResponseTimeMinutes { get; set; }
    public int ResolutionTimeMinutes { get; set; }

    public Tenant Tenant { get; set; } = null!;
}
