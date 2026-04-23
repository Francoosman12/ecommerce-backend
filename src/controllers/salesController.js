
import ManualSale from '../models/ManualSale.js';
import Order      from '../models/Order.js';
import Product    from '../models/Product.js';

// ─── CREAR VENTA MANUAL ────────────────────────────────────────────────────
export const createManualSale = async (req, res) => {
    try {
        const { customerName, customerPhone, items, totalAmount, discount, paymentMethod, paymentNote, channel, notes } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Necesitás al menos un producto' });
        }

        // Descontar stock de cada producto
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) return res.status(404).json({ message: `Producto no encontrado: ${item.name}` });
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Stock insuficiente para: ${product.name} (disponible: ${product.stock})` });
            }
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }

        const sale = await ManualSale.create({
            customerName,
            customerPhone,
            items,
            totalAmount,
            discount: discount || 0,
            paymentMethod,
            paymentNote,
            channel,
            notes,
            stockDiscounted: true,
            createdBy: req.user._id,
        });

        res.status(201).json(sale);
    } catch (error) {
        res.status(400).json({ message: 'Error al registrar venta', error: error.message });
    }
};

// ─── LISTAR VENTAS MANUALES ────────────────────────────────────────────────
export const getManualSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, from, to, paymentMethod } = req.query;

        const filter = {};
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59));
        }
        if (paymentMethod) filter.paymentMethod = paymentMethod;

        const total = await ManualSale.countDocuments(filter);
        const sales = await ManualSale.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('items.product', 'name sku');

        res.json({ sales, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
    }
};

// ─── OBTENER UNA VENTA ─────────────────────────────────────────────────────
export const getManualSaleById = async (req, res) => {
    try {
        const sale = await ManualSale.findById(req.params.id).populate('items.product', 'name sku images');
        if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener venta', error: error.message });
    }
};

// ─── MÉTRICAS GENERALES (Dashboard) ───────────────────────────────────────
export const getSalesMetrics = async (req, res) => {
    try {
        const now   = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);  // Inicio del mes
        const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Mes anterior

        // Ventas manuales del mes
        const manualThisMonth = await ManualSale.find({ createdAt: { $gte: start } });
        const manualLastMonth = await ManualSale.find({ createdAt: { $gte: prev, $lt: start } });

        // Órdenes web pagadas del mes
        const webThisMonth = await Order.find({
            createdAt: { $gte: start },
            status: { $in: ['pagado', 'preparando', 'listo', 'enviado', 'entregado'] }
        });
        const webLastMonth = await Order.find({
            createdAt: { $gte: prev, $lt: start },
            status: { $in: ['pagado', 'preparando', 'listo', 'enviado', 'entregado'] }
        });

        const sumAmount = (arr) => arr.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

        const revenueThisMonth = sumAmount(manualThisMonth) + sumAmount(webThisMonth);
        const revenueLastMonth = sumAmount(manualLastMonth) + sumAmount(webLastMonth);
        const totalSalesThisMonth = manualThisMonth.length + webThisMonth.length;
        const avgTicket = totalSalesThisMonth > 0 ? Math.round(revenueThisMonth / totalSalesThisMonth) : 0;

        // Productos más vendidos (ventas manuales del mes)
        const productMap = {};
        manualThisMonth.forEach(sale => {
            sale.items.forEach(item => {
                const key = item.product?.toString() || item.name;
                if (!productMap[key]) productMap[key] = { name: item.name, qty: 0, revenue: 0 };
                productMap[key].qty     += item.quantity;
                productMap[key].revenue += item.priceUnit * item.quantity;
            });
        });
        webThisMonth.forEach(order => {
            order.items?.forEach(item => {
                const key = item.product?.toString() || item.name;
                if (!productMap[key]) productMap[key] = { name: item.name, qty: 0, revenue: 0 };
                productMap[key].qty     += item.quantity || 1;
                productMap[key].revenue += (item.priceUnit || 0) * (item.quantity || 1);
            });
        });

        const topProducts = Object.values(productMap)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        // Ventas por canal (solo manuales)
        const byChannel = {};
        manualThisMonth.forEach(s => {
            byChannel[s.channel] = (byChannel[s.channel] || 0) + 1;
        });

        // Ventas por método de pago
        const byPayment = {};
        [...manualThisMonth, ...webThisMonth].forEach(s => {
            const method = s.paymentMethod || 'otro';
            byPayment[method] = (byPayment[method] || 0) + 1;
        });

        res.json({
            revenueThisMonth,
            revenueLastMonth,
            revenueGrowth: revenueLastMonth > 0
                ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
                : 0,
            totalSalesThisMonth,
            webSalesThisMonth:    webThisMonth.length,
            manualSalesThisMonth: manualThisMonth.length,
            avgTicket,
            topProducts,
            byChannel,
            byPayment,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener métricas', error: error.message });
    }
};

// ─── TODAS LAS VENTAS (web + manuales unificadas) ──────────────────────────
export const getAllSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, from, to, type } = req.query;

        const dateFilter = {};
        if (from || to) {
            dateFilter.createdAt = {};
            if (from) dateFilter.createdAt.$gte = new Date(from);
            if (to)   dateFilter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59));
        }

        let results = [];

        if (type !== 'web') {
            const manualSales = await ManualSale.find(dateFilter).sort({ createdAt: -1 });
            results.push(...manualSales.map(s => ({ ...s.toObject(), _type: 'manual' })));
        }

        if (type !== 'manual') {
            const webOrders = await Order.find({
                ...dateFilter,
                status: { $in: ['pagado', 'preparando', 'listo', 'enviado', 'entregado'] }
            }).sort({ createdAt: -1 });
            results.push(...webOrders.map(o => ({ ...o.toObject(), _type: 'web' })));
        }

        // Ordenar por fecha desc
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total  = results.length;
        const paged  = results.slice((page - 1) * limit, page * limit);

        res.json({ sales: paged, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ventas', error: error.message });
    }
};