import { z } from 'zod';

export const EventTypeEnum = z.enum([
  'wedding',
  'birthday',
  'anniversary',
  'college_fest',
  'community',
  'custom'
]);
export type EventType = z.infer<typeof EventTypeEnum>;

export const CurrencyCodeEnum = z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']);
export type CurrencyCode = z.infer<typeof CurrencyCodeEnum>;

export const PriorityEnum = z.enum(['budget', 'experience', 'luxury', 'entertainment', 'culinary']);
export type EventPriority = z.infer<typeof PriorityEnum>;

export const EventFormSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters').max(100),
  eventType: EventTypeEnum,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date in YYYY-MM-DD required'),
  location: z.string().min(2, 'Location is required').max(120),
  guestCount: z.number().int().min(1, 'At least 1 guest required').max(50000, 'Guest count exceeds maximum'),
  totalBudget: z.number().positive('Budget must be greater than zero').max(100000000, 'Budget exceeds supported limit'),
  currency: CurrencyCodeEnum.default('USD'),
  theme: z.string().min(2, 'Theme description required').max(100),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color code required'),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Valid hex color code required'),
  culturalPreferences: z.string().max(250).default(''),
  dietaryRequirements: z.array(z.string()).default([]),
  accessibilityRequirements: z.array(z.string()).default([]),
  priority: PriorityEnum.default('experience'),
  notes: z.string().max(1000).default(''),
});

export type EventFormData = z.infer<typeof EventFormSchema>;

export interface EventModel extends EventFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
}
