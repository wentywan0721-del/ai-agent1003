# Left Shell And Rule Alignment Design

**Scope**
- Remove the extra inner-shell/card feel from the left panel so it reads as one frosted outer panel.
- Align `src/core.js` with the approved rule sources: `Book(rules).csv`, `Book(pressure rules).csv`, and `规则说明.docx`.

**Current State**
- The left panel only has one outer `panel` node, but inner cards (`summary-pill`, `glass-card`, `compact-summary`) still create a second translucent shell feel.
- The simulation core implements only a subset of the approved rules. Current coverage includes basic fatigue velocity/thresholds, some stress event rules, and part of the rest logic.

**Design Decisions**
- Keep the existing left-panel DOM structure and remove the inner-shell look via targeted HTML/CSS changes instead of reworking layout.
- Keep the current front-end interaction model and extend only the rule engine in `src/core.js`.
- Treat the documents above as the single source of truth when they conflict with current code.

**Rule Integration Strategy**
- Preserve current healthy-agent inputs (`ageBand`, `gender`, `bmi`, `walkingSpeed`, `decisionDelay`, `fatigueRate`) and add general helper hooks for health-condition modifiers so future data can use them without another rewrite.
- Split the rule engine into:
  - fatigue environment coefficients
  - stress event descriptors
  - stress environment multipliers
  - facility/path-cost estimation
  - resting and recovery rules
- Use current point metadata (`name`, `feature`, `lux`, `decibel`, `category`) for rule matching.

**UI Shell Strategy**
- Route start/end summaries in the left panel become plain text rows instead of frosted pills.
- Agent summary becomes a lightweight text block with no inner glass-card container.
- Keep buttons and the slider unchanged unless required for spacing.

**Validation**
- Extend `scripts/validate_scenarios.js` with:
  - left-panel no-inner-shell assertions
  - additional synthetic rule-engine assertions for signage, ads, noise, queue fatigue, and rest/recovery behavior
- Run the existing static checks and scenario validation after implementation.

