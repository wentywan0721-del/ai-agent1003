const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  let paramsEnd = -1;
  let parenDepth = 0;
  for (let index = start + signature.length - 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '(') parenDepth += 1;
    if (char === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  assert(paramsEnd >= 0, `expected ${name} to have balanced parameters`);
  const braceStart = source.indexOf('{', paramsEnd);
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

assert(
  /function getViewMetricRange\(/.test(appSource),
  'expected metric range helper to exist'
);

const rangeBody = extractFunctionBody(appSource, 'getViewMetricRange');
assert(
  /state\.viewMetricRangeCache/.test(rangeBody),
  'view metric range helper should use a dedicated cache instead of rebuilding arrays every playback frame'
);

assert(
  !/const values = getViewMetricValues\(viewMode, \{ fullReveal: true \}\);/.test(rangeBody),
  'view metric range helper should stop rebuilding a fresh metric value array on every call'
);

const summaryBody = extractFunctionBody(appSource, 'getDynamicSummaryState');
assert(
  /const metricRange = getViewMetricRange\(getSafeViewMode\(state\.viewMode\)\);/.test(summaryBody),
  'dynamic summary should use the cached metric range instead of recomputing all metric values'
);

assert(
  /minHeat: Number\(normalizedMetricRange\.minMetric \|\| 0\),/.test(summaryBody)
  && /maxHeat: Number\(normalizedMetricRange\.maxMetric \|\| 0\),/.test(summaryBody),
  'dynamic summary should read min\/max heat directly from the cached metric range'
);

assert(
  /function shouldRenderPlaybackUiPanels\(\)/.test(appSource),
  'playback loop should expose a UI panel gating helper'
);

const playbackBody = extractFunctionBody(appSource, 'renderPlaybackFrame');
assert(
  /const shouldRenderUiPanels = shouldRenderPlaybackUiPanels\(\);/.test(playbackBody),
  'playback frame renderer should compute a shared gating decision for playback-only side panels'
);

assert(
  /if \(shouldRenderUiPanels && state\.selectedDynamic\)/.test(playbackBody),
  'playback frame renderer should avoid rebuilding selected-dynamic panels every animation frame'
);

assert(
  /if \(shouldRenderUiPanels\) \{\s*renderVisualizationShell\(\);\s*\}/.test(playbackBody),
  'playback frame renderer should throttle visualization shell updates instead of rebuilding them every frame'
);

console.log('validate_playback_ui_panel_efficiency: ok');
