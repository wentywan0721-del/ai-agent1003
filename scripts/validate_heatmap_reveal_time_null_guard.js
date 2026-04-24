const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /state\.heatmapRevealFrozenTime !== null && state\.heatmapRevealFrozenTime !== undefined/.test(appJs),
  'Expected reveal time logic to guard against null/undefined before converting to Number'
);

console.log('validate_heatmap_reveal_time_null_guard: ok');
