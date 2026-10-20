import React, { useState, useMemo } from 'react';
import { BudgetItem, BudgetSummary, ExpenseCategory } from '@/types';
import {
  calculateBudgetSummary,
  generateSavingsSuggestions,
  SavingsRecommendation,
  formatCurrency,
} from '@/features/budget/engine';
import {
  DollarSignIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  PlusIcon,
  Trash2Icon,
  SparklesIcon,
} from '@/components/icons';

interface BudgetDashboardProps {
  items: BudgetItem[];
  totalBudget: number;
  guestCount: number;
  currency: string;
  contingencyPercentage: number;
  onUpdateItems: (newItems: BudgetItem[]) => void;
  onUpdateBudget: (newBudget: number) => void;
  onUpdateContingency?: (newPct: number) => void;
  onUpdateGuestCount: (newGuests: number) => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  items,
  totalBudget,
  guestCount,
  currency,
  contingencyPercentage,
  onUpdateItems,
  onUpdateBudget,
  onUpdateContingency,
  onUpdateGuestCount,
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // New item form state
  const [newItem, setNewItem] = useState<{
    name: string;
    category: ExpenseCategory;
    isPerPerson: boolean;
    cost: number;
    priority: 'must_have' | 'nice_to_have' | 'optional';
    confirmed: boolean;
    notes: string;
  }>({
    name: '',
    category: 'venue',
    isPerPerson: false,
    cost: 500,
    priority: 'must_have',
    confirmed: false,
    notes: '',
  });

  // Calculate live deterministic summary
  const summary: BudgetSummary = useMemo(() => {
    return calculateBudgetSummary(items, totalBudget, guestCount, contingencyPercentage);
  }, [items, totalBudget, guestCount, contingencyPercentage]);

  // Compute savings suggestions
  const savingsSuggestions: SavingsRecommendation[] = useMemo(() => {
    const deficitCents = Math.round(
      Math.max(0, summary.totalEstimatedCost - summary.totalBudget) * 100
    );
    // If not over budget, still offer optimization suggestions up to $2,000
    const targetCents = deficitCents > 0 ? deficitCents : 200000;
    return generateSavingsSuggestions(items, targetCents, guestCount);
  }, [items, summary, guestCount]);

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const created: BudgetItem = {
      id: `item-${Date.now()}`,
      name: newItem.name.trim(),
      category: newItem.category,
      estimatedCost: newItem.isPerPerson ? newItem.cost * guestCount : newItem.cost,
      unitCost: newItem.isPerPerson ? newItem.cost : undefined,
      isPerPerson: newItem.isPerPerson,
      priority: newItem.priority,
      confirmed: newItem.confirmed,
      notes: newItem.notes.trim() || undefined,
    };

    onUpdateItems([...items, created]);
    setNewItem({
      name: '',
      category: 'venue',
      isPerPerson: false,
      cost: 500,
      priority: 'must_have',
      confirmed: false,
      notes: '',
    });
    setIsAddingItem(false);
  };

  // Delete Item Handler
  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter((i) => i.id !== id));
  };

  // Toggle Confirmed Quote
  const handleToggleConfirmed = (id: string) => {
    onUpdateItems(
      items.map((i) => (i.id === id ? { ...i, confirmed: !i.confirmed } : i))
    );
  };

  // Apply a savings suggestion
  const handleApplySavings = (suggestion: SavingsRecommendation) => {
    onUpdateItems(
      items.map((item) => {
        if (item.id === suggestion.itemId) {
          return {
            ...item,
            estimatedCost: suggestion.suggestedCost,
            unitCost: item.isPerPerson ? suggestion.suggestedCost / guestCount : undefined,
          };
        }
        return item;
      })
    );
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (selectedCategoryFilter === 'all') return items;
    return items.filter((i) => i.category === selectedCategoryFilter);
  }, [items, selectedCategoryFilter]);

  const categoriesList: ExpenseCategory[] = [
    'venue',
    'catering',
    'decor',
    'entertainment',
    'photography',
    'attire',
    'logistics',
    'stationery',
    'miscellaneous',
  ];

  return (
    <div className="space-y-6">
      {/* Over-Budget Warning Banner */}
      {summary.isOverBudget && (
        <div
          role="alert"
          aria-live="polite"
          className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-lg text-white"
        >
          <AlertCircleIcon size={24} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-rose-200">
              Budget Overrun Detected — {currency} {Math.abs(summary.remainingBudget).toLocaleString()} Deficit
            </h3>
            <p className="text-xs text-rose-300/90 mt-1">
              Your projected expenditure including the {contingencyPercentage}% contingency buffer is{' '}
              {summary.utilizationPercentage}% of your total budget. Review the automated savings recommendations below.
            </p>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Card */}
        <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
            <DollarSignIcon size={18} className="text-brand-cyan" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(summary.totalBudget, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={100}
              step={500}
              value={totalBudget}
              onChange={(e) => onUpdateBudget(Math.max(0, Number(e.target.value)))}
              className="w-full bg-midnight-950 border border-midnight-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
              aria-label="Adjust total budget amount"
            />
          </div>
        </div>

        {/* Projected Grand Total */}
        <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Projected Total</span>
            <TrendingUpIcon size={18} className="text-brand-violet" />
          </div>
          <div
            className={`text-2xl font-extrabold ${
              summary.isOverBudget ? 'text-rose-400' : 'text-slate-100'
            }`}
          >
            {formatCurrency(summary.totalEstimatedCost, currency)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Utilization:</span>
            <span
              className={`font-bold ${
                summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {summary.utilizationPercentage}%
            </span>
          </div>
        </div>

        {/* Remaining Surplus/Deficit */}
        <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {summary.isOverBudget ? 'Deficit' : 'Remaining Buffer'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-midnight-800 text-slate-300">
              {contingencyPercentage}% Cont.
            </span>
          </div>
          <div
            className={`text-2xl font-extrabold ${
              summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatCurrency(summary.remainingBudget, currency)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Contingency: {formatCurrency(summary.contingencyReserve, currency)}
          </div>
        </div>

        {/* Per-Guest Economics */}
        <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-5 shadow-glass">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cost / Guest</span>
            <span className="text-xs text-brand-cyan font-bold">{guestCount} Guests</span>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {formatCurrency(summary.perGuestCost, currency)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">Headcount:</span>
            <input
              type="number"
              min={1}
              max={50000}
              value={guestCount}
              onChange={(e) => onUpdateGuestCount(Math.max(1, Number(e.target.value)))}
              className="w-20 bg-midnight-950 border border-midnight-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-violet"
              aria-label="Adjust guest count for live cost recalculation"
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown & Contingency Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Bars */}
        <div className="lg:col-span-2 bg-midnight-900 border border-midnight-700/80 rounded-2xl p-6 shadow-glass">
          <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
            <span>Category Spending Breakdown</span>
            <span className="text-xs font-normal text-slate-400">
              Includes {items.filter((i) => i.isPerPerson).length} per-guest items
            </span>
          </h3>

          <div className="space-y-3.5">
            {categoriesList.map((cat) => {
              const amount = summary.categoryBreakdown[cat] || 0;
              const pct = summary.totalEstimatedCost > 0
                ? ((amount / summary.totalEstimatedCost) * 100).toFixed(1)
                : '0';

              if (amount === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium capitalize">{cat}</span>
                    <span className="text-slate-400">
                      {formatCurrency(amount, currency)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-midnight-950 rounded-full h-2 overflow-hidden border border-midnight-800">
                    <div
                      className="bg-gradient-to-r from-brand-violet to-brand-cyan h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Number(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contingency Reserve Slider */}
          <div className="mt-6 pt-5 border-t border-midnight-800">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="contingency-slider" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contingency Reserve: {contingencyPercentage}% ({formatCurrency(summary.contingencyReserve, currency)})
              </label>
              <span className="text-xs text-slate-500">Industry standard: 10% - 15%</span>
            </div>
            <input
              id="contingency-slider"
              type="range"
              min={0}
              max={25}
              value={contingencyPercentage}
              onChange={(e) => onUpdateContingency?.(Number(e.target.value))}
              className="w-full accent-brand-violet cursor-pointer"
              aria-label="Adjust contingency percentage"
            />
          </div>
        </div>

        {/* Savings Opportunities Panel */}
        <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-6 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon size={18} className="text-brand-violet" />
              <h3 className="text-base font-bold text-white">Smart Savings Engine</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Priority-safe recommendations without compromising must-have ceremony elements.
            </p>

            {savingsSuggestions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">
                All expenses are currently optimized within must-have parameters.
              </p>
            ) : (
              <div className="space-y-3">
                {savingsSuggestions.slice(0, 3).map((rec) => (
                  <div
                    key={rec.itemId}
                    className="bg-midnight-950 border border-midnight-800 rounded-xl p-3 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{rec.itemName}</span>
                        <span className="text-xs font-extrabold text-emerald-400">
                          Save {formatCurrency(rec.potentialSavings, currency)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplySavings(rec)}
                      className="self-end px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-all"
                    >
                      Apply Optimization
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-midnight-800 text-[11px] text-slate-500 text-center">
            Deterministic Engine • Zero AI Drift • 100% Traceable
          </div>
        </div>
      </div>

      {/* Budget Items Table */}
      <div className="bg-midnight-900 border border-midnight-700/80 rounded-2xl p-6 shadow-glass">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Line-Item Expenses</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage fixed and per-person expenses with confirmed quotation tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-midnight-950 border border-midnight-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-violet cursor-pointer capitalize"
              aria-label="Filter expenses by category"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsAddingItem(!isAddingItem)}
              className="px-3.5 py-1.5 bg-brand-violet hover:bg-brand-violetDark text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow"
            >
              <PlusIcon size={14} />
              <span>{isAddingItem ? 'Close Form' : 'Add Expense'}</span>
            </button>
          </div>
        </div>

        {/* Add Item Form Modal/Collapsible */}
        {isAddingItem && (
          <form
            onSubmit={handleAddItem}
            className="mb-6 p-4 rounded-xl bg-midnight-950 border border-midnight-700 space-y-4"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-brand-cyan">
              New Expense Item
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cocktail Bar Package"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-midnight-900 border border-midnight-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value as ExpenseCategory })
                  }
                  className="w-full bg-midnight-900 border border-midnight-700 rounded-lg px-3 py-1.5 text-xs text-white capitalize"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {newItem.isPerPerson ? 'Cost Per Guest' : 'Fixed Cost'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={newItem.cost}
                  onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                  className="w-full bg-midnight-900 border border-midnight-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Priority</label>
                <select
                  value={newItem.priority}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      priority: e.target.value as 'must_have' | 'nice_to_have' | 'optional',
                    })
                  }
                  className="w-full bg-midnight-900 border border-midnight-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="must_have">Must Have (Non-negotiable)</option>
                  <option value="nice_to_have">Nice To Have</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.isPerPerson}
                  onChange={(e) => setNewItem({ ...newItem, isPerPerson: e.target.checked })}
                  className="w-4 h-4 accent-brand-violet rounded"
                />
                <span>Multiply by guest count ({guestCount} guests)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.confirmed}
                  onChange={(e) => setNewItem({ ...newItem, confirmed: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>Quotation is Confirmed by Vendor</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 rounded-lg border border-midnight-700 text-xs text-slate-300 hover:bg-midnight-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-brand-cyan hover:bg-brand-cyanDark text-midnight-950 font-bold text-xs"
              >
                Save Item
              </button>
            </div>
          </form>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-midnight-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3">Item / Service</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Structure</th>
                <th className="py-3 px-3 text-right">Estimated Cost</th>
                <th className="py-3 px-3 text-center">Quote Status</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-midnight-800/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-midnight-800/40 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-200">{item.name}</td>
                  <td className="py-3 px-3 text-slate-400 capitalize">{item.category}</td>
                  <td className="py-3 px-3 text-slate-400">
                    {item.isPerPerson ? (
                      <span className="text-brand-cyan font-medium">
                        {formatCurrency(item.unitCost || item.estimatedCost / guestCount, currency)} / guest
                      </span>
                    ) : (
                      'Fixed'
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-100">
                    {formatCurrency(item.estimatedCost, currency)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleConfirmed(item.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        item.confirmed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                      title="Click to toggle quotation status"
                    >
                      {item.confirmed ? 'Confirmed Quote' : 'Estimated'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        item.priority === 'must_have'
                          ? 'bg-midnight-800 text-brand-violetLight'
                          : item.priority === 'nice_to_have'
                          ? 'bg-midnight-800 text-slate-300'
                          : 'bg-midnight-800 text-slate-500'
                      }`}
                    >
                      {item.priority.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete item"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
