const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionSource(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  let depth = 0;
  let end = -1;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && index > start) {
        end = index + 1;
        break;
      }
    }
  }
  assert(end > start, `failed to parse ${name}`);
  return source.slice(start, end);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const functionSource = extractFunctionSource(appSource, 'getBackgroundCrowdRenderStyle');
const getBackgroundCrowdRenderStyle = new Function('clamp', 'state', `${functionSource}; return getBackgroundCrowdRenderStyle;`)(
  clamp,
  { transform: { scale: 1 } }
);

const mediumCrowd = getBackgroundCrowdRenderStyle(700, { scale: 1 });
const highCrowd = getBackgroundCrowdRenderStyle(1500, { scale: 1 });

assert.strictEqual(
  mediumCrowd.fill,
  '#000000',
  'background dots should render in black'
);

assert.strictEqual(
  highCrowd.fill,
  '#000000',
  'background dots should stay black even for higher crowd counts'
);

assert.strictEqual(
  mediumCrowd.alpha,
  highCrowd.alpha,
  'background dots should not fade as crowd count increases'
);

console.log('validate_background_render_style_constant: ok');
