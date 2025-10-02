import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import leadRoutes from './routes/lead.routes';
import uploadRoutes from './routes/upload.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middleware/error-handler';
import { logger } from './middleware/logger';

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(`${apiPrefix}/leads`, leadRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Rico Tattoo Artist API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      leads: `${apiPrefix}/leads`,
      upload: `${apiPrefix}/upload`,
      analytics: `${apiPrefix}/analytics`,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
