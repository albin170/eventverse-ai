import { IconCheck, IconShield, IconSparkles } from './icons';


interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAuth: (initialMode?: 'login' | 'register') => void;
  onOpenAdminPortal: () => void;
  isAuthenticated: boolean;
  userRole?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenAuth,
  onOpenAdminPortal,
  isAuthenticated,
  userRole,
}) => {
  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-midnight-900/80 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-glow">
              <IconSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-white">EventVerse</span>
              <span className="text-xs block text-slate-400 font-medium tracking-wide">Enterprise Event Studio</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#workflow" className="hover:text-white transition-colors">Planning Workflow</a>
            <a href="#categories" className="hover:text-white transition-colors">Event Categories</a>
            <a href="#budgeting" className="hover:text-white transition-colors">Financial Architecture</a>
            <a href="#spatial" className="hover:text-white transition-colors">3D Spatial Studio</a>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {userRole === 'admin' && (
                  <button
                    onClick={onOpenAdminPortal}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-coral-500/10 text-coral-300 border border-coral-500/30 hover:bg-coral-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <IconShield className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </button>
                )}
                <button
                  onClick={onGetStarted}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-glow transition-all"
                >
                  Enter Workspace
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-glow transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Zero Synthetic Data • Real Persistence & Authorization</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Sophisticated Architecture for Significant Celebrations.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Organize weddings, birthdays, anniversaries, and community gatherings with deterministic financial ledgers, cycle-checked timelines, verified vendors, and spatial design.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-glow transition-all transform hover:-translate-y-0.5"
            >
              Start Planning Event
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-surface-card border border-surface-border text-slate-200 hover:bg-surface-elevated transition-all"
            >
              Sign In to Your Workspace
            </button>
          </div>

          {/* Core Trust Pillars */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Financial Engine</span>
              <span className="text-base font-bold text-white mt-1 block">Deterministic Cents</span>
              <span className="text-xs text-slate-400 mt-1 block">Zero IEEE-754 floating point drift</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Dependency Safety</span>
              <span className="text-base font-bold text-white mt-1 block">DFS Cycle Checks</span>
              <span className="text-xs text-slate-400 mt-1 block">Circular prerequisites prevented</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Authentication</span>
              <span className="text-base font-bold text-white mt-1 block">Firebase & RBAC</span>
              <span className="text-xs text-slate-400 mt-1 block">Strict user data isolation</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border">
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Vendor Integrity</span>
              <span className="text-base font-bold text-white mt-1 block">Admin Verification</span>
              <span className="text-xs text-slate-400 mt-1 block">No fabricated ratings or reviews</span>
            </div>
          </div>
        </div>
      </header>

      {/* Planning Workflow Section */}
      <section id="workflow" className="py-20 bg-midnight-900 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-2">Step-by-Step Methodology</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">How EventVerse Operates</h2>
            <p className="mt-3 text-slate-400 text-sm">A disciplined, transparent planning process built on concrete user preferences and verifiable records.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border relative">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold font-mono text-base mb-4 border border-violet-500/30">
                01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Define Constraints</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Specify event type, headcounts, location, maximum budget, currency, theme palettes, and accessibility requirements.
              </p>
            </div>

            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold font-mono text-base mb-4 border border-indigo-500/30">
                02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Budget Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage estimated vs. actual expenses, track deposits, unpaid balances, and simulate what-if adjustments.
              </p>
            </div>

            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border relative">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-base mb-4 border border-cyan-500/30">
                03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cycle-Safe Timeline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track task milestones with DFS dependency cycle detection and automatic deadline recalibration on date changes.
              </p>
            </div>

            <div className="bg-surface-card p-6 rounded-2xl border border-surface-border relative">
              <div className="w-10 h-10 rounded-xl bg-coral-600/20 text-coral-400 flex items-center justify-center font-bold font-mono text-base mb-4 border border-coral-500/30">
                04
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verified Enquiries</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with authenticated vendors, transmit exact requirements, and monitor enquiry statuses in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Categories Section */}
      <section id="categories" className="py-20 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Versatile Planning</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">Event Architecture for Any Scale</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">💍</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Weddings</h3>
              <p className="text-xs text-slate-400">Ceremony schedules, multi-tier catering, seating charts, and photography milestones.</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">🎂</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Birthdays & Anniversaries</h3>
              <p className="text-xs text-slate-400">Theme decor, entertainment, custom guest lists, dietary tracking, and vendor coordination.</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">🎓</span>
              <h3 className="text-lg font-bold text-white mb-1.5">College & Campus Festivals</h3>
              <p className="text-xs text-slate-400">High-headcount logistics, staging, acoustic gear, security compliance, and vendor bids.</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">🏢</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Corporate Conferences</h3>
              <p className="text-xs text-slate-400">AV equipment, catering schedules, accessibility logistics, and executive dossiers.</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">🤝</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Community Celebrations</h3>
              <p className="text-xs text-slate-400">Public venues, volunteer assignments, permits, sanitation, and donation ledgers.</p>
            </div>
            <div className="p-6 rounded-2xl bg-surface-card border border-surface-border hover:border-violet-500/50 transition-colors">
              <span className="text-2xl mb-3 block">✨</span>
              <h3 className="text-lg font-bold text-white mb-1.5">Custom Galas</h3>
              <p className="text-xs text-slate-400">Bespoke thematic requirements, spatial stage layouts, and custom currency ledgers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Architecture Section */}
      <section id="budgeting" className="py-20 bg-midnight-900 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-coral-400 uppercase tracking-widest block mb-2">Deterministic Arithmetic</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white leading-tight">
                Financial Precision You Can Trust.
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Standard web applications suffer from floating point errors when managing multiple currencies and items. EventVerse calculates all estimates, actuals, deposits, and contingency reserves in integer minor units.
              </p>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <IconCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Tracks Estimated Cost, Actual Recorded Cost, Paid Deposits, and Unpaid Balances.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <IconCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Interactive What-If simulator models headcount and tier shifts non-destructively.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <IconCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Rule-based cost reduction suggestions protect essential priorities over optional extras.</span>
                </li>
              </ul>
            </div>
            <div className="bg-surface-card border border-surface-border p-6 rounded-2xl shadow-card">
              <div className="flex justify-between items-center pb-4 border-b border-surface-border text-xs text-slate-400">
                <span>Total Budget Allocation</span>
                <span className="font-mono text-white text-sm font-bold">$50,000.00</span>
              </div>
              <div className="my-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Recorded Expenses</span>
                  <span className="font-mono text-cyan-400 font-bold">$34,250.00</span>
                </div>
                <div className="w-full h-2 rounded-full bg-midnight-950 overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '68.5%' }}></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-border text-center">
                <div className="p-2.5 rounded-lg bg-midnight-950">
                  <span className="text-[10px] text-slate-400 block uppercase">Paid</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">$20,000</span>
                </div>
                <div className="p-2.5 rounded-lg bg-midnight-950">
                  <span className="text-[10px] text-slate-400 block uppercase">Unpaid</span>
                  <span className="font-mono text-xs font-bold text-amber-400">$14,250</span>
                </div>
                <div className="p-2.5 rounded-lg bg-midnight-950">
                  <span className="text-[10px] text-slate-400 block uppercase">Remaining</span>
                  <span className="font-mono text-xs font-bold text-violet-400">$15,750</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Studio Section */}
      <section id="spatial" className="py-20 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block mb-2">Procedural 3D & 2D Studio</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white">Interactive Venue Spatial Modeling</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-2xl mx-auto">
            Inspect seating arrangements, stage placements, and lighting presets in real-time 3D, with an accessible high-contrast 2D architectural fallback.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 shadow-glow transition-all"
            >
              Launch Venue Studio
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-midnight-950 border-t border-surface-border py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <IconSparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">EventVerse</span>
            <span className="text-slate-500">• Professional Celebration & Event Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span>WCAG 2.2 AA Compliant</span>
            <span>Zero Synthetic Reviews</span>
            <button
              onClick={onOpenAdminPortal}
              className="text-violet-400 hover:text-violet-300 underline underline-offset-4"
            >
              Administrator Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
