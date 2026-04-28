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
      restState: 'searching',
      selectedTargetNodeId: 'seat_1',
      decisionDiagnostics: {
        decisionNodeId: null,
      },
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      progress: 0.5,
      restState: 'searching',
      time: 42,
      selectedTargetNodeId: 'seat_1',
    };
  },
  getActivePlayback() {
    return {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 84, progress: 1 },
      ],
      summary: {
        duration: 84,
      },
    };
  },
  state: {
    scenario: {
      playbackRevealTime: 42,
      focusAgent: {
        progress: 0.5,
        restState: 'searching',
        selectedTargetNodeId: 'seat_1',
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'gate_in_1', timeSeconds: 0, progress: 0.02, runtimeRestState: null },
  { order: 2, nodeId: 'path_sample_3', timeSeconds: 18, progress: 0.22, runtimeRestState: null },
  { order: 3, nodeId: 'seat_1', timeSeconds: 30, progress: 0.38, runtimeRestState: 'searching' },
  { order: 4, nodeId: 'path_sample_6', timeSeconds: 40, progress: 0.48, runtimeRestState: 'searching' },
  { order: 5, nodeId: 'path_sample_8', timeSeconds: 41, progress: 0.5, runtimeRestState: null },
  { order: 6, nodeId: 'route_end', timeSeconds: 84, progress: 1, runtimeEventType: 'route_completed' },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(timeline),
  4,
  'When the agent is still in a real searching/rest state, Section04 should keep highlighting the latest matching rest-state step instead of jumping to the next generic step too early'
);

console.log('validate_section04_timeline_rest_state_alignment: ok');
