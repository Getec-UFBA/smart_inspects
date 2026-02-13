#!/bin/bash
# Get the absolute path of the script's directory
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo "Iniciando a Plataforma Gêmeo Digital..."

# Start the YOLO service in the background
echo "Iniciando o serviço YOLO..."
(cd "$SCRIPT_DIR/backend/python_service" && . venv/bin/activate && uvicorn main:app --reload --port 8001) &

# Start the frontend and Node.js backend
echo "Iniciando o frontend e o backend Node.js..."
(cd "$SCRIPT_DIR" && npm start)
