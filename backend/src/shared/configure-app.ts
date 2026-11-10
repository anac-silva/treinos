import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { json, NextFunction, Response } from 'express';
import { APP_CONFIG, AppConfig } from './config';
import { HttpErrorsFilter } from './http-errors.filter';
import { AuthRequest } from '../modules/auth/auth-request';

export function configureApp(app: NestExpressApplication) {
  const config = app.get<AppConfig>(APP_CONFIG);
  const logger = new Logger('HTTP');
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(cookieParser());
  const filter = new HttpErrorsFilter();
  app.use((request: AuthRequest, response: Response, next: NextFunction) => {
    request.requestId = randomUUID();
    response.setHeader('X-Request-Id', request.requestId);
    response.setHeader('Cache-Control', 'no-store');
    const started = Date.now();
    response.on('finish', () => logger.log(JSON.stringify({ event: 'request.complete', requestId: request.requestId,
      method: request.method, route: (request.route as { path?: string } | undefined)?.path || 'unmatched',
      status: response.statusCode, durationMs: Date.now() - started })));
    next();
  });
  // CORS não substitui CSRF. Rejeita origens indevidas inclusive no login.
  app.use((request: AuthRequest, response: Response, next: NextFunction) => {
    const origin = request.get('origin');
    if (origin && !config.origins.includes(origin)) {
      response.status(403).json({ error: { code: 'ORIGIN_FORBIDDEN', message: 'Origem não autorizada.', requestId: request.requestId } });
      return;
    }
    if (config.production && !request.secure) {
      response.status(400).json({ error: { code: 'HTTPS_REQUIRED', message: 'HTTPS obrigatório.', requestId: request.requestId } });
      return;
    }
    next();
  });
  app.enableCors({ origin: config.origins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] });
  app.use(json({ limit: '16kb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
    validationError: { target: false, value: false }, forbidUnknownValues: true }));
  app.useGlobalFilters(filter);
}
