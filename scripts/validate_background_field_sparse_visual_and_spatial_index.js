const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const coreSource = fs.readFileSync(path.join(rootDir, 'src', 'core.js'), 'utf8');

assert(
  /visualFrameStepSeconds/.test(coreSource),
  'background field precompute should support a separate sparse visual frame interval'
);

assert(
  /summaryFrames/.test(coreSource)
    && /const densityFrames = providedDensityFrames/.test(coreSource)
    && /const queueFrames = providedQueueFrames/.test(coreSource),
  'background field should keep dense density/queue summary frames separate from sparse playback frames'
);

assert(
  /buildScenarioAgentSpatialIndex/.test(coreSource)
    && /scenario\._agentSpatialIndex/.test(coreSource)
    && /getNearbyAgentsFromSpatialIndex/.test(coreSource),
  'agent avoidance should use a per-substep spatial index instead of scanning every agent pair'
);

assert(
  /scenario\._agentSpatialIndex\s*=\s*buildScenarioAgentSpatialIndex/.test(coreSource),
  'stepScenario should build the spatial index once per substep before advancing agents'
);

assert(
  /getNearbyAgentsFromSpatialIndex\(scenario,\s*point,\s*BACKGROUND_LOCAL_DENSITY_RADIUS\)/.test(coreSource),
  'crowd-density sampling during live background simulation should use the same spatial index'
);

console.log('validate_background_field_sparse_visual_and_spatial_index: ok');
