import { Request, Response, NextFunction } from 'express';
import { itineraryService } from '../services/itineraryService';
import { AuthRequest } from '../types';

export class ItineraryController {
  async generate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { documentIds } = req.body;
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        res.status(400).json({ success: false, message: 'documentIds array is required' });
        return;
      }

      const itinerary = await itineraryService.generateItinerary(req.user!.id, documentIds);

      res.status(201).json({
        success: true,
        message: 'Itinerary generated successfully',
        data: { itinerary },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { itineraries, total } = await itineraryService.getUserItineraries(
        req.user!.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Itineraries retrieved',
        data: {
          itineraries,
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const itinerary = await itineraryService.getItineraryById(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({ success: true, message: 'Itinerary retrieved', data: { itinerary } });
    } catch (error) {
      next(error);
    }
  }

  async getShared(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const itinerary = await itineraryService.getSharedItinerary(req.params.token);
      res.status(200).json({ success: true, message: 'Shared itinerary retrieved', data: { itinerary } });
    } catch (error) {
      next(error);
    }
  }

  async toggleShare(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isShared } = req.body;
      const itinerary = await itineraryService.toggleShare(
        req.params.id,
        req.user!.id,
        Boolean(isShared)
      );
      res.status(200).json({
        success: true,
        message: isShared ? 'Itinerary is now public' : 'Itinerary sharing disabled',
        data: { itinerary },
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await itineraryService.deleteItinerary(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Itinerary deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const itineraryController = new ItineraryController();
