const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const inspectorUtilsJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function getDisplayedHotspots\(\) \{[\s\S]*const inspection = state\.selectedDynamic[\s\S]*getDynamicInspection\(\)[\s\S]*getCurrentFocusInspection\(\)/.test(appJs)
  && /function getVisualizationDetailIssuePanelState\(activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\) \{[\s\S]*const inspection = state\.scenario \? getCurrentFocusInspection\(\) : null;/.test(appJs)
  && /function buildVisualizationDetailIssuesMarkup\(\) \{[\s\S]*const inspection = state\.scenario \? getCurrentFocusInspection\(\) : null;[\s\S]*const panelState = getVisualizationDetailIssuePanelState\(activeView\);/.test(appJs),
  'Expected Section 04 issue panel state to follow the live focus-agent inspection even without clicking the agent first'
);

assert(
  /function buildVitalityStatusCard\(inspection, locale\) \{[\s\S]*isStatusCard:\s*true/.test(inspectorUtilsJs)
  && /function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*sortIssueItems\([\s\S]*,\s*3\)/.test(inspectorUtilsJs)
  && /function buildVitalityIssueItems\(inspection, locale, topPressureSources\) \{[\s\S]*buildVitalityStatusCard\(inspection, locale\)[\s\S]*buildVitalityReasonItems\(inspection, locale, topPressureSources\)/.test(inspectorUtilsJs),
  'Expected vitality issue items to include one status card plus Top 3 reason cards'
);

assert(
  /const issueItems = panelState\.mode === 'issues' \? panelState\.items : \[\];[\s\S]*const vitalityStatusItem = activeView === 'vitality' \? issueItems\.find\(\(item\) => item\.isStatusCard\) \|\| null : null;[\s\S]*const detailIssueItems = activeView === 'vitality'[\s\S]*issueItems\.filter\(\(item\) => !item\.isStatusCard\)\.slice\(0,\s*3\)[\s\S]*: \(activeView !== COMPOSITE_BURDEN_VIEW \? issueItems\.slice\(0,\s*3\) : issueItems\);/.test(appJs),
  'Expected Section 04 vitality issue panel to render one status card plus Top 3 reason cards'
);

assert(
  /visualization-detail__issue-impact/.test(appJs)
  && /showImpact/.test(appJs),
  'Expected Section 04 issue cards to render an explicit impact row when enabled'
);

assert(
  /\.visualization-detail__issue-impact\s*\{[\s\S]*display:\s*flex;/.test(stylesCss)
  && /\.visualization-detail__issue-panel--status\s*\{/.test(stylesCss),
  'Expected styles for vitality status cards and impact rows'
);

assert(
  /const hotspotTargets = resolveHotspotTargets\(item\);[\s\S]*const hotspotLinkId = hotspotTargets\.some\(\(target\) => target\.type === 'pressure'\) \? \(item\.id \|\| item\.mapTargetId \|\| ''\) : '';/.test(appJs)
  && /data-detail-hotspot-id="\$\{escapeHtml\(hotspotLinkId\)\}"/.test(appJs),
  'Expected Section 04 issue cards with explicit pressure targets to expose a clickable hotspot id'
);

assert(
  /function handleVisualizationDetailIssueClick\(event\) \{[\s\S]*const hotspotCard = event\.target\.closest\('\[data-detail-hotspot-id\]'\);[\s\S]*state\.selectedHotspotId = hotspot\.id;[\s\S]*requestRender\(\);[\s\S]*const button = event\.target\.closest\('\[data-detail-burden-view\]'\);/.test(appJs),
  'Expected Section 04 issue-panel clicks to support pressure hotspot highlighting and burden-view switching'
);

assert(
  /\.visualization-detail__issue-panel\.is-clickable\s*\{[\s\S]*cursor:\s*pointer;/.test(stylesCss)
  && /\.visualization-detail__issue-panel\.is-active\s*\{[\s\S]*border-color:\s*rgba\(56,\s*210,\s*235,\s*0\.34\);/.test(stylesCss),
  'Expected Section 04 clickable issue cards to have active selection styling'
);

console.log('validate_visualization_detail_issue_panel: ok');
