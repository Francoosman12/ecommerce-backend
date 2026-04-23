import mongoose from 'mongoose';

const storeConfigSchema = new mongoose.Schema({
    configName: { type: String, default: 'MAIN', unique: true }, // Singleton

    // ─── Redes sociales ───────────────────────────────────────────────────
    instagramUrl:          { type: String, default: '' },
    instagramFollowers:    { type: String, default: '' }, // Ej: '2.4K', '1,200'
    facebookUrl:   { type: String, default: '' },
    whatsappPhone: { type: String, default: '' },

    // ─── Banner / Hero ────────────────────────────────────────────────────
    heroBadgeText:  { type: String, default: 'Nueva colección · Otoño Invierno' },
    heroTitle:      { type: String, default: 'Bufandones que te abrazan' },
    heroSubtitle:   { type: String, default: 'Lana seleccionada, colores únicos y diseños artesanales para la mujer que sabe lo que quiere.' },
    reelUrl:        { type: String, default: '' }, // URL del Reel de Instagram

    // ─── Info del negocio ─────────────────────────────────────────────────
    storeName:    { type: String, default: 'Margarita Accesorios' },
    storeAddress: { type: String, default: 'San Miguel de Tucumán, Argentina' },
    storeHours:   { type: String, default: 'Lunes a Sábado de 9:00 a 18:00' },
    storeEmail:   { type: String, default: '' },

    // ─── SEO ──────────────────────────────────────────────────────────────
    seoTitle:       { type: String, default: 'Margarita Accesorios — Bufandones y Moda Femenina en Tucumán' },
    seoDescription: { type: String, default: 'Bufandones artesanales, accesorios y moda femenina en San Miguel de Tucumán.' },

}, { timestamps: true });

export default mongoose.model('StoreConfig', storeConfigSchema);