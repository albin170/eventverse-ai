# EventVerse AI — Advanced GenAI Celebration & Event Planner

[![CI](https://github.com/eventverse-ai/eventverse/actions/workflows/ci.yml/badge.svg)](https://github.com/eventverse-ai/eventverse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-5.6_Strict-blue)](https://www.typescriptlang.org/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA-green)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Bundle Size](https://img.shields.io/badge/Repo_Size-%3C_2MB-brightgreen)](.)

**EventVerse AI** is an advanced, production-minded event management and GenAI planning platform engineered for weddings, corporate galas, milestone birthdays, and community festivals. Built with a deterministic financial engine in minor currency units (cents), dynamic scenario modeling, milestone dependency tracking, an interactive 3D spatial venue studio with accessible 2D blueprint fallback, supplier directory comparison, and formula-injection-safe data export.

---

## 🌟 Key Highlights & Architectural Pillars

1. **Deterministic Smart Budget Engine**:
   - Zero floating-point monetary discrepancies by processing all calculations in integer minor currency units (cents).
   - Dynamic per-person headcount scaling vs. fixed vendor overhead.
   - Configurable safety contingency reserve buffer (0% to 30%).
   - Automated 1-click prioritized expense reduction engine protecting high-priority user experiences.
   - Quotation confirmation tracking to distinguish estimates from legally binding vendor quotes.

2. **Interactive 3D Venue Studio & Accessible 2D Architectural Blueprint**:
   - Built with procedural Three.js geometry without multi-megabyte 3D mesh files or heavy texture packs.
   - Configurable lighting atmospheres (Cyber Midnight, Rose Glow, Golden Hour, Electric Violet).
   - Real-time guest seating capacity calculation based on banquet table density and stage placement.
   - Built-in accessible 2D architectural blueprint view for low-power hardware or screen-reader users.

3. **What-If Scenario Simulator**:
   - Compare proposed modifications (guest headcount, catering tiers, entertainment scale) against the active master plan in real time.
   - Live delta metrics displaying cost variances, per-guest expense changes, and budget utilization shifts before committing.

4. **Event Timeline & Task Milestone Manager**:
   - Automated task deadline calculation relative to the event date.
   - Circular dependency detection using Depth-First Search (DFS) with cycle path reporting.
   - Master event date recalculation automatically shifts dependent task schedules.

5. **Vendor Management & Quotation Matrix**:
   - Supplier directory categorized across Catering, Photography, Venue, Lighting, and Entertainment.
   - Side-by-side comparison matrix for shortlisted suppliers.
   - Direct enquiry status tracking (Draft, Sent, Confirmed).

6. **Formula-Injection-Safe Data Export**:
   - RFC 4180 compliant CSV export featuring automatic spreadsheet formula injection defense (neutralizes `=`, `+`, `-`, `@`, `\t`, `\r`).
   - Executive Markdown Dossier export for client briefs and venue coordinators.
   - Schema-validated JSON backup and restore with sanitization.

7. **Zero-Friction Offline DEMO Mode**:
   - Full functionality available immediately out-of-the-box without paid API keys or external services.
   - Deterministic event generation based on event type, guest count, and aesthetic preferences.
   - Optional integration with Google Gemini AI via clean client-side or server proxy configurations.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Local Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/eventverse-ai/eventverse.git
cd eventverse-ai

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```

Visit `http://localhost:5173` to explore the application in full interactive DEMO mode.

---

## 🛠 Available NPM Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with hot-module replacement |
| `npm run build` | Runs strict type checking (`tsc --noEmit`) and Vite production bundle |
| `npm run preview` | Previews the optimized production bundle locally |
| `npm run lint` | Lints TypeScript and React source files with ESLint |
| `npm run typecheck` | Validates strict TypeScript types across the entire project |
| `npm test` | Runs the full Vitest automated test suite |
| `npm run test:coverage`| Generates statement, branch, and function test coverage reports |
| `npm run test:a11y` | Executes automated axe-core WCAG 2.2 AA accessibility test suite |
| `npm run audit` | Runs npm package dependency security audit |

---

## 🏗 System Architecture

```
src/
├── app/
│   └── EventDashboard.tsx          # Master dashboard layout, tabs, financial gauge
├── features/
│   ├── ai-planner/
│   │   └── service.ts              # Turnkey AI service with deterministic DEMO fallback
│   ├── budget/
│   │   ├── engine.ts               # Pure deterministic financial engine in integer cents
│   │   └── BudgetDashboard.tsx     # Budget UI, expense table, quota checks, savings engine
│   ├── events/
│   │   └── EventCreationWizard.tsx # 5-step event creation wizard with validation
│   ├── export/
│   │   ├── engine.ts               # CSV, Markdown dossier, and JSON export generators
│   │   └── ExportView.tsx          # Export modal and data management interface
│   ├── scenarios/
│   │   ├── engine.ts               # What-if delta calculations and category scaling
│   │   └── ScenarioSimulator.tsx   # Interactive scenario simulator UI
│   ├── timeline/
│   │   ├── engine.ts               # Milestone scheduler, DFS cycle detector, date shifts
│   │   └── TimelineView.tsx        # Milestone board and task management UI
│   ├── vendors/
│   │   └── VendorManagement.tsx    # Supplier directory, comparison modal, shortlist
│   └── venue-studio/
│       ├── VenueStudio.tsx         # Master studio container with 3D/2D toggle
│       ├── Venue3DCanvas.tsx       # Procedural Three.js 3D viewport and lighting
│       └── Venue2DFallback.tsx     # Accessible 2D architectural blueprint layout
├── lib/
│   └── sanitizer.ts                # CSV formula injection & text sanitization
├── schemas/
│   ├── budget.schema.ts            # Zod validation schemas for line items and summary
│   ├── event.schema.ts             # Zod validation schemas for event plans
│   ├── timeline.schema.ts          # Zod validation schemas for milestones and tasks
│   ├── vendor.schema.ts            # Zod validation schemas for supplier profiles
│   ├── venue.schema.ts             # Zod validation schemas for 3D/2D venue models
│   └── index.ts                    # Root schema registry and master validator
├── services/
│   └── storage.ts                  # LocalStorage repository with turnkey demo plan
├── test/
│   ├── a11y.test.tsx               # Automated axe-core WCAG 2.2 AA verification
│   ├── ai-schema.test.ts           # Schema validation tests for AI-generated plans
│   ├── budget-engine.test.ts       # Mathematical tests for deterministic budget engine
│   ├── e2e-journey.test.tsx        # Comprehensive end-to-end integration journey
│   ├── export-engine.test.ts       # Formula injection sanitization and export tests
│   ├── sanitizer.test.ts           # String sanitization and CSV escape verification
│   ├── schemas.test.ts             # Runtime schema boundary verification
│   ├── setup.ts                    # Test environment configuration
│   └── timeline-engine.test.ts     # DFS cycle detection & date shift tests
└── types/
    └── index.ts                    # Unified domain TypeScript type definitions
```

---

## 🔒 Security & Defensive Engineering

1. **Spreadsheet Formula Injection Defense**:
   All user-supplied strings exported to CSV are passed through `sanitizeCsvCell()`, which prepends a single apostrophe `'` to any value starting with `=`, `+`, `-`, `@`, `\t`, or `\r`. Double quotes are escaped per RFC 4180.
2. **Runtime Boundary Validation**:
   External payloads, AI completions, and restored JSON backups are parsed through strict Zod schemas before being accepted into application state.
3. **No Hardcoded Secrets or Credentials**:
   Zero API keys, private credentials, or secrets exist within frontend code. All external integrations are driven through environment variables documented in `.env.example`.
4. **Lightweight Repository Footprint**:
   Repository size is kept strictly under 2 MB by excluding all binary 3D assets, avoiding heavy external media, and leveraging procedural Three.js rendering and pure SVG icons.

---

## ♿ Accessibility (WCAG 2.2 AA)

- **Semantic HTML & Landmark Architecture**: Standard `<header>`, `<main>`, `<nav>`, `<section>`, and `role="tablist"` navigation.
- **Form Controls & Labels**: Explicit `htmlFor` identifiers, visible focus rings (`focus:ring-2 focus:ring-violet-500`), and descriptive `aria-label` tags.
- **Accessible Data Presentation**: All 3D visual outputs are paired with an accessible 2D architectural blueprint containing tabular data representations.
- **Reduced Motion Support**: Custom CSS and Framer Motion transitions respect `@media (prefers-reduced-motion: reduce)`.
- **Automated Verification**: `npm run test:a11y` runs automated `axe-core` sweeps with 0 critical or serious violations.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
