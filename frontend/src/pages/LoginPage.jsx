import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogIn, ShieldCheck, User, Wrench, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../components/ProtectedRoute';

const PERSONAS = [
  { label: 'Login as Admin', email: 'admin@acme.com', icon: ShieldCheck, style: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Login as Agent', email: 'agent@acme.com', icon: Wrench, style: 'bg-indigo-600 hover:bg-indigo-700' },
  { label: 'Login as Customer', email: 'customer@acme.com', icon: User, style: 'bg-slate-600 hover:bg-slate-700' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const doLogin = async (loginEmail, loginPassword, busyKey) => {
    setError('');
    setBusy(busyKey);
    try {
      const user = await login(loginEmail, loginPassword);
      navigate(homeFor(user), { replace: true });
    } catch {
      setError('Invalid email or password.');
    } finally {
      setBusy('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    doLogin(email, password, 'form');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Zap className="h-7 w-7 text-white" />
          </span>
          <h1 className="mt-3 text-2xl font-bold text-white">FlowDesk</h1>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Building2 className="h-3.5 w-3.5" /> Acme Corporation service desk
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mb-5 text-sm text-slate-500">Use your workspace credentials</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@acme.com"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={Boolean(busy)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy === 'form' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              1-click demo
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-2">
            {PERSONAS.map((persona) => (
              <button
                key={persona.email}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => doLogin(persona.email, 'Password123!', persona.email)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${persona.style}`}
              >
                {busy === persona.email ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <persona.icon className="h-4 w-4" />
                )}
                {persona.label}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
