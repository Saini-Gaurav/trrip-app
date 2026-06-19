import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUser } from '../types';
import { userRepository } from '../repositories/userRepository';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// ─── Token lifetimes ──────────────────────────────────────────────────────────
const ACCESS_TOKEN_TTL  = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const REFRESH_TOKEN_TTL_S  = 7 * 24 * 60 * 60;         // 7 days in seconds (for cookie)

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtlSeconds: number;
}

export class AuthService {
  // ── Access token (short-lived JWT, 15 min) ──────────────────────────────────
  private generateAccessToken(user: IUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    return jwt.sign(
      { id: user._id.toString(), email: user.email, name: user.name },
      secret,
      { expiresIn: ACCESS_TOKEN_TTL } as jwt.SignOptions
    );
  }

  // ── Refresh token (long-lived random string, 7 days) ───────────────────────
  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private async issueTokenPair(user: IUser): Promise<TokenPair> {
    const accessToken  = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Persist hashed refresh token so it can be validated + revoked
    await refreshTokenRepository.create(
      user._id.toString(),
      refreshToken,
      REFRESH_TOKEN_TTL_MS
    );

    return { accessToken, refreshToken, refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_S };
  }

  // ── Public methods ──────────────────────────────────────────────────────────
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; tokens: TokenPair }> {
    const exists = await userRepository.existsByEmail(email);
    if (exists) throw new AppError('Email already registered', 409);

    const user   = await userRepository.create({ name, email, password });
    const tokens = await this.issueTokenPair(user);

    logger.info(`New user registered: ${email}`);
    return { user, tokens };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const tokens = await this.issueTokenPair(user);
    logger.info(`User logged in: ${email}`);
    return { user, tokens };
  }

  async refresh(
    userId: string,
    rawRefreshToken: string
  ): Promise<{ accessToken: string; newRefreshToken: string; refreshTokenTtlSeconds: number }> {
    // Find & validate stored token
    const stored = await refreshTokenRepository.findValidToken(userId, rawRefreshToken);
    if (!stored) throw new AppError('Invalid or expired refresh token', 401);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 401);

    // Rotate: delete old token, issue new pair
    await refreshTokenRepository.deleteById(stored._id);
    const newRefreshToken = this.generateRefreshToken();
    await refreshTokenRepository.create(userId, newRefreshToken, REFRESH_TOKEN_TTL_MS);

    const accessToken = this.generateAccessToken(user);
    logger.debug(`Tokens rotated for user: ${userId}`);

    return { accessToken, newRefreshToken, refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_S };
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      // Revoke only this device's token
      const stored = await refreshTokenRepository.findValidToken(userId, rawRefreshToken);
      if (stored) await refreshTokenRepository.deleteById(stored._id);
    } else {
      // Fallback: revoke all tokens (logout from all devices)
      await refreshTokenRepository.deleteAllForUser(userId);
    }
    logger.info(`User logged out: ${userId}`);
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const authService = new AuthService();
