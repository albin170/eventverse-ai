import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'completed']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TimelineTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2, 'Task title is required').max(120),
  description: z.string().max(500).default(''),
  category: z.string().default('General'),
  daysBeforeEvent: z.number().int('Days before event must be integer').min(-30).max(730),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD date required'),
  status: TaskStatusEnum.default('todo'),
  priority: TaskPriorityEnum.default('medium'),
  dependencies: z.array(z.string()).default([]),
  responsiblePerson: z.string().max(80).default('Host'),
  completedAt: z.string().nullable().optional(),
});

export type TimelineTask = z.infer<typeof TimelineTaskSchema>;

export interface MilestoneGroup {
  id: string;
  name: string;
  timeframe: string;
  tasks: TimelineTask[];
}
