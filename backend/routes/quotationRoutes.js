import express from 'express';
import { submitQuotation, getQuotationsByRFQ, approveQuotation, updateQuotation, getMyQuotations } from '../controllers/quotationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Vendor', 'Admin'), submitQuotation);
router.get('/my-bids', protect, authorize('Vendor', 'Admin'), getMyQuotations);
router.put('/:id', protect, authorize('Vendor', 'Admin'), updateQuotation);
router.get('/:rfq_id', protect, authorize('Procurement Officer', 'Manager', 'Admin'), getQuotationsByRFQ);
router.put('/approve/:id', protect, authorize('Procurement Officer', 'Manager', 'Admin'), approveQuotation);

export default router;
