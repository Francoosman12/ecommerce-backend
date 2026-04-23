import express from 'express';
import { getStoreConfig, updateStoreConfig } from '../controllers/storeController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',  getStoreConfig);                        // público
router.put('/',  protect, adminOnly, updateStoreConfig); // solo admin

export default router;