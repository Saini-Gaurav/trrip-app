import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = format;

// Human-readable console format
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console — pretty in dev, JSON in prod
    new transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(timestamp(), json())
          : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),
    // Rotating file for errors
    new transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // All logs combined
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: combine(timestamp(), json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
});

export default logger;
