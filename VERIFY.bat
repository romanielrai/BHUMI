@echo off
REM AI Growth Systems - Verification Script
REM Check if system is ready to run the application

echo.
echo ======================================
echo   AI GROWTH SYSTEMS - Verification
echo ======================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAILED: Node.js not installed
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js installed
node --version
echo.

REM Check npm
echo [2/5] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAILED: npm not installed
    pause
    exit /b 1
)
echo ✅ npm installed
npm --version
echo.

REM Check required files
echo [3/5] Checking required files...
if not exist "package.json" (
    echo ❌ FAILED: package.json not found
    pause
    exit /b 1
)
if not exist "app\package.json" (
    echo ❌ FAILED: app/package.json not found
    pause
    exit /b 1
)
if not exist "server\package.json" (
    echo ❌ FAILED: server/package.json not found
    pause
    exit /b 1
)
if not exist "app\.env.local" (
    echo ❌ FAILED: app/.env.local not found
    pause
    exit /b 1
)
if not exist "server\.env" (
    echo ❌ FAILED: server/.env not found
    pause
    exit /b 1
)
echo ✅ All required files present
echo.

REM Check ports availability
echo [4/5] Checking port availability...
netstat -ano 2>nul | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: Port 3001 is already in use
    echo You may need to stop the process using it
)
echo ✅ Port check complete
echo.

REM Check environment files
echo [5/5] Checking environment configuration...
findstr /M "NEXTAUTH_URL" "app\.env.local" >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend configuration ready
) else (
    echo ❌ FAILED: Frontend environment incomplete
    pause
    exit /b 1
)

findstr /M "JWT_SECRET" "server\.env" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend configuration ready
) else (
    echo ❌ FAILED: Backend environment incomplete
    pause
    exit /b 1
)
echo.

REM Final summary
echo ======================================
echo   ✅ READY TO START!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Make sure ports 3001 and 4000 are free
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3001
echo.
echo Login with:
echo   Email: superadmin@gmail.com
echo   Password: AdminPass123!
echo.
pause
