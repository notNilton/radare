# radare

Industrial data reconciliation platform. Uses Lagrange Multipliers and chi-squared ($\chi^2$) statistical validation to enforce mass and energy balance integrity across process nodes.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Go — `net/http` + GORM + `gonum` |
| Web | React 18 + TanStack Router/Query + React Flow + Vite |
| Database | PostgreSQL (coredb) + PostgreSQL (logdb) + Redis |
| Migrations | Custom Go migrate tool (`database/cmd/migrate`) |
| Infra | Docker Compose + Caddy + Cloudflare |
| CI/CD | Gitea Actions (act_runner) |

---

## Monorepo Structure

```
apps/
  backend/          → Go API + reconciliation engine (port 8080)
  webapp/           → React SPA (port 5173 dev / 80 prod)
database/
  coredb_migrations/  → SQL migrations for core database
  logdb_migrations/   → SQL migrations for audit log database
  coredb_seeds/       → bootstrap seed data
  cmd/migrate/        → standalone migration binary
client-api/         → Bruno collection for contract testing
.gitea/
  workflows/
    dev.yaml        → CI on development branch (build + compose validation)
    main.yaml       → CI + image build + push + version bump on main
```

---

## Local Development

### Prerequisites

- Go 1.25+
- Node.js 20+
- Docker or Podman

### Quickstart

```bash
make db-bootstrap   # start DBs, run all migrations and seeds
make backend        # start backend with hot reload (air)
make webapp         # start frontend dev server
```

Or all at once:

```bash
make dev
```

### Environment Variables (backend)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=radare
DB_PASSWORD=radare
DB_NAME=radare
DB_SSLMODE=disable
JWT_SECRET=your-secret-key
PORT=8080
REDIS_URL=redis://localhost:6379/0
LOG_DB_URL=postgresql://radare:radare@localhost:5433/radare_logs?sslmode=disable
```

### Migrations

```bash
make migrate        # run coredb migrations
make seed           # run coredb seeds
make migrate-log    # run logdb migrations
make seed-log       # run logdb seeds
make nuke-and-pave  # reset local DB volumes and reapply everything
```

To create a new migration, add two files under `database/coredb_migrations/`:

```
018_description.up.sql
018_description.down.sql
```

---

## Reconciliation Model

A reconciliation operates on a directed process graph. Each node has measured values; the engine adjusts them to satisfy balance constraints while minimizing the weighted sum of squared deviations.

| Concept | Description |
|---------|-------------|
| Node | Process unit with measured input/output streams |
| Tag | Instrument measurement attached to a stream |
| Reconciliation | One execution of the balance solver over a workspace snapshot |
| Workspace | Named configuration of nodes, tags, and constraints |
| Tenant | Isolated organizational scope |

Validation uses the $\chi^2$ test: if the reconciled residuals exceed the critical value at the configured significance level, the result is flagged as statistically inconsistent.

---

## Production Infrastructure

### Overview

```
Internet
   │
   ▼
Cloudflare  ←  *.nilbyte.com.br DNS
   │  Tunnel (cloudflared) — HTTP/HTTPS only
   │  TLS terminates at Cloudflare
   ▼
VPS niflheim (Ubuntu)
   │
   ▼
Caddy (container, http:// only)
   ├── gitea.nilbyte.com.br         → gitea:3000
   ├── radare.nilbyte.com.br        → radare_webapp_prod:80
   └── api-radare.nilbyte.com.br    → radare_backend_prod:8080
```

### Docker Networks

| Network | Purpose |
|---------|---------|
| `nilbyte-git` | Gitea + act_runner (CI) |
| `radare-internal` | coredb + logdb + redis + backend + webapp |

### SSH Access (port 2222)

```bash
# From Tailscale
git clone ssh://git@niflhel:2222/nilByte/radare.git

# ~/.ssh/config
Host gitea
  HostName niflhel
  Port 2222
  User git
  IdentityFile ~/.ssh/id_ed25519
```

---

## CI/CD

### `dev.yaml` — development branch

Runs on every push to `development`. Validates without publishing images.

| Job | What it does |
|-----|-------------|
| `detect-changes` | Identifies which areas changed relative to `main` |
| `build-backend` | `go build ./...` on backend and database modules |
| `build-webapp` | `docker build` of the webapp image |
| `validate-compose` | `docker compose config` on both compose files |

### `main.yaml` — `main` branch

Runs on every push to `main`. Each job detects changes independently, builds and pushes Docker images, then bumps the patch version.

| Job | What it does |
|-----|-------------|
| `build-backend` | Builds image, pushes `backend:latest` + `backend:vX.Y.Z`, bumps `apps/backend/VERSION` |
| `build-frontend` | Builds image with `VITE_API_URL` baked in, pushes `frontend:latest` + `frontend:vX.Y.Z`, bumps `apps/webapp/package.json` |

Version bump commits are tagged `[skip ci]` to avoid infinite loops. Both jobs run in parallel and are independent — each only triggers if its own area changed.

---

## Conventions

### Commits

Conventional Commits:

```
feat(backend): add chi-squared validation endpoint
fix(webapp): correct node connection rendering
chore(ci): update Go version in pipeline
```

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production — CI bumps version and publishes images |
| `development` | Integration — CI validates build and compose |
