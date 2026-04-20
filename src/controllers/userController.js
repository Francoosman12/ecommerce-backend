import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// ─── Helper: generar JWT ───────────────────────────────────────────────────
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Helper: respuesta estándar del usuario ────────────────────────────────
const userResponse = (user) => ({
    _id:     user._id,
    name:    user.name,
    email:   user.email,
    role:    user.role,
    isAdmin: user.isAdmin,   // virtual — compatibilidad con frontend existente
    address: user.address,
    token:   generateToken(user._id)
});

// ─── LOGIN (admin y clientes usan el mismo endpoint) ──────────────────────
// @route  POST /api/users/login
// @access Public
export const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json(userResponse(user));
        } else {
            res.status(401).json({ message: 'Email o contraseña inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en login', error: error.message });
    }
};

// ─── REGISTRO DE CLIENTE (público, desde la web) ──────────────────────────
// @route  POST /api/users/register
// @access Public
export const registerCustomer = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Siempre 'customer' — nunca admin desde este endpoint
        const user = await User.create({ name, email, password, role: 'customer' });

        res.status(201).json(userResponse(user));
    } catch (error) {
        res.status(400).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

// ─── CREAR ADMIN (solo usar una vez en setup inicial) ─────────────────────
// @route  POST /api/users/create-admin
// @access Protegido (solo desde un admin existente, o eliminar después de usar)
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const user = await User.create({ name, email, password, role: 'admin' });

        res.status(201).json(userResponse(user));
    } catch (error) {
        res.status(400).json({ message: 'Datos de usuario inválidos', error: error.message });
    }
};

// ─── OBTENER PERFIL (cliente logueado) ────────────────────────────────────
// @route  GET /api/users/profile
// @access Privado (cualquier usuario autenticado)
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(userResponse(user));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

// ─── ACTUALIZAR DIRECCIÓN (cliente guarda su dirección) ───────────────────
// @route  PUT /api/users/address
// @access Privado (clientes)
export const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const { street, city, province, zip } = req.body;

        // Detectamos automáticamente si es Tucumán capital para habilitar financiación
        const isTucuman =
            province?.toLowerCase().includes('tucum') &&
            city?.toLowerCase().includes('san miguel');

        user.address = { street, city, province, zip, isTucuman };

        const updated = await user.save();
        res.json(userResponse(updated));
    } catch (error) {
        res.status(400).json({ message: 'Error al actualizar dirección', error: error.message });
    }
};