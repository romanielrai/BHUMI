# AI Growth Systems - Enterprise AI Automation Platform

> **🚀 Production-Ready Full-Stack Application** | Zero Configuration | Click & Go Live

Enterprise AI automation platform for AI receptionists, missed call recovery, lead reactivation, and appointment setters.

---

## ⚡ QUICK START (30 seconds)

### Choose your method:

**Windows:** Double-click `RUN_ME_FIRST.bat`

**Mac/Linux:** `chmod +x run.sh && ./run.sh`

**Anywhere:** `npm run dev`

Then open: **http://localhost:3001**

✅ Done! You're live.

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **[CLICK_TO_RUN.md](CLICK_TO_RUN.md)** | 30-second startup |
| **[QUICKSTART.md](QUICKSTART.md)** | Essential commands |
| **[START.md](START.md)** | Step-by-step guide |
| **[COMPLETE_SETUP.md](COMPLETE_SETUP.md)** | Full technical details |

---

## 🎯 What You Get

- ✅ Complete working application (no setup needed)
- ✅ User authentication system (sign up/login)
- ✅ Personal dashboard with metrics
- ✅ Admin and SuperAdmin panels
- ✅ Lead management
- ✅ AI chatbot integration
- ✅ Voice call integration
- ✅ Role-based access control
- ✅ Beautiful responsive UI
- ✅ Production-ready code

---

## 🏗️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js | 15.2.3 |
| Frontend UI | React + TypeScript | 18.3.1 |
| Styling | Tailwind CSS | 3.4.4 |
| Backend | Express.js | 4.19.2 |
| Database | Prisma (In-memory) | 5.15.0 |
| Auth | JWT + NextAuth.js | 4.24.14 |
| AI | OpenAI Integration | 4.13.0 |
| Voice | Twilio Integration | 4.10.0 |

---

## 🔌 URLs After Starting

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:4000 |
| API Health | http://localhost:4000/api/health |

---

## 🔐 Test Credentials

```
Email:    superadmin@gmail.com
Password: AdminPass123!
```

Or create your own via Sign Up

---

## 📁 Project Structure

```bash
npm run build
```

## Docker

```bash
docker compose up --build
```

## API Highlights

- `POST /api/auth/login` — authenticate users
- `POST /api/leads` — capture qualified leads
- `GET /api/leads` — retrieve lead list
- `GET /api/dashboard` — dashboard metrics
- `POST /api/chatbot/conversation` — trained AI assistant
- `POST /api/voice/call` — Twilio voice call orchestration

## Database Schema

The Prisma schema includes models for:

- `User`, `Role`, `Permission`
- `Client`, `Lead`, `Appointment`, `Campaign`
- `Call`, `SMS`, `Email`
- `Subscription`, `Invoice`, `Payment`
- `ChatbotLog`, `VoiceLog`, `AuditLog`

## Notes

- Frontend routes are built for landing page, login, client dashboard, admin panel, and superadmin control center.
- AI assistant is trained using service descriptions and service context.
- The platform uses glassmorphism styling, premium animations, and a dark luxury theme.
