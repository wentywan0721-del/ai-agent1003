const assert = require('assert');

const { parseDecisionPlanJson } = require('../server/llm-decision-plan.js');

const malformedDeepSeekJson = `\`\`\`json
{
  "summary_zh": "从 B 闸机出发，看到 "出口A" 指示后继续前进
并避开噪音较强的扶梯口",
  "summary_en": "Starting from Gate B, the passenger keeps moving after spotting the \"Exit A\" sign
and avoids the noisier escalator entrance.",
  "route_style": {
    "crowd_avoidance_bias": 0.61,
    "wall_avoidance_bias": 0.48,
    "centerline_bias": 0.56
  },
  "anchors": [
    {
      "order": 1,
      "node_id": "path_sample_3",
      "anchor_kind": "scan",
      "label_zh": "中段确认",
      "label_en": "Mid-route check"
    }
  ],
  "timeline": [
    {
      "order": 1,
      "node_id": "path_sample_3",
      "phase": "scan",
      "thought_zh": "看到 "出口A" 标识，
继续前进",
      "thought_en": "Spots the \"Exit A\" sign,
keeps moving",
      "cue_zh": "导向清晰",
      "cue_en": "Clear guidance"
    }
  ],
  "decisions": []
}
\`\`\``;

const parsed = parseDecisionPlanJson(malformedDeepSeekJson);

assert(parsed, 'Expected the parser to recover a near-JSON DeepSeek response');
assert.strictEqual(typeof parsed.summary_zh, 'string', 'Expected repaired output to keep summary_zh');
assert(parsed.summary_zh.includes('出口A'), 'Expected repaired output to preserve Chinese summary content');
assert(parsed.summary_en.includes('Exit A'), 'Expected repaired output to preserve English summary content');
assert.strictEqual(parsed.route_style.crowd_avoidance_bias, 0.61, 'Expected repaired output to preserve route_style numbers');
assert(Array.isArray(parsed.anchors) && parsed.anchors.length === 1, 'Expected repaired output to preserve anchors');
assert(Array.isArray(parsed.timeline) && parsed.timeline.length === 1, 'Expected repaired output to preserve timeline');
assert(parsed.timeline[0].thought_zh.includes('继续前进'), 'Expected repaired output to preserve multiline Chinese thought text');

console.log('validate_llm_decision_plan_json_repair: ok');
