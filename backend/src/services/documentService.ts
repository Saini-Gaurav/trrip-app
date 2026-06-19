import { Types } from 'mongoose';
import { s3Service } from './s3Service';
import { extractionService } from './extractionService';
import { documentRepository } from '../repositories/documentRepository';
import { IDocument } from '../types';
import { AppError } from '../middleware/errorHandler';

export class DocumentService {
  async uploadDocument(
    userId: string,
    file: Express.Multer.File
  ): Promise<IDocument> {
    // Upload to S3
    const { s3Key, s3Url } = await s3Service.uploadFile(userId, file);

    // Determine file type
    const fileType: 'pdf' | 'image' = file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    // Create DB record
    const doc = await documentRepository.create({
      userId: new Types.ObjectId(userId),
      originalName: file.originalname,
      s3Key,
      s3Url,
      fileType,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    // Extract text asynchronously
    this.processDocumentAsync(doc._id.toString(), file.buffer, file.mimetype);

    return doc;
  }

  private async processDocumentAsync(
    docId: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<void> {
    try {
      await documentRepository.updateStatus(docId, 'processing');
      const { text } = await extractionService.extractTextFromBuffer(buffer, mimeType);
      await documentRepository.updateStatus(docId, 'completed', text);
    } catch (error) {
      console.error(`Failed to process document ${docId}:`, error);
      await documentRepository.updateStatus(docId, 'failed');
    }
  }

  async getDocumentsByUser(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ documents: IDocument[]; total: number }> {
    return documentRepository.findByUserId(userId, page, limit);
  }

  async getDocumentById(
    docId: string,
    userId: string
  ): Promise<IDocument> {
    const doc = await documentRepository.findByIdAndUserId(docId, userId);
    if (!doc) throw new AppError('Document not found', 404);
    return doc;
  }

  async deleteDocument(docId: string, userId: string): Promise<void> {
    const doc = await documentRepository.findByIdAndUserId(docId, userId);
    if (!doc) throw new AppError('Document not found', 404);

    // Delete from S3
    await s3Service.deleteFile(doc.s3Key);

    // Delete from DB
    await documentRepository.deleteById(docId);
  }

  async getSignedUrl(docId: string, userId: string): Promise<string> {
    const doc = await documentRepository.findByIdAndUserId(docId, userId);
    if (!doc) throw new AppError('Document not found', 404);
    return s3Service.getSignedDownloadUrl(doc.s3Key);
  }

  async getDocumentsWithBuffers(
    docIds: string[],
    userId: string
  ): Promise<
    Array<{
      doc: IDocument;
      buffer?: Buffer;
      text: string;
      mimeType: string;
      fileType: string;
    }>
  > {
    const results = [];

    for (const docId of docIds) {
      const doc = await documentRepository.findByIdAndUserId(docId, userId);
      if (!doc) continue;

      let buffer: Buffer | undefined;

      // Fetch buffer for BOTH images and PDFs so Gemini can read them directly
      try {
        buffer = await s3Service.getFileBuffer(doc.s3Key);
      } catch {
        // continue without buffer — text fallback will be used
      }

      results.push({
        doc,
        buffer,
        text: doc.extractedText || '',
        mimeType: doc.mimeType,
        fileType: doc.fileType,
      });
    }

    return results;
  }
}

export const documentService = new DocumentService();

// import { Types } from 'mongoose';
// import { s3Service } from './s3Service';
// import { extractionService } from './extractionService';
// import { documentRepository } from '../repositories/documentRepository';
// import { IDocument } from '../types';
// import { AppError } from '../middleware/errorHandler';

// export class DocumentService {
//   async uploadDocument(
//     userId: string,
//     file: Express.Multer.File
//   ): Promise<IDocument> {
//     // Upload to S3
//     const { s3Key, s3Url } = await s3Service.uploadFile(userId, file);

//     // Determine file type
//     const fileType: 'pdf' | 'image' = file.mimetype === 'application/pdf' ? 'pdf' : 'image';

//     // Create DB record
//     const doc = await documentRepository.create({
//       userId: new Types.ObjectId(userId),
//       originalName: file.originalname,
//       s3Key,
//       s3Url,
//       fileType,
//       mimeType: file.mimetype,
//       fileSize: file.size,
//     });

//     // Extract text asynchronously
//     this.processDocumentAsync(doc._id.toString(), file.buffer, file.mimetype);

//     return doc;
//   }

//   private async processDocumentAsync(
//     docId: string,
//     buffer: Buffer,
//     mimeType: string
//   ): Promise<void> {
//     try {
//       await documentRepository.updateStatus(docId, 'processing');
//       const { text } = await extractionService.extractTextFromBuffer(buffer, mimeType);
//       await documentRepository.updateStatus(docId, 'completed', text);
//     } catch (error) {
//       console.error(`Failed to process document ${docId}:`, error);
//       await documentRepository.updateStatus(docId, 'failed');
//     }
//   }

//   async getDocumentsByUser(
//     userId: string,
//     page: number,
//     limit: number
//   ): Promise<{ documents: IDocument[]; total: number }> {
//     return documentRepository.findByUserId(userId, page, limit);
//   }

//   async getDocumentById(
//     docId: string,
//     userId: string
//   ): Promise<IDocument> {
//     const doc = await documentRepository.findByIdAndUserId(docId, userId);
//     if (!doc) throw new AppError('Document not found', 404);
//     return doc;
//   }

//   async deleteDocument(docId: string, userId: string): Promise<void> {
//     const doc = await documentRepository.findByIdAndUserId(docId, userId);
//     if (!doc) throw new AppError('Document not found', 404);

//     // Delete from S3
//     await s3Service.deleteFile(doc.s3Key);

//     // Delete from DB
//     await documentRepository.deleteById(docId);
//   }

//   async getSignedUrl(docId: string, userId: string): Promise<string> {
//     const doc = await documentRepository.findByIdAndUserId(docId, userId);
//     if (!doc) throw new AppError('Document not found', 404);
//     return s3Service.getSignedDownloadUrl(doc.s3Key);
//   }

//   async getDocumentsWithBuffers(
//     docIds: string[],
//     userId: string
//   ): Promise<
//     Array<{
//       doc: IDocument;
//       buffer?: Buffer;
//       text: string;
//       mimeType: string;
//       fileType: string;
//     }>
//   > {
//     const results = [];

//     for (const docId of docIds) {
//       const doc = await documentRepository.findByIdAndUserId(docId, userId);
//       if (!doc) continue;

//       let buffer: Buffer | undefined;

//       if (doc.fileType === 'image') {
//         try {
//           buffer = await s3Service.getFileBuffer(doc.s3Key);
//         } catch {
//           // continue without buffer
//         }
//       }

//       results.push({
//         doc,
//         buffer,
//         text: doc.extractedText || '',
//         mimeType: doc.mimeType,
//         fileType: doc.fileType,
//       });
//     }

//     return results;
//   }
// }

// export const documentService = new DocumentService();
