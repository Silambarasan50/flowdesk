namespace FlowDesk.Api.Domain.Entities;

public class TicketComment
{
    public int Id { get; set; }
    public Guid TenantId { get; set; }
    public int TicketId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public Ticket Ticket { get; set; } = null!;
    public User User { get; set; } = null!;
}
