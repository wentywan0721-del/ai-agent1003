const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /agentSettings:\s*\{[\s\S]*title:\s*'Attribute Settings'/.test(appJs),
  'Expected Section 02 title copy to match the screenshot: Attribute Settings'
);

assert(
  /function getDimensionCapacityLabel\(id,\s*locale = state\.locale\)\s*\{[\s\S]*id === 'locomotor'[\s\S]*return 'Locomotor Capacity';/.test(appJs),
  'Expected the locomotor capacity label to replace the old Mobility wording'
);

assert(
  /function getDimensionDisplayName\(id,\s*locale = state\.locale\)\s*\{[\s\S]*locomotor:\s*'Locomotor'/.test(appJs),
  'Expected the Section 02 display label to use Locomotor instead of Mobility'
);

assert(
  /const AGENT_PREVIEW_DIMENSION_ORDER = \['cognitive', 'sensory', 'psychological', 'vitality', 'locomotor'\];/.test(appJs),
  'Expected Section 02 right-side cards to follow the screenshot order'
);

console.log('validate_section02_attribute_preview_labels: ok');
