import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboard } from '@/app/AdminDashboard';
import { UserProfile } from '@/types';
import { listAuditLogs } from '@/services/database';

describe('Admin Panel Governance & Operational Journey', () => {
  const adminUser: UserProfile = {
    uid: 'admin_test_uid',
    email: 'admin@eventverse.internal',
    displayName: 'Chief Administrator',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renders admin dashboard metrics and manages accounts, vendors, and audit logs', async () => {
    const handleExit = () => {};
    render(<AdminDashboard currentUser={adminUser} onExitAdmin={handleExit} />);

    // 1. Check Admin Portal header
    expect(screen.getByText(/EventVerse Admin Console/i)).toBeInTheDocument();
    expect(screen.getByText(/PRIVILEGED/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@eventverse.internal/i)).toBeInTheDocument();

    // 2. Navigate to User Accounts tab
    const usersTab = screen.getByRole('button', { name: /User Accounts/i });
    fireEvent.click(usersTab);
    await waitFor(() => {
      expect(screen.getByText(/Platform User Accounts/i)).toBeInTheDocument();
    });

    // 3. Navigate to Event Moderation tab
    const eventsTab = screen.getByRole('button', { name: /Event Moderation/i });
    fireEvent.click(eventsTab);
    await waitFor(() => {
      expect(screen.getByText(/Event Moderation Queue/i)).toBeInTheDocument();
    });

    // 4. Navigate to Vendor Management tab
    const vendorsTab = screen.getByRole('button', { name: /Vendor Management/i });
    fireEvent.click(vendorsTab);
    await waitFor(() => {
      expect(screen.getByText(/Verified Vendor Directory Control/i)).toBeInTheDocument();
    });

    // Open Register Verified Vendor Modal
    const addVendorBtn = screen.getByRole('button', { name: /\+ Register Verified Vendor/i });
    fireEvent.click(addVendorBtn);
    expect(screen.getByRole('heading', { name: /Register Verified Vendor/i })).toBeInTheDocument();

    // Fill in verified vendor form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Celestial Floral Artisans/i), {
      target: { value: 'Starlight Audio Engineering' },
    });
    fireEvent.change(screen.getByPlaceholderText(/vendor@company\.com/i), {
      target: { value: 'contact@starlightaudio.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/\+1 555-0100/i), {
      target: { value: '+1 555-8899' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. San Francisco Bay Area/i), {
      target: { value: 'Bay Area Metro' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Full service, Setup, Cleanup/i), {
      target: { value: 'Main PA System, Wireless Microphones, Live Engineer' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe services, specializations, certifications\.\.\./i), {
      target: { value: 'Acoustical engineering and sound reinforcement for celebrations and gala events.' },
    });

    // Submit vendor registration
    const submitVendorBtn = screen.getByRole('button', { name: /Verify & Register/i });
    fireEvent.click(submitVendorBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /Register Verified Vendor/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Starlight Audio Engineering/i)).toBeInTheDocument();
    });

    // 5. Navigate to Client Enquiries tab
    const enquiriesTab = screen.getByRole('button', { name: /Client Enquiries/i });
    fireEvent.click(enquiriesTab);
    await waitFor(() => {
      expect(screen.getByText(/Client Vendor Enquiries/i)).toBeInTheDocument();
    });

    // 6. Navigate to System Audit Logs tab
    const auditsTab = screen.getByRole('button', { name: /Audit Trail/i });
    fireEvent.click(auditsTab);
    await waitFor(() => {
      expect(screen.getByText(/Cryptographically sequenced record/i)).toBeInTheDocument();
    });

    // Verify audit logs exist
    const logs = await listAuditLogs(adminUser);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs.some((l) => l.action === 'CREATE_VENDOR_PROFILE')).toBe(true);
  });
});
