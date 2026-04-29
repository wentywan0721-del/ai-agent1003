const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

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
    && appJs.includes('reasonLabel'),
  'Expected route-analysis LLM payload to include typed influence source evidence'
);

assert(
  appJs.includes('buildReportInfluenceSourceReferenceListMarkup')
    && appJs.includes('buildReportInfluenceSourceCauseText'),
  'Expected report text to reference mixed influence sources, not only pressure points'
);

console.log('validate_report_unified_influence_sources: ok');
