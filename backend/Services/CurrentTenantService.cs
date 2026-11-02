using FlowDesk.Api.Data;

namespace FlowDesk.Api.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid TenantId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext is null)
            {
                return DbSeeder.AcmeTenantId;
            }

            var claimValue = httpContext.User.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(claimValue, out var tenantFromClaim))
            {
                return tenantFromClaim;
            }

            var headerValue = httpContext.Request.Headers["X-Tenant-ID"].FirstOrDefault();
            if (Guid.TryParse(headerValue, out var tenantFromHeader))
            {
                return tenantFromHeader;
            }

            return DbSeeder.AcmeTenantId;
        }
    }
}
