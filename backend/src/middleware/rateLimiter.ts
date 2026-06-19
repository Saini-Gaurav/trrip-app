import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

const handler = (route: string) =>
  (_req: unknown, res: { status: (n: number) => { json: (o: unknown) => void } }) => {
    logger.warn(`Rate limit hit on ${route}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again later.',
    });
  };

/** General API limiter — applied globally on /api */
export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('global'),
});

/** Auth routes — tight to prevent brute-force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                      // 10 attempts per window
  skipSuccessfulRequests: true, // only count failures
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('auth'),
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

/** Upload limiter — S3 uploads are expensive */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 20,                     // 20 uploads per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('upload'),
});

/** AI generation limiter — Gemini calls cost tokens */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 15,                     // 15 generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('ai-generate'),
  message: {
    success: false,
    message: 'AI generation limit reached. You can generate up to 15 itineraries per hour.',
  },
});
