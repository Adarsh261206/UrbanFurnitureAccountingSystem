import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { xssSanitizer } from './middleware/xss';
import { securityHeaders } from './middleware/security';

import authRoutes from './routes/auth';
import masterRoutes from './routes/index';
import journalEntryRoutes from './routes/journalEntries';
import salesOrderRoutes from './routes/salesOrders';
import purchaseOrderRoutes from './routes/purchaseOrders';
import invoiceRoutes from './routes/invoices';
import billRoutes from './routes/bills';
import paymentRoutes from './routes/payments';
import budgetRoutes from './routes/budgets';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';

const app = express();

app.use(helmet());
app.use(securityHeaders);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / server-to-server requests (no Origin header) and configured origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(xssSanitizer);
app.use('/api', apiLimiter);
// Uploaded images are loaded cross-origin by the frontend (localhost:5173).
// The global security middleware sets CORP: same-origin, which would block
// every <img> served from /uploads. Override to same-site for this route
// only — same-site still blocks arbitrary external sites, so the rest of
// the app keeps the strict same-origin policy.
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
  },
  express.static(path.join(__dirname, '..', 'uploads')),
);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', masterRoutes);
app.use('/api/v1/journal-entries', journalEntryRoutes);
app.use('/api/v1/sales-orders', salesOrderRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/bills', billRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.use(errorHandler);

export default app;
