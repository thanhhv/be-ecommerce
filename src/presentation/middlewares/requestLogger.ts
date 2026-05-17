import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/logger/logger';

const SENSITIVE_FIELDS = new Set(['password', 'token', 'accessToken', 'refreshToken', 'secret']);

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) => [k, SENSITIVE_FIELDS.has(k) ? '***' : v]),
  );
}

function resolveIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress ?? req.ip ?? 'unknown';
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startAt = process.hrtime.bigint();
  const startTime = new Date().toISOString();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level]('→ HTTP', {
      requestId: req.requestId,
      method: req.method,
      route: req.route?.path ?? req.path,
      url: req.originalUrl,
      statusCode,
      duration: `${durationMs.toFixed(2)}ms`,
      ip: resolveIp(req),
      userAgent: req.headers['user-agent'] ?? '-',
      userId: req.user?.id ?? null,
      query: Object.keys(req.query).length ? req.query : undefined,
      body:
        req.method !== 'GET' && req.body && Object.keys(req.body).length
          ? sanitizeBody(req.body as Record<string, unknown>)
          : undefined,
      contentLength: res.getHeader('content-length') ?? null,
      timestamp: startTime,
    });
  });

  next();
}
