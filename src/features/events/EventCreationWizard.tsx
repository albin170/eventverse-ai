import React, { useState } from 'react';
import { CurrencyCode, EventPlan, EventType } from '@/types';
import { WizardInputSchema } from '@/schemas';
import { generateEventPlan } from '@/features/ai-planner/service';
import {
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  AlertCircleIcon,
} from '@/components/icons';

interface EventCreationWizardProps {
  onPlanCreated: (plan: EventPlan) => void;
  onCancel: () => void;
}

const EVENT_TYPES: Array<{ id: EventType; label: string; icon: string; desc: string }> = [
  {
    id: 'wedding',
    label: 'Wedding Celebration',
    icon: '💍',
    desc: 'Ceremony, banquet dinner, party, and guest lodging',
  },
  {
    id: 'birthday',
    label: 'Milestone Birthday',
    icon: '🎂',
    desc: 'Bespoke themes, dynamic entertainment, and catering',
  },
  {
    id: 'anniversary',
    label: 'Anniversary Jubilee',
    icon: '✨',
    desc: 'Intimate fine dining, memory showcases, and live music',
  },
  {
    id: 'college_fest',
    label: 'College / University Fest',
    icon: '🎓',
    desc: 'Multi-stage sound, student crowds, logistics & security',
  },
  {
    id: 'community',
    label: 'Community Gathering',
    icon: '🤝',
    desc: 'Inclusive public spaces, family activities, and local food',
  },
  {
    id: 'custom',
    label: 'Custom Special Event',
    icon: '🌟',
    desc: 'Tailor every dimension from scratch with AI guidance',
  },
];

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

const PRESET_PALETTES = [
  { name: 'Celestial Indigo & Cyan', colors: ['#8B5CF6', '#06B6D4', '#E2E8F0'] },
  { name: 'Midnight Emerald & Gold', colors: ['#10B981', '#F59E0B', '#0F172A'] },
  { name: 'Velvet Rose & Champagne', colors: ['#E11D48', '#FDE047', '#1E1B4B'] },
  { name: 'Solar Sunrise & Amethyst', colors: ['#F97316', '#7C3AED', '#312E81'] },
  { name: 'Minimalist Platinum & Slate', colors: ['#94A3B8', '#F8FAFC', '#090A0F'] },
];

export const EventCreationWizard: React.FC<EventCreationWizardProps> = ({
  onPlanCreated,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  // Wizard state
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventDate, setEventDate] = useState(defaultDate);
  const [guestCount, setGuestCount] = useState<number>(100);
  const [totalBudget, setTotalBudget] = useState<number>(25000);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [contingencyPercentage, setContingencyPercentage] = useState<number>(10);
  const [theme, setTheme] = useState('Celestial Velvet & Modern Glass');
  const [colorPalette, setColorPalette] = useState<string[]>(PRESET_PALETTES[0].colors);
  const [culturalPreferences, setCulturalPreferences] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState<string[]>([
    'Vegetarian options',
    'Nut-free awareness',
  ]);
  const [venuePreferences, setVenuePreferences] = useState(
    'Modern Atrium / Architectural Ballroom'
  );
  const [accessibilityRequirements, setAccessibilityRequirements] = useState<string[]>([
    'Wheelchair accessibility',
    'Accessible restrooms',
  ]);
  const [notes, setNotes] = useState('');

  // Validate step before advancing
  const validateCurrentStep = (_targetStep?: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!title.trim() || title.trim().length < 2) {
        errors.title = 'Title must be at least 2 characters long.';
      }
      if (!eventDate) {
        errors.eventDate = 'A valid event date is required.';
      }
      if (!guestCount || guestCount < 1) {
        errors.guestCount = 'Guest count must be at least 1.';
      }
    }

    if (step === 2) {
      if (!totalBudget || totalBudget <= 0) {
        errors.totalBudget = 'Total budget must be greater than zero.';
      }
    }

    if (step === 3) {
      if (!theme.trim()) {
        errors.theme = 'Event theme is required.';
      }
    }

    if (step === 4) {
      if (!venuePreferences.trim()) {
        errors.venuePreferences = 'Venue preference is required.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep(step + 1)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setValidationErrors({});
    setStep((s) => s - 1);
  };

  const handleCreatePlan = async () => {
    const fullInput = {
      title,
      eventType,
      eventDate,
      guestCount,
      totalBudget,
      currency,
      contingencyPercentage,
      theme,
      colorPalette,
      culturalPreferences: culturalPreferences.trim() || 'Standard / None specified',
      dietaryRequirements,
      venuePreferences,
      accessibilityRequirements,
      priorities: ['Memorable Guest Experience', 'On-Time Schedule', 'Quality Catering'],
      restrictions: [],
      notes: notes.trim(),
    };

    const parsed = WizardInputSchema.safeParse(fullInput);
    if (!parsed.success) {
      const issues: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        issues[i.path[0] as string] = i.message;
      });
      setValidationErrors(issues);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateEventPlan(fullInput);
      onPlanCreated(result.plan);
    } catch (err) {
      setValidationErrors({
        general: err instanceof Error ? err.message : 'Plan generation failed.',
      });
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-surface-card rounded-3xl border border-surface-border p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-violet-600" />

      {/* Wizard Step Progress Tracker */}
      <div className="flex items-center justify-between pb-8 border-b border-white/10 mb-8">
        <div>
          <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
            Step {step} of 5
          </span>
          <h2 className="text-2xl font-bold font-display text-white mt-1">
            {step === 1 && 'Event Fundamentals'}
            {step === 2 && 'Financial Framework & Currency'}
            {step === 3 && 'Theme, Colors & Atmosphere'}
            {step === 4 && 'Venue, Dietary & Accessibility'}
            {step === 5 && 'Confirm & Generate Plan'}
          </h2>
        </div>

        <div className="flex items-center space-x-1.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? 'w-8 bg-cyan-400'
                  : s < step
                    ? 'w-3 bg-violet-600'
                    : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error banner if validation issues */}
      {Object.keys(validationErrors).length > 0 && (
        <div
          role="alert"
          className="mb-6 bg-rose-950/50 border border-rose-800 p-4 rounded-xl text-xs text-rose-300 flex items-start space-x-2.5"
        >
          <AlertCircleIcon size={16} className="text-rose-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Please resolve the following input errors:</div>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {Object.values(validationErrors).map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STEP 1: Fundamentals */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Celebration / Event Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EVENT_TYPES.map((et) => (
                <button
                  type="button"
                  key={et.id}
                  onClick={() => {
                    setEventType(et.id);
                    if (!title) {
                      setTitle(`${et.label} Experience`);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    eventType === et.id
                      ? 'bg-violet-950/50 border-violet-500 shadow-glow'
                      : 'bg-midnight-900/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl">{et.icon}</div>
                  <div className="text-xs font-bold text-white mt-2">{et.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{et.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="event-title-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Event Title
            </label>
            <input
              id="event-title-input"
              type="text"
              required
              placeholder="e.g. Zenith Global Gala 2026 or Maya's 30th Birthday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event-date-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Scheduled Date
              </label>
              <input
                id="event-date-input"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="guest-count-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected Guest Count
              </label>
              <input
                id="guest-count-input"
                type="number"
                min={1}
                max={50000}
                required
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Financials */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="total-budget-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Total Allocated Budget
              </label>
              <input
                id="total-budget-input"
                type="number"
                min={100}
                required
                value={totalBudget}
                onChange={(e) => setTotalBudget(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label htmlFor="currency-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Currency
              </label>
              <select
                id="currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="contingency-slider" className="text-xs font-semibold text-slate-300">
                Contingency Reserve Buffer ({contingencyPercentage}%)
              </label>
              <span className="text-xs font-bold text-cyan-400">
                {currency} {Math.round((totalBudget * contingencyPercentage) / 100).toLocaleString()}
              </span>
            </div>
            <input
              id="contingency-slider"
              type="range"
              min={0}
              max={30}
              step={5}
              value={contingencyPercentage}
              onChange={(e) => setContingencyPercentage(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-midnight-900 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recommended: 10-15% buffer to safeguard against vendor overtime, unexpected supply fluctuations, or weather surprises.
            </p>
          </div>

          <div className="bg-midnight-900/60 p-4 rounded-2xl border border-white/5">
            <div className="text-xs font-semibold text-slate-300 mb-1">
              Estimated Average Allowance Per Guest:
            </div>
            <div className="text-2xl font-bold font-display text-cyan-300">
              {currency} {guestCount > 0 ? (totalBudget / guestCount).toFixed(2) : '0.00'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Includes catering, venue apportionment, entertainment, florals, and photography.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: Theme & Palette */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="theme-motif-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Theme / Creative Narrative
            </label>
            <input
              id="theme-motif-input"
              type="text"
              required
              placeholder="e.g. Celestial Velvet, Neon Cyberpunk, Enchanted Forest, Moroccan Sunset"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Color Palette Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_PALETTES.map((p) => {
                const isSelected = JSON.stringify(colorPalette) === JSON.stringify(p.colors);
                return (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => setColorPalette(p.colors)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-violet-950/50 border-violet-500 shadow-glow'
                        : 'bg-midnight-900/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{p.name}</div>
                      <div className="flex items-center space-x-1.5 mt-2">
                        {p.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && <CheckIcon size={16} className="text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="cultural-traditions-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cultural Traditions / Ceremonial Elements (Optional)
            </label>
            <input
              id="cultural-traditions-input"
              type="text"
              placeholder="e.g. Traditional tea ceremony, Sangeet night, Bar Mitzvah blessings"
              value={culturalPreferences}
              onChange={(e) => setCulturalPreferences(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* STEP 4: Venue & Inclusivity */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="venue-style-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Venue Style & Architecture
            </label>
            <input
              id="venue-style-input"
              type="text"
              required
              placeholder="e.g. Modern Glass Atrium, Coastal Cliffside Estate, Industrial Loft"
              value={venuePreferences}
              onChange={(e) => setVenuePreferences(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Dietary Requirements (Tick all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                'Vegetarian options',
                'Vegan selections',
                'Gluten-Free certified',
                'Nut-free awareness',
                'Halal certified',
                'Kosher catering',
              ].map((diet) => {
                const checked = dietaryRequirements.includes(diet);
                return (
                  <label
                    key={diet}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-violet-950/40 border-violet-500 text-white'
                        : 'bg-midnight-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDietaryRequirements([...dietaryRequirements, diet]);
                        } else {
                          setDietaryRequirements(dietaryRequirements.filter((d) => d !== diet));
                        }
                      }}
                      className="rounded bg-midnight-900 border-white/20 text-violet-600 focus:ring-violet-500"
                    />
                    <span>{diet}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Universal Accessibility & Inclusivity Standards
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                'Wheelchair accessibility & step-free paths',
                'Low-glare / sensory-friendly lighting zone',
                'Hearing loop & assistive acoustic amplification',
                'Dedicated gender-neutral & family restrooms',
              ].map((acc) => {
                const checked = accessibilityRequirements.includes(acc);
                return (
                  <label
                    key={acc}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-midnight-900/60 border-white/5 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAccessibilityRequirements([...accessibilityRequirements, acc]);
                        } else {
                          setAccessibilityRequirements(
                            accessibilityRequirements.filter((a) => a !== acc)
                          );
                        }
                      }}
                      className="rounded bg-midnight-900 border-white/20 text-cyan-500 focus:ring-cyan-400"
                    />
                    <span>{acc}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="planner-notes-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Priorities or Host Notes
            </label>
            <textarea
              id="planner-notes-input"
              rows={2}
              placeholder="Any specific family requests, acoustic noise curfews, or surprise announcements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-midnight-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* STEP 5: Review & Generate */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-midnight-900/80 rounded-2xl border border-white/10 p-5 space-y-3 text-xs">
            <h4 className="text-sm font-bold text-white border-b border-white/10 pb-2">
              Plan Specification Summary
            </h4>
            <div className="grid grid-cols-2 gap-y-2 text-slate-300">
              <div>
                <span className="text-slate-500">Event:</span> {title}
              </div>
              <div>
                <span className="text-slate-500">Type:</span> {eventType.toUpperCase()}
              </div>
              <div>
                <span className="text-slate-500">Date:</span> {eventDate}
              </div>
              <div>
                <span className="text-slate-500">Headcount:</span> {guestCount} guests
              </div>
              <div>
                <span className="text-slate-500">Budget:</span> {currency} {totalBudget.toLocaleString()}
              </div>
              <div>
                <span className="text-slate-500">Contingency:</span> {contingencyPercentage}% ({currency}{' '}
                {Math.round((totalBudget * contingencyPercentage) / 100).toLocaleString()})
              </div>
              <div>
                <span className="text-slate-500">Theme:</span> {theme}
              </div>
              <div>
                <span className="text-slate-500">Venue Style:</span> {venuePreferences}
              </div>
            </div>
          </div>

          <div className="p-4 bg-violet-950/30 border border-violet-800/50 rounded-2xl text-xs text-slate-300 flex items-start space-x-3">
            <SparklesIcon size={20} className="text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-white">EventVerse GenAI Intelligence Engine</div>
              <p className="text-slate-400 mt-0.5">
                Will produce a comprehensive creative concept, itemized budget ledgers, milestone checklists with dependency cycle verification, and a 3D spatial layout preview.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={isGenerating}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeftIcon size={14} />
            <span>Back</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            disabled={isGenerating}
            className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center space-x-1.5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-glow transition-all"
          >
            <span>Continue</span>
            <ArrowRightIcon size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreatePlan}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl text-sm font-bold shadow-glow transition-all disabled:opacity-50"
          >
            <SparklesIcon size={18} />
            <span>{isGenerating ? 'Synthesizing Event Plan...' : 'Generate AI Master Plan'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
