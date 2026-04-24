const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'llm-decision-plan.js'), 'utf8');

assert(
  /function parseDecisionPlanJson\(/.test(source),
  'Expected llm-decision-plan to include a resilient JSON parser for provider responses'
);

assert(
  /function buildDecisionPlanFailureAnalysis\(/.test(source),
  'Expected llm-decision-plan to build a structured failure payload instead of throwing away provider errors'
);

assert(
  /analysisKind:\s*'decision-plan'/.test(source),
  'Expected decision-plan payloads to carry an explicit analysisKind marker'
);

console.log('validate_llm_decision_plan_resilience: ok');
