using FlowDesk.Api.Dtos;
using FlowDesk.Api.Extensions;
using FlowDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlowDesk.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request.Email, request.Password, cancellationToken);
        return response is null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserDto> Me()
    {
        return Ok(new UserDto(
            User.GetUserId(),
            User.FindFirst("name")?.Value ?? string.Empty,
            User.FindFirst("email")?.Value ?? string.Empty,
            User.FindFirst("role")?.Value ?? string.Empty,
            User.GetTenantId()));
    }
}
