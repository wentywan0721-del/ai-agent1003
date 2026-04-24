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
      progress: 0.52,
      restState: 'sitting',
      selectedTargetNodeId: 'gate_out_1',
      decisionDiagnostics: {
        decisionNodeId: 'gate_out_3',
      },
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      progress: 0.52,
      restState: 'sitting',
      time: 90,
      selectedTargetNodeId: 'gate_out_1',
    };
  },
  getActivePlayback() {
    return {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 120, progress: 1 },
      ],
      summary: {
        duration: 120,
      },
    };
  },
  state: {
    scenario: {
      playbackRevealTime: 90,
      focusAgent: {
        progress: 0.52,
        restState: 'sitting',
        selectedTargetNodeId: 'gate_out_1',
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'gate_out_3', timeSeconds: 0 },
  { order: 2, nodeId: 'path_sample_2', timeSeconds: 18 },
  { order: 3, nodeId: 'path_sample_5', timeSeconds: 42 },
  { order: 4, nodeId: 'path_sample_5', timeSeconds: 67 },
  { order: 5, nodeId: 'path_sample_8', timeSeconds: 90 },
  { order: 6, nodeId: 'gate_out_1', timeSeconds: 118 },
];

const activeOrder = context.getVisualizationDetailTimelineActiveOrder(timeline);
assert.strictEqual(
  activeOrder,
  5,
  'when grounded timeline times exist, Section04 should follow playback time order even if an earlier decision node id is still present in runtime inspection'
);

const collapsedTimeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 80, progress: 0.2 },
  { order: 2, nodeId: 'path_sample_2', timeSeconds: 80, progress: 0.4 },
  { order: 3, nodeId: 'path_sample_3', timeSeconds: 80, progress: 0.6 },
  { order: 4, nodeId: 'path_sample_4', timeSeconds: 80, progress: 0.8 },
];
const collapsedActiveOrder = context.getVisualizationDetailTimelineActiveOrder(collapsedTimeline);
assert.strictEqual(
  collapsedActiveOrder,
  2,
  'if all grounded times collapse to the same timestamp, Section04 should follow the latest reached progress step instead of switching early to the next item'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.55,
  restState: 'none',
  selectedTargetNodeId: null,
  decisionDiagnostics: {
    decisionNodeId: null,
  },
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.55,
  restState: 'none',
  time: 55,
  selectedTargetNodeId: null,
});
context.getActivePlayback = () => ({
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 100, progress: 1 },
  ],
  summary: {
    duration: 100,
  },
});
context.state.scenario = {
  playbackRevealTime: 55,
  focusAgent: {
    progress: 0.55,
    restState: 'none',
    selectedTargetNodeId: null,
    activeDecisionNodeId: null,
  },
};

const progressOnlyTimeline = [
  { order: 1, nodeId: 'custom_start', progress: 0 },
  { order: 2, nodeId: 'path_sample_2', progress: 0.3 },
  { order: 3, nodeId: 'path_sample_3', progress: 0.6 },
  { order: 4, nodeId: 'path_sample_4', progress: 0.9 },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(progressOnlyTimeline),
  2,
  'when timeline items carry explicit progress markers, Section04 should stay on the current step until the next step progress is actually reached'
);

const untimedSampleTimeline = [
  { order: 1, nodeId: 'custom_start' },
  { order: 2, nodeId: 'path_sample_2' },
  { order: 3, nodeId: 'path_sample_3' },
  { order: 4, nodeId: 'path_sample_4' },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedSampleTimeline),
  2,
  'when only sample-based progress fallback is available, Section04 should use floor semantics instead of switching at the midpoint between two steps'
);

const untimedGenericTimeline = [
  { order: 1, nodeId: 'gate_a' },
  { order: 2, nodeId: 'gate_b' },
  { order: 3, nodeId: 'gate_c' },
  { order: 4, nodeId: 'gate_d' },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedGenericTimeline),
  2,
  'when only evenly spaced progress fallback is available, Section04 should not light the next generic step before the threshold is crossed'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.143,
  restState: 'none',
  selectedTargetNodeId: 'es_down_1_top',
  decisionDiagnostics: {
    decisionNodeId: 'gate_out_2',
  },
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.143,
  restState: 'none',
  time: 28.62,
  selectedTargetNodeId: 'es_down_1_top',
});
context.getActivePlayback = () => ({
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 197.1, progress: 0.997 },
  ],
  summary: {
    duration: 197.1,
  },
});
context.state.scenario = {
  playbackRevealTime: 28.62,
  focusAgent: {
    progress: 0.143,
    restState: 'none',
    selectedTargetNodeId: 'es_down_1_top',
    activeDecisionNodeId: 'gate_out_2',
  },
};

const untimedMixedTimeline = [
  { order: 1, nodeId: 'gate_out_3' },
  { order: 2, nodeId: 'gate_out_3' },
  { order: 3, nodeId: 'path_sample_2' },
  { order: 4, nodeId: 'gate_out_2' },
  { order: 5, nodeId: 'path_sample_9' },
  { order: 6, nodeId: 'path_sample_9' },
  { order: 7, nodeId: 'path_sample_11' },
  { order: 8, nodeId: 'path_sample_11' },
  { order: 9, nodeId: 'es_up_1_top' },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedMixedTimeline),
  3,
  'when grounded times are absent, Section04 should prefer progress-mapped sample steps over stale decisionNodeId matches so the highlight does not jump backward'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.629,
  restState: 'short-rest',
  selectedTargetNodeId: 'es_down_1_top',
  decisionDiagnostics: {
    decisionNodeId: null,
  },
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.629,
  restState: 'short-rest',
  time: 124.74,
  selectedTargetNodeId: 'es_down_1_top',
});
context.getActivePlayback = () => ({
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 197.1, progress: 0.997 },
  ],
  summary: {
    duration: 197.1,
  },
});
context.state.scenario = {
  playbackRevealTime: 124.74,
  focusAgent: {
    progress: 0.629,
    restState: 'short-rest',
    selectedTargetNodeId: 'es_down_1_top',
    activeDecisionNodeId: null,
  },
};
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedMixedTimeline),
  3,
  'when grounded times are absent, Section04 should not jump ahead to a later rest step before the next sample threshold is actually reached'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.02,
  restState: 'none',
  selectedTargetNodeId: 'gate_out_1',
  decisionDiagnostics: {
    decisionNodeId: null,
  },
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.02,
  restState: 'none',
  time: 2.34,
  selectedTargetNodeId: 'gate_out_1',
});
context.getActivePlayback = () => ({
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 117.9, progress: 1 },
  ],
  summary: {
    duration: 117.9,
  },
});
context.state.scenario = {
  playbackRevealTime: 2.34,
  focusAgent: {
    progress: 0.02,
    restState: 'none',
    selectedTargetNodeId: 'gate_out_1',
    activeDecisionNodeId: null,
  },
};

const untimedDuplicateTargetTimeline = [
  { order: 1, nodeId: 'gate_in_2' },
  { order: 2, nodeId: 'gate_in_2' },
  { order: 3, nodeId: 'gate_in_2' },
  { order: 4, nodeId: 'gate_in_2' },
  { order: 5, nodeId: 'gate_in_2' },
  { order: 6, nodeId: 'gate_in_2' },
  { order: 7, nodeId: 'gate_out_1' },
  { order: 8, nodeId: 'gate_out_1' },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedDuplicateTargetTimeline),
  1,
  'when grounded times are absent, Section04 should not jump straight to the destination step only because selectedTargetNodeId already points at the final node'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.633,
  restState: 'none',
  selectedTargetNodeId: 'elev_3',
  decisionDiagnostics: {
    decisionNodeId: null,
  },
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.633,
  restState: 'none',
  time: 91.62,
  selectedTargetNodeId: 'elev_3',
});
context.getActivePlayback = () => ({
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 145.8, progress: 1 },
  ],
  summary: {
    duration: 145.8,
  },
});
context.state.scenario = {
  playbackRevealTime: 91.62,
  focusAgent: {
    progress: 0.633,
    restState: 'none',
    selectedTargetNodeId: 'elev_3',
    activeDecisionNodeId: null,
  },
};

const untimedRepeatedNodeTimeline = [
  { order: 1, nodeId: 'gate_in_1' },
  { order: 2, nodeId: 'elev_3' },
  { order: 3, nodeId: 'elev_3' },
  { order: 4, nodeId: 'elev_3' },
  { order: 5, nodeId: 'elev_3' },
  { order: 6, nodeId: 'elev_3' },
];
assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(untimedRepeatedNodeTimeline),
  4,
  'when a nodeId appears in multiple timeline steps, Section04 should ignore that ambiguous node match and keep following progress instead of sticking to the first duplicate step'
);

console.log('validate_section04_runtime_timeline_active_order: ok');
