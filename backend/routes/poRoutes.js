import express from 'express';
import { createPurchaseOrder, getPurchaseOrderDetails } from '../controllers/poController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Procurement Officer', 'Manager', 'Admin'), createPurchaseOrder);
router.get('/:id', protect, getPurchaseOrderDetails);

export default router;
