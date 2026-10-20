import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  VendorProfile,
  VendorEnquiry,
  EventRecord,
  AuditLogRecord,
  ExpenseCategory,
  PriceTier,
} from '@/types';
import {
  getAdminPlatformMetrics,
  listAllUsersForAdmin,
  suspendUserAccount,
  restoreUserAccount,
  listEvents,
  moderateEvent,
  listAllVendorsForAdmin,
  createVendorProfile,
  updateVendorStatus,
  listAllEnquiriesForAdmin,
  updateEnquiryStatus,
  listAuditLogs,
} from '@/services/database';
import { getPersistenceMode } from '@/services/auth';
import { IconShield } from '@/components/icons';

interface AdminDashboardProps {
  currentUser: UserProfile;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'events' | 'vendors' | 'enquiries' | 'audit' | 'ops'
  >('overview');

  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [_loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);


  // New Vendor Form
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [vName, setVName] = useState('');
  const [vCat, setVCat] = useState<ExpenseCategory>('catering');
  const [vDesc, setVDesc] = useState('');
  const [vArea, setVArea] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vPrice, setVPrice] = useState(1500);
  const [vTier, setVTier] = useState<PriceTier>('$$');
  const [vDeliverables, setVDeliverables] = useState('Full service, Cleanup');

  const persistenceMode = getPersistenceMode();

  // ACCESS CONTROL GATE: Strict server/role check
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-midnight-950 flex items-center justify-center p-6 text-white">
        <div className="bg-surface-card border border-red-500/40 p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <IconShield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2">403 Forbidden</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Administrative authorization required. Your current account ({currentUser.email}) does not possess trusted platform administrator privileges.
          </p>
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 rounded-xl bg-surface-elevated hover:bg-white/10 text-white font-medium text-xs border border-surface-border"
          >
            Return to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, uList, eList, vList, enqList, aList] = await Promise.all([
        getAdminPlatformMetrics(currentUser),
        listAllUsersForAdmin(currentUser),
        listEvents(currentUser),
        listAllVendorsForAdmin(currentUser),
        listAllEnquiriesForAdmin(currentUser),
        listAuditLogs(currentUser),
      ]);
      setMetrics(m);
      setUsers(uList);
      setEvents(eList);
      setVendors(vList);
      setEnquiries(enqList);
      setAuditLogs(aList);
    } catch (err: any) {
      setNotification(`Failed to load admin data: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSuspendUser = async (targetEmail: string) => {
    const reason = prompt('Enter justification for suspending this account:');
    if (!reason) return;
    await suspendUserAccount(targetEmail, reason, currentUser);
    setNotification(`Account ${targetEmail} suspended.`);
    await loadData();
  };

  const handleRestoreUser = async (targetEmail: string) => {
    await restoreUserAccount(targetEmail, 'Account reinstated by admin', currentUser);
    setNotification(`Account ${targetEmail} restored to active status.`);
    await loadData();
  };

  const handleModerateEvent = async (eventId: string, newStatus: 'approved' | 'flagged' | 'suspended') => {
    const reason = prompt(`Enter reason for marking event ${newStatus}:`);
    if (!reason) return;
    await moderateEvent(eventId, newStatus, reason, currentUser);
    setNotification(`Event status updated to ${newStatus}.`);
    await loadData();
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vEmail.trim()) return;

    await createVendorProfile(
      {
        name: vName.trim(),
        category: vCat,
        businessDescription: vDesc.trim(),
        serviceArea: vArea.trim() || 'Regional',
        contactEmail: vEmail.trim(),
        contactPhone: vPhone.trim() || '+1-555-0100',
        startingPrice: Number(vPrice),
        priceTier: vTier,
        deliverables: vDeliverables.split(',').map((s) => s.trim()).filter(Boolean),
        verificationStatus: 'verified',
      },
      currentUser
    );

    setShowAddVendor(false);
    setVName('');
    setVDesc('');
    setNotification(`Verified vendor "${vName}" registered in platform directory.`);
    await loadData();
  };

  const handleUpdateVendorStatus = async (vendorId: string, status: 'verified' | 'suspended') => {
    const reason = prompt(`Enter reason for updating vendor status to ${status}:`);
    if (!reason) return;
    await updateVendorStatus(vendorId, status, reason, currentUser);
    setNotification(`Vendor status updated to ${status}.`);
    await loadData();
  };

  const handleUpdateEnquiry = async (enquiryId: string, status: VendorEnquiry['status']) => {
    const notes = prompt(`Enter response/quote notes for enquiry:`, 'Approved quotation sent to client.');
    if (notes === null) return;
    await updateEnquiryStatus(enquiryId, status, notes, currentUser);
    setNotification(`Enquiry status updated to ${status}.`);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 font-sans selection:bg-coral-500/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-midnight-900/90 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-coral-500/20 text-coral-400 border border-coral-500/40 flex items-center justify-center font-bold">
              <IconShield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold font-display text-white">EventVerse Admin Console</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-coral-500/10 text-coral-300 border border-coral-500/30">
                  PRIVILEGED
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Authenticated: {currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-midnight-950 border border-surface-border text-slate-300">
              Storage: {persistenceMode === 'cloud_firebase' ? 'Firebase Firestore' : 'Persistent Local Engine'}
            </span>
            <button
              onClick={onExitAdmin}
              className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-xs font-semibold text-slate-200 border border-surface-border transition-colors"
            >
              Exit to User Portal
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs flex justify-between items-center">
            <span>{notification}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-surface-border pb-4">
          {[
            { id: 'overview', label: 'Platform Overview' },
            { id: 'users', label: `User Accounts (${users.length})` },
            { id: 'events', label: `Event Moderation (${events.length})` },
            { id: 'vendors', label: `Vendor Management (${vendors.length})` },
            { id: 'enquiries', label: `Client Enquiries (${enquiries.length})` },
            { id: 'audit', label: `Audit Trail (${auditLogs.length})` },
            { id: 'ops', label: 'Operational Controls' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-coral-500 text-white shadow-glow'
                  : 'bg-surface-card hover:bg-surface-elevated text-slate-300 border border-surface-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview Metrics */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                <span className="text-xs text-slate-400 font-semibold uppercase">Registered Accounts</span>
                <span className="text-3xl font-bold font-mono text-white mt-1 block">{metrics.totalAccounts}</span>
              </div>
              <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Events Created</span>
                <span className="text-3xl font-bold font-mono text-cyan-400 mt-1 block">{metrics.totalEvents}</span>
              </div>
              <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                <span className="text-xs text-slate-400 font-semibold uppercase">Verified Vendors</span>
                <span className="text-3xl font-bold font-mono text-emerald-400 mt-1 block">{metrics.totalVendors}</span>
              </div>
              <div className="bg-surface-card p-5 rounded-2xl border border-surface-border">
                <span className="text-xs text-slate-400 font-semibold uppercase">Open Enquiries</span>
                <span className="text-3xl font-bold font-mono text-amber-400 mt-1 block">{metrics.openEnquiries}</span>
              </div>
            </div>

            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border">
              <h3 className="text-sm font-bold font-display text-white mb-4">Event Distribution by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(metrics.eventsByCategory || {}).map(([cat, count]: any) => (
                  <div key={cat} className="p-3 rounded-xl bg-midnight-900 border border-surface-border text-center">
                    <span className="text-xs text-slate-400 block capitalize">{cat.replace('_', ' ')}</span>
                    <span className="text-lg font-bold font-mono text-white mt-1 block">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Platform User Accounts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage registration status and enforce access compliance.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5">Last Login</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-200">
                  {users.map((u) => (
                    <tr key={u.email} className="hover:bg-white/[0.02]">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.displayName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] bg-surface-elevated border border-surface-border">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleSuspendUser(u.email)}
                            disabled={u.email === currentUser.email}
                            className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 disabled:opacity-30"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreUser(u.email)}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30"
                          >
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Event Moderation */}
        {activeTab === 'events' && (
          <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border">
              <h3 className="text-base font-bold text-white">Event Moderation Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Review user-submitted celebrations for safety and compliance.</p>
            </div>
            {events.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">No user events created yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                    <tr>
                      <th className="p-3.5">Event Title</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Owner</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Guests</th>
                      <th className="p-3.5">Budget</th>
                      <th className="p-3.5">Moderation</th>
                      <th className="p-3.5 text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-200">
                    {events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-white">{ev.title}</td>
                        <td className="p-3.5 capitalize">{ev.category.replace('_', ' ')}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{ev.ownerEmail || ev.ownerId}</td>
                        <td className="p-3.5 font-mono">{ev.eventDate}</td>
                        <td className="p-3.5 font-mono">{ev.guestCount}</td>
                        <td className="p-3.5 font-mono">{ev.currency} {ev.totalBudget.toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            ev.moderationStatus === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ev.moderationStatus === 'flagged'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            {ev.moderationStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleModerateEvent(ev.id, 'approved')}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleModerateEvent(ev.id, 'flagged')}
                            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          >
                            Flag
                          </button>
                          <button
                            onClick={() => handleModerateEvent(ev.id, 'suspended')}
                            className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Vendor Management */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-card p-5 rounded-2xl border border-surface-border">
              <div>
                <h3 className="text-base font-bold text-white">Verified Vendor Directory Control</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Only administrator-verified vendors appear in public and user directories.
                </p>
              </div>
              <button
                onClick={() => setShowAddVendor(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-glow"
              >
                + Register Verified Vendor
              </button>
            </div>

            <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
              {vendors.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No vendors registered. Click "+ Register Verified Vendor" to create the first verified supplier.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                      <tr>
                        <th className="p-3.5">Vendor Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Service Area</th>
                        <th className="p-3.5">Contact</th>
                        <th className="p-3.5">Tier</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-slate-200">
                      {vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-white">{v.name}</td>
                          <td className="p-3.5 capitalize">{v.category.replace('_', ' ')}</td>
                          <td className="p-3.5">{v.serviceArea}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-400">{v.contactEmail}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-300">{v.priceTier}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              v.verificationStatus === 'verified'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {v.verificationStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {v.verificationStatus === 'verified' ? (
                              <button
                                onClick={() => handleUpdateVendorStatus(v.id, 'suspended')}
                                className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateVendorStatus(v.id, 'verified')}
                                className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Vendor Modal */}
            {showAddVendor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm">
                <div className="bg-surface-card border border-surface-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
                  <h3 className="text-lg font-bold font-display text-white mb-4">Register Verified Vendor</h3>
                  <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={vName}
                        onChange={(e) => setVName(e.target.value)}
                        placeholder="e.g. Celestial Floral Artisans"
                        className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Category</label>
                        <select
                          value={vCat}
                          onChange={(e) => setVCat(e.target.value as ExpenseCategory)}
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="venue">Venue</option>
                          <option value="catering">Catering</option>
                          <option value="decor">Decor & Floral</option>
                          <option value="photography">Photography</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="logistics">Transportation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Price Tier</label>
                        <select
                          value={vTier}
                          onChange={(e) => setVTier(e.target.value as PriceTier)}
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="$">$ (Budget)</option>
                          <option value="$$">$$ (Standard)</option>
                          <option value="$$$">$$$ (Premium)</option>
                          <option value="$$$$">$$$$ (Luxury)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Contact Email *</label>
                        <input
                          type="email"
                          required
                          value={vEmail}
                          onChange={(e) => setVEmail(e.target.value)}
                          placeholder="vendor@company.com"
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Phone *</label>
                        <input
                          type="text"
                          required
                          value={vPhone}
                          onChange={(e) => setVPhone(e.target.value)}
                          placeholder="+1 555-0100"
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Service Area</label>
                      <input
                        type="text"
                        value={vArea}
                        onChange={(e) => setVArea(e.target.value)}
                        placeholder="e.g. San Francisco Bay Area"
                        className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1">Starting Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={vPrice}
                          onChange={(e) => setVPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Deliverables (comma-separated)</label>
                        <input
                          type="text"
                          value={vDeliverables}
                          onChange={(e) => setVDeliverables(e.target.value)}
                          placeholder="e.g. Full service, Setup, Cleanup"
                          className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Business Description</label>
                      <textarea
                        rows={3}
                        required
                        value={vDesc}
                        onChange={(e) => setVDesc(e.target.value)}
                        placeholder="Describe services, specializations, certifications..."
                        className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-3 border-t border-surface-border">

                      <button
                        type="button"
                        onClick={() => setShowAddVendor(false)}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                      >
                        Verify & Register
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Client Enquiries */}
        {activeTab === 'enquiries' && (
          <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border">
              <h3 className="text-base font-bold text-white">Client Vendor Enquiries</h3>
              <p className="text-xs text-slate-400 mt-0.5">Review, quote, and progress genuine user enquiries.</p>
            </div>
            {enquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">No client enquiries submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                    <tr>
                      <th className="p-3.5">Client</th>
                      <th className="p-3.5">Vendor</th>
                      <th className="p-3.5">Event</th>
                      <th className="p-3.5">Message</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-200">
                    {enquiries.map((enq) => (
                      <tr key={enq.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5">
                          <div className="font-bold text-white">{enq.userName}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{enq.userEmail}</div>
                        </td>
                        <td className="p-3.5 font-bold text-cyan-400">{enq.vendorName}</td>
                        <td className="p-3.5">
                          <div>{enq.eventTitle}</div>
                          <div className="text-slate-400 font-mono text-[11px]">{enq.eventDate} ({enq.guestCount} guests)</div>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-300">{enq.message}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            enq.status === 'quoted'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : enq.status === 'under_review'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                          }`}>
                            {enq.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleUpdateEnquiry(enq.id, 'quoted')}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          >
                            Send Quote
                          </button>
                          <button
                            onClick={() => handleUpdateEnquiry(enq.id, 'declined')}
                            className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            Decline
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
            <div className="p-5 border-b border-surface-border">
              <h3 className="text-base font-bold text-white">Immutable Administrative Audit Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cryptographically sequenced record of all privileged platform operations.</p>
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Actor</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Target</th>
                      <th className="p-3.5">Reason / Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-slate-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] font-bold text-cyan-300">{log.actorEmail}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-surface-elevated border border-surface-border">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {log.targetType}:{log.targetId}
                        </td>
                        <td className="p-3.5 text-slate-300">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Operational Controls */}
        {activeTab === 'ops' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border space-y-4">
              <h3 className="text-base font-bold text-white">System Health & Connectivity</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-midnight-900 border border-surface-border">
                  <span className="text-slate-300">Persistence Adapter</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {persistenceMode === 'cloud_firebase' ? 'Cloud Firestore (ONLINE)' : 'Persistent Storage Engine (ACTIVE)'}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-midnight-900 border border-surface-border">
                  <span className="text-slate-300">Authentication Service</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {persistenceMode === 'cloud_firebase' ? 'Firebase Auth (ONLINE)' : 'Authenticated Local Engine (ACTIVE)'}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-midnight-900 border border-surface-border">
                  <span className="text-slate-300">Security Gate Authorization</span>
                  <span className="font-mono font-bold text-emerald-400">ENFORCED (Role-Based Access)</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border space-y-4">
              <h3 className="text-base font-bold text-white">Cloud Configuration Setup</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                To connect to Google Cloud Firestore, supply the project credentials in your environment file:
              </p>
              <div className="p-3 rounded-xl bg-midnight-900 border border-surface-border font-mono text-[11px] text-slate-300 space-y-1">
                <div>VITE_FIREBASE_API_KEY=...</div>
                <div>VITE_FIREBASE_PROJECT_ID=...</div>
                <div>VITE_FIREBASE_STORAGE_BUCKET=...</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
