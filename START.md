# ▶️ HOW TO RUN THIS APPLICATION

## 📌 Prerequisites
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** comes with Node.js
- An open terminal/command prompt

---

## 🚀 STEP 1: Install Dependencies (First Time Only)

Copy and paste in your terminal:

```bash
npm install && npm --workspace app install && npm --workspace server install
```

Wait for it to complete... (2-3 minutes on first run)

---

## 🎯 STEP 2: Start the Application

Copy and paste in your terminal:

```bash
npm run dev
```

This starts BOTH servers at once:
- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:4000

---

## ✅ STEP 3: Open in Browser

1. Open your web browser
2. Go to: **http://localhost:3001**
3. You should see the AI Growth Systems homepage
4. Click "Sign In" or "Sign Up" to get started

---

## 🔐 Test Credentials

Use these to test immediately:

```
Email:    superadmin@gmail.com
Password: AdminPass123!
```

Or click "Sign Up" to create your own account instantly.

---

## 📊 What You'll See

### On First Load
- Homepage with services and pricing
- AI Assistant chatbot on the right
- Navigation menu at top

### After Login
- Dashboard with metrics
- List of leads
- Admin/SuperAdmin controls (if logged in as admin)

---

## 🛑 To Stop the Application

Press `CTRL+C` in terminal

---

## ⚠️ If Something Goes Wrong

**Backend won't start?**
```bash
npm --workspace server run dev
```

**Frontend won't start?**
```bash
npm --workspace app run dev
```

**Port already in use?**
- Backend uses port 4000
- Frontend uses port 3001
- If busy, check what's using those ports and stop it

---

## ✨ Everything Ready?

Go to **http://localhost:3001** and enjoy! 🎉
