# Webapp Documentation for the Data Reconciliation Project

This document describes the frontend application that lives in `apps/webapp`. The webapp is a React + TypeScript SPA built with Vite and deployed independently from the backend.

## System Overview

The webapp is responsible for authentication flows, interactive reconciliation screens, dashboards, history views and profile management. It consumes the backend exclusively over HTTP and WebSocket APIs.

## Architectural Design

-   `src/components/`: shared UI building blocks.
-   `src/pages/`: screen-level views such as dashboard, login, history and profile.
-   `src/api/`: centralized HTTP clients for backend communication.
-   `src/hooks/`: data-fetching and stateful client hooks.
-   `src/store/`: client-side auth state management.
-   `src/Main.tsx`: application bootstrap.
-   `vite.config.ts`: Vite and Vitest configuration.

## Setup and Execution

### Prerequisites

-   Node.js 18 or later

### Steps

1.  **Install dependencies:**

    ```bash
    cd radare-datarecon/apps/webapp
    npm install
    ```

2.  **Run the dev server:**

    ```bash
    npm run dev
    ```

3.  **Build for production:**

    ```bash
    npm run build
    ```

## Running Tests

To run the webapp test suite, navigate to the `apps/webapp` directory and execute:

```bash
npm test
```
