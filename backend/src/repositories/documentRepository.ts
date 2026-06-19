import { Types } from 'mongoose';
import { TravelDocument } from '../models/Document';
import { IDocument } from '../types';

export class DocumentRepository {
  async create(data: {
    userId: Types.ObjectId | string;
    originalName: string;
    s3Key: string;
    s3Url: string;
    fileType: 'pdf' | 'image';
    mimeType: string;
    fileSize: number;
  }): Promise<IDocument> {
    const doc = new TravelDocument(data);
    return doc.save();
  }

  async findByUserId(
    userId: string | Types.ObjectId,
    page = 1,
    limit = 10
  ): Promise<{ documents: IDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      TravelDocument.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      TravelDocument.countDocuments({ userId }),
    ]);
    return { documents, total };
  }

  async findById(id: string | Types.ObjectId): Promise<IDocument | null> {
    return TravelDocument.findById(id).exec();
  }

  async findByIdAndUserId(
    id: string | Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<IDocument | null> {
    return TravelDocument.findOne({ _id: id, userId }).exec();
  }

  async updateStatus(
    id: string | Types.ObjectId,
    status: IDocument['processingStatus'],
    extractedText?: string
  ): Promise<IDocument | null> {
    const updateData: Partial<IDocument> = { processingStatus: status };
    if (extractedText !== undefined) updateData.extractedText = extractedText;
    return TravelDocument.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteById(id: string | Types.ObjectId): Promise<boolean> {
    const result = await TravelDocument.findByIdAndDelete(id).exec();
    return !!result;
  }

  async findManyByIds(ids: (string | Types.ObjectId)[]): Promise<IDocument[]> {
    return TravelDocument.find({ _id: { $in: ids } }).exec();
  }
}

export const documentRepository = new DocumentRepository();
