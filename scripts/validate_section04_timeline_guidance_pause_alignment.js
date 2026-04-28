const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

const parseSourceMatch = appJs.match(/function parseTimelineSampleOrder\(nodeId = ''\) \{[\s\S]*?return Number\.isFinite\(order\) && order > 0 \? Math\.round\(order\) : null;\s*\}/);
assert(parseSourceMatch, 'Expected parseTimelineSampleOrder to exist');

const functionSourceMatch = appJs.match(/function getVisualizationDetailTimelineActiveOrder\(timeline = \[\]\) \{[\s\S]*?return fallbackBest\?\.order \|\| null;\s*\}/);
assert(functionSourceMatch, 'Expected getVisualizationDetailTimelineActiveOrder to exist');

const context = {
  clamp(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return min;
    }
    return Math.min(max, Math.max(min, numeric));
  },
  getCurrentFocusInspection() {
    return {
      progress: 0.5,
      restState: 'none',
      selectedTargetNodeId: null,
      decisionDiagnostics: { decisionNodeId: 'sign_2' },
      walkingSpeed: 0,
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      progress: 0.5,
      restState: 'none',
      time: 45,
      selectedTargetNodeId: null,
      walkingSpeed: 0,
      decisionDiagnostics: { decisionNodeId: 'sign_2' },
    };
  },
  getActivePlayback() {
    return {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 90, progress: 1 },
      ],
      summary: { duration: 90 },
    };
  },
  state: {
    scenario: {
      playbackRevealTime: 45,
      focusAgent: {
        progress: 0.5,
        restState: 'none',
        selectedTargetNodeId: null,
        activeDecisionNodeId: 'sign_2',
        currentWalkingSpeed: 0,
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'route_start', timeSeconds: 0, progress: 0 },
  { order: 2, nodeId: 'path_sample_2', timeSeconds: 20, progress: 0.22 },
  {
    order: 3,
    nodeId: 'sign_2',
    timeSeconds: 38,
    progress: 0.42,
    triggerKind: 'runtime_event',
    triggerEventType: 'guidance_pause',
    runtimeEventType: 'guidance_pause',
    walkingSpeed: 0,
  },
  { order: 4, nodeId: 'path_sample_5', timeSeconds: 44, progress: 0.5 },
  { order: 5, nodeId: 'route_end', timeSeconds: 90, progress: 1, runtimeEventType: 'route_completed' },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(timeline),
  3,
  'When the agent is stopped for a real guidance pause, Section04 should keep the signage-check thought highlighted instead of jumping to a generic progress thought'
);

console.log('validate_section04_timeline_guidance_pause_alignment: ok');
