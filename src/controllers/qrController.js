import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const MP_USER_ID = process.env.MP_USER_ID;
const MP_POS_ID  = process.env.MP_POS_ID;

/**
 * Crea una orden en el QR dinámico de MP
 * El cliente escanea el QR fijo de la caja y ve el monto a pagar
 */
export const createQROrder = async (req, res) => {
    try {
        const { items, totalAmount, externalReference, title } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Se requieren items para generar el QR' });
        }

        const orderData = {
            external_reference: externalReference || `VENTA-${Date.now()}`,
            title:              title || 'Venta Margarita Accesorios',
            description:        'Pago en Margarita Accesorios',
            ...(process.env.NODE_ENV === 'production' && process.env.BACKEND_URL
                ? { notification_url: `${process.env.BACKEND_URL}/api/payments/webhook` }
                : {}),
            total_amount:       totalAmount,
            items: items.map(item => ({
                sku_number:   item.sku  || 'PROD',
                category:     'others',
                title:        item.name,
                description:  item.name,
                unit_price:   item.priceUnit,
                quantity:     item.quantity,
                unit_measure: 'unit',
                total_amount: item.priceUnit * item.quantity,
            })),
            cash_out: { amount: 0 }
        };

        // PUT a la API de QR de MP
        const response = await fetch(
            `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${MP_USER_ID}/pos/${MP_POS_ID}/qrs`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                    'Content-Type':  'application/json',
                },
                body: JSON.stringify(orderData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Error MP QR:', data);
            return res.status(400).json({ message: 'Error al generar QR', detail: data });
        }

        res.json({
            qrData:            data.qr_data,       // String para generar el QR en el frontend
            externalReference: orderData.external_reference,
        });

    } catch (error) {
        console.error('Error createQROrder:', error);
        res.status(500).json({ message: 'Error al crear orden QR', error: error.message });
    }
};

/**
 * Elimina la orden del QR (después de cobrar o cancelar)
 */
export const deleteQROrder = async (req, res) => {
    try {
        await fetch(
            `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${MP_USER_ID}/pos/${MP_POS_ID}/qrs`,
            {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            }
        );
        res.json({ message: 'Orden QR eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar orden QR', error: error.message });
    }
};

/**
 * Consulta el estado de un pago por external_reference
 */
export const getQRPaymentStatus = async (req, res) => {
    try {
        const { externalReference } = req.params;

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${externalReference}`,
            {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            }
        );

        const data = await response.json();
        const payment = data.results?.[0];

        if (!payment) {
            return res.json({ status: 'pending', message: 'Sin pagos aún' });
        }

        res.json({
            status:    payment.status,           // approved, pending, rejected
            paymentId: payment.id,
            amount:    payment.transaction_amount,
            method:    payment.payment_method_id,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error al consultar pago', error: error.message });
    }
};