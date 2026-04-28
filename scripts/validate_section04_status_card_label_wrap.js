const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /\.visualization-detail__status\s+\.visualization-status-card\s*\{[\s\S]*grid-template-columns:\s*minmax\(84px,\s*96px\)\s*minmax\(0,\s*1fr\)/.test(css),
  'Expected Section04 status cards to reserve a stable left label column so Chinese labels do not collapse into vertical text'
);

assert(
  /\.visualization-detail__status\s+\.visualization-status-card__label\s*\{[\s\S]*writing-mode:\s*horizontal-tb[\s\S]*word-break:\s*keep-all[\s\S]*line-height:\s*1\.2/.test(css)
  && /\.visualization-detail__status\s+\.visualization-status-card__label\.is-multiline\s*\{[\s\S]*white-space:\s*normal/.test(css)
  && /\.visualization-detail__status\s+\.visualization-status-card__label\.is-nowrap\s*\{[\s\S]*white-space:\s*nowrap/.test(css),
  'Expected Section04 status labels to stay horizontal, while only the specified English labels can split into two lines'
);

assert(
  /\.visualization-detail__status\s+\.visualization-status-card__value\s*\{[\s\S]*white-space:\s*nowrap/.test(css),
  'Expected Section04 status values to remain single-line on the right side'
);

console.log('validate_section04_status_card_label_wrap: ok');
