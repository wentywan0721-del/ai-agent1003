# Platform Queue Shape Design

**Goal:** Align platform-door and elevator waiting crowds with the updated visual rule: irregular semicircular congestion that expands outward from the entrance, with platform-door clusters visually linking into a continuous band.

**Context**
- The current queue layout in `src/core.js` still uses a back-row queue model.
- The user wants a less regular crowd shape without rebuilding the UI or simulation architecture.
- Background crowd should keep serving density and queue-state logic; only the visible queue placement and elevator route weighting should change.

**Design**
- Keep the existing queue state machine, boarding windows, replenishment logic, and density generation unchanged.
- Replace only the queue pose placement rule in `setBackgroundAgentQueuePose(...)`.
- For platform doors:
  - Use each door as a local crowd center.
  - Place waiting passengers in an irregular outward half-ellipse.
  - Let deeper slots spread farther sideways so adjacent door crowds visually connect.
  - Keep passengers nearest to the door more concentrated, so each door still reads as a local peak.
- For the elevator:
  - Use the same outward-congestion idea, but with a smaller and tighter half-ellipse.
  - Keep the visual cluster more concentrated than platform boarding.
- Reduce background elevator destination weighting again so the elevator share drops relative to stairs/escalators.

**Testing**
- Update queue layout validation to assert outward semicircular spread instead of straight rear queuing.
- Tighten the background distribution validation so elevator route share is lower than before.
- Re-run focused background queue and render validations to catch regressions.
