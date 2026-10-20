export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'college_fest'
  | 'community'
  | 'custom';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export type ExpenseCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'entertainment'
  | 'photography'
  | 'attire'
  | 'logistics'
  | 'stationery'
  | 'contingency'
  | 'miscellaneous';

export interface BudgetItem {
  id: string;
  name: string;
  category: ExpenseCategory;
  estimatedCost: number; // in base units (e.g. dollars)
  actualCost?: number;
  isPerPerson: boolean; // if true, multiplied by guest count
  unitCost?: number; // per guest cost if isPerPerson is true
  priority: 'must_have' | 'nice_to_have' | 'optional';
  confirmed: boolean; // True if quotation is confirmed by vendor
  notes?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimatedCost: number;
  totalConfirmedCost: number;
  remainingBudget: number;
  utilizationPercentage: number;
  perGuestCost: number;
  contingencyReserve: number;
  contingencyPercentage: number;
  isOverBudget: boolean;
  categoryBreakdown: Record<ExpenseCategory, number>;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  daysBeforeEvent: number; // Offset from event date
  priority: TaskPriority;
  status: TaskStatus;
  category: ExpenseCategory;
  dependencies: string[]; // Task IDs that must complete first
  responsiblePerson: string;
  completionPercentage: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: ExpenseCategory;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  estimatedStartingPrice: number;
  notes?: string;
  isShortlisted: boolean;
  enquiryStatus: 'not_contacted' | 'contacted' | 'quoted' | 'booked' | 'declined';
  isDemoSample: boolean;
}

export interface Venue3DConfig {
  themeColor: string;
  accentColor: string;
  lightingPreset: 'romantic' | 'vibrant' | 'minimal' | 'evening';
  stagePosition: 'front' | 'center' | 'none';
  tableLayout: 'banquet' | 'cocktail' | 'theater' | 'u_shape';
  tableCount: number;
  danceFloor: boolean;
  ambientBrightness: number;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  guestCount: number;
  customAdjustments: {
    category: ExpenseCategory;
    percentageAdjustment: number;
  }[];
  notes?: string;
  calculatedCost: number;
  calculatedPerGuest: number;
  calculatedUtilization: number;
}

export interface EventPlan {
  id: string;
  title: string;
  eventType: EventType;
  eventDate: string; // YYYY-MM-DD
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

  // Generated & Managed Content
  conceptSummary: string;
  decorIdeas: string[];
  entertainmentIdeas: string[];
  menuSuggestions: string[];
  costSavingTips: string[];
  riskContingencies: { risk: string; mitigation: string }[];

  budgetItems: BudgetItem[];
  tasks: TimelineTask[];
  vendors: Vendor[];
  venue3D: Venue3DConfig;
  scenarios: WhatIfScenario[];

  createdAt: string;
  updatedAt: string;
}
