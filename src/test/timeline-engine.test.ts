import { describe, it, expect } from 'vitest';
import {
  hasDependencyCycle,
  validateDependency,
  calculateDueDate,
  recalculateTaskDates,
  calculateTimelineProgress,
} from '@/features/timeline/engine';
import { TimelineTask } from '@/types';

describe('Timeline Engine - Cycle Detection and Date Sync', () => {
  const baseTasks: TimelineTask[] = [
    {
      id: 'task-a',
      title: 'Book Venue',
      description: '',
      dueDate: '2026-08-01',
      daysBeforeEvent: 90,
      priority: 'critical',
      status: 'completed',
      category: 'venue',
      dependencies: [],
      responsiblePerson: 'Lead',
      completionPercentage: 100,
    },
    {
      id: 'task-b',
      title: 'Send Invitations',
      description: '',
      dueDate: '2026-09-01',
      daysBeforeEvent: 60,
      priority: 'high',
      status: 'in_progress',
      category: 'stationery',
      dependencies: ['task-a'],
      responsiblePerson: 'Lead',
      completionPercentage: 50,
    },
    {
      id: 'task-c',
      title: 'Confirm Seating Plan',
      description: '',
      dueDate: '2026-10-01',
      daysBeforeEvent: 30,
      priority: 'medium',
      status: 'todo',
      category: 'logistics',
      dependencies: ['task-b'],
      responsiblePerson: 'Lead',
      completionPercentage: 0,
    },
  ];

  describe('Cycle Detection (hasDependencyCycle)', () => {
    it('returns false for linear acyclic task graph', () => {
      expect(hasDependencyCycle(baseTasks)).toBe(false);
    });

    it('detects direct circular dependency (A -> B -> A)', () => {
      const cycleMap = {
        'task-a': ['task-b'],
      };
      expect(hasDependencyCycle(baseTasks, cycleMap)).toBe(true);
    });

    it('detects indirect circular cycle (A -> B -> C -> A)', () => {
      const cycleMap = {
        'task-a': ['task-c'],
      };
      expect(hasDependencyCycle(baseTasks, cycleMap)).toBe(true);
    });
  });

  describe('validateDependency', () => {
    it('prevents a task from depending on itself', () => {
      const res = validateDependency('task-a', 'task-a', baseTasks);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('cannot depend on itself');
    });

    it('blocks dependency that would create a cycle', () => {
      const res = validateDependency('task-a', 'task-c', baseTasks);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('circular dependency cycle');
    });

    it('allows valid acyclic dependency addition', () => {
      const res = validateDependency('task-c', 'task-a', baseTasks);
      expect(res.valid).toBe(true);
    });
  });

  describe('calculateDueDate and recalculateTaskDates', () => {
    it('computes correct due date offset from event date', () => {
      const due = calculateDueDate('2026-10-31', 30);
      expect(due).toBe('2026-10-01');
    });

    it('recalculates all task due dates when master event date changes', () => {
      const shifted = recalculateTaskDates(baseTasks, '2026-12-01');
      expect(shifted[0].dueDate).toBe(calculateDueDate('2026-12-01', 90));
      expect(shifted[1].dueDate).toBe(calculateDueDate('2026-12-01', 60));
      expect(shifted[2].dueDate).toBe(calculateDueDate('2026-12-01', 30));
    });
  });

  describe('calculateTimelineProgress', () => {
    it('averages completion percentages accurately', () => {
      // 100 + 50 + 0 = 150 / 3 = 50%
      expect(calculateTimelineProgress(baseTasks)).toBe(50);
    });

    it('handles empty task list', () => {
      expect(calculateTimelineProgress([])).toBe(0);
    });
  });
});
