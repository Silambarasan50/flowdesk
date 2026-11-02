namespace FlowDesk.Api.Services;

public interface ICurrentTenantService
{
    Guid TenantId { get; }
}
