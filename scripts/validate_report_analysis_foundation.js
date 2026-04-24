const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('function buildSharedRouteAnalysisSnapshot(locale = getReportLocale()) {'),
  'Expected a shared analysis snapshot builder for Section 04 and report export'
);

assert(
  /function buildRouteReportData\(locale = getReportLocale\(\)\) \{[\s\S]*const sharedSnapshot = buildSharedRouteAnalysisSnapshot\(locale\);/.test(appJs),
  'Expected report data construction to reuse the shared analysis snapshot'
);

assert(
  appJs.includes('const defaultLlmAnalysis = buildRouteAnalysisLlmOutput({')
    && appJs.includes('let llmAnalysis = defaultLlmAnalysis;')
    && appJs.includes("provider: getRouteAnalysisProviderState(localLocale)")
    && appJs.includes("sections: buildRouteAnalysisLlmSections({")
    && appJs.includes("reportT('llmAnalysisTitle'")
    && appJs.includes("reportT('llmAnalysisPlaceholder'")
    && appJs.includes("reportT('llmAnalysisPlaceholderSub'"),
  'Expected the shared report payload to include an LLM analysis placeholder block'
);

assert(
  appJs.includes('executiveSummary: buildRouteReportExecutiveSummary(')
    && appJs.includes('inputSnapshot: buildRouteReportInputSnapshot({')
    && appJs.includes('burdenSimulation: buildRouteReportBurdenSimulation(')
    && appJs.includes('const pressureCategoryAnalysis = buildRouteReportPressureCategoryAnalysis(')
    && appJs.includes('pressureCategoryAnalysis,')
    && appJs.includes('const llmInput = buildSharedRouteAnalysisLlmInput({')
    && appJs.includes('llmInput,')
    && appJs.includes('pressureCategorySummary,'),
  'Expected the shared snapshot to expose executive summary, input snapshot, burden simulation, pressure stats, and future LLM input payload'
);

assert(
  appJs.includes("copy.pageOneTitle")
    && appJs.includes("copy.pageOneInputTitle")
    && appJs.includes("copy.pageTwoSimulationTitle")
    && appJs.includes("copy.pageTwoThoughtTitle")
    && appJs.includes("copy.pageTwoPressureTitle")
    && appJs.includes("copy.pageThreeHeatTitle")
    && appJs.includes('reportData.agentFigureUrl')
    && appJs.includes('reportData.agentRadarSvg')
    && appJs.includes('reportData.thoughtChainItems')
    && appJs.includes('reportData.thoughtMapSnapshot')
    && appJs.includes('reportData.routePressurePoints')
    && appJs.includes('reportData.heatmapCards'),
  'Expected the exported report document to include the new three-page template, agent profile visuals, thought-chain map, pressure-point summary, and six heatmaps'
);

console.log('validate_report_analysis_foundation: ok');
