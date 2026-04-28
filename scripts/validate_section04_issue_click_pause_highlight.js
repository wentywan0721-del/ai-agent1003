const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /selectedHotspotOverlaySnapshot:\s*null/.test(appJs),
  'Expected Section04 state to keep a selectedHotspotOverlaySnapshot for stable pressure-point highlighting'
);

assert(
  /function handleVisualizationDetailIssueClick\(event\) \{[\s\S]*state\.animationPaused = true;/.test(appJs),
  'Expected clicking a Section04 issue card to pause playback immediately'
);

assert(
  /function handleVisualizationDetailIssueClick\(event\) \{[\s\S]*state\.selectedHotspotOverlaySnapshot = \{/.test(appJs),
  'Expected clicking a Section04 issue card to capture an overlay snapshot for immediate highlight rendering'
);

assert(
  /\.visualization-detail-hotspot-ring\s*\{[\s\S]*stroke-width:\s*0\.8;[\s\S]*stroke:\s*rgba\(18,\s*78,\s*170,\s*0\.98\);/.test(css),
  'Expected Section04 pressure highlight ring to use a deep-blue 0.8px stroke'
);

console.log('validate_section04_issue_click_pause_highlight: ok');
