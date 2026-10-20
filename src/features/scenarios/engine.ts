import {
  BudgetItem,
  BudgetSummary,
  ExpenseCategory,
  WhatIfScenario,
} from '@/types';
import {
  calculateBudgetSummary,
  calculateItemCost,
  compareBudgetPlans,
  toCents,
  fromCents,
} from '@/features/budget/engine';

export interface ScenarioCalculationResult {
  scenarioId: string;
  name: string;
  simulatedGuestCount: number;
  simulatedBudgetItems: BudgetItem[];
  summary: BudgetSummary;
  comparisonWithBaseline: {
    diffCost: number;
    diffPerGuest: number;
    diffUtilization: number;
    isTargetMoreEconomical: boolean;
    costVariancePercentage: number;
    diff: {
      costDifference: number;
      perGuestDifference: number;
      remainingDifference: number;
      utilizationDifference: number;
      isTargetMoreEconomical: boolean;
      costVariancePercentage: number;
    };
  };
}

/**
 * Calculates simulated budget summary based on custom guest count and category percentage adjustments.
 */
export function calculateScenario(
  baseItems: BudgetItem[],
  totalBudget: number,
  baseGuestCount: number,
  scenario: WhatIfScenario,
  contingencyPercentage: number = 10
): ScenarioCalculationResult {
  const simulatedGuests = Math.max(1, Math.floor(scenario.guestCount || 1));

  // Build multiplier map by category
  const categoryMultipliers: Partial<Record<ExpenseCategory, number>> = {};
  for (const adj of scenario.customAdjustments) {
    categoryMultipliers[adj.category] = 1 + adj.percentageAdjustment / 100;
  }

  const simulatedItems: BudgetItem[] = baseItems.map((item) => {
    let cost = calculateItemCost(item, simulatedGuests);
    const multiplier = categoryMultipliers[item.category] ?? 1.0;
    const adjustedCostCents = Math.round(toCents(cost) * multiplier);
    cost = fromCents(Math.max(0, adjustedCostCents));

    return {
      ...item,
      estimatedCost: cost,
    };
  });

  const baseSummary = calculateBudgetSummary(
    baseItems,
    totalBudget,
    baseGuestCount,
    contingencyPercentage
  );

  const simulatedSummary = calculateBudgetSummary(
    simulatedItems,
    totalBudget,
    simulatedGuests,
    contingencyPercentage
  );

  const comparison = compareBudgetPlans(baseSummary, simulatedSummary);

  return {
    scenarioId: scenario.id,
    name: scenario.name,
    simulatedGuestCount: simulatedGuests,
    simulatedBudgetItems: simulatedItems,
    summary: simulatedSummary,
    comparisonWithBaseline: {
      ...comparison,
      diff: {
        costDifference: comparison.diffCost,
        perGuestDifference: comparison.diffPerGuest,
        remainingDifference: simulatedSummary.remainingBudget - baseSummary.remainingBudget,
        utilizationDifference: comparison.diffUtilization,
        isTargetMoreEconomical: comparison.isTargetMoreEconomical,
        costVariancePercentage: comparison.costVariancePercentage,
      },
    },
  };
}

/**
 * Creates preset realistic scenarios for fast exploration:
 * 1. Intimate VIP Gathering (-30% guests, premium catering +20%)
 * 2. Mega Celebration (+50% guests, optimized stationery -30%)
 * 3. Budget-Smart Optimization (0% guests, trim decor -25%, entertainment -15%)
 */
export function createDefaultScenarios(
  baseGuestCount: number,
  baseItems: BudgetItem[],
  totalBudget: number
): WhatIfScenario[] {
  const s1Guests = Math.max(10, Math.round(baseGuestCount * 0.7));
  const s2Guests = Math.round(baseGuestCount * 1.4);

  const scenario1: WhatIfScenario = {
    id: 'scenario-intimate-vip',
    name: 'Intimate VIP & Luxe Experience',
    guestCount: s1Guests,
    customAdjustments: [
      { category: 'catering', percentageAdjustment: 20 },
      { category: 'decor', percentageAdjustment: 15 },
    ],
    notes: 'Smaller guest headcount with luxury culinary and bespoke floral upgrades.',
    calculatedCost: 0,
    calculatedPerGuest: 0,
    calculatedUtilization: 0,
  };

  const scenario2: WhatIfScenario = {
    id: 'scenario-large-gathering',
    name: 'Expanded Guest List (+40% Headcount)',
    guestCount: s2Guests,
    customAdjustments: [
      { category: 'stationery', percentageAdjustment: -20 },
      { category: 'logistics', percentageAdjustment: 25 },
    ],
    notes: 'Accommodate extended colleagues and friends with bulk logistics discounts.',
    calculatedCost: 0,
    calculatedPerGuest: 0,
    calculatedUtilization: 0,
  };

  const scenario3: WhatIfScenario = {
    id: 'scenario-value-smart',
    name: 'Lean & Cost-Optimized Plan',
    guestCount: baseGuestCount,
    customAdjustments: [
      { category: 'decor', percentageAdjustment: -25 },
      { category: 'entertainment', percentageAdjustment: -20 },
      { category: 'stationery', percentageAdjustment: -35 },
    ],
    notes: 'Maintains full guest attendance while trimming optional stylistic elements.',
    calculatedCost: 0,
    calculatedPerGuest: 0,
    calculatedUtilization: 0,
  };

  return [scenario1, scenario2, scenario3].map((sc) => {
    const calc = calculateScenario(baseItems, totalBudget, baseGuestCount, sc);
    return {
      ...sc,
      calculatedCost: calc.summary.totalEstimatedCost,
      calculatedPerGuest: calc.summary.perGuestCost,
      calculatedUtilization: calc.summary.utilizationPercentage,
    };
  });
}
