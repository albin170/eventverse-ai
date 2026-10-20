import { z } from 'zod';

export const AuditTargetTypeSchema = z.enum([
  'user',
  'event',
  'vendor',
  'enquiry',
  'setting',
  'system',
]);

export const AuditLogRecordSchema = z.object({
  id: z.string().min(1),
  actorId: z.string().min(1),
  actorEmail: z.string().email(),
  action: z.string().min(1),
  targetType: AuditTargetTypeSchema,
  targetId: z.string().min(1),
  reason: z.string().min(1, 'Audit reason is required'),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string(),
});
