import express from 'express';
import {
    createPreference,
    mpWebhook,
    getPaymentStatus
} from '../controllers/paymentController.js';

const router = express.Router();

// Crear preferencia de pago para una orden
router.post('/create-preference/:orderId', createPreference);

// Webhook de MP (MP llama a esto, no el usuario)
router.post('/webhook', mpWebhook);

// Verificar estado de pago
router.get('/status/:orderId', getPaymentStatus);

export default router;