import {
  EventPlan,
  EventType,
  CurrencyCode,
  ExpenseCategory,
  BudgetItem,
  TimelineTask,
  Vendor,
  Venue3DConfig,
} from '@/types';
import { AIPlanResponseSchema } from '@/schemas';
import { calculateDueDate } from '@/features/timeline/engine';

export interface GeneratePlanParams {
  title: string;
  eventType: EventType;
  eventDate: string;
  location?: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  contingencyPercentage: number;
  theme: string;
  colorPalette: string[];
  culturalPreferences: string;
  dietaryRequirements: string[];
  venuePreferences: string;
  accessibilityRequirements: string[];
  priorities: string[];
  restrictions: string[];
  notes?: string;
}

export interface PlanGenerationResult {
  plan: EventPlan;
  isDemoMode: boolean;
  modelNotice: string;
}

/**
 * Creates realistic, deterministically generated budget items tailored for the event type.
 */
function createDeterministicBudgetItems(
  _eventType: EventType,
  totalBudget: number,
  guestCount: number
): BudgetItem[] {
  // Approximate standard budget allocation ratios
  const baseItems: Array<{
    name: string;
    category: ExpenseCategory;
    isPerPerson: boolean;
    costPctOrUnit: number; // if perPerson: unit cost; if fixed: percentage of total budget
    priority: 'must_have' | 'nice_to_have' | 'optional';
    notes?: string;
  }> = [
    {
      name: 'Main Venue Rental & Hall Facilities',
      category: 'venue',
      isPerPerson: false,
      costPctOrUnit: 0.28,
      priority: 'must_have',
      notes: 'Includes main ballroom, green rooms, and basic audio hookups',
    },
    {
      name: 'Full-Service Catering & Hors d’oeuvres',
      category: 'catering',
      isPerPerson: true,
      costPctOrUnit: totalBudget > 0 ? (totalBudget * 0.32) / guestCount : 45,
      priority: 'must_have',
      notes: 'Includes appetizers, multi-course banquet, and soft beverages',
    },
    {
      name: 'Thematic Floral Installations & Ambient Lighting',
      category: 'decor',
      isPerPerson: false,
      costPctOrUnit: 0.12,
      priority: 'nice_to_have',
      notes: 'Custom stage backdrop, table runners, and programmable uplights',
    },
    {
      name: 'Live Music / DJ & Sound Engineering',
      category: 'entertainment',
      isPerPerson: false,
      costPctOrUnit: 0.09,
      priority: 'must_have',
      notes: 'Professional audio console, wireless microphones, and evening set',
    },
    {
      name: 'Cinematography & Candid Photography Package',
      category: 'photography',
      isPerPerson: false,
      costPctOrUnit: 0.08,
      priority: 'nice_to_have',
      notes: 'Full day coverage with digital album and highlight reel',
    },
    {
      name: 'Stationery, Digital RSVP & Signage Displays',
      category: 'stationery',
      isPerPerson: true,
      costPctOrUnit: totalBudget > 0 ? (totalBudget * 0.02) / guestCount : 6,
      priority: 'optional',
      notes: 'Welcome boards, custom table numbers, and digital portal',
    },
    {
      name: 'Guest Shuttles & Logistic Valet Coordination',
      category: 'logistics',
      isPerPerson: false,
      costPctOrUnit: 0.04,
      priority: 'optional',
      notes: 'Dedicated parking coordinator and venue shuttle runs',
    },
  ];

  return baseItems.map((b, idx) => {
    let estimatedCost = 0;
    let unitCost: number | undefined;

    if (b.isPerPerson) {
      unitCost = Math.round(b.costPctOrUnit * 100) / 100;
      estimatedCost = Math.round(unitCost * guestCount * 100) / 100;
    } else {
      estimatedCost = Math.round(totalBudget * b.costPctOrUnit * 100) / 100;
    }

    return {
      id: `budget-item-${idx + 1}`,
      name: b.name,
      category: b.category,
      estimatedCost,
      isPerPerson: b.isPerPerson,
      unitCost,
      priority: b.priority,
      confirmed: false,
      notes: b.notes,
    };
  });
}

/**
 * Creates curated sample vendors for the event type and location.
 */
function createDeterministicVendors(_currency?: CurrencyCode): Vendor[] {
  return [
    {
      id: 'vendor-1',
      name: 'Starlight Grand Ballrooms & Gardens',
      category: 'venue',
      contactName: 'Elena Rostova',
      email: 'events@starlightballrooms.example.com',
      phone: '+1 (555) 234-5678',
      location: 'Downtown Cultural District',
      priceRange: '$$$',
      estimatedStartingPrice: 4500,
      notes: 'ADA compliant, includes bridal suite and high-speed Wi-Fi.',
      isShortlisted: true,
      enquiryStatus: 'contacted',
      isDemoSample: true,
    },
    {
      id: 'vendor-2',
      name: 'Artisan Culinary Collective',
      category: 'catering',
      contactName: 'Chef Marcus Vance',
      email: 'tastings@artisanculinary.example.com',
      phone: '+1 (555) 876-5432',
      location: 'Westside Gourmet Hub',
      priceRange: '$$',
      estimatedStartingPrice: 3200,
      notes: 'Specializes in gluten-free, vegan, and organic farm-to-table menus.',
      isShortlisted: true,
      enquiryStatus: 'quoted',
      isDemoSample: true,
    },
    {
      id: 'vendor-3',
      name: 'Luminescent Mood & Floral Designers',
      category: 'decor',
      contactName: 'Maya Lin',
      email: 'designs@luminescentmoods.example.com',
      phone: '+1 (555) 345-6789',
      location: 'Metro Arts Plaza',
      priceRange: '$$',
      estimatedStartingPrice: 1800,
      notes: 'Provides LED uplighting, sustainable florals, and custom archways.',
      isShortlisted: false,
      enquiryStatus: 'not_contacted',
      isDemoSample: true,
    },
    {
      id: 'vendor-4',
      name: 'Sonic Pulse Live Band & DJs',
      category: 'entertainment',
      contactName: 'David Kross',
      email: 'booking@sonicpulse.example.com',
      phone: '+1 (555) 987-6543',
      location: 'Studio Row',
      priceRange: '$$$',
      estimatedStartingPrice: 2200,
      notes: 'Offers hybrid live acoustic during reception and upbeat DJ set.',
      isShortlisted: false,
      enquiryStatus: 'not_contacted',
      isDemoSample: true,
    },
    {
      id: 'vendor-5',
      name: 'Aura Lens Photography & Cinema',
      category: 'photography',
      contactName: 'Sophia Chen',
      email: 'hello@auralens.example.com',
      phone: '+1 (555) 456-7890',
      location: 'North Bay Studios',
      priceRange: '$$',
      estimatedStartingPrice: 2000,
      notes: 'Includes drone footage and same-week sneak peek gallery.',
      isShortlisted: true,
      enquiryStatus: 'not_contacted',
      isDemoSample: true,
    },
  ];
}

/**
 * Creates deterministic milestones based on the event date.
 */
function createDeterministicTasks(eventDate: string): TimelineTask[] {
  const taskDefinitions: Array<{
    title: string;
    description: string;
    daysBefore: number;
    priority: TimelineTask['priority'];
    category: ExpenseCategory;
    responsiblePerson: string;
  }> = [
    {
      title: 'Sign Venue Contract & Secure Insurance',
      description: 'Review noise ordinances, load-in hours, and liability policies.',
      daysBefore: 75,
      priority: 'critical',
      category: 'venue',
      responsiblePerson: 'Lead Planner',
    },
    {
      title: 'Complete Catering Tasting & Lock Dietary Counts',
      description: 'Confirm vegan, gluten-free, and children meal allocations.',
      daysBefore: 45,
      priority: 'high',
      category: 'catering',
      responsiblePerson: 'Host',
    },
    {
      title: 'Issue Official Invitations & Launch RSVP Portal',
      description: 'Track responses with real-time seating and meal preferences.',
      daysBefore: 30,
      priority: 'high',
      category: 'stationery',
      responsiblePerson: 'Communications Coordinator',
    },
    {
      title: 'AV Sound Check & Playlist Approval',
      description: 'Curate entrance tracks, speeches, and emergency background audio.',
      daysBefore: 14,
      priority: 'medium',
      category: 'entertainment',
      responsiblePerson: 'Entertainment Lead',
    },
    {
      title: 'Final Table Layout & Floral Walkthrough',
      description: 'Inspect lighting color presets and centerpiece clearance.',
      daysBefore: 7,
      priority: 'medium',
      category: 'decor',
      responsiblePerson: 'Decorator',
    },
    {
      title: 'Day-of Emergency Kit & Vendor Load-in Schedule',
      description: 'Distribute run-sheet to caterer, photographer, and venue manager.',
      daysBefore: 1,
      priority: 'critical',
      category: 'logistics',
      responsiblePerson: 'Day-of Coordinator',
    },
  ];

  return taskDefinitions.map((td, index) => ({
    id: `task-gen-${index + 1}`,
    title: td.title,
    description: td.description,
    dueDate: calculateDueDate(eventDate, td.daysBefore),
    daysBeforeEvent: td.daysBefore,
    priority: td.priority,
    status: 'todo',
    category: td.category,
    dependencies: index > 0 && index < 2 ? [`task-gen-${index}`] : [],
    responsiblePerson: td.responsiblePerson,
    completionPercentage: 0,
  }));
}

/**
 * Builds the complete event plan. If DEMO mode or API failure, produces
 * a high-fidelity deterministic plan.
 */
export async function generateEventPlan(
  params: GeneratePlanParams,
  forceDemoMode: boolean = false
): Promise<PlanGenerationResult> {
  const appMode = import.meta.env.VITE_APP_MODE || 'demo';
  const apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT;

  const isDemo = forceDemoMode || appMode === 'demo' || !apiEndpoint;

  const venue3DConfig: Venue3DConfig = {
    themeColor: params.colorPalette[0] || '#8B5CF6',
    accentColor: params.colorPalette[1] || '#06B6D4',
    lightingPreset: 'evening',
    stagePosition: 'front',
    tableLayout: 'banquet',
    tableCount: Math.min(24, Math.max(4, Math.ceil(params.guestCount / 8))),
    danceFloor: true,
    ambientBrightness: 1.0,
  };

  if (!isDemo) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AI rate limit reached. Please wait a moment before trying again.');
        }
        throw new Error(`AI service responded with status code ${response.status}`);
      }

      const rawJson = await response.json();
      const parsed = AIPlanResponseSchema.safeParse(rawJson);

      if (parsed.success) {
        const aiData = parsed.data;

        const budgetItems: BudgetItem[] = aiData.suggestedBudgetItems.map((item, idx) => ({
          id: `ai-budget-${idx + 1}`,
          name: item.name,
          category: item.category,
          estimatedCost: item.estimatedCost,
          isPerPerson: item.isPerPerson,
          unitCost: item.unitCost,
          priority: item.priority,
          confirmed: false,
          notes: item.notes,
        }));

        const tasks: TimelineTask[] = aiData.suggestedTasks.map((t, idx) => ({
          id: `ai-task-${idx + 1}`,
          title: t.title,
          description: t.description,
          dueDate: calculateDueDate(params.eventDate, t.daysBeforeEvent),
          daysBeforeEvent: t.daysBeforeEvent,
          priority: t.priority,
          status: 'todo',
          category: t.category,
          dependencies: [],
          responsiblePerson: t.responsiblePerson,
          completionPercentage: 0,
        }));

        const plan: EventPlan = {
          id: `event-${Date.now()}`,
          title: params.title,
          eventType: params.eventType,
          eventDate: params.eventDate,
          guestCount: params.guestCount,
          totalBudget: params.totalBudget,
          currency: params.currency,
          contingencyPercentage: params.contingencyPercentage,
          theme: params.theme,
          colorPalette: params.colorPalette,
          culturalPreferences: params.culturalPreferences,
          dietaryRequirements: params.dietaryRequirements,
          venuePreferences: params.venuePreferences,
          accessibilityRequirements: params.accessibilityRequirements,
          priorities: params.priorities,
          restrictions: params.restrictions,
          notes: params.notes,
          conceptSummary: aiData.conceptSummary,
          decorIdeas: aiData.decorIdeas,
          entertainmentIdeas: aiData.entertainmentIdeas,
          menuSuggestions: aiData.menuSuggestions,
          costSavingTips: aiData.costSavingTips,
          riskContingencies: aiData.riskContingencies,
          budgetItems,
          tasks,
          vendors: createDeterministicVendors(params.currency),
          venue3D: venue3DConfig,
          scenarios: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          plan,
          isDemoMode: false,
          modelNotice: 'Plan generated via secure server-side AI model pipeline and validated against Zod schema.',
        };
      }
      // If schema validation failed, fallback gracefully to deterministic DEMO
    } catch {
      // Graceful fallback to deterministic demo mode if backend is offline or network fails
    }
  }

  // Deterministic DEMO Engine: Highly tailored to inputs
  const conceptSummary = `A masterfully orchestrated ${params.eventType.replace('_', ' ')} celebration designed around the "${params.theme}" motif. The aesthetic pairs deep ${params.colorPalette[0] || 'Violet'} with luminous ${params.colorPalette[1] || 'Cyan'} accents, harmonizing with ${params.venuePreferences} requirements and accommodating ${params.guestCount} guests seamlessly.`;

  const decorIdeas = [
    `Thematic architectural lighting highlighting the ${params.colorPalette.join(' & ')} color palette.`,
    `Refined centerpiece designs utilizing local florals and geometric glass elements.`,
    `Signature welcome rotunda featuring ambient low-glare uplights and custom signage.`,
    `Clear wayfinding stations designed specifically for ${params.accessibilityRequirements.join(', ') || 'universal venue access'}.`,
  ];

  const entertainmentIdeas = [
    `Curated acoustic prelude during guest arrival transitioning into dynamic evening entertainment.`,
    `Interactive photo installation with live digital guestbook projection.`,
    `Custom choreographed milestone moment coordinated with lighting transitions.`,
  ];

  const menuSuggestions = [
    `Appetizer: Artisanal seasonal grazing board featuring local produce.`,
    `Entrée: Multi-course dinner accommodating ${params.dietaryRequirements.join(', ') || 'all standard dietary preferences'}.`,
    `Dessert: Signature celebration dessert bar with bespoke confection pairings.`,
    `Beverage: Themed non-alcoholic and artisanal signature craft refreshments.`,
  ];

  const costSavingTips = [
    `Consolidate floral arrangements from the ceremony/welcome area to the main banquet dining tables.`,
    `Opt for digital interactive invitations and RSVPs to trim printing and postal fees.`,
    `Schedule major vendor setup during standard weekday business hours to eliminate weekend overtime surcharges.`,
  ];

  const riskContingencies = [
    {
      risk: 'Unplanned weather fluctuation or sudden temperature drop at venue',
      mitigation: 'Pre-reserve climate control heaters/fans and activate pre-arranged indoor backup salon.',
    },
    {
      risk: 'Vendor delivery delay during morning peak traffic',
      mitigation: 'Establish strict 2-hour buffer before guest arrival and designate an on-site receiving liaison.',
    },
    {
      risk: 'Guest count variance exceeding baseline RSVPs',
      mitigation: 'Caterer contract includes a mandatory 5% buffer on portion prep without excess upfront charge.',
    },
  ];

  const budgetItems = createDeterministicBudgetItems(
    params.eventType,
    params.totalBudget,
    params.guestCount
  );
  const tasks = createDeterministicTasks(params.eventDate);
  const vendors = createDeterministicVendors(params.currency);

  const plan: EventPlan = {
    id: `event-${Date.now()}`,
    title: params.title,
    eventType: params.eventType,
    eventDate: params.eventDate,
    location: params.location || params.venuePreferences,
    guestCount: params.guestCount,
    totalBudget: params.totalBudget,
    currency: params.currency,
    contingencyPercentage: params.contingencyPercentage,
    theme: params.theme,
    colorPalette: params.colorPalette,
    culturalPreferences: params.culturalPreferences,
    dietaryRequirements: params.dietaryRequirements,
    venuePreferences: params.venuePreferences,
    accessibilityRequirements: params.accessibilityRequirements,
    priorities: params.priorities,
    restrictions: params.restrictions,
    notes: params.notes,
    conceptSummary,
    decorIdeas,
    entertainmentIdeas,
    menuSuggestions,
    costSavingTips,
    riskContingencies,
    budgetItems,
    tasks,
    vendors,
    venue3D: venue3DConfig,
    scenarios: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    plan,
    isDemoMode: true,
    modelNotice:
      'Operating in DEMO mode: Generated using EventVerse deterministic planning intelligence with realistic budget ratios and milestone calculations (no paid API key required).',
  };
}

