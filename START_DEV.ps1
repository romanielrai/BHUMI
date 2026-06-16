# PowerShell Startup Manager for Bhumi Didi Web
# Runs frontend and backend servers with auto-recovery

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "  Bhumi Didi Web - Startup Manager (PowerShell)" -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVer = node -v
    Write-Host "[OK] Node.js is installed ($nodeVer)" -ForegroundColor Green
} catch {
    Write-Warning "[ERROR] Node.js is not installed or not in PATH!"
    Write-Host "Please install Node.js from https://nodejs.org/"
    pause
    exit 1
}

# 2. Cleanup processes running on ports 3001 and 4000
Write-Host "[1/5] Checking and freeing ports 3001 and 4000..." -ForegroundColor Yellow
$ports = @(3001, 4000)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        $pids = $proc.OwningProcess | Select-Object -Unique
        foreach ($pid in $pids) {
            try {
                Stop-Process -Id $pid -Force
                Write-Host "  Successfully killed process $pid on port $port" -ForegroundColor Green
            } catch {
                Write-Warning "  Failed to kill process $pid on port $port"
            }
        }
    }
}
Write-Host "[OK] Ports cleared." -ForegroundColor Green

# 3. Configure npm script shell
npm config set script-shell cmd | Out-Null

# 4. Check and install dependencies
Write-Host "[2/5] Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Root dependencies missing. Installing..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}
if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Frontend dependencies missing. Installing..." -ForegroundColor Yellow
    npm --workspace frontend install --legacy-peer-deps
}
if (!(Test-Path "backend/node_modules")) {
    Write-Host "Backend dependencies missing. Installing..." -ForegroundColor Yellow
    npm --workspace backend install --legacy-peer-deps
}
Write-Host "[OK] Dependencies ready." -ForegroundColor Green

# 5. Start Backend Server with Auto-Retry
Write-Host "[3/5] Launching Backend Server on port 4000..." -ForegroundColor Yellow
$backendCmd = "cd backend; do { npm run dev; Write-Host 'Backend crashed! Restarting in 3 seconds...' -ForegroundColor Red; Start-Sleep -Seconds 3 } while (`$true)"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$backendCmd"

# 6. Wait for Backend Health Check
Write-Host "[4/5] Waiting for Backend to respond to health checks..." -ForegroundColor Yellow
$beOnline = $false
while (!$beOnline) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:4000/health" -UseBasicParsing -TimeoutSec 1
        if ($res.status -eq "ok") {
            $beOnline = $true
        }
    } catch {
        # Ignore and retry
    }
    if (!$beOnline) {
        Start-Sleep -Seconds 1
    }
}
Write-Host "[OK] Backend is online!" -ForegroundColor Green

# 7. Start Frontend Server
Write-Host "[5/5] Launching Frontend Server on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# 8. Open Launcher
Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "  SUCCESS: Starting Browser cockpit..." -ForegroundColor Green
Write-Host "====================================================`n" -ForegroundColor Green

Start-Process "index.html"

Write-Host "Both servers are starting in separate windows."
Write-Host "Diagnostics: run 'npm run doctor'"
Write-Host "Press enter to exit this startup manager..."
Read-Host
