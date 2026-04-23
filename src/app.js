import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import productRoutes   from './routes/productRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import categoryRoutes  from './routes/categoryRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import orderRoutes     from './routes/orderRoutes.js';
import paymentRoutes   from './routes/paymentRoutes.js';
import storeRoutes     from './routes/storeRoutes.js';
import salesRoutes     from './routes/salesRoutes.js';
import qrRoutes        from './routes/qrRoutes.js';

dotenv.config();

const app = express();

// CORS — permite localhost en dev y el dominio de Vercel en producción
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (Postman, curl, Railway health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('❌ Error de conexión a la BD:', error);
        res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
});

app.use('/api/products',   productRoutes);
app.use('/api/financial',  financialRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api/store',      storeRoutes);
app.use('/api/sales',      salesRoutes);
app.use('/api/qr',         qrRoutes);

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('<h1>🌼 Margarita Accesorios API v2.0 ONLINE</h1>');
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
}

export default app;