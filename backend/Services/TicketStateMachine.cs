using FlowDesk.Api.Domain.Enums;

namespace FlowDesk.Api.Services;

public class TicketStateMachine : ITicketStateMachine
{
    private static readonly IReadOnlyDictionary<TicketStatus, TicketStatus[]> Transitions =
        new Dictionary<TicketStatus, TicketStatus[]>
        {
            [TicketStatus.New] = [TicketStatus.Assigned, TicketStatus.Closed],
            [TicketStatus.Assigned] = [TicketStatus.InProgress, TicketStatus.PendingCustomer, TicketStatus.Closed],
            [TicketStatus.InProgress] = [TicketStatus.PendingCustomer, TicketStatus.Resolved, TicketStatus.Closed],
            [TicketStatus.PendingCustomer] = [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Closed],
            [TicketStatus.Resolved] = [TicketStatus.InProgress, TicketStatus.Closed],
            [TicketStatus.Closed] = []
        };

    public bool CanTransition(TicketStatus from, TicketStatus to)
        => Transitions.TryGetValue(from, out var allowed) && allowed.Contains(to);

    public IReadOnlyCollection<TicketStatus> GetAllowedTransitions(TicketStatus from)
        => Transitions.TryGetValue(from, out var allowed) ? allowed : [];

    public void EnsureValidTransition(TicketStatus from, TicketStatus to)
    {
        if (!CanTransition(from, to))
        {
            throw new InvalidOperationException(
                $"Illegal ticket status transition: {from} -> {to}. " +
                $"Allowed: {string.Join(", ", GetAllowedTransitions(from))}");
        }
    }
}
