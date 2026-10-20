import { z } from 'zod';

export const ExpenseCategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'entertainment',
  'photography',
  'attire',
  'logistics',
  'stationery',
  'contingency',
  'miscellaneous',
]);

export const ItemPrioritySchema = z.enum(['must_have', 'nice_to_have', 'optional']);
export const PaymentStatusSchema = z.enum(['unpaid', 'deposit_paid', 'fully_paid']);

export const BudgetItemSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  estimatedCost: z.number().nonnegative('Estimated cost must be positive or zero').optional(),
  amount: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().optional(),
  paidAmount: z.number().nonnegative().default(0),
  paymentStatus: PaymentStatusSchema.default('unpaid'),
  isPerPerson: z.boolean().default(false),
  unitCost: z.number().nonnegative().optional(),
  priority: ItemPrioritySchema.default('nice_to_have'),
  confirmed: z.boolean().default(false),
  isConfirmedQuote: z.boolean().optional(),
  vendorId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export const BudgetPlanSchema = z.object({
  eventId: z.string().min(1).optional(),
  totalBudget: z.number().nonnegative('Total budget must be positive or zero'),
  contingencyPercentage: z.number().min(0).max(30).default(10),
  items: z.array(BudgetItemSchema),
});
