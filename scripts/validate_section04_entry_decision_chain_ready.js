const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function openVisualizationDetailView\(viewId = COMPOSITE_BURDEN_VIEW\)\s*\{[\s\S]*ensurePlaybackScenarioState\(\);[\s\S]*syncScenarioToPlaybackArtifacts\(getActivePlayback\(\) \|\| state\.scenario\?\.precomputedPlayback \|\| null\);[\s\S]*requestRender\(\);[\s\S]*\}/.test(appJs),
  'Expected Section04 open flow to sync playback llmDecisionPlan artifacts before rendering the detail view'
);

console.log('validate_section04_entry_decision_chain_ready: ok');
