import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import logger from './utils/logger';
import paymentRoutes from './routes/payments';
import subscriptionRoutes from './routes/subscriptions';
import webhookRoutes from './routes/webhooks';
import { getBaseUrl, getFrontendUrl } from './utils/publicUrls';

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = !!process.env.VERCEL;

if (process.env.NODE_ENV === 'production') {
  try {
    getBaseUrl();
    getFrontendUrl();
  } catch (error: any) {
    logger.error('Configuração obrigatória ausente/ inválida para produção', {
      error: error?.message || String(error),
    });
    process.exit(1);
  }
}

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
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
      if (isLocal) return callback(null, true);
      console.log(`[CORS] Permitindo origem em desenvolvimento: ${origin}`);
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.error(`[CORS] Bloqueado para origem: ${origin}`);
    callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http('Requisicao HTTP', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      tenantId: (req as any).tenant?.id,
    });
  });

  next();
});

app.get('/api/health', (_req, res) => {
  logger.info('Endpoint de saude acessado');
  res.json({ status: 'OK', message: 'Backend de pagamentos do SORED esta em execucao' });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/logs', (_req, res) => {
    try {
      const logFiles = fs.readdirSync(path.join(process.cwd(), 'logs'));
      const logs: { [key: string]: string[] } = {};

      logFiles.forEach((file: string) => {
        if (file.endsWith('.log')) {
          const filePath = path.join(process.cwd(), 'logs', file);
          const content = fs.readFileSync(filePath, 'utf8');
          logs[file] = content.split('\n').slice(-50);
        }
      });

      res.json(logs);
    } catch {
      res.status(500).json({ error: 'Erro ao ler logs' });
    }
  });
}

app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Erro não tratado', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Ocorreu um erro interno do servidor.'
    : err.message || 'Erro interno do servidor';

  res.status(status).json({
    status: 'error',
    message,
  });
});

if (process.env.NODE_ENV !== 'test' && !isVercel) {
  app.listen(PORT, () => {
    logger.info('SORED Backend de pagamentos iniciado', { port: PORT, environment: process.env.NODE_ENV });
  });
}

export default app;
