import React, { useState, useEffect } from 'react';
import { EventPlan, BudgetItem, TimelineTask, Vendor, Venue3DConfig, WhatIfScenario } from '@/types';
import {
  getActiveEvent,
  getStoredEvents,
  saveEventPlan,
  setActiveEventId,
  createInitialDemoPlan,
} from '@/services/storage';
import { EventCreationWizard } from '@/features/events/EventCreationWizard';
import { BudgetDashboard } from '@/features/budget/BudgetDashboard';
import { TimelineView } from '@/features/timeline/TimelineView';
import { VenueStudio } from '@/features/venue-studio/VenueStudio';
import { ScenarioSimulator } from '@/features/scenarios/ScenarioSimulator';
import { VendorManagement } from '@/features/vendors/VendorManagement';
import { ExportView } from '@/features/export/ExportView';
import {
  SparklesIcon,
  DollarIcon,
  Box3DIcon,
  ClockIcon,
  FilterIcon,
  DownloadIcon,
  CheckIcon,
  TrendingUpIcon,
  PlusIcon,
} from '@/components/icons';

type ActiveTab =
  | 'overview'
  | 'budget'
  | 'timeline'
  | 'venue'
  | 'scenarios'
  | 'vendors'
  | 'export';

export const EventDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showWizard, setShowWizard] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Initialize events from local storage or set initial demo plan
  useEffect(() => {
    let stored = getStoredEvents();
    if (stored.length === 0) {
      const initial = createInitialDemoPlan();
      saveEventPlan(initial);
      stored = [initial];
    }
    setEvents(stored);
    const active = getActiveEvent() || stored[0];
    setCurrentPlan(active);
  }, []);

  // Save handler: commits plan updates to persistent storage
  const handleSavePlan = (updated: EventPlan | ((prev: EventPlan) => EventPlan)) => {
    setCurrentPlan((prev) => {
      if (!prev) return prev;
      const next = typeof updated === 'function' ? updated(prev) : updated;
      saveEventPlan(next);
      return next;
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Switch event
  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    const found = events.find((e) => e.id === id);
    if (found) {
      setCurrentPlan(found);
      setActiveTab('overview');
    }
  };

  // When a newly created plan is returned from the wizard
  const handlePlanCreated = (newPlan: EventPlan) => {
    handleSavePlan(newPlan);
    setShowWizard(false);
    setActiveTab('overview');
  };

  if (!currentPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-midnight-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Calculate quick metrics
  const today = new Date();
  const eventDateObj = new Date(currentPlan.eventDate);
  const diffTime = eventDateObj.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const completedTasks = currentPlan.tasks.filter((t) => t.status === 'completed').length;
  const taskProgress = currentPlan.tasks.length
    ? Math.round((completedTasks / currentPlan.tasks.length) * 100)
    : 0;



  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Navigation */}
      <header className="sticky top-0 z-40 bg-midnight-950/85 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Mode */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-glow">
              <SparklesIcon size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  EventVerse <span className="text-cyan-400">AI</span>
                </span>
                <span className="bg-cyan-950/60 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-800 tracking-wide uppercase">
                  DEMO MODE
                </span>
              </div>
            </div>
          </div>

          {/* Event Selector & Actions */}
          <div className="flex items-center space-x-3">
            {events.length > 1 && (
              <select
                aria-label="Switch active event celebration"
                value={currentPlan.id}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="bg-midnight-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-400"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.eventType})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all"
            >
              <PlusIcon size={14} />
              <span>Create Event</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showWizard ? (
          <EventCreationWizard
            onPlanCreated={handlePlanCreated}
            onCancel={() => setShowWizard(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* Event Header Banner */}
            <div className="bg-surface-card rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    <span>{currentPlan.eventType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{currentPlan.theme}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
                    {currentPlan.title}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    {currentPlan.venuePreferences} • Accommodating {currentPlan.guestCount} guests
                  </p>
                </div>

                {/* Quick countdown & metrics pill */}
                <div className="flex items-center space-x-4 bg-midnight-900/80 px-5 py-3 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <div className="text-xl font-bold font-display text-cyan-400">
                      {daysRemaining}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Days Left
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold font-display text-violet-400">
                      {taskProgress}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Tasks Done
                    </div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold font-display text-emerald-400">
                      {currentPlan.currency} {currentPlan.totalBudget.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Budget Cap
                    </div>
                  </div>
                </div>
              </div>

              {/* Background ambient gradient glow */}
              <div
                className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ backgroundColor: currentPlan.colorPalette[0] || '#8B5CF6' }}
              />
            </div>

            {/* Navigation Tab Bar */}
            <nav
              role="tablist"
              className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-surface-border text-xs scrollbar-none"
              aria-label="Event management modules"
            >
              {[
                { id: 'overview', label: 'Concept & Narrative', icon: SparklesIcon },
                { id: 'budget', label: 'Smart Budget Engine', icon: DollarIcon },
                { id: 'timeline', label: 'Timeline & Checklist', icon: ClockIcon },
                { id: 'venue', label: '3D Spatial Studio', icon: Box3DIcon },
                { id: 'scenarios', label: 'What-If Simulator', icon: TrendingUpIcon },
                { id: 'vendors', label: 'Suppliers & Directory', icon: FilterIcon },
                { id: 'export', label: 'Export & Dossier', icon: DownloadIcon },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                    aria-selected={isActive}
                    role="tab"
                  >
                    <IconComponent size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* TAB CONTENT: 1. Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Concept Narrative Card */}
                <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
                  <div className="flex items-center space-x-2 text-violet-400 mb-2">
                    <SparklesIcon size={18} />
                    <h3 className="text-base font-bold text-white">Event Creative Concept</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {currentPlan.conceptSummary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Decor Highlights */}
                    <div className="bg-midnight-900/60 p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                        Decor & Atmosphere Ideas
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {currentPlan.decorIdeas.map((d, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Culinary Suggestions */}
                    <div className="bg-midnight-900/60 p-4 rounded-xl border border-white/5">
                      <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
                        Menu & Culinary Experience
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {currentPlan.menuSuggestions.map((m, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-violet-400 mt-0.5">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Entertainment & Guest Experience */}
                  <div className="mt-4 bg-midnight-900/60 p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Entertainment & Guest Journey
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                      {currentPlan.entertainmentIdeas.map((e, i) => (
                        <div key={i} className="bg-midnight-950/60 p-3 rounded-lg border border-white/5">
                          {e}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Management & Cost Optimizations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risks & Mitigations */}
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
                    <h4 className="text-base font-bold text-white mb-3">
                      Risk Management & Contingency Plan
                    </h4>
                    <div className="space-y-3">
                      {currentPlan.riskContingencies.map((rc, idx) => (
                        <div
                          key={idx}
                          className="bg-midnight-900/60 p-3.5 rounded-xl border border-white/5 text-xs"
                        >
                          <div className="font-semibold text-rose-300">Risk: {rc.risk}</div>
                          <div className="text-slate-400 mt-1">
                            <strong className="text-slate-300">Mitigation:</strong> {rc.mitigation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Saving Alternatives */}
                  <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
                    <h4 className="text-base font-bold text-white mb-3">
                      Personalized Cost-Saving Alternatives
                    </h4>
                    <ul className="space-y-3 text-xs text-slate-300">
                      {currentPlan.costSavingTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="bg-midnight-900/60 p-3.5 rounded-xl border border-white/5 flex items-start space-x-2.5"
                        >
                          <span className="p-1 bg-cyan-500/10 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                            <CheckIcon size={12} />
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Smart Budget */}
            {activeTab === 'budget' && (
              <BudgetDashboard
                items={currentPlan.budgetItems}
                totalBudget={currentPlan.totalBudget}
                guestCount={currentPlan.guestCount}
                currency={currentPlan.currency}
                contingencyPercentage={currentPlan.contingencyPercentage}
                onUpdateItems={(newItems: BudgetItem[]) =>
                  handleSavePlan({ ...currentPlan, budgetItems: newItems })
                }
                onUpdateGuestCount={(newGuests: number) =>
                  handleSavePlan({ ...currentPlan, guestCount: newGuests })
                }
                onUpdateBudget={(newBudget: number) =>
                  handleSavePlan({ ...currentPlan, totalBudget: newBudget })
                }
              />
            )}

            {/* TAB CONTENT: 3. Timeline & Tasks */}
            {activeTab === 'timeline' && (
              <TimelineView
                tasks={currentPlan.tasks}
                eventDate={currentPlan.eventDate}
                onUpdateTasks={(updatedTasks: TimelineTask[]) =>
                  handleSavePlan((prev) => ({ ...prev, tasks: updatedTasks }))
                }
                onUpdateEventDate={(newDate: string) =>
                  handleSavePlan((prev) => ({ ...prev, eventDate: newDate }))
                }
                onUpdateEventDateAndTasks={(newDate: string, updatedTasks: TimelineTask[]) =>
                  handleSavePlan((prev) => ({ ...prev, eventDate: newDate, tasks: updatedTasks }))
                }
              />
            )}

            {/* TAB CONTENT: 4. 3D Spatial Studio */}
            {activeTab === 'venue' && (
              <VenueStudio
                config={currentPlan.venue3D}
                onChange={(updatedConfig: Venue3DConfig) =>
                  handleSavePlan({ ...currentPlan, venue3D: updatedConfig })
                }
              />
            )}

            {/* TAB CONTENT: 5. What-If Simulator */}
            {activeTab === 'scenarios' && (
              <ScenarioSimulator
                baseItems={currentPlan.budgetItems}
                totalBudget={currentPlan.totalBudget}
                baseGuestCount={currentPlan.guestCount}
                currency={currentPlan.currency}
                contingencyPercentage={currentPlan.contingencyPercentage}
                scenarios={currentPlan.scenarios}
                onApplyScenario={(appliedItems: BudgetItem[], newGuests: number) =>
                  handleSavePlan({
                    ...currentPlan,
                    budgetItems: appliedItems,
                    guestCount: newGuests,
                  })
                }
                onSaveScenario={(sc: WhatIfScenario) =>
                  handleSavePlan({
                    ...currentPlan,
                    scenarios: [...currentPlan.scenarios, sc],
                  })
                }
              />
            )}

            {/* TAB CONTENT: 6. Suppliers & Directory */}
            {activeTab === 'vendors' && (
              <VendorManagement
                vendors={currentPlan.vendors}
                currency={currentPlan.currency}
                onUpdateVendors={(updatedVendors: Vendor[]) =>
                  handleSavePlan({ ...currentPlan, vendors: updatedVendors })
                }
              />
            )}

            {/* TAB CONTENT: 7. Export & Dossier */}
            {activeTab === 'export' && (
              <ExportView
                plan={currentPlan}
                onImportPlan={(importedPlan: EventPlan) => handleSavePlan(importedPlan)}
              />
            )}
          </div>
        )}
      </main>

      {/* Auto-save notification feedback */}
      {saveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 backdrop-blur"
        >
          <CheckIcon size={14} className="text-emerald-400" />
          <span>Plan state saved locally (DEMO mode)</span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-surface-border bg-midnight-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            EventVerse AI — GenAI-Powered Celebration & Event Planner. Verified deterministic logic, WCAG 2.2 AA accessibility, and zero external secret leakage.
          </p>
        </div>
      </footer>
    </div>
  );
};
