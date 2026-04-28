const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function buildPlaybackFallbackDecisionPlan\(locale = state\.locale\)/.test(appJs),
  'Expected frontend playback fallback decision-chain builder'
);

assert(
  /const hasTimeline = Array\.isArray\(playbackAnalysis\.timeline\) && playbackAnalysis\.timeline\.length > 0;[\s\S]*if \(playbackAnalysis\.failed \|\| !hasTimeline\) \{[\s\S]*return buildPlaybackFallbackDecisionPlan\(locale\)/.test(appJs),
  'Expected failed or empty cached LLM analysis to be replaced by a playback-grounded fallback'
);

assert(
  /localizedThought:\s*locale === 'en' \? thoughtEn : thoughtZh/.test(appJs),
  'Expected fallback timeline entries to be directly displayable in the CoT panel'
);

console.log('validate_section04_llm_failed_cache_frontend_fallback: ok');
