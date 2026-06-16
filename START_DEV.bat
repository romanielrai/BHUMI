@echo off
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo   Bhumi Didi Web - Startup Manager
echo ====================================================
echo.

:: 1. Check Node.js installation
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ to run the app.
    pause
    exit /b 1
)
echo [OK] Node.js is installed.

:: 2. Cleanup processes running on ports 3001 and 4000
echo [1/5] Freeing ports 3001 and 4000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :4000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Ports cleared.

:: 3. Configure npm script shell to avoid Execution Policy blocks
call npm config set script-shell cmd >nul 2>&1

:: 4. Check and install dependencies
echo [2/5] Checking dependencies (this may take a few seconds)...
if not exist "node_modules" (
    echo Root dependencies missing. Installing...
    call npm install --legacy-peer-deps
)
if not exist "frontend\node_modules" (
    echo Frontend dependencies missing. Installing...
    call npm --workspace frontend install --legacy-peer-deps
)
if not exist "backend\node_modules" (
    echo Backend dependencies missing. Installing...
    call npm --workspace backend install --legacy-peer-deps
)
echo [OK] Dependencies ready.

:: 5. Start Backend Server with Auto-Retry loop
echo [3/5] Launching Backend Server on port 4000...
start "Backend Server (Port 4000)" cmd /k "cd backend && echo Starting backend server... && :loop && call npm run dev || (echo [CRASH] Backend exited unexpectedly. Restarting in 3 seconds... && timeout /t 3 && goto loop)"

:: 6. Wait for Backend Health Check (GET /health) to be online
echo [4/5] Waiting for Backend to be online...
:wait_backend
powershell -Command "(Invoke-WebRequest -Uri http://127.0.0.1:4000/health -UseBasicParsing).Content" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    timeout /t 1 /nobreak >nul
    goto wait_backend
)
echo [OK] Backend is online!

:: 7. Start Frontend Server on port 3001
echo [5/5] Launching Frontend Server on port 3001...
start "Frontend Server (Port 3001)" cmd /k "cd frontend && echo Starting frontend server... && call npm run dev"

:: 8. Open Launcher / Web Application
echo.
echo ====================================================
echo   SUCCESS: Launching your Browser Cockpit
echo ====================================================
echo.

:: Open index.html launcher
start "" "%~dp0index.html"

echo Both servers are running.
echo To view diagnostics, run: npm run doctor
echo.
pause
