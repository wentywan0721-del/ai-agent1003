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

const connectionErrorBody = extractFunctionBody(appSource, 'isLocalSimConnectionError');
assert(
  /ECONNRESET/.test(connectionErrorBody)
  && /ERR_CONNECTION_RESET/.test(connectionErrorBody)
  && /aborted/i.test(connectionErrorBody),
  'local sim connection errors should include reset/aborted reads from large completed result payloads'
);

const pollBody = extractFunctionBody(appSource, 'fetchHeatmapJobResult');
assert(
  /LOCAL_SIM_SERVER_JOB_MAX_TRANSIENT_FAILURES/.test(pollBody),
  'heatmap job polling should tolerate a larger number of transient read failures'
);
assert(
  /Math\.max\(Number\(state\.heatmapComputeProgress \|\| 0\),\s*clamp/.test(pollBody),
  'heatmap job progress should be monotonic and never visually fall back'
);

console.log('validate_heatmap_job_poll_resilience: ok');
