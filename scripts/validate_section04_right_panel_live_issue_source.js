const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getVisualizationDetailIssuePanelState\(activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\)\s*\{[\s\S]*const inspection = state\.scenario \? getCurrentFocusInspection\(\) : null;[\s\S]*InspectorUtils\.buildIssuePanelState\(/.test(appJs),
  'Expected Section04 right panel to build issue state from the live focus inspection without requiring a selectedDynamic gate'
);

assert(
  /function buildVisualizationDetailBurdenRankingMarkup\(issueItems, activeView, locale\)\s*\{[\s\S]*visualization-detail__burden-ranking[\s\S]*data-detail-burden-view/.test(appJs)
  && /function buildVisualizationDetailIssuesMarkup\(\)\s*\{[\s\S]*const activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\);[\s\S]*const panelState = getVisualizationDetailIssuePanelState\(activeView\);[\s\S]*activeView === COMPOSITE_BURDEN_VIEW[\s\S]*buildVisualizationDetailBurdenRankingMarkup/.test(appJs),
  'Expected Section04 right panel markup to always render composite burden ranking cards from the live detail issue state'
);

assert(
  /function buildVisualizationDetailIssueCardMarkup\(item, options = \{\}\)\s*\{[\s\S]*data-detail-hotspot-id/.test(appJs)
  && /function buildVisualizationDetailBurdenRankingMarkup\(issueItems, activeView, locale\)\s*\{[\s\S]*data-detail-burden-view/.test(appJs)
  && /function handleVisualizationDetailIssueClick\(event\)\s*\{[\s\S]*const burdenButton = event\.target\.closest\('\[data-detail-burden-view\]'\);[\s\S]*const hotspotCard = event\.target\.closest\('\[data-detail-hotspot-id\]'\);/.test(appJs),
  'Expected Section04 right panel cards to support both hotspot highlighting and burden-view switching'
);

console.log('validate_section04_right_panel_live_issue_source: ok');
