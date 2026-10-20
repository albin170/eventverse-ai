import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  EventRecord,
  BudgetItem,
  TimelineTask,
  GuestRecord,
  VendorProfile,
  VendorEnquiry,
  Venue3DConfig,
} from '@/types';
import {
  listEvents,
  createEvent,
  updateEvent,
  listExpenses,
  addExpense,
  updateExpense,
  listTasks,
  addTask,
  updateTask,
  listGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  listVerifiedVendors,
  submitVendorEnquiry,
  listUserEnquiries,
  getVenueDesign,
  saveVenueDesign,
} from '@/services/database';
import { getPersistenceMode } from '@/services/auth';
import { BudgetDashboard } from '@/features/budget/BudgetDashboard';
import { recalculateItemsForGuestCount } from '@/features/budget/engine';
import { TimelineView } from '@/features/timeline/TimelineView';
import { shiftTaskDatesForMasterEvent } from '@/features/timeline/engine';
import { ScenarioSimulator } from '@/features/scenarios/ScenarioSimulator';
import { GuestManagement } from '@/features/guests/GuestManagement';
import { VendorDirectory } from '@/features/vendors/VendorDirectory';
import { VenueStudio } from '@/features/venue-studio/VenueStudio';
import { ExportView } from '@/features/export/ExportView';
import { EventCreationWizard } from '@/features/events/EventCreationWizard';
import {
  IconCalendar,
  IconShield,
  IconSparkles,
} from '@/components/icons';


interface UserDashboardProps {
  currentUser: UserProfile;
  onOpenAdminPortal: () => void;
  onSignOut: () => void;
}

export type UserTab =
  | 'overview'
  | 'budget'
  | 'simulator'
  | 'timeline'
  | 'guests'
  | 'vendors'
  | 'venue'
  | 'export';

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onOpenAdminPortal,
  onSignOut,
}) => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserTab>('overview');
  const [showWizard, setShowWizard] = useState(false);
  const [_loading, setLoading] = useState(true);

  // Sub-resources for currently active event
  const [expenses, setExpenses] = useState<BudgetItem[]>([]);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [userEnquiries, setUserEnquiries] = useState<VendorEnquiry[]>([]);
  const [venueConfig, setVenueConfig] = useState<Venue3DConfig>({
    themeColor: '#8B5CF6',
    accentColor: '#06B6D4',
    lightingPreset: 'evening',
    stagePosition: 'front',
    tableLayout: 'banquet',
    tableCount: 10,
    danceFloor: true,
    ambientBrightness: 1.0,
  });

  const persistenceMode = getPersistenceMode();

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  // Initial Data Fetch
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userEvents = await listEvents(currentUser);
      setEvents(userEvents);
      if (userEvents.length > 0) {
        setSelectedEventId(userEvents[0].id);
      }
      const verifiedVendors = await listVerifiedVendors();
      setVendors(verifiedVendors);
      const enqs = await listUserEnquiries(currentUser);
      setUserEnquiries(enqs);
    } catch (err) {
      console.error('Failed to load user events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [currentUser.uid]);

  // Load active event sub-resources whenever selected event changes
  useEffect(() => {
    if (!activeEvent) {
      setExpenses([]);
      setTasks([]);
      setGuests([]);
      return;
    }

    const loadSubResources = async () => {
      try {
        const [expList, tskList, gstList, design] = await Promise.all([
          listExpenses(activeEvent.id, currentUser),
          listTasks(activeEvent.id, currentUser),
          listGuests(activeEvent.id, currentUser),
          getVenueDesign(activeEvent.id, currentUser),
        ]);

        setExpenses(expList);
        setTasks(tskList);
        setGuests(gstList);
        if (design) {
          setVenueConfig(design.sceneConfig);
        } else {
          setVenueConfig({
            themeColor: activeEvent.colorPalette[0] || '#8B5CF6',
            accentColor: activeEvent.colorPalette[1] || '#06B6D4',
            lightingPreset: 'evening',
            stagePosition: 'front',
            tableLayout: 'banquet',
            tableCount: Math.max(2, Math.ceil(activeEvent.guestCount / 10)),
            danceFloor: true,
            ambientBrightness: 1.0,
          });
        }
      } catch (err) {
        console.error('Failed to load event details:', err);
      }
    };

    loadSubResources();
  }, [activeEvent?.id, currentUser.uid]);

  // Event Creation Handler
  const handleCreateEvent = async (
    eventData: Omit<EventRecord, 'id' | 'ownerId' | 'status' | 'moderationStatus' | 'createdAt' | 'updatedAt'>,
    initialExpenses: Omit<BudgetItem, 'id' | 'ownerId' | 'eventId'>[],
    initialTasks: Omit<TimelineTask, 'id' | 'ownerId' | 'eventId'>[]
  ) => {
    const created = await createEvent(eventData, currentUser);

    for (const exp of initialExpenses) {
      await addExpense({ ...exp, eventId: created.id }, currentUser);
    }

    for (const tsk of initialTasks) {
      await addTask({ ...tsk, eventId: created.id }, currentUser);
    }

    setEvents((prev) => [created, ...prev]);
    setSelectedEventId(created.id);
    setShowWizard(false);
    setActiveTab('overview');
  };

  // Budget Handlers
  const handleUpdateItems = async (updatedItems: BudgetItem[]) => {
    setExpenses(updatedItems);
    if (!activeEvent) return;

    for (const item of updatedItems) {
      await updateExpense(item, currentUser);
    }
  };

  const handleUpdateGuestCount = async (newGuests: number) => {
    if (!activeEvent) return;
    const safeGuests = Math.max(1, newGuests);
    const updated = await updateEvent(activeEvent.id, { guestCount: safeGuests }, currentUser);
    setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updated : e)));

    // Recalculate variable items
    const recalculated = recalculateItemsForGuestCount(expenses, safeGuests);
    setExpenses(recalculated);
    for (const item of recalculated) {
      if (item.isPerPerson) {
        await updateExpense(item, currentUser);
      }
    }
  };

  const handleUpdateBudget = async (newBudget: number) => {
    if (!activeEvent) return;
    const updated = await updateEvent(activeEvent.id, { totalBudget: newBudget }, currentUser);
    setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updated : e)));
  };

  const handleUpdateContingency = async (newPct: number) => {
    if (!activeEvent) return;
    const updated = await updateEvent(activeEvent.id, { contingencyPercentage: newPct }, currentUser);
    setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updated : e)));
  };

  // Timeline Handlers
  const handleUpdateTasks = async (updatedTasks: TimelineTask[]) => {
    setTasks(updatedTasks);
    for (const tsk of updatedTasks) {
      await updateTask(tsk, currentUser);
    }
  };

  const handleUpdateEventDate = async (newDate: string) => {
    if (!activeEvent) return;
    const updated = await updateEvent(activeEvent.id, { eventDate: newDate }, currentUser);
    setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updated : e)));

    // Shift relative task deadlines
    const shifted = shiftTaskDatesForMasterEvent(tasks, newDate);
    setTasks(shifted);
    for (const tsk of shifted) {
      await updateTask(tsk, currentUser);
    }
  };

  // Guest Handlers
  const handleAddGuest = async (guestData: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>) => {
    const created = await addGuest(guestData, currentUser);
    setGuests((prev) => [...prev, created]);
  };

  const handleUpdateGuest = async (guest: GuestRecord) => {
    const updated = await updateGuest(guest, currentUser);
    setGuests((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!activeEvent) return;
    await deleteGuest(guestId, activeEvent.id, currentUser);
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  };

  const handleBulkImportGuests = async (
    imported: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>[]
  ) => {
    const newItems: GuestRecord[] = [];
    for (const g of imported) {
      const created = await addGuest(g, currentUser);
      newItems.push(created);
    }
    setGuests((prev) => [...prev, ...newItems]);
  };

  // Enquiry Submission Handler
  const handleSubmitEnquiry = async (data: {
    vendorId: string;
    vendorName: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    guestCount: number;
    estimatedBudget: number;
    message: string;
  }) => {
    const created = await submitVendorEnquiry(data, currentUser);
    setUserEnquiries((prev) => [created, ...prev]);
  };

  // Venue Studio Handler
  const handleSaveVenueConfig = async (newConfig: Venue3DConfig) => {
    setVenueConfig(newConfig);
    if (!activeEvent) return;
    await saveVenueDesign(activeEvent.id, newConfig, currentUser);
  };

  // Countdown Calculation
  const daysUntilEvent = activeEvent
    ? Math.ceil(
        (new Date(activeEvent.eventDate).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-midnight-900/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow">
              <IconSparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold font-display text-white">EventVerse</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  {persistenceMode === 'cloud_firebase' ? 'Cloud Firestore' : 'Persistent Storage'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenAdminPortal}
                className="px-3 py-1.5 rounded-lg bg-coral-500/10 hover:bg-coral-500/20 text-coral-300 text-xs font-semibold border border-coral-500/30 flex items-center space-x-1.5 transition-colors"
              >
                <IconShield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            )}

            <button
              onClick={() => setShowWizard(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow transition-all"
            >
              + New Event
            </button>

            <div className="hidden sm:flex items-center pl-3 border-l border-surface-border space-x-2">
              <span className="text-xs text-slate-300 font-medium">{currentUser.displayName}</span>
              <button
                onClick={onSignOut}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4 ml-1"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {showWizard ? (
          <EventCreationWizard
            onEventCreated={handleCreateEvent}
            onCancel={() => setShowWizard(false)}
          />
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="bg-surface-card rounded-2xl border border-surface-border p-12 sm:p-16 text-center max-w-xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto mb-5 border border-violet-500/30">
              <IconCalendar className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-display text-white mb-2">No Events Created Yet</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Your personal workspace is empty. Create your first wedding, anniversary, milestone birthday, or community gathering to unlock deterministic budget tracking, timelines, and spatial design.
            </p>
            <button
              onClick={() => setShowWizard(true)}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-glow transition-all"
            >
              Start Planning Event
            </button>
          </div>
        ) : (
          /* Active Event Workspace */
          <div className="space-y-6">
            {/* Event Header Banner */}
            <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {events.length > 1 ? (
                    <select
                      value={selectedEventId || ''}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      aria-label="Select active event"
                      className="px-3 py-1 rounded-lg bg-midnight-900 border border-surface-border text-white text-sm font-bold focus:outline-none focus:border-violet-500"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="text-xl sm:text-2xl font-extrabold font-display text-white">
                      {activeEvent.title}
                    </h1>
                  )}

                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30 capitalize">
                    {activeEvent.category.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {activeEvent.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>📅 {activeEvent.eventDate} {activeEvent.eventTime || ''}</span>
                  <span>📍 {activeEvent.location}</span>
                  <span>👥 {activeEvent.guestCount} Guests</span>
                  <span>💰 {activeEvent.currency} {activeEvent.totalBudget.toLocaleString()}</span>
                </div>
              </div>

              {/* Countdown Ticker */}
              <div className="flex items-center space-x-3 bg-midnight-900 px-4 py-2.5 rounded-xl border border-surface-border self-start md:self-auto">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    Event Countdown
                  </span>
                  <span className="text-lg font-bold font-mono text-white">
                    {daysUntilEvent > 0
                      ? `${daysUntilEvent} Days Remaining`
                      : daysUntilEvent === 0
                      ? 'Today!'
                      : `${Math.abs(daysUntilEvent)} Days Passed`}
                  </span>
                </div>
              </div>
            </div>

            {/* Accessible Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Event management workspaces"
              className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-surface-border"
            >
              {[
                { id: 'overview', label: 'Overview & Details' },
                { id: 'budget', label: 'Smart Budget Engine' },
                { id: 'simulator', label: 'What-If Simulator' },
                { id: 'timeline', label: 'Timeline & Checklist' },
                { id: 'guests', label: `Guest List (${guests.length})` },
                { id: 'vendors', label: `Suppliers & Directory (${vendors.length})` },
                { id: 'venue', label: '3D Spatial Studio' },
                { id: 'export', label: 'Export & Dossier' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as UserTab)}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-600 text-white shadow-glow'
                      : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Panel Viewports */}
            <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
              {/* Tab: Overview & Details */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Theme & Style</span>
                      <h4 className="text-base font-bold text-white mt-1">{activeEvent.theme}</h4>
                      <div className="flex items-center space-x-2 mt-3">
                        {activeEvent.colorPalette.map((col, idx) => (
                          <div key={idx} className="flex items-center space-x-1 text-[11px] text-slate-300">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: col }} />
                            <span className="font-mono">{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Catering Focus</span>
                      <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                        {activeEvent.cateringPreferences}
                      </p>
                    </div>

                    <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Accessibility Requirements</span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {activeEvent.accessibilityRequirements.length > 0 ? (
                          activeEvent.accessibilityRequirements.map((req, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              ✓ {req}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No special requirements specified.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeEvent.notes && (
                    <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                      <span className="text-xs text-slate-400 uppercase font-semibold">Planning Notes & Priorities</span>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-line">{activeEvent.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Budget */}
              {activeTab === 'budget' && (
                <BudgetDashboard
                  items={expenses}
                  totalBudget={activeEvent.totalBudget}
                  guestCount={activeEvent.guestCount}
                  currency={activeEvent.currency}
                  contingencyPercentage={activeEvent.contingencyPercentage}
                  onUpdateItems={handleUpdateItems}
                  onUpdateBudget={handleUpdateBudget}
                  onUpdateContingency={handleUpdateContingency}
                  onUpdateGuestCount={handleUpdateGuestCount}
                />
              )}

              {/* Tab: Simulator */}
              {activeTab === 'simulator' && (
                <ScenarioSimulator
                  baseItems={expenses}
                  totalBudget={activeEvent.totalBudget}
                  baseGuestCount={activeEvent.guestCount}
                  currency={activeEvent.currency}
                  contingencyPercentage={activeEvent.contingencyPercentage}
                  scenarios={[]}
                  onApplyScenario={(newItems: BudgetItem[], newGuests: number) => {
                    handleUpdateItems(newItems);
                    handleUpdateGuestCount(newGuests);
                    setActiveTab('budget');
                  }}
                  onSaveScenario={() => {}}
                />
              )}


              {/* Tab: Timeline & Checklist */}
              {activeTab === 'timeline' && (
                <TimelineView
                  tasks={tasks}
                  eventDate={activeEvent.eventDate}
                  onUpdateTasks={handleUpdateTasks}
                  onUpdateEventDate={handleUpdateEventDate}
                />
              )}

              {/* Tab: Guests */}
              {activeTab === 'guests' && (
                <GuestManagement
                  eventId={activeEvent.id}
                  guests={guests}
                  onAddGuest={handleAddGuest}
                  onUpdateGuest={handleUpdateGuest}
                  onDeleteGuest={handleDeleteGuest}
                  onBulkImport={handleBulkImportGuests}
                />
              )}

              {/* Tab: Vendors */}
              {activeTab === 'vendors' && (
                <VendorDirectory
                  vendors={vendors}
                  userEnquiries={userEnquiries}
                  activeEvent={activeEvent}
                  onSubmitEnquiry={handleSubmitEnquiry}
                />
              )}

              {/* Tab: 3D Studio */}
              {activeTab === 'venue' && (
                <VenueStudio
                  config={venueConfig}
                  onChange={handleSaveVenueConfig}
                  guestCount={activeEvent.guestCount}
                />
              )}

              {/* Tab: Export */}
              {activeTab === 'export' && (
                <ExportView
                  plan={{
                    id: activeEvent.id,
                    title: activeEvent.title,
                    eventType: activeEvent.category as any,
                    eventDate: activeEvent.eventDate,
                    location: activeEvent.location,
                    guestCount: activeEvent.guestCount,
                    totalBudget: activeEvent.totalBudget,
                    currency: activeEvent.currency,
                    contingencyPercentage: activeEvent.contingencyPercentage,
                    theme: activeEvent.theme,
                    colorPalette: activeEvent.colorPalette,
                    culturalPreferences: 'Standard',
                    dietaryRequirements: [activeEvent.cateringPreferences],
                    venuePreferences: activeEvent.location,
                    accessibilityRequirements: activeEvent.accessibilityRequirements,
                    priorities: activeEvent.priorityPreferences || [],
                    restrictions: [],
                    notes: activeEvent.notes,
                    conceptSummary: `Celebration architecture configured for ${activeEvent.guestCount} attendees at ${activeEvent.location}.`,
                    decorIdeas: ['Ambient spotlighting', 'Botanical table arrangements'],
                    entertainmentIdeas: ['Live acoustic arrangement', 'Curated sound'],
                    menuSuggestions: [activeEvent.cateringPreferences],
                    costSavingTips: ['Tiered vendor negotiations', 'Contingency buffering'],
                    riskContingencies: [{ risk: 'Schedule overrun', mitigation: 'Topological DFS milestone tracking' }],
                    budgetItems: expenses,
                    tasks: tasks,
                    vendors: vendors.map((v) => ({
                      id: v.id,
                      name: v.name,
                      category: v.category,
                      contactName: 'Coordinator',
                      email: v.contactEmail,
                      phone: v.contactPhone,
                      location: v.serviceArea,
                      priceRange: v.priceTier,
                      estimatedStartingPrice: v.startingPrice,
                      isShortlisted: true,
                      enquiryStatus: 'contacted',
                      isDemoSample: false,
                    })),
                    venue3D: venueConfig,
                    scenarios: [],
                    createdAt: activeEvent.createdAt,
                    updatedAt: activeEvent.updatedAt,
                  }}
                  onImportPlan={() => {}}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
