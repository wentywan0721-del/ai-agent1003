const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('function buildRouteAnalysisLlmOutput(')
    && appJs.includes('function buildRouteAnalysisLlmSections(')
    && appJs.includes('function getRouteAnalysisProviderState('),
  'Expected a dedicated Section 04 / report LLM scaffold builder with provider state and structured sections'
);

assert(
  appJs.includes('provider: getRouteAnalysisProviderState(localLocale)')
    && appJs.includes('sections: buildRouteAnalysisLlmSections({')
    && appJs.includes('async function ensureRouteAnalysisForCurrentState(locale = getReportLocale()) {')
    && appJs.includes('requestRouteAnalysisFromLocalService('),
  'Expected shared analysis snapshot and renderers to consume structured LLM scaffold output'
);

assert(
  appJs.includes('visualization-detail__report-grid')
    && appJs.includes('llmAnalysis.provider.label')
    && appJs.includes('llmAnalysis.sections.map'),
  'Expected Section 04 CoT panel to render provider status and structured LLM scaffold sections'
);

console.log('validate_llm_analysis_scaffold: ok');
