using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Domain.Entities;

public class TicketAuditLog
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int TicketId { get; set; }
    public Guid ChangedByUserId { get; set; }
    public TicketStatus OldStatus { get; set; }
    public TicketStatus NewStatus { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User ChangedByUser { get; set; } = null!;
}
