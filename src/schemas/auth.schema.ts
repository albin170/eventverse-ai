import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'user', 'guest']);
export const AccountStatusSchema = z.enum(['active', 'suspended']);

export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1, 'Display name is required'),
  role: UserRoleSchema.default('user'),
  status: AccountStatusSchema.default('active'),
  createdAt: z.string(),
  lastLoginAt: z.string().optional(),
  suspensionReason: z.string().optional(),
});

export const LoginInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
});
