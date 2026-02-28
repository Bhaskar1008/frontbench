# Local Development Startup Script for Windows PowerShell
# This script helps you start both backend and frontend services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontbench Local Development Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js >= 20.0.0" -ForegroundColor Red
    exit 1
}

# Check backend dependencies
Write-Host ""
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Check frontend dependencies
Write-Host ""
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# Check backend .env file
Write-Host ""
Write-Host "Checking backend configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "✅ Backend .env file found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend .env file not found. Please create it from .env.example" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting backend on http://localhost:3001" -ForegroundColor Yellow
Write-Host "Starting frontend on http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Gray
Write-Host ""

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Backend Server' -ForegroundColor Cyan; Write-Host '==============' -ForegroundColor Cyan; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend Server' -ForegroundColor Cyan; Write-Host '===============' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ Both services are starting in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open http://localhost:3000 in your browser to test the application" -ForegroundColor Yellow
