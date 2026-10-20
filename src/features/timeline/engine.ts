import { TimelineTask, TaskPriority, ExpenseCategory } from '@/types';

/**
 * Checks if adding or updating dependencies introduces a cycle.
 * Returns true if a cycle is detected, false otherwise.
 */
export function hasDependencyCycle(
  tasks: TimelineTask[],
  newDependencyMap?: Record<string, string[]>
): boolean {
  // Build adjacency list: task -> tasks that it depends on
  const adj = new Map<string, string[]>();

  for (const t of tasks) {
    const deps = newDependencyMap && newDependencyMap[t.id] !== undefined
      ? newDependencyMap[t.id]
      : t.dependencies;
    adj.set(t.id, [...deps]);
  }

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited

  for (const taskId of adj.keys()) {
    visited.set(taskId, 0);
  }

  function dfs(node: string): boolean {
    visited.set(node, 1); // Mark as currently in recursion stack
    const neighbors = adj.get(node) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        // Unknown task id dependency, skip or consider harmless
        continue;
      }
      if (visited.get(neighbor) === 1) {
        // Detected back-edge (cycle)
        return true;
      }
      if (visited.get(neighbor) === 0) {
        if (dfs(neighbor)) return true;
      }
    }

    visited.set(node, 2); // Mark as processed
    return false;
  }

  for (const taskId of adj.keys()) {
    if (visited.get(taskId) === 0) {
      if (dfs(taskId)) return true;
    }
  }

  return false;
}

/**
 * Validates whether a specific dependency addition is safe.
 * Returns { valid: boolean, reason?: string }
 */
export function validateDependency(
  taskId: string,
  dependencyId: string,
  tasks: TimelineTask[]
): { valid: boolean; reason?: string } {
  if (taskId === dependencyId) {
    return { valid: false, reason: 'A task cannot depend on itself.' };
  }

  const task = tasks.find((t) => t.id === taskId);
  const dep = tasks.find((t) => t.id === dependencyId);

  if (!task || !dep) {
    return { valid: false, reason: 'Target task or dependency does not exist.' };
  }

  if (task.dependencies.includes(dependencyId)) {
    return { valid: true }; // already exists
  }

  const updatedDeps: Record<string, string[]> = {
    [taskId]: [...task.dependencies, dependencyId],
  };

  if (hasDependencyCycle(tasks, updatedDeps)) {
    return {
      valid: false,
      reason: `Adding dependency "${dep.title}" would create a circular dependency cycle.`,
    };
  }

  return { valid: true };
}

/**
 * Calculates a due date string (YYYY-MM-DD) from event date and daysBeforeEvent.
 */
export function calculateDueDate(eventDateStr: string, daysBeforeEvent: number): string {
  const eventDate = new Date(eventDateStr);
  if (isNaN(eventDate.getTime())) {
    return eventDateStr;
  }

  const dueDate = new Date(eventDate.getTime());
  dueDate.setUTCDate(dueDate.getUTCDate() - daysBeforeEvent);

  return dueDate.toISOString().split('T')[0];
}

/**
 * When the master event date shifts, recalculates due dates for all tasks
 * based on their `daysBeforeEvent` offset.
 */
export function recalculateTaskDates(
  tasks: TimelineTask[],
  newEventDateStr: string
): TimelineTask[] {
  return tasks.map((task) => {
    const newDueDate = calculateDueDate(newEventDateStr, task.daysBeforeEvent);
    return {
      ...task,
      dueDate: newDueDate,
    };
  });
}

/**
 * Calculates overall timeline progress percentage (0-100).
 */
export function calculateTimelineProgress(tasks: TimelineTask[]): number {
  if (!tasks.length) return 0;
  const totalCompletion = tasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0);
  return Math.round(totalCompletion / tasks.length);
}

/**
 * Determines if all prerequisites for a given task are completed.
 */
export function arePrerequisitesMet(task: TimelineTask, allTasks: TimelineTask[]): boolean {
  if (!task.dependencies || task.dependencies.length === 0) return true;
  return task.dependencies.every((depId) => {
    const depTask = allTasks.find((t) => t.id === depId);
    return depTask ? depTask.status === 'completed' : true;
  });
}

/**
 * Generates initial default tasks tailored for the event type and date.
 */
export function createDefaultTasks(
  eventDateStr: string,
  _eventType?: string
): TimelineTask[] {
  const defaults: Array<{
    title: string;
    description: string;
    daysBefore: number;
    priority: TaskPriority;
    category: ExpenseCategory;
    responsiblePerson: string;
  }> = [
    {
      title: 'Finalize Event Venue & Sign Contract',
      description: 'Review venue terms, capacity, security deposits, and accessibility features.',
      daysBefore: 90,
      priority: 'critical',
      category: 'venue',
      responsiblePerson: 'Lead Planner',
    },
    {
      title: 'Book Catering & Confirm Menu Tasting',
      description: 'Account for dietary restrictions, finalize headcounts, and lock pricing.',
      daysBefore: 60,
      priority: 'high',
      category: 'catering',
      responsiblePerson: 'Catering Lead',
    },
    {
      title: 'Send Save-the-Dates & Collect RSVPs',
      description: 'Distribute digital and printed invitations; track dietary needs.',
      daysBefore: 45,
      priority: 'high',
      category: 'stationery',
      responsiblePerson: 'Host',
    },
    {
      title: 'Confirm Entertainment, Music & AV Equipment',
      description: 'Sound check schedule, playlist curation, and backup microphones.',
      daysBefore: 30,
      priority: 'medium',
      category: 'entertainment',
      responsiblePerson: 'Audio Lead',
    },
    {
      title: 'Finalize Decor & Theme Color Arrangements',
      description: 'Florals, table centerpieces, entrance archway, and ambient lighting.',
      daysBefore: 20,
      priority: 'medium',
      category: 'decor',
      responsiblePerson: 'Decorator',
    },
    {
      title: 'Schedule Rehearsal & Logistics Briefing',
      description: 'Walkthrough with key participants, emergency contact distribution.',
      daysBefore: 7,
      priority: 'high',
      category: 'logistics',
      responsiblePerson: 'Event Coordinator',
    },
    {
      title: 'Final Vendor Confirmation & Day-of Timeline Sync',
      description: 'Reconfirm load-in times, parking permits, and emergency contacts.',
      daysBefore: 2,
      priority: 'critical',
      category: 'logistics',
      responsiblePerson: 'Lead Planner',
    },
  ];

  return defaults.map((d, index) => {
    const id = `task-default-${index + 1}`;
    const dueDate = calculateDueDate(eventDateStr, d.daysBefore);
    return {
      id,
      title: d.title,
      description: d.description,
      dueDate,
      daysBeforeEvent: d.daysBefore,
      priority: d.priority,
      status: 'todo',
      category: d.category,
      dependencies: index > 0 && index < 3 ? [`task-default-${index}`] : [],
      responsiblePerson: d.responsiblePerson,
      completionPercentage: 0,
    };
  });
}
