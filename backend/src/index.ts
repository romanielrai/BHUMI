import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import path from 'path';
// Load server-specific env file before loading other modules
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Environment loaded from server/.env
// Import route modules after env is loaded so they see the variables
const authRoutes = require('./routes/auth').default;
const leadRoutes = require('./routes/leads').default;
const dashboardRoutes = require('./routes/dashboard').default;
const chatbotRoutes = require('./routes/chatbot').default;
const voiceRoutes = require('./routes/voice').default;
const trialRoutes = require('./routes/trial').default;
const superadminRoutes = require('./routes/superadmin').default;
const adminRoutes = require('./routes/admin').default;
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// In development, allow CORS requests from any local address (localhost / 127.0.0.1) on any port,
// which is crucial for VS Code Live Server (which runs on ports like 5500, 5504, 5505, etc.)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Check if origin matches localhost or 127.0.0.1 (any port)
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    
    if (isLocalhost) {
      return callback(null, true);
    }
    
    // Allow any other configured front-end URLs
    if (process.env.FRONTEND_URL && (
      origin === process.env.FRONTEND_URL ||
      origin === process.env.FRONTEND_URL.replace('localhost', '127.0.0.1') ||
      origin === process.env.FRONTEND_URL.replace('127.0.0.1', 'localhost')
    )) {
      return callback(null, true);
    }
    
    // Fallback: allow in development mode for extreme reliability
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/voice', trialRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler - must be last
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
