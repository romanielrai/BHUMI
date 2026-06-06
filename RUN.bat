@echo off
REM ====================================================
REM  Bhumi Didi Web - Start Dev Servers (CMD version)
REM  This uses CMD.exe to avoid PowerShell policy issues
REM ====================================================

echo.
echo ====================================================
echo   Bhumi Didi Web - Starting Development Servers
echo ====================================================
echo.

REM Check Node
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found:
node --version
echo.

REM Kill anything on ports 3001 / 4000
echo Freeing ports 3001 and 4000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :4000') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
echo.

REM Install root dependencies if needed
if not exist "node_modules\concurrently" (
    echo Installing root dependencies...
    call npm install --legacy-peer-deps
    echo.
)

REM Install frontend deps if needed
if not exist "frontend\node_modules\next" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install --legacy-peer-deps
    cd ..
    echo.
)

REM Install backend deps if needed
if not exist "backend\node_modules\express" (
    echo Installing backend dependencies...
    cd backend
    call npm install --legacy-peer-deps
    cd ..
    echo.
)

echo ====================================================
echo   Starting servers...
echo   Frontend:  http://localhost:3001
echo   Backend:   http://localhost:4000
echo   Health:    http://localhost:4000/api/health
echo ====================================================
echo.
echo Login credentials:
echo   Email:    superadmin@gmail.com
echo   Password: AdminPass123!
echo.
echo Press Ctrl+C to stop.
echo.

REM Start backend in a separate window
start "Backend API - Port 4000" cmd /k "cd /d "%~dp0backend" && npx ts-node-dev --respawn --transpile-only src/index.ts"

REM Wait 3 seconds then start frontend
timeout /t 3 /nobreak >nul

REM Start frontend in a separate window
start "Frontend App - Port 3001" cmd /k "cd /d "%~dp0frontend" && npx next dev -p 3001"

echo.
echo Both servers are starting in separate windows.
echo Wait ~15 seconds then open: http://localhost:3001
echo.
pause
