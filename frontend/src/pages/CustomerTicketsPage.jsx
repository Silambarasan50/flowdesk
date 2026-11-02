import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox, Loader2, PlusCircle } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Avatar, PriorityPill, SlaBadge, StatusPill } from '../components/ticketUi';
import { parseUtc } from '../utils/dates';

export default function CustomerTicketsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tickets', { params: { pageSize: 100 } });
      setTickets(data.items);
    } catch {
      toast.push('Failed to load your tickets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-sm text-slate-500">{tickets.length} ticket(s) submitted by you</p>
        </div>
        <Link
          to="/portal/submit"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" /> New ticket
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
          <Inbox className="mb-2 h-8 w-8" />
          <p className="text-sm">No tickets yet — submit your first request.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-400">{ticket.ticketNumber}</p>
                    <p className="font-medium text-slate-800">{ticket.title}</p>
                  </td>
                  <td className="px-4 py-3"><PriorityPill priority={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusPill status={ticket.status} /></td>
                  <td className="px-4 py-3"><SlaBadge ticket={ticket} now={now} /></td>
                  <td className="px-4 py-3">
                    {ticket.assignedAgentName ? (
                      <span className="flex items-center gap-2">
                        <Avatar name={ticket.assignedAgentName} />
                        <span className="text-xs text-slate-600">{ticket.assignedAgentName}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {parseUtc(ticket.createdAtUtc)?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
