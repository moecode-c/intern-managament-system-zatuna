import { Router } from 'express';
import {
  adminDashboard,
  internDashboard,
  mentorDashboard,
} from '../controllers/dashboard.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/admin', authorize('admin'), adminDashboard);
router.get('/mentor', authorize('admin', 'mentor'), mentorDashboard);
router.get('/intern', authorize('intern'), internDashboard);

export default router;
