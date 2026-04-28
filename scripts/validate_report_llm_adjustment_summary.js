const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('async function requestRouteAnalysisFromLocalService(')
    && appJs.includes("getLocalSimServerUrl('/api/route-analysis')")
    && appJs.includes('async function ensureRouteAnalysisForCurrentState(locale = getReportLocale())')
    && appJs.includes('ensureRouteAnalysisForCurrentState(reportLocale);'),
  'Expected report export/open flow to request intelligent LLM route analysis from the local sim server'
);

assert(
  appJs.includes('function buildReportRouteScoreSummary(')
    && appJs.includes('routeScoreSummary')
    && appJs.includes('report-adjustment-score')
    && appJs.includes('overallBurdenScore')
    && appJs.includes('routeFriendlyScore'),
  'Expected model adjustment summary to include deterministic route and five-dimension scores'
);

assert(
  appJs.includes('function getLocalizedReportAnalysisSections(')
    && appJs.includes('function getReportAdjustmentSectionBullets(')
    && appJs.includes('function buildReportFacilityAdjustmentListMarkup(')
    && appJs.includes('report-pressure-number report-pressure-number--filled')
    && appJs.includes('llmAnalysis'),
  'Expected model adjustment summary to consume localized LLM sections and render numbered pressure-point facility recommendations'
);

assert(
  appJs.includes('requestedReportAdjustment')
    && appJs.includes('routeScoreSummary')
    && appJs.includes('detailBurdenCards')
    && appJs.includes('routePressurePoints'),
  'Expected LLM input to include route score, detailed burden cards, and numbered pressure points as evidence'
);

console.log('validate_report_llm_adjustment_summary: ok');
