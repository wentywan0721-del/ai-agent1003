const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  /function computeAvoidanceVector\(scenario, selfAgent\) \{[\s\S]*scenario\.agents\.forEach\(/.test(coreJs),
  'Expected computeAvoidanceVector to examine nearby agents instead of returning a zero stub'
);

assert(
  /agent\.crowdAvoidanceStrength\s*=/.test(coreJs),
  'Expected focus locomotor state to derive a crowd-avoidance strength from the LLM route style'
);

assert(
  /const avoidanceShift =[\s\S]*avoidance\.vector/.test(coreJs),
  'Expected materializeAgentPosition to apply the computed avoidance vector to the rendered focus-agent position'
);

console.log('validate_llm_focus_motion_integration: ok');
