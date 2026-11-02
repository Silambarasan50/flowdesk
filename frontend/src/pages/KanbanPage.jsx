import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Loader2, RefreshCw, Search, UserX } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Avatar, PriorityPill, SlaBadge } from '../components/ticketUi';

const COLUMNS = [
  { status: 'New', label: 'New', accent: 'bg-sky-500' },
  { status: 'Assigned', label: 'Assigned', accent: 'bg-indigo-500' },
  { status: 'InProgress', label: 'In Progress', accent: 'bg-amber-500' },
  { status: 'Resolved', label: 'Resolved', accent: 'bg-emerald-500' },
];

const EMPTY_COLUMNS = { New: [], Assigned: [], InProgress: [], Resolved: [] };

function groupByStatus(tickets) {
  const grouped = { ...EMPTY_COLUMNS, New: [], Assigned: [], InProgress: [], Resolved: [] };
  for (const ticket of tickets) {
    if (grouped[ticket.status]) {
      grouped[ticket.status].push(ticket);
    }
  }
  return grouped;
}

function moveTicket(columns, ticketId, toStatus, toIndex) {
  const next = {};
  let moved = null;
  for (const key of Object.keys(columns)) {
    next[key] = columns[key].filter((t) => {
      if (t.id === ticketId) {
        moved = { ...t, status: toStatus };
        return false;
      }
      return true;
    });
  }
  if (moved) {
    next[toStatus].splice(Math.min(toIndex, next[toStatus].length), 0, moved);
  }
  return next;
}

export default function KanbanPage() {
  const toast = useToast();
  const [columns, setColumns] = useState(EMPTY_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(Date.now());

  const loadBoard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/tickets', { params: { pageSize: 100 } });
      setColumns(groupByStatus(data.items));
    } catch {
      if (!silent) toast.push('Failed to load tickets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBoard();
    const ticker = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(ticker);
  }, [loadBoard]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const ticketId = Number(draggableId);
    const newStatus = destination.droppableId;
    const previous = columns;

    if (source.droppableId !== destination.droppableId) {
      setColumns((current) => moveTicket(current, ticketId, newStatus, destination.index));

      try {
        await api.patch(`/tickets/${ticketId}/status`, { newStatus });
        loadBoard(true);
      } catch (error) {
        setColumns(previous);
        const message = error.response?.data?.message;
        toast.push(
          message
            ? `Can't move ticket: ${message}`
            : "Can't move ticket — that status transition isn't allowed.",
          'error'
        );
      }
    } else {
      setColumns((current) => moveTicket(current, ticketId, newStatus, destination.index));
    }
  };

  const term = search.trim().toLowerCase();
  const matches = (ticket) =>
    !term ||
    ticket.title.toLowerCase().includes(term) ||
    ticket.ticketNumber.toLowerCase().includes(term);

  const total = Object.values(columns).reduce((sum, list) => sum + list.length, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ticket Workspace</h1>
          <p className="text-sm text-slate-500">{total} active tickets · drag cards between columns</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets…"
              className="w-56 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={() => loadBoard()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading board…
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => {
              const tickets = columns[column.status].filter(matches);
              return (
                <div key={column.status} className="flex min-h-[24rem] flex-col rounded-xl bg-slate-200/70">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <span className={`h-2 w-2 rounded-full ${column.accent}`} />
                    <h2 className="text-sm font-bold text-slate-700">{column.label}</h2>
                    <span className="ml-auto rounded-full bg-slate-300/70 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {tickets.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 space-y-2.5 rounded-b-xl p-2.5 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-100/60' : ''
                        }`}
                      >
                        {tickets.map((ticket, index) => (
                          <Draggable key={ticket.id} draggableId={String(ticket.id)} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`rounded-lg border bg-white p-3 shadow-card transition-shadow ${
                                  dragSnapshot.isDragging
                                    ? 'rotate-1 border-blue-300 shadow-lg'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold tracking-wide text-slate-400">
                                    {ticket.ticketNumber}
                                  </span>
                                  <PriorityPill priority={ticket.priority} />
                                </div>
                                <p className="mb-2.5 line-clamp-2 text-[13px] font-medium leading-snug text-slate-800">
                                  {ticket.title}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                  <SlaBadge ticket={ticket} now={now} />
                                  {ticket.assignedAgentName ? (
                                    <span className="flex items-center gap-1.5" title={ticket.assignedAgentName}>
                                      <Avatar name={ticket.assignedAgentName} />
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                      <UserX className="h-3.5 w-3.5" /> Unassigned
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {tickets.length === 0 && (
                          <p className="py-8 text-center text-xs text-slate-400">No tickets</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
