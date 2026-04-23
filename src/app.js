import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

// IMPORTAR RUTAS
import productRoutes  from './routes/productRoutes.js';
import financialRoutes from './routes/financialRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes     from './routes/userRoutes.js';
import orderRoutes    from './routes/orderRoutes.js';
import paymentRoutes  from './routes/paymentRoutes.js';
import storeRoutes    from './routes/storeRoutes.js';
import salesRoutes    from './routes/salesRoutes.js';
import qrRoutes      from './routes/qrRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("❌ Error de conexión a la BD:", error);
        res.status(500).json({ error: "Error de conexión a la base de datos" });
    }
});

// Rutas
app.use('/api/products',  productRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/store',     storeRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/qr',        qrRoutes);     // ← QR dinámico MP

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send('<h1>🌼 Margarita Accesorios API v2.0 ONLINE</h1>');
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo localmente en puerto ${PORT}`);
    });
}

export default app;