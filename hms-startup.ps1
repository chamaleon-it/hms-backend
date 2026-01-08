$ErrorActionPreference = "Stop"

$MongoService = "MongoDB"
$FrontendURL  = "http://localhost:3000"

# ---- MongoDB ----
$mongo = Get-Service MongoDB -ErrorAction Stop
if ($mongo.Status -ne "Running") {
    Start-Service MongoDB
    $mongo.WaitForStatus("Running", "00:00:30")
}

# ---- PM2 Apps ----
$apps = pm2 list | Out-String

if ($apps -notmatch "hms-backend") {
    pm2 start C:\hms\ecosystem.config.js
}

pm2 save

# ---- Port Watchdog ----
$watchdogRunning = Get-Process powershell -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -like "*pm2-port-watchdog.ps1*" }

if (-not $watchdogRunning) {
    Start-Process powershell `
        -ArgumentList "-NoExit", "-File C:\hms\pm2-port-watchdog.ps1"
}

# ---- Open Chrome ----
Start-Sleep -Seconds 5
Start-Process chrome.exe $FrontendURL
