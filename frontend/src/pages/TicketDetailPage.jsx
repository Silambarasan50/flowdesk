import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Clock,
  Flame,
  Loader2,
  Lock,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, PriorityPill, STATUS_LABELS, StatusPill } from '../components/ticketUi';
import { formatRemaining, parseUtc } from '../utils/dates';

const ALLOWED_TRANSITIONS = {
  New: ['Assigned', 'Closed'],
  Assigned: ['InProgress', 'PendingCustomer', 'Closed'],
  InProgress: ['PendingCustomer', 'Resolved', 'Closed'],
  PendingCustomer: ['InProgress', 'Resolved', 'Closed'],
  Resolved: ['InProgress', 'Closed'],
  Closed: [],
};

const PRIORITY_OPTIONS = ['P1_Critical', 'P2_High', 'P3_Medium', 'P4_Low'];

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return { days, text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` };
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isStaff = user?.role !== 'Customer';

  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('public');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const notFound = useRef(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (error) {
      notFound.current = true;
      if (error.response?.status === 404) {
        toast.push('Ticket not found.', 'error');
      } else {
        toast.push('Failed to load ticket.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, [load]);

  useEffect(() => {
    if (!isStaff) return;
    api.get('/users/agents')
      .then(({ data }) => setAgents(data))
      .catch(() => {});
  }, [isStaff]);

  const patch = async (path, body, failure) => {
    try {
      const { data } = await api.patch(`/tickets/${id}/${path}`, body);
      setTicket(data);
    } catch (error) {
      toast.push(error.response?.data?.message ?? failure, 'error');
      load();
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/comments`, {
        content,
        isInternal: isStaff && tab === 'internal',
      });
      setDraft('');
      await load();
    } catch {
      toast.push('Failed to post your note.', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading ticket…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400">
        <AlertTriangle className="mb-2 h-8 w-8" />
        <p className="text-sm">Ticket not found or not accessible.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const comments = ticket.comments.filter((c) =>
    tab === 'internal' ? c.isInternal : !c.isInternal
  );
  const resolutionDeadline = parseUtc(ticket.slaResolutionDeadlineUtc);
  const responseDeadline = parseUtc(ticket.slaResponseDeadlineUtc);
  const remainingMs = resolutionDeadline ? resolutionDeadline.getTime() - now : 0;
  const countdown = formatCountdown(remainingMs);
  const nextStatuses = ALLOWED_TRANSITIONS[ticket.status] ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-500">
          {ticket.ticketNumber}
        </span>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-slate-900">{ticket.title}</h1>
        <PriorityPill priority={ticket.priority} />
        {isStaff && nextStatuses.length > 0 ? (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) patch('status', { newStatus: e.target.value }, 'Status change rejected.');
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="">{STATUS_LABELS[ticket.status]} ▾</option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>Move to {STATUS_LABELS[s]}</option>
            ))}
          </select>
        ) : (
          <StatusPill status={ticket.status} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[7fr_3fr]">
        {/* Left column — 70% */}
        <div className="space-y-4">
          {/* Description */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {ticket.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Reported by{' '}
                <strong className="text-slate-700">{ticket.createdByName}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />{' '}
                {parseUtc(ticket.createdAtUtc)?.toLocaleString()}
              </span>
            </div>
          </section>

          {/* Activity stream */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab('public')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'public' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Public Replies
              </button>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setTab('internal')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === 'internal'
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" /> Staff Internal Notes
                </button>
              )}
            </div>

            <div className="space-y-3">
              {comments.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">
                  No {tab === 'internal' ? 'internal notes' : 'replies'} yet.
                </p>
              )}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg border p-3 ${
                    comment.isInternal
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2 text-xs">
                    <Avatar name={comment.userName} />
                    <span className="font-semibold text-slate-800">{comment.userName}</span>
                    {comment.isInternal && (
                      <span className="flex items-center gap-1 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        <Lock className="h-2.5 w-2.5" /> Internal
                      </span>
                    )}
                    <span className="ml-auto text-slate-400">
                      {parseUtc(comment.createdAtUtc)?.toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={submitComment} className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder={
                  isStaff && tab === 'internal'
                    ? 'Write a confidential note for staff…'
                    : 'Write a reply for the customer…'
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 ${
                  isStaff && tab === 'internal'
                    ? 'border-amber-300 bg-amber-50/50 focus:border-amber-400 focus:ring-amber-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              <div className="mt-2 flex items-center justify-between">
                {isStaff && tab === 'internal' ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700">
                    <Lock className="h-3 w-3" /> Visible to staff only
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Visible to the customer</span>
                )}
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    isStaff && tab === 'internal'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Note
                </button>
              </div>
            </form>
          </section>

          {/* Audit trail */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Audit Trail
            </h2>
            {ticket.auditLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No recorded changes yet.</p>
            ) : (
              <ol className="relative ml-2 space-y-5 border-l-2 border-slate-200 pl-5">
                {[...ticket.auditLogs].reverse().map((log) => (
                  <li key={log.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-800">
                        {STATUS_LABELS[log.oldStatus] ?? log.oldStatus}
                        {' → '}
                        {STATUS_LABELS[log.newStatus] ?? log.newStatus}
                      </span>
                      <span className="text-slate-400">by {log.changedByName}</span>
                      <span className="ml-auto font-mono text-[11px] text-slate-400">
                        {parseUtc(log.timestampUtc)?.toLocaleString()}
                      </span>
                    </div>
                    {log.note && <p className="mt-1 text-xs text-slate-500">{log.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Right sidebar — 30% */}
        <div className="space-y-4">
          {/* SLA countdown */}
          <section
            className={`rounded-xl border p-5 shadow-card ${
              ticket.isBreached
                ? 'border-red-300 bg-red-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-slate-500">
              <Clock className="h-4 w-4" /> Resolution SLA
            </h2>
            {ticket.isBreached ? (
              <div className="flex items-start gap-3 rounded-lg bg-red-600 p-4 text-white">
                <Flame className="mt-0.5 h-6 w-6 shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm font-bold tracking-wide">SLA BREACHED</p>
                  <p className="mt-0.5 text-xs text-red-100">
                    Deadline passed {formatRemaining(now - (resolutionDeadline?.getTime() ?? now))} ago — escalate immediately.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-900 p-4 text-center">
                <p className="font-mono text-3xl font-bold tabular-nums tracking-wider text-white">
                  {countdown.days > 0 ? `${countdown.days}d ` : ''}
                  {countdown.text}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-slate-400">
                  until {resolutionDeadline?.toLocaleString()}
                </p>
              </div>
            )}
            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Response due</span>
                <span className="font-medium text-slate-700">
                  {responseDeadline ? responseDeadline.toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolution due</span>
                <span className="font-medium text-slate-700">
                  {resolutionDeadline?.toLocaleString() ?? '—'}
                </span>
              </div>
            </div>
          </section>

          {/* Metadata */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Details
            </h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Assigned Agent
                </dt>
                <dd>
                  {isStaff ? (
                    <select
                      value={ticket.assignedAgentId ?? ''}
                      onChange={(e) => {
                        if (e.target.value) patch('assign', { agentId: e.target.value }, 'Assignment failed.');
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="" disabled>
                        {ticket.assignedAgentName ?? 'Select agent…'}
                      </option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-800">
                      {ticket.assignedAgentName ?? 'Unassigned'}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Priority
                </dt>
                <dd>
                  {isStaff ? (
                    <select
                      value={ticket.priority}
                      onChange={(e) => patch('priority', { priority: e.target.value }, 'Priority change failed.')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <PriorityPill priority={ticket.priority} />
                  )}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reporter
                </dt>
                <dd className="flex items-center gap-2">
                  <Avatar name={ticket.createdByName} />
                  <span className="text-slate-800">{ticket.createdByName}</span>
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tenant
                </dt>
                <dd className="flex items-center gap-1.5 text-slate-800">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" /> Acme Corporation
                </dd>
              </div>
              {ticket.resolvedAtUtc && (
                <div>
                  <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resolved At
                  </dt>
                  <dd className="text-slate-800">{parseUtc(ticket.resolvedAtUtc)?.toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
