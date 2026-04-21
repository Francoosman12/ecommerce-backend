import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    sku:         { type: String, unique: true, required: true },
    name:        { type: String, required: true },
    description: { type: String },
    category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    priceBase:   { type: Number, required: true },   // Precio contado base
    priceOffer:  { type: Number, default: 0 },        // ← NUEVO: precio de oferta (0 = sin oferta)
    stock:       { type: Number, default: 0 },
    images: [{
        public_id: String,
        url:       String
    }],
    videoUrl:   { type: String },
    isFeatured: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);