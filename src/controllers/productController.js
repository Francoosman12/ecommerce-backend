import Product from '../models/Product.js';
import { getPricingCalculator } from '../utils/pricingHelper.js';

// ─── GET ALL PRODUCTS con precios calculados ───────────────────────────────
export const getProducts = async (req, res) => {
    try {
        const calcPrices = await getPricingCalculator();

        // Admin ve todo, público solo activos
        const filter = req.query.all === 'true' ? {} : { isActive: true };

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .populate('category', 'name slug');

        const productsWithPricing = products.map(p => calcPrices(p.toObject()));

        res.json(productsWithPricing);
    } catch (error) {
        console.error('Error en getProducts:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

// ─── GET PRODUCTO POR ID con precios calculados ────────────────────────────
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug');

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Reutilizamos el mismo helper — misma lógica, cero duplicación
        const calcPrices = await getPricingCalculator();
        const productWithPricing = calcPrices(product.toObject());

        res.json(productWithPricing);
    } catch (error) {
        console.error('Error en getProductById:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

// ─── CREAR PRODUCTO ────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
    try {
        let imagesData = [];

        if (req.files && req.files.length > 0) {
            imagesData = req.files.map(file => ({
                url:       file.path,
                public_id: file.filename
            }));
        }

        const newProduct = new Product({
            ...req.body,
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
            images:   imagesData
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ message: 'Error al crear producto', error: error.message });
    }
};

// ─── ACTUALIZAR PRODUCTO ───────────────────────────────────────────────────
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

        // Imágenes existentes que el frontend conservó
        if (req.body.existingImages) {
            product.images = JSON.parse(req.body.existingImages);
        }

        // Nuevas imágenes subidas
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url:       file.path,
                public_id: file.filename
            }));
            product.images.push(...newImages);
        }

        // Campos de texto
        product.name        = req.body.name        || product.name;
        product.sku         = req.body.sku         || product.sku;
        product.priceBase   = req.body.priceBase   || product.priceBase;
        product.stock       = req.body.stock       || product.stock;
        product.description = req.body.description || product.description;
        product.category    = req.body.category    || product.category;

        if (req.body.videoUrl  !== undefined) product.videoUrl  = req.body.videoUrl;
        if (req.body.isActive  !== undefined) product.isActive  = req.body.isActive  === 'true' || req.body.isActive  === true;
        if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error en updateProduct:', error);
        res.status(400).json({ message: 'Error al actualizar producto', error: error.message });
    }
};

// ─── ELIMINAR PRODUCTO ─────────────────────────────────────────────────────
export const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
};