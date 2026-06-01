# AI Growth Systems - Setup & Troubleshooting Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- PostgreSQL (or Docker)

### Installation

1. **Install Dependencies**
```bash
npm install
npm --workspace app install
npm --workspace server install
```

2. **Configure Environment Variables**

**For Frontend** (`app/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**For Backend** (`server/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_growth_systems
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Optional AI Services
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
ELEVENLABS_API_KEY=your-elevenlabs-key
```

3. **Database Setup**
```bash
# Push Prisma schema to database
npm --workspace server exec prisma db push

# (Optional) Seed with sample data
npm --workspace server run ts-node server/prisma/seed.ts
```

4. **Start Development Servers**

**Terminal 1 - Backend:**
```bash
npm --workspace server run dev
# Backend runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
npm --workspace app run dev
# Frontend runs on http://localhost:3000
```

### Verify Setup
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Health Check: http://localhost:4000/api/health

## Authentication Flow

### Test Registration
1. Navigate to http://localhost:3000/login
2. Click "Sign Up"
3. Enter credentials:
   - Email: test@example.com
   - Password: Test123!
   - Name: Test User
   - Business: Test Business
   - Phone: 1234567890
4. Click "Sign Up"

### Test Login
1. After registration, you'll be auto-logged in
2. Token is stored in localStorage
3. Dashboard should load with mock data

## User Roles

- **CLIENT**: Standard user with access to dashboard
- **ADMIN**: Full access to admin panel + dashboard
- **SUPERADMIN**: Full system access
- **USER**: Limited access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Dashboard
- `GET /api/dashboard` - Get metrics (requires auth)

### Leads
- `GET /api/leads?clientId=xxx` - List leads (requires auth)
- `POST /api/leads` - Create lead (public)

### Chatbot
- `POST /api/chatbot/conversation` - AI assistant chat

### Voice
- `POST /api/voice/call` - Initiate voice call

## Troubleshooting

### "Failed to execute 'json' on 'Response': Unexpected token" Error
**Solution**: 
- Ensure backend is running on port 4000
- Check `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`
- Verify API proxy routes exist in `app/app/api/`

### Cannot connect to database
**Solution**:
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Run `npm --workspace server exec prisma db push`

### Login fails with "Invalid credentials"
**Solution**:
- Use test credentials: `admin@aigrowthsystems.com` / `AdminPass123!`
- Or register new account via signup form
- Check that mock database roles match (ADMIN, CLIENT, etc.)

### API returns 401 Unauthorized
**Solution**:
- Token may be expired or malformed
- Clear localStorage and login again
- Check JWT_SECRET matches between frontend & backend

### Build errors with TypeScript
**Solution**:
- Run `npm run build` to verify compilation
- Check that all API routes are created correctly
- Ensure environment variables are set before build

## Docker Deployment

### Local with Docker Compose
```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Express API backend
- Next.js frontend

### Production Build
```bash
npm run build
npm --workspace app run build
npm --workspace server run build
```

## Common Development Tasks

### Adding a New API Route

**Backend** (`server/src/routes/new-feature.ts`):
```typescript
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  // Your logic here
  res.json({ success: true });
});

export default router;
```

Add to `server/src/index.ts`:
```typescript
app.use('/api/new-feature', newFeatureRoutes);
```

**Frontend** (`app/app/api/new-feature/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${API_URL}/new-feature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
```

### Debugging Backend
- Check logs in terminal where `npm run dev` is running
- Enable verbose logging: `DEBUG=*`
- Test endpoints with curl or Postman

### Debugging Frontend
- Use React DevTools browser extension
- Check Network tab for API calls
- View localStorage for token/user data

## Performance Tips

1. **Database**: Add indexes for frequently queried fields
2. **API**: Enable caching headers for static content
3. **Frontend**: Use Next.js Image optimization
4. **Monitoring**: Set up error tracking (Sentry, LogRocket)

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Change `NEXTAUTH_SECRET` in production
- [ ] Enable HTTPS in production
- [ ] Set up rate limiting on API
- [ ] Add CORS restrictions in production
- [ ] Rotate API keys regularly
- [ ] Use environment variable vault

## Support

For issues or questions:
1. Check this troubleshooting guide first
2. Review error logs in terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
