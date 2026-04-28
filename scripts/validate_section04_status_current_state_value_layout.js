const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function buildVisualizationStatusValueMarkup\(item, locale = state\.locale\)/.test(appJs),
  'Expected a dedicated status value markup builder'
);

assert(
  /item\?\.id === 'currentState'/.test(appJs) && /words\.length === 2/.test(appJs),
  'Expected Current State English two-word values to be split into two lines'
);

assert(
  /buildVisualizationStatusValueMarkup\(item, state\.locale\)/.test(appJs),
  'Expected status monitor rendering to use the value markup builder'
);

assert(
  /\.visualization-detail__status \.visualization-status-card__value\s*\{[\s\S]*?text-align:\s*right;[\s\S]*?\}/m.test(css)
    && /\.visualization-detail__status \.visualization-status-card__value\s*\{[\s\S]*?justify-self:\s*end;[\s\S]*?\}/m.test(css)
    && /\.visualization-detail__status \.visualization-status-card__value\s*\{[\s\S]*?align-items:\s*flex-end;[\s\S]*?\}/m.test(css),
  'Expected Section04 status values to be right-aligned as a right-justified column'
);

assert(
  /\.visualization-detail__status \.visualization-status-card__value\.is-multiline\s*\{[\s\S]*?line-height:\s*1\.18;/m.test(css),
  'Expected multiline status values to have compact line height'
);

console.log('validate_section04_status_current_state_value_layout: ok');
