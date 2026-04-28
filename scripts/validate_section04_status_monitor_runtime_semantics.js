const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function formatCurrentStatusLabel\(/.test(appJs),
  'Expected a dedicated formatter for the live current state label'
);

assert(
  /function formatRestMarginLabel\(/.test(appJs),
  'Expected a dedicated formatter for the live rest margin label'
);

assert(
  /function formatDecisionFocusLabel\(/.test(appJs),
  'Expected a dedicated formatter for the live decision focus label'
);

assert(
  /label:\s*t\('label\.restMargin'\),\s*value:\s*formatRestMarginLabel\(inspection/.test(appJs),
  'Expected status monitor to render rest margin from the live inspection'
);

assert(
  /label:\s*t\('label\.currentState'\),\s*value:\s*formatCurrentStatusLabel\(inspection/.test(appJs),
  'Expected status monitor to render current state from the live inspection'
);

assert(
  /label:\s*t\('label\.decisionFocus'\),\s*value:\s*formatDecisionFocusLabel\(inspection/.test(appJs),
  'Expected status monitor to render decision focus from the live inspection'
);

assert(
  /restState:\s*snapshot\.restState\s*\?\?/.test(appJs)
  && /restTargetSeatId:\s*snapshot\.restTargetSeatId\s*\?\?/.test(appJs)
  && /reservedSeatId:\s*snapshot\.reservedSeatId\s*\?\?/.test(appJs)
  && /movementBehavior:\s*dimensionState\?\.burdens\?\.locomotor\?\.movementBehavior/.test(appJs)
  && /movementMainCause:\s*dimensionState\?\.burdens\?\.locomotor\?\.movementMainCause/.test(appJs),
  'Expected playback inspection to expose the live rest, target, and locomotor state fields used by the status monitor'
);

console.log('validate_section04_status_monitor_runtime_semantics: ok');
