import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // --- ROLES ---
    // 'admin'    → dueño/operador, acceso al panel
    // 'customer' → cliente que compra desde la web
    role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer'
    },

    // Dirección guardada del cliente (para no reingresarla en cada compra)
    address: {
        street:   { type: String },
        city:     { type: String },
        province: { type: String },
        zip:      { type: String },
        // Flag para habilitar financiación (solo Tucumán capital)
        isTucuman: { type: Boolean, default: false }
    }

}, { timestamps: true });

// ─── Virtual: compatibilidad con authMiddleware que usa req.user.isAdmin ───
userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

// Necesario para que los virtuals aparezcan en res.json()
userSchema.set('toJSON',   { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// ─── Encriptar password antes de guardar ───
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ─── Comparar contraseñas en login ───
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);