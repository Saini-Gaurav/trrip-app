import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/', uploadLimiter, upload.array('files', 5), documentController.uploadDocuments.bind(documentController));
router.get('/',               documentController.getDocuments.bind(documentController));
router.delete('/:id',         documentController.deleteDocument.bind(documentController));
router.get('/:id/signed-url', documentController.getSignedUrl.bind(documentController));

export default router;
