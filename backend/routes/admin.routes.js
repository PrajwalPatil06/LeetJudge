import express from 'express';
import { updateRole, getAnalytics } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.put('/role', authenticate, requireRole(['ADMIN']), updateRole);
router.get('/analytics', authenticate, requireRole(['ADMIN']), getAnalytics);

export default router;
