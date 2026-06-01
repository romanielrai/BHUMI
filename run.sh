#!/bin/bash

# AI Growth Systems - One-Click Start Script for Mac/Linux
# This script installs dependencies and starts the application

echo ""
echo "======================================"
echo "   AI GROWTH SYSTEMS - Starting..."
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/4] Checking Node.js version..."
node --version
echo ""

echo "[2/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo ""
echo "[3/4] Installing workspace dependencies..."
npm --workspace app install
npm --workspace server install
if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install workspace dependencies!"
    exit 1
fi

echo ""
echo "[4/4] Starting application..."
echo ""
echo "======================================"
echo "   SERVERS STARTING..."
echo "======================================"
echo ""
echo "Frontend will open on: http://localhost:3001"
echo "Backend running on:   http://localhost:4000"
echo ""
echo "Press CTRL+C to stop both servers"
echo ""

npm run dev
