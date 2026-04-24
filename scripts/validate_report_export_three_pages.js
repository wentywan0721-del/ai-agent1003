const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractBlock(startMarker, endMarker) {
  const start = appJs.indexOf(startMarker);
  const end = appJs.indexOf(endMarker, start);
  assert(start !== -1, `Missing block start: ${startMarker}`);
  assert(end !== -1, `Missing block end: ${endMarker}`);
  return appJs.slice(start, end);
}

const reportDataBlock = extractBlock(
  'function buildRouteReportData(locale = getReportLocale()) {',
  'function buildRouteReportSummaryMarkup(reportData) {'
);

const reportDocumentBlock = extractBlock(
  'function buildRouteReportDocument(reportData) {',
  'function renderHotspots() {'
);

assert(
  reportDataBlock.includes('modelSpaceInfo')
    && reportDataBlock.includes('simulationParameterRows')
    && reportDataBlock.includes('thoughtChainItems')
    && reportDataBlock.includes('thoughtMapSnapshot')
    && reportDataBlock.includes('routePressurePoints')
    && reportDataBlock.includes('heatmapCards'),
  'Expected report data builder to expose the three-page report sections'
);

assert(
  reportDocumentBlock.includes('class="report-document"')
    && reportDocumentBlock.includes('report-page report-page--1')
    && reportDocumentBlock.includes('report-page report-page--2')
    && reportDocumentBlock.includes('report-page report-page--3'),
  'Expected exported report document to render the long-form report structure with the first three report sections'
);

assert(
  reportDocumentBlock.includes("copy.pageOneTitle")
    && reportDocumentBlock.includes("copy.pageOneInputTitle")
    && reportDocumentBlock.includes("copy.pageTwoSimulationTitle")
    && reportDocumentBlock.includes("copy.pageTwoThoughtTitle")
    && reportDocumentBlock.includes("copy.pageTwoPressureTitle")
    && reportDocumentBlock.includes("copy.pageThreeHeatTitle"),
  'Expected exported report document to include all three-page section headings'
);

assert(
  reportDocumentBlock.includes('report-agent-layout')
    && reportDocumentBlock.includes('report-thought-flow')
    && reportDocumentBlock.includes('report-map-stage')
    && reportDocumentBlock.includes('report-heat-grid'),
  'Expected exported report document to include the input profile panel, thought-chain map, and six-heatmap grid'
);

assert(
  appJs.includes('function buildReportExportCopy(locale = getReportLocale()) {')
    && appJs.includes('function buildReportModelSpaceInfo(locale = getReportLocale()) {')
    && appJs.includes('function buildReportSimulationParameterRows(locale = getReportLocale()) {')
    && appJs.includes('function buildReportThoughtMapSnapshot(reportData, locale = getReportLocale()) {')
    && appJs.includes('function buildReportHeatmapCards(locale = getReportLocale()) {'),
  'Expected report-only helper builders for model info, simulation info, thought map, and heatmaps'
);

console.log('validate_report_export_three_pages: ok');
