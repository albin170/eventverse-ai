import { z } from 'zod';

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent', 'critical']);
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'completed']);

export const TimelineTaskSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().default(''),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  daysBeforeEvent: z.number().int(),
  priority: TaskPrioritySchema.default('medium'),
  status: TaskStatusSchema.default('todo'),
  category: z.string().default('miscellaneous'),
  dependencies: z.array(z.string()).default([]),
  responsiblePerson: z.string().default('Event Planner'),
  completionPercentage: z.number().min(0).max(100).default(0),
});
