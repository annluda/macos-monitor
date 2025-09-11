#!/bin/bash

# Stop on any error
set -e

# --- Configuration ---
FORMULA_NAME="macos-monitor"
FORMULA_PATH="./macos-monitor.rb"

FRONTEND_IMAGE_NAME="macos-monitor-frontend"
FRONTEND_CONTAINER_NAME="macos-monitor-frontend-container"
FRONTEND_PORT=8080

# --- Helper Functions ---
info() {
    echo "INFO: $1"
}

error() {
    echo "ERROR: $1" >&2
    exit 1
}

# --- Backend Deployment ---
deploy_backend() {
    info "Deploying backend via Homebrew..."

    # 1. Check for Homebrew
    if ! command -v brew &> /dev/null; then
        error "Homebrew could not be found. Please install Homebrew first."
    fi

    # 2. Uninstall any previous versions to ensure a clean slate
    if brew list --formula | grep -q "^$FORMULA_NAME$"; then
        info "Uninstalling existing formula..."
        brew uninstall "$FORMULA_NAME"
    fi

    # 3. Install the formula from the local file
    info "Installing backend from local formula: $FORMULA_PATH..."
    if ! brew install --build-from-source "$FORMULA_PATH"; then
        error "Failed to install Homebrew formula."
    fi
    info "Formula installed successfully."

    # 4. Start/Restart the service
    info "Starting/restarting the Homebrew service..."
    if brew services list | grep -q "^$FORMULA_NAME"; then
      brew services restart "$FORMULA_NAME"
    else
      brew services start "$FORMULA_NAME"
    fi

    info "Backend deployment complete. Service is now managed by Homebrew."
    info "Check status with: brew services list"
}

# --- Frontend Deployment ---
deploy_frontend() {
    info "Deploying frontend..."

    # 1. Check for Docker
    if ! command -v docker &> /dev/null; then
        error "Docker could not be found. Please install Docker and ensure it's running."
    fi
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start the Docker daemon."
    fi

    # 2. Build the Docker image
    info "Building frontend Docker image..."
    cd "$(dirname "$0")/frontend"
    docker build -t "$FRONTEND_IMAGE_NAME" .
    cd ..
    info "Image '$FRONTEND_IMAGE_NAME' built successfully."

    # 3. Stop and remove any existing container
    if [ "$(docker ps -q -f name=$FRONTEND_CONTAINER_NAME)" ]; then
        info "Stopping existing container..."
        docker stop "$FRONTEND_CONTAINER_NAME"
    fi
    if [ "$(docker ps -aq -f name=$FRONTEND_CONTAINER_NAME)" ]; then
        info "Removing existing container..."
        docker rm "$FRONTEND_CONTAINER_NAME"
    fi

    # 4. Run the new container
    info "Starting new container '$FRONTEND_CONTAINER_NAME' on port $FRONTEND_PORT..."
    docker run -d -p "$FRONTEND_PORT":80 --name "$FRONTEND_CONTAINER_NAME" "$FRONTEND_IMAGE_NAME"

    info "Frontend deployment complete. Access it at http://localhost:$FRONTEND_PORT"
}

# --- Main Logic ---
usage() {
    echo "Usage: $0 [frontend|backend|all]"
    echo "  frontend: Deploy the frontend Docker container."
    echo "  backend:  Deploy the backend Go application as a Homebrew service."
    echo "  all:      Deploy both frontend and backend."
    exit 1
}

if [ "$#" -eq 0 ]; then
    usage
fi

case "$1" in
    frontend)
        deploy_frontend
        ;;
    backend)
        deploy_backend
        ;;
    all)
        deploy_backend
        deploy_frontend
        ;;
    *)
        usage
        ;;
esac

info "Deployment finished."
