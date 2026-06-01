# 🎯 FINAL STARTUP GUIDE - PICK YOUR METHOD

## ⭐ THE ABSOLUTE EASIEST WAY

### WINDOWS Users:
```
👉 DOUBLE-CLICK THIS FILE: RUN_ME_FIRST.bat
```
✅ That's it! Everything happens automatically.

### MAC/LINUX Users:
```
👉 Open terminal and paste this:
chmod +x run.sh && ./run.sh
```
✅ Everything happens automatically.

---

## 🔧 ALTERNATIVE METHOD (All Platforms)

### If you prefer using terminal:

1. **Open Terminal/Command Prompt** in the project folder
2. **Copy & paste this command:**
```bash
npm run dev
```
3. **Wait for both servers to start** (~10-15 seconds)

---

## ✅ HOW TO KNOW IT'S WORKING

### Look for these messages in terminal:

```
▲ Next.js 15.2.3
- Local:        http://localhost:3001
- Environments: .env.local

[server] npm info it worked if it ends with ok
[server] API server listening on http://localhost:4000
```

When you see BOTH messages: ✅ **YOU'RE READY!**

---

## 🌐 OPEN YOUR BROWSER

1. **Go to:** http://localhost:3001
2. **You should see:**
   - AI Growth Systems homepage
   - Navigation menu
   - Sign In / Sign Up buttons
   - AI Chatbot on right side

---

## 🔐 LOGIN

### Use test account:
```
Email:    superadmin@gmail.com
Password: AdminPass123!
```

### OR:
Click "Sign Up" to create your own account instantly

---

## 📊 AFTER LOGIN

You'll see:
- **Dashboard** with metrics
- **Leads list**
- **Admin controls** (if admin user)
- **Chat with AI** (right side)
- **Logout button**

---

## ❌ NOTHING WORKED?

### Issue 1: "npm: command not found"
- Install Node.js: https://nodejs.org/
- Close and reopen terminal
- Try again

### Issue 2: "Port 3001 already in use"
- Windows: Run `netstat -ano | findstr :3001`
- Mac/Linux: Run `lsof -i :3001`
- Kill the process or wait a moment and try again

### Issue 3: "Backend not connecting"
- Verify you see `API server listening on http://localhost:4000`
- Wait 3-5 seconds and refresh browser
- Check if port 4000 is free

### Issue 4: "Cannot find module..."
```bash
# Reinstall everything
rm -rf node_modules app/node_modules server/node_modules
npm install
npm --workspace app install
npm --workspace server install
npm run dev
```

### Still stuck?
Read: `COMPLETE_SETUP.md` (Troubleshooting section)

---

## 🎯 WHAT TO TEST

✅ **Sign Up**
- Create new account with your email
- Auto-login should happen
- Should redirect to dashboard

✅ **Dashboard**
- See metrics cards
- View leads list
- Refresh button should work

✅ **Admin Panel**
- If logged in as admin: visit `/admin`
- Should show admin features
- If not admin: access denied

✅ **AI Chat**
- Right side panel
- Type a message
- Get instant AI response

✅ **Sign Out**
- Click logout
- Redirects to login page
- Session cleared

---

## 🛑 TO STOP THE APPLICATION

Press these keys in terminal:
```
CTRL + C
```

Both servers will stop.

---

## 🚀 YOU'RE ALL SET!

Everything is ready. Pick your startup method and go!

### Windows?
→ Double-click `RUN_ME_FIRST.bat`

### Mac/Linux?
→ Run `chmod +x run.sh && ./run.sh`

### Terminal (any)?
→ Run `npm run dev`

Then visit: **http://localhost:3001**

---

## 📚 MORE HELP

| Document | For |
|----------|-----|
| START_HERE.md | Overview & links |
| CLICK_TO_RUN.md | Visual quick start |
| QUICKSTART.md | Command reference |
| START.md | Step-by-step guide |
| COMPLETE_SETUP.md | Full technical guide |
| FILE_GUIDE.md | File structure |

---

**Choose your startup method above. You'll be running in 30 seconds!** ✨

🎉 **Enjoy your application!**
