import express from 'express';
import { updateRole } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.put('/role', authenticate, requireRole(['ADMIN']), updateRole);

export default router;
