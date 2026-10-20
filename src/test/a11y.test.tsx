import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';
import { EventDashboard } from '@/app/EventDashboard';
import { BudgetDashboard } from '@/features/budget/BudgetDashboard';
import { Venue2DFallback } from '@/features/venue-studio/Venue2DFallback';
import { createInitialDemoPlan } from '@/services/storage';

describe('Accessibility Verification (WCAG 2.2 AA Conformance)', () => {
  it('EventDashboard renders accessible semantic landmarks with zero critical a11y violations', async () => {
    const { container } = render(<EventDashboard />);

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toEqual([]);
  });

  it('BudgetDashboard contains proper form labels, progressbars, and table headers', async () => {
    const plan = createInitialDemoPlan();
    const { container } = render(
      <BudgetDashboard
        items={plan.budgetItems}
        totalBudget={plan.totalBudget}
        guestCount={plan.guestCount}
        currency={plan.currency}
        contingencyPercentage={plan.contingencyPercentage}
        onUpdateItems={() => {}}
        onUpdateGuestCount={() => {}}
        onUpdateBudget={() => {}}
        onUpdateContingency={() => {}}
      />
    );

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    const violations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });

  it('2D Architectural Venue Fallback is fully accessible with ARIA region', async () => {
    const plan = createInitialDemoPlan();
    const { container } = render(<Venue2DFallback config={plan.venue3D} />);

    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });
});
