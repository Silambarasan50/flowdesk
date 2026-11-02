# FlowDesk — Enterprise Multi-Tenant Service Ticket & SLA Workflow Engine

![.NET 10](https://img.shields.io/badge/.NET%2010-512BD4?logo=dotnet&logoColor=white)
![React 19](https://img.shields.io/badge/React%2019-61DAFB?logo=react&logoColor=black)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?logo=microsoftsqlserver&logoColor=white)
![EF Core](https://img.shields.io/badge/EF%20Core-512BD4?logo=dotnet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

FlowDesk is an enterprise-grade, multi-tenant service ticket management platform with an
automated SLA workflow engine. It combines a clean-layered **ASP.NET Core 10 Web API**,
**SQL Server + EF Core** persistence with global query-filter tenant isolation, a
deterministic ticket **state machine**, a real-time **SLA breach monitor**, and a
**React 19** agent workspace featuring a drag-and-drop Kanban board and a high-density
ticket console.

---

## Core Features

- **Multi-tenant architecture** — logical isolation enforced by EF Core global query
  filters; tenant resolved per-request from the `tenant_id` JWT claim (with
  `X-Tenant-ID` header fallback).
- **JWT authentication & RBAC** — native Bearer tokens carrying `sub`, `email`, `role`,
  `tenant_id`, `name` claims; Admin / Agent / Customer role-based authorization policies.
- **Deterministic ticket state machine** — strict, server-enforced transition table;
  illegal jumps are rejected with `422` and every change is written to an audit trail.
- **SLA engine + background worker** — per-tenant SLA policies drive response/resolution
  deadlines; `SlaMonitorWorker` sweeps every 30s and flags breached tickets.
- **Drag-and-drop Kanban workspace** — `@hello-pangea/dnd` columns with optimistic
  updates, automatic rollback + toast on rejected transitions, live SLA countdown badges.
- **High-density ticket console** — dual-channel activity stream (public replies vs.
  confidential staff-internal notes), real-time SLA countdown panel, metadata sidebar,
  timestamped audit stepper.
- **Customer intake portal** — self-service ticket submission and "My Tickets" view
  scoped to the caller.
- **Automated database lifecycle** — `MigrateAsync` on startup plus idempotent seeding
  of tenant, users, SLA policies and demo tickets.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                       │
│   React 19 SPA (Vite)         Axios + JWT interceptor + AuthContext      │
│   ┌──────────────┬────────────────────┬───────────────────────────────┐  │
│   │ Login /      │ Agent Workspace:   │ Customer Portal:              │  │
│   │ personas     │ Kanban · Console   │ Submit · My Tickets           │  │
│   └──────┬───────┴─────────┬──────────┴───────────────┬───────────────┘  │
└──────────┼─────────────────┼──────────────────────────┼──────────────────┘
           │  HTTP / JSON    │ Bearer <jwt>              │
           ▼                 ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    FlowDesk.Api  (ASP.NET Core 10)                       │
│                                                                         │
│  Controllers        Auth · Tickets · Comments · Analytics · Users       │
│      │                                                                  │
│  Services           AuthService · TicketStateMachine · SlaEngine        │
│      │              CurrentTenantService (claim → header → default)     │
│      │                                                                  │
│  Workers            SlaMonitorWorker (BackgroundService, 30s sweep)     │
│      │                                                                  │
│  Data               AppDbContext — EF Core + GLOBAL QUERY FILTERS       │
│                     Ticket / SlaPolicy / TicketComment / TicketAuditLog │
└───────────────────────────────┬─────────────────────────────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │   Microsoft SQL Server │
                    │  Tenants · Users ·     │
                    │  Tickets · SLA · Logs  │
                    └────────────────────────┘
```

### Logical Multi-Tenancy

Every tenant-scoped entity carries a `TenantId`. `CurrentTenantService` resolves the
active tenant per request (`tenant_id` claim → `X-Tenant-ID` header → seeded Acme
tenant for unauthenticated seeding/dev), and `AppDbContext` applies
`.HasQueryFilter(x => x.TenantId == currentTenantId)` so **cross-tenant data can never
leak through ordinary queries**. The background worker explicitly uses
`IgnoreQueryFilters()` so a single sweep serves all tenants.

### Ticket State Machine

```text
   ┌─────┐      ┌──────────┐      ┌────────────┐      ┌──────────┐      ┌────────┐
   │ New │ ───▶ │ Assigned │ ───▶ │ InProgress │ ───▶ │ Resolved │ ───▶ │ Closed │
   └──┬──┘      └────┬─────┘      └─────┬──────┘      └────┬─────┘      └───▲────┘
      │              │                  │    ▲             │               │
      │              │                  ▼    │             │ reopen        │
      │              │             ┌────────────────┐      │               │
      │              └────────────▶│PendingCustomer │──────┘               │
      │                            └───────┬────────┘                      │
      └────────────────────────────────────┴───────────────────────────────┘
                       any active state may be Closed
```

Legal transitions (enforced server-side, `422` otherwise):

| From            | Allowed next states                    |
|-----------------|----------------------------------------|
| New             | Assigned, Closed                       |
| Assigned        | InProgress, PendingCustomer, Closed    |
| InProgress      | PendingCustomer, Resolved, Closed      |
| PendingCustomer | InProgress, Resolved, Closed           |
| Resolved        | InProgress *(reopen)*, Closed          |
| Closed          | — *(terminal)*                         |

Every status change appends a `TicketAuditLog` row (`OldStatus`, `NewStatus`,
`ChangedByUserId`, `Note`, `TimestampUtc`) — rendered as the audit stepper in the UI.

---

## Tech Stack

| Layer     | Technology                                                        |
|-----------|-------------------------------------------------------------------|
| Backend   | .NET 10, ASP.NET Core Web API, EF Core 10, JWT Bearer, BCrypt.Net   |
| Frontend  | React 19, Vite 6, Tailwind CSS 3, react-router-dom, axios,          |
|           | @hello-pangea/dnd, lucide-react                                    |
| Data      | Microsoft SQL Server 2022 (EF Core Code-First migrations)          |
| DevOps    | Docker, docker-compose, nginx (SPA + `/api` reverse proxy)         |

## Repository Layout

```text
flowdesk/
├── backend/                  # FlowDesk.Api — ASP.NET Core 10 Web API
│   ├── Controllers/          # Auth, Tickets, Comments, Analytics, Users
│   ├── Domain/               # Entities + Enums (Priority, Status, Role)
│   ├── Data/                 # AppDbContext, DbSeeder, design-time factory
│   ├── Services/             # AuthService, StateMachine, SlaEngine, Tenant
│   ├── Workers/              # SlaMonitorWorker (30s breach sweep)
│   ├── Migrations/           # EF Core code-first migrations
│   └── Dockerfile
├── frontend/                 # React 19 SPA (JavaScript)
│   ├── src/api/              # axios instance + interceptors
│   ├── src/context/          # AuthContext, ToastContext
│   ├── src/layouts/          # AppLayout (sidebar shell)
│   ├── src/pages/            # Login, Kanban, TicketDetail, Portal, Analytics
│   ├── Dockerfile + nginx.conf
├── docker-compose.yml
└── README.md
```

---

## Running Locally

### Option A — One command (Docker)

```bash
docker compose up --build
```

- Frontend → http://localhost:5173 (nginx serving the Vite build, `/api` proxied)
- Backend  → http://localhost:5000
- SQL Server → localhost:1433 (`sa` / `FlowDesk_Dev#2026!`, override via `SA_PASSWORD`)

The API applies EF migrations and seeds demo data automatically on first boot.

### Option B — Local dev

**Prerequisites:** .NET 10 SDK, Node 20+, a SQL Server instance
(LocalDB `MSSQLLocalDB`, SQL Express, or a container).

```bash
# 1) Backend — auto-migrates + seeds on startup
cd backend
dotnet run                    # http://localhost:5000 (launch profile)

# 2) Frontend — dev server proxies /api → http://localhost:5000
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

> Using LocalDB instead of a default instance? Override the connection string:
> ```powershell
> $env:ConnectionStrings__DefaultConnection='Server=(localdb)\mssqllocaldb;Database=FlowDeskDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true'
> dotnet run
> ```

## Seed Credentials

| Role     | Email               | Password      | Landing view      |
|----------|---------------------|---------------|-------------------|
| Admin    | `admin@acme.com`    | `Password123!`| Kanban workspace  |
| Agent    | `agent@acme.com`    | `Password123!`| Kanban workspace  |
| Customer | `customer@acme.com` | `Password123!`| My Tickets portal |

The login page includes **1-click demo buttons** for each persona.
Seeded tenant: **Acme Corporation** (`11111111-1111-1111-1111-111111111111`).

## API Surface

| Method | Endpoint                        | Notes                                        |
|--------|---------------------------------|----------------------------------------------|
| POST   | `/api/auth/login`               | JWT issuing (sub/email/role/tenant_id/name)  |
| GET    | `/api/auth/me`                  | Current claims context                       |
| GET    | `/api/tickets`                  | Paged; `status`, `priority`, `search`        |
| GET    | `/api/tickets/{id}`             | Detail + comments + audit + SLA remainders   |
| POST   | `/api/tickets`                  | Auto SLA deadlines + `TICK-####` numbering   |
| PATCH  | `/api/tickets/{id}/status`      | State-machine enforced; audit logged         |
| PATCH  | `/api/tickets/{id}/assign`      | Agent/Admin only                             |
| PATCH  | `/api/tickets/{id}/priority`    | Agent/Admin; recalculates SLA deadlines      |
| GET/POST | `/api/tickets/{id}/comments`  | `isInternal` restricted to staff             |
| GET    | `/api/users/agents`             | Agent/Admin                                  |
| GET    | `/api/analytics/summary`        | Total / Open / InProgress / Breached / Resolved |
| GET    | `/health`                       | Liveness                                     |

All `/api/*` endpoints except `/auth/login` require `Authorization: Bearer <jwt>`.
Customers only ever see tickets where `CreatedByUserId == self`.

## SLA Policies (seeded for Acme)

| Priority      | Response | Resolution |
|---------------|----------|------------|
| P1 — Critical | 15 min   | 2 h        |
| P2 — High     | 1 h      | 8 h        |
| P3 — Medium   | 4 h      | 24 h       |
| P4 — Low      | 8 h      | 72 h       |

`SlaMonitorWorker` runs every 30 s across all tenants: tickets past
`SlaResolutionDeadlineUtc` (and not Resolved/Closed) are marked `IsBreached` and an
audit entry is written — the UI then shows the pulsing red **SLA BREACHED** badge.
