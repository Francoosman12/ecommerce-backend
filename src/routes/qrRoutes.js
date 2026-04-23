import express from 'express';
import { createQROrder, deleteQROrder, getQRPaymentStatus } from '../controllers/qrController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/',                         protect, adminOnly, createQROrder);
router.delete('/',                      protect, adminOnly, deleteQROrder);
router.get('/status/:externalReference', protect, adminOnly, getQRPaymentStatus);

export default router;