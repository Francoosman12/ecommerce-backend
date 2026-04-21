import FinancialConfig from '../models/FinancialConfig.js';

export const getPricingCalculator = async () => {
    const config = await FinancialConfig.findOne({ configName: 'MAIN' });

    const listMarkup = config?.cashDiscount ?? 0;
    const plans      = config?.cardPlans    ?? [];

    return function calcPrices(product) {
        const hasOffer  = product.priceOffer && product.priceOffer > 0;
        const priceCash = hasOffer ? product.priceOffer : product.priceBase;
        const priceList = hasOffer
            ? product.priceBase
            : Math.round(product.priceBase * (1 + listMarkup / 100));

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
                base:       product.priceBase,
                cash:       Math.round(priceCash),
                list:       priceList,
                listMarkup: hasOffer ? null : listMarkup,
                hasOffer,
                financing
            }
        };
    };
};