import mongoose, { Schema } from 'mongoose';
import { IRefreshToken } from '../types';

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL — auto-deletes expired tokens
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const RefreshToken = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);
