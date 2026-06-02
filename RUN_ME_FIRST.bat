@echo off
REM AI Growth Systems - One-Click Start Script for Windows
REM This script installs dependencies and starts the application

echo.
echo ======================================
echo   AI GROWTH SYSTEMS - Starting...
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking Node.js version...
node --version
echo.

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 goto error

echo.
echo [3/4] Installing workspace dependencies...
call npm --workspace frontend install
call npm --workspace backend install
if %errorlevel% neq 0 goto error

echo.
echo [4/4] Starting application...
echo.
echo ======================================
echo   SERVERS STARTING...
echo ======================================
echo.
echo Frontend will open on: http://localhost:3001
echo Backend running on:   http://localhost:4000
echo.
echo Press CTRL+C to stop both servers
echo.

call npm run dev
goto end

:error
echo.
echo ERROR: Failed to start application!
echo Please check the error messages above.
echo.
pause
exit /b 1

:end
pause
