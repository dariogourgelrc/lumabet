import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    initiatePayment,
    handleCallback,
    getPaymentStatus,
    getPaymentHistory,
    markPaymentSuccess
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/initiate', authenticateToken, initiatePayment);
router.all('/callback', handleCallback);
router.get('/status/:id', authenticateToken, getPaymentStatus);
router.get('/history', authenticateToken, getPaymentHistory);
router.post('/mark-success/:id', authenticateToken, markPaymentSuccess);

export default router;
