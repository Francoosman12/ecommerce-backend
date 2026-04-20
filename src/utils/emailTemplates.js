// ─── EMAIL AL CLIENTE: Confirmación de pedido ─────────────────────────────
export const orderConfirmationTemplate = (order) => {
    const itemsRows = order.items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">$${item.priceUnit.toLocaleString('es-AR')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align:right;">$${(item.priceUnit * item.quantity).toLocaleString('es-AR')}</td>
        </tr>
    `).join('');

    const deliveryInfo = order.deliveryMethod === 'envio'
        ? `<p><strong>Envío a domicilio:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
           ${order.shippingAddress.notes ? `<p><strong>Indicaciones:</strong> ${order.shippingAddress.notes}</p>` : ''}`
        : `<p><strong>Retiro en local</strong> — Te contactaremos para coordinar.</p>`;

    const paymentInfo = {
        mercadopago:   'Mercado Pago',
        efectivo:      'Efectivo',
        transferencia: 'Transferencia bancaria'
    }[order.paymentMethod] || order.paymentMethod;

    return {
        subject: `✅ Pedido confirmado #${order._id.toString().slice(-6).toUpperCase()}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

            <!-- Header -->
            <div style="background-color: #1a1a2e; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">¡Gracias por tu pedido!</h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px; background: #fff; border: 1px solid #eee;">
                <p>Hola <strong>${order.customerInfo.name}</strong>,</p>
                <p>Recibimos tu pedido correctamente. Acá está el resumen:</p>

                <!-- Número de pedido -->
                <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #666;">Número de pedido</p>
                    <p style="margin: 5px 0 0; font-size: 22px; font-weight: bold; letter-spacing: 2px;">
                        #${order._id.toString().slice(-6).toUpperCase()}
                    </p>
                </div>

                <!-- Productos -->
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: center;">Cant.</th>
                            <th style="padding: 10px; text-align: right;">Precio</th>
                            <th style="padding: 10px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${itemsRows}</tbody>
                </table>

                <!-- Total -->
                <div style="text-align: right; margin: 10px 0 20px;">
                    <p style="font-size: 18px; font-weight: bold;">
                        Total: $${order.totalAmount.toLocaleString('es-AR')}
                    </p>
                </div>

                <!-- Entrega y pago -->
                <div style="border-top: 2px solid #eee; padding-top: 20px;">
                    <h3 style="margin-bottom: 10px;">📦 Entrega</h3>
                    ${deliveryInfo}
                    <h3 style="margin-bottom: 10px;">💳 Método de pago</h3>
                    <p>${paymentInfo}</p>
                </div>

                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    Nos comunicaremos con vos a la brevedad para coordinar los próximos pasos.
                    Ante cualquier consulta respondé este email o escribinos por WhatsApp.
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                    Este es un email automático, por favor no respondas directamente.
                </p>
            </div>

        </div>
        `
    };
};

// ─── EMAIL AL ADMIN: Nuevo pedido recibido ────────────────────────────────
export const newOrderAdminTemplate = (order) => {
    const itemsList = order.items.map(item =>
        `• ${item.name} (x${item.quantity}) — $${(item.priceUnit * item.quantity).toLocaleString('es-AR')}`
    ).join('\n');

    const deliveryInfo = order.deliveryMethod === 'envio'
        ? `Envío a: ${order.shippingAddress.street}, ${order.shippingAddress.city}${order.shippingAddress.notes ? ` (${order.shippingAddress.notes})` : ''}`
        : 'Retiro en local';

    return {
        subject: `🛒 Nuevo pedido #${order._id.toString().slice(-6).toUpperCase()} — $${order.totalAmount.toLocaleString('es-AR')}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">

            <div style="background-color: #2d6a4f; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 22px;">🛒 Nuevo pedido recibido</h1>
            </div>

            <div style="padding: 25px; background: #fff; border: 1px solid #eee;">

                <div style="background: #f0faf5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 13px; color: #666;">Número de pedido</p>
                    <p style="margin: 5px 0 0; font-size: 22px; font-weight: bold;">
                        #${order._id.toString().slice(-6).toUpperCase()}
                    </p>
                </div>

                <h3>👤 Cliente</h3>
                <p>
                    <strong>Nombre:</strong> ${order.customerInfo.name}<br>
                    <strong>Email:</strong> ${order.customerInfo.email}<br>
                    <strong>Teléfono:</strong> ${order.customerInfo.phone}
                </p>

                <h3>📦 Productos</h3>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 6px; font-size: 14px;">${itemsList}</pre>

                <h3>🚚 Entrega</h3>
                <p>${deliveryInfo}</p>

                <h3>💳 Pago</h3>
                <p>${order.paymentMethod} — <strong>$${order.totalAmount.toLocaleString('es-AR')}</strong></p>

            </div>

            <div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 12px; color: #999;">
                    Pedido recibido el ${new Date(order.createdAt).toLocaleString('es-AR')}
                </p>
            </div>

        </div>
        `
    };
};