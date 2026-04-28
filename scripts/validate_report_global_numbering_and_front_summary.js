const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const simServerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  appJs.includes('function buildReportPressurePointReferenceMarkup('),
  'Expected a single helper for rendering color-numbered pressure point references'
);

assert(
  /buildReportPressurePointIndex[\s\S]*\.sort\(\(left, right\) => Number\(right\.contribution/.test(appJs),
  'Expected global report pressure numbers to be assigned by total focus-agent contribution'
);

assert(
  appJs.includes('globalPressurePointRanking')
    && appJs.includes('hotZoneEvidence')
    && appJs.includes('regionPressurePoints'),
  'Expected LLM input to include global pressure point ranking and per-hot-zone evidence'
);

assert(
  appJs.includes('buildReportFrontHotZoneProblemItems(reportData)')
    && appJs.includes('buildReportFrontModificationItems(reportData)'),
  'Expected front page to be generated from numbered hot-zone and pressure-point evidence'
);

assert(
  !/\bZone [123]\b/.test(appJs),
  'Report generation should not hard-code or encourage ambiguous Zone labels'
);

assert(
  appJs.includes("color: '#264f87'")
    && appJs.includes("color: '#d76a52'")
    && appJs.includes("color: '#c84949'"),
  'Expected softened five-level burden color scale for report scores'
);

assert(
  simServerJs.includes('Do not use ambiguous Zone labels')
    && simServerJs.includes('Only refer to stressors by the supplied global pressure-point numbers'),
  'Expected LLM prompt to forbid invented zone labels and pressure-point numbering'
);

console.log('validate_report_global_numbering_and_front_summary: ok');
