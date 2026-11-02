using System.ComponentModel.DataAnnotations;
using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Dtos;

public record CreateTicketRequest(
    [Required, MaxLength(200)] string Title,
    [Required] string Description,
    [Required] TicketPriority Priority);

public record UpdateTicketStatusRequest(
    [Required] TicketStatus NewStatus,
    string? Note);

public record AssignTicketRequest(
    [Required] Guid AgentId);

public record UpdateTicketPriorityRequest(
    [Required] TicketPriority Priority);

public record AgentDto(
    Guid Id,
    string FullName);

public record TicketSummaryDto(
    int Id,
    string TicketNumber,
    string Title,
    TicketPriority Priority,
    TicketStatus Status,
    Guid CreatedByUserId,
    string CreatedByName,
    Guid? AssignedAgentId,
    string? AssignedAgentName,
    DateTime SlaResponseDeadlineUtc,
    DateTime SlaResolutionDeadlineUtc,
    bool IsBreached,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc);

public record TicketDetailDto(
    int Id,
    string TicketNumber,
    string Title,
    string Description,
    TicketPriority Priority,
    TicketStatus Status,
    Guid CreatedByUserId,
    string CreatedByName,
    Guid? AssignedAgentId,
    string? AssignedAgentName,
    DateTime SlaResponseDeadlineUtc,
    DateTime SlaResolutionDeadlineUtc,
    double ResponseSecondsRemaining,
    double ResolutionSecondsRemaining,
    bool IsBreached,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc,
    IReadOnlyList<CommentDto> Comments,
    IReadOnlyList<AuditLogDto> AuditLogs);
