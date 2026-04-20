import FinancialConfig from '../models/FinancialConfig.js';

/**
 * Carga la config financiera una sola vez y devuelve
 * una función que calcula precios para cualquier producto.
 *
 * Uso:
 *   const calcPrices = await getPricingCalculator();
 *   const productConPrecios = calcPrices(productObj);
 */
export const getPricingCalculator = async () => {
    const config = await FinancialConfig.findOne({ configName: 'MAIN' });

    const listMarkup = config?.cashDiscount ?? 0;
    const plans      = config?.cardPlans    ?? [];

    return function calcPrices(product) {
        const priceCash = product.priceBase;
        const priceList = Math.round(priceCash * (1 + listMarkup / 100));

        const financing = plans
            .filter(plan => plan.isActive)
            .map(plan => {
                const finalPrice = priceCash * (1 + plan.interestRate / 100);
                return {
                    planName:         plan.name,
                    installments:     plan.installments,
                    totalPrice:       Math.round(finalPrice),
                    installmentValue: Math.round(finalPrice / plan.installments)
                };
            });

        return {
            ...product,
            prices: {
                base:       priceCash,
                cash:       Math.round(priceCash),
                list:       priceList,
                listMarkup,
                financing
            }
        };
    };
};