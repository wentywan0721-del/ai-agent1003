const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function handleReportLanguageTrigger\(event\)[\s\S]*event\?\.preventDefault\?\.\(\);[\s\S]*event\?\.stopPropagation\?\.\(\);[\s\S]*state\.reportModal\.languageMenuOpen = !state\.reportModal\.languageMenuOpen;/.test(appJs),
  'Expected report language trigger to use a direct guarded pointer/click handler'
);

assert(
  /state\.reportModal\.suppressNextReportLanguageTriggerClick = false;[\s\S]*event\?\.preventDefault\?\.\(\);[\s\S]*event\?\.stopPropagation\?\.\(\);[\s\S]*return;/.test(appJs),
  'Expected the suppressed language click to stop bubbling back to the modal fallback handler'
);

assert(
  /function handleReportLanguageMenuClick\(event\)[\s\S]*event\?\.preventDefault\?\.\(\);[\s\S]*event\?\.stopPropagation\?\.\(\);[\s\S]*event\.target\.closest\('\[data-report-locale\]'\)[\s\S]*setReportLocale\(option\.dataset\.reportLocale\);/.test(appJs),
  'Expected report language options to be selected by a direct guarded menu handler'
);

assert(
  /elements\.reportLanguageTrigger\.addEventListener\('pointerdown', handleReportLanguageTrigger\);[\s\S]*elements\.reportLanguageTrigger\.addEventListener\('click', handleReportLanguageTrigger\);/.test(appJs)
    && /elements\.reportLanguageMenu\.addEventListener\('pointerdown', handleReportLanguageMenuClick\);[\s\S]*elements\.reportLanguageMenu\.addEventListener\('click', handleReportLanguageMenuClick\);/.test(appJs),
  'Expected report language dropdown to listen on pointerdown and click like the live layer dropdown'
);

console.log('validate_report_language_dropdown_live_click: ok');
