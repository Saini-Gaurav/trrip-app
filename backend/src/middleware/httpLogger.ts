import morgan, { StreamOptions } from 'morgan';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// Pipe morgan output into winston
const stream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Skip health-check pings to keep logs clean
const skip = (req: Request) => {
  return req.url === '/health';
};

// Detailed token format for development
morgan.token('body', (req: Request) => {
  const body = { ...(req.body as Record<string, unknown>) };
  if (body.password) body.password = '[REDACTED]';
  return Object.keys(body).length ? JSON.stringify(body) : '-';
});

morgan.token('user-id', (req: Request & { user?: { id: string } }) => {
  return req.user?.id || 'anon';
});

const devFormat =
  ':method :url :status :res[content-length]b - :response-time ms | user=:user-id';

const prodFormat =
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

export const httpLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  { stream, skip }
);
