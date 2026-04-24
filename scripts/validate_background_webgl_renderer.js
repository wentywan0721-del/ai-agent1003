const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cssSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  const paramsEnd = source.indexOf(')', start);
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
  throw new Error(`failed to parse ${name} body`);
}

assert(
  appSource.includes("const DEFAULT_BACKGROUND_RENDERER_MODE = 'webgl';"),
  'background renderer should default to webgl for the main workspace crowd layer'
);

assert(
  htmlSource.includes('id="dynamic-crowd-webgl-canvas"'),
  'main map should include a dedicated webgl dynamic crowd canvas'
);

assert(
  cssSource.includes('.dynamic-crowd-webgl-canvas'),
  'styles should include a dedicated webgl crowd canvas layer'
);

assert(
  appSource.includes("dynamicCrowdWebglCanvas: document.getElementById('dynamic-crowd-webgl-canvas')"),
  'element registry should cache the webgl crowd canvas'
);

assert(
  appSource.includes('function shouldRenderDynamicCrowdWithWebgl('),
  'app should expose a helper that decides when the webgl renderer owns the main crowd layer'
);

assert(
  appSource.includes('function ensureBackgroundCrowdWebgl('),
  'app should initialize a reusable webgl crowd renderer'
);

assert(
  appSource.includes('function renderBackgroundCrowdWebgl('),
  'app should expose a webgl draw path for the dynamic crowd layer'
);

const backgroundCanvasBody = extractFunctionBody(appSource, 'renderBackgroundCrowdCanvas');
assert(
  /renderBackgroundCrowdWebgl\(options\)/.test(backgroundCanvasBody),
  'background crowd canvas wrapper should delegate to the webgl renderer for the main workspace'
);

assert(
  /renderBackgroundCrowdCanvasLegacy\(options\)/.test(backgroundCanvasBody),
  'background crowd canvas wrapper should still preserve the legacy renderer for non-webgl paths'
);

assert(
  /if \(shouldRenderDynamicCrowdWithWebgl\(options\)\)/.test(backgroundCanvasBody),
  'main workspace crowd wrapper should explicitly gate the webgl-owned path'
);

const webglBody = extractFunctionBody(appSource, 'renderBackgroundCrowdWebgl');
assert(
  !/renderBackgroundCrowdCanvasLegacy\(options\)/.test(webglBody),
  'webgl renderer should not auto-fallback to the legacy canvas path when initialization fails'
);

const overlayBody = extractFunctionBody(appSource, 'renderOverlayLayer');
assert(
  /shouldRenderDynamicCrowdWithWebgl\(\)/.test(overlayBody),
  'overlay rendering should know when the webgl path owns dynamic agents'
);

assert(
  /if \(!renderDynamicAgentsInWebgl\)/.test(overlayBody),
  'overlay should skip old focus-agent visual circles when webgl is active'
);

console.log('validate_background_webgl_renderer: ok');
