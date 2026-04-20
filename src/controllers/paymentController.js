import { Preference, Payment } from 'mercadopago';
import client from '../config/mercadopago.js';
import Order from '../models/Order.js';

// ─── CREAR PREFERENCIA DE PAGO ─────────────────────────────────────────────
export const createPreference = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        if (order.paymentMethod !== 'mercadopago') {
            return res.status(400).json({ message: 'Esta orden no usa Mercado Pago' });
        }

        const mpItems = order.items.map(item => ({
            id:          item.product.toString(),
            title:       item.name,
            quantity:    item.quantity,
            unit_price:  item.priceUnit,
            currency_id: 'ARS'
        }));

        const preference = new Preference(client);

        const preferenceBody = {
            items: mpItems,

            payer: {
                name:  order.customerInfo.name,
                email: order.customerInfo.email,
                phone: { number: order.customerInfo.phone }
            },

            back_urls: {
                success: `${process.env.FRONTEND_URL}/orden/exito/${order._id}`,
                failure: `${process.env.FRONTEND_URL}/orden/fallo/${order._id}`,
                pending: `${process.env.FRONTEND_URL}/orden/pendiente/${order._id}`
            },

            // notification_url solo funciona con URLs públicas
            // En producción se descomenta
            // notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,

            external_reference: order._id.toString(),

            expires:            true,
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        // auto_return solo funciona con URLs públicas (no localhost)
        if (process.env.NODE_ENV === 'production') {
            preferenceBody.auto_return = 'approved';
            preferenceBody.notification_url = `${process.env.BACKEND_URL}/api/payments/webhook`;
        }

        const response = await preference.create({ body: preferenceBody });

        // Guardamos el preference ID en la orden
        order.mpPreferenceId = response.id;
        await order.save();

        res.json({
            preferenceId: response.id,
            initPoint:    response.init_point,
            sandboxUrl:   response.sandbox_init_point
        });

    } catch (error) {
        console.error('Error al crear preferencia MP:', error);
        res.status(500).json({ message: 'Error al crear preferencia de pago', error: error.message });
    }
};

// ─── WEBHOOK DE MERCADO PAGO ───────────────────────────────────────────────
export const mpWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type !== 'payment') {
            return res.sendStatus(200);
        }

        const payment = new Payment(client);
        const mpPayment = await payment.get({ id: data.id });

        const {
            status,
            external_reference,
            id: mpPaymentId
        } = mpPayment;

        const order = await Order.findById(external_reference);
        if (!order) {
            console.error(`Webhook MP: orden ${external_reference} no encontrada`);
            return res.sendStatus(200);
        }

        order.mpPaymentId = mpPaymentId.toString();
        order.mpStatus    = status;

        if (status === 'approved') {
            order.status = 'pagado';
        } else if (status === 'rejected' || status === 'cancelled') {
            order.status = 'cancelado';
        } else if (status === 'pending' || status === 'in_process') {
            order.status = 'pendiente';
        }

        await order.save();
        console.log(`✅ Webhook MP: orden ${order._id} → ${order.status}`);

        res.sendStatus(200);

    } catch (error) {
        console.error('Error en webhook MP:', error);
        res.sendStatus(200);
    }
};

// ─── VERIFICAR ESTADO DE PAGO ──────────────────────────────────────────────
export const getPaymentStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .select('status mpStatus mpPaymentId customerInfo totalAmount deliveryMethod');

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        res.json({
            orderId:     order._id,
            status:      order.status,
            mpStatus:    order.mpStatus,
            totalAmount: order.totalAmount,
            delivery:    order.deliveryMethod,
            customer:    order.customerInfo.name
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estado del pago' });
    }
};