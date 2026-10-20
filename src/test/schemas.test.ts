import { describe, it, expect } from 'vitest';
import { EventFormSchema } from '../schemas/event.schema';
import { BudgetItemSchema, BudgetPlanSchema } from '../schemas/budget.schema';
import { TimelineTaskSchema } from '../schemas/timeline.schema';
import { VendorSchema } from '../schemas/vendor.schema';

describe('Zod Schema Validations', () => {
  it('validates a compliant EventForm input', () => {
    const validEvent = {
      title: 'Aurora Gala 2026',
      eventType: 'wedding',
      eventDate: '2026-11-20',
      location: 'Metropolitan Hall, San Francisco',
      guestCount: 150,
      totalBudget: 45000,
      currency: 'USD',
      theme: 'Celestial Midnight & Starlight',
      primaryColor: '#8B5CF6',
      secondaryColor: '#06B6D4',
      culturalPreferences: 'Modern multicultural ceremony',
      dietaryRequirements: ['Vegetarian', 'Gluten-Free'],
      accessibilityRequirements: ['Wheelchair Ramp', 'Elevator Access'],
      priority: 'experience',
      notes: 'Focus on stellar lighting and audio quality',
    };

    const parseResult = EventFormSchema.safeParse(validEvent);
    expect(parseResult.success).toBe(true);
  });

  it('rejects invalid event fields with informative errors', () => {
    const invalidEvent = {
      title: 'A', // Too short
      eventType: 'invalid_type',
      eventDate: 'not-a-date',
      location: '',
      guestCount: -5,
      totalBudget: -100,
      currency: 'XYZ',
      theme: '',
      primaryColor: 'not-a-hex',
      secondaryColor: '#ZZZ',
    };

    const result = EventFormSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.title).toBeDefined();
      expect(fieldErrors.guestCount).toBeDefined();
      expect(fieldErrors.totalBudget).toBeDefined();
      expect(fieldErrors.primaryColor).toBeDefined();
    }
  });

  it('validates budget items and plans', () => {
    const validItem = {
      id: 'item-1',
      categoryId: 'venue_setup',
      name: 'Stage Trussing',
      isPerPerson: false,
      amount: 2500,
      priority: 'must_have',
      isConfirmedQuote: true,
    };
    expect(BudgetItemSchema.safeParse(validItem).success).toBe(true);

    const validPlan = {
      eventId: 'evt-101',
      totalBudget: 50000,
      contingencyPercentage: 10,
      items: [validItem],
    };
    expect(BudgetPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it('validates timeline tasks and flags invalid dates', () => {
    const validTask = {
      id: 'task-1',
      title: 'Book Photographer',
      description: 'Review portfolio',
      category: 'Media',
      daysBeforeEvent: 120,
      dueDate: '2026-07-20',
      status: 'todo',
      priority: 'high',
      dependencies: [],
      responsiblePerson: 'Lead',
    };
    expect(TimelineTaskSchema.safeParse(validTask).success).toBe(true);

    const invalidTask = {
      ...validTask,
      dueDate: '07/20/2026', // invalid format (expects YYYY-MM-DD)
    };
    expect(TimelineTaskSchema.safeParse(invalidTask).success).toBe(false);
  });

  it('validates vendor models and guarantees demo marking', () => {
    const sampleVendor = {
      id: 'v-1',
      name: 'Midnight Bloom Florals',
      category: 'decor_florals',
      rating: 4.9,
      reviewCount: 38,
      priceTier: '$$$',
      startingPrice: 3200,
      location: 'Downtown Arts District',
      contactEmail: 'hello@midnightbloom.com',
      contactPhone: '+1-555-0192',
      description: 'Architectural floral design and sustainable installations.',
      deliverables: ['Stage arch', 'Table florals', 'Boutonnieres'],
      isShortlisted: true,
      enquiryStatus: 'contacted',
      isDemoSample: true,
      userNotes: 'Quoted for 15 table centerpieces.',
    };
    expect(VendorSchema.safeParse(sampleVendor).success).toBe(true);
  });
});
