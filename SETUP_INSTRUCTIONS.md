# PM2 Applications Auto-Startup Setup Instructions

## Overview
This setup will automatically start your four PM2 applications when your Mac Mini restarts:
- Portfolio App (keresifon) - Port 4002
- KwesiBlack App - Port 4001  
- Receipt AI App (no-wahala) - Port 3000
- WorkNodey App - Port 4000

## Files Created
1. `startup-pm2-apps.sh` - Main startup script
2. `com.kere.pm2-startup.plist` - LaunchDaemon configuration

## Setup Steps

### Step 1: Copy the LaunchDaemon plist file
```bash
sudo cp /Users/kere/receipt-ai/com.kere.pm2-startup.plist /Library/LaunchDaemons/
```

### Step 2: Set proper permissions
```bash
sudo chown root:wheel /Library/LaunchDaemons/com.kere.pm2-startup.plist
sudo chmod 644 /Library/LaunchDaemons/com.kere.pm2-startup.plist
```

### Step 3: Load the LaunchDaemon
```bash
sudo launchctl load /Library/LaunchDaemons/com.kere.pm2-startup.plist
```

### Step 4: Verify it's loaded
```bash
sudo launchctl list | grep com.kere.pm2-startup
```

### Step 5: Test the script manually (optional)
```bash
/Users/kere/receipt-ai/startup-pm2-apps.sh
```

## Management Commands

### Check if LaunchDaemon is running
```bash
sudo launchctl list | grep com.kere.pm2-startup
```

### Unload the LaunchDaemon (to disable auto-startup)
```bash
sudo launchctl unload /Library/LaunchDaemons/com.kere.pm2-startup.plist
```

### Reload the LaunchDaemon (after making changes)
```bash
sudo launchctl unload /Library/LaunchDaemons/com.kere.pm2-startup.plist
sudo launchctl load /Library/LaunchDaemons/com.kere.pm2-startup.plist
```

### Remove the LaunchDaemon completely
```bash
sudo launchctl unload /Library/LaunchDaemons/com.kere.pm2-startup.plist
sudo rm /Library/LaunchDaemons/com.kere.pm2-startup.plist
```

## Log Files
- Main log: `/Users/kere/logs/pm2-startup.log`
- Output log: `/Users/kere/logs/pm2-startup.out.log`
- Error log: `/Users/kere/logs/pm2-startup.error.log`

## Troubleshooting

### Check logs
```bash
tail -f /Users/kere/logs/pm2-startup.log
tail -f /Users/kere/logs/pm2-startup.error.log
```

### Check PM2 status
```bash
pm2 list
pm2 logs
```

### Fix duplicate processes issue
If you see multiple entries for the same application after restart:
```bash
# Clean up all PM2 processes
pm2 delete all

# Remove the PM2 dump file to prevent auto-restore
rm -f /Users/kere/.pm2/dump.pm2

# Test the startup script
/Users/kere/receipt-ai/startup-pm2-apps.sh
```

### Test individual applications
```bash
# Test Portfolio App
cd /Users/kere/portfolio && pm2 start serve --name "keresifon" -- -s build -l 4002

# Test KwesiBlack App  
cd /Users/kere/kwesiblack && PORT=4001 pm2 start npm --name "kwesiblack" -- start

# Test Receipt AI App
cd /Users/kere/receipt-ai && PORT=3000 pm2 start npm --name "no-wahala" -- run dev

# Test WorkNodey App
cd /Users/kere/wnd/worknodey && PORT=4000 pm2 start npm --name "worknodey" -- start
```

## Notes
- The script will run automatically on system boot
- It includes error handling and logging
- PM2 processes are saved after startup
- Each application runs on its specified port
- The script waits for each app to start before proceeding to the next

