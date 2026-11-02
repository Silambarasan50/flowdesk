using FlowDesk.Api.Domain.Entities;
using FlowDesk.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowDesk.Api.Data;

public static class DbSeeder
{
    public static readonly Guid AcmeTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid AcmeAdminUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid AcmeAgentUserId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid AcmeCustomerUserId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    public static async Task SeedAsync(AppDbContext context)
    {
        var now = DateTime.UtcNow;

        if (!await context.Tenants.AnyAsync(t => t.Id == AcmeTenantId))
        {
            context.Tenants.Add(new Tenant
            {
                Id = AcmeTenantId,
                Name = "Acme Corporation",
                Domain = "acme.com",
                CreatedAtUtc = now
            });
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync(u => u.TenantId == AcmeTenantId))
        {
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

            context.Users.AddRange(
                new User
                {
                    Id = AcmeAdminUserId,
                    TenantId = AcmeTenantId,
                    FullName = "Acme Administrator",
                    Email = "admin@acme.com",
                    PasswordHash = passwordHash,
                    Role = UserRole.Admin,
                    CreatedAtUtc = now
                },
                new User
                {
                    Id = AcmeAgentUserId,
                    TenantId = AcmeTenantId,
                    FullName = "Acme Support Agent",
                    Email = "agent@acme.com",
                    PasswordHash = passwordHash,
                    Role = UserRole.Agent,
                    CreatedAtUtc = now
                },
                new User
                {
                    Id = AcmeCustomerUserId,
                    TenantId = AcmeTenantId,
                    FullName = "Acme Customer",
                    Email = "customer@acme.com",
                    PasswordHash = passwordHash,
                    Role = UserRole.Customer,
                    CreatedAtUtc = now
                });

            await context.SaveChangesAsync();
        }

        if (!await context.SlaPolicies.AnyAsync(p => p.TenantId == AcmeTenantId))
        {
            context.SlaPolicies.AddRange(
                new SlaPolicy
                {
                    TenantId = AcmeTenantId,
                    Priority = TicketPriority.P1_Critical,
                    ResponseTimeMinutes = 15,
                    ResolutionTimeMinutes = 120
                },
                new SlaPolicy
                {
                    TenantId = AcmeTenantId,
                    Priority = TicketPriority.P2_High,
                    ResponseTimeMinutes = 60,
                    ResolutionTimeMinutes = 480
                },
                new SlaPolicy
                {
                    TenantId = AcmeTenantId,
                    Priority = TicketPriority.P3_Medium,
                    ResponseTimeMinutes = 240,
                    ResolutionTimeMinutes = 1440
                },
                new SlaPolicy
                {
                    TenantId = AcmeTenantId,
                    Priority = TicketPriority.P4_Low,
                    ResponseTimeMinutes = 480,
                    ResolutionTimeMinutes = 4320
                });

            await context.SaveChangesAsync();
        }

        if (await context.Tickets.AnyAsync(t => t.TenantId == AcmeTenantId))
        {
            return;
        }

        context.Tickets.AddRange(
            new Ticket
            {
                TenantId = AcmeTenantId,
                TicketNumber = "TICK-1001",
                Title = "Checkout API returning 504 errors for EU customers",
                Description = "Since 09:12 UTC roughly 30% of checkout requests from EU regions are timing out at the payment gateway. Error spikes correlate with the pg-eu-2 node. Significant revenue impact - needs immediate investigation.",
                Priority = TicketPriority.P1_Critical,
                Status = TicketStatus.InProgress,
                CreatedByUserId = AcmeCustomerUserId,
                AssignedAgentId = AcmeAgentUserId,
                SlaResponseDeadlineUtc = now.AddMinutes(-40).AddMinutes(15),
                SlaResolutionDeadlineUtc = now.AddMinutes(-40).AddMinutes(120),
                IsBreached = true,
                CreatedAtUtc = now.AddMinutes(-40)
            },
            new Ticket
            {
                TenantId = AcmeTenantId,
                TicketNumber = "TICK-1002",
                Title = "SSO login loop after identity provider certificate update",
                Description = "Users are redirected back to the login page in an infinite loop after the IdP rolled its signing certificate overnight. Affects Chrome and Edge. Clearing cookies does not resolve it.",
                Priority = TicketPriority.P2_High,
                Status = TicketStatus.InProgress,
                CreatedByUserId = AcmeCustomerUserId,
                AssignedAgentId = AcmeAgentUserId,
                SlaResponseDeadlineUtc = now.AddMinutes(-50).AddMinutes(60),
                SlaResolutionDeadlineUtc = now.AddMinutes(-50).AddMinutes(480),
                CreatedAtUtc = now.AddMinutes(-50)
            },
            new Ticket
            {
                TenantId = AcmeTenantId,
                TicketNumber = "TICK-1003",
                Title = "Quarterly report CSV export truncates description columns",
                Description = "When exporting the Q3 asset report to CSV, any description field longer than 255 characters is cut off without warning. Finance needs the full text for the audit trail.",
                Priority = TicketPriority.P3_Medium,
                Status = TicketStatus.Assigned,
                CreatedByUserId = AcmeCustomerUserId,
                AssignedAgentId = AcmeAgentUserId,
                SlaResponseDeadlineUtc = now.AddHours(-2).AddMinutes(240),
                SlaResolutionDeadlineUtc = now.AddHours(-2).AddMinutes(1440),
                CreatedAtUtc = now.AddHours(-2)
            },
            new Ticket
            {
                TenantId = AcmeTenantId,
                TicketNumber = "TICK-1004",
                Title = "Duplicate line items appearing on generated invoice PDFs",
                Description = "Invoices generated since yesterday's deployment show every subscription line twice, doubling the displayed total. The underlying billing data looks correct in the dashboard.",
                Priority = TicketPriority.P2_High,
                Status = TicketStatus.New,
                CreatedByUserId = AcmeCustomerUserId,
                AssignedAgentId = null,
                SlaResponseDeadlineUtc = now.AddMinutes(-20).AddMinutes(60),
                SlaResolutionDeadlineUtc = now.AddMinutes(-20).AddMinutes(480),
                CreatedAtUtc = now.AddMinutes(-20)
            },
            new Ticket
            {
                TenantId = AcmeTenantId,
                TicketNumber = "TICK-1005",
                Title = "Feature request: dark mode for customer portal",
                Description = "Several end users have asked for a dark theme option on the self-service portal, especially for after-hours on-call work. Happy to beta test when available.",
                Priority = TicketPriority.P4_Low,
                Status = TicketStatus.New,
                CreatedByUserId = AcmeCustomerUserId,
                AssignedAgentId = null,
                SlaResponseDeadlineUtc = now.AddHours(-3).AddMinutes(480),
                SlaResolutionDeadlineUtc = now.AddHours(-3).AddMinutes(4320),
                CreatedAtUtc = now.AddHours(-3)
            });

        await context.SaveChangesAsync();
    }
}
