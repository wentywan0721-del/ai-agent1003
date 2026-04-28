const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  /scenario\.backgroundFieldSummaryOnlyActive\s*=\s*summaryOnly/.test(coreSource),
  'summary-only background sync should mark the scenario so downstream movement code can avoid stale playback agents'
);

assert(
  /scenario\?\.backgroundFieldSummaryOnlyActive[\s\S]*?agent\.isFocusAgent/.test(coreSource),
  'avoidance should skip stale background playback agents while focus precompute is using summary-only background sync'
);

assert(
  /scenario\.backgroundFieldSummaryOnlyActive\s*=\s*false/.test(coreSource),
  'full background sync should clear summary-only mode for normal playback/materialized agent sync'
);

console.log('validate_background_field_summary_avoidance: ok');
