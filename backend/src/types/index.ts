import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  cookies: Record<string, string>;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────
export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

// ─── Document Upload ─────────────────────────────────────────────────────────
export interface IDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  originalName: string;
  s3Key: string;
  s3Url: string;
  fileType: 'pdf' | 'image';
  mimeType: string;
  fileSize: number;
  extractedText?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// ─── Itinerary ───────────────────────────────────────────────────────────────
export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  location: string;
  activities: ItineraryActivity[];
  accommodation?: string;
  meals?: string[];
  notes?: string;
}

export interface ItineraryActivity {
  time?: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'activity' | 'transport' | 'meal' | 'other';
  duration?: string;
  cost?: string;
  bookingRef?: string;
}

export interface FlightInfo {
  airline?: string;
  flightNumber?: string;
  departure: { airport?: string; city?: string; time?: string; date?: string };
  arrival: { airport?: string; city?: string; time?: string; date?: string };
  class?: string;
  bookingRef?: string;
  passengerName?: string;
}

export interface HotelInfo {
  name?: string;
  address?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  bookingRef?: string;
  nights?: number;
}

export interface ExtractedBookingData {
  flights: FlightInfo[];
  hotels: HotelInfo[];
  travelerName?: string;
  totalDays?: number;
  destinations: string[];
  rawText?: string;
}

export interface IItinerary extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  documentIds: Types.ObjectId[];
  extractedData: ExtractedBookingData;
  days: ItineraryDay[];
  summary: string;
  tips: string[];
  totalDays: number;
  destinations: string[];
  startDate?: string;
  endDate?: string;
  shareToken: string;
  isShared: boolean;
  sharedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}