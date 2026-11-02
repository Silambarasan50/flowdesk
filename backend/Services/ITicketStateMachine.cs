using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Services;

public interface ITicketStateMachine
{
    bool CanTransition(TicketStatus from, TicketStatus to);
    IReadOnlyCollection<TicketStatus> GetAllowedTransitions(TicketStatus from);
    void EnsureValidTransition(TicketStatus from, TicketStatus to);
}
