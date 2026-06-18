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
const crmRoutes = require('./routes/crm').default;
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
    if (isLocalhost) return callback(null, true);

    // Allow production domains
    const allowedOrigins = [
      'https://portal.digihoodstudio.com',
      'https://www.digihoodstudio.com',
      'https://digihoodstudio.com',
    ];
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow Vercel preview deployments
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    
    // Allow any other configured front-end URLs from env
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // In non-production, allow all for dev reliability
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    return callback(new Error('CORS: Origin not allowed'));
  },
  credentials: true
}));
app.use(express.json());

// Track all API requests dynamically for dashboard metrics
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const { incrementApiCallCount } = require('./config-store');
    incrementApiCallCount();
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/voice', trialRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crm', crmRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/health.png', (req, res) => {
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': pixel.length
  });
  res.end(pixel);
});

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

import fs from 'fs';

const startPort = Number(process.env.PORT ?? 4000);
const startServer = (p: number) => {
  const server = app.listen(p, () => {
    console.log(`API server listening on http://localhost:${p}`);
    try {
      const portFilePath = path.resolve(__dirname, '../../backend_port.json');
      fs.writeFileSync(portFilePath, JSON.stringify({ port: p }), 'utf8');
      console.log(`Announced active backend port ${p} in backend_port.json`);
    } catch (err) {
      console.error('Failed to write backend_port.json:', err);
    }
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${p} is occupied. Trying port ${p + 1}...`);
      startServer(p + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(startPort);
