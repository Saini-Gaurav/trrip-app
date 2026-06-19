import { Types } from 'mongoose';
import { Itinerary } from '../models/Itinerary';
import { IItinerary } from '../types';

export class ItineraryRepository {
  async create(data: Partial<IItinerary>): Promise<IItinerary> {
    const itinerary = new Itinerary(data);
    return itinerary.save();
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 10
  ): Promise<{ itineraries: IItinerary[]; total: number }> {
    const skip = (page - 1) * limit;
    const [itineraries, total] = await Promise.all([
      Itinerary.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-extractedData.rawText')
        .exec(),
      Itinerary.countDocuments({ userId }),
    ]);
    return { itineraries, total };
  }

  async findByIdAndUserId(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IItinerary | null> {
    return Itinerary.findOne({ _id: id, userId }).exec();
  }

  async findByShareToken(shareToken: string): Promise<IItinerary | null> {
    return Itinerary.findOne({ shareToken, isShared: true }).exec();
  }

  async updateShareStatus(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    isShared: boolean
  ): Promise<IItinerary | null> {
    return Itinerary.findOneAndUpdate(
      { _id: id, userId },
      { isShared, sharedAt: isShared ? new Date() : undefined },
      { new: true }
    ).exec();
  }

  async deleteById(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<boolean> {
    const result = await Itinerary.findOneAndDelete({ _id: id, userId }).exec();
    return !!result;
  }

  async findById(id: string | Types.ObjectId): Promise<IItinerary | null> {
    return Itinerary.findById(id).exec();
  }
}

export const itineraryRepository = new ItineraryRepository();
