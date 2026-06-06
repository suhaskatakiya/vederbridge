import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin', 'Manager', 'Procurement Officer'), getActivityLogs);

export default router;
