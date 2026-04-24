const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function buildVisualizationDetailCotMarkup\(/.test(appJs),
  'Expected app.js to define the Section04 decision-chain markup builder'
);

assert(
  /const hasPlaybackAnalysis = Boolean\(getPlaybackRouteAnalysisResult\(\)\);/.test(appJs),
  'Expected Section04 COT markup to detect playback-provided llmDecisionPlan data explicitly'
);

assert(
  /const llmAnalysis = hasPlaybackAnalysis\s*\?\s*defaultLlmAnalysis\s*:\s*localizedLlmAnalysis;/.test(appJs),
  'Expected Section04 COT markup to keep the playback llmDecisionPlan visible instead of replacing it with the legacy routeAnalysisState fallback'
);

console.log('validate_section04_playback_timeline_render: ok');
