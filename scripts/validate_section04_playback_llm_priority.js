const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getPlaybackRouteAnalysisResult/.test(appJs),
  'Expected app.js to expose a helper that reads route-analysis data from playback artifacts'
);

assert(
  /shouldRequestRouteAnalysisForCurrentState[\s\S]*getPlaybackRouteAnalysisResult\(.*\)[\s\S]*return false;/.test(appJs),
  'Expected Section04 to skip the legacy route-analysis request when playback already contains llmDecisionPlan'
);

assert(
  /buildSharedRouteAnalysisSnapshot[\s\S]*getPlaybackRouteAnalysisResult\(.*\)[\s\S]*localizeRouteAnalysisOutput\(playbackAnalysis, locale\)/.test(appJs),
  'Expected Section04 shared snapshot building to prefer playback llmDecisionPlan over the legacy state machine'
);

console.log('validate_section04_playback_llm_priority: ok');
