const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('llmAnalysisRequestKey')
    && appJs.includes('state.reportModal.llmAnalysisRequestKey = analysisKey;')
    && appJs.includes('state.reportModal.llmAnalysisRequestKey !== analysisKey')
    && appJs.includes('getReportLocale() !== locale'),
  'Expected report LLM analysis to ignore stale responses from a previous export language'
);

assert(
  /function setReportLocale\(locale\)[\s\S]*state\.reportModal\.llmAnalysisPending = false;[\s\S]*state\.reportModal\.llmAnalysisPromise = null;[\s\S]*state\.reportModal\.llmAnalysisRequestKey = '';/.test(appJs),
  'Expected changing report language to invalidate any in-flight report LLM request state'
);

assert(
  /await ensureRouteAnalysisForCurrentState\(reportLocale\);[\s\S]*if \(getReportLocale\(\) !== reportLocale\)/.test(appJs)
    && appJs.includes('rebuildReportModalContent(reportLocale);')
    && /await exportReportHtml\(fileName, reportLocale(?:, [^)]+)?\);/.test(appJs),
  'Expected export to rebuild and save the report using the selected report language, not the main UI language'
);

console.log('validate_report_language_export_guard: ok');
