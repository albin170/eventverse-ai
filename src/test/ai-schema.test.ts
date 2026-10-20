import { describe, it, expect } from 'vitest';
import { generateEventPlan } from '@/features/ai-planner/service';
import { AIPlanResponseSchema } from '@/schemas';

describe('AI Planner Service - Schema & DEMO Determinism', () => {
  it('generates a realistic, complete plan in DEMO mode without requiring API key', async () => {
    const params = {
      title: 'Neon Horizon College Fest',
      eventType: 'college_fest' as const,
      eventDate: '2026-11-20',
      guestCount: 500,
      totalBudget: 40000,
      currency: 'USD' as const,
      contingencyPercentage: 10,
      theme: 'Cybernetic Neon Pulse',
      colorPalette: ['#8B5CF6', '#06B6D4'],
      culturalPreferences: 'Collegiate Student Music & Innovation Fair',
      dietaryRequirements: ['Vegetarian', 'Vegan'],
      venuePreferences: 'Open Air Campus Amphitheater',
      accessibilityRequirements: ['Wheelchair Ramps'],
      priorities: ['Sound Quality', 'Safety'],
      restrictions: ['No pyrotechnics'],
    };

    const res = await generateEventPlan(params, true);

    expect(res.isDemoMode).toBe(true);
    expect(res.modelNotice).toContain('Operating in DEMO mode');
    expect(res.plan.title).toBe(params.title);
    expect(res.plan.guestCount).toBe(500);
    expect(res.plan.budgetItems.length).toBeGreaterThanOrEqual(5);
    expect(res.plan.tasks.length).toBeGreaterThanOrEqual(4);
    expect(res.plan.vendors.length).toBeGreaterThanOrEqual(3);
    expect(res.plan.decorIdeas.length).toBeGreaterThanOrEqual(2);
    expect(res.plan.menuSuggestions.length).toBeGreaterThanOrEqual(2);
    expect(res.plan.riskContingencies.length).toBeGreaterThanOrEqual(2);
  });

  it('validates compliant AI schema responses', () => {
    const validAiResponse = {
      conceptSummary: 'An atmospheric gala featuring modern lighting and fine dining.',
      decorIdeas: ['Dramatic ceiling drapery', 'Ambient LED uplighting'],
      entertainmentIdeas: ['Live string ensemble'],
      menuSuggestions: ['Canapés reception', 'Multi-course plated dinner'],
      costSavingTips: ['Digital invitations'],
      riskContingencies: [
        { risk: 'Rain forecasted', mitigation: 'Indoor ballroom reserved' },
      ],
      suggestedBudgetItems: [
        {
          name: 'Venue Fee',
          category: 'venue',
          isPerPerson: false,
          estimatedCost: 5000,
          priority: 'must_have',
        },
        {
          name: 'Dinner Catering',
          category: 'catering',
          isPerPerson: true,
          unitCost: 50,
          estimatedCost: 5000,
          priority: 'must_have',
        },
        {
          name: 'Audio Production',
          category: 'entertainment',
          isPerPerson: false,
          estimatedCost: 2000,
          priority: 'nice_to_have',
        },
      ],
      suggestedTasks: [
        {
          title: 'Sign Contract',
          description: 'Lock in date',
          daysBeforeEvent: 90,
          priority: 'critical',
          category: 'venue',
          responsiblePerson: 'Lead',
        },
        {
          title: 'Finalize Menu',
          description: 'Lock dishes',
          daysBeforeEvent: 45,
          priority: 'high',
          category: 'catering',
          responsiblePerson: 'Caterer',
        },
        {
          title: 'Guest Briefing',
          description: 'Coordinate schedule',
          daysBeforeEvent: 7,
          priority: 'medium',
          category: 'logistics',
          responsiblePerson: 'Host',
        },
      ],
    };

    const parsed = AIPlanResponseSchema.safeParse(validAiResponse);
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed AI output missing mandatory arrays', () => {
    const malformed = {
      conceptSummary: 'Too short',
      decorIdeas: [], // Invalid: min 2 required
    };
    const parsed = AIPlanResponseSchema.safeParse(malformed);
    expect(parsed.success).toBe(false);
  });
});
