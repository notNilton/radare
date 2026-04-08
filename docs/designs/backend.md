# Backend Documentation for the Data Reconciliation Project

This document provides a comprehensive guide to the backend system for the data reconciliation project. The backend is a high-performance server built in Go, providing a robust REST API for data reconciliation using the method of Lagrange multipliers.

## System Overview

The primary objective of this backend is to receive a set of measurements, their associated tolerances, and a series of linear constraints. It then adjusts the measurements in a way that satisfies the constraints while minimizing the overall adjustment, ensuring data consistency and accuracy.

## Architectural Design

The backend is structured to separate concerns, promoting maintainability and scalability.

-   `main.go`: This is the application's entry point. It is responsible for initializing the HTTP server, configuring routing, and managing graceful shutdowns.
-   `internal/`: This directory houses the core business logic of the application.
    -   `handlers/`: Contains the HTTP request handlers for the API endpoints.
    -   `reconciliation/`: Implements the core logic for the data reconciliation process.
    -   `middleware/`: Provides middleware for logging and error handling.
-   `go.mod`, `go.sum`: These files manage the project's dependencies.
-   `CHANGELOG.md`: A log of changes to the backend.

## API Endpoints

### 1. `POST /api/reconcile`

This endpoint performs the data reconciliation.

**Request Body (JSON):**

```json
{
  "measurements": [10.2, 20.5, 29.8],
  "tolerances": [0.01, 0.015, 0.02],
  "constraints": [
    [1, 1, -1]
  ]
}
```

-   `measurements`: An array of floating-point numbers representing the measured values.
-   `tolerances`: An array of floating-point numbers representing the percentage tolerances for each measurement.
-   `constraints`: A matrix (array of arrays) representing the linear constraint equations that the measurements must satisfy.

**Success Response (JSON):**

```json
{
  "reconciled": [10.1, 20.4, 30.5]
}
```

-   `reconciled`: An array of floating-point numbers with the adjusted values.

### 2. `GET /api/current-values`

This endpoint returns example values that are periodically updated on the server.

**Success Response (JSON):**

```json
{
  "value1": 100,
  "value2": 50
}
```

### 3. `GET /healthz`

This endpoint is used to check the health of the server.

**Success Response (JSON):**

```json
{
  "status": "ok"
}
```

## Setup and Execution

### Prerequisites

-   Go 1.18 or later

### Steps

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/radare-datarecon.git
    cd radare-datarecon/backend
    ```

2.  **Install dependencies:**

    ```bash
    go mod tidy
    ```

3.  **Run the server:**

    ```bash
    go run main.go
    ```

    The server will start on port `8080` by default. You can set the `PORT` environment variable to use a different port.

## Running Tests

To run the backend's unit tests, navigate to the `backend` directory and execute the following command:

```bash
go test ./...
```