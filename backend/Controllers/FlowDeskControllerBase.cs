using FlowDesk.Api.Domain.Entities;
using FlowDesk.Api.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace FlowDesk.Api.Controllers;

public abstract class FlowDeskControllerBase : ControllerBase
{
    protected Guid CurrentUserId => User.GetUserId();
    protected Guid CurrentTenantId => User.GetTenantId();
    protected bool IsCustomer => User.IsCustomer();

    protected bool CanAccess(Ticket ticket)
        => !IsCustomer || ticket.CreatedByUserId == CurrentUserId;
}
