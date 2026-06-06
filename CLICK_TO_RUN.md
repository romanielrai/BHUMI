# 🚀 CLICK & GO LIVE - AI Growth Systems

## EASIEST WAY TO RUN (30 seconds)

### For Windows Users
1. **Double-click** → `RUN_ME_FIRST.bat`
2. Wait for "API server listening" + "Next.js ready"
3. Browser opens → **http://localhost:3001**
4. ✅ You're live!

### For Mac/Linux Users
1. **Open Terminal** in project folder
2. **Copy & Paste:**
```bash
chmod +x run.sh && ./run.sh
```
3. Wait for "API server listening" + "Next.js ready"
4. **Open browser** → `http://localhost:3001`
5. ✅ You're live!

### For Any Code Editor (VS Code, IntelliJ, etc.)
1. **Open terminal** in code editor (Terminal menu)
2. **Copy & Paste:**
```bash
npm run dev
```
3. Wait 10-15 seconds for both servers to start
4. **Click the link** shown or go to `http://localhost:3001`
5. ✅ You're live!

---

## ✅ HOW TO KNOW IT'S WORKING

### Terminal Should Show:
```
[Watching for file changes...]
▲ Next.js 15.2.3
- Local: http://localhost:3001

[server] npm info it worked if it ends with ok
[server] API server listening on http://localhost:4000
```

### Browser Should Show:
- AI Growth Systems homepage
- Navigation bar with Sign In/Sign Up
- Chatbot panel on right side
- Pricing and services sections

---

## 🔐 TEST LOGIN (Optional)

**Already configured accounts:**
- Email: `superadmin@gmail.com`
- Password: `AdminPass123!`

Or **Sign Up** to create your own instantly

---

## ❌ NOT WORKING?

### Problem 1: "npm: command not found"
- Install Node.js: https://nodejs.org/
- Close and reopen terminal

### Problem 2: "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001
```
Then kill the process or use different port:
```bash
npm --workspace app run dev -- -p 3002
```

### Problem 3: "Cannot connect to backend"
- Make sure you see `API server listening on http://localhost:4000`
- If not, run separately:
```bash
npm --workspace server run dev
```

### Problem 4: Still stuck?
See detailed guide: `COMPLETE_SETUP.md`

---

## 🎯 WHAT YOU CAN DO

✅ Sign up and create account
✅ Login with existing credentials  
✅ View dashboard with metrics
✅ See leads list
✅ Access admin panel (as admin user)
✅ Chat with AI assistant
✅ Test all features

---

## 🛑 TO STOP

Press `CTRL+C` in terminal

---

## 📊 SYSTEM STATUS

| Component | Port | Status |
|-----------|------|--------|
| Frontend | 3001 | Running |
| Backend | 4000 | Running |
| Database | In-Memory | Included |
| Auth | JWT | Configured |

---

**All dependencies are installed. Everything is configured. Ready to run!** 🎉

Choose your method above and you're done in 30 seconds! 🚀
