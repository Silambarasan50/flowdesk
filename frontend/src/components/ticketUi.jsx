import { Clock, Flame } from 'lucide-react';
import { formatRemaining, parseUtc } from '../utils/dates';

const PRIORITY_STYLES = {
  P1_Critical: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
  P2_High: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
  P3_Medium: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
  P4_Low: 'bg-slate-200 text-slate-600 ring-1 ring-inset ring-slate-300',
};

const STATUS_STYLES = {
  New: 'bg-sky-100 text-sky-700',
  Assigned: 'bg-indigo-100 text-indigo-700',
  InProgress: 'bg-amber-100 text-amber-700',
  PendingCustomer: 'bg-purple-100 text-purple-700',
  Resolved: 'bg-emerald-100 text-emerald-700',
  Closed: 'bg-slate-200 text-slate-600',
};

export const STATUS_LABELS = {
  New: 'New',
  Assigned: 'Assigned',
  InProgress: 'In Progress',
  PendingCustomer: 'Pending Customer',
  Resolved: 'Resolved',
  Closed: 'Closed',
};

export function PriorityPill({ priority }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.P4_Low}`}>
      {(priority ?? '').replace('_', ' ')}
    </span>
  );
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.Closed}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function SlaBadge({ ticket, now }) {
  if (ticket.isBreached) {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
        <Flame className="h-3 w-3" /> SLA BREACHED
      </span>
    );
  }

  const deadline = parseUtc(ticket.slaResolutionDeadlineUtc);
  const remaining = deadline ? deadline.getTime() - now : 0;

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> Overdue
      </span>
    );
  }

  const urgent = remaining < 2 * 60 * 60 * 1000;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
      <Clock className="h-3 w-3" /> Resolve in {formatRemaining(remaining)}
    </span>
  );
}

export function Avatar({ name }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white" title={name}>
      {initials}
    </span>
  );
}
