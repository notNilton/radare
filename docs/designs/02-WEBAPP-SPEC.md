# 02 - Especificação de Webapp e Design System

The Radare web application is a React + TypeScript SPA built with Vite. It features a technical "industrial" design language, using CSS variables for theme management and TanStack Router for type-safe routing.

## Technology Stack

- **Framework**: React 18
- **Routing**: TanStack Router
- **State Management**: Zustand (Auth, Theme)
- **Data Fetching**: TanStack Query (React Query)
- **Graph Engine**: React Flow
- **Icons**: Lucide React
- **Styling**: TailwindCSS + Custom CSS Variables (Industrial Matte Theme)

## Core Structure

- `apps/webapp/src/modules/`: Domain-specific components and logic (dashboard, history, reconciliation, tags, profile, auth).
- `apps/webapp/src/routes/`: TanStack Router configuration and page components.
- `apps/webapp/src/components/`: Shared UI building blocks (AboutModal, ErrorBoundary, Common components).
- `apps/webapp/src/lib/`: API clients, storage utilities, and global query keys.
- `apps/webapp/src/store/`: Global state (auth token, theme preference).
- `apps/webapp/src/styles.css`: Central theme definition and design tokens.

## Routing Layout

The application follows a structured navigation hierarchy:

- `/login`: User authentication.
- `/app`: Main layout (AppShell) with navigation sidebar and header.
    - `/app/dashboard`: Performance overview and live process monitoring.
    - `/app/history`: Audit log and reconciliation search.
    - `/app/tags`: CRUD for process instrument tags.
    - `/app/profile`: Personal settings and security.
    - `/app/index`: Main reconciliation canvas (React Flow).

## Design Philosophy

The system uses an **"Industrial Matte"** design language:
- **Matte Surface**: Dark slate backgrounds (`#020617`, `#0f172a`) with warm off-white light theme options to reduce eye strain.
- **Accents**: Cyan (`#22d3ee`) for primary actions and industrial blue/green for status indicators.
- **Typography**: Monospaced fonts for technical data (IBM Plex Mono, JetBrains Mono).
- **Interactivity**: Real-time feedback via WebSockets for live process values.

## Development
- **Run**: `npm run dev` in `apps/webapp`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm test` (Vitest)
