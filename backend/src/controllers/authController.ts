import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../types';

const REFRESH_COOKIE = 'trrip_refresh';

const cookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,                                       // Not accessible via JS
  secure: process.env.NODE_ENV === 'production',        // HTTPS only in prod
  sameSite: 'strict' as const,
  maxAge: maxAgeSeconds * 1000,                         // ms
  path: '/api/auth',                                    // Scoped: only sent to auth routes
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const { user, tokens } = await authService.register(name, email, password);

      res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenTtlSeconds));

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user,
          accessToken: tokens.accessToken,
          // refreshToken intentionally NOT in body — it lives in httpOnly cookie
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);

      res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenTtlSeconds));

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
          user,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

      if (!rawRefreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token not found.',
          code: 'NO_REFRESH_TOKEN',
        });
        return;
      }

      // userId comes from the expired access token's claim (sent in body by frontend)
      const { userId } = req.body as { userId?: string };
      if (!userId) {
        res.status(400).json({ success: false, message: 'userId is required.' });
        return;
      }

      const { accessToken, newRefreshToken, refreshTokenTtlSeconds } =
        await authService.refresh(userId, rawRefreshToken);

      // Rotate the cookie
      res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions(refreshTokenTtlSeconds));

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed',
        data: { accessToken },
      });
    } catch (error) {
      // Clear bad cookie so client doesn't loop
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Profile retrieved',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      await authService.logout(req.user!.id, rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
