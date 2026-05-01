const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  appJs.includes('function getReportRegionInfluenceSources(')
    && appJs.includes('function getReportRegionNodeInfluenceSources(')
    && appJs.includes('function getReportRegionAreaInfluenceSources('),
  'Expected report to build unified pressure, node, and area influence sources'
);

assert(
  appJs.includes('regionInfluenceSources')
    && appJs.includes('mapInfluenceSources')
    && appJs.includes('buildReportNumberedInfluenceSourceMarkup'),
  'Expected detailed burden cards and maps to use unified influence source lists'
);

assert(
  appJs.includes('influenceSources:')
    && appJs.includes('sourceType')
    && appJs.includes('reasonLabel')
    && appJs.includes('description: source.description')
    && appJs.includes('description: point.description'),
  'Expected route-analysis LLM payload to include typed influence source evidence and pressure-point descriptions'
);

assert(
  appJs.includes('buildReportInfluenceSourceReferenceListMarkup')
    && appJs.includes('buildReportInfluenceSourceCauseText')
    && appJs.includes('buildReportInfluenceSourceExplanationText'),
  'Expected report text to reference mixed influence sources, not only pressure points'
);

assert(
  appJs.includes("if (item?.sourceType === 'area') {")
    && appJs.includes('return \'\';'),
  'Expected area influence sources to stay in text rankings instead of being drawn over hot-zone labels'
);

assert(
  !appJs.includes('<strong>${escapeHtml(expectedLabel)}:</strong>'),
  'Expected detailed burden rows to omit the template-like expected impact line'
);

assert(
  appJs.includes('getReportPressureDescriptionInsight')
    && appJs.includes('source.description')
    && appJs.includes('descriptor.insight'),
  'Expected pressure-point descriptions to shape the detailed burden explanation text'
);

assert(
  appJs.includes('.report-pressure-groups { columns:2')
    && !appJs.includes('.report-pressure-groups { display:grid; grid-template-columns:1fr 1fr;'),
  'Expected involved stressors to use continuous two-column flow instead of row-based grid gaps'
);

assert(
  coreJs.includes('focusInfluenceContributionLog')
    && coreJs.includes('recordFocusInfluenceContributionLog')
    && coreJs.includes('buildFormulaInfluenceContributionEntries')
    && coreJs.includes('componentKey')
    && coreJs.includes('sourceType'),
  'Expected simulation to record unified formula-level influence contributions for pressure, node, and area sources'
);

assert(
  appJs.includes('function getReportInfluenceContributionLog()')
    && appJs.includes('playback?.influenceContributionLog')
    && appJs.includes('getReportRegionLoggedInfluenceSources')
    && appJs.includes('loggedSources')
    && appJs.includes('formulaContribution'),
  'Expected report influence sources to prefer logged formula contributions instead of report-stage-only heuristics'
);

console.log('validate_report_unified_influence_sources: ok');
