import express from 'express';
import { createRFQ, getRFQs } from '../controllers/rfqController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('Procurement Officer', 'Admin'), createRFQ)
  .get(protect, getRFQs);

export default router;
