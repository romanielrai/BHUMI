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
const superadminRoutes = require('./routes/superadmin').default;
const adminRoutes = require('./routes/admin').default;
const app = express();

app.use(helmet());
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5504',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5504'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  if (process.env.FRONTEND_URL.includes('localhost')) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace('localhost', '127.0.0.1'));
  } else if (process.env.FRONTEND_URL.includes('127.0.0.1')) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace('127.0.0.1', 'localhost'));
  }
}

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true 
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/voice', voiceRoutes);
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
