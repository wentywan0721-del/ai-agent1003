# Route Report Export Design

## Summary

This batch adds a first usable client-facing deliverable to the existing simulation prototype: after a single route has been run and the heatmap is available, the user can open a report-preview modal from the right inspector panel and export a tidy HTML diagnostic report for the current route.

The approved direction is:

- keep the existing UI shell and preserve confirmed left-panel and modal structures
- add one `导出报告` action at the bottom of the right inspector panel
- open a new preview modal instead of navigating away from the simulation view
- generate one Chinese-only, organized route report for the current simulation state
- export as standalone HTML using the File System Access API when available, with browser-download fallback

## Goals

- Turn a finished single-route simulation into a shareable diagnostic artifact
- Let the user preview the report before exporting it
- Keep the first version light and fast to implement
- Reuse current simulation outputs such as route selection, scenario summary, hotspots, and suggestion text
- Avoid any regression in the already confirmed page layout

## Out Of Scope

- No DOCX or PDF export in this batch
- No multi-route comparison report
- No separate report templates yet for metro company / design company / government clients
- No embedded map screenshot or rendered floor-plan image in V1
- No backend persistence, upload, or cloud storage

## Existing Constraints

- The prototype remains frontend-only: `index.html`, `styles.css`, `src/app.js`, `src/core.js`
- Existing right inspector panel already shows scenario summary, object detail, dynamic state, and hotspots
- Existing modal shell styling and close-via-backdrop behavior should be reused
- The report should be based on the currently simulated route, not on a separate re-run
- Export availability should depend on a completed heatmap result, because the report needs route summary and hotspot diagnosis

## User Flow

1. User imports or uses the current model
2. User selects one route
3. User generates the crowd and runs the heatmap
4. User clicks `导出报告` at the bottom of the right inspector panel
5. A report modal opens
6. The modal shows:
   - left: report metadata, key route diagnosis bullets, export controls
   - right: full report preview inside an iframe
7. User clicks export
8. Browser opens a save dialog when `showSaveFilePicker` is available; otherwise the browser download flow is used

## Report Content

The report is a Chinese-only organized diagnostic summary, not a formal cover-style report package.

### Included Sections

- report title and export timestamp
- project / file name
- route start point and target region
- agent profile and crowd setting snapshot
- simulation key metrics:
  - simultaneous count
  - active pressure source count
  - average travel time
  - average fatigue
  - average heat / cognitive-load intensity
- route diagnosis conclusion:
  - overall risk level
  - concise interpretation of the current run
- top route hotspots:
  - hotspot name
  - category
  - cognitive-load value
  - why it matters
- improvement suggestions:
  - category-driven interventions already aligned with current hotspot logic
  - a small number of deduplicated actionable recommendations

### Omitted In V1

- long narrative explanation
- organization-specific framing
- map thumbnails
- appendix tables with every sampled frame

## Data Sources

The report should reuse existing app state instead of recomputing a separate analysis pipeline:

- `state.routeSelection`
- `state.focusProfile`
- `state.backgroundCrowd`
- `state.scenario.summary`
- `state.scenario.hotspots`
- existing helpers for:
  - route labels
  - number formatting
  - hotspot advice by category

To keep the report stable, it should read directly from `state.scenario.hotspots` rather than the UI-dependent `getDisplayedHotspots()` branch that can switch to focus-agent local pressure sources when the user clicks the agent.

## UI Changes

### Right Inspector Panel

- add a small footer-like section below the hotspot list
- place a single full-width `导出报告` button there
- disable the button until a heatmap exists for the current route

### Report Modal

- add a new modal using the existing `.modal-shell` pattern
- use a two-column layout:
  - narrow left rail for title, summary, export controls, and export status
  - wide right stage for preview iframe
- allow closing by backdrop and by an explicit close button

## Error Handling

- If the route or heatmap is not ready, the report button stays disabled
- If report generation somehow fails, show a short inline error inside the modal
- If the user cancels the save dialog, show a non-fatal cancelled state and keep the modal open
- If file-system save is not supported, fall back to HTML blob download automatically

## Testing Strategy

- Extend `scripts/validate_scenarios.js` with structural assertions for:
  - new inspector export button
  - new report modal hooks
  - new report-generation and export functions in `src/app.js`
  - File System Access API fallback hook
- Run syntax validation on `src/app.js`
- Run the scenario validator
- Do one browser verification pass:
  - run a route
  - open the report modal
  - confirm preview appears
  - export HTML successfully
