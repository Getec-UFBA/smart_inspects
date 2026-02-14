#!/bin/bash
# Get the absolute path of the script's directory
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo "Iniciando a Plataforma Gêmeo Digital..."

# Create the temporary directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/backend/tmp"

# Function to clean up background processes
cleanup() {
    echo "Encerrando serviços..."
    if [ ! -z "$YOLO_PID" ]; then
        kill $YOLO_PID
    fi
    if [ ! -z "$NPM_PID" ]; then
        kill $NPM_PID
    fi
}

# Trap exit signals to run cleanup
trap cleanup EXIT SIGINT SIGTERM

# Start the YOLO service in the background
echo "Iniciando o serviço YOLO..."
(cd "$SCRIPT_DIR/backend/python_service" && . venv/bin/activate && uvicorn main:app --reload --port 8001) &
YOLO_PID=$!

# Start the frontend and Node.js backend
echo "Iniciando o frontend e o backend Node.js..."
(cd "$SCRIPT_DIR" && npm start) &
NPM_PID=$!

# Wait for both background processes to finish
wait $YOLO_PID
wait $NPM_PID
