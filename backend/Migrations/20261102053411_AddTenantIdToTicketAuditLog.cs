using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlowDesk.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantIdToTicketAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TenantId",
                table: "TicketAuditLogs",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TicketAuditLogs_TenantId_TicketId",
                table: "TicketAuditLogs",
                columns: new[] { "TenantId", "TicketId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TicketAuditLogs_TenantId_TicketId",
                table: "TicketAuditLogs");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "TicketAuditLogs");
        }
    }
}
