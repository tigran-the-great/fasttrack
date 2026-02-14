import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';
import { router } from './routes/index.js';
import { healthRoutes } from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());

  const corsOptions = {
    origin: env.CORS_ORIGINS
      ? env.CORS_ORIGINS === '*'
        ? true
        : env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  };
  app.use(cors(corsOptions));

  app.use(compression());

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use((req, _res, next) => {
    req.headers['x-request-id'] = (req.headers['x-request-id'] as string) || uuidv4();
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      logger.info('Request completed', {
        requestId: req.headers['x-request-id'],
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${Date.now() - start}ms`,
      });
    });

    next();
  });

  app.use('/health', healthRoutes);

  if (env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'FastTrack API Documentation',
    }));

    app.get('/api-docs.json', (_req, res) => {
      res.json(swaggerSpec);
    });
  }

  app.use('/api/v1', router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
