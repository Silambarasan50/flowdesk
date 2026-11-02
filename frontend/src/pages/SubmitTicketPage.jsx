import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const PRIORITIES = [
  { value: 'P1_Critical', label: 'P1 — Critical (system down)' },
  { value: 'P2_High', label: 'P2 — High (major impact)' },
  { value: 'P3_Medium', label: 'P3 — Medium (normal issue)' },
  { value: 'P4_Low', label: 'P4 — Low (request / question)' },
];

export default function SubmitTicketPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('P3_Medium');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.push('Title and description are required.', 'error');
      return;
    }
    setBusy(true);
    try {
      await api.post('/tickets', { title: title.trim(), description: description.trim(), priority });
      toast.push('Ticket submitted — our team will pick it up shortly.', 'success');
      navigate('/portal/tickets');
    } catch (error) {
      toast.push(error.response?.data?.message ?? 'Failed to submit ticket.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Create Ticket</h1>
      <p className="mb-5 text-sm text-slate-500">Describe the issue and we'll route it to the right team.</p>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Short summary of the issue"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Steps to reproduce, error messages, business impact…"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="mb-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit ticket
        </button>
      </form>
    </div>
  );
}
