const assert = require('assert');
const fs = require('fs');
const path = require('path');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /\.landing-start-btn\s*\{[\s\S]*margin-top:\s*14px;/.test(stylesCss),
  'Expected the landing CTA to move slightly further down'
);

assert(
  /\.settings-upload-card__icon\s*\{[\s\S]*color:\s*rgba\(152,\s*166,\s*179,\s*0\.96\);[\s\S]*transition:\s*color 180ms ease;/.test(stylesCss),
  'Expected the upload icon to start muted instead of primary blue'
);

assert(
  /\.settings-upload-card:hover\s+\.settings-upload-card__icon\s*\{[\s\S]*color:\s*rgba\(56,\s*210,\s*235,\s*0\.92\);/.test(stylesCss),
  'Expected the upload icon to turn blue only on hover'
);

assert(
  /function formatAgentRadarScore\(score,\s*locale = state\.locale\)\s*\{\s*return `\$\{score\}`;\s*\}/.test(appJs),
  'Expected radar scores to render as bare numbers instead of locale suffixes like 3/5'
);

assert(
  /function getAgentRadarTextPoint\(index,\s*distance,\s*layout = getAgentRadarLayout\(\),\s*inwardOffset = 0,\s*lateralOffset = 0\)/.test(appJs),
  'Expected a dedicated helper for radar label/score text positioning'
);

assert(
  /labelTextPoint:\s*\{[\s\S]*scoreTextPoint:\s*\{/.test(appJs),
  'Expected radar labels and scores to use separate text positions'
);

console.log('validate_ui_micro_tuning: ok');
