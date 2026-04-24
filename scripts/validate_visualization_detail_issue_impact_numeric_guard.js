const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function getVisualizationDetailIssueImpactState\(value, locale\)/.test(appJs),
  'Expected visualization detail issue impact helper to exist'
);

assert(
  !/const score = clamp\(safeNumber\(value, 0\), 0, 100\);/.test(appJs),
  'Visualization detail issue impact helper should not call an undefined safeNumber helper, otherwise switching to the vitality view pauses the animation loop'
);

console.log('validate_visualization_detail_issue_impact_numeric_guard: ok');
