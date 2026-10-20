import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventDashboard } from '@/app/EventDashboard';
import { getStoredEvents } from '@/services/storage';

describe('End-to-End User Planning Journey (10-Step Journey)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('executes full 10-step lifecycle smoothly', async () => {
    // 1. Initial render & load DEMO plan
    render(<EventDashboard />);
    expect(screen.getAllByText(/EventVerse/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/DEMO MODE/i)).toBeInTheDocument();

    // 2. Verify initial event is present
    expect(screen.getByText(/Aura & Neil: Celestial Starlight Wedding/i)).toBeInTheDocument();

    // 3. Navigate to Smart Budget tab
    const budgetTabBtn = screen.getByRole('tab', { name: /Smart Budget Engine/i });
    fireEvent.click(budgetTabBtn);

    // 4. Wait for budget tab and change guest count
    const guestInput = await waitFor(() =>
      screen.getByLabelText(/Adjust guest count for live cost recalculation/i)
    );
    expect(guestInput).toBeInTheDocument();

    // Change headcount from 120 to 150
    fireEvent.change(guestInput, { target: { value: '150' } });
    await waitFor(() => {
      // The variable items should have recalculated and updated storage
      const stored = getStoredEvents();
      expect(stored[0].guestCount).toBe(150);
    });

    // 5. Navigate to Timeline & Checklist tab
    const timelineTabBtn = screen.getByRole('tab', { name: /Timeline & Checklist/i });
    fireEvent.click(timelineTabBtn);

    // 6. Complete a checklist task
    const reopenOrStartButtons = await waitFor(() =>
      screen.getAllByRole('button', { name: /Start|Complete|Reopen/i })
    );
    expect(reopenOrStartButtons.length).toBeGreaterThan(0);
    fireEvent.click(reopenOrStartButtons[0]);

    // 7. Modify the event date
    const dateInput = await waitFor(() => screen.getByLabelText(/Event Date:/i));
    fireEvent.change(dateInput, { target: { value: '2026-12-25' } });

    await waitFor(() => {
      const stored = getStoredEvents();
      expect(stored[0].eventDate).toBe('2026-12-25');
    });

    // 8. Navigate to 3D Spatial Studio & switch between 3D and 2D
    const venueTabBtn = screen.getByRole('tab', { name: /3D Spatial Studio/i });
    fireEvent.click(venueTabBtn);
    await waitFor(() => {
      expect(screen.getByText(/Interactive Venue Spatial Studio/i)).toBeInTheDocument();
    });

    const switch2DBtn = screen.getByRole('button', { name: /2D Floor Plan/i });
    fireEvent.click(switch2DBtn);
    await waitFor(() => {
      expect(screen.getByText(/2D Architectural Floor Plan/i)).toBeInTheDocument();
    });

    // 9. Navigate to Suppliers & Directory tab
    const vendorsTabBtn = screen.getByRole('tab', { name: /Suppliers & Directory/i });
    fireEvent.click(vendorsTabBtn);
    await waitFor(() => {
      expect(screen.getByText(/Vendor Directory & Selection Criteria/i)).toBeInTheDocument();
    });

    // 10. Navigate to Export & Dossier tab
    const exportTabBtn = screen.getByRole('tab', { name: /Export & Dossier/i });
    fireEvent.click(exportTabBtn);
    await waitFor(() => {
      expect(screen.getByText(/Export & Executive Dossier Delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Itemized Budget Ledger/i)).toBeInTheDocument();
      expect(screen.getByText(/Live Dossier Preview/i)).toBeInTheDocument();
    });
  });
});
