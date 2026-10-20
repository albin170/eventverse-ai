import React, { useState } from 'react';
import { CurrencyCode, EventCategory, EventRecord, BudgetItem, TimelineTask } from '@/types';

interface EventCreationWizardProps {

  onEventCreated: (
    event: Omit<EventRecord, 'id' | 'ownerId' | 'status' | 'moderationStatus' | 'createdAt' | 'updatedAt'>,
    initialExpenses: Omit<BudgetItem, 'id' | 'ownerId' | 'eventId'>[],
    initialTasks: Omit<TimelineTask, 'id' | 'ownerId' | 'eventId'>[]
  ) => Promise<void>;
  onCancel: () => void;
}

const EVENT_CATEGORIES: Array<{ id: EventCategory; label: string; icon: string; desc: string }> = [
  { id: 'wedding', label: 'Wedding Celebration', icon: '💍', desc: 'Ceremony, banquet dinner, party, and guest lodging' },
  { id: 'birthday', label: 'Milestone Birthday', icon: '🎂', desc: 'Bespoke themes, dynamic entertainment, and catering' },
  { id: 'anniversary', label: 'Anniversary Jubilee', icon: '✨', desc: 'Intimate fine dining, memory showcases, and live music' },
  { id: 'college_fest', label: 'College / University Fest', icon: '🎓', desc: 'Multi-stage sound, student crowds, logistics & security' },
  { id: 'corporate', label: 'Corporate Gala / Conf', icon: '🏢', desc: 'Executive meetings, keynotes, catering & AV equipment' },
  { id: 'community', label: 'Community Gathering', icon: '🤝', desc: 'Inclusive public spaces, family activities, and local food' },
  { id: 'custom', label: 'Custom Special Event', icon: '🌟', desc: 'Tailor every dimension from scratch' },
];

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

export const EventCreationWizard: React.FC<EventCreationWizardProps> = ({
  onEventCreated,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('wedding');
  const [eventDate, setEventDate] = useState('2026-11-20');
  const [eventTime, setEventTime] = useState('17:00');
  const [location, setLocation] = useState('Metropolitan Hall, San Francisco');
  const [guestCount, setGuestCount] = useState<number>(120);
  const [totalBudget, setTotalBudget] = useState<number>(35000);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [contingencyPercentage, setContingencyPercentage] = useState<number>(10);
  const [theme, setTheme] = useState('Celestial Twilight Elegance');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [secondaryColor, setSecondaryColor] = useState('#06B6D4');
  const [cateringPreferences, setCateringPreferences] = useState('Plated multi-course dinner with vegetarian option');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState<string[]>([
    'Wheelchair ramp',
    'Elevator access',
  ]);
  const [notes, setNotes] = useState('Prioritize acoustic clarity and ambient lighting.');

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!title.trim() || title.length < 2) {
        errs.title = 'Title must be at least 2 characters.';
      }
      if (!location.trim()) {
        errs.location = 'Location or venue name is required.';
      }
      if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        errs.eventDate = 'Valid date required (YYYY-MM-DD).';
      }
    } else if (currentStep === 2) {
      if (guestCount < 1) errs.guestCount = 'At least 1 guest required.';
      if (totalBudget <= 0) errs.totalBudget = 'Total budget must be greater than zero.';
    } else if (currentStep === 3) {
      if (!theme.trim()) errs.theme = 'Theme description is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinalSubmit = async () => {
    if (!validateStep(step)) return;

    setSubmitting(true);
    try {
      const initialExpenses: Omit<BudgetItem, 'id' | 'ownerId' | 'eventId'>[] = [
        {
          name: 'Main Venue Reservation',
          category: 'venue',
          estimatedCost: Math.round(totalBudget * 0.35),
          actualCost: 0,
          paidAmount: 0,
          paymentStatus: 'unpaid',
          isPerPerson: false,
          priority: 'must_have',
          confirmed: false,
          notes: 'Standard rental deposit required upon booking',
        },
        {
          name: 'Catering & Beverages',
          category: 'catering',
          estimatedCost: Math.round(totalBudget * 0.30),
          actualCost: 0,
          paidAmount: 0,
          paymentStatus: 'unpaid',
          isPerPerson: true,
          unitCost: Math.round((totalBudget * 0.30) / Math.max(1, guestCount)),
          priority: 'must_have',
          confirmed: false,
        },
        {
          name: 'Floral & Atmospheric Decor',
          category: 'decor',
          estimatedCost: Math.round(totalBudget * 0.15),
          actualCost: 0,
          paidAmount: 0,
          paymentStatus: 'unpaid',
          isPerPerson: false,
          priority: 'nice_to_have',
          confirmed: false,
        },
        {
          name: 'Photography & Media',
          category: 'photography',
          estimatedCost: Math.round(totalBudget * 0.10),
          actualCost: 0,
          paidAmount: 0,
          paymentStatus: 'unpaid',
          isPerPerson: false,
          priority: 'must_have',
          confirmed: false,
        },
      ];

      const initialTasks: Omit<TimelineTask, 'id' | 'ownerId' | 'eventId'>[] = [
        {
          title: 'Confirm Venue Contract & Deposit',
          description: 'Review agreement terms and schedule deposit transfer.',
          dueDate: eventDate,
          daysBeforeEvent: 90,
          priority: 'urgent',
          status: 'todo',
          category: 'venue',
          dependencies: [],
          responsiblePerson: 'Lead Planner',
          completionPercentage: 0,
        },
        {
          title: 'Finalize Menu Selections & Dietary Headcount',
          description: 'Select appetizers, main courses, and register allergy profiles.',
          dueDate: eventDate,
          daysBeforeEvent: 45,
          priority: 'high',
          status: 'todo',
          category: 'catering',
          dependencies: [],
          responsiblePerson: 'Host',
          completionPercentage: 0,
        },
        {
          title: 'Send Formal Invitations',
          description: 'Transmit RSVP invitations and track attendee responses.',
          dueDate: eventDate,
          daysBeforeEvent: 60,
          priority: 'high',
          status: 'todo',
          category: 'stationery',
          dependencies: [],
          responsiblePerson: 'Host',
          completionPercentage: 0,
        },
      ];

      await onEventCreated(
        {
          title: title.trim(),
          category,
          eventDate,
          eventTime,
          location: location.trim(),
          guestCount,
          totalBudget,
          currency,
          contingencyPercentage,
          theme: theme.trim(),
          colorPalette: [primaryColor, secondaryColor],
          cateringPreferences,
          accessibilityRequirements,
          notes,
          priorityPreferences: ['Quality Catering', 'Punctual Schedule'],
        },
        initialExpenses,
        initialTasks
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 sm:p-8 shadow-card max-w-4xl mx-auto">
      {/* Header and Step Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-surface-border gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <h2 className="text-xl font-bold font-display text-white">Create New Event</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {step} of 4: {step === 1 ? 'Event Fundamentals' : step === 2 ? 'Headcount & Financial Allocation' : step === 3 ? 'Aesthetics & Accessibility' : 'Summary & Creation'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-all ${
                step === s
                  ? 'bg-violet-600 text-white shadow-glow'
                  : step > s
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-midnight-900 text-slate-500 border border-surface-border'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="py-6 space-y-5 text-xs">
          <div>
            <label htmlFor="wizard-event-title" className="block text-slate-300 font-semibold mb-1">
              Event Title *
            </label>
            <input
              id="wizard-event-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elena & Marcus: Redwood Forest Wedding"
              className="w-full px-4 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:outline-none focus:border-violet-500"
            />
            {errors.title && <p className="text-red-400 text-[11px] mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Event Category *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    category === cat.id
                      ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                      : 'bg-midnight-900 border-surface-border text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span className="font-bold block text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="wizard-event-date" className="block text-slate-300 font-semibold mb-1">Event Date *</label>
              <input
                id="wizard-event-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
              />
              {errors.eventDate && <p className="text-red-400 text-[11px] mt-1">{errors.eventDate}</p>}
            </div>
            <div>
              <label htmlFor="wizard-event-time" className="block text-slate-300 font-semibold mb-1">Start Time</label>
              <input
                id="wizard-event-time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label htmlFor="wizard-event-location" className="block text-slate-300 font-semibold mb-1">Venue / Location *</label>
              <input
                id="wizard-event-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Hall, or Venue Name"
                className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
              />
              {errors.location && <p className="text-red-400 text-[11px] mt-1">{errors.location}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Headcount & Budget */}
      {step === 2 && (
        <div className="py-6 space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-guest-count" className="block text-slate-300 font-semibold mb-1">Expected Guest Count *</label>
              <input
                id="wizard-guest-count"
                type="number"
                min="1"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:outline-none focus:border-violet-500"
              />
              {errors.guestCount && <p className="text-red-400 text-[11px] mt-1">{errors.guestCount}</p>}
            </div>

            <div>
              <label htmlFor="wizard-currency-select" className="block text-slate-300 font-semibold mb-1">Currency</label>
              <select
                id="wizard-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:outline-none focus:border-violet-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-total-budget" className="block text-slate-300 font-semibold mb-1">Total Budget Target *</label>
              <input
                id="wizard-total-budget"
                type="number"
                min="100"
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl bg-midnight-900 border border-surface-border text-white text-sm focus:outline-none focus:border-violet-500"
              />
              {errors.totalBudget && <p className="text-red-400 text-[11px] mt-1">{errors.totalBudget}</p>}
            </div>

            <div>
              <label htmlFor="wizard-contingency-pct" className="block text-slate-300 font-semibold mb-1">
                Contingency Reserve ({contingencyPercentage}%)
              </label>
              <input
                id="wizard-contingency-pct"
                type="range"
                min="0"
                max="25"
                value={contingencyPercentage}
                onChange={(e) => setContingencyPercentage(parseInt(e.target.value, 10))}
                className="w-full accent-violet-500 bg-midnight-900 rounded-lg cursor-pointer mt-2"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                Allocates {currency} {Math.round((totalBudget * contingencyPercentage) / 100).toLocaleString()} for unforeseen expenses.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Aesthetic & Logistics */}
      {step === 3 && (
        <div className="py-6 space-y-5 text-xs">
          <div>
            <label htmlFor="wizard-theme-input" className="block text-slate-300 font-semibold mb-1">Event Theme & Style *</label>
            <input
              id="wizard-theme-input"
              type="text"
              required
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Modern Minimalist Botanical, Celestial Twilight"
              className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="wizard-primary-color" className="block text-slate-300 font-semibold mb-1">Primary Color</label>
              <div className="flex items-center space-x-2">
                <input
                  id="wizard-primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-slate-300">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label htmlFor="wizard-secondary-color" className="block text-slate-300 font-semibold mb-1">Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  id="wizard-secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-slate-300">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="wizard-catering-pref" className="block text-slate-300 font-semibold mb-1">Catering & Dietary Focus</label>
            <input
              id="wizard-catering-pref"
              type="text"
              value={cateringPreferences}
              onChange={(e) => setCateringPreferences(e.target.value)}
              placeholder="e.g. Plated courses, Vegan options, Nut-free banquet"
              className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <span className="block text-slate-300 font-semibold mb-2">Accessibility & Special Accommodations</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Wheelchair ramp',
                'Elevator access',
                'Accessible restrooms',
                'Assistive hearing loops',
                'Braille signage',
                'Quiet decompression space',
              ].map((acc) => {
                const checked = accessibilityRequirements.includes(acc);
                return (
                  <label
                    key={acc}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      checked
                        ? 'bg-violet-950/40 border-violet-500 text-white'
                        : 'bg-midnight-900 border-surface-border text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setAccessibilityRequirements((prev) =>
                          checked ? prev.filter((item) => item !== acc) : [...prev, acc]
                        );
                      }}
                      className="rounded text-violet-600 focus:ring-violet-500 bg-midnight-900 border-surface-border"
                    />
                    <span className="text-xs">{acc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="wizard-planning-notes" className="block text-slate-300 font-semibold mb-1">General Notes & Priorities</label>
            <textarea
              id="wizard-planning-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions, milestones, or vendor requirements..."
              className="w-full px-3 py-2 rounded-xl bg-midnight-900 border border-surface-border text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      )}

      {/* Step 4: Summary & Confirm */}
      {step === 4 && (
        <div className="py-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-midnight-900 border border-surface-border space-y-2">
            <h4 className="text-sm font-bold text-white mb-2">Review Event Plan Configuration</h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div><strong>Title:</strong> {title}</div>
              <div><strong>Category:</strong> {category}</div>
              <div><strong>Date & Time:</strong> {eventDate} {eventTime}</div>
              <div><strong>Location:</strong> {location}</div>
              <div><strong>Guest Count:</strong> {guestCount} attendees</div>
              <div><strong>Budget:</strong> {currency} {totalBudget.toLocaleString()}</div>
              <div><strong>Contingency Reserve:</strong> {contingencyPercentage}%</div>
              <div><strong>Theme:</strong> {theme}</div>
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">
            Upon submission, EventVerse will initialize your event record, budget ledger, milestone tasks, and guest list in persistent storage.
          </p>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="pt-6 border-t border-surface-border flex justify-between items-center">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-elevated hover:bg-white/10 text-slate-300 border border-surface-border"
          >
            ← Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-glow"
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-glow disabled:opacity-50"
          >
            {submitting ? 'Creating Event...' : 'Confirm & Initialize Event'}
          </button>
        )}
      </div>
    </div>
  );
};
