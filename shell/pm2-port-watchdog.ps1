$apps = @(
    @{ name = "hms-backend"; port = 3001 },
    @{ name = "hms-frontend"; port = 3000 }
)

function Is-Port-Open($port) {
    try {
        (Test-NetConnection localhost -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded
    } catch {
        $false
    }
}

while ($true) {
    foreach ($app in $apps) {
        if (-not (Is-Port-Open $app.port)) {
            Write-Host "Port $($app.port) down. Restarting $($app.name)..."
            pm2 restart $app.name
        }
    }
    Start-Sleep -Seconds 15
}
