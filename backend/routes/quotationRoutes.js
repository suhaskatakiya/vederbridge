import express from 'express';
import { submitQuotation, getQuotationsByRFQ, approveQuotation } from '../controllers/quotationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Vendor', 'Admin'), submitQuotation);
router.get('/:rfq_id', protect, authorize('Procurement Officer', 'Manager', 'Admin'), getQuotationsByRFQ);
router.put('/approve/:id', protect, authorize('Procurement Officer', 'Manager', 'Admin'), approveQuotation);

export default router;
