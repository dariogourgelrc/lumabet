import express from 'express';
import { getAllTransactions, getAllUsers, getStats } from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

router.get('/transactions', getAllTransactions);
router.get('/users', getAllUsers);
router.get('/stats', getStats);

export default router;
