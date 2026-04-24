const assert = require('assert');

const {
  __private: {
    buildDecisionPlanSchema,
    buildDecisionPlanUserPrompt,
  },
} = require('../server/llm-decision-plan.js');

const schema = buildDecisionPlanSchema();
assert.strictEqual(
  schema.properties.timeline.maxItems,
  28,
  'Expected decision-plan schema to allow denser long-route timeline output'
);

const prompt = buildDecisionPlanUserPrompt({
  routeContext: {
    supportsAnchorGeneration: true,
    decisionPointCount: 4,
    pathLengthMeters: 142,
  },
  environmentContext: {
    sampleSummaries: [],
  },
});

assert(
  /at least 8 timeline items/i.test(prompt),
  'Expected long-route prompt guidance to require denser timeline output'
);

assert(
  /checking signs|pausing near guidance|hesitating at branches|recovering after uncertainty/i.test(prompt),
  'Expected prompt guidance to explicitly request human-like sign-checking and hesitation moments'
);

console.log('validate_llm_decision_timeline_density: ok');
