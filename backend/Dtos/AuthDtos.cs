using System.ComponentModel.DataAnnotations;

namespace FlowDesk.Api.Dtos;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    Guid TenantId);

public record LoginResponse(
    string Token,
    UserDto User);
