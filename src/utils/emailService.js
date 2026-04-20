import transporter from '../config/mailer.js';
import {
    orderConfirmationTemplate,
    newOrderAdminTemplate
} from './emailTemplates.js';

// ─── Enviar confirmación al cliente ───────────────────────────────────────
export const sendOrderConfirmation = async (order) => {
    try {
        const { subject, html } = orderConfirmationTemplate(order);

        await transporter.sendMail({
            from:    `"Tienda" <${process.env.EMAIL_USER}>`,
            to:      order.customerInfo.email,
            subject,
            html
        });

        console.log(`✅ Email de confirmación enviado a ${order.customerInfo.email}`);
    } catch (error) {
        // No rompemos el flujo si el email falla — solo logueamos
        console.error('❌ Error al enviar email de confirmación:', error.message);
    }
};

// ─── Notificar al admin de nuevo pedido ───────────────────────────────────
export const sendNewOrderAdmin = async (order) => {
    try {
        const { subject, html } = newOrderAdminTemplate(order);

        await transporter.sendMail({
            from:    `"Tienda" <${process.env.EMAIL_USER}>`,
            to:      process.env.ADMIN_EMAIL,
            subject,
            html
        });

        console.log(`✅ Email de nuevo pedido enviado al admin`);
    } catch (error) {
        console.error('❌ Error al enviar email al admin:', error.message);
    }
};