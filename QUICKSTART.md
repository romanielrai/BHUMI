# 🚀 Quick Start - AI Growth Systems

## One-Command Setup & Run

### Windows (PowerShell/CMD)
```bash
npm install && npm --workspace app install && npm --workspace server install && npm run dev
```

### Mac/Linux (Bash/Terminal)
```bash
npm install && npm --workspace app install && npm --workspace server install && npm run dev
```

---

## ✅ What This Does

1. **Installs all dependencies** - Frontend, Backend, and root packages
2. **Starts both servers automatically**:
   - Frontend: `http://localhost:3001`
   - Backend: `http://localhost:4000`

---

## 🔍 When It's Running

Look for these messages in your terminal:

### Backend Ready ✅
```
API server listening on http://localhost:4000
```

### Frontend Ready ✅
```
▲ Next.js 15.2.3
- Local:        http://localhost:3001
```

---

## 🌐 Access the Application

Once both servers show "ready":

1. **Open your browser** → `http://localhost:3001`
2. **Sign Up or Login**
   - Email: `test@example.com`
   - Password: Any password (auto-creates account)
3. **Dashboard loads automatically** after login

---

## 📋 Test Credentials

**Super Admin:**
- Email: `superadmin@gmail.com`
- Password: `AdminPass123!`

**Admin:**
- Email: `admin@gmail.com`
- Password: `AdminPass123!`

Or **Create Your Own** via Sign Up button

---

## ❌ Having Issues?

### Error: "Port 3001 already in use"
```bash
# Kill the process on port 3001
# Windows: netstat -ano | findstr :3001
# Mac/Linux: lsof -i :3001
```

### Error: "Cannot find module..."
```bash
# Clear cache and reinstall
rm -rf node_modules app/node_modules server/node_modules package-lock.json
npm install && npm --workspace app install && npm --workspace server install
```

### Backend not connecting
- Check that port 4000 is free
- Ensure backend shows "listening on http://localhost:4000"
- Frontend will auto-retry connection

---

## 🛑 Stopping the Application

Press `CTRL+C` in terminal to stop both servers

---

## 📚 More Help

See full setup details in `SETUP_GUIDE.md`
