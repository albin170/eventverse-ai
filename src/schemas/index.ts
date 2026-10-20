import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'wedding',
  'birthday',
  'anniversary',
  'college_fest',
  'community',
  'custom',
]);

export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']);

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

export const BudgetItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Item name is required'),
  category: ExpenseCategorySchema,
  estimatedCost: z.number().nonnegative('Cost must be positive or zero'),
  actualCost: z.number().nonnegative().optional(),
  isPerPerson: z.boolean().default(false),
  unitCost: z.number().nonnegative().optional(),
  priority: z.enum(['must_have', 'nice_to_have', 'optional']),
  confirmed: z.boolean().default(false),
  notes: z.string().optional(),
});

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'completed']);

export const TimelineTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().default(''),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  daysBeforeEvent: z.number().int(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  category: ExpenseCategorySchema,
  dependencies: z.array(z.string()).default([]),
  responsiblePerson: z.string().default('Event Planner'),
  completionPercentage: z.number().min(0).max(100).default(0),
});

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Vendor name is required'),
  category: ExpenseCategorySchema,
  contactName: z.string().default(''),
  email: z.string().email().or(z.literal('')),
  phone: z.string().default(''),
  location: z.string().default(''),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  estimatedStartingPrice: z.number().nonnegative(),
  notes: z.string().optional(),
  isShortlisted: z.boolean().default(false),
  enquiryStatus: z.enum(['not_contacted', 'contacted', 'quoted', 'booked', 'declined']),
  isDemoSample: z.boolean().default(true),
});

export const Venue3DConfigSchema = z.object({
  themeColor: z.string(),
  accentColor: z.string(),
  lightingPreset: z.enum(['romantic', 'vibrant', 'minimal', 'evening']),
  stagePosition: z.enum(['front', 'center', 'none']),
  tableLayout: z.enum(['banquet', 'cocktail', 'theater', 'u_shape']),
  tableCount: z.number().int().min(1).max(50),
  danceFloor: z.boolean(),
  ambientBrightness: z.number().min(0.1).max(2.0),
});

export const WizardInputSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  eventType: EventTypeSchema,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  guestCount: z
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int('Guest count must be an integer')
    .min(1, 'At least 1 guest required')
    .max(50000, 'Guest count cannot exceed 50,000'),
  totalBudget: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .positive('Total budget must be greater than zero')
    .max(100000000, 'Budget exceeds supported limit'),
  currency: CurrencyCodeSchema,
  contingencyPercentage: z.number().min(0).max(30).default(10),
  theme: z.string().min(1, 'Theme is required'),
  colorPalette: z.array(z.string()).min(1, 'Select at least one color'),
  culturalPreferences: z.string().default('None'),
  dietaryRequirements: z.array(z.string()).default([]),
  venuePreferences: z.string().min(1, 'Venue preference is required'),
  accessibilityRequirements: z.array(z.string()).default([]),
  priorities: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
});

export const AIPlanResponseSchema = z.object({
  conceptSummary: z.string().min(10),
  decorIdeas: z.array(z.string()).min(2),
  entertainmentIdeas: z.array(z.string()).min(1),
  menuSuggestions: z.array(z.string()).min(2),
  costSavingTips: z.array(z.string()).min(1),
  riskContingencies: z.array(
    z.object({
      risk: z.string().min(2),
      mitigation: z.string().min(2),
    })
  ).min(1),
  suggestedBudgetItems: z.array(
    z.object({
      name: z.string().min(1),
      category: ExpenseCategorySchema,
      isPerPerson: z.boolean(),
      unitCost: z.number().nonnegative().optional(),
      estimatedCost: z.number().nonnegative(),
      priority: z.enum(['must_have', 'nice_to_have', 'optional']),
      notes: z.string().optional(),
    })
  ).min(3),
  suggestedTasks: z.array(
    z.object({
      title: z.string().min(2),
      description: z.string(),
      daysBeforeEvent: z.number().int(),
      priority: TaskPrioritySchema,
      category: ExpenseCategorySchema,
      responsiblePerson: z.string(),
    })
  ).min(3),
});

export const EventPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventType: EventTypeSchema,
  eventDate: z.string(),
  location: z.string().optional(),
  guestCount: z.number().int().positive(),
  totalBudget: z.number().positive(),
  currency: CurrencyCodeSchema,
  contingencyPercentage: z.number().min(0).max(30),
  theme: z.string(),
  colorPalette: z.array(z.string()),
  culturalPreferences: z.string(),
  dietaryRequirements: z.array(z.string()),
  venuePreferences: z.string(),
  accessibilityRequirements: z.array(z.string()),
  priorities: z.array(z.string()),
  restrictions: z.array(z.string()),
  notes: z.string().optional(),
  conceptSummary: z.string(),
  decorIdeas: z.array(z.string()),
  entertainmentIdeas: z.array(z.string()),
  menuSuggestions: z.array(z.string()),
  costSavingTips: z.array(z.string()),
  riskContingencies: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    })
  ),
  budgetItems: z.array(BudgetItemSchema),
  tasks: z.array(TimelineTaskSchema),
  vendors: z.array(VendorSchema),
  venue3D: Venue3DConfigSchema,
  scenarios: z.array(z.any()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
