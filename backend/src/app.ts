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

const app = express();

app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(xssSanitizer);
app.use('/api', apiLimiter);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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

app.use(errorHandler);

export default app;
