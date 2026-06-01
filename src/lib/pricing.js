export function calculateComprehensivePricing(costPrice, adminSelectedMarginPct, options = {}) {
  const contingencyPct = options.contingencyPct || 2.00
  const shippingCost = options.shippingCost || 0.00
  const otherExpenses = options.otherExpenses || 0.00
  const governmentTaxDeductionPct = options.governmentTaxesPct || 3.00

  const baseCostWithContingency = costPrice * (1 + (contingencyPct / 100))
  const totalUnitCost = baseCostWithContingency + shippingCost + otherExpenses
  const priceWithProfit = totalUnitCost * (1 + (adminSelectedMarginPct / 100))
  const finalSuggestedPrice = priceWithProfit / (1 - (governmentTaxDeductionPct / 100))

  return {
    pureCostPrice: costPrice,
    contingencyAmount: costPrice * (contingencyPct / 100),
    shippingCost,
    otherExpenses,
    totalExpenses: totalUnitCost - costPrice,
    adminMarginAmount: totalUnitCost * (adminSelectedMarginPct / 100),
    governmentTaxAmount: finalSuggestedPrice * (governmentTaxDeductionPct / 100),
    finalPriceForClient: Math.ceil(finalSuggestedPrice),
  }
}
