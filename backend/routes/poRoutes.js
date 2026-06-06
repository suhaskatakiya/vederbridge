import express from 'express';
import { createPurchaseOrder, getPurchaseOrderDetails, updatePOStatus, sendPOEmailSimulation, getPurchaseOrders, approveL1, approveL2, rejectPO } from '../controllers/poController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('Procurement Officer', 'Manager', 'Admin'), createPurchaseOrder);
router.get('/', protect, getPurchaseOrders);
router.get('/:id', protect, getPurchaseOrderDetails);
router.put('/:id/status', protect, authorize('Procurement Officer', 'Manager', 'Admin'), updatePOStatus);
router.post('/:id/send-email', protect, sendPOEmailSimulation);
router.put('/:id/l1-approve', protect, authorize('Procurement Officer', 'Manager', 'Admin'), approveL1);
router.put('/:id/l2-approve', protect, authorize('Procurement Officer', 'Manager', 'Admin'), approveL2);
router.put('/:id/reject', protect, authorize('Procurement Officer', 'Manager', 'Admin'), rejectPO);

export default router;
