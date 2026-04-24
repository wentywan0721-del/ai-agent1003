const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /id="report-modal-title"[\s\S]*id="report-preview-frame"[\s\S]*id="report-modal-status"[\s\S]*id="report-modal-cancel-btn"[\s\S]*id="report-modal-export-btn"/.test(indexHtml),
  'Expected report modal to keep only title, preview frame, status, and export actions in the shell'
);

assert(
  !indexHtml.includes('id="report-modal-summary"')
    && !indexHtml.includes('id="report-locale-zh"')
    && !indexHtml.includes('id="report-locale-en"'),
  'Expected report modal to remove the sidebar summary block and independent report language toggles'
);

assert(
  appJs.includes("elements.reportModalTitle.textContent = reportCopy.previewTitle;")
    && appJs.includes("elements.reportModalCancelBtn.textContent = reportCopy.cancelExport;")
    && appJs.includes("elements.reportModalExportBtn.textContent = state.reportModal.exporting ? reportCopy.exporting : reportCopy.confirmExport;"),
  'Expected report modal copy to use preview-report title and confirm/cancel export actions'
);

assert(
  /\.report-modal-panel\s*\{[\s\S]*width:\s*min\(1240px,\s*88vw\);[\s\S]*height:\s*min\(860px,\s*84vh\);/.test(stylesCss)
    && /\.report-preview-stage\s*\{[\s\S]*flex:\s*1 1 auto;/.test(stylesCss)
    && /\.report-modal-actions\s*\{[\s\S]*justify-content:\s*flex-end;/.test(stylesCss),
  'Expected report modal shell to use a smaller centered preview layout instead of a full-screen split view'
);

console.log('validate_report_modal_preview_shell: ok');
