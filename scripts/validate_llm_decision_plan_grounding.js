const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runner = require('../server/heatmap-runner.js');
const llmSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'llm-decision-plan.js'), 'utf8');

assert(
  runner.__private && typeof runner.__private.buildDecisionPlanInput === 'function',
  'Expected heatmap-runner to expose buildDecisionPlanInput for grounding validation'
);

assert(
  /startContext/.test(runner.__private.buildDecisionPlanInput.toString()),
  'Expected LLM decision-plan input to include explicit startContext so it cannot invent an alighting/train origin'
);

assert(
  /allowedPressureMentions/.test(runner.__private.buildDecisionPlanInput.toString()),
  'Expected LLM decision-plan input to include an explicit allowedPressureMentions list'
);

assert(
  /Do not mention LCD/i.test(llmSource)
  && /Do not say.*got off/i.test(llmSource),
  'Expected LLM prompt to forbid invented LCD and alighting context'
);

assert(
  /only reference nodes, pressure objects, and cues that appear in the provided input/i.test(llmSource),
  'Expected LLM prompt to require grounding in provided route evidence'
);

console.log('validate_llm_decision_plan_grounding: ok');
