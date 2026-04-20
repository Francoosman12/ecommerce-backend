import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { getPricingCalculator } from '../utils/pricingHelper.js';

// ─── CREAR ORDEN ───────────────────────────────────────────────────────────
// @route  POST /api/orders
// @access Public (guest o cliente logueado)
export const createOrder = async (req, res) => {
    try {
        const {
            customerInfo,
            items,
            deliveryMethod,
            shippingAddress,
            paymentMethod,
            selectedFinancingPlan
        } = req.body;

        // ── Validaciones básicas ──
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El pedido no tiene productos' });
        }
        if (deliveryMethod === 'envio' && !shippingAddress?.street) {
            return res.status(400).json({ message: 'La dirección de envío es obligatoria' });
        }

        // ── Verificar stock y construir items con snapshot de precios ──
        const calcPrices = await getPricingCalculator();
        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: `Producto ${item.productId} no encontrado` });
            }
            if (!product.isActive) {
                return res.status(400).json({ message: `El producto "${product.name}" no está disponible` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Stock insuficiente para "${product.name}". Stock disponible: ${product.stock}`
                });
            }

            // Calcular precio correcto según método de pago
            const productWithPrices = calcPrices(product.toObject());
            const priceUnit = productWithPrices.prices.cash; // precio base siempre

            orderItems.push({
                product:   product._id,
                name:      product.name,
                sku:       product.sku,
                image:     product.images?.[0]?.url || '',
                priceUnit,
                quantity:  item.quantity
            });

            subtotal += priceUnit * item.quantity;
        }

        // ── Calcular total final ──
        // Si eligió un plan de financiación, el total es el del plan
        let totalAmount = subtotal;
        if (selectedFinancingPlan?.totalPrice) {
            totalAmount = selectedFinancingPlan.totalPrice;
        }

        // ── Crear la orden ──
        const order = new Order({
            user:         req.user?._id || null, // null si es guest
            customerInfo,
            items:        orderItems,
            deliveryMethod,
            shippingAddress: deliveryMethod === 'envio' ? shippingAddress : {},
            paymentMethod,
            selectedFinancingPlan: selectedFinancingPlan || {},
            subtotal,
            totalAmount,
            status: 'pendiente'
        });

        const savedOrder = await order.save();

        // ── Descontar stock ──
        for (const item of items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json(savedOrder);

    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ message: 'Error al crear la orden', error: error.message });
    }
};

// ─── OBTENER MIS ÓRDENES (cliente logueado) ────────────────────────────────
// @route  GET /api/orders/my-orders
// @access Privado (cliente)
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product', 'name images');

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
    }
};

// ─── OBTENER UNA ORDEN POR ID ──────────────────────────────────────────────
// @route  GET /api/orders/:id
// @access Privado (dueño de la orden o admin)
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name images sku');

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        // Solo el dueño de la orden o un admin pueden verla
        const isOwner = order.user?.toString() === req.user._id.toString();
        if (!isOwner && !req.user.isAdmin) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la orden', error: error.message });
    }
};

// ─── LISTAR TODAS LAS ÓRDENES (admin) ─────────────────────────────────────
// @route  GET /api/orders
// @access Admin
export const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = status ? { status } : {};

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'name email');

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener órdenes', error: error.message });
    }
};

// ─── ACTUALIZAR ESTADO DE ORDEN (admin) ───────────────────────────────────
// @route  PUT /api/orders/:id/status
// @access Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

        order.status = status || order.status;
        if (adminNotes !== undefined) order.adminNotes = adminNotes;

        // Si el admin marca como cancelado, devolvemos el stock
        if (status === 'cancelado' && order.status !== 'cancelado') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar orden', error: error.message });
    }
};