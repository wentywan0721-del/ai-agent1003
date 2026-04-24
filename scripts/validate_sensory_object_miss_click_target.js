const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const inspectorUtils = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');

assert(
  /const missedTargetIds = uniqueIds\(\s*missedObjects\.flatMap\(\(item\) => \[\s*\.\.\.\(Array\.isArray\(item\?\.mapTargetIds\) \? item\.mapTargetIds : \[\]\),\s*item\?\.mapTargetId,\s*item\?\.id,\s*\]\.filter\(Boolean\)\)\s*\)/.test(inspectorUtils),
  'Expected sensory object-miss hotspots to aggregate mapTargetIds, mapTargetId, and id so they resolve to visible targets'
);

console.log('validate_sensory_object_miss_click_target: ok');
