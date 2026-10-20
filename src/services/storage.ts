import { EventPlan } from '@/types';
import { EventPlanSchema } from '@/schemas';

const STORAGE_KEY = 'eventverse_events_v1';
const ACTIVE_EVENT_KEY = 'eventverse_active_event_id';

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
 * Generates a rich, turnkey default celebration plan for first-time visitors
 * in DEMO mode so the app is immediately alive and demonstrable.
 */
export function createInitialDemoPlan(): EventPlan {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 4);
  const eventDateStr = futureDate.toISOString().split('T')[0];

  return {
    id: 'demo-celestial-wedding-2026',
    title: 'Aura & Neil: Celestial Starlight Wedding',
    eventType: 'wedding',
    eventDate: eventDateStr,
    guestCount: 120,
    totalBudget: 35000,
    currency: 'USD',
    contingencyPercentage: 10,
    theme: 'Midnight Velvet & Bioluminescent Cyan',
    colorPalette: ['#8B5CF6', '#06B6D4', '#E2E8F0'],
    culturalPreferences: 'Contemporary Fusion with Evening Lantern Send-off',
    dietaryRequirements: ['Vegetarian', 'Gluten-Free', 'Halal options'],
    venuePreferences: 'Modern Glass Atrium / Architectural Ballroom',
    accessibilityRequirements: ['Step-free wheelchair ramp', 'Low-glare lighting', 'Hearing loop'],
    priorities: ['Memorable Guest Experience', 'Exceptional Live Music', 'Immersive Ambience'],
    restrictions: ['No flash during vows', 'Strict 11 PM outdoor sound curfew'],
    notes: 'Key milestone celebration bringing families together across 4 countries.',
    conceptSummary:
      'An ethereal celebration bridging timeless romance with modern celestial aesthetics. Midnight indigo drapery accented by floating luminous cyan orbs, gentle starry ceiling projections, and fragrant white wisteria create an unforgettable immersive environment for 120 guests.',
    decorIdeas: [
      'Ceiling canopy featuring fiber-optic micro-lights mimicking celestial constellations.',
      'Mirrored acrylic banquet runners with floating geometric glass taper candles.',
      'Bespoke illuminated entryway archway framing the couple’s entrance.',
      'Low-glare amber and violet perimeter wash uplights for warm guest photography.',
    ],
    entertainmentIdeas: [
      'Live string quartet playing modern cinematic covers during champagne reception.',
      'Mid-evening transition to a 5-piece neo-soul ensemble and dynamic party DJ.',
      'Interactive 360-degree holographic slow-motion video station for guests.',
    ],
    menuSuggestions: [
      'Appetizer: Seared king oyster mushroom carpaccio with truffle pearls and micro-greens.',
      'Entrée: Herb-crusted Chilean sea bass or wild forest mushroom risotto with rosemary reduction.',
      'Dessert: Celestial blackberry-violet glaze entremet with gold leaf dusting.',
      'Signature Cocktail: The Midnight Aurora (Empress botanical gin, elderflower, violet shimmer).',
    ],
    costSavingTips: [
      'Repurpose ceremony floral pedestals into banquet table centerpieces during cocktail hour.',
      'Curate in-house playlist during initial dinner seating to book the live band for 3 peak hours instead of 5.',
      'Select in-season seasonal foliage to complement statement premium orchids.',
    ],
    riskContingencies: [
      {
        risk: 'Evening condensation or drop in temperature within glass atrium',
        mitigation: 'Dual silent commercial blowers on standby with automatic thermostat controls.',
      },
      {
        risk: 'Sound spillover triggering venue sound limiter',
        mitigation: 'Drummer using electronic mesh kit and directional in-ear monitors for the band.',
      },
    ],
    budgetItems: [
      {
        id: 'item-1',
        name: 'The Glass Pavilion Ballroom Rental',
        category: 'venue',
        estimatedCost: 8500,
        actualCost: 8500,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: true,
        notes: 'Includes full hall, bridal lounge, and valet clearance.',
      },
      {
        id: 'item-2',
        name: 'Four-Course Plated Dinner & Canapés',
        category: 'catering',
        estimatedCost: 10800,
        isPerPerson: true,
        unitCost: 90,
        priority: 'must_have',
        confirmed: false,
        notes: '$90 per guest across 120 guests.',
      },
      {
        id: 'item-3',
        name: 'Celestial Lighting & Custom Florals',
        category: 'decor',
        estimatedCost: 4200,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: false,
        notes: 'Constellation ceiling projections & floral runners.',
      },
      {
        id: 'item-4',
        name: 'String Quartet & Evening Live Band',
        category: 'entertainment',
        estimatedCost: 3100,
        isPerPerson: false,
        priority: 'must_have',
        confirmed: false,
        notes: '5 hours total coverage across ceremony and reception.',
      },
      {
        id: 'item-5',
        name: 'Master Cinematography & Drone Duo',
        category: 'photography',
        estimatedCost: 2800,
        isPerPerson: false,
        priority: 'nice_to_have',
        confirmed: false,
        notes: '10 hours continuous coverage and 4K featurette.',
      },
      {
        id: 'item-6',
        name: 'Interactive Holographic Slow-Mo Photo Station',
        category: 'entertainment',
        estimatedCost: 950,
        isPerPerson: false,
        priority: 'optional',
        confirmed: false,
        notes: 'Can be omitted if budget tightens.',
      },
      {
        id: 'item-7',
        name: 'Custom Holographic Foil Stationery & Keepsakes',
        category: 'stationery',
        estimatedCost: 720,
        isPerPerson: true,
        unitCost: 6,
        priority: 'nice_to_have',
        confirmed: false,
        notes: '$6 per guest invitation suite and place cards.',
      },
      {
        id: 'item-8',
        name: 'Dedicated Guest Shuttle Vans (Hotel to Venue)',
        category: 'logistics',
        estimatedCost: 650,
        isPerPerson: false,
        priority: 'optional',
        confirmed: false,
        notes: '2 round-trip vans for out-of-town guests.',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Sign Venue Contract & Deposit',
        description: 'Review atrium terms and secure 10 PM sound extension permit.',
        dueDate: '2026-08-01',
        daysBeforeEvent: 90,
        priority: 'critical',
        status: 'completed',
        category: 'venue',
        dependencies: [],
        responsiblePerson: 'Neil (Host)',
        completionPercentage: 100,
      },
      {
        id: 'task-2',
        title: 'Finalize Tasting & Confirm Dietary List',
        description: 'Taste vegan and gluten-free alternatives with Chef Vance.',
        dueDate: '2026-09-01',
        daysBeforeEvent: 60,
        priority: 'high',
        status: 'in_progress',
        category: 'catering',
        dependencies: ['task-1'],
        responsiblePerson: 'Aura (Host)',
        completionPercentage: 60,
      },
      {
        id: 'task-3',
        title: 'Send Celestial Save-the-Dates & Digital RSVP',
        description: 'Distribute portal link and gather dietary preferences.',
        dueDate: '2026-09-15',
        daysBeforeEvent: 45,
        priority: 'high',
        status: 'todo',
        category: 'stationery',
        dependencies: ['task-1'],
        responsiblePerson: 'Communications Lead',
        completionPercentage: 20,
      },
      {
        id: 'task-4',
        title: 'Finalize Lighting Color Program & Sound Check',
        description: 'Map color transitions for grand entrance and slow dance.',
        dueDate: '2026-10-10',
        daysBeforeEvent: 20,
        priority: 'medium',
        status: 'todo',
        category: 'entertainment',
        dependencies: ['task-2'],
        responsiblePerson: 'AV Tech',
        completionPercentage: 0,
      },
      {
        id: 'task-5',
        title: 'Day-of Logistics Walkthrough & Emergency Sync',
        description: 'Sync vendor arrival times, loading dock access, and green room.',
        dueDate: '2026-10-28',
        daysBeforeEvent: 2,
        priority: 'critical',
        status: 'todo',
        category: 'logistics',
        dependencies: ['task-4'],
        responsiblePerson: 'Lead Coordinator',
        completionPercentage: 0,
      },
    ],
    vendors: [
      {
        id: 'v-1',
        name: 'The Glass Pavilion Atrium',
        category: 'venue',
        contactName: 'Victoria Sterling',
        email: 'vsterling@glasspavilion.example.com',
        phone: '+1 (555) 789-0123',
        location: 'Skyline Terrace Boulevard',
        priceRange: '$$$$',
        estimatedStartingPrice: 8500,
        notes: 'Confirmed and deposit paid. Wheelchair accessible elevator present.',
        isShortlisted: true,
        enquiryStatus: 'booked',
        isDemoSample: true,
      },
      {
        id: 'v-2',
        name: 'Vance Artisanal Gourmet Catering',
        category: 'catering',
        contactName: 'Chef Marcus Vance',
        email: 'events@vancegourmet.example.com',
        phone: '+1 (555) 456-7890',
        location: 'Culinary Row, District 4',
        priceRange: '$$$',
        estimatedStartingPrice: 9000,
        notes: 'Quote received for $90/head. Tasting scheduled for next week.',
        isShortlisted: true,
        enquiryStatus: 'quoted',
        isDemoSample: true,
      },
      {
        id: 'v-3',
        name: 'Luminescent Horizons Lighting & Design',
        category: 'decor',
        contactName: 'Sophia Mercer',
        email: 'sophia@luminescentdesign.example.com',
        phone: '+1 (555) 234-5671',
        location: 'Design Quarter',
        priceRange: '$$',
        estimatedStartingPrice: 4000,
        notes: 'Specializes in low-heat LED arrays and custom constellation canopies.',
        isShortlisted: true,
        enquiryStatus: 'contacted',
        isDemoSample: true,
      },
      {
        id: 'v-4',
        name: 'The Velvet Harmony 5-Piece Band',
        category: 'entertainment',
        contactName: 'Leo Sinclair',
        email: 'booking@velvetharmony.example.com',
        phone: '+1 (555) 678-9012',
        location: 'Downtown Arts Center',
        priceRange: '$$$',
        estimatedStartingPrice: 3000,
        notes: 'Acoustic quartet for ceremony + high-energy reception combo.',
        isShortlisted: true,
        enquiryStatus: 'contacted',
        isDemoSample: true,
      },
    ],
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
