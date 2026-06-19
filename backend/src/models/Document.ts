import mongoose, { Schema } from 'mongoose';
import { IDocument } from '../types';

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    s3Key: {
      type: String,
      required: true,
      unique: true,
    },
    s3Url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      default: null,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DocumentSchema.index({ userId: 1, createdAt: -1 });

export const TravelDocument = mongoose.model<IDocument>('TravelDocument', DocumentSchema);
