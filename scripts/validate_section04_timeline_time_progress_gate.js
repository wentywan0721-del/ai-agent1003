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
      progress: 0.28,
      restState: 'none',
      selectedTargetNodeId: null,
      decisionDiagnostics: null,
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      progress: 0.28,
      restState: 'none',
      time: 39,
      selectedTargetNodeId: null,
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
      playbackRevealTime: 39,
      focusAgent: {
        progress: 0.28,
        restState: 'none',
        selectedTargetNodeId: null,
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 0, progress: 0.05 },
  { order: 2, nodeId: 'path_sample_3', timeSeconds: 18, progress: 0.22 },
  { order: 3, nodeId: 'path_sample_6', timeSeconds: 34, progress: 0.5 },
  { order: 4, nodeId: 'path_sample_8', timeSeconds: 52, progress: 0.7 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(timeline),
  2,
  'When timeline times move ahead of the real route progress, Section04 should not advance to a later thought until that progress/sample threshold is actually reached'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.52,
  restState: 'none',
  selectedTargetNodeId: null,
  decisionDiagnostics: null,
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.52,
  restState: 'none',
  time: 39,
  selectedTargetNodeId: null,
});
context.state.scenario.playbackRevealTime = 39;
context.state.scenario.focusAgent.progress = 0.52;

const delayedTimestampTimeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 0, progress: 0.05 },
  { order: 2, nodeId: 'path_sample_3', timeSeconds: 18, progress: 0.22 },
  { order: 3, nodeId: 'path_sample_6', timeSeconds: 70, progress: 0.5 },
  { order: 4, nodeId: 'path_sample_8', timeSeconds: 95, progress: 0.7 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(delayedTimestampTimeline),
  3,
  'When timeline timestamps lag behind the real agent position, Section04 should follow reached route progress so the highlight does not appear late'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.88,
  restState: 'none',
  selectedTargetNodeId: null,
  decisionDiagnostics: null,
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.88,
  restState: 'none',
  time: 72,
  selectedTargetNodeId: null,
});
context.state.scenario.playbackRevealTime = 72;
context.state.scenario.focusAgent.progress = 0.88;

const finalStepEarlyProgressTimeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 0, progress: 0.05 },
  { order: 2, nodeId: 'path_sample_3', timeSeconds: 24, progress: 0.25 },
  { order: 3, nodeId: 'path_sample_6', timeSeconds: 58, progress: 0.55 },
  { order: 4, nodeId: 'path_sample_8', timeSeconds: 88, progress: 0.78 },
  { order: 5, nodeId: 'route_end', timeSeconds: 120, progress: 0.86, runtimeEventType: 'route_completed' },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(finalStepEarlyProgressTimeline),
  4,
  'The final timeline step should not light early just because its progress gate is reached before the actual end time'
);

context.getCurrentFocusInspection = () => ({
  progress: 0.72,
  restState: 'none',
  selectedTargetNodeId: null,
  decisionDiagnostics: null,
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 0.72,
  restState: 'none',
  time: 86,
  selectedTargetNodeId: null,
});
context.state.scenario.playbackRevealTime = 86;
context.state.scenario.focusAgent.progress = 0.72;

const finalThoughtBoundToMidRouteEventTimeline = [
  { order: 1, nodeId: 'path_sample_1', timeSeconds: 0, progress: 0.02 },
  { order: 2, nodeId: 'path_sample_3', timeSeconds: 30, progress: 0.25 },
  { order: 3, nodeId: 'path_sample_5', timeSeconds: 55, progress: 0.48 },
  { order: 4, nodeId: 'path_sample_7', timeSeconds: 74, progress: 0.66 },
  { order: 5, nodeId: 'path_sample_8', timeSeconds: 80, progress: 0.7 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(finalThoughtBoundToMidRouteEventTimeline),
  4,
  'The last displayed thought must not activate in the middle of a longer playback just because it was grounded to a mid-route event'
);

context.getCurrentFocusInspection = () => ({
  progress: 1,
  restState: 'none',
  selectedTargetNodeId: null,
  decisionDiagnostics: null,
});
context.getPlaybackSnapshotAtTime = () => ({
  progress: 1,
  restState: 'none',
  time: 100,
  selectedTargetNodeId: null,
});
context.getActivePlayback = () => ({
  endTime: 109.08,
  traceSnapshots: [
    { time: 0, progress: 0 },
    { time: 100, progress: 1 },
    { time: 109.08, progress: 1 },
  ],
  summary: {
    duration: 109.08,
  },
});
context.state.scenario.playbackRevealTime = 100;
context.state.scenario.focusAgent.progress = 1;

const terminalClusterTimeline = [
  { order: 1, nodeId: 'gate_in_2', timeSeconds: 0, progress: 0 },
  { order: 2, nodeId: 'path_sample_2', timeSeconds: 31.17, progress: 0.286 },
  { order: 3, nodeId: 'path_sample_3', timeSeconds: 62.33, progress: 0.571 },
  { order: 4, nodeId: 'path_sample_4', timeSeconds: 93.5, progress: 0.857 },
  { order: 5, nodeId: 'path_sample_5', timeSeconds: 109.08, progress: 1 },
  { order: 6, nodeId: 'path_sample_6', timeSeconds: 109.08, progress: 1 },
  { order: 7, nodeId: 'path_sample_7', timeSeconds: 109.08, progress: 1 },
  { order: 8, nodeId: 'route_end', timeSeconds: 109.08, progress: 1 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(terminalClusterTimeline),
  5,
  'Collapsed terminal timeline clusters should advance through the first terminal thought instead of jumping to the final thought when route progress reaches 1 early'
);

console.log('validate_section04_timeline_time_progress_gate: ok');
