import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  calculateItemCost,
  calculateBudgetSummary,
  recalculateItemsForGuestCount,
  generateSavingsSuggestions,
  compareBudgetPlans,
} from '@/features/budget/engine';
import { BudgetItem } from '@/types';

describe('Budget Engine - Deterministic Financial Calculations', () => {
  describe('toCents and fromCents', () => {
    it('accurately converts floating points to integer minor units without precision loss', () => {
      expect(toCents(19.99)).toBe(1999);
      expect(toCents(0.1 + 0.2)).toBe(30); // Classic IEEE-754 test
      expect(fromCents(1999)).toBe(19.99);
      expect(fromCents(30)).toBe(0.3);
    });

    it('safely handles negative amounts, NaN, and infinity', () => {
      expect(toCents(-50)).toBe(0);
      expect(toCents(NaN)).toBe(0);
      expect(toCents(Infinity)).toBe(0);
      expect(fromCents(0)).toBe(0);
    });
  });

  describe('calculateItemCost', () => {
    it('calculates fixed expense regardless of guest count', () => {
      const fixedItem: BudgetItem = {
        id: '1',
        name: 'Sound System',
        category: 'entertainment',
        estimatedCost: 1500,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: false,
      };
      expect(calculateItemCost(fixedItem, 50)).toBe(1500);
      expect(calculateItemCost(fixedItem, 200)).toBe(1500);
    });

    it('calculates variable expense proportional to guest count', () => {
      const perPersonItem: BudgetItem = {
        id: '2',
        name: 'Plated Dinner',
        category: 'catering',
        estimatedCost: 0,
        isPerPerson: true,
        unitCost: 45.5,
        priority: 'must_have',
        confirmed: false,
      };
      expect(calculateItemCost(perPersonItem, 100)).toBe(4550);
      expect(calculateItemCost(perPersonItem, 10)).toBe(455);
    });

    it('gracefully handles missing unitCost or invalid negative guests', () => {
      const badItem: BudgetItem = {
        id: '3',
        name: 'Unknown',
        category: 'miscellaneous',
        estimatedCost: 100,
        isPerPerson: true,
        priority: 'optional',
        confirmed: false,
      };
      expect(calculateItemCost(badItem, 50)).toBe(0);
      expect(calculateItemCost(badItem, -10)).toBe(0);
    });
  });

  describe('calculateBudgetSummary', () => {
    const testItems: BudgetItem[] = [
      {
        id: 'v1',
        name: 'Atrium Venue',
        category: 'venue',
        estimatedCost: 5000,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: true,
        actualCost: 4800,
      },
      {
        id: 'c1',
        name: 'Buffet Catering',
        category: 'catering',
        estimatedCost: 3000,
        isPerPerson: true,
        unitCost: 30,
        priority: 'must_have',
        confirmed: false,
      },
      {
        id: 'd1',
        name: 'Florals',
        category: 'decor',
        estimatedCost: 1000,
        isPerPerson: false,
        priority: 'nice_to_have',
        confirmed: false,
      },
    ];

    it('calculates totals, 10% contingency, and utilization correctly', () => {
      // 100 guests: Venue = 5000, Catering = 30*100 = 3000, Decor = 1000 => Base = 9000
      // 10% contingency = 900 => Grand total = 9900
      const summary = calculateBudgetSummary(testItems, 10000, 100, 10);

      expect(summary.totalBudget).toBe(10000);
      expect(summary.totalEstimatedCost).toBe(9900);
      expect(summary.contingencyReserve).toBe(900);
      expect(summary.remainingBudget).toBe(100);
      expect(summary.isOverBudget).toBe(false);
      expect(summary.utilizationPercentage).toBe(99);
      expect(summary.perGuestCost).toBe(99);
      expect(summary.totalConfirmedCost).toBe(4800);
      expect(summary.categoryBreakdown.venue).toBe(5000);
      expect(summary.categoryBreakdown.catering).toBe(3000);
      expect(summary.categoryBreakdown.decor).toBe(1000);
      expect(summary.categoryBreakdown.contingency).toBe(900);
    });

    it('detects deficit and flags over budget when total exceeds budget', () => {
      const summary = calculateBudgetSummary(testItems, 8000, 100, 10);
      expect(summary.isOverBudget).toBe(true);
      expect(summary.remainingBudget).toBe(-1900);
      expect(summary.utilizationPercentage).toBe(123.75);
    });

    it('handles zero budget safely without division by zero', () => {
      const summary = calculateBudgetSummary(testItems, 0, 100, 10);
      expect(summary.utilizationPercentage).toBe(100);
      expect(summary.remainingBudget).toBe(-9900);
      expect(summary.isOverBudget).toBe(true);
    });
  });

  describe('recalculateItemsForGuestCount', () => {
    it('updates only variable per-person items when guest count shifts', () => {
      const items: BudgetItem[] = [
        {
          id: '1',
          name: 'DJ',
          category: 'entertainment',
          estimatedCost: 1200,
          isPerPerson: false,
          priority: 'must_have',
          confirmed: false,
        },
        {
          id: '2',
          name: 'Favors',
          category: 'stationery',
          estimatedCost: 250,
          isPerPerson: true,
          unitCost: 5,
          priority: 'optional',
          confirmed: false,
        },
      ];

      const recalculated = recalculateItemsForGuestCount(items, 80);
      expect(recalculated[0].estimatedCost).toBe(1200); // Fixed unchanged
      expect(recalculated[1].estimatedCost).toBe(400); // 80 * 5 = 400
    });
  });

  describe('generateSavingsSuggestions', () => {
    const items: BudgetItem[] = [
      {
        id: 'must1',
        name: 'Critical Hall Fee',
        category: 'venue',
        estimatedCost: 4000,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: true,
      },
      {
        id: 'nice1',
        name: 'Live Saxophone Soloist',
        category: 'entertainment',
        estimatedCost: 1000,
        isPerPerson: false,
        priority: 'nice_to_have',
        confirmed: false,
      },
      {
        id: 'opt1',
        name: 'Custom Hologram Booth',
        category: 'entertainment',
        estimatedCost: 800,
        isPerPerson: false,
        priority: 'optional',
        confirmed: false,
      },
    ];

    it('recommends trimming optional items first, followed by nice-to-have, never must-haves', () => {
      const suggestions = generateSavingsSuggestions(items, toCents(1200), 100);

      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      // First recommendation must be the optional item
      expect(suggestions[0].itemId).toBe('opt1');
      expect(suggestions[0].potentialSavings).toBe(800);

      // Second recommendation should be nice-to-have trimmed up to 25% (250)
      if (suggestions.length > 1) {
        expect(suggestions[1].itemId).toBe('nice1');
        expect(suggestions[1].potentialSavings).toBe(250);
      }

      // Must have item should NEVER be recommended for cut
      const hasMustHave = suggestions.some((s) => s.itemId === 'must1');
      expect(hasMustHave).toBe(false);
    });

    it('returns empty array when reduction target is 0 or negative', () => {
      expect(generateSavingsSuggestions(items, 0, 100)).toEqual([]);
      expect(generateSavingsSuggestions(items, -500, 100)).toEqual([]);
    });
  });

  describe('compareBudgetPlans', () => {
    it('correctly compares baseline with proposed plan', () => {
      const base = calculateBudgetSummary([], 10000, 100, 10);
      base.totalEstimatedCost = 9000;
      base.perGuestCost = 90;
      base.utilizationPercentage = 90;

      const target = calculateBudgetSummary([], 10000, 100, 10);
      target.totalEstimatedCost = 7500;
      target.perGuestCost = 75;
      target.utilizationPercentage = 75;

      const comp = compareBudgetPlans(base, target);
      expect(comp.diffCost).toBe(-1500);
      expect(comp.diffPerGuest).toBe(-15);
      expect(comp.diffUtilization).toBe(-15);
      expect(comp.isTargetMoreEconomical).toBe(true);
      expect(comp.costVariancePercentage).toBe(-16.67);
    });
  });
});
