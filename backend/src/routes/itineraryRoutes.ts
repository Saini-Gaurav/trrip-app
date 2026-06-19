import { Router } from 'express';
import { itineraryController } from '../controllers/itineraryController';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public — shared itinerary (no auth needed)
router.get('/shared/:token', itineraryController.getShared.bind(itineraryController));

// Protected routes
router.use(authenticate);
router.post('/generate', aiLimiter, itineraryController.generate.bind(itineraryController));
router.get('/',                     itineraryController.getAll.bind(itineraryController));
router.get('/:id',                  itineraryController.getById.bind(itineraryController));
router.patch('/:id/share',          itineraryController.toggleShare.bind(itineraryController));
router.delete('/:id',               itineraryController.delete.bind(itineraryController));

export default router;
