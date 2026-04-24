const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function expandAgentPreviewLocomotorComponents\(/.test(appJs),
  'Expected Section 02 preview to define a dedicated locomotor fragment-expansion helper for missing shoe and lower-leg slices'
);

assert(
  /if \(dimensionId === 'locomotor'[\s\S]*expandAgentPreviewLocomotorComponents\(/m.test(appJs),
  'Expected locomotor region selection to expand the initially selected fixed components with nearby lower-body fragments'
);

console.log('validate_section02_locomotor_fragment_expansion: ok');
