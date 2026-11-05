import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { env } from './config/env';
import { getDbStatus } from './config/database';
import { getMqttStatus } from './services/mqtt/mqttService';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: '*', // Allow development dashboard
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // General rate limiter
  app.use(apiLimiter);

  // System Health Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    const mqttStatus = getMqttStatus();

    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          connected: dbStatus.connected,
          mode: dbStatus.isInMemory ? 'IN_MEMORY_FALLBACK' : 'MONGODB_CONNECTED',
          uri: dbStatus.isInMemory ? 'memory://internal' : dbStatus.uri
        },
        mqtt: {
          connected: mqttStatus.connected,
          broker: mqttStatus.brokerUrl
        }
      }
    });
  });

  // REST API Routes
  app.use(env.API_PREFIX, routes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
      }
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

