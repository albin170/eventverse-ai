import { z } from 'zod';
import { ExpenseCategorySchema } from './budget.schema';

export const PriceTierSchema = z.enum(['$', '$$', '$$$', '$$$$']);
export const VendorVerificationStatusSchema = z.enum(['verified', 'pending_review', 'suspended']);

export const VendorProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Vendor name must be at least 2 characters'),
  category: ExpenseCategorySchema,
  businessDescription: z.string().min(10, 'Description must be at least 10 characters'),
  serviceArea: z.string().min(2, 'Service area is required'),
  contactEmail: z.string().email('Valid contact email is required'),
  contactPhone: z.string().min(7, 'Valid contact phone is required'),
  startingPrice: z.number().nonnegative('Starting price must be positive or zero'),
  priceTier: PriceTierSchema.default('$$'),
  deliverables: z.array(z.string()).min(1, 'At least one deliverable item is required'),
  verificationStatus: VendorVerificationStatusSchema.default('pending_review'),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  createdAt: z.string(),
});

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2, 'Vendor name must be at least 2 characters'),
  category: z.string(),
  businessDescription: z.string().optional(),
  description: z.string().optional(),
  serviceArea: z.string().optional(),
  location: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  startingPrice: z.number().optional(),
  estimatedStartingPrice: z.number().optional(),
  priceTier: z.string().optional(),
  priceRange: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  deliverables: z.array(z.string()).default([]),
  verificationStatus: VendorVerificationStatusSchema.default('verified'),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  isShortlisted: z.boolean().optional(),
  enquiryStatus: z.string().optional(),
  isDemoSample: z.boolean().optional(),
  userNotes: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
});

