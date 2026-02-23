#!/bin/bash

echo "🔧 Setting up HireReady..."

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Python Virtual Environment ────────────────────────────────────────────────
echo "Creating Python virtual environment..."
python3 -m venv "$PROJECT_DIR/.venv"
source "$PROJECT_DIR/.venv/bin/activate"

# ─── Backend Dependencies ──────────────────────────────────────────────────────
echo "Installing backend dependencies..."
pip install -r "$PROJECT_DIR/backend/requirements.txt"

# ─── Frontend Dependencies ─────────────────────────────────────────────────────
echo "Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend" && npm install

echo ""
echo "✅ Setup complete! Starting HireReady..."
echo ""

# ─── Kill any existing processes on ports 8000 and 5173 ───────────────────────
echo "Checking for processes on ports 8000 and 5173..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# ─── Start Backend ─────────────────────────────────────────────────────────────
echo "Starting Backend on port 8000..."
cd "$PROJECT_DIR/backend"
source "$PROJECT_DIR/.venv/bin/activate"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 3

# ─── Start Frontend ────────────────────────────────────────────────────────────
echo "Starting Frontend on port 5173..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 3

# ─── Open Browser ──────────────────────────────────────────────────────────────
echo "Opening HireReady in browser..."
open "http://localhost:5173"

echo ""
echo "🎯 HireReady is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Stop both when Ctrl+C is pressed
trap "echo '🛑 Stopping HireReady...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT
wait