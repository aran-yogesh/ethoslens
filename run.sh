#!/bin/bash

# EthosLens - Start All Services with Real-Time Logs
# Shows logs in terminal AND saves to files

echo "🚀 Starting EthosLens with Inkeep Agents..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Port $port is busy, killing process...${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Check and free all required ports
echo "🔍 Checking ports..."
kill_port 4000
kill_port 5173
kill_port 3000
kill_port 3002
kill_port 3003
kill_port 3001
echo ""

# Clean old log files
rm -f inkeep-logs.txt backend-logs.txt frontend-logs.txt

# Start Inkeep Agents Services (APIs)
echo -e "${PURPLE}🤖 Starting Inkeep Agents APIs...${NC}"
echo -e "${PURPLE}   Manage API: http://localhost:3002${NC}"
echo -e "${PURPLE}   Run API: http://localhost:3003${NC}"
cd my-agent-directory
pnpm dev:apis 2>&1 | tee ../inkeep-logs.txt &
cd ..
echo ""

# Wait for APIs to start
sleep 3

# Start Inkeep Manage UI (Visual Dashboard)
echo -e "${PURPLE}🎨 Starting Inkeep Manage UI (Visual Dashboard)...${NC}"
echo -e "${PURPLE}   Manage UI: http://localhost:3001${NC}"
cd my-agent-directory
pnpm dev:ui 2>&1 | tee ../inkeep-ui-logs.txt &
cd ..
echo ""

# Wait for UI to start
sleep 5

# Start Backend
echo -e "${BLUE}📡 Starting Backend Server (Port 4000)...${NC}"
npm run server 2>&1 | tee backend-logs.txt &

# Wait for backend
sleep 2

# Start Frontend
echo -e "${GREEN}🌐 Starting Frontend Server (Port 5173)...${NC}"
npm run dev 2>&1 | tee frontend-logs.txt &

# Wait for frontend to start
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo -e "${GREEN}📊 Access the application:${NC}"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:4000"
echo "   Health:   http://localhost:4000/health"
echo ""
echo -e "${PURPLE}🎨 Inkeep Agent Framework:${NC}"
echo "   Manage UI (Visual Dashboard): http://localhost:3001"
echo "   Manage API: http://localhost:3002"
echo "   Run API: http://localhost:3003"
echo ""
echo -e "${YELLOW}📝 Logs are displayed below and saved to:${NC}"
echo "   inkeep-logs.txt (APIs)"
echo "   inkeep-ui-logs.txt (UI)"
echo "   backend-logs.txt"
echo "   frontend-logs.txt"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
echo "─────────────────────────────────────────────────"
echo ""

# Wait for all background processes
wait
