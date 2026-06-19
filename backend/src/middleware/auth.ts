import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, name: decoded.name };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // Frontend interceptor looks for this code to trigger a silent refresh
      res.status(401).json({
        success: false,
        message: 'Access token expired.',
        code: 'TOKEN_EXPIRED',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error.',
        code: 'AUTH_ERROR',
      });
    }
  }
};
