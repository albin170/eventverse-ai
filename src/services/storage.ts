import { EventPlan } from '@/types';
import { EventPlanSchema } from '@/schemas';

const STORAGE_KEY = 'eventverse_events_v2';
const ACTIVE_EVENT_KEY = 'eventverse_active_event_id_v2';

/**
 * Retrieves all stored event plans from local persistence.
 * Validates each item against EventPlanSchema; filters out corrupted entries.
 */
export function getStoredEvents(): EventPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validEvents: EventPlan[] = [];
    for (const item of parsed) {
      const result = EventPlanSchema.safeParse(item);
      if (result.success) {
        validEvents.push(result.data as EventPlan);
      }
    }

    return validEvents;
  } catch (error) {
    console.warn('Failed to load events from storage:', error);
    return [];
  }
}

/**
 * Saves or updates an event plan in local persistence.
 */
export function saveEventPlan(plan: EventPlan): void {
  try {
    const events = getStoredEvents();
    const index = events.findIndex((e) => e.id === plan.id);

    const updatedPlan: EventPlan = {
      ...plan,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      events[index] = updatedPlan;
    } else {
      events.unshift(updatedPlan);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    setActiveEventId(updatedPlan.id);
  } catch (error) {
    console.error('Failed to save event plan:', error);
  }
}

/**
 * Deletes an event plan by ID.
 */
export function deleteEventPlan(id: string): void {
  try {
    const events = getStoredEvents().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    if (getActiveEventId() === id) {
      const nextActive = events.length > 0 ? events[0].id : null;
      if (nextActive) {
        setActiveEventId(nextActive);
      } else {
        localStorage.removeItem(ACTIVE_EVENT_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to delete event plan:', error);
  }
}

/**
 * Gets the currently active event ID.
 */
export function getActiveEventId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_EVENT_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets the currently active event ID.
 */
export function setActiveEventId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_EVENT_KEY, id);
  } catch (error) {
    console.error('Failed to set active event ID:', error);
  }
}

/**
 * Retrieves the currently active event plan, or the first available plan.
 */
export function getActiveEvent(): EventPlan | null {
  const events = getStoredEvents();
  if (events.length === 0) return null;

  const activeId = getActiveEventId();
  if (activeId) {
    const found = events.find((e) => e.id === activeId);
    if (found) return found;
  }

  return events[0];
}

/**
 * Provides an authentic starter event template for explicit test harness use.
 */
export function createStarterEventPlan(id = 'plan-starter-01'): EventPlan {
  return {
    id,
    title: 'Executive Summit Gala',
    eventType: 'corporate' as any,
    eventDate: '2026-11-20',
    guestCount: 150,
    totalBudget: 45000,
    currency: 'USD',
    contingencyPercentage: 10,
    theme: 'Midnight & Cyan Horizon',
    colorPalette: ['#8B5CF6', '#06B6D4', '#E2E8F0'],
    culturalPreferences: 'Global executive standard',
    dietaryRequirements: ['Vegetarian', 'Gluten-Free'],
    venuePreferences: 'Metropolitan Hall',
    accessibilityRequirements: ['Wheelchair Ramp', 'Elevator Access'],
    priorities: ['Acoustic Clarity', 'Schedule Precision'],
    restrictions: ['No Open Flames'],
    conceptSummary: 'Executive celebration architecture designed for 150 guests.',
    decorIdeas: ['Architectural lighting', 'Minimalist centerpieces'],
    entertainmentIdeas: ['Live string quartet', 'Keynote audio presentation'],
    menuSuggestions: ['Plated organic banquet', 'Artisanal mocktails'],
    costSavingTips: ['Consolidate AV vendor packaging'],
    riskContingencies: [{ risk: 'Inclement Weather', mitigation: 'Indoor ballroom backup' }],
    budgetItems: [
      {
        id: 'bi-1',
        name: 'Grand Ballroom Venue',
        category: 'venue',
        estimatedCost: 15000,
        actualCost: 14500,
        paidAmount: 5000,
        paymentStatus: 'deposit_paid',
        isPerPerson: false,
        priority: 'must_have',
        confirmed: true,
      },
      {
        id: 'bi-2',
        name: 'Executive Banquet Catering',
        category: 'catering',
        estimatedCost: 15000,
        actualCost: 15000,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        isPerPerson: true,
        unitCost: 100,
        priority: 'must_have',
        confirmed: true,
      },
      {
        id: 'bi-3',
        name: 'Starlight Ambient Lighting',
        category: 'decor',
        estimatedCost: 5000,
        actualCost: 4500,
        paidAmount: 2000,
        paymentStatus: 'deposit_paid',
        isPerPerson: false,
        priority: 'nice_to_have',
        confirmed: false,
      },
    ],
    tasks: [
      {
        id: 't-1',
        title: 'Sign Ballroom Master Agreement',
        description: 'Verify insurance coverage and deposit schedule.',
        dueDate: '2026-10-01',
        daysBeforeEvent: 50,
        priority: 'urgent',
        status: 'completed',
        category: 'venue',
        dependencies: [],
        responsiblePerson: 'Lead Coordinator',
        completionPercentage: 100,
      },
      {
        id: 't-2',
        title: 'Approve Banquet Tasting Menu',
        description: 'Review dietary portions and plating schedule.',
        dueDate: '2026-10-25',
        daysBeforeEvent: 26,
        priority: 'high',
        status: 'todo',
        category: 'catering',
        dependencies: ['t-1'],
        responsiblePerson: 'Executive Committee',
        completionPercentage: 0,
      },
    ],
    vendors: [],
    venue3D: {
      themeColor: '#8B5CF6',
      accentColor: '#06B6D4',
      lightingPreset: 'evening',
      stagePosition: 'front',
      tableLayout: 'banquet',
      tableCount: 15,
      danceFloor: true,
      ambientBrightness: 1.0,
    },
    scenarios: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const createInitialDemoPlan = createStarterEventPlan;
