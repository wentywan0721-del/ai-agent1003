const assert = require('assert');
const exported = require('../server/llm-decision-plan.js');
const {
  buildDecisionPlanFailureAnalysis,
  __private: {
    buildDecisionPlanSchema,
    buildDecisionPlanUserPrompt,
    normalizeDecisionPlanContent,
  },
} = exported;

const failurePayload = buildDecisionPlanFailureAnalysis(null, new Error('test failure'));
assert.strictEqual(
  failurePayload.analysisKind,
  'decision-plan',
  'Expected failure payloads to keep analysisKind="decision-plan"'
);

const schema = buildDecisionPlanSchema();
assert(schema.properties.route_style, 'Expected decision-plan schema to expose route_style');
assert(
  schema.properties.route_style.properties.crowd_avoidance_bias
    && schema.properties.route_style.properties.wall_avoidance_bias
    && schema.properties.route_style.properties.centerline_bias
    && schema.properties.route_style.properties.turn_commitment_bias
    && schema.properties.route_style.properties.hesitation_bias,
  'Expected route_style to include the richer motion-shaping bias fields'
);
assert(schema.properties.anchors, 'Expected decision-plan schema to support intermediate anchors output');
assert(schema.properties.timeline, 'Expected decision-plan schema to support micro-thought timeline output');

const prompt = buildDecisionPlanUserPrompt({
  request: { startNodeId: 'node-a', targetRegionId: 'exit-1' },
  routeContext: {
    supportsAnchorGeneration: true,
    pathLengthMeters: 48.6,
  },
  decisionPoints: [{ nodeId: 'node-a', candidateTargetNodeIds: ['node-b', 'node-c'] }],
});
assert(
  /"anchors"\s*:\s*\[/.test(prompt),
  'Expected decision-plan prompt contract to request anchors[] in the JSON payload'
);
assert(
  /"timeline"\s*:\s*\[/.test(prompt),
  'Expected decision-plan prompt contract to request timeline[] in the JSON payload'
);
assert(
  /supportsAnchorGeneration/i.test(prompt)
    && /at least 1 anchor/i.test(prompt)
    && /at least (4|8) timeline/i.test(prompt)
    && /checking signs|pausing near guidance|hesitating at branches/i.test(prompt),
  'Expected decision-plan prompt guidance to explicitly require anchors and timeline output for long routes that support anchor generation'
);

const normalized = normalizeDecisionPlanContent({
  summary_zh: '已生成更丰富的老人行进决策计划。',
  summary_en: 'A richer elderly walking decision plan is ready.',
  route_style: {
    crowd_avoidance_bias: 0.82,
    wall_avoidance_bias: 0.61,
    centerline_bias: 0.57,
    turn_commitment_bias: 0.74,
    hesitation_bias: 0.35,
  },
  anchors: [
    {
      order: 1,
      node_id: 'node-a',
      anchor_kind: 'scan',
      label_zh: '先看导向标识',
      label_en: 'Checks the wayfinding sign first',
      note_zh: '先确认是不是正确出口方向',
      note_en: 'Confirms the exit direction before moving',
    },
  ],
  timeline: [
    {
      order: 1,
      node_id: 'node-a',
      phase: 'hesitate',
      thought_zh: '这里人有点多，先慢半拍再走。',
      thought_en: 'This area feels busy, so the first move is slower.',
      cue_zh: '前方人群较密集',
      cue_en: 'The crowd ahead looks dense',
    },
  ],
  decisions: [
    {
      order: 1,
      decision_node_id: 'node-a',
      chosen_target_node_id: 'node-b',
      decision_zh: '沿着更宽的通道前进',
      decision_en: 'Continue through the wider corridor',
      reason_zh: '拥挤更少，转向更容易',
      reason_en: 'It is less crowded and easier to turn through',
      context_zh: '站在闸机旁，先确认方向',
      context_en: 'Standing near the gates and confirming direction first',
    },
  ],
}, { id: 'openai', label: 'OpenAI', connected: true });

assert(Array.isArray(normalized.anchors), 'Expected normalized decision-plan output to include anchors[]');
assert.strictEqual(normalized.anchors.length, 1, 'Expected normalized anchors[] to preserve entries');
assert.strictEqual(normalized.anchors[0].nodeId, 'node-a', 'Expected anchors[] to normalize node_id');
assert.strictEqual(normalized.anchors[0].anchorKind, 'scan', 'Expected anchors[] to normalize anchor kind');

assert(Array.isArray(normalized.timeline), 'Expected normalized decision-plan output to include timeline[]');
assert.strictEqual(normalized.timeline.length, 1, 'Expected normalized timeline[] to preserve entries');
assert.strictEqual(normalized.timeline[0].nodeId, 'node-a', 'Expected timeline[] to normalize node_id');
assert.strictEqual(normalized.timeline[0].phase, 'hesitate', 'Expected timeline[] to normalize phase');

assert(Array.isArray(normalized.decisions), 'Expected normalized decision-plan output to keep decisions[]');
assert.strictEqual(normalized.decisions.length, 1, 'Expected normalized decision-plan output to keep older decisions[] consumers working');
assert.strictEqual(normalized.routeStyle.turnCommitmentBias, 0.74, 'Expected routeStyle to normalize turn_commitment_bias');
assert.strictEqual(normalized.routeStyle.hesitationBias, 0.35, 'Expected routeStyle to normalize hesitation_bias');

console.log('validate_llm_humanlike_plan_schema: ok');
