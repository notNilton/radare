# Backend Architecture & API Specification

The Radare backend is a high-performance REST API built in Go. It handles data reconciliation using the Lagrange Multipliers method, manages user authentication, and provides real-time updates via WebSockets.

## Core Structure

- `apps/backend/cmd/api/main.go`: Entry point, server initialization, and routing.
- `apps/backend/internal/handlers/`: Request handlers for all domain logic.
- `apps/backend/internal/reconciliation/`: Core mathematical engine for data adjustment.
- `apps/backend/internal/middleware/`: Auth (JWT), logging, and error handling.
- `apps/backend/internal/models/`: GORM models and DTOs.
- `apps/backend/internal/config/`: Environment-based configuration.

## API Endpoints

All endpoints (except login/register/health) require a `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/register`: Create a new user account.
- `POST /api/login`: Authenticate and receive a JWT.
- `POST /api/refresh`: Refresh the current session.

### Profile & Settings
- `GET /api/profile`: Retrieve the current user's profile.
- `PUT /api/profile/update`: Update profile information (name, email, etc.).
- `POST /api/profile/password`: Change the user's password.

### Data Reconciliation
- `POST /api/reconcile`: Perform data reconciliation.
    - **Input**: Measurements, tolerances, and linear constraints (matrix).
    - **Output**: Reconciled values, corrections, and consistency status.
- `GET /api/reconcile/history`: List previous reconciliations with pagination and filters.
- `GET /api/reconcile/export`: Export reconciliation history as CSV.

### Tags & Dashboard
- `GET /api/tags`: List all instrument tags.
- `POST /api/tags/create`: Create a new tag.
- `DELETE /api/tags/delete?id=<id>`: Delete a tag.
- `GET /api/dashboard/stats`: Retrieve summary statistics for the dashboard.
- `GET /api/current-values`: Sample endpoint for live process values.

### System & Real-time
- `GET /api/ws`: WebSocket endpoint for real-time dashboard updates.
- `GET /healthz`: Health check endpoint for infrastructure monitoring.
- `GET /swagger/`: Interactive API documentation (Swagger UI).

## Mathematical Engine
The reconciliation logic uses Lagrange Multipliers to minimize the sum of weighted squared adjustments:
$$J = \sum_{i=1}^n \frac{(y_i - x_i)^2}{\sigma_i^2}$$
Subject to linear constraints: $Ax = 0$.

## Development
- **Run**: `go run ./apps/backend/cmd/api`
- **Test**: `go test ./apps/backend/...`
- **Swagger**: `swag init -g apps/backend/cmd/api/main.go -o apps/backend/docs`
