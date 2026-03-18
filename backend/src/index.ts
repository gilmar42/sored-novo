import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { connectDB } from './config/database';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import materialRoutes from './routes/materials';
import laborRoutes from './routes/labor';
import machineRoutes from './routes/machines';
import budgetRoutes from './routes/budgets';
import pdfRoutes from './routes/pdf';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';
import subscriptionRoutes from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Em desenvolvimento, permitir qualquer origem local
    if (process.env.NODE_ENV !== 'production') {
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
      if (isLocal) return callback(null, true);
      
      // Permitir qualquer origem em desenvolvimento
      console.log(`[CORS] Permitindo origem em desenvolvimento: ${origin}`);
      return callback(null, true);
    }
    
    // Em produção, verificar origens permitidas
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    console.error(`[CORS] Bloqueado para origem: ${origin}`);
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging HTTP
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?._id,
      tenantId: (req as any).tenant?._id
    });
  });
  
  next();
});

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.get('/api/health', (req, res) => {
  logger.info('Health check hit');
  res.json({ status: 'OK', message: 'SORED Backend is running' });
});

// Middleware para garantir que o prefixo /api seja tratado corretamente
app.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  next();
});

// Endpoint para logs (apenas desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/logs', (req, res) => {
    try {
      const logFiles = fs.readdirSync(path.join(process.cwd(), 'logs'));
      const logs: { [key: string]: string[] } = {};

      logFiles.forEach((file: string) => {
        if (file.endsWith('.log')) {
          const filePath = path.join(process.cwd(), 'logs', file);
          const content = fs.readFileSync(filePath, 'utf8');
          logs[file] = content.split('\n').slice(-50); // últimas 50 linhas
        }
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao ler logs' });
    }
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/labor', laborRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Middleware de tratamento de erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Ocorreu um erro interno no servidor.' 
    : err.message || 'Erro interno do servidor';
    
  res.status(status).json({
    status: 'error',
    message
  });
});

app.listen(PORT, () => {
  logger.info('SORED Backend iniciado', { port: PORT, environment: process.env.NODE_ENV });
});

export default app;
