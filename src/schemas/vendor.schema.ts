import { z } from 'zod';
import { BudgetCategoryEnum } from './budget.schema';

export const VendorTierEnum = z.enum(['$', '$$', '$$$', '$$$$']);
export type VendorTier = z.infer<typeof VendorTierEnum>;

export const EnquiryStatusEnum = z.enum(['none', 'contacted', 'quote_received', 'booked', 'declined']);
export type EnquiryStatus = z.infer<typeof EnquiryStatusEnum>;

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(100),
  category: BudgetCategoryEnum,
  rating: z.number().min(1).max(5),
  reviewCount: z.number().int().nonnegative(),
  priceTier: VendorTierEnum,
  startingPrice: z.number().nonnegative(),
  location: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string(),
  description: z.string(),
  deliverables: z.array(z.string()),
  isShortlisted: z.boolean().default(false),
  enquiryStatus: EnquiryStatusEnum.default('none'),
  quotedAmount: z.number().nonnegative().optional(),
  userNotes: z.string().max(1000).default(''),
  isDemoSample: z.boolean().default(true),
});

export type Vendor = z.infer<typeof VendorSchema>;
