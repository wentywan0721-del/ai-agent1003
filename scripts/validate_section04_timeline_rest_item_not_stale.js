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
      progress: 0.36,
      restState: 'none',
      selectedTargetNodeId: null,
      decisionDiagnostics: null,
      topBurdenId: 'locomotor',
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      time: 36,
      progress: 0.36,
      restState: 'none',
      selectedTargetNodeId: null,
      topBurdenId: 'locomotor',
    };
  },
  getActivePlayback() {
    return {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 100, progress: 1 },
      ],
      summary: { duration: 100 },
    };
  },
  state: {
    scenario: {
      playbackRevealTime: 36,
      focusAgent: {
        progress: 0.36,
        restState: 'none',
        selectedTargetNodeId: null,
        topBurdenId: 'locomotor',
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 0, progress: 0.02 },
  {
    order: 2,
    nodeId: 'path_sample_3',
    timeSeconds: 20,
    progress: 0.25,
    triggerKind: 'runtime_event',
    triggerEventType: 'short_rest_started',
    runtimeRestState: 'short-rest',
  },
  { order: 3, nodeId: 'path_sample_6', timeSeconds: 60, progress: 0.58 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(timeline),
  1,
  'After rest has ended, Section04 should not keep a rest thought highlighted through the generic time fallback'
);

console.log('validate_section04_timeline_rest_item_not_stale: ok');
