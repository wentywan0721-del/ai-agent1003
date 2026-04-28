const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function shouldRequestRouteAnalysisForCurrentState\(\)\s*\{[\s\S]*getPlaybackRouteAnalysisResult\(\)[\s\S]*return false;[\s\S]*\}/.test(appJs),
  'Expected Section 04 to stop auto-requesting the legacy route-analysis endpoint'
);

assert(
  /const analysisKind = String\(analysis\?\.analysisKind \|\| ''\);/.test(appJs)
  && /analysisKind === 'decision-plan'[\s\S]*sections: localizedSections/.test(appJs),
  'Expected decision-plan outputs to avoid falling back to the legacy risk/reason/advice sections'
);

console.log('validate_section04_decision_chain_only: ok');
