const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
const runnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

assert(
  coreJs.includes('decisionInteractionState: agent.decisionInteractionState || null')
    && coreJs.includes('decisionInteractionMode: agent.decisionInteractionMode || null')
    && coreJs.includes('decisionInteractionSourceId: agent.decisionInteractionSourceId || null'),
  'Expected focus trace snapshots to preserve physical guidance interaction state for runtime decision-chain events'
);

assert(
  runnerJs.includes("interactionState === 'pause'")
    && runnerJs.includes("events.push(createRuntimeEvent('guidance_pause', snapshot")
    && runnerJs.includes("reason: interactionMode || 'decision_interaction'"),
  'Expected runtime event extraction to turn actual physical sign pauses into guidance_pause timeline events'
);

assert(
  !coreJs.includes('currentTargetDistance > originTargetDistance + Math.max(0.75, DECISION_NODE_RADIUS * 0.35)'),
  'Expected sign interaction reroute safety to allow continuing from the sign point when the route-to-target remains safe'
);

console.log('validate_focus_guidance_interaction_runtime_events: ok');
