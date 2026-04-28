const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const inspectorUtilsJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function getVisualizationDetailIssuePanelState\(activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\)\s*\{[\s\S]*const inspection = state\.scenario \? getCurrentFocusInspection\(\) : null;/.test(appJs)
  && /function buildVisualizationDetailIssuesMarkup\(\)\s*\{[\s\S]*const activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\);[\s\S]*const panelState = getVisualizationDetailIssuePanelState\(activeView\);/.test(appJs),
  'Expected Section04 issue panel state to follow the live focus-agent inspection even without clicking the agent first'
);

assert(
  /function buildVitalityStatusCard\(inspection, locale\) \{[\s\S]*isStatusCard:\s*true/.test(inspectorUtilsJs)
  && /function buildVitalityIssueItems\(inspection, locale, topPressureSources\) \{[\s\S]*buildVitalityStatusCard\(inspection, locale\)[\s\S]*buildVitalityReasonItems\(inspection, locale, topPressureSources\)/.test(inspectorUtilsJs),
  'Expected vitality issue items to include one status card plus Top 3 reason cards'
);

assert(
  /const vitalityStatusItem = activeView === 'vitality'[\s\S]*item\.isStatusCard/.test(appJs)
  && /const detailIssueItems = activeView === 'vitality'[\s\S]*filter\(\(item\) => !item\.isStatusCard\)\.slice\(0,\s*3\)/.test(appJs),
  'Expected Section04 vitality issue panel to render one status card plus Top 3 reason cards'
);

assert(
  /function buildVisualizationDetailIssueCardMarkup\(item, options = \{\}\)\s*\{[\s\S]*visualization-detail__issue-impact/.test(appJs)
  && /item\.showImpact === false/.test(appJs),
  'Expected Section04 issue cards to render an explicit impact row when enabled'
);

assert(
  /\.visualization-detail__issue-impact\s*\{[\s\S]*display:\s*flex;/.test(stylesCss)
  && /\.visualization-detail__issue-panel--status\s*\{/.test(stylesCss),
  'Expected styles for vitality status cards and impact rows'
);

assert(
  /const hotspotLinkId = hotspotTargets\.length \? \(item\.id \|\| item\.mapTargetId \|\| item\.mapTargetIds\?\.\[0\] \|\| ''\) : '';/m.test(appJs)
  && /data-detail-hotspot-id="\$\{escapeHtml\(hotspotLinkId\)\}"/.test(appJs),
  'Expected Section04 issue cards with explicit pressure targets to expose a clickable hotspot id'
);

assert(
  /function handleVisualizationDetailIssueClick\(event\)\s*\{[\s\S]*const burdenButton = event\.target\.closest\('\[data-detail-burden-view\]'\);[\s\S]*const hotspotCard = event\.target\.closest\('\[data-detail-hotspot-id\]'\);[\s\S]*state\.selectedHotspotId = state\.selectedHotspotId === hotspot\.id \? null : hotspot\.id;/.test(appJs),
  'Expected Section04 issue-panel clicks to support pressure hotspot highlighting and burden-view switching'
);

assert(
  /\.visualization-detail__issue-panel\.is-clickable\s*\{[\s\S]*cursor:\s*pointer;/.test(stylesCss)
  && /\.visualization-detail__issue-panel\.is-active\s*\{[\s\S]*border-color:\s*rgba\(56,\s*210,\s*235,\s*0\.34\);/.test(stylesCss),
  'Expected Section04 clickable issue cards to have active selection styling'
);

console.log('validate_visualization_detail_issue_panel: ok');
