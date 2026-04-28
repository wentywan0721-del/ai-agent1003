const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(projectRoot, 'src', 'app.js'), 'utf8');

const normalizeSourceMatch = appJs.match(/function normalizeLocalHeatmapPlayback\(result\) \{[\s\S]*?\n  \}/);
assert(normalizeSourceMatch, 'Expected normalizeLocalHeatmapPlayback to exist');

const context = {
  cloneBackgroundPlaybackField(value) {
    return value ? { ...value } : value;
  },
};
vm.createContext(context);
vm.runInContext(`${normalizeSourceMatch[0]}; this.normalizeLocalHeatmapPlayback = normalizeLocalHeatmapPlayback;`, context);

const llmDecisionPlan = {
  analysisKind: 'decision-plan',
  timeline: [
    { order: 1, nodeId: 'gate_in_2', thoughtZh: '先看清楚方向。', timeSeconds: 0, progress: 0 },
    { order: 2, nodeId: 'path_sample_3', thoughtZh: '前面有点挤，我慢一点。', timeSeconds: 24, progress: 0.28 },
  ],
};

const normalized = context.normalizeLocalHeatmapPlayback({
  heat: {
    traceSnapshots: [
      { time: 0, progress: 0 },
      { time: 80, progress: 1 },
    ],
    pressureRange: { min: 0, max: 100 },
    duration: 80,
    startTime: 0,
    endTime: 80,
    heat: {
      cells: [{ index: 1, heat: 12, pressure: 8, fatigue: 3, progress: 0.2 }],
    },
    hotspots: [],
    suggestions: [],
    summary: { averageTravelTime: 80 },
    backgroundField: null,
    llmDecisionPlan,
  },
  meta: {
    llmDecisionPlan,
  },
});

assert.strictEqual(
  JSON.stringify(normalized.llmDecisionPlan),
  JSON.stringify(llmDecisionPlan),
  'Expected normalizeLocalHeatmapPlayback to preserve playback.llmDecisionPlan so Section04 can render cached thought timeline without re-requesting'
);

assert.strictEqual(
  JSON.stringify(normalized.meta.llmDecisionPlan),
  JSON.stringify(llmDecisionPlan),
  'Expected normalizeLocalHeatmapPlayback to preserve meta.llmDecisionPlan for cache reuse across refreshes'
);

assert(
  /function getPlaybackRouteAnalysisResult\(\)/.test(appJs),
  'Expected app.js to expose a helper that reads cached llmDecisionPlan from playback artifacts'
);

assert(
  /function getVisualizationDetailTimelineActiveOrder\(timeline = \[\]\)/.test(appJs),
  'Expected app.js to expose Section04 active-timeline selection based on playback time or progress'
);

assert(
  /buildVisualizationDetailCotMarkup[\s\S]*getPlaybackRouteAnalysisResult\(\)/.test(appJs),
  'Expected Section04 thought timeline renderer to consume playback-provided llmDecisionPlan instead of rebuilding a fake summary locally'
);

console.log('validate_section04_llm_thought_timeline_integration: ok');
