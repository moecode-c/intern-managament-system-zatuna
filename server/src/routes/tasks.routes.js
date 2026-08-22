import { Router } from 'express';
import {
  createTask,
  listTasks,
  reviewTask,
  submitTask,
} from '../controllers/tasks.controller.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('admin', 'mentor'), createTask);
router.get('/', listTasks);
router.patch('/:id/submit', authorize('intern'), submitTask);
router.patch('/:id/review', authorize('admin', 'mentor'), reviewTask);

export default router;
