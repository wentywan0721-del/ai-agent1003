const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server', 'sim-server.js'), 'utf8');

assert(
  serverJs.includes('detailRegionAnalyses')
    && serverJs.includes('pattern_zh')
    && serverJs.includes('cause_zh')
    && serverJs.includes('advice_zh')
    && serverJs.includes('overallImportance'),
  'Expected route-analysis LLM schema and prompt to request per-hot-zone detail burden analysis'
);

assert(
  /return \{[\s\S]*summaryZh:[\s\S]*sections:[\s\S]*detailRegionAnalyses,[\s\S]*\};[\s\S]*function buildLocalizedRouteAnalysisPayload/.test(serverJs),
  'Expected normalized LLM output to return detailRegionAnalyses instead of dropping it before report rendering'
);

assert(
  !serverJs.includes('max_tokens: 1200')
    && serverJs.includes('max_tokens: 6000'),
  'Expected active chat-compatible LLM request to allow enough tokens for detailed burden analysis'
);

assert(
  appJs.includes('function getReportLlmDetailRegionAnalysis(')
    && appJs.includes('detailRegionAnalyses')
    && appJs.includes('localizedDetailRegionAnalyses')
    && appJs.includes('llmDetailIssue')
    && appJs.includes('llmDetailIssue.cause'),
  'Expected report renderer to localize and use LLM detail hot-zone phenomenon, cause, and advice'
);

assert(
  appJs.includes('function normalizeReportLlmBurdenId(')
    && appJs.includes('movement')
    && appJs.includes('fatigue')
    && appJs.includes('移动')
    && appJs.includes('疲劳'),
  'Expected detail-region LLM matching to normalize burden aliases instead of requiring exact raw burdenId strings'
);

assert(
  serverJs.includes('burdenId must be exactly one of: locomotor, sensory, cognitive, psychological, vitality')
    && serverJs.includes('Do not translate burdenId')
    && serverJs.includes('targetDetailRegionAnalyses'),
  'Expected route-analysis prompt/input to force exact detailed burden ids for LLM detailRegionAnalyses'
);

assert(
  appJs.includes('REPORT_ANALYSIS_SCHEMA_VERSION')
    && appJs.includes('hasReportLlmDetailRegionAnalyses')
    && appJs.includes('hasCompleteReportLlmAnalysis')
    && appJs.includes('hasCompleteReportLlmAnalysis(state.reportModal.llmAnalysis, reportData, locale)'),
  'Expected frontend LLM cache to be invalidated when old analysis lacks front-summary or detail-region analyses'
);

assert(
  appJs.includes("const REPORT_ANALYSIS_SCHEMA_VERSION = 'detail-region-llm-v5';")
    && appJs.includes('coveredBurdenCount')
    && appJs.includes("`${item.burdenId}:${item.regionIndex}`"),
  'Expected report LLM validation to refresh old cache and accept complete burden-level coverage when exact region labels vary'
);

assert(
  appJs.includes('function hasUsableReportLlmDetailRegionAnalyses(')
    && appJs.includes('const minimumDetailCount = Math.min(8, requiredTargets.length);')
    && appJs.includes('hasUsableReportLlmDetailRegionAnalyses(localized, reportData, locale)'),
  'Expected report export to allow partial LLM detail coverage and let missing detail rows fall back to simulation evidence'
);

assert(
  appJs.includes('async function ensureReportDetailRegionAnalysisForCurrentState(')
    && appJs.includes('buildDetailedRegionOnlyRouteAnalysisInput')
    && appJs.includes('mergeReportDetailRegionAnalyses')
    && appJs.includes('await ensureReportDetailRegionAnalysisForCurrentState(exportReportData, { throwOnError: false });'),
  'Expected report export to make a second detail-region-only LLM call to fill missing detailed hot-zone analyses'
);

assert(
  appJs.includes('function getMissingReportLlmDetailTargets(')
    && appJs.includes('function assertReportLlmAnalysisReady(')
    && appJs.includes('assertReportLlmAnalysisReady(exportReportData')
    && appJs.includes('getRequiredReportFrontLlmSections'),
  'Expected report export to require complete LLM front-summary and detail-region analysis instead of silently exporting template fallback'
);

assert(
  !appJs.includes('llmDetailIssue?.pattern || item.title')
    && !appJs.includes('llmDetailIssue?.advice || item.advice')
    && !appJs.includes('llmDetailIssue?.cause\\n            ? escapeHtml(llmDetailIssue.cause)\\n            : buildRegionCauseMarkup'),
  'Expected detailed burden renderer not to silently fall back to template issue/advice text when LLM detail output is missing'
);

assert(
  appJs.includes('LOCAL_SIM_SERVER_REPORT_ANALYSIS_TIMEOUT_MS')
    && appJs.includes('Math.max(LOCAL_SIM_SERVER_REPORT_ANALYSIS_TIMEOUT_MS, LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS)'),
  'Expected report-analysis request to use a longer timeout than the normal local-service request'
);

assert(
  appJs.includes('const LOCAL_SIM_SERVER_REPORT_ANALYSIS_TIMEOUT_MS = 180000;'),
  'Expected report-analysis timeout to allow full LLM report generation for large report payloads'
);

assert(
  appJs.includes('const llmProblems = getReportFrontSectionBullets(reportData, [')
    && appJs.includes('const llmModifications = getReportFrontSectionBullets(reportData, [')
    && appJs.includes('llmProblems.length ? llmProblems.map')
    && appJs.includes('llmModifications.length ? llmModifications.map'),
  'Expected front summary core problems and key modifications to prefer LLM output before template fallback'
);

assert(
  serverJs.includes('Do not promote a low-average burden as a core problem merely because one local derivative changes quickly')
    && serverJs.includes('Rank front-page core problems by average score, peak, area, duration, and clear influence evidence'),
  'Expected prompt to prevent misleading front summaries such as low-average fatigue being over-promoted'
);

assert(
  appJs.includes('function buildReportRestEventSummary(')
    && appJs.includes('restBehavior: reportData?.restBehavior || buildReportRestEventSummary')
    && appJs.includes('short-rest')
    && appJs.includes('sitting'),
  'Expected report LLM input to include recorded rest, seat-search, and seated-rest behavior evidence'
);

console.log('validate_report_llm_detail_burden_analysis: ok');
