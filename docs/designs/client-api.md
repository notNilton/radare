# API Client Documentation (Bruno Collection)

This directory contains a [Bruno](https://www.usebruno.com/) collection for interacting with the backend API of the RADARE data reconciliation system. Bruno is an open-source, GUI-based API client that allows you to make requests to the backend, view responses, and test the API's functionality in a developer-friendly environment.

## What is Bruno?

Bruno is a fast and lightweight API client that stores collections as plain text files in your filesystem. This makes it easy to version control your API collections and collaborate with your team.

## Getting Started

To use this collection, you will need to have the Bruno application installed on your machine.

1.  **Install Bruno**: Download and install the latest version of Bruno from the [official website](https://www.usebruno.com/downloads).
2.  **Open the Collection**:
    *   Launch the Bruno application.
    *   Click on "Open Collection".
    *   Navigate to the `apiclient` directory within this project and select it.
3.  **Start Making Requests**: Once the collection is loaded, you will see a list of available API requests in the left-hand sidebar.

## Requests in this Collection

This collection includes the following pre-configured requests, corresponding to the backend's API endpoints:

### 1. `healthz`

-   **Method**: `GET`
-   **URL**: `http://localhost:8080/healthz`
-   **Description**: This request calls the health check endpoint of the backend service. It's a simple way to verify that the backend server is running and accessible.
-   **Expected Response**: A JSON object with a status of "ok".
    ```json
    {
      "status": "ok"
    }
    ```

### 2. `current-values`

-   **Method**: `GET`
-   **URL**: `http://localhost:8080/api/current-values`
-   **Description**: This request retrieves a set of example values that are periodically updated on the server. This is useful for testing client connectivity and data retrieval.
-   **Expected Response**: A JSON object containing sample data.
    ```json
    {
      "value1": 100,
      "value2": 50
    }
    ```

### 3. `reconcile`

-   **Method**: `POST`
-   **URL**: `http://localhost:8080/api/reconcile`
-   **Description**: This is the main endpoint for performing data reconciliation. The request body contains the measurements, tolerances, and constraints to be reconciled.
-   **Body**: The request is pre-configured with an example JSON body. You can modify the values in the "Body" tab to test different reconciliation scenarios.
    ```json
    {
      "measurements": [
        10.2,
        20.5,
        29.8
      ],
      "tolerances": [
        0.01,
        0.015,
        0.02
      ],
      "constraints": [
        [
          1,
          1,
          -1
        ]
      ]
    }
    ```
-   **Expected Response**: A JSON object containing the reconciled data.
    ```json
    {
      "reconciled": [10.1, 20.4, 30.5]
    }
    ```

By using this Bruno collection, you can efficiently test, debug, and understand the behavior of the backend API without writing any code.