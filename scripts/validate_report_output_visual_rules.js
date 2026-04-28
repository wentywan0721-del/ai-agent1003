const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /pageThreeHeatTitle:\s*zh\s*\?\s*'热力图结果'\s*:\s*'Heatmap Results'/.test(appJs),
  'Expected report heatmap section title to be 热力图结果 / Heatmap Results'
);

assert(
  /showHitTargets\s*=\s*options\.showHitTargets\s*!==\s*false/.test(appJs)
    && /handleRadius\s*=\s*Math\.max/.test(appJs)
    && /activeHandleRadius\s*=\s*Math\.max/.test(appJs)
    && /showHitTargets\s*\?\s*`[\s\S]*agent-radar-hit/.test(appJs)
    && /buildAgentRadarSvg\(\{ capacityScores \}, locale, \{[\s\S]*showHitTargets:\s*false[\s\S]*handleRadius:\s*5[\s\S]*activeHandleRadius:\s*5/.test(appJs),
  'Expected exported report radar to use small colored handles without large hit targets'
);

assert(
  /\.agent-radar-handle\s*\{[^}]*fill:var\(--radar-handle-fill\)/.test(appJs),
  'Expected report CSS to preserve per-dimension radar handle colors'
);

assert(
  appJs.includes('function resolveReportDecisionPoint(item, traceSnapshots) {')
    && appJs.includes('resolveReportDecisionPoint(item, traceSnapshots)')
    && appJs.includes('item?.triggerEventId || item?.trigger_event_id')
    && appJs.includes('item?.nodeId || item?.node_id')
    && appJs.includes('class="report-decision-ring"')
    && appJs.includes('class="report-decision-dot"'),
  'Expected report decision points to resolve real trigger locations and render dot plus black ring'
);

assert(
  appJs.includes('function createReportHeatRasterDataUrl(viewMode, cells, transform, options = {}) {')
    && appJs.includes('createHeatFieldRasterLegacy(')
    && appJs.includes('buildHeatDisplayProfile(localMetricValues, heatmapStyle)')
    && appJs.includes('clipHeatmapToWalkableArea(ctx, transform)')
    && appJs.includes('paintHeatSurface(ctx, heatSurface')
    && appJs.includes('clearHeatmapObstacles(ctx, transform)')
    && appJs.includes('heatSurface.toDataURL(')
    && !/class="report-heat-cell/.test(appJs),
  'Expected report heatmaps to reuse the product raster heat surface instead of SVG circle approximations'
);

assert(
  appJs.includes('const REPORT_HIGH_HEAT_TOP_PERCENT = 0.2;')
    && appJs.includes('const REPORT_DETAIL_HIGH_REGION_LIMIT = 3;')
    && appJs.includes('function getReportHighHeatRegions(viewMode, options = {}) {')
    && appJs.includes('sampleQuantile(metricValues, 1 - REPORT_HIGH_HEAT_TOP_PERCENT)')
    && appJs.includes('function clusterReportHighHeatCells(cells, options = {}) {')
    && appJs.includes('.sort((left, right) => Number(right.area || 0) - Number(left.area || 0)')
    && appJs.includes('REPORT_DETAIL_HIGH_REGION_LIMIT')
    && appJs.includes('region.index')
    && appJs.includes('function buildCompositeRegionContributionRankings(region, locale = getReportLocale()) {')
    && appJs.includes('function buildSingleBurdenRegionIssueAdvice(region, viewMode, locale = getReportLocale(), regionPressurePoints = []) {')
    && appJs.includes('function getReportRegionInfluencingPressurePoints(region, pressurePoints = [], viewMode = COMPOSITE_BURDEN_VIEW) {'),
  'Expected detailed report heatmaps to extract the three largest current top 20% heat regions and region pressure influences'
);

assert(
  /const isCompositeSummary = viewMode === COMPOSITE_BURDEN_VIEW;/.test(appJs)
    && /const issues = isCompositeSummary\s*\?\s*\[\]/.test(appJs)
    && /issues,/.test(appJs)
    && /const mapPressurePoints = getUniqueReportPressurePoints\(regionPressurePoints\);/.test(appJs)
    && /regionRankings: isCompositeSummary/.test(appJs)
    && /regionIssues: isCompositeSummary\s*\?\s*\[\]/.test(appJs)
    && /regionPressurePoints: regionPressurePoints/.test(appJs)
    && /pressurePoints: mapPressurePoints/.test(appJs)
    && /card\.id !== COMPOSITE_BURDEN_VIEW/.test(appJs),
  'Expected detailed cards to show composite per-region contribution rankings and single-burden per-region issue advice'
);

assert(
  /\.report-page\s*\{[^}]*gap:10mm/.test(appJs)
    && /\.report-section\s*\{[^}]*gap:3\.5mm/.test(appJs),
  'Expected major report sections to use a 10mm gap and title-to-content spacing to use a 3.5mm gap'
);

assert(
  appJs.includes('thoughtMapNote')
    && appJs.includes('report-thought-note')
    && /<div class="report-thought-note">\$\{escapeHtml\(copy\.thoughtMapNote\)\}<\/div>/.test(appJs),
  'Expected Agent Thought Chain to explain that black ring/dot markers show where thoughts were triggered'
);

assert(
  /\.report-high-label text\s*\{[^}]*fill:#111;[^}]*font-size:2px/.test(appJs)
    && /region\.vitalitySurge\s*\?\s*`<circle/.test(appJs)
    && !/worldRadiusForPixels\(region\.vitalitySurge \? 18 : 7\.2, transform\)/.test(appJs)
    && appJs.includes('aspect-ratio:860 / 400;')
    && appJs.includes('computeTransformForViewportSize(860, 400)'),
  'Expected detail heat region labels to use 2px numbers, remove non-fatigue outer rings, and keep large detail map frames'
);

assert(
  /\.report-pressure-marker text\s*\{[^}]*fill:#111;[^}]*font-size:1\.12px;[^}]*font-weight:900;[^}]*stroke:none/.test(appJs)
    && !/\.report-pressure-marker text\s*\{[^}]*paint-order:stroke/.test(appJs),
  'Expected numbered pressure-point markers to use large pure black numbers without white outline'
);

assert(
  appJs.includes('class="report-detail-region-row"')
    && appJs.includes('class="report-detail-region-advice"')
    && appJs.includes('class="report-detail-region-pressure-ranking"')
    && appJs.includes('class="report-pressure-number report-pressure-number--filled"')
    && !appJs.includes('class="report-detail-region-pressure"')
    && !appJs.includes('buildRegionPressureText(item.index)'),
  'Expected detailed burden text to render one row per region with advice on the left and numbered ranked influencing stressors on the right'
);

assert(
  appJs.includes('function buildReportLlmAdjustmentMarkup(reportData) {')
    && appJs.includes('llmAdjustmentTitle')
    && appJs.includes('llmAdjustmentSpaceTitle')
    && appJs.includes('llmAdjustmentAreaTitle')
    && appJs.includes('llmAdjustmentFacilityTitle')
    && appJs.includes('${adjustmentMarkup}'),
  'Expected exported report to include the model/LLM adjustment recommendation summary'
);

console.log('validate_report_output_visual_rules: ok');
