import express from 'express';
import { getVendors, getMyVendorProfile, updateVendorProfile, updateVendorStatus } from '../controllers/vendorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, authorize('Vendor'), getMyVendorProfile);
router.post('/profile', protect, authorize('Vendor'), updateVendorProfile);

router.get('/', protect, authorize('Admin', 'Manager', 'Procurement Officer'), getVendors);
router.put('/:id/status', protect, authorize('Admin'), updateVendorStatus);

export default router;
