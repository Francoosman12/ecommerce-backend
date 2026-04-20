import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({

    // ─── Cliente ───────────────────────────────────────────────────────────
    // Puede ser un usuario registrado o un guest (compra sin cuenta)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null   // null = guest
    },
    // Datos de contacto siempre presentes (aunque sea guest)
    customerInfo: {
        name:  { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },

    // ─── Productos del pedido ──────────────────────────────────────────────
    items: [
        {
            product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name:      { type: String, required: true },  // snapshot del nombre
            sku:       { type: String },                  // snapshot del SKU
            image:     { type: String },                  // snapshot de la primera imagen
            priceUnit: { type: Number, required: true },  // precio al momento de comprar
            quantity:  { type: Number, required: true, min: 1 }
        }
    ],

    // ─── Entrega ───────────────────────────────────────────────────────────
    deliveryMethod: {
        type: String,
        enum: ['envio', 'retiro'],
        required: true
    },
    // Solo se completa si deliveryMethod === 'envio'
    shippingAddress: {
        street:   { type: String },
        city:     { type: String },
        province: { type: String },
        zip:      { type: String },
        notes:    { type: String }  // indicaciones adicionales (piso, referencia, etc.)
    },

    // ─── Pago ──────────────────────────────────────────────────────────────
    paymentMethod: {
        type: String,
        enum: ['mercadopago', 'efectivo', 'transferencia'],
        required: true
    },
    // Solo aplica si paymentMethod === 'efectivo' y deliveryMethod === 'retiro'
    // o pago personal para clientes de San Miguel de Tucumán
    selectedFinancingPlan: {
        planName:         { type: String,  default: null },
        installments:     { type: Number,  default: null },
        interestRate:     { type: Number,  default: null },
        totalPrice:       { type: Number,  default: null },
        installmentValue: { type: Number,  default: null }
    },

    // ─── Totales ───────────────────────────────────────────────────────────
    subtotal:    { type: Number, required: true },  // suma de items sin descuentos
    totalAmount: { type: Number, required: true },  // lo que el cliente paga finalmente

    // ─── Estado del pedido ─────────────────────────────────────────────────
    status: {
        type: String,
        enum: [
            'pendiente',    // recién creado, esperando pago
            'pagado',       // pago confirmado (MP webhook o manual)
            'preparando',   // en preparación / armado
            'listo',        // listo para retiro o despacho
            'enviado',      // en camino (solo envío a domicilio)
            'entregado',    // entregado al cliente
            'cancelado'     // cancelado por cualquier motivo
        ],
        default: 'pendiente'
    },

    // ─── Mercado Pago (se completa cuando se integra MP) ──────────────────
    mpPaymentId:       { type: String, default: null },  // ID del pago en MP
    mpPreferenceId:    { type: String, default: null },  // ID de la preferencia MP
    mpStatus:          { type: String, default: null },  // approved, pending, rejected

    // ─── Notas internas (solo visibles para el admin) ─────────────────────
    adminNotes: { type: String, default: '' }

}, { timestamps: true });

export default mongoose.model('Order', orderSchema);