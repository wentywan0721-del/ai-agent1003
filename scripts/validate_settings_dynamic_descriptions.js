const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const dimensionScores = getEditableCapacityScores\(state\.agentModal\.draft\?\.capacityScores\);/.test(appJs),
  'Expected the settings screen to derive live dimension scores from the current radar draft'
);

assert(
  /getDimensionAgentSettingDescription\(id,\s*dimensionScores\[id\],\s*state\.locale\)\s*\|\|\s*getDimensionOverviewDescription\(id,\s*state\.locale\)/.test(appJs),
  'Expected the settings description cards to use score-based rule descriptions with overview fallback'
);

console.log('validate_settings_dynamic_descriptions: ok');
