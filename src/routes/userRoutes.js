import express from 'express';
import {
    authUser,
    registerCustomer,
    createAdmin,
    getUserProfile,
    updateAddress
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Públicas ──────────────────────────────────────────────────────────────
router.post('/login',    authUser);
router.post('/register', registerCustomer);   // Clientes desde la web

// ─── Solo admin (para setup inicial o agregar operadores) ─────────────────
//router.post('/create-admin', protect, adminOnly, createAdmin);
router.post('/create-admin', createAdmin);

// ─── Usuarios autenticados (admin o cliente) ──────────────────────────────
router.get ('/profile', protect, getUserProfile);
router.put ('/address', protect, updateAddress);

export default router;