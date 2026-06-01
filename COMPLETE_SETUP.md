# Complete Setup Guide - AI Growth Systems

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Running the Application](#running-the-application)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (comes with Node.js)
- **RAM**: 2GB minimum
- **Disk Space**: 500MB free

### To Check Your Version
```bash
node --version
npm --version
```

### If Not Installed
Download from [nodejs.org](https://nodejs.org/)

---

## Installation

### Step 1: Extract/Open the Project
Navigate to the project folder in your terminal/command prompt

### Step 2: Install All Dependencies (First Time Only)
```bash
npm install && npm --workspace app install && npm --workspace server install
```

**What this does:**
- Installs root dependencies (including `concurrently`)
- Installs frontend dependencies (Next.js, React, TailwindCSS, etc.)
- Installs backend dependencies (Express, Prisma, JWT, etc.)

**Time**: 2-5 minutes on first install

### Step 3: Verify Installation
```bash
npm list --depth=0
```

You should see:
- ✅ `concurrently`
- ✅ `next`
- ✅ `express`
- ✅ All other dependencies

---

## Running the Application

### Option 1: Both Servers Together (Recommended)
```bash
npm run dev
```

This starts:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:4000`

**Output should show:**
```
▲ Next.js 15.2.3
- Local:        http://localhost:3001

API server listening on http://localhost:4000
```

### Option 2: Frontend Only
```bash
npm --workspace app run dev
```
Starts frontend at `http://localhost:3001`

### Option 3: Backend Only
```bash
npm --workspace server run dev
```
Starts backend at `http://localhost:4000`

### Windows Batch File
Double-click `RUN_ME_FIRST.bat` to start everything automatically

### Mac/Linux Shell Script
```bash
chmod +x run.sh
./run.sh
```

---

## Verification

### Step 1: Check Backend Connection
Open terminal and run:
```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-06-01T..."}
```

### Step 2: Check Frontend
Open browser: **http://localhost:3001**

You should see:
- Homepage with services section
- Pricing information
- AI Assistant chatbot
- Sign In / Sign Up buttons

### Step 3: Test Authentication
1. Click "Sign In"
2. Use these credentials:
   - Email: `superadmin@gmail.com`
   - Password: `AdminPass123!`
3. You should be redirected to `/superadmin` dashboard

### Step 4: Test User Registration
1. Click "Sign Up"
2. Fill in: email, password, name, phone, business
3. Submit - you should auto-login and go to dashboard

---

## Environment Configuration

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=ai-growth-systems-secret-key-2026-development
```

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3001
JWT_SECRET=your-jwt-secret-key-change-in-production
```

Both are already configured - no changes needed to run locally.

---

## Troubleshooting

### Issue: "npm: command not found"
**Solution**: Node.js is not installed
- Download: [nodejs.org](https://nodejs.org/)
- Restart terminal after installing
- Verify: `node --version`

### Issue: "Port 3001 already in use"
**Solution**: Kill the process using port 3001

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -i :3001
kill -9 <PID>
```

Or just use a different port:
```bash
npm --workspace app run dev -- -p 3002
```

### Issue: "Port 4000 already in use"
**Solution**: Kill the process using port 4000

**Windows:**
```bash
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -i :4000
kill -9 <PID>
```

### Issue: "Cannot find module..."
**Solution**: Reinstall dependencies

```bash
# Clear everything
rm -rf node_modules app/node_modules server/node_modules
rm package-lock.json

# Reinstall
npm install
npm --workspace app install
npm --workspace server install
```

### Issue: Frontend shows "Failed to connect to API server"
**Solutions:**
1. Make sure backend is running: check for "API server listening on http://localhost:4000"
2. Wait 3-5 seconds and refresh the page
3. Check if port 4000 is actually being used:
   - Windows: `netstat -ano | findstr :4000`
   - Mac/Linux: `lsof -i :4000`

### Issue: Backend crashes or won't start
**Solution:**
```bash
# Clear and reinstall
rm -rf server/node_modules server/dist
npm --workspace server install
npm --workspace server run dev
```

### Issue: TypeScript errors
**Solution:**
```bash
# Rebuild TypeScript
npm --workspace server run build
npm --workspace app run build
```

---

## File Structure

```
Bhumi Didi Web/
├── app/                    # Frontend (Next.js)
│   ├── app/
│   │   ├── api/           # API routes (proxy to backend)
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── login/         # Auth pages
│   │   └── page.tsx       # Homepage
│   ├── components/        # React components
│   ├── package.json
│   ├── .env.local        # Frontend config (already set up)
│   └── tsconfig.json
│
├── server/                 # Backend (Express)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth middleware
│   │   ├── index.ts      # Server entry point
│   │   └── prisma-client.ts  # Database
│   ├── package.json
│   ├── .env             # Backend config (already set up)
│   └── tsconfig.json
│
├── package.json           # Root workspace config
├── QUICKSTART.md          # Quick start guide
├── RUN_ME_FIRST.bat       # Windows startup script
├── run.sh                 # Mac/Linux startup script
└── COMPLETE_SETUP.md      # This file
```

---

## Development Commands

### Start Development
```bash
npm run dev              # Both servers
npm run dev:app         # Frontend only
npm run dev:server      # Backend only
```

### Build for Production
```bash
npm run build            # Build both
```

### Lint Code
```bash
npm run lint             # Lint both
```

---

## Production Deployment

For deployment, you'll need:
1. Update `.env` files with production secrets
2. Set `NODE_ENV=production`
3. Configure database URL for PostgreSQL
4. Update JWT_SECRET to a strong random value
5. Configure OpenAI, Twilio keys as needed
6. Build: `npm run build`
7. Start: `npm run start`

---

## Support & Documentation

### Built With
- **Frontend**: Next.js 15, React 18, TailwindCSS
- **Backend**: Express, TypeScript, Prisma
- **Auth**: JWT, NextAuth.js
- **Database**: In-memory (development mode)
- **UI**: Framer Motion, Lucide Icons, Radix UI

### Features Included
- ✅ User Authentication (signup/login)
- ✅ Dashboard with metrics
- ✅ Lead management
- ✅ Admin/SuperAdmin panels
- ✅ Chatbot integration (OpenAI support)
- ✅ Voice calling (Twilio support)
- ✅ Role-based access control
- ✅ Mock/simulation modes for all services

### All Ready to Run!

You're all set. Start with:
```bash
npm run dev
```

Then go to http://localhost:3001 🚀
