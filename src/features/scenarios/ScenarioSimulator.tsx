import React, { useState } from 'react';
import { BudgetItem, CurrencyCode, WhatIfScenario } from '@/types';
import {
  calculateScenario,
  createDefaultScenarios,
  ScenarioCalculationResult,
} from './engine';
import { SparklesIcon } from '@/components/icons';

interface ScenarioSimulatorProps {
  baseItems: BudgetItem[];
  totalBudget: number;
  baseGuestCount: number;
  currency: CurrencyCode;
  contingencyPercentage: number;
  scenarios: WhatIfScenario[];
  onApplyScenario: (appliedItems: BudgetItem[], newGuestCount: number) => void;
  onSaveScenario: (scenario: WhatIfScenario) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  baseItems,
  totalBudget,
  baseGuestCount,
  currency,
  contingencyPercentage,
  onApplyScenario,
}) => {
  // Available scenarios (initial presets + user customized)
  const defaultScenarios = createDefaultScenarios(baseGuestCount, baseItems, totalBudget);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);

  // Custom interactive simulation sliders
  const [simGuests, setSimGuests] = useState(baseGuestCount);
  const [cateringAdjustment, setCateringAdjustment] = useState(0);
  const [decorAdjustment, setDecorAdjustment] = useState(0);
  const [entertainmentAdjustment, setEntertainmentAdjustment] = useState(0);

  // Current active scenario definition
  const activePreset = defaultScenarios[selectedScenarioIndex] || defaultScenarios[0];

  // Calculate preset result
  const presetResult: ScenarioCalculationResult = calculateScenario(
    baseItems,
    totalBudget,
    baseGuestCount,
    activePreset,
    contingencyPercentage
  );

  // Calculate live custom sandbox result
  const customScenario: WhatIfScenario = {
    id: 'custom-live-sandbox',
    name: 'Live Interactive Sandbox',
    guestCount: simGuests,
    customAdjustments: [
      { category: 'catering', percentageAdjustment: cateringAdjustment },
      { category: 'decor', percentageAdjustment: decorAdjustment },
      { category: 'entertainment', percentageAdjustment: entertainmentAdjustment },
    ],
    calculatedCost: 0,
    calculatedPerGuest: 0,
    calculatedUtilization: 0,
  };

  const customResult: ScenarioCalculationResult = calculateScenario(
    baseItems,
    totalBudget,
    baseGuestCount,
    customScenario,
    contingencyPercentage
  );

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex items-center space-x-2">
          <SparklesIcon size={20} className="text-cyan-400" />
          <h3 className="text-xl font-bold font-display text-white">
            What-If Scenario & Variance Simulator
          </h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Model tradeoffs between guest headcounts, gourmet catering tiers, decor luxury, and entertainment options. Instantly see variance against your baseline event budget.
        </p>

        {/* Preset scenario selection tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          {defaultScenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => setSelectedScenarioIndex(idx)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedScenarioIndex === idx
                  ? 'bg-violet-950/40 border-violet-500 shadow-glow'
                  : 'bg-midnight-900/60 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{sc.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {sc.guestCount} Guests
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sc.notes}</p>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <span className="text-slate-400">Est. Total:</span>
                <span className="font-bold text-white">
                  {currency} {sc.calculatedCost.toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Comparison Matrix */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs uppercase font-semibold text-violet-400 tracking-wider">
              Selected Preset Analysis
            </span>
            <h4 className="text-lg font-bold text-white mt-0.5">{presetResult.name}</h4>
          </div>

          <button
            onClick={() =>
              onApplyScenario(presetResult.simulatedBudgetItems, presetResult.simulatedGuestCount)
            }
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-glow transition-all"
          >
            Apply This Scenario to Master Plan
          </button>
        </div>

        {/* Side by side KPI cards: Baseline vs Proposed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-midnight-900/80 p-4 rounded-xl border border-white/5">
            <div className="text-xs text-slate-400">Total Projected Cost</div>
            <div className="text-2xl font-bold text-white mt-1">
              {currency} {presetResult.summary.totalEstimatedCost.toLocaleString()}
            </div>
            <div
              className={`text-xs mt-2 font-semibold ${
                presetResult.comparisonWithBaseline.diffCost < 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {presetResult.comparisonWithBaseline.diffCost < 0 ? '▼ Saves ' : '▲ Adds '}
              {currency}{' '}
              {Math.abs(presetResult.comparisonWithBaseline.diffCost).toLocaleString()} (
              {presetResult.comparisonWithBaseline.costVariancePercentage}%)
            </div>
          </div>

          <div className="bg-midnight-900/80 p-4 rounded-xl border border-white/5">
            <div className="text-xs text-slate-400">Cost Per Guest</div>
            <div className="text-2xl font-bold text-cyan-300 mt-1">
              {currency} {presetResult.summary.perGuestCost.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Baseline: {currency}{' '}
              {(
                presetResult.summary.perGuestCost -
                presetResult.comparisonWithBaseline.diffPerGuest
              ).toLocaleString()}
            </div>
          </div>

          <div className="bg-midnight-900/80 p-4 rounded-xl border border-white/5">
            <div className="text-xs text-slate-400">Budget Utilization</div>
            <div
              className={`text-2xl font-bold mt-1 ${
                presetResult.summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {presetResult.summary.utilizationPercentage}%
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Remaining: {currency} {presetResult.summary.remainingBudget.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom What-If Sandbox */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <h4 className="text-base font-bold text-white mb-1">
          Interactive Custom Tuning Sandbox
        </h4>
        <p className="text-xs text-slate-400 mb-6">
          Drag sliders to test arbitrary guest list numbers and category budget variations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sliders column */}
          <div className="space-y-4 text-xs">
            {/* Guest slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-semibold">Simulated Guest Count</span>
                <span className="text-cyan-400 font-bold">{simGuests} Guests</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                value={simGuests}
                onChange={(e) => setSimGuests(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-midnight-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Catering slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-semibold">
                  Catering Tier Adjustment
                </span>
                <span className="text-violet-400 font-bold">
                  {cateringAdjustment >= 0 ? `+${cateringAdjustment}%` : `${cateringAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="60"
                step="5"
                value={cateringAdjustment}
                onChange={(e) => setCateringAdjustment(parseInt(e.target.value, 10))}
                className="w-full accent-violet-500 bg-midnight-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Decor slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-semibold">Floral & Decor Adjustment</span>
                <span className="text-violet-400 font-bold">
                  {decorAdjustment >= 0 ? `+${decorAdjustment}%` : `${decorAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="5"
                value={decorAdjustment}
                onChange={(e) => setDecorAdjustment(parseInt(e.target.value, 10))}
                className="w-full accent-violet-500 bg-midnight-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Entertainment slider */}
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-300 font-semibold">
                  Entertainment & Production
                </span>
                <span className="text-violet-400 font-bold">
                  {entertainmentAdjustment >= 0
                    ? `+${entertainmentAdjustment}%`
                    : `${entertainmentAdjustment}%`}
                </span>
              </div>
              <input
                type="range"
                min="-40"
                max="40"
                step="5"
                value={entertainmentAdjustment}
                onChange={(e) => setEntertainmentAdjustment(parseInt(e.target.value, 10))}
                className="w-full accent-violet-500 bg-midnight-900 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Real-time Sandbox Feedback */}
          <div className="bg-midnight-900/80 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Custom Sandbox Impact
              </span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {currency} {customResult.summary.totalEstimatedCost.toLocaleString()}
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Cost per Guest:</span>
                  <strong className="text-cyan-300">
                    {currency} {customResult.summary.perGuestCost.toLocaleString()}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Budget Utilization:</span>
                  <strong
                    className={
                      customResult.summary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                    }
                  >
                    {customResult.summary.utilizationPercentage}%
                  </strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Remaining Reserve:</span>
                  <strong
                    className={
                      customResult.summary.remainingBudget >= 0
                        ? 'text-cyan-400'
                        : 'text-rose-400'
                    }
                  >
                    {currency} {customResult.summary.remainingBudget.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                onApplyScenario(customResult.simulatedBudgetItems, customResult.simulatedGuestCount)
              }
              className="mt-6 w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-glow transition-all"
            >
              Apply Custom Tuning to Active Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
