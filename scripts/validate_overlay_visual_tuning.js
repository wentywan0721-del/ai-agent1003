const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const hotspotFillMatches = appJs.match(/fill="rgba\(255,\s*255,\s*255,\s*0\.96\)"/g) || [];

assert(
  hotspotFillMatches.length >= 2,
  'Expected hotspot highlight inner fill circles to use white rgba(255, 255, 255, 0.96) instead of blue fill'
);

assert(
  /\.vision-ring\s*\{[\s\S]*fill:\s*rgba\(56,\s*210,\s*235,\s*0\.035\);[\s\S]*stroke:\s*rgba\(27,\s*154,\s*226,\s*0\.96\);[\s\S]*stroke-width:\s*0\.5;[\s\S]*stroke-dasharray:\s*2 2;[\s\S]*\}/.test(stylesCss),
  'Expected focus vision ring to use a darker theme blue, 0.5px stroke, and a denser 2 2 dash pattern'
);

console.log('validate_overlay_visual_tuning: ok');
