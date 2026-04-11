# 03 - Especificação de API Client (Bruno)

The `client-api` directory contains a [Bruno](https://www.usebruno.com/) collection for interacting with the Radare backend. This collection is essential for testing endpoints, debugging, and understanding the API contract.

## Prerequisites

1.  **Install Bruno**: Download from [usebruno.com](https://www.usebruno.com/downloads).
2.  **Open Collection**: In Bruno, click "Open Collection" and select the `client-api` folder.
3.  **Environment**: Use the `main.bru` environment to configure the `base_url` (default: `http://localhost:8080/api`).

## Authentication Flow

Most endpoints require a JWT in the `Authorization` header.

1.  **Register/Login**: Use the `auth/` folder to create an account or log in.
2.  **Token Management**: Upon login, copy the `token` from the response.
3.  **Auth Variable**: Bruno is configured to use a collection-level variable for the token. Ensure the `token` variable in your environment is updated after login.

## Endpoint Groups

### 1. Health & System
- `GET /healthz`: Verify server status.
- `GET /api/current-values`: Retrieve sample live process data.
- `GET /api/dashboard/stats`: Get operational metrics for the dashboard.

### 2. Authentication (`auth/`)
- `POST /api/register`: New operator signup.
- `POST /api/login`: Session creation.
- `POST /api/refresh`: JWT renewal.

### 3. Profile
- `GET /api/profile`: User data retrieval.
- `PUT /api/profile/update`: Profile modification.
- `POST /api/profile/password`: Security updates.

### 4. Reconciliation (`reconciliation/`)
- `POST /api/reconcile`: The core mathematical engine. Send measurements and constraints.
- `GET /api/reconcile/history`: Query previous runs with pagination.
- `GET /api/reconcile/export`: Download history as CSV.

### 5. Tags
- `GET /api/tags`: List configured instruments.
- `POST /api/tags/create`: Add new instrument.
- `DELETE /api/tags/delete?id=<id>`: Remove instrument.

## Development Note
The collection files (`.bru`) are plain text and should be committed to the repository whenever a new endpoint is added or modified in the backend.
