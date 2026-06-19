import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { RefreshToken } from '../models/RefreshToken';
import { IRefreshToken } from '../types';

export class RefreshTokenRepository {
  /** Store a hashed version of the raw token */
  async create(userId: string | Types.ObjectId, rawToken: string, ttlMs: number): Promise<void> {
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + ttlMs);
    await RefreshToken.create({ userId, tokenHash, expiresAt });
  }

  /** Find all non-expired tokens for a user and check each hash */
  async findValidToken(
    userId: string | Types.ObjectId,
    rawToken: string
  ): Promise<IRefreshToken | null> {
    const tokens = await RefreshToken.find({
      userId,
      expiresAt: { $gt: new Date() },
    }).exec();

    for (const t of tokens) {
      const match = await bcrypt.compare(rawToken, t.tokenHash);
      if (match) return t;
    }
    return null;
  }

  /** Delete a single token by its document _id */
  async deleteById(id: string | Types.ObjectId): Promise<void> {
    await RefreshToken.findByIdAndDelete(id).exec();
  }

  /** Delete ALL tokens for a user (logout-all / revoke-all) */
  async deleteAllForUser(userId: string | Types.ObjectId): Promise<void> {
    await RefreshToken.deleteMany({ userId }).exec();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
