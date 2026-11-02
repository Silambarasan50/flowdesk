using System.Security.Claims;
using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirst("sub")?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var userId) ? userId : Guid.Empty;
    }

    public static Guid GetTenantId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirst("tenant_id")?.Value;
        return Guid.TryParse(value, out var tenantId) ? tenantId : Guid.Empty;
    }

    public static bool IsCustomer(this ClaimsPrincipal principal)
        => principal.IsInRole(nameof(UserRole.Customer));

    public static bool IsStaff(this ClaimsPrincipal principal)
        => principal.IsInRole(nameof(UserRole.Admin)) || principal.IsInRole(nameof(UserRole.Agent));
}
