const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /analysis\.timeline/.test(appJs) || /llmAnalysis\.timeline/.test(appJs),
  'Expected Section04 route-analysis localization to consume analysis.timeline'
);

assert(
  /visualization-detail__timeline/.test(appJs),
  'Expected Section04 detail panel renderer to output the timeline container'
);

assert(
  /visualization-detail__timeline-item/.test(appJs) && /visualization-detail__timeline-marker/.test(appJs),
  'Expected Section04 detail panel renderer to output timeline items with markers'
);

assert(
  /visualization-detail__timeline/.test(stylesCss) && /visualization-detail__timeline-marker/.test(stylesCss),
  'Expected styles.css to define the Section04 timeline visual styles'
);

console.log('validate_section04_thought_timeline: ok');
