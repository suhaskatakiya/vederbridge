import express from 'express';
import { getUsers, toggleUserStatus, updateUserRole, updateProfile } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('Admin'), getUsers);
router.put('/profile', protect, updateProfile);
router.put('/:id/status', protect, authorize('Admin'), toggleUserStatus);
router.put('/:id/role', protect, authorize('Admin'), updateUserRole);

export default router;
