const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const reportConfirmStyleBlock = stylesCss.match(/\.report-modal-actions \.visualization-export-btn\s*\{([\s\S]*?)\}/)?.[1] || '';

assert(
  /class="modal-panel report-modal-panel"[\s\S]*class="report-modal-controls"[\s\S]*id="report-modal-title"[\s\S]*id="report-language-label"[\s\S]*id="report-language-trigger"[\s\S]*visualization-detail__layer-select[\s\S]*id="report-language-menu"[\s\S]*visualization-detail__layer-menu[\s\S]*data-report-locale="zh-CN"[\s\S]*data-report-locale="en"[\s\S]*id="report-format-label"[\s\S]*id="report-format-trigger"[\s\S]*visualization-detail__layer-select[\s\S]*id="report-format-menu"[\s\S]*visualization-detail__layer-menu[\s\S]*data-report-format="html"[\s\S]*data-report-format="pdf"[\s\S]*id="report-modal-cancel-btn" class="ghost-btn edge-btn"[\s\S]*>取消<\/button>[\s\S]*id="report-modal-export-btn" class="visualization-export-btn"[\s\S]*>确认<\/button>[\s\S]*class="report-preview-stage"[\s\S]*id="report-preview-frame"/.test(indexHtml),
  'Expected report modal to use a left control panel with pressure-layer styled language/format dropdowns and matching action buttons'
);

assert(
  !indexHtml.includes('data-report-locale="yue"')
    && !indexHtml.includes('data-report-format="word"')
    && !appJs.includes("locale === 'yue'")
    && !appJs.includes("format === 'word'"),
  'Expected report modal to remove Cantonese and Word options'
);

assert(
  !indexHtml.includes('id="report-modal-summary"')
    && !indexHtml.includes('id="report-locale-zh"')
    && !indexHtml.includes('id="report-locale-en"'),
  'Expected report modal to remove the sidebar summary block and independent report language toggles'
);

assert(
  appJs.includes("elements.reportModalTitle.textContent = reportCopy.previewTitle;")
    && appJs.includes("elements.reportLanguageTrigger")
    && appJs.includes("elements.reportFormatTrigger")
    && appJs.includes("function setReportExportFormat(format)")
    && appJs.includes("function handleReportDropdownClick(event)")
    && /function exportReportPdf\([^)]*\)/.test(appJs)
    && appJs.includes("elements.reportModalCancelBtn.textContent = reportCopy.cancelExport;")
    && appJs.includes("elements.reportModalExportBtn.textContent = state.reportModal.exporting ? reportCopy.exporting : reportCopy.confirmExport;"),
  'Expected report modal logic to render dropdown state and support HTML/PDF export format selection'
);

assert(
  appJs.includes("confirmExport: '确认'")
    && appJs.includes("confirmExport: 'Confirm'")
    && appJs.includes("reportLanguage: '导出语言'")
    && appJs.includes("reportLanguage: 'Export Language'")
    && appJs.includes("reportFormat: '导出格式'")
    && appJs.includes("reportFormat: 'Export Format'")
    && appJs.includes("readyPreview: '已生成当前路线的报告预览，可选择格式并导出。'")
    && appJs.includes("readyPreview: 'The current route report preview is ready. Choose a format to export.'")
    && appJs.includes("elements.reportLanguageLabel.textContent = reportCopy.reportLanguage;")
    && appJs.includes("elements.reportFormatLabel.textContent = reportCopy.reportFormat;")
    && appJs.includes("const uiLocale = state.locale === 'en' ? 'en' : 'zh-CN';")
    && appJs.includes("renderReportDropdownState(reportLocale, uiLocale);")
    && appJs.includes("button.textContent = getReportLanguageLabel(button.dataset.reportLocale, uiLocale);")
    && appJs.includes("button.textContent = getReportFormatLabel(format, uiLocale);")
    && /function openReportModal\(\) \{[\s\S]*state\.reportLocale = state\.locale === 'en' \? 'en' : 'zh-CN';[\s\S]*const reportLocale = getReportLocale\(\);/.test(appJs),
  'Expected modal button, label, dropdown, and report preview copy to follow the main page language'
);

assert(
  /\.report-modal-panel\s*\{[\s\S]*grid-template-columns:\s*minmax\(240px,\s*1fr\)\s*minmax\(0,\s*3fr\);/.test(stylesCss)
    && /\.report-modal-controls\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/.test(stylesCss)
    && /\.report-dropdown-trigger\s*\{[\s\S]*border:\s*1px solid rgba\(56,\s*210,\s*235,\s*0\.42\);/.test(stylesCss)
    && /\.report-dropdown-menu\s*\{[\s\S]*background:\s*rgba\(20,\s*26,\s*37,\s*0\.98\);/.test(stylesCss)
    && /\.report-dropdown-option:hover\s*\{[\s\S]*transform:\s*translateX\(1\.5px\);/.test(stylesCss)
    && /\.report-modal-actions\s*\{[\s\S]*flex-direction:\s*column;/.test(stylesCss)
    && /\.report-modal-actions \.ghost-btn\s*\{[\s\S]*background:\s*rgba\(31,\s*38,\s*49,\s*0\.72\);/.test(stylesCss)
    && reportConfirmStyleBlock.includes('width: 100%;')
    && reportConfirmStyleBlock.includes('margin: 0;')
    && reportConfirmStyleBlock.includes('background: hsl(190 90% 50%);')
    && reportConfirmStyleBlock.includes('font-family: inherit;')
    && reportConfirmStyleBlock.includes('font-size: 12px;')
    && reportConfirmStyleBlock.includes('font-weight: 600;')
    && reportConfirmStyleBlock.includes('letter-spacing: 0;')
    && !reportConfirmStyleBlock.includes('linear-gradient')
    && /\.report-preview-stage\s*\{[\s\S]*min-width:\s*0;/.test(stylesCss),
  'Expected report modal shell to use the requested split layout, route-cancel styling, export-button styling, and pressure-layer dropdown styling'
);

console.log('validate_report_modal_preview_shell: ok');
