import { Router } from 'express';
import activityRoutes from './activities.routes.js';
import applicationRoutes from './applications.routes.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import internRoutes from './interns.routes.js';
import taskRoutes from './tasks.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/interns', internRoutes);
router.use('/tasks', taskRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
