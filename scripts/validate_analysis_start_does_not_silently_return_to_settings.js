const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  const braceStart = source.indexOf('{', start);
  assert(braceStart >= 0, `expected ${name} to have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

const startBody = extractFunctionBody(appSource, 'handleSettingsStartAnalysis');
assert(
  /const heatmapReady = await handleRunHeatmap\(\);/.test(startBody),
  'start analysis should use the explicit heatmap readiness result'
);
assert(
  /if \(heatmapReady && state\.scenario\?\.heatActive\)/.test(startBody),
  'start analysis should enter workspace only after heatmap generation reports success'
);
assert(
  !/else\s*\{\s*showUiScreen\('settings'\);\s*\}/.test(startBody),
  'start analysis should not silently jump back to route settings when heatmap generation fails'
);

const runBody = extractFunctionBody(appSource, 'handleRunHeatmap');
assert(
  /return true;/.test(runBody) && /return false;/.test(runBody),
  'handleRunHeatmap should report success or failure explicitly'
);

console.log('validate_analysis_start_does_not_silently_return_to_settings: ok');
