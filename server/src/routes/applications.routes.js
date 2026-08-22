import { Router } from 'express';
import {
  addReview,
  createApplication,
  getApplication,
  getPublicStatus,
  listApplications,
  updateStage,
} from '../controllers/applications.controller.js';
import { authorize, protect } from '../middleware/auth.js';
import { uploadCv } from '../middleware/upload.js';

const router = Router();

// Public - this is the "apply here" surface.
router.post('/', uploadCv.single('cv'), createApplication);
router.get('/status/:token', getPublicStatus);

// Staff only.
router.get('/', protect, authorize('admin', 'mentor'), listApplications);
router.get('/:id', protect, authorize('admin', 'mentor'), getApplication);
router.patch('/:id/stage', protect, authorize('admin', 'mentor'), updateStage);
router.post('/:id/reviews', protect, authorize('admin', 'mentor'), addReview);

export default router;
