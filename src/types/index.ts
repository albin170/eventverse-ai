export type UserRole = 'admin' | 'user' | 'guest';
export type AccountStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  suspensionReason?: string;
}

export type EventCategory =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'college_fest'
  | 'corporate'
  | 'community'
  | 'custom';

export type EventType = EventCategory;

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD';

export type EventStatus = 'planning' | 'confirmed' | 'archived' | 'cancelled';
export type ModerationStatus = 'approved' | 'flagged' | 'suspended';

export interface EventRecord {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  title: string;
  category: EventCategory;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string; // HH:mm
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: CurrencyCode;
  contingencyPercentage: number;
  theme: string;
  colorPalette: string[];
  cateringPreferences: string;
  accessibilityRequirements: string[];
  notes?: string;
  priorityPreferences?: string[];
  status: EventStatus;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

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

export type ItemPriority = 'must_have' | 'nice_to_have' | 'optional';
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'fully_paid';

export interface BudgetItem {
  id: string;
  eventId?: string;
  ownerId?: string;
  name: string;
  category: ExpenseCategory;
  estimatedCost: number; // In standard major units
  actualCost?: number;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
  isPerPerson: boolean;
  unitCost?: number;
  priority: ItemPriority;
  confirmed: boolean; // Confirmed vendor quote
  vendorId?: string;
  dueDate?: string;
  notes?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalConfirmedCost: number;
  remainingBudget: number;
  utilizationPercentage: number;
  perGuestCost: number;
  contingencyReserve: number;
  contingencyPercentage: number;
  isOverBudget: boolean;
  categoryBreakdown: Record<ExpenseCategory, number>;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TimelineTask {
  id: string;
  eventId?: string;
  ownerId?: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  daysBeforeEvent: number;
  priority: TaskPriority;
  status: TaskStatus;
  category: ExpenseCategory;
  dependencies: string[]; // Task IDs required before starting
  responsiblePerson: string;
  completionPercentage: number;
}

export type RsvpStatus = 'attending' | 'declined' | 'tentative' | 'pending';
export type GuestCategory = 'family' | 'friends' | 'colleagues' | 'vip' | 'general';

export interface GuestRecord {
  id: string;
  eventId: string;
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  rsvpStatus: RsvpStatus;
  category: GuestCategory;
  dietaryRequirements: string;
  accessibilityNotes?: string;
  seatingGroup?: string;
  plusOnes: number;
  invitedAt: string;
  respondedAt?: string;
}

export type VendorVerificationStatus = 'verified' | 'pending_review' | 'suspended';
export type PriceTier = '$' | '$$' | '$$$' | '$$$$';

export interface VendorProfile {
  id: string;
  name: string;
  category: ExpenseCategory;
  businessDescription: string;
  serviceArea: string;
  contactEmail: string;
  contactPhone: string;
  startingPrice: number;
  priceTier: PriceTier;
  deliverables: string[];
  verificationStatus: VendorVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: ExpenseCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  location?: string;
  priceRange?: PriceTier | string;
  estimatedStartingPrice?: number;
  notes?: string;
  isShortlisted?: boolean;
  enquiryStatus?: string;
  isDemoSample?: boolean;
}

export type EnquiryStatus = 'submitted' | 'under_review' | 'quoted' | 'declined' | 'closed';

export interface VendorEnquiry {
  id: string;
  vendorId: string;
  vendorName: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  eventDate: string;
  guestCount: number;
  estimatedBudget: number;
  message: string;
  status: EnquiryStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface VenueDesignRecord {
  id: string;
  eventId: string;
  ownerId: string;
  sceneConfig: Venue3DConfig;
  updatedAt: string;
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
  eventType: EventCategory;
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

export type AuditTargetType = 'user' | 'event' | 'vendor' | 'enquiry' | 'setting' | 'system';

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  reason: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PlatformSettings {
  supportedCurrencies: CurrencyCode[];
  maintenanceMode: boolean;
  contactEmail: string;
  termsUpdatedDate: string;
  privacyPolicyUrl: string;
}
