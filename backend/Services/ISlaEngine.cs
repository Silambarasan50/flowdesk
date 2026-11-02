using FlowDesk.Api.Domain.Entities;

namespace FlowDesk.Api.Services;

public interface ISlaEngine
{
    Task ApplySlaPolicyAsync(Ticket ticket, CancellationToken cancellationToken = default);
}
