import { z } from 'zod';

export const RsvpStatusSchema = z.enum(['attending', 'declined', 'tentative', 'pending']);
export const GuestCategorySchema = z.enum(['family', 'friends', 'colleagues', 'vip', 'general']);

export const GuestRecordSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().min(1, 'Guest name is required'),
  email: z.string().email().or(z.literal('')),
  phone: z.string().optional(),
  rsvpStatus: RsvpStatusSchema.default('pending'),
  category: GuestCategorySchema.default('general'),
  dietaryRequirements: z.string().default('None'),
  accessibilityNotes: z.string().optional(),
  seatingGroup: z.string().optional(),
  plusOnes: z.number().int().min(0).max(10).default(0),
  invitedAt: z.string(),
  respondedAt: z.string().optional(),
});
