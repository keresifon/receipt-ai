#!/bin/bash

# PM2 Applications Startup Script for Mac Mini
# This script starts all your PM2 applications on system boot

# Set up logging
LOG_FILE="/Users/kere/logs/pm2-startup.log"
mkdir -p /Users/kere/logs

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOG_FILE"
}

log "=== PM2 Startup Script Started ==="

# Set up Node.js environment
export PATH="/opt/homebrew/opt/node@20/bin:/Users/kere/.nvm/versions/node/v20.19.0/bin:$PATH"
export NODE_PATH="/opt/homebrew/opt/node@20/bin/node"

# Ensure PM2 is available
if ! command -v pm2 &> /dev/null; then
    log "ERROR: PM2 not found in PATH"
    exit 1
fi

# Start PM2 daemon if not running
if ! pm2 ping &> /dev/null; then
    log "Starting PM2 daemon..."
    pm2 ping
fi

# Wait a moment for PM2 to fully initialize
sleep 2

# Check if processes are already running and clean up duplicates
log "Checking for existing PM2 processes..."
EXISTING_PROCESSES=$(pm2 list | grep -E "^\│ [0-9]" | wc -l)

if [ "$EXISTING_PROCESSES" -gt 0 ]; then
    log "Found $EXISTING_PROCESSES existing processes"
    log "Cleaning up existing processes to avoid duplicates..."
    pm2 delete all
    sleep 1
fi

# Start Portfolio App (keresifon)
log "Starting Portfolio App (keresifon)..."
cd /Users/kere/portfolio
pm2 start "npx serve -s build -l 4002" --name "keresifon"
if [ $? -eq 0 ]; then
    log "✓ Portfolio App started successfully"
else
    log "✗ Failed to start Portfolio App"
fi

# Start KwesiBlack App
log "Starting KwesiBlack App..."
cd /Users/kere/kwesiblack
PORT=4001 pm2 start npm --name "kwesiblack" -- start
if [ $? -eq 0 ]; then
    log "✓ KwesiBlack App started successfully"
else
    log "✗ Failed to start KwesiBlack App"
fi

# Start Receipt AI App (no-wahala)
log "Starting Receipt AI App (no-wahala)..."
cd /Users/kere/receipt-ai
PORT=3000 pm2 start npm --name "no-wahala" -- run dev
if [ $? -eq 0 ]; then
    log "✓ Receipt AI App started successfully"
else
    log "✗ Failed to start Receipt AI App"
fi

# Start WorkNodey App
log "Starting WorkNodey App..."
cd /Users/kere/wnd/worknodey
PORT=4000 pm2 start npm --name "worknodey" -- start
if [ $? -eq 0 ]; then
    log "✓ WorkNodey App started successfully"
else
    log "✗ Failed to start WorkNodey App"
fi

# Don't save PM2 process list to avoid auto-restore conflicts
# pm2 save

log "=== PM2 Startup Script Completed ==="
log "Current PM2 processes:"
pm2 list >> "$LOG_FILE" 2>&1

