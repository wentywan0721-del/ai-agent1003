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
      progress: 0.34,
      restState: 'none',
      selectedTargetNodeId: 'elev_3',
      decisionDiagnostics: {
        decisionNodeId: 'gate_out_2',
      },
    };
  },
  getPlaybackSnapshotAtTime() {
    return {
      progress: 0.34,
      restState: 'none',
      time: 50,
      selectedTargetNodeId: 'elev_3',
      decisionDiagnostics: {
        decisionNodeId: 'gate_out_2',
      },
    };
  },
  getActivePlayback() {
    return {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 90, progress: 1 },
      ],
      summary: {
        duration: 90,
      },
    };
  },
  state: {
    scenario: {
      playbackRevealTime: 50,
      focusAgent: {
        progress: 0.34,
        restState: 'none',
        selectedTargetNodeId: 'elev_3',
        activeDecisionNodeId: 'gate_out_2',
      },
    },
  },
};

vm.createContext(context);
vm.runInContext(`${parseSourceMatch[0]}; ${functionSourceMatch[0]}; this.getVisualizationDetailTimelineActiveOrder = getVisualizationDetailTimelineActiveOrder;`, context);

const timeline = [
  { order: 1, nodeId: 'gate_in_1', timeSeconds: 0, progress: 0.02 },
  {
    order: 2,
    nodeId: 'gate_out_2',
    timeSeconds: 22,
    progress: 0.24,
    triggerKind: 'decision',
    triggerDecisionNodeId: 'gate_out_2',
    triggerTargetNodeId: 'elev_3',
  },
  { order: 3, nodeId: 'path_sample_5', timeSeconds: 44, progress: 0.31 },
  { order: 4, nodeId: 'path_sample_6', timeSeconds: 66, progress: 0.55 },
];

assert.strictEqual(
  context.getVisualizationDetailTimelineActiveOrder(timeline),
  3,
  'when grounded timeline times exist, Section04 should follow the latest reached time/progress step instead of letting a stale decision trigger hold the highlight'
);

console.log('validate_section04_timeline_trigger_priority: ok');
