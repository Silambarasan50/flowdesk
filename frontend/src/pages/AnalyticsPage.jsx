import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, Flame, FolderOpen, Loader2, Ticket } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const CARDS = [
  { key: 'total', label: 'Total Tickets', icon: Ticket, style: 'bg-slate-700' },
  { key: 'open', label: 'Open', icon: FolderOpen, style: 'bg-blue-600' },
  { key: 'inProgress', label: 'In Progress', icon: Activity, style: 'bg-amber-500' },
  { key: 'breached', label: 'SLA Breached', icon: Flame, style: 'bg-red-600' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, style: 'bg-emerald-600' },
];

export default function AnalyticsPage() {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/analytics/summary');
      setSummary(data);
    } catch {
      toast.push('Failed to load analytics.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics…
      </div>
    );
  }

  const openRate = summary?.total ? Math.round((summary.open / summary.total) * 100) : 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Tenant-wide ticket health at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {CARDS.map((card) => (
          <div key={card.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${card.style}`}>
              <card.icon className="h-5 w-5 text-white" />
            </span>
            <p className="mt-3 text-3xl font-bold text-slate-900">{summary?.[card.key] ?? 0}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Open ticket share</span>
          <span className="font-bold text-slate-900">{openRate}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${openRate}%` }} />
        </div>
      </div>
    </div>
  );
}
