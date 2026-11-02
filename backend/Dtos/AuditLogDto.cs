using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Dtos;

public record AuditLogDto(
    int Id,
    Guid ChangedByUserId,
    string ChangedByName,
    TicketStatus OldStatus,
    TicketStatus NewStatus,
    string Note,
    DateTime TimestampUtc);
