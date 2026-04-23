import express from 'express';
import {
    createManualSale,
    getManualSales,
    getManualSaleById,
    getSalesMetrics,
    getAllSales,
} from '../controllers/salesController.js';
import {
    getManualSaleReceipt,
    getOrderReceipt,
} from '../controllers/receiptController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Métricas y listados — solo admin
router.get('/metrics',        protect, adminOnly, getSalesMetrics);
router.get('/all',            protect, adminOnly, getAllSales);
router.get('/manual',         protect, adminOnly, getManualSales);
router.get('/manual/:id',     protect, adminOnly, getManualSaleById);
router.post('/manual',        protect, adminOnly, createManualSale);

// Comprobantes — solo admin
router.get('/receipt/manual/:id', protect, adminOnly, getManualSaleReceipt);
router.get('/receipt/order/:id',  protect, adminOnly, getOrderReceipt);

export default router;