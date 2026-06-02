#!/bin/bash

echo "================================================"
echo "  Bhumi Didi Web - Development Server"
echo "================================================"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Kill any existing processes on ports 3001 and 4000
echo "Cleaning up ports..."
npx kill-port 3001 4000 2>/dev/null || true

# Start the development servers
echo ""
echo "Starting development servers..."
echo ""
echo "  Frontend:   http://localhost:3001"
echo "  API Server: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop..."
echo ""

npm run dev
