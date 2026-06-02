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
const app = express();

app.use(helmet());
app.use(cors({ 
  origin: process.env.FRONTEND_URL ?? ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true 
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/voice', voiceRoutes);

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
