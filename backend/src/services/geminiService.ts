import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { ExtractedBookingData, ItineraryDay, IDocument } from '../types';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Helper: strip any markdown fences and extract the first {...} JSON block
function parseJsonFromText(text: string): unknown {
  // 1. Try direct parse first
  try { return JSON.parse(text); } catch { /* fall through */ }

  // 2. Strip ```json ... ``` or ``` ... ``` fences
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(stripped); } catch { /* fall through */ }

  // 3. Extract the first { ... } block (handles extra prose before/after)
  const firstBrace = stripped.indexOf('{');
  const lastBrace  = stripped.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(stripped.slice(firstBrace, lastBrace + 1)); } catch { /* fall through */ }
  }

  throw new Error(`Could not extract JSON from Gemini response. Raw text:\n${text.slice(0, 500)}`);
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    this.genAI = new GoogleGenerativeAI(apiKey);
    // responseMimeType forces pure JSON output — no markdown wrapping
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      } as Record<string, unknown>,
    });
  }

  async extractBookingData(
    documents: Array<{ text: string; buffer?: Buffer; mimeType?: string; fileType: string }>
  ): Promise<ExtractedBookingData> {
    const parts: Part[] = [];

    const extractionPrompt = `You are a travel document parser. Analyze the following travel documents and extract ALL booking information.

Return ONLY valid JSON in this exact structure:
{
  "flights": [
    {
      "airline": "string",
      "flightNumber": "string",
      "departure": { "airport": "string", "city": "string", "time": "HH:MM", "date": "YYYY-MM-DD" },
      "arrival": { "airport": "string", "city": "string", "time": "HH:MM", "date": "YYYY-MM-DD" },
      "class": "Economy|Business|First",
      "bookingRef": "string",
      "passengerName": "string"
    }
  ],
  "hotels": [
    {
      "name": "string",
      "address": "string",
      "checkIn": "YYYY-MM-DD",
      "checkOut": "YYYY-MM-DD",
      "roomType": "string",
      "bookingRef": "string",
      "nights": 0
    }
  ],
  "travelerName": "string",
  "totalDays": 0,
  "destinations": ["city1", "city2"]
}

Documents to analyze:`;

    parts.push({ text: extractionPrompt });

    for (const doc of documents) {
      if (doc.text && doc.text.length > 50) {
        parts.push({ text: `\n\n--- Document Text ---\n${doc.text.substring(0, 8000)}` });
      }
      // Send buffer directly to Gemini for both images AND PDFs
      // Gemini Vision reads PDFs natively — much better than pdf-parse for scanned docs
      if (doc.buffer && doc.mimeType) {
        const supportedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (supportedMime.includes(doc.mimeType)) {
          parts.push({
            inlineData: {
              data: doc.buffer.toString('base64'),
              mimeType: doc.mimeType as 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp',
            },
          });
        }
      }
    }

    try {
      const result = await this.model.generateContent(parts);
      const text = result.response.text().trim();
      logger.debug('Gemini extraction raw response (first 300):', text.slice(0, 300));
      const parsed = parseJsonFromText(text) as ExtractedBookingData;
      return parsed;
    } catch (error) {
      logger.error('Gemini extraction error:', error);
      // Return empty structure — itinerary generation will still run with rawText
      return {
        flights: [],
        hotels: [],
        destinations: [],
        rawText: documents.map((d) => d.text).join('\n\n'),
      };
    }
  }

  async generateItinerary(
    extractedData: ExtractedBookingData,
    _documents: IDocument[]
  ): Promise<{
    title: string;
    days: ItineraryDay[];
    summary: string;
    tips: string[];
    totalDays: number;
    destinations: string[];
    startDate?: string;
    endDate?: string;
  }> {
    const dataString = JSON.stringify(extractedData, null, 2);

    const prompt = `You are an expert travel planner. Based on the following extracted travel booking data, create a comprehensive, detailed day-by-day travel itinerary.

Booking Data:
${dataString}

Return ONLY valid JSON in this exact structure:
{
  "title": "descriptive trip title e.g. Mumbai to Paris Adventure",
  "summary": "2-3 sentence engaging trip overview",
  "totalDays": 5,
  "destinations": ["city1", "city2"],
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "tips": [
    "practical travel tip 1",
    "practical travel tip 2",
    "practical travel tip 3",
    "practical travel tip 4",
    "practical travel tip 5"
  ],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Arrival and First Impressions",
      "location": "City Name",
      "accommodation": "Hotel Name if known",
      "meals": ["Breakfast suggestion", "Lunch suggestion", "Dinner suggestion"],
      "activities": [
        {
          "time": "09:00",
          "title": "Activity name",
          "description": "Detailed description of the activity",
          "type": "flight",
          "duration": "2 hours",
          "cost": "Free",
          "bookingRef": "ref if from booking"
        }
      ],
      "notes": "Special notes or tips for this day"
    }
  ]
}

Rules:
- type must be one of: flight, hotel, activity, transport, meal, other
- Create realistic detailed activities for each day based on the destinations
- Include actual flight times from the booking data as activities
- Include hotel check-in/check-out as activities
- Fill remaining time with popular tourist activities, meals, experiences
- If dates are unavailable use placeholder dates starting from today`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      logger.debug('Gemini itinerary raw response (first 300):', text.slice(0, 300));
      return parseJsonFromText(text) as ReturnType<typeof this.generateItinerary> extends Promise<infer T> ? T : never;
    } catch (error) {
      logger.error('Gemini itinerary generation error:', error);
      throw new AppError(
        `Failed to generate itinerary with AI: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    }
  }
}

export const geminiService = new GeminiService();

// import { GoogleGenerativeAI, Part } from '@google/generative-ai';
// import { ExtractedBookingData, ItineraryDay, IDocument } from '../types';
// import { AppError } from '../middleware/errorHandler';
// import logger from '../utils/logger';

// // Helper: strip any markdown fences and extract the first {...} JSON block
// function parseJsonFromText(text: string): unknown {
//   // 1. Try direct parse first
//   try { return JSON.parse(text); } catch { /* fall through */ }

//   // 2. Strip ```json ... ``` or ``` ... ``` fences
//   const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
//   try { return JSON.parse(stripped); } catch { /* fall through */ }

//   // 3. Extract the first { ... } block (handles extra prose before/after)
//   const firstBrace = stripped.indexOf('{');
//   const lastBrace  = stripped.lastIndexOf('}');
//   if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
//     try { return JSON.parse(stripped.slice(firstBrace, lastBrace + 1)); } catch { /* fall through */ }
//   }

//   throw new Error(`Could not extract JSON from Gemini response. Raw text:\n${text.slice(0, 500)}`);
// }

// export class GeminiService {
//   private genAI: GoogleGenerativeAI;
//   private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

//   constructor() {
//     const apiKey = process.env.GEMINI_API_KEY;
//     if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
//     this.genAI = new GoogleGenerativeAI(apiKey);
//     // responseMimeType forces pure JSON output — no markdown wrapping
//     this.model = this.genAI.getGenerativeModel({
//       model: 'gemini-2.5-flash',
//       generationConfig: {
//         responseMimeType: 'application/json',
//       } as Record<string, unknown>,
//     });
//   }

//   async extractBookingData(
//     documents: Array<{ text: string; buffer?: Buffer; mimeType?: string; fileType: string }>
//   ): Promise<ExtractedBookingData> {
//     const parts: Part[] = [];

//     const extractionPrompt = `You are a travel document parser. Analyze the following travel documents and extract ALL booking information.

// Return ONLY valid JSON in this exact structure:
// {
//   "flights": [
//     {
//       "airline": "string",
//       "flightNumber": "string",
//       "departure": { "airport": "string", "city": "string", "time": "HH:MM", "date": "YYYY-MM-DD" },
//       "arrival": { "airport": "string", "city": "string", "time": "HH:MM", "date": "YYYY-MM-DD" },
//       "class": "Economy|Business|First",
//       "bookingRef": "string",
//       "passengerName": "string"
//     }
//   ],
//   "hotels": [
//     {
//       "name": "string",
//       "address": "string",
//       "checkIn": "YYYY-MM-DD",
//       "checkOut": "YYYY-MM-DD",
//       "roomType": "string",
//       "bookingRef": "string",
//       "nights": 0
//     }
//   ],
//   "travelerName": "string",
//   "totalDays": 0,
//   "destinations": ["city1", "city2"]
// }

// Documents to analyze:`;

//     parts.push({ text: extractionPrompt });

//     for (const doc of documents) {
//       if (doc.text && doc.text.length > 50) {
//         parts.push({ text: `\n\n--- Document Text ---\n${doc.text.substring(0, 8000)}` });
//       }
//       if (doc.buffer && doc.mimeType && doc.fileType === 'image') {
//         parts.push({
//           inlineData: {
//             data: doc.buffer.toString('base64'),
//             mimeType: doc.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
//           },
//         });
//       }
//     }

//     try {
//       const result = await this.model.generateContent(parts);
//       const text = result.response.text().trim();
//       logger.debug('Gemini extraction raw response (first 300):', text.slice(0, 300));
//       const parsed = parseJsonFromText(text) as ExtractedBookingData;
//       return parsed;
//     } catch (error) {
//       logger.error('Gemini extraction error:', error);
//       // Return empty structure — itinerary generation will still run with rawText
//       return {
//         flights: [],
//         hotels: [],
//         destinations: [],
//         rawText: documents.map((d) => d.text).join('\n\n'),
//       };
//     }
//   }

//   async generateItinerary(
//     extractedData: ExtractedBookingData,
//     _documents: IDocument[]
//   ): Promise<{
//     title: string;
//     days: ItineraryDay[];
//     summary: string;
//     tips: string[];
//     totalDays: number;
//     destinations: string[];
//     startDate?: string;
//     endDate?: string;
//   }> {
//     const dataString = JSON.stringify(extractedData, null, 2);

//     const prompt = `You are an expert travel planner. Based on the following extracted travel booking data, create a comprehensive, detailed day-by-day travel itinerary.

// Booking Data:
// ${dataString}

// Return ONLY valid JSON in this exact structure:
// {
//   "title": "descriptive trip title e.g. Mumbai to Paris Adventure",
//   "summary": "2-3 sentence engaging trip overview",
//   "totalDays": 5,
//   "destinations": ["city1", "city2"],
//   "startDate": "YYYY-MM-DD",
//   "endDate": "YYYY-MM-DD",
//   "tips": [
//     "practical travel tip 1",
//     "practical travel tip 2",
//     "practical travel tip 3",
//     "practical travel tip 4",
//     "practical travel tip 5"
//   ],
//   "days": [
//     {
//       "day": 1,
//       "date": "YYYY-MM-DD",
//       "title": "Arrival and First Impressions",
//       "location": "City Name",
//       "accommodation": "Hotel Name if known",
//       "meals": ["Breakfast suggestion", "Lunch suggestion", "Dinner suggestion"],
//       "activities": [
//         {
//           "time": "09:00",
//           "title": "Activity name",
//           "description": "Detailed description of the activity",
//           "type": "flight",
//           "duration": "2 hours",
//           "cost": "Free",
//           "bookingRef": "ref if from booking"
//         }
//       ],
//       "notes": "Special notes or tips for this day"
//     }
//   ]
// }

// Rules:
// - type must be one of: flight, hotel, activity, transport, meal, other
// - Create realistic detailed activities for each day based on the destinations
// - Include actual flight times from the booking data as activities
// - Include hotel check-in/check-out as activities
// - Fill remaining time with popular tourist activities, meals, experiences
// - If dates are unavailable use placeholder dates starting from today`;

//     try {
//       const result = await this.model.generateContent(prompt);
//       const text = result.response.text().trim();
//       logger.debug('Gemini itinerary raw response (first 300):', text.slice(0, 300));
//       return parseJsonFromText(text) as ReturnType<typeof this.generateItinerary> extends Promise<infer T> ? T : never;
//     } catch (error) {
//       logger.error('Gemini itinerary generation error:', error);
//       throw new AppError(
//         `Failed to generate itinerary with AI: ${error instanceof Error ? error.message : String(error)}`,
//         500
//       );
//     }
//   }
// }

// export const geminiService = new GeminiService();