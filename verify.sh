#!/bin/bash

# AI Growth Systems - Verification Script (Mac/Linux)
# Check if system is ready to run the application

echo ""
echo "======================================"
echo "   AI GROWTH SYSTEMS - Verification"
echo "======================================"
echo ""

# Check Node.js
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ FAILED: Node.js not installed"
    echo "Download from: https://nodejs.org/"
    echo ""
    exit 1
fi
echo "✅ Node.js installed"
node --version
echo ""

# Check npm
echo "[2/5] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ FAILED: npm not installed"
    exit 1
fi
echo "✅ npm installed"
npm --version
echo ""

# Check required files
echo "[3/5] Checking required files..."
if [ ! -f "package.json" ]; then
    echo "❌ FAILED: package.json not found"
    exit 1
fi
if [ ! -f "app/package.json" ]; then
    echo "❌ FAILED: app/package.json not found"
    exit 1
fi
if [ ! -f "server/package.json" ]; then
    echo "❌ FAILED: server/package.json not found"
    exit 1
fi
if [ ! -f "app/.env.local" ]; then
    echo "❌ FAILED: app/.env.local not found"
    exit 1
fi
if [ ! -f "server/.env" ]; then
    echo "❌ FAILED: server/.env not found"
    exit 1
fi
echo "✅ All required files present"
echo ""

# Check ports
echo "[4/5] Checking port availability..."
if lsof -i :3001 &> /dev/null; then
    echo "⚠️  WARNING: Port 3001 is already in use"
    echo "You may need to stop the process using it"
else
    echo "✅ Port 3001 available"
fi
echo ""

# Check environment files
echo "[5/5] Checking environment configuration..."
if grep -q "NEXTAUTH_URL" "app/.env.local"; then
    echo "✅ Frontend configuration ready"
else
    echo "❌ FAILED: Frontend environment incomplete"
    exit 1
fi

if grep -q "JWT_SECRET" "server/.env"; then
    echo "✅ Backend configuration ready"
else
    echo "❌ FAILED: Backend environment incomplete"
    exit 1
fi
echo ""

# Final summary
echo "======================================"
echo "   ✅ READY TO START!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Make sure ports 3001 and 4000 are free"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3001"
echo ""
echo "Login with:"
echo "   Email: superadmin@gmail.com"
echo "   Password: AdminPass123!"
echo ""
