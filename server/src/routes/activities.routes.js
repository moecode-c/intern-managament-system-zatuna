import { Router } from 'express';
import {
  activitySummary,
  createActivity,
  listActivities,
} from '../controllers/activities.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('intern'), createActivity);
router.get('/', listActivities);
router.get('/summary/:internId', authorize('admin', 'mentor'), activitySummary);

export default router;
