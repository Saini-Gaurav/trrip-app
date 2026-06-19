import { Response, NextFunction } from 'express';
import { documentService } from '../services/documentService';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export class DocumentController {
  async uploadDocuments(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const uploadedDocs = await Promise.all(
        files.map((file) => documentService.uploadDocument(req.user!.id, file))
      );

      res.status(201).json({
        success: true,
        message: `${uploadedDocs.length} document(s) uploaded successfully`,
        data: { documents: uploadedDocs },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocuments(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { documents, total } = await documentService.getDocumentsByUser(
        req.user!.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Documents retrieved',
        data: {
          documents,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await documentService.deleteDocument(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSignedUrl(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const url = await documentService.getSignedUrl(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Signed URL generated',
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
