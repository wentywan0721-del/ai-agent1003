const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /route-modal-map-stage"/.test(indexHtml),
  'Expected the route modal map stage to remain present in HTML'
);

assert(
  /font-family:\s*"Inter",\s*"PingFang SC",\s*"Microsoft YaHei",\s*sans-serif;/.test(stylesCss),
  'Expected the global body typography to align to the reference Inter-first stack'
);

assert(
  /\.landing-start-btn\s*\{[\s\S]*margin-top:\s*10px;/.test(stylesCss),
  'Expected the landing CTA to sit slightly lower, matching the reference spacing'
);

assert(
  /\.settings-screen__title\s*\{[\s\S]*font-size:\s*16px;[\s\S]*font-weight:\s*700;/.test(stylesCss),
  'Expected the Section 01 title scale to match the reference title sizing'
);

assert(
  /\.route-modal\s+\.modal-actions\s+\.ghost-btn\s*\{/.test(stylesCss),
  'Expected route modal secondary action buttons to use the new settings-style skin'
);

assert(
  /\.route-modal\s+\.modal-actions\s+\.run-btn\s*\{/.test(stylesCss),
  'Expected route modal primary action buttons to use the new settings-style skin'
);

assert(
  /routeModalMapStage:\s*document\.querySelector\('#route-modal \.route-modal-map-stage'\)/.test(appJs),
  'Expected app.js to bind the route modal map stage element'
);

assert(
  /function computeTransformForContainer\(container\)/.test(appJs),
  'Expected a dedicated transform helper for non-workspace containers'
);

assert(
  /const transformForModal = computeTransformForContainer\(elements\.routeModalMapStage\);/.test(appJs),
  'Expected the route modal to compute its own transform instead of reusing the hidden workspace scale'
);

console.log('validate_route_modal_ui_alignment: ok');
