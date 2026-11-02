import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  KanbanSquare,
  LogOut,
  PlusCircle,
  Ticket,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ticketUi';

const STAFF_NAV = [
  { to: '/workspace/kanban', label: 'Kanban Board', icon: KanbanSquare },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const CUSTOMER_NAV = [
  { to: '/portal/tickets', label: 'My Tickets', icon: Ticket },
  { to: '/portal/submit', label: 'Create Ticket', icon: PlusCircle },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'Customer' ? CUSTOMER_NAV : STAFF_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-base font-bold leading-tight text-white">FlowDesk</p>
            <p className="text-[11px] text-slate-400">Service Desk</p>
          </div>
        </div>

        <div className="mx-4 mb-5 flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
          <Building2 className="h-4 w-4 shrink-0 text-blue-400" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">Acme Corporation</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Tenant</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {user?.role === 'Customer' ? 'Portal' : 'Workspace'}
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-3">
          <Avatar name={user?.fullName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
            <p className="text-[11px] text-blue-400">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
