const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !appJs.includes("await probeLocalSimServerHealth({ force: true, clearError: true })"),
  'Expected heatmap run to skip the blocking preflight health probe'
);

console.log('validate_heatmap_no_preflight_probe: ok');
