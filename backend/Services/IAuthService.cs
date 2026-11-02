using FlowDesk.Api.Dtos;

namespace FlowDesk.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
}
