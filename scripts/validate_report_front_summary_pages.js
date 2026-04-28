const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const simServerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  appJs.includes('function buildReportExecutiveFrontPageMarkup(reportData)')
    && appJs.includes('function buildReportCoverPageMarkup(reportData)'),
  'Expected dedicated report cover and front summary page builders'
);

assert(
  /const coverPage = buildReportCoverPageMarkup\(reportData\);[\s\S]*const frontSummaryPage = buildReportExecutiveFrontPageMarkup\(reportData\);[\s\S]*<main class="report-document">\s*\$\{coverPage\}\s*\$\{frontSummaryPage\}\s*<section class="report-page report-page--1">/.test(appJs),
  'Expected the cover and single front summary page to be inserted before the existing report content without moving existing pages'
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
    && simServerJs.includes('Every recommendation must be traceable to the supplied route, hot zones, burden scores, or numbered pressure points'),
  'Expected route-analysis prompt to force targeted, evidence-grounded summary and adjustment advice'
);

console.log('validate_report_front_summary_pages: ok');
