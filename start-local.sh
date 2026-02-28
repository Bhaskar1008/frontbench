#!/bin/bash
# Local Development Startup Script for Mac/Linux
# This script helps you start both backend and frontend services

echo "========================================"
echo "Frontbench Local Development Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js >= 20.0.0"
    exit 1
fi

# Check backend dependencies
echo ""
echo "Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not found. Installing..."
    cd backend
    npm install
    cd ..
fi

# Check frontend dependencies
echo ""
echo "Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

# Check backend .env file
echo ""
echo "Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo "✅ Backend .env file found"
else
    echo "⚠️  Backend .env file not found. Please create it from .env.example"
fi

echo ""
echo "========================================"
echo "Starting Services"
echo "========================================"
echo ""
echo "Starting backend on http://localhost:3001"
echo "Starting frontend on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both services are starting"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Open http://localhost:3000 in your browser to test the application"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
