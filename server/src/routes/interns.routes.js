import { Router } from 'express';
import {
  convertApplicant,
  getIntern,
  listInterns,
  toggleChecklistItem,
  updateIntern,
} from '../controllers/interns.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/from-application/:applicationId', authorize('admin'), convertApplicant);
router.get('/', authorize('admin', 'mentor'), listInterns);
router.get('/:id', getIntern);
router.patch('/:id', authorize('admin'), updateIntern);
router.patch('/:id/checklist/:itemId', authorize('admin', 'mentor'), toggleChecklistItem);

export default router;
