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

const body = extractFunctionBody(appSource, 'handleSettingsStartAnalysis');
const commitIndex = body.indexOf('state.focusProfile = createFocusProfile(state.agentModal.draft);');
const generateIndex = body.indexOf('handleGenerateCrowd();');

assert(
  commitIndex >= 0,
  'Section02 start analysis must commit the current radar draft into state.focusProfile'
);
assert(
  generateIndex >= 0 && commitIndex < generateIndex,
  'Section02 must commit the agent draft before generating the scenario and heatmap payload'
);

console.log('validate_settings_start_analysis_commits_agent_draft: ok');
