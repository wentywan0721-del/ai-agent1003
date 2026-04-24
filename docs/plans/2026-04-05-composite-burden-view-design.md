# Composite Burden View Design

**Goal:** Add a composite burden overview without rebuilding the confirmed UI, and retune the five heatmap palettes so low/high burden are visually separated more clearly.

**Context**
- The current product has five burden views: locomotor, sensory, cognitive, psychological, and vitality.
- The user wants a sixth overview mode that helps identify where the route is broadly problematic.
- The right-hand panel should keep the existing structure, but in composite mode it should list all five burden values in descending order and allow click-through into a single burden view.
- Existing UI structure must remain intact.

**Design**
- Add a new `composite` view mode to the existing burden-view select.
- Composite burden value uses the current five burden scores already normalized to `0-100`, combined by equal-weight average.
- Keep the combination in the front-end view/inspection layer rather than rewriting the simulation core, so the change stays local and reversible.
- In composite mode:
  - Map shows a dedicated composite heatmap.
  - Right panel reuses the current hotspot card layout.
  - Cards become a five-item burden ranking list, ordered high to low.
  - Clicking one card switches the active view to the corresponding single burden heatmap.
- Retune all palettes to reduce fluorescence:
  - locomotor: green family
  - sensory: yellow family
  - cognitive: blue family
  - psychological: orange family
  - vitality: red family
  - composite: blue → green → yellow → orange → red
- Use lower saturation and lower mid/high lightness so the map still reads clearly when values are low, while keeping strong contrast between low and high burden.

**Testing**
- Extend palette validation to confirm the composite view exists and the per-view legends stay wired.
- Extend inspector-panel validation to confirm composite mode returns five ranked burden cards with click-through target view ids.
- Re-run existing inspector and heatmap validations after implementation.
