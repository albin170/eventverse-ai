import React, { useState } from 'react';
import { TimelineTask, TaskPriority, TaskStatus, ExpenseCategory } from '@/types';
import {
  calculateDueDate,
  calculateTimelineProgress,
  recalculateTaskDates,
  validateDependency,
} from './engine';
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  AlertCircleIcon,
} from '@/components/icons';

interface TimelineViewProps {
  tasks: TimelineTask[];
  eventDate: string;
  onUpdateTasks: (updated: TimelineTask[]) => void;
  onUpdateEventDate: (newDate: string) => void;
  onUpdateEventDateAndTasks?: (newDate: string, updated: TimelineTask[]) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  eventDate,
  onUpdateTasks,
  onUpdateEventDate,
  onUpdateEventDateAndTasks,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDaysBefore, setNewDaysBefore] = useState(14);
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('logistics');
  const [newResponsible, setNewResponsible] = useState('Event Planner');
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  const overallProgress = calculateTimelineProgress(tasks);

  // Toggle task status
  const toggleTaskStatus = (task: TimelineTask) => {
    const nextStatus: TaskStatus =
      task.status === 'completed'
        ? 'todo'
        : task.status === 'todo'
          ? 'in_progress'
          : 'completed';

    const nextPct = nextStatus === 'completed' ? 100 : nextStatus === 'in_progress' ? 50 : 0;

    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus, completionPercentage: nextPct } : t
    );
    onUpdateTasks(updated);
  };

  // Change master event date and shift all deadlines
  const handleEventDateShift = (newDate: string) => {
    const shiftedTasks = recalculateTaskDates(tasks, newDate);
    if (onUpdateEventDateAndTasks) {
      onUpdateEventDateAndTasks(newDate, shiftedTasks);
    } else {
      onUpdateEventDate(newDate);
      onUpdateTasks(shiftedTasks);
    }
  };

  // Delete a task
  const handleDeleteTask = (id: string) => {
    const updated = tasks
      .filter((t) => t.id !== id)
      .map((t) => ({
        ...t,
        dependencies: t.dependencies.filter((depId) => depId !== id),
      }));
    onUpdateTasks(updated);
  };

  // Add a new task with dependency cycle check
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskId = `task-custom-${Date.now()}`;
    const calculatedDue = calculateDueDate(eventDate, newDaysBefore);

    const newTask: TimelineTask = {
      id: taskId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: calculatedDue,
      daysBeforeEvent: newDaysBefore,
      priority: newPriority,
      status: 'todo',
      category: newCategory,
      dependencies: selectedDependency ? [selectedDependency] : [],
      responsiblePerson: newResponsible.trim() || 'Lead Planner',
      completionPercentage: 0,
    };

    if (selectedDependency) {
      const val = validateDependency(taskId, selectedDependency, [...tasks, newTask]);
      if (!val.valid) {
        setDependencyError(val.reason || 'Dependency error detected.');
        return;
      }
    }

    onUpdateTasks([...tasks, newTask]);
    setNewTitle('');
    setNewDescription('');
    setSelectedDependency('');
    setDependencyError(null);
    setShowAddModal(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header, Progress & Event Date Shift Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold font-display text-white">
              Event Timeline & Milestones
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Automated milestone tracking with circular dependency guards and event-date sync.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-midnight-900 px-3 py-1.5 rounded-xl border border-white/10">
              <CalendarIcon size={16} className="text-cyan-400" />
              <label htmlFor="master-event-date" className="text-xs text-slate-400">
                Event Date:
              </label>
              <input
                id="master-event-date"
                type="date"
                value={eventDate}
                onChange={(e) => handleEventDateShift(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                title="Shift event date to recalculate all deadlines automatically"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all"
            >
              <PlusIcon size={14} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Milestone metrics */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Overall Timeline Execution</span>
              <span className="text-cyan-400 font-bold">{overallProgress}% Completed</span>
            </div>
            <div
              className="w-full bg-midnight-900 h-2.5 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall timeline completion progress"
            >
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-around bg-midnight-900/60 p-2 rounded-xl border border-white/5 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Tasks</div>
              <div className="text-white font-bold">{tasks.length}</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-slate-400 text-[11px]">Completed</div>
              <div className="text-emerald-400 font-bold">
                {tasks.filter((t) => t.status === 'completed').length}
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-slate-400 text-[11px]">Pending</div>
              <div className="text-amber-400 font-bold">
                {tasks.filter((t) => t.status !== 'completed').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
        {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              filterStatus === status
                ? 'bg-violet-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            {status.replace('_', ' ')} (
            {status === 'all' ? tasks.length : tasks.filter((t) => t.status === status).length})
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-midnight-900/40 border-white/5 opacity-75'
                  : isInProgress
                    ? 'bg-surface-card border-violet-500/30 shadow-glow'
                    : 'bg-surface-card border-surface-border'
              }`}
            >
              {/* Task Left / Details */}
              <div className="flex items-start space-x-3.5">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task)}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-midnight-950'
                      : isInProgress
                        ? 'bg-violet-500/20 border-violet-400 text-violet-300'
                        : 'border-white/20 hover:border-violet-400 text-transparent'
                  }`}
                  aria-label={`Mark "${task.title}" status. Current: ${task.status}`}
                >
                  <CheckIcon size={14} className={isDone ? 'text-black font-bold' : ''} />
                </button>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h4
                      className={`text-sm font-semibold ${
                        isDone ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>
                    {/* Priority badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        task.priority === 'critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : task.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[11px] text-cyan-400/80 uppercase font-mono">
                      {task.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{task.description}</p>

                  {/* Metadata line: Due Date, Days Before, Responsible Person, Dependencies */}
                  <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400 flex-wrap gap-y-1">
                    <div className="flex items-center space-x-1">
                      <ClockIcon size={12} className="text-violet-400" />
                      <span>
                        Due: <strong className="text-slate-200">{task.dueDate}</strong> (
                        {task.daysBeforeEvent}d before event)
                      </span>
                    </div>

                    <div>
                      Assignee: <span className="text-slate-200">{task.responsiblePerson}</span>
                    </div>

                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="text-amber-400/90">
                        Prerequisites: {task.dependencies.length} task(s)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  {isDone ? 'Reopen' : isInProgress ? 'Complete' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  aria-label={`Delete task ${task.title}`}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-surface-card rounded-2xl border border-surface-border p-8 text-center text-slate-400 text-xs">
            No milestones found for status filter "{filterStatus}".
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 id="add-task-modal-title" className="text-lg font-bold text-white mb-4">
              Add New Milestone Task
            </h3>
            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm floral centerpiece mockups"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Instructions, contact phone numbers, or delivery specifics"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Days Before Event
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={newDaysBefore}
                    onChange={(e) => setNewDaysBefore(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Calculated Due: {calculateDueDate(eventDate, newDaysBefore)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="decor">Decor</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="logistics">Logistics</option>
                    <option value="stationery">Stationery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Assignee</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Planner / Host"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Dependency assignment with cycle prevention */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Prerequisite Task (Optional)
                </label>
                <select
                  value={selectedDependency}
                  onChange={(e) => {
                    setSelectedDependency(e.target.value);
                    setDependencyError(null);
                  }}
                  className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">None (Independent Task)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.dueDate})
                    </option>
                  ))}
                </select>
                {dependencyError && (
                  <div className="flex items-center space-x-1 text-rose-400 text-[11px] mt-1.5">
                    <AlertCircleIcon size={12} />
                    <span>{dependencyError}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-glow transition-all"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
