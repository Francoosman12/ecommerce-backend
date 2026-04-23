import Order      from '../models/Order.js';
import ManualSale from '../models/ManualSale.js';

// Formatea precios en pesos argentinos
const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

// Genera el HTML del comprobante
const buildReceiptHTML = ({ id, shortId, date, customerName, customerPhone, items, totalAmount, discount, paymentMethod, paymentNote, channel, notes, type }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante #${shortId}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #3b1a14; background: white; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #edbdb4; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-flower { font-size: 28px; }
    .logo-name { font-size: 22px; font-weight: 700; color: #843d30; letter-spacing: -0.5px; }
    .logo-sub { font-size: 10px; color: #9f4636; text-transform: uppercase; letter-spacing: 2px; }
    .receipt-info { text-align: right; }
    .receipt-title { font-size: 18px; font-weight: 700; color: #3b1a14; margin-bottom: 4px; }
    .receipt-id { font-size: 12px; color: #9f4636; font-family: monospace; }
    .receipt-date { font-size: 11px; color: #bd5845; margin-top: 2px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 10px; font-weight: 700; color: #9f4636; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #f6dbd6; }
    .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-row { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 10px; color: #9f4636; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 13px; color: #3b1a14; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f6dbd6; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #843d30; font-weight: 700; }
    td { padding: 10px; border-bottom: 1px solid #fdf0ed; font-size: 12px; color: #3b1a14; }
    tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .totals { margin-top: 16px; border-top: 2px solid #edbdb4; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; color: #9f4636; }
    .total-final { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #edbdb4; font-size: 18px; font-weight: 700; color: #3b1a14; }
    .payment-badge { display: inline-block; background: #f6dbd6; color: #843d30; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f6dbd6; text-align: center; }
    .footer p { font-size: 11px; color: #bd5845; margin-bottom: 2px; }
    .footer .thanks { font-size: 14px; font-weight: 600; color: #843d30; margin-bottom: 6px; }
    .type-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .type-web    { background: #e0f2fe; color: #0369a1; }
    .type-manual { background: #f0fdf4; color: #166534; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-flower">🌼</div>
      <div>
        <div class="logo-name">Margarita</div>
        <div class="logo-sub">Accesorios</div>
      </div>
    </div>
    <div class="receipt-info">
      <div class="receipt-title">Comprobante de venta</div>
      <div class="receipt-id">#${shortId}</div>
      <div class="receipt-date">${fmtDate(date)}</div>
      <div style="margin-top:6px;">
        <span class="type-badge ${type === 'web' ? 'type-web' : 'type-manual'}">${type === 'web' ? 'Venta web' : 'Venta directa'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del cliente</div>
    <div class="customer-grid">
      <div class="info-row">
        <span class="info-label">Nombre</span>
        <span class="info-value">${customerName || 'Sin nombre'}</span>
      </div>
      ${customerPhone ? `<div class="info-row"><span class="info-label">Teléfono</span><span class="info-value">${customerPhone}</span></div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Productos</div>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th class="text-right">Precio</th>
          <th class="text-right">Cant.</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td class="text-right">${fmt(item.priceUnit)}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${fmt(item.priceUnit * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      ${discount > 0 ? `<div class="total-row"><span>Descuento</span><span>- ${fmt(discount)}</span></div>` : ''}
      <div class="total-final">
        <span>Total</span>
        <span>${fmt(totalAmount)}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Pago</div>
    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
      <span class="payment-badge">${paymentMethod}</span>
      ${paymentNote ? `<span style="font-size:12px; color:#9f4636;">${paymentNote}</span>` : ''}
    </div>
  </div>

  ${notes ? `<div class="section"><div class="section-title">Notas</div><p style="font-size:12px; color:#9f4636;">${notes}</p></div>` : ''}

  <div class="footer">
    <p class="thanks">¡Gracias por tu compra!</p>
    <p>@margarita_accesorios.11</p>
    <p>San Miguel de Tucumán, Argentina</p>
  </div>
</body>
</html>
`;

// ─── COMPROBANTE DE VENTA MANUAL ───────────────────────────────────────────
export const getManualSaleReceipt = async (req, res) => {
    try {
        const sale = await ManualSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });

        const html = buildReceiptHTML({
            id:            sale._id.toString(),
            shortId:       sale._id.toString().slice(-6).toUpperCase(),
            date:          sale.createdAt,
            customerName:  sale.customerName,
            customerPhone: sale.customerPhone,
            items:         sale.items,
            totalAmount:   sale.totalAmount,
            discount:      sale.discount,
            paymentMethod: sale.paymentMethod,
            paymentNote:   sale.paymentNote,
            channel:       sale.channel,
            notes:         sale.notes,
            type:          'manual',
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: 'Error al generar comprobante', error: error.message });
    }
};

// ─── COMPROBANTE DE ORDEN WEB ──────────────────────────────────────────────
export const getOrderReceipt = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

        const html = buildReceiptHTML({
            id:            order._id.toString(),
            shortId:       order._id.toString().slice(-6).toUpperCase(),
            date:          order.createdAt,
            customerName:  order.customerInfo?.name,
            customerPhone: order.customerInfo?.phone,
            items:         order.items || [],
            totalAmount:   order.totalAmount,
            discount:      0,
            paymentMethod: order.paymentMethod,
            paymentNote:   order.mpPaymentId ? `MP ID: ${order.mpPaymentId} — <a href="https://www.mercadopago.com.ar/activities/detail/${order.mpPaymentId}" target="_blank" style="color:#009ee3;text-decoration:underline;">Ver en Mercado Pago →</a>` : '',
            notes:         '',
            type:          'web',
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        res.status(500).json({ message: 'Error al generar comprobante', error: error.message });
    }
};