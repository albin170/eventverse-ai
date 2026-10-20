import React, { useState } from 'react';
import { VendorProfile, VendorEnquiry, EventRecord } from '@/types';
import { formatCurrency } from '@/features/budget/engine';

interface VendorDirectoryProps {
  vendors: VendorProfile[];
  userEnquiries: VendorEnquiry[];
  activeEvent: EventRecord | null;
  onSubmitEnquiry: (enquiry: {
    vendorId: string;
    vendorName: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    guestCount: number;
    estimatedBudget: number;
    message: string;
  }) => Promise<void>;
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({
  vendors,
  userEnquiries,
  activeEvent,
  onSubmitEnquiry,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [enquiryVendor, setEnquiryVendor] = useState<VendorProfile | null>(null);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'directory' | 'my_enquiries'>('directory');

  const filteredVendors = vendors.filter((v) => {
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory;
    const matchesTier = selectedPriceTier === 'all' || v.priceTier === selectedPriceTier;
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.serviceArea.toLowerCase().includes(search.toLowerCase()) ||
      v.businessDescription.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesTier && matchesSearch;
  });

  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryVendor || !activeEvent) return;

    setSubmitting(true);
    try {
      await onSubmitEnquiry({
        vendorId: enquiryVendor.id,
        vendorName: enquiryVendor.name,
        eventId: activeEvent.id,
        eventTitle: activeEvent.title,
        eventDate: activeEvent.eventDate,
        guestCount: activeEvent.guestCount,
        estimatedBudget: enquiryVendor.startingPrice,
        message: enquiryMessage.trim() || 'Requesting quotation and availability for our event.',
      });
      setEnquiryVendor(null);
      setEnquiryMessage('');
      setActiveTab('my_enquiries');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-surface-border">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Verified Directory ({vendors.length})
        </button>
        <button
          onClick={() => setActiveTab('my_enquiries')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'my_enquiries'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Submitted Enquiries ({userEnquiries.length})
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-card p-4 rounded-xl border border-surface-border">
            <div>
              <input
                type="text"
                placeholder="Search vendor name, service area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-midnight-900 border border-surface-border text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter vendors by category"
                className="w-full px-3 py-1.5 rounded-lg bg-midnight-900 border border-surface-border text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Service Categories</option>
                <option value="venue">Venue Spaces</option>
                <option value="catering">Catering & Menus</option>
                <option value="decor">Decor & Floral</option>
                <option value="photography">Photography & Cinematography</option>
                <option value="entertainment">Entertainment & Live Music</option>
                <option value="logistics">Transportation & Logistics</option>
              </select>
            </div>
            <div>
              <select
                value={selectedPriceTier}
                onChange={(e) => setSelectedPriceTier(e.target.value)}
                aria-label="Filter vendors by price tier"
                className="w-full px-3 py-1.5 rounded-lg bg-midnight-900 border border-surface-border text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Price Tiers</option>
                <option value="$">$ (Budget-Friendly)</option>
                <option value="$$">$$ (Standard)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Luxury)</option>
              </select>
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center text-slate-400">
              <span className="text-3xl mb-3 block">🏢</span>
              <h3 className="text-base font-bold text-white mb-1">No Verified Vendors Listed</h3>
              <p className="text-xs max-w-md mx-auto">
                {vendors.length === 0
                  ? 'The platform directory currently has no verified vendors. Administrators can register verified vendor profiles in the Admin Console.'
                  : 'No vendors match your current search and filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-surface-card rounded-2xl border border-surface-border p-5 flex flex-col justify-between hover:border-violet-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-base font-bold text-white">{vendor.name}</h4>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Verified
                          </span>
                        </div>
                        <span className="text-xs text-violet-400 font-medium capitalize">
                          {vendor.category.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300 px-2 py-0.5 rounded bg-midnight-900 border border-surface-border">
                        {vendor.priceTier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {vendor.businessDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-surface-border space-y-1.5 text-[11px] text-slate-400">
                      <div><strong className="text-slate-300">Service Area:</strong> {vendor.serviceArea}</div>
                      <div><strong className="text-slate-300">Contact:</strong> {vendor.contactEmail}</div>
                      <div><strong className="text-slate-300">Starting From:</strong> {formatCurrency(vendor.startingPrice)}</div>
                    </div>

                    {vendor.deliverables.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {vendor.deliverables.map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-surface-border">
                    <button
                      onClick={() => setEnquiryVendor(vendor)}
                      disabled={!activeEvent}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-glow transition-all disabled:opacity-50"
                    >
                      {activeEvent ? 'Send Formal Enquiry' : 'Select an Event First'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Enquiries List */
        <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden">
          {userEnquiries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              You have not submitted any enquiries yet. Browse the verified directory and click "Send Formal Enquiry" to request quotations.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-midnight-900 text-slate-400 border-b border-surface-border font-semibold">
                  <tr>
                    <th className="p-3.5">Vendor</th>
                    <th className="p-3.5">Event</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Guests</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Admin Response</th>
                    <th className="p-3.5 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-slate-200">
                  {userEnquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-white/[0.02]">
                      <td className="p-3.5 font-bold text-white">{enq.vendorName}</td>
                      <td className="p-3.5">{enq.eventTitle}</td>
                      <td className="p-3.5 font-mono">{enq.eventDate}</td>
                      <td className="p-3.5 font-mono">{enq.guestCount}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            enq.status === 'quoted'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : enq.status === 'under_review'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : enq.status === 'declined'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                          }`}
                        >
                          {enq.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 italic">
                        {enq.adminNotes || 'Pending vendor/admin review'}
                      </td>
                      <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">
                        {new Date(enq.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enquiry Submission Modal */}
      {enquiryVendor && activeEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-950/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold font-display text-white mb-2">
              Send Enquiry to {enquiryVendor.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Your inquiry will be logged directly in the platform and routed to the vendor coordinator.
            </p>

            <form onSubmit={handleSendEnquiry} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-midnight-900 border border-surface-border space-y-1 text-slate-300">
                <div><strong>Event:</strong> {activeEvent.title}</div>
                <div><strong>Event Date:</strong> {activeEvent.eventDate}</div>
                <div><strong>Guest Count:</strong> {activeEvent.guestCount} Attendees</div>
                <div><strong>Category:</strong> {enquiryVendor.category}</div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Detailed Requirements / Questions
                </label>
                <textarea
                  rows={4}
                  required
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  placeholder="Specify particular dietary, stylistic, timing, or deliverable requests..."
                  className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setEnquiryVendor(null)}
                  className="px-4 py-2 rounded-lg text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-glow disabled:opacity-50"
                >
                  {submitting ? 'Transmitting...' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
