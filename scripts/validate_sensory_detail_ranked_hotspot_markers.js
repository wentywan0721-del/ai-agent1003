const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function shouldRenderInlineHotspotRank\(activeViewMode, hotspot\)/.test(appJs),
  'Expected a dedicated helper for deciding whether inline hotspot ranks should render'
);

assert(
  /activeViewMode === 'sensory'[\s\S]*hotspotId === 'sensory-noise' \|\| hotspotId === 'sensory-lighting'/.test(appJs),
  'Expected sensory inline hotspot numbering to be limited to sensory-noise and sensory-lighting'
);

assert(
  /activeView === 'vitality' \|\| activeView === 'sensory'[\s\S]*buildVisualizationDetailVitalityIssueCardMarkup/.test(appJs),
  'Expected sensory detail issue cards to reuse the vitality-style impact card renderer'
);

console.log('validate_sensory_detail_ranked_hotspot_markers: ok');
