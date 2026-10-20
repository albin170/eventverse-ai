import React, { useState } from 'react';
import { Vendor, ExpenseCategory, CurrencyCode } from '@/types';
import {
  SearchIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
} from '@/components/icons';

interface VendorManagementProps {
  vendors: Vendor[];
  currency: CurrencyCode;
  onUpdateVendors: (updated: Vendor[]) => void;
}

export const VendorManagement: React.FC<VendorManagementProps> = ({
  vendors,
  currency,
  onUpdateVendors,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>('all');
  const [onlyShortlisted, setOnlyShortlisted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // New vendor form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('venue');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState<Vendor['priceRange']>('$$');
  const [startingPrice, setStartingPrice] = useState('2000');
  const [notes, setNotes] = useState('');

  // Toggle shortlist status
  const toggleShortlist = (id: string) => {
    const updated = vendors.map((v) =>
      v.id === id ? { ...v, isShortlisted: !v.isShortlisted } : v
    );
    onUpdateVendors(updated);
  };

  // Update enquiry status
  const updateEnquiryStatus = (id: string, status: Vendor['enquiryStatus']) => {
    const updated = vendors.map((v) => (v.id === id ? { ...v, enquiryStatus: status } : v));
    onUpdateVendors(updated);
  };

  // Delete vendor
  const handleDelete = (id: string) => {
    onUpdateVendors(vendors.filter((v) => v.id !== id));
  };

  // Add vendor
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVendor: Vendor = {
      id: `vendor-custom-${Date.now()}`,
      name: name.trim(),
      category,
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      priceRange,
      estimatedStartingPrice: parseFloat(startingPrice) || 0,
      notes: notes.trim(),
      isShortlisted: true,
      enquiryStatus: 'not_contacted',
      isDemoSample: false,
    };

    onUpdateVendors([...vendors, newVendor]);
    setName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setLocation('');
    setNotes('');
    setShowAddModal(false);
  };

  // Filter logic
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesPrice = selectedPriceTier === 'all' || v.priceRange === selectedPriceTier;
    const matchesShortlist = !onlyShortlisted || v.isShortlisted;

    return matchesSearch && matchesCategory && matchesPrice && matchesShortlist;
  });

  const shortlistedCount = vendors.filter((v) => v.isShortlisted).length;

  return (
    <div className="space-y-6">
      {/* Header & Shortlist Summary */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-violet-400"></span>
              <h3 className="text-xl font-bold font-display text-white">
                Vendor Directory & Selection Criteria
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Curate, compare, and manage supplier status. Clearly distinguishes sample profiles from contracted partners.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {shortlistedCount > 1 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="px-3.5 py-2 bg-midnight-900 hover:bg-midnight-800 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all"
              >
                Compare Shortlist ({shortlistedCount})
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all"
            >
              <PlusIcon size={14} />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative sm:col-span-1">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              aria-label="Search vendors by name or location"
              placeholder="Search vendors or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              aria-label="Filter by service category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-400"
            >
              <option value="all">All Service Categories</option>
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="decor">Decor & Floral</option>
              <option value="entertainment">Music & Entertainment</option>
              <option value="photography">Photography & Cinema</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <select
              aria-label="Filter by price tier"
              value={selectedPriceTier}
              onChange={(e) => setSelectedPriceTier(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-400"
            >
              <option value="all">All Price Tiers</option>
              <option value="$">$ (Budget friendly)</option>
              <option value="$$">$$ (Moderate standard)</option>
              <option value="$$$">$$$ (Premium tier)</option>
              <option value="$$$$">$$$$ (Ultra luxury)</option>
            </select>
          </div>

          {/* Shortlisted Only toggle */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={onlyShortlisted}
                onChange={(e) => setOnlyShortlisted(e.target.checked)}
                className="rounded bg-midnight-900 border-white/20 text-violet-600 focus:ring-violet-500"
              />
              <span>Shortlisted Only ({shortlistedCount})</span>
            </label>
          </div>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className={`bg-surface-card rounded-2xl border transition-all p-5 flex flex-col justify-between ${
              vendor.isShortlisted
                ? 'border-violet-500/40 shadow-glow'
                : 'border-surface-border'
            }`}
          >
            <div>
              {/* Header: Name, Category, Shortlist toggle */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{vendor.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-full">
                      {vendor.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {vendor.priceRange}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleShortlist(vendor.id)}
                  className={`p-2 rounded-xl text-xs font-medium transition-all ${
                    vendor.isShortlisted
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                  aria-label={
                    vendor.isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'
                  }
                  title={vendor.isShortlisted ? 'Shortlisted' : 'Click to Shortlist'}
                >
                  <CheckIcon size={14} />
                </button>
              </div>

              {/* Sample indicator */}
              <div className="mt-2 text-[10px]">
                {vendor.isDemoSample ? (
                  <span className="text-amber-400/90 bg-amber-950/30 border border-amber-900/50 px-2 py-0.5 rounded">
                    DEMO Profile (Sample data for evaluation)
                  </span>
                ) : (
                  <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-0.5 rounded">
                    Custom Supplier Profile
                  </span>
                )}
              </div>

              {/* Details & Notes */}
              <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                {vendor.notes || 'No specific provider notes recorded.'}
              </p>

              {/* Contact Information */}
              <div className="mt-3 pt-3 border-t border-white/5 text-[11px] space-y-1 text-slate-300">
                <div>
                  <span className="text-slate-500">Contact:</span>{' '}
                  {vendor.contactName || 'General Desk'}
                </div>
                {vendor.email && (
                  <div className="truncate">
                    <span className="text-slate-500">Email:</span> {vendor.email}
                  </div>
                )}
                {vendor.phone && (
                  <div>
                    <span className="text-slate-500">Phone:</span> {vendor.phone}
                  </div>
                )}
                {vendor.location && (
                  <div>
                    <span className="text-slate-500">Area:</span> {vendor.location}
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Starting Price:</span>{' '}
                  <strong className="text-white">
                    {currency} {vendor.estimatedStartingPrice.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer: Enquiry Status Selector & Delete */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-400">Status:</span>
                <select
                  aria-label={`Enquiry status for ${vendor.name}`}
                  value={vendor.enquiryStatus}
                  onChange={(e) =>
                    updateEnquiryStatus(
                      vendor.id,
                      e.target.value as Vendor['enquiryStatus']
                    )
                  }
                  className={`text-[11px] rounded-lg px-2 py-1 font-semibold focus:outline-none border ${
                    vendor.enquiryStatus === 'booked'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : vendor.enquiryStatus === 'quoted'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                        : vendor.enquiryStatus === 'contacted'
                          ? 'bg-violet-950/80 text-violet-300 border-violet-700'
                          : 'bg-midnight-900 text-slate-400 border-white/10'
                  }`}
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="booked">Booked (Confirmed)</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(vendor.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Remove vendor"
              >
                <TrashIcon size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredVendors.length === 0 && (
          <div className="col-span-full bg-surface-card rounded-2xl border border-surface-border p-8 text-center text-slate-400 text-xs">
            No suppliers match the current search filters.
          </div>
        )}
      </div>

      {/* Modal: Add Custom Vendor */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vendor-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 id="add-vendor-title" className="text-lg font-bold text-white mb-4">
              Register Event Supplier
            </h3>
            <form onSubmit={handleAddVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Supplier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luminary Stage & Lighting Co."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="decor">Decor & Design</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="photography">Photography</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Price Tier</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value as Vendor['priceRange'])}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="$">$ (Budget)</option>
                    <option value="$$">$$ (Moderate)</option>
                    <option value="$$$">$$$ (Premium)</option>
                    <option value="$$$$">$$$$ (Luxury)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Estimated Starting</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2500"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@company.example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Notes & Terms</label>
                <textarea
                  rows={2}
                  placeholder="Inclusions, insurance policies, cancellation terms"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-midnight-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-glow transition-all"
                >
                  Add to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Comparison Matrix for Shortlisted Vendors */}
      {showComparisonModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-4xl w-full p-6 shadow-2xl">
            <h3 id="compare-modal-title" className="text-lg font-bold text-white mb-2">
              Shortlisted Supplier Comparative Matrix
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Evaluate your selected suppliers side-by-side on price, status, and terms.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-midnight-900/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Supplier
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Price Tier
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Est. Base ({currency})
                    </th>
                    <th scope="col" className="px-3 py-3">
                      Enquiry Status
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Key Highlights
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {vendors
                    .filter((v) => v.isShortlisted)
                    .map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-3 font-semibold text-white">{v.name}</td>
                        <td className="px-3 py-3 capitalize">{v.category}</td>
                        <td className="px-3 py-3 font-mono font-bold text-cyan-400">
                          {v.priceRange}
                        </td>
                        <td className="px-3 py-3">
                          {currency} {v.estimatedStartingPrice.toLocaleString()}
                        </td>
                        <td className="px-3 py-3">
                          <span className="capitalize font-medium text-violet-300">
                            {v.enquiryStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px] max-w-xs">
                          {v.notes || 'Standard agreement'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 mt-4">
              <button
                type="button"
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
