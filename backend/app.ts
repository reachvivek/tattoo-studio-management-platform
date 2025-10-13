import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import leadRoutes from './routes/lead.routes';
import uploadRoutes from './routes/upload.routes';
import analyticsRoutes from './routes/analytics.routes';
import analyticsDetailedRoutes from './routes/analytics-detailed.routes';
import authRoutes from './routes/auth.routes';
import imageRoutes from './routes/image.routes';
import emailTestRoutes from './routes/email-test.routes';
import queueMonitorRoutes from './routes/queue-monitor.routes';
import emailQueueRoutes from './routes/email-queue.routes';
import { errorHandler } from './middleware/error-handler';
import { logger } from './middleware/logger';

const app: Express = express();

// Middleware - CORS configuration
const allowedOrigins = [
  'https://gratis-tattoo.vercel.app',
  'http://localhost:4200',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now (remove in strict production)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));

// Body parser with increased limits for image uploads (after compression: max 2MB per file, 5 files = 10MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/leads`, leadRoutes);
app.use(`${apiPrefix}/upload`, uploadRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/analytics-detailed`, analyticsDetailedRoutes);
app.use(`${apiPrefix}/images`, imageRoutes);  // Blob endpoint for images
app.use(`${apiPrefix}/email-test`, emailTestRoutes);  // Email testing endpoints
app.use(`${apiPrefix}/queue`, queueMonitorRoutes);  // Queue monitoring endpoints
app.use(`${apiPrefix}/email-queue`, emailQueueRoutes);  // Email queue management endpoints

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Rico Tattoo Artist API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: `${apiPrefix}/auth`,
      leads: `${apiPrefix}/leads`,
      upload: `${apiPrefix}/upload`,
      analytics: `${apiPrefix}/analytics`,
      images: `${apiPrefix}/images`,
      emailTest: `${apiPrefix}/email-test`,
      queue: `${apiPrefix}/queue`,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
