import { BudgetItem, BudgetSummary, ExpenseCategory } from '@/types';

/**
 * Normalizes an amount into integer cents (minor currency units)
 * to avoid IEEE-754 floating point arithmetic issues.
 */
export function toCents(amount: number): number {
  if (isNaN(amount) || !isFinite(amount) || amount < 0) {
    return 0;
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to base currency units.
 */
export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/**
 * Calculates the computed cost of a single budget item based on guest count.
 */
export function calculateItemCost(item: BudgetItem, guestCount: number): number {
  const safeGuests = Math.max(0, Math.floor(guestCount || 0));

  if (item.isPerPerson) {
    const unitCost = Math.max(0, item.unitCost ?? 0);
    const unitCents = toCents(unitCost);
    return fromCents(unitCents * safeGuests);
  }

  return Math.max(0, item.estimatedCost || 0);
}

/**
 * Calculates the complete budget summary, including categories, utilization,
 * contingency reserves, per-guest costs, and over-budget flags.
 */
export function calculateBudgetSummary(
  items: BudgetItem[],
  totalBudget: number,
  guestCount: number,
  contingencyPercentage: number = 10
): BudgetSummary {
  const safeBudget = Math.max(0, totalBudget || 0);
  const safeGuests = Math.max(1, Math.floor(guestCount || 1));
  const safeContingencyPct = Math.min(30, Math.max(0, contingencyPercentage || 0));

  const initialCategories: Record<ExpenseCategory, number> = {
    venue: 0,
    catering: 0,
    decor: 0,
    entertainment: 0,
    photography: 0,
    attire: 0,
    logistics: 0,
    stationery: 0,
    contingency: 0,
    miscellaneous: 0,
  };

  let totalEstimatedCents = 0;
  let totalConfirmedCents = 0;

  const categoryBreakdownCents: Record<ExpenseCategory, number> = {
    venue: 0,
    catering: 0,
    decor: 0,
    entertainment: 0,
    photography: 0,
    attire: 0,
    logistics: 0,
    stationery: 0,
    contingency: 0,
    miscellaneous: 0,
  };

  for (const item of items) {
    const cost = calculateItemCost(item, safeGuests);
    const costCents = toCents(cost);

    totalEstimatedCents += costCents;

    if (item.confirmed) {
      const actualCost = item.actualCost !== undefined ? item.actualCost : cost;
      totalConfirmedCents += toCents(actualCost);
    }

    if (item.category in categoryBreakdownCents) {
      categoryBreakdownCents[item.category] += costCents;
    } else {
      categoryBreakdownCents.miscellaneous += costCents;
    }
  }

  // Calculate contingency reserve based on base estimated costs
  const contingencyCents = Math.round((totalEstimatedCents * safeContingencyPct) / 100);
  categoryBreakdownCents.contingency = contingencyCents;
  const grandTotalCents = totalEstimatedCents + contingencyCents;

  const budgetCents = toCents(safeBudget);
  const remainingCents = budgetCents - grandTotalCents;
  const isOverBudget = remainingCents < 0;

  const utilizationPercentage =
    budgetCents > 0
      ? Number(((grandTotalCents / budgetCents) * 100).toFixed(2))
      : 100;

  const categoryBreakdown: Record<ExpenseCategory, number> = { ...initialCategories };
  for (const cat of Object.keys(categoryBreakdownCents) as ExpenseCategory[]) {
    categoryBreakdown[cat] = fromCents(categoryBreakdownCents[cat]);
  }

  const totalEstimatedCost = fromCents(grandTotalCents);
  const perGuestCost = fromCents(Math.round(grandTotalCents / safeGuests));

  return {
    totalBudget: safeBudget,
    totalEstimatedCost,
    totalConfirmedCost: fromCents(totalConfirmedCents),
    remainingBudget: fromCents(remainingCents),
    utilizationPercentage,
    perGuestCost,
    contingencyReserve: fromCents(contingencyCents),
    contingencyPercentage: safeContingencyPct,
    isOverBudget,
    categoryBreakdown,
  };
}

/**
 * Re-evaluates all items when the guest count changes.
 * Returns a new list of budget items with updated costs.
 */
export function recalculateItemsForGuestCount(
  items: BudgetItem[],
  newGuestCount: number
): BudgetItem[] {
  const safeGuests = Math.max(1, Math.floor(newGuestCount || 1));
  return items.map((item) => {
    if (!item.isPerPerson) return { ...item };
    const cost = calculateItemCost(item, safeGuests);
    return {
      ...item,
      estimatedCost: cost,
    };
  });
}

export interface SavingsRecommendation {
  itemId: string;
  itemName: string;
  category: ExpenseCategory;
  currentCost: number;
  suggestedCost: number;
  potentialSavings: number;
  reason: string;
}

/**
 * Generates deterministic cost-saving suggestions without violating 'must_have' priorities.
 * Identifies 'optional' and 'nice_to_have' items that can be optimized or reduced.
 */
export function generateSavingsSuggestions(
  items: BudgetItem[],
  targetReductionCents: number,
  guestCount: number
): SavingsRecommendation[] {
  const recommendations: SavingsRecommendation[] = [];
  if (targetReductionCents <= 0) return recommendations;

  let accumulatedSavingsCents = 0;

  // Priority 1: Optional items (candidate for 50% or full cut)
  const optionalItems = items.filter((i) => i.priority === 'optional');
  for (const item of optionalItems) {
    const cost = calculateItemCost(item, guestCount);
    const itemCents = toCents(cost);
    if (itemCents <= 0) continue;

    const suggestedReductionCents = Math.min(
      itemCents,
      targetReductionCents - accumulatedSavingsCents
    );
    const newCostCents = itemCents - suggestedReductionCents;

    recommendations.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentCost: cost,
      suggestedCost: fromCents(newCostCents),
      potentialSavings: fromCents(suggestedReductionCents),
      reason: `Classified as Optional: Can be trimmed or deferred to protect essential priorities.`,
    });

    accumulatedSavingsCents += suggestedReductionCents;
    if (accumulatedSavingsCents >= targetReductionCents) {
      return recommendations;
    }
  }

  // Priority 2: Nice to have items (candidate for up to 25% trimming)
  const niceToHaveItems = items.filter((i) => i.priority === 'nice_to_have');
  for (const item of niceToHaveItems) {
    const cost = calculateItemCost(item, guestCount);
    const itemCents = toCents(cost);
    if (itemCents <= 0) continue;

    const maxTrimCents = Math.round(itemCents * 0.25);
    const suggestedReductionCents = Math.min(
      maxTrimCents,
      targetReductionCents - accumulatedSavingsCents
    );
    if (suggestedReductionCents <= 0) continue;

    const newCostCents = itemCents - suggestedReductionCents;
    recommendations.push({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentCost: cost,
      suggestedCost: fromCents(newCostCents),
      potentialSavings: fromCents(suggestedReductionCents),
      reason: `Nice-to-Have: Recommend renegotiating scope or opting for standard tier (approx. 20-25% reduction).`,
    });

    accumulatedSavingsCents += suggestedReductionCents;
    if (accumulatedSavingsCents >= targetReductionCents) {
      break;
    }
  }

  return recommendations;
}

/**
 * Compares two scenarios or plans deterministically.
 */
export function compareBudgetPlans(
  baseSummary: BudgetSummary,
  targetSummary: BudgetSummary
) {
  const diffCost = fromCents(
    toCents(targetSummary.totalEstimatedCost) - toCents(baseSummary.totalEstimatedCost)
  );
  const diffPerGuest = fromCents(
    toCents(targetSummary.perGuestCost) - toCents(baseSummary.perGuestCost)
  );
  const diffUtilization = Number(
    (targetSummary.utilizationPercentage - baseSummary.utilizationPercentage).toFixed(2)
  );

  return {
    diffCost,
    diffPerGuest,
    diffUtilization,
    isTargetMoreEconomical: diffCost < 0,
    costVariancePercentage:
      baseSummary.totalEstimatedCost > 0
        ? Number(
            ((diffCost / baseSummary.totalEstimatedCost) * 100).toFixed(2)
          )
        : 0,
  };
}

/**
 * Formats a major currency amount accurately.
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

