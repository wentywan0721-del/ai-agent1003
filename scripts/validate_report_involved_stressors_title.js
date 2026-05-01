const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('<h2 class="report-section-title">${escapeHtml(copy.pageTwoPressureTitle)}</h2>')
    && !appJs.includes('routePressurePointCount')
    && !appJs.includes('copy.pageTwoPressureTitle)} ·'),
  'Expected the involved stressors report title to omit a misleading total count suffix'
);

console.log('validate_report_involved_stressors_title: ok');
