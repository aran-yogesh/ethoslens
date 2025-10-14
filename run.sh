#!/bin/bash

# EthosLens - Start All Services
# Simple script to run frontend and backend

echo "🚀 Starting EthosLens Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Port $port is busy (PID: $pid)${NC}"
        echo -e "${YELLOW}🔪 Killing process on port $port...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}✅ Port $port is now free${NC}"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Check and free ports
echo "🔍 Checking ports..."
kill_port 4000
kill_port 5173
echo ""

# Start Backend (Port 4000)
echo -e "${BLUE}📡 Starting Backend Server (Port 4000)...${NC}"
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Frontend (Port 5173)
echo -e "${GREEN}🌐 Starting Frontend Server (Port 5173)...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000"
echo "   Health:   http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait
