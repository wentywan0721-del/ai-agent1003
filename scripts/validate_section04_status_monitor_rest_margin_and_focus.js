const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /restMargin:\s*'Rest Margin'/.test(appJs) && /restMargin:\s*'休息余量'/.test(appJs),
  'Expected Section04 status labels to rename Current Target to Rest Margin'
);

assert(
  /decisionFocus:\s*'Decision Focus'/.test(appJs) && /decisionFocus:\s*'决策焦点'/.test(appJs),
  'Expected Section04 status labels to rename Dominant Factor to Decision Focus'
);

assert(
  /function formatRestMarginLabel\(/.test(appJs),
  'Expected a formatter for the live rest margin value'
);

assert(
  /function formatDecisionFocusLabel\(/.test(appJs),
  'Expected a formatter for the live decision focus value'
);

assert(
  /label:\s*t\('label\.restMargin'\),\s*value:\s*formatRestMarginLabel\(inspection/.test(appJs),
  'Expected status monitor to render Rest Margin from the live inspection'
);

assert(
  /label:\s*t\('label\.decisionFocus'\),\s*value:\s*formatDecisionFocusLabel\(inspection/.test(appJs),
  'Expected status monitor to render Decision Focus from the live inspection'
);

assert(
  /function buildVisualizationStatusLabelMarkup\(/.test(appJs)
  && /item\.multilineLabel/.test(appJs),
  'Expected status monitor labels to support per-item multiline rendering'
);

assert(
  /\.visualization-detail__status \.visualization-status-card__label\.is-multiline/.test(css)
  && /\.visualization-detail__status \.visualization-status-card__label\.is-nowrap/.test(css),
  'Expected Section04 status labels to style multiline and single-line variants separately'
);

console.log('validate_section04_status_monitor_rest_margin_and_focus: ok');
