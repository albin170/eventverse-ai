import React, { useState } from 'react';
import { GuestRecord, RsvpStatus, GuestCategory } from '@/types';
import { sanitizeSpreadsheetCell } from '@/lib/sanitizer';

interface GuestManagementProps {
  eventId: string;
  guests: GuestRecord[];
  onAddGuest: (guest: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>) => Promise<void>;
  onUpdateGuest: (guest: GuestRecord) => Promise<void>;
  onDeleteGuest: (guestId: string) => Promise<void>;
  onBulkImport: (imported: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>[]) => Promise<void>;
}

export const GuestManagement: React.FC<GuestManagementProps> = ({
  eventId,
  guests,
  onAddGuest,
  onUpdateGuest,
  onDeleteGuest,
  onBulkImport,
}) => {
  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New guest form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [category, setCategory] = useState<GuestCategory>('general');
  const [dietary, setDietary] = useState('Standard');
  const [seatingGroup, setSeatingGroup] = useState('Table 1');
  const [plusOnes, setPlusOnes] = useState(0);

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      (g.seatingGroup && g.seatingGroup.toLowerCase().includes(search.toLowerCase()));
    const matchesRsvp = filterRsvp === 'all' || g.rsvpStatus === filterRsvp;
    return matchesSearch && matchesRsvp;
  });

  const attendingCount = guests.filter((g) => g.rsvpStatus === 'attending').length;
  const totalHeadcount = guests.reduce(
    (acc, g) => (g.rsvpStatus === 'attending' ? acc + 1 + (g.plusOnes || 0) : acc),
    0
  );
  const pendingCount = guests.filter((g) => g.rsvpStatus === 'pending').length;
  const declinedCount = guests.filter((g) => g.rsvpStatus === 'declined').length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddGuest({
      eventId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      rsvpStatus,
      category,
      dietaryRequirements: dietary,
      seatingGroup,
      plusOnes,
    });

    setName('');
    setEmail('');
    setPhone('');
    setDietary('Standard');
    setPlusOnes(0);
    setShowAddModal(false);
  };

  const exportGuestsCsv = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'RSVP Status',
      'Category',
      'Dietary Requirements',
      'Seating Group',
      'Plus Ones',
    ];
    const rows = guests.map((g) => [
      sanitizeSpreadsheetCell(g.name),
      sanitizeSpreadsheetCell(g.email),
      sanitizeSpreadsheetCell(g.phone || ''),
      sanitizeSpreadsheetCell(g.rsvpStatus),
      sanitizeSpreadsheetCell(g.category),
      sanitizeSpreadsheetCell(g.dietaryRequirements),
      sanitizeSpreadsheetCell(g.seatingGroup || ''),
      g.plusOnes.toString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_guests_${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const newGuests: Omit<GuestRecord, 'id' | 'ownerId' | 'invitedAt'>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts[0]) {
          newGuests.push({
            eventId,
            name: parts[0],
            email: parts[1] || '',
            phone: parts[2] || undefined,
            rsvpStatus: (parts[3] as RsvpStatus) || 'pending',
            category: (parts[4] as GuestCategory) || 'general',
            dietaryRequirements: parts[5] || 'Standard',
            seatingGroup: parts[6] || 'Table 1',
            plusOnes: parseInt(parts[7], 10) || 0,
          });
        }
      }

      if (newGuests.length > 0) {
        await onBulkImport(newGuests);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* KPI Tally Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Guests Registered</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{guests.length}</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
          <span className="text-xs text-slate-400 uppercase font-semibold">Confirmed Attending</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {attendingCount} <span className="text-xs text-slate-400 font-normal">({totalHeadcount} with +1s)</span>
          </span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
          <span className="text-xs text-slate-400 uppercase font-semibold">RSVP Pending</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl border border-surface-border">
          <span className="text-xs text-slate-400 uppercase font-semibold">Declined</span>
          <span className="text-2xl font-bold font-mono text-slate-400 mt-1 block">{declinedCount}</span>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-card p-4 rounded-xl border border-surface-border">
        <div className="flex flex-1 w-full sm:w-auto items-center space-x-3">
          <input
            type="text"
            placeholder="Search by name, email, table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-midnight-900 border border-surface-border text-white text-xs focus:outline-none focus:border-violet-500"
          />
          <select
            value={filterRsvp}
            onChange={(e) => setFilterRsvp(e.target.value)}
            aria-label="Filter guests by RSVP status"
            className="px-3 py-1.5 rounded-lg bg-midnight-900 border border-surface-border text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="all">All RSVP States</option>
            <option value="attending">Attending</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
            <option value="tentative">Tentative</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <label
            htmlFor="guest-csv-upload-input"
            className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-slate-200 text-xs font-medium cursor-pointer border border-surface-border"
          >
            Import CSV
            <input
              id="guest-csv-upload-input"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={exportGuestsCsv}
            className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-slate-200 text-xs font-medium border border-surface-border"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-glow"
          >
            + Add Guest
          </button>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {guests.length === 0
              ? 'No guests registered yet. Click "+ Add Guest" or import a CSV file to populate your guest list.'
              : 'No guests match the current search or RSVP filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                <tr>
                  <th scope="col" className="p-3.5">Guest Name</th>
                  <th scope="col" className="p-3.5">Contact</th>
                  <th scope="col" className="p-3.5">RSVP Status</th>
                  <th scope="col" className="p-3.5">Category</th>
                  <th scope="col" className="p-3.5">Dietary</th>
                  <th scope="col" className="p-3.5">Seating Group</th>
                  <th scope="col" className="p-3.5">+1s</th>
                  <th scope="col" className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-200">
                {filteredGuests.map((g) => (
                  <tr key={g.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-medium text-white">{g.name}</td>
                    <td className="p-3.5 text-slate-400">{g.email || g.phone || '—'}</td>
                    <td className="p-3.5">
                      <select
                        value={g.rsvpStatus}
                        onChange={(e) =>
                          onUpdateGuest({ ...g, rsvpStatus: e.target.value as RsvpStatus })
                        }
                        aria-label={`RSVP status for ${g.name}`}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold bg-midnight-900 border ${
                          g.rsvpStatus === 'attending'
                            ? 'text-emerald-400 border-emerald-500/30'
                            : g.rsvpStatus === 'pending'
                            ? 'text-amber-400 border-amber-500/30'
                            : 'text-slate-400 border-surface-border'
                        }`}
                      >
                        <option value="attending">Attending</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                        <option value="tentative">Tentative</option>
                      </select>
                    </td>
                    <td className="p-3.5 capitalize">{g.category}</td>
                    <td className="p-3.5 text-slate-300">{g.dietaryRequirements}</td>
                    <td className="p-3.5 text-slate-300">{g.seatingGroup || 'Unassigned'}</td>
                    <td className="p-3.5 font-mono">{g.plusOnes}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onDeleteGuest(g.id)}
                        className="text-red-400 hover:text-red-300 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold font-display text-white mb-4">Add Guest to Event</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label htmlFor="guest-full-name" className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  id="guest-full-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-email-address" className="block text-slate-300 mb-1">Email</label>
                  <input
                    id="guest-email-address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label htmlFor="guest-phone-number" className="block text-slate-300 mb-1">Phone</label>
                  <input
                    id="guest-phone-number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-category-select" className="block text-slate-300 mb-1">Category</label>
                  <select
                    id="guest-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GuestCategory)}
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="general">General</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="colleagues">Colleagues</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="guest-rsvp-status-select" className="block text-slate-300 mb-1">RSVP Status</label>
                  <select
                    id="guest-rsvp-status-select"
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                    <option value="tentative">Tentative</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="guest-dietary-input" className="block text-slate-300 mb-1">Dietary Requirements</label>
                  <input
                    id="guest-dietary-input"
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="e.g. Vegetarian, Nut Allergy"
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label htmlFor="guest-seating-group-input" className="block text-slate-300 mb-1">Seating Group / Table</label>
                  <input
                    id="guest-seating-group-input"
                    type="text"
                    value={seatingGroup}
                    onChange={(e) => setSeatingGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="guest-plus-ones-input" className="block text-slate-300 mb-1">Plus-Ones Count ({plusOnes})</label>
                <input
                  id="guest-plus-ones-input"
                  type="number"
                  min="0"
                  max="10"
                  value={plusOnes}
                  onChange={(e) => setPlusOnes(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
