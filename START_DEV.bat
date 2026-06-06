@echo off
REM Quick start script for Bhumi Didi Web Application

echo.
echo ================================================
echo   Bhumi Didi Web - Development Server
echo ================================================
echo.

REM Check if Node.js is installed
node -v >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Kill any existing processes on ports 3001 and 4000
echo Cleaning up ports 3001 and 4000...
call npx.cmd kill-port 3001 4000 >nul 2>&1

REM Start the development servers
echo.
echo Starting development servers...
echo.
echo   Frontend:   http://localhost:3001
echo   API Server: http://localhost:4000
echo.
echo Launching your browser to http://localhost:3001 in 5 seconds...
echo.
echo Press Ctrl+C in this window to stop the servers.
echo.

REM Open default browser automatically in 5 seconds
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3001"

REM Run the dev command using npm.cmd to avoid PowerShell Execution Policy issues
call npm.cmd run dev

pause
