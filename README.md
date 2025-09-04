# macOS Monitor

A web-based monitoring tool for macOS that displays real-time system information, including CPU, GPU, memory, disk usage, and network activity.

## Features

*   **Real-time Metrics:** View live data for CPU, GPU, memory, and disk usage.
*   **Network Activity:** Monitor network download and upload speeds.
*   **Top Processes:** See a list of the top 5 processes by CPU usage.
*   **System Information:** Get a detailed overview of your system's hardware and software.
*   **Holographic UI:** A modern and futuristic user interface with holographic elements.

## Technologies Used

*   **Frontend:**
    *   React
    *   Vite
    *   Recharts
*   **Backend:**
    *   Go
    *   gopsutil
    *   Gorilla WebSocket

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/macos-monitor.git
    cd macos-monitor
    ```

2.  **Install backend dependencies:**
    ```bash
    cd backend
    go mod tidy
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd ../frontend
    npm install
    ```

## Usage

1.  **Start the backend server:**
    ```bash
    cd backend
    go run main.go
    ```
    The backend server will be running at `http://localhost:8000`.

2.  **Start the frontend development server:**
    ```bash
    cd ../frontend
    npm run dev
    ```
    The frontend development server will be running at `http://localhost:5173`.

3.  **Open your browser** and navigate to `http://localhost:5173` to view the monitoring dashboard.
