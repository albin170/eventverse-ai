import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventDashboard } from '@/app/EventDashboard';

describe('End-to-End User Planning Journey (Event Creation & Tab Workspaces)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('executes full authentic lifecycle from empty state to multi-tab management', async () => {
    // 1. Initial render -> authentic empty state (0 fake events, 0 demo badges)
    render(<EventDashboard />);
    expect(screen.getAllByText(/EventVerse/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/No Events Created Yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/DEMO MODE/i)).not.toBeInTheDocument();

    // 2. Open Event Creation Wizard
    const startBtn = screen.getByRole('button', { name: /Start Planning Event/i });
    fireEvent.click(startBtn);

    expect(screen.getByText(/Create New Event/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();

    // 3. Step 1: Fundamentals - Fill title
    const titleInput = screen.getByLabelText(/Event Title \*/i);
    fireEvent.change(titleInput, { target: { value: 'Grand Celestial Gala 2026' } });

    const continueBtn1 = screen.getByRole('button', { name: /Continue →/i });
    fireEvent.click(continueBtn1);

    // 4. Step 2: Headcount & Financial Allocation
    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    });
    const continueBtn2 = screen.getByRole('button', { name: /Continue →/i });
    fireEvent.click(continueBtn2);

    // 5. Step 3: Aesthetics & Accessibility
    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
    });
    const continueBtn3 = screen.getByRole('button', { name: /Continue →/i });
    fireEvent.click(continueBtn3);

    // 6. Step 4: Summary & Confirm
    await waitFor(() => {
      expect(screen.getByText(/Review Event Plan Configuration/i)).toBeInTheDocument();
    });
    const submitBtn = screen.getByRole('button', { name: /Confirm & Initialize Event/i });
    fireEvent.click(submitBtn);

    // 7. Event created -> Workspace appears with event details
    await waitFor(() => {
      expect(screen.queryByText(/No Events Created Yet/i)).not.toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    // 8. Navigate to Smart Budget tab
    const budgetTab = screen.getByRole('tab', { name: /Smart Budget Engine/i });
    fireEvent.click(budgetTab);
    await waitFor(() => {
      expect(screen.getByText(/Total Budget/i)).toBeInTheDocument();
    });

    // 9. Navigate to Timeline & Checklist tab
    const timelineTab = screen.getByRole('tab', { name: /Timeline & Checklist/i });
    fireEvent.click(timelineTab);
    await waitFor(() => {
      expect(screen.getByText(/Event Timeline & Milestones/i)).toBeInTheDocument();
    });

    // 10. Navigate to 3D Spatial Studio tab
    const venueTab = screen.getByRole('tab', { name: /3D Spatial Studio/i });
    fireEvent.click(venueTab);
    await waitFor(() => {
      expect(screen.getByText(/Interactive Venue Spatial Studio/i)).toBeInTheDocument();
    });

    // Switch between 3D and 2D floor plans
    const switch2DBtn = screen.getByRole('button', { name: /2D Floor Plan/i });
    fireEvent.click(switch2DBtn);
    await waitFor(() => {
      expect(screen.getByText(/2D Architectural Floor Plan/i)).toBeInTheDocument();
    });

    // 11. Navigate to Suppliers & Directory tab
    const vendorTab = screen.getByRole('tab', { name: /Suppliers & Directory/i });
    fireEvent.click(vendorTab);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search vendor name, service area/i)).toBeInTheDocument();
    });

    // 12. Navigate to Export & Dossier tab
    const exportTab = screen.getByRole('tab', { name: /Export & Dossier/i });
    fireEvent.click(exportTab);
    await waitFor(() => {
      expect(screen.getByText(/Export & Executive Dossier Delivery/i)).toBeInTheDocument();
    });
  });
});
