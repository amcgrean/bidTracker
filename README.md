# Deck Configurator

Get the look of your deck plus a rough estimate of materials.

An interactive web app that walks users through a series of questions about the deck they want to build, renders a live 2D top-down preview, and produces an estimated material list with costs.

## Current Status

**Phase: Enhanced MVP (Phase 1 complete, Phase 2 in progress)**

The configurator now includes a compact, mobile-friendly wizard, multi-view deck rendering (surface, framing, elevation, and isometric), URL persistence for shareable configurations, PDF export, and an admin-backed product/settings API.

## Product Catalog

### Decking
- **Wood:** Pressure-treated lumber, Cedar
- **Composite:** Trex, TimberTech / AZEK, Deckorators, Wolf Home Products, MoistureShield

### Railing
- **Wood** railing (standard)
- **Cedar** railing (gripable, rustic look)
- **Metal / Aluminum** — Westbury (primary), Deckorators, Trex, TimberTech, Wolf, DekPro
- **Glass panel** — Westbury Veranda / ScreenRail

### Key Brands
| Brand | Products We Carry |
|-------|-------------------|
| Trex | Composite decking (Transcend, Enhance, Select), aluminum railing |
| TimberTech / AZEK | Composite & PVC decking, RadianceRail railing |
| Deckorators | Mineral-based composite decking (Surestone), ALX/CXT railing |
| Wolf Home Products | Serenity & Perspective composite decking, Wolf Railing |
| MoistureShield | Composite decking for wet/pool environments |
| Westbury | Aluminum railing (C10, Tuscany), glass panel railing (Veranda) |
| DekPro | Distinctive baluster designs and railing accessories |

## Objectives

### Phase 1 — MVP (complete)
- [x] Step-by-step wizard: shape, dimensions, material/brand, board pattern, railing/brand, stairs
- [x] Wood vs. composite decking category with brand selection
- [x] Railing type (wood, metal, glass) with brand selection — Westbury as default for metal/glass
- [x] Live 2D top-down deck preview (HTML Canvas)
- [x] Material list estimator with itemized costs
- [x] Support for rectangle, L-shape, T-shape, and wrap-around deck footprints
- [x] Ledger-attached vs. freestanding option
- [x] Persist configuration to URL query params (shareable links)
- [x] Print / export material list to PDF

### Phase 2 — Refinement
- [x] Accurate board-by-board rendering on the 2D canvas (individual boards with realistic spacing)
- [x] Diagonal, herringbone, and picture-frame pattern rendering on the canvas
- [ ] Interactive dimension editing: drag edges on the canvas to resize
- [x] Stair rendering improvements (3D-ish side profile view)
- [x] Mobile-responsive layout (stacked wizard + preview)
- [ ] Snap-to-grid and standard lumber length optimization (8', 10', 12', 16')
- [ ] Color/finish selection per brand (e.g., Trex Transcend color options)
- [ ] Brand-specific product line selection (e.g., Trex Transcend vs. Enhance vs. Select)
- [x] Add alternate render modes (framing, elevation, isometric)
- [x] Add engineered beam framing support

### Phase 3 — Advanced Features
- [ ] User accounts and saved deck designs
- [ ] Multiple deck sections / multi-level decks
- [ ] Pergola / shade structure add-on
- [ ] Built-in bench and planter options
- [ ] Local building code reference (railing height, post spacing, joist span tables)
- [ ] Integration with supplier pricing APIs for real-time cost estimates
- [ ] 3D perspective view (WebGL / Three.js)
- [ ] Generate a bid/quote document from the material list

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| 2D Rendering | HTML Canvas API |
| State Management | React Context + useReducer |
| Hosting | Vercel |

## Project Structure

```
src/
  app/
    layout.tsx          — Root layout
    page.tsx            — Main page (wizard + canvas split view)
    globals.css         — Global styles
  components/
    wizard/
      WizardPanel.tsx   — Orchestrates wizard steps
      ShapeStep.tsx     — Deck shape selection
      DimensionsStep.tsx — Width/depth/height inputs
      MaterialStep.tsx  — Decking category (wood/composite) + brand selection
      PatternStep.tsx   — Board layout pattern
      RailingStep.tsx   — Railing type + brand (Westbury, Deckorators, etc.)
      StairsStep.tsx    — Stair placement + width
      ReviewStep.tsx    — Summary + material cost table
    deck-renderer/
      DeckCanvas.tsx    — 2D canvas rendering engine
    ui/
      OptionCard.tsx    — Reusable selection card
      NumberInput.tsx   — Labeled numeric input
      StepNavigation.tsx — Back/Next + step indicator
  lib/
    deck-context.tsx    — DeckConfig state provider + reducer
    materials.ts        — Material estimation logic + cost tables
  types/
    deck.ts             — All TypeScript types and constants
```

## Important Questions and Decisions

### Product / Business
- **How should brand-specific pricing work?** Current estimates use rough national averages baked into the code. Should we maintain a pricing spreadsheet that gets imported, connect to supplier APIs, or let users enter their own pricing?
- **Should Westbury railing be the default for all non-wood railing?** Currently it is. Should we also feature Westbury more prominently in the UI (e.g., a "Recommended" badge)?
- **Product line depth:** Do we need sub-selections within each brand? (e.g., Trex Transcend vs. Trex Enhance vs. Trex Select each have different price points and color options.)
- **Color/finish selection:** Each brand has specific color options. Should the configurator include color selection that affects the 2D preview?

### Architecture
- **Canvas vs. SVG for 2D rendering?** We chose Canvas for performance with many drawn elements (individual boards). SVG may be revisited if we need DOM-level interactivity on each board.
- **State management approach?** Context + useReducer is sufficient for now. If state grows complex (undo/redo, collaboration), consider Zustand or Redux Toolkit.
- **Server components vs. client?** The wizard and canvas are fully client-side. Server components are used only for layout/metadata. No backend is needed for the MVP.

### Technical
- **Lumber length optimization:** The material list currently estimates square footage. A more useful output would map to actual board counts at standard lumber lengths (8', 10', 12', 16') to minimize waste.
- **Board-level rendering:** The canvas currently draws boards as alternating-color stripes. Rendering each board individually with realistic gaps, end joints, and staggering is a key visual improvement.
- **Export formats:** PDF is the obvious first target. Should we also support CSV (for spreadsheet import) or a structured JSON format?
- **Hosting:** Vercel is the plan. The MVP is fully static, so deployment is straightforward with automatic preview URLs per PR.
- **Should we support metric units?** Currently feet-only. Adding metric would require a unit toggle and conversion layer.

## Deployment (Vercel)

This app is designed to deploy on [Vercel](https://vercel.com). To set it up:

1. **Connect the repo:** Go to [vercel.com/new](https://vercel.com/new), import the `amcgrean/bidTracker` GitHub repo.
2. **Framework detection:** Vercel auto-detects Next.js — no special config needed.
3. **Deploy:** Click "Deploy". Vercel will build and host the app with a `.vercel.app` URL.
4. **Preview deployments:** Every push to a branch automatically gets a unique preview URL.
5. **Custom domain (optional):** Add a custom domain in Vercel project settings if desired.

### Environment
No environment variables or secrets are needed for the MVP — it's fully client-side.

## Development

```bash
npm install
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # Run ESLint
```

## License

See [LICENSE](./LICENSE).
