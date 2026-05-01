const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('function getReportDetailCardRegionsForLlm('),
  'Expected report LLM input to use a helper that chooses the first non-empty region list'
);

assert(
  !appJs.includes('(card.regionRankings || card.regionIssues || [])'),
  'Expected report LLM input not to use || with arrays, because empty [] masks non-empty regionIssues'
);

assert(
  appJs.includes('getReportDetailCardRegionsForLlm(card).slice(0, 3)'),
  'Expected buildSharedRouteAnalysisLlmInput to send non-empty single-burden regions to targetDetailRegionAnalyses'
);

console.log('validate_report_llm_detail_targets_use_nonempty_regions: ok');
