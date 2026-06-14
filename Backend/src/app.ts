import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import tasksRoutes from './routes/tasks.routes';
import classesRoutes from './routes/classes.routes';
import examsRoutes from './routes/exams.routes';
import notificationsRoutes from './routes/notifications.routes';
import messagesRoutes from './routes/messages.routes';
import submissionsRoutes from './routes/submissions.routes';
import sessionsRoutes from './routes/sessions.routes';
import contentRoutes from './routes/content.routes';
import reportsRoutes from './routes/reports.routes';
import { sendError } from './utils/api-response';

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ──────────────────────────────────────────────
// Security middleware
// ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...allowedOrigins],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use((req, res, next) => {
  const correlationId = req.header('x-correlation-id') || crypto.randomUUID();
  res.setHeader('x-correlation-id', correlationId);
  next();
});

// CORS - restrict to frontend origin
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ──────────────────────────────────────────────
// Rate limiting
// ──────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 20, // Increased for dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 2000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', generalLimiter);

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reports', reportsRoutes);

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ──────────────────────────────────────────────
// 404 handler
// ──────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, 'Endpoint not found');
});

// ──────────────────────────────────────────────
// Global error handler
// ──────────────────────────────────────────────
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'
    : err.message;

  sendError(res, status, message);
});

export default app;
