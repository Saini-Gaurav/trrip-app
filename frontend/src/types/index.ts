// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ─── Document ────────────────────────────────────────────────────────────────
export interface TravelDocument {
  _id: string;
  userId: string;
  originalName: string;
  s3Url: string;
  fileType: 'pdf' | 'image';
  mimeType: string;
  fileSize: number;
  extractedText?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// ─── Itinerary ───────────────────────────────────────────────────────────────
export interface ItineraryActivity {
  time?: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'activity' | 'transport' | 'meal' | 'other';
  duration?: string;
  cost?: string;
  bookingRef?: string;
}

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

export interface Itinerary {
  _id: string;
  userId: string;
  title: string;
  documentIds: string[];
  extractedData: {
    flights: FlightInfo[];
    hotels: HotelInfo[];
    travelerName?: string;
    destinations: string[];
  };
  days: ItineraryDay[];
  summary: string;
  tips: string[];
  totalDays: number;
  destinations: string[];
  startDate?: string;
  endDate?: string;
  shareToken: string;
  isShared: boolean;
  sharedAt?: string;
  createdAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
