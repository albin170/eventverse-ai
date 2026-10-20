import { z } from 'zod';

export const BudgetCategoryEnum = z.enum([
  'venue_setup',
  'catering_bar',
  'decor_florals',
  'media_production',
  'entertainment',
  'attire_styling',
  'invitations_favors',
  'logistics_security'
]);

export type BudgetCategory = z.infer<typeof BudgetCategoryEnum>;

export const CategoryLabels: Record<BudgetCategory, string> = {
  venue_setup: 'Venue & Staging',
  catering_bar: 'Catering & Beverages',
  decor_florals: 'Decor & Florals',
  media_production: 'Photography & Film',
  entertainment: 'Music & Entertainment',
  attire_styling: 'Attire & Styling',
  invitations_favors: 'Invitations & Favors',
  logistics_security: 'Logistics & Security'
};

export const BudgetItemSchema = z.object({
  id: z.string().min(1),
  categoryId: BudgetCategoryEnum,
  name: z.string().min(1, 'Item name is required').max(100),
  isPerPerson: z.boolean().default(false),
  amount: z.number().nonnegative('Amount cannot be negative').max(10000000),
  priority: z.enum(['must_have', 'nice_to_have', 'optional']).default('must_have'),
  isConfirmedQuote: z.boolean().default(false),
  vendorName: z.string().optional(),
  notes: z.string().max(250).optional(),
});

export type BudgetItem = z.infer<typeof BudgetItemSchema>;

export const BudgetPlanSchema = z.object({
  eventId: z.string(),
  totalBudget: z.number().positive(),
  contingencyPercentage: z.number().min(0).max(30).default(10),
  items: z.array(BudgetItemSchema),
});

export type BudgetPlan = z.infer<typeof BudgetPlanSchema>;

export interface BudgetCalculationResult {
  totalBudgetMinor: number;
  totalExpensesMinor: number;
  fixedExpensesMinor: number;
  perPersonExpensesMinor: number;
  contingencyMinor: number;
  grandTotalMinor: number;
  remainingMinor: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  overBudgetMinor: number;
  costPerGuestMinor: number;
  categoryBreakdownMinor: Record<BudgetCategory, number>;
  // Human readable major units
  totalBudget: number;
  totalExpenses: number;
  contingencyAmount: number;
  grandTotal: number;
  remainingBudget: number;
  costPerGuest: number;
  categoryBreakdown: Record<BudgetCategory, number>;
}
