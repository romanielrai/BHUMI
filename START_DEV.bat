@echo off
REM Quick start script for Bhumi Didi Web Application

echo.
echo ================================================
echo   Bhumi Didi Web - Development Server
echo ================================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Kill any existing processes on ports 3001 and 4000
echo Cleaning up ports...
npx kill-port 3001 4000 >nul 2>&1

REM Start the development servers
echo.
echo Starting development servers...
echo.
echo   Frontend:   http://localhost:3001
echo   API Server: http://localhost:4000
echo.
echo Press Ctrl+C to stop...
echo.

npm run dev

pause
