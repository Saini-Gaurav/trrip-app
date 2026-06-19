import { Types } from 'mongoose';
import { geminiService } from './geminiService';
import { documentService } from './documentService';
import { itineraryRepository } from '../repositories/itineraryRepository';
import { IItinerary } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ItineraryService {
  async generateItinerary(
    userId: string,
    documentIds: string[]
  ): Promise<IItinerary> {
    if (!documentIds.length) {
      throw new AppError('At least one document is required', 400);
    }

    // Fetch documents with buffers
    const docsWithBuffers = await documentService.getDocumentsWithBuffers(documentIds, userId);

    if (!docsWithBuffers.length) {
      throw new AppError('No valid documents found', 404);
    }

    // Extract booking data using Gemini
    const extractedData = await geminiService.extractBookingData(
      docsWithBuffers.map((d) => ({
        text: d.text,
        buffer: d.buffer,
        mimeType: d.mimeType,
        fileType: d.fileType,
      }))
    );

    // Store raw text for reference
    extractedData.rawText = docsWithBuffers.map((d) => d.text).join('\n\n---\n\n');

    // Generate full itinerary
    const generated = await geminiService.generateItinerary(
      extractedData,
      docsWithBuffers.map((d) => d.doc)
    );

    // Save to DB
    const itinerary = await itineraryRepository.create({
      userId: new Types.ObjectId(userId),
      title: generated.title,
      documentIds: documentIds.map((id) => new Types.ObjectId(id)),
      extractedData,
      days: generated.days,
      summary: generated.summary,
      tips: generated.tips,
      totalDays: generated.totalDays,
      destinations: generated.destinations,
      startDate: generated.startDate,
      endDate: generated.endDate,
    });

    return itinerary;
  }

  async getUserItineraries(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ itineraries: IItinerary[]; total: number }> {
    return itineraryRepository.findByUserId(userId, page, limit);
  }

  async getItineraryById(id: string, userId: string): Promise<IItinerary> {
    const itinerary = await itineraryRepository.findByIdAndUserId(id, userId);
    if (!itinerary) throw new AppError('Itinerary not found', 404);
    return itinerary;
  }

  async getSharedItinerary(shareToken: string): Promise<IItinerary> {
    const itinerary = await itineraryRepository.findByShareToken(shareToken);
    if (!itinerary) throw new AppError('Shared itinerary not found or no longer available', 404);
    return itinerary;
  }

  async toggleShare(
    id: string,
    userId: string,
    isShared: boolean
  ): Promise<IItinerary> {
    const itinerary = await itineraryRepository.updateShareStatus(id, userId, isShared);
    if (!itinerary) throw new AppError('Itinerary not found', 404);
    return itinerary;
  }

  async deleteItinerary(id: string, userId: string): Promise<void> {
    const deleted = await itineraryRepository.deleteById(id, userId);
    if (!deleted) throw new AppError('Itinerary not found', 404);
  }
}

export const itineraryService = new ItineraryService();
