const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('async function reserveReportHtmlFileHandle(fileName)')
    && appJs.includes("getLocalSimServerUrl('/api/report/pdf')"),
  'Expected export to reserve browser-gated HTML file targets and use local PDF generation service'
);

const handleExportMatch = /async function handleExportReport\(\) \{([\s\S]*?)\n  \}\n\n  function handleParameterChange/.exec(appJs);
assert(handleExportMatch, 'Expected handleExportReport function to exist');
const handleExportBody = handleExportMatch[1];

const reserveHtmlIndex = handleExportBody.indexOf('reservedHtmlFileHandle = await reserveReportHtmlFileHandle(fileName);');
const ensureIndex = handleExportBody.indexOf('await ensureRouteAnalysisForCurrentState(reportLocale);');

assert(reserveHtmlIndex >= 0, 'Expected HTML export to reserve showSaveFilePicker before LLM analysis');
assert(ensureIndex >= 0, 'Expected export to still refresh LLM analysis before writing the final report');
assert(
  reserveHtmlIndex < ensureIndex,
  'Expected browser user-activation APIs to be called before awaiting route analysis for HTML export'
);

assert(
  /await exportReportHtml\(fileName, reportLocale, reservedHtmlFileHandle\);/.test(handleExportBody)
    && /await exportReportPdf\(pdfFileName, uiLocale\);/.test(handleExportBody),
  'Expected HTML export to reuse the reserved target and PDF export to download a generated PDF file'
);

console.log('validate_report_export_user_activation_order: ok');
