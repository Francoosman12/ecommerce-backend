import mongoose from 'mongoose';

const manualSaleSchema = new mongoose.Schema({
    // Datos del cliente (opcionales para ventas informales)
    customerName:  { type: String, default: 'Cliente sin nombre' },
    customerPhone: { type: String, default: '' },

    // Productos vendidos
    items: [{
        product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name:       { type: String, required: true },   // Snapshot del nombre
        priceUnit:  { type: Number, required: true },   // Precio al momento de la venta
        quantity:   { type: Number, required: true, min: 1 },
        image:      { type: String, default: '' },
    }],

    // Totales
    totalAmount:   { type: Number, required: true },
    discount:      { type: Number, default: 0 },        // Descuento en $ aplicado

    // Pago
    paymentMethod: {
        type: String,
        enum: ['efectivo', 'transferencia', 'mercadopago', 'otro'],
        default: 'efectivo'
    },
    paymentNote:   { type: String, default: '' },       // Referencia MP, CBU, etc.
    isPaid:        { type: Boolean, default: true },

    // Stock
    stockDiscounted: { type: Boolean, default: true },  // Si ya se descontó el stock

    // Canal de venta
    channel: {
        type: String,
        enum: ['web', 'instagram', 'whatsapp', 'local', 'otro'],
        default: 'local'
    },

    notes: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

export default mongoose.model('ManualSale', manualSaleSchema);