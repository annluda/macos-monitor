# Backend (Go)

This directory contains the Go implementation of the backend service.

## Running the service

1.  **Navigate to the directory:**
    ```sh
    cd backend-go
    ```

2.  **Run the application:**
    ```sh
    go run main.go
    ```

3.  **Running with GPU Monitoring (requires sudo):**

    To enable GPU usage monitoring on Apple Silicon, the application needs to be run with `sudo` because it uses `powermetrics`.

    ```sh
    sudo go run main.go
    ```

The server will start on `http://localhost:8000`.
