import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IItinerary } from '../types';

const ActivitySchema = new Schema(
  {
    time: String,
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['flight', 'hotel', 'activity', 'transport', 'meal', 'other'],
      default: 'other',
    },
    duration: String,
    cost: String,
    bookingRef: String,
  },
  { _id: false }
);

const DaySchema = new Schema(
  {
    day: { type: Number, required: true },
    date: String,
    title: { type: String, required: true },
    location: { type: String, required: true },
    activities: [ActivitySchema],
    accommodation: String,
    meals: [String],
    notes: String,
  },
  { _id: false }
);

const FlightInfoSchema = new Schema(
  {
    airline: String,
    flightNumber: String,
    departure: {
      airport: String,
      city: String,
      time: String,
      date: String,
    },
    arrival: {
      airport: String,
      city: String,
      time: String,
      date: String,
    },
    class: String,
    bookingRef: String,
    passengerName: String,
  },
  { _id: false }
);

const HotelInfoSchema = new Schema(
  {
    name: String,
    address: String,
    checkIn: String,
    checkOut: String,
    roomType: String,
    bookingRef: String,
    nights: Number,
  },
  { _id: false }
);

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    documentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'TravelDocument',
      },
    ],
    extractedData: {
      flights: [FlightInfoSchema],
      hotels: [HotelInfoSchema],
      travelerName: String,
      totalDays: Number,
      destinations: [String],
      rawText: String,
    },
    days: [DaySchema],
    summary: {
      type: String,
      required: true,
    },
    tips: [String],
    totalDays: { type: Number, default: 0 },
    destinations: [String],
    startDate: String,
    endDate: String,
    shareToken: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    sharedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ItinerarySchema.index({ userId: 1, createdAt: -1 });

export const Itinerary = mongoose.model<IItinerary>('Itinerary', ItinerarySchema);
