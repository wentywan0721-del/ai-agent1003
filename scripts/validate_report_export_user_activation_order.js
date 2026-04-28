const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('async function reserveReportHtmlFileHandle(fileName)')
    && appJs.includes('function reserveReportPrintWindow()'),
  'Expected export to reserve browser-gated file/print targets before async LLM work'
);

const handleExportMatch = /async function handleExportReport\(\) \{([\s\S]*?)\n  \}\n\n  function handleParameterChange/.exec(appJs);
assert(handleExportMatch, 'Expected handleExportReport function to exist');
const handleExportBody = handleExportMatch[1];

const reserveHtmlIndex = handleExportBody.indexOf('reservedHtmlFileHandle = await reserveReportHtmlFileHandle(fileName);');
const reservePrintIndex = handleExportBody.indexOf('reservedPrintWindow = reserveReportPrintWindow();');
const ensureIndex = handleExportBody.indexOf('await ensureRouteAnalysisForCurrentState(reportLocale);');

assert(reserveHtmlIndex >= 0, 'Expected HTML export to reserve showSaveFilePicker before LLM analysis');
assert(reservePrintIndex >= 0, 'Expected PDF export to reserve window.open before LLM analysis');
assert(ensureIndex >= 0, 'Expected export to still refresh LLM analysis before writing the final report');
assert(
  reserveHtmlIndex < ensureIndex && reservePrintIndex < ensureIndex,
  'Expected browser user-activation APIs to be called before awaiting route analysis'
);

assert(
  /await exportReportHtml\(fileName, reportLocale, reservedHtmlFileHandle\);/.test(handleExportBody)
    && /exportReportPdf\(reservedPrintWindow\);/.test(handleExportBody),
  'Expected reserved export targets to be reused after final report rebuild'
);

console.log('validate_report_export_user_activation_order: ok');
