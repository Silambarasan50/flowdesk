using System.ComponentModel.DataAnnotations;

namespace FlowDesk.Api.Dtos;

public record CreateCommentRequest(
    [Required] string Content,
    bool IsInternal);

public record CommentDto(
    int Id,
    int TicketId,
    Guid UserId,
    string UserName,
    string Content,
    bool IsInternal,
    DateTime CreatedAtUtc);
