#!/bin/bash

# Example startup script for Mac Mini
# This script will run automatically on system restart

# Set up logging
LOG_FILE="/var/log/startup-script.log"
echo "$(date): Startup script started" >> "$LOG_FILE"

# Example: Start a web server
# cd /Users/kere/receipt-ai
# npm start >> "$LOG_FILE" 2>&1 &

# Example: Mount network drives
# mount -t afp afp://server.local/share /mnt/share

# Example: Start background services
# brew services start redis
# brew services start postgresql

# Example: Sync files
# rsync -av /Users/kere/Documents/ /Volumes/Backup/Documents/

echo "$(date): Startup script completed" >> "$LOG_FILE"




