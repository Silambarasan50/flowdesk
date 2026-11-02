using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Domain.Entities;

public class Ticket
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedAgentId { get; set; }
    public DateTime SlaResponseDeadlineUtc { get; set; }
    public DateTime SlaResolutionDeadlineUtc { get; set; }
    public bool IsBreached { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }

    public Tenant Tenant { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
    public User? AssignedAgent { get; set; }
    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();
    public ICollection<TicketAuditLog> AuditLogs { get; set; } = new List<TicketAuditLog>();
}
