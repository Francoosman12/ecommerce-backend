import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── protect: verifica que el usuario esté autenticado ────────────────────
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'No autorizado, token inválido' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

// ─── adminOnly: verifica que el usuario sea admin ─────────────────────────
// Siempre usar DESPUÉS de protect
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    res.status(403).json({ message: 'Acceso denegado: se requiere rol admin' });
};