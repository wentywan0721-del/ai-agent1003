const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /visualizationDetailSelectedIssue:\s*null/.test(appJs),
  'Expected Section04 state to keep a stable selected issue snapshot for map highlighting'
);

assert(
  /function getHotspotById\(id = state\.selectedHotspotId\) \{[\s\S]*state\.visualizationDetailSelectedIssue/.test(appJs)
  && /function getSelectedHotspotOverlayItems\(\) \{[\s\S]*state\.visualizationDetailSelectedIssue/.test(appJs),
  'Expected Section04 hotspot resolution to reuse the selected issue snapshot instead of depending only on the live Top3 list'
);

assert(
  /function handleVisualizationDetailIssueClick\(event\) \{[\s\S]*state\.visualizationDetailSelectedIssue = \{[\s\S]*mapTargetIds:/.test(appJs),
  'Expected Section04 issue-card clicks to capture a stable selected issue snapshot with target ids'
);

console.log('validate_section04_issue_highlight_snapshot: ok');
