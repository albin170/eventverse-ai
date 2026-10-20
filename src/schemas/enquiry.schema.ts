import { z } from 'zod';

export const EnquiryStatusSchema = z.enum([
  'submitted',
  'under_review',
  'quoted',
  'declined',
  'closed',
]);

export const VendorEnquirySchema = z.object({
  id: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().min(1),
  eventId: z.string().min(1),
  eventTitle: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  eventDate: z.string(),
  guestCount: z.number().int().positive(),
  estimatedBudget: z.number().nonnegative(),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  status: EnquiryStatusSchema.default('submitted'),
  adminNotes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
