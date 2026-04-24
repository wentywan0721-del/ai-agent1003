# UI Modal And Layer Editor Design

## Summary

This round updates the current single-page prototype without changing the backend-free architecture or the core simulation model. The scope is limited to the 2D interface, interaction flow, and session-scoped editing of selected pressure-point parameters.

The approved direction is:

- keep the current 2D main viewport
- defer any 3D / Rhino-like orbit view to a later batch
- replace direct-on-canvas route picking with a guided modal
- add a separate agent-setup modal with a live silhouette preview
- replace the old layer toggles with 10 domain-specific category buttons
- support in-session point editing for a limited set of categories so rerunning the simulation changes the heatmap

## Goals

- Make the title and file name behave like a real tool shell
- Make node / agent / floor visual encoding clearer and lighter
- Move route selection into a controlled, guided workflow
- Move focus-agent setup into a more legible modal workflow
- Expose a background-crowd slider in the left control area
- Replace coarse layer toggles with domain-specific facility / pressure categories
- Let users edit supported parameters directly from a point-adjacent popover
- Ensure edited values affect subsequent simulation runs in the current session

## Out Of Scope

- No 3D rendering in this batch
- No persistence back to `sim.json`
- No backend or storage layer
- No rework of the existing routing / fatigue / heat accumulation rules beyond feeding updated editable inputs into them
- No broad refactor of `src/core.js` beyond what is needed to accept edited pressure data or numeric crowd counts if required by the UI

## Existing Constraints

- The app remains pure frontend: `index.html`, `styles.css`, `src/app.js`, `src/core.js`
- Current focus route flow already uses `startPoint + targetRegionId`
- Current route / node classification should be reused rather than redefined
- Heatmap, pause, and focus-agent inspection already work and should not be regressed
- Session data is the source of truth after import; edits should be layered on top of imported model data in memory

## Top Bar Changes

- Product title must localize correctly:
  - Chinese: `认知负荷模拟器`
  - English: a matching English product title
- `untitled` becomes editable:
  - default display is plain text
  - click enters inline edit mode
  - `Enter` or blur saves
  - `Escape` restores previous value
- Language buttons remain at top right with help icon and avatar

## Left Panel Changes

The left panel remains the primary control area, but the structure changes:

- keep import action
- keep generate crowd
- keep run heatmap
- add a dedicated `设置路径 / Set Route` button that opens a modal
- add a dedicated `设置代理人 / Set Agent` button that opens a modal
- place a background-crowd slider directly below the agent-settings button
- replace the old 3-button display-layer block with 10 category buttons

### Background Crowd Slider

The slider is always visible after import and should:

- allow adjusting crowd density directly
- remain session-scoped
- mark the current scenario as stale when changed
- take effect on the next crowd generation / simulation run

The previously confirmed numeric range still applies:

- minimum: `100`
- reference normal: `1595`
- reference peak: `3190`

## Route Selection Modal

The old direct route-pick mode is replaced by a guided modal.

### Layout

- left top: instruction text
- left middle / lower: target-region list shown only after a start node is chosen
- right large area: current floor plan and all nodes
- bottom: `确定 / Confirm` and `清除 / Clear`

### Flow

1. Open modal
2. Instruction says `请选择起点`
3. User clicks a node in the modal map
4. That node enlarges and highlights
5. Instruction changes to `请选择终点区域`
6. Left-side region options become available
7. User selects one target region
8. `Confirm` writes the choice into current route selection and closes the modal
9. Main viewport then shows only the selected start marker and selected target-region marker

### Behavior Rules

- `Clear` resets both start and target region
- closing without confirm keeps the previous valid selection
- main viewport should not permanently show every node after the modal closes

## Agent Setup Modal

The agent setup flow moves into its own modal.

### Layout

- left: age band, gender, BMI category controls
- right: rotating human silhouette preview
- bottom: `确定 / Confirm` and `清除 / Clear`

### Preview Rules

- age changes posture:
  - `65-69`: upright elder silhouette
  - older bands progressively bend forward more
- gender changes base silhouette shape
- BMI category changes silhouette width
- preview rotates slowly to communicate body shape clearly

### Behavior Rules

- `Clear` resets to defaults
- `Confirm` writes the settings back to focus-agent controls
- if a scenario already exists, the UI should mark that crowd generation needs to be rerun

## Main Viewport Visual Rules

### Floor

- floor fill becomes light gray, not white
- walkable outline becomes thin dark gray
- obstacles remain darker than the floor

### Nodes

Nodes stay visible in the route-selection modal and may also be rendered selectively where needed in the main viewport. Their color mapping becomes:

- Exit A / B / C / D: 4 green shades
- Island Line toward Chai Wan: blue
- Island Line toward Kennedy Town: purple
- Tsuen Wan Line: red
- lift: yellow

Shared node styling:

- thin dark-gray outline
- much smaller text labels, approximately one quarter of current size
- label color becomes dark gray

### Agents

- all moving agents render as black dots
- dot size is reduced aggressively
- focus-agent selection / pause state may still use a high-visibility highlight overlay, but the default moving dot should be black

## Layer Categories

The old generic layer toggles are removed. Replace them with 10 explicit category buttons:

- `flashing ads`
- `Static ads`
- `AI virtual service ambassador`
- `Common direction Signs`
- `Customer Service Centre`
- `Noise`
- `Hanging Signs`
- `LCD`
- `Panoramic guide map`
- `Seat`

### Data Mapping

Current imported data maps to those buttons as follows:

- `Advertisement` + dynamic / flashing features -> `flashing ads`
- `Advertisement` + static feature -> `Static ads`
- `Escalator Noise` -> `Noise`
- `Seat` layer -> `Seat`

### Visibility Behavior

- clicking a category button shows only that category's points
- category point colors must be distinct from node colors
- category point markers do not use outlines

## Point Selection And Popover Editing

When a visible category point is clicked:

- the point becomes highlighted
- a small map-adjacent popover appears near that point
- only one popover may be open at a time

### Editable Categories

- `flashing ads`
  - advertisement mode dynamic / static
  - `lux`
  - `decibel`
- `Static ads`
  - advertisement mode dynamic / static
  - `lux`
  - `decibel`
- `Noise`
  - `decibel`

### Read-Only Categories

- `AI virtual service ambassador`
- `Common direction Signs`
- `Customer Service Centre`
- `Hanging Signs`
- `LCD`
- `Panoramic guide map`
- `Seat`

For read-only categories the popover shows:

- type
- feature / name
- key available parameters

For editable categories the popover shows:

- relevant editable inputs
- `确定 / Confirm`
- `复原 / Reset`

### Session Edit Rules

- edits are stored only in memory
- imported raw data remains unchanged
- rerunning crowd generation / simulation uses the edited values
- `Reset` restores that specific point to its imported value

## Simulation Integration Rules

- Edited pressure-point values must feed back into the prepared simulation data before rerun
- No save/export step is required in this batch
- The user should be able to compare changed heatmaps by rerunning after edits

## Technical Approach

### `index.html`

- add inline editable file-name affordance
- add route modal structure
- add agent modal structure
- replace old layer button area with 10 buttons
- add crowd slider block

### `styles.css`

- restyle top bar title/file-name interaction
- add modal shell, layout, buttons, and preview styles
- update floor / node / agent / point-marker styling
- add point popover styling

### `src/app.js`

- localize product title
- manage editable file name state
- manage route modal state machine
- manage agent modal state and silhouette rendering
- manage crowd slider state
- map imported pressure points into 10 UI categories
- manage per-point edited overrides
- render one-category-at-a-time point overlays
- open and position point popovers
- rebuild scenario inputs from edited data before rerun

### `src/core.js`

- keep simulation logic intact where possible
- accept prepared pressure-point overrides and numeric crowd input if needed
- avoid adding unrelated logic

### `scripts/validate_scenarios.js`

- extend checks for:
  - editable title/file-name affordance
  - route modal structure
  - agent modal structure
  - crowd slider
  - 10 layer buttons
  - popover edit state hooks

## Risks And Mitigations

- Modal complexity could conflict with existing map click logic
  - mitigate by isolating modal interactions from main overlay interactions
- Category mapping could drift from imported feature text
  - mitigate by centralizing a single mapping function in `src/app.js`
- Point-popover overlap could clutter the map
  - mitigate by enforcing one open popover at a time
- Very small agent dots may become hard to inspect
  - mitigate by keeping a larger invisible hit area for the focus agent

## Acceptance Criteria

- Product title switches language correctly
- `untitled` can be renamed inline
- floor, node, and agent visuals match the approved encoding
- route selection happens through a modal, not raw main-view clicks
- agent setup happens through a modal with a live silhouette preview
- background crowd slider is present and affects reruns
- 10 category buttons replace the previous layer controls
- clicking a visible point opens a point-adjacent popover
- supported parameter edits change subsequent heatmap results
- read-only categories remain inspectable but not editable
- no 3D view is introduced in this batch
