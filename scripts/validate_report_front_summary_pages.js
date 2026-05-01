const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const simServerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  appJs.includes('function buildReportExecutiveFrontPageMarkup(reportData)')
    && appJs.includes('function buildReportCoverPageMarkup(reportData)'),
  'Expected dedicated report cover and front summary page builders'
);

assert(
  /const coverPage = buildReportCoverPageMarkup\(reportData\);[\s\S]*const frontSummaryPage = buildReportExecutiveFrontPageMarkup\(reportData\);[\s\S]*<main class="report-document">\s*\$\{coverPage\}\s*\$\{frontSummaryPage\}\s*<section class="report-page report-page--simulation-results">[\s\S]*<section class="report-page report-page--thought">[\s\S]*<section class="report-page report-page--stressors">[\s\S]*<section class="report-page report-page--heatmaps">[\s\S]*\$\{detailCardPages\}/.test(appJs),
  'Expected the cover and front summary page to be followed by the reorganized detailed simulation result pages'
);

assert(
  appJs.includes('.report-page--cover')
    && appJs.includes('.report-front-summary-grid')
    && appJs.includes('.report-front-map-stage')
    && appJs.includes('.report-front-priority-grid')
    && appJs.includes('.report-cover-title-block'),
  'Expected cover and front-page specific report styling'
);

assert(
  indexHtml.includes('./src/app.js?v=20260429-report-llm-detail-fix'),
  'Expected index.html to load the current report-layout app.js cache-busted URL'
);

assert(
  appJs.includes('requestedFrontReport')
    && appJs.includes('single front summary page')
    && appJs.includes('route judgement')
    && appJs.includes('priority modification areas and facilities')
    && appJs.includes('modelSpaceInfo: reportData?.modelSpaceInfo || null'),
  'Expected LLM input to request targeted single-page summary and model adjustment sections with model evidence'
);

assert(
  simServerJs.includes('front summary page after the cover')
    && simServerJs.includes('Avoid vague advice')
    && simServerJs.includes('Every recommendation must be traceable to the supplied route, hot zones, burden scores, influence sources, or numbered pressure points'),
  'Expected route-analysis prompt to force targeted, evidence-grounded summary and adjustment advice'
);

console.log('validate_report_front_summary_pages: ok');
