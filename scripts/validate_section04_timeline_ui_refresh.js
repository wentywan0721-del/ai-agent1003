const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  !/const readySummary = '';/m.test(appJs)
  && /function buildVisualizationDetailCotMarkup\(\)[\s\S]*<div class="visualization-detail__timeline">/.test(appJs),
  'Expected Section04 decision chain markup to remove the top summary paragraph and keep the timeline only'
);

assert(
  /visualization-detail__timeline-item\$\{item\.order === activeTimelineOrder \? ' is-active' : ''\}/.test(appJs),
  'Expected Section04 decision chain timeline items to support an active/highlighted state'
);

assert(
  /\.visualization-detail__timeline-marker\s*\{[\s\S]*width:\s*9px;[\s\S]*height:\s*9px;[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.96\)/.test(stylesCss),
  'Expected Section04 timeline markers to be smaller white solid dots'
);

assert(
  /\.visualization-detail__timeline::before\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.68\)/.test(stylesCss),
  'Expected Section04 timeline connector line to use a white stroke'
);

assert(
  /\.visualization-detail__timeline-item\.is-active[\s\S]*\.visualization-detail__timeline-marker[\s\S]*background:\s*rgba\(56,\s*210,\s*235,\s*0\.96\)/.test(stylesCss),
  'Expected Section04 timeline active state to highlight the marker in blue'
);

console.log('validate_section04_timeline_ui_refresh: ok');
