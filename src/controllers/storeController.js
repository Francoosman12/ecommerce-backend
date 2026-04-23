import StoreConfig from '../models/StoreConfig.js';

// GET — público (el frontend lo usa para leer el reel, datos de contacto, etc.)
export const getStoreConfig = async (req, res) => {
    try {
        let config = await StoreConfig.findOne({ configName: 'MAIN' });
        if (!config) {
            // Primera vez — creamos con valores por defecto
            config = await StoreConfig.create({ configName: 'MAIN' });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener configuración", error: error.message });
    }
};

// PUT — solo admin
export const updateStoreConfig = async (req, res) => {
    try {
        const config = await StoreConfig.findOneAndUpdate(
            { configName: 'MAIN' },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.json(config);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar configuración", error: error.message });
    }
};