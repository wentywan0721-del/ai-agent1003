const assert = require('assert');

const Sim = require('../src/core.js');

function main() {
  assert.strictEqual(typeof Sim.resolveSensoryRelevantObjectWeight, 'function', 'resolveSensoryRelevantObjectWeight should be exported');

  const baseRules = Sim.getUnifiedRules()?.dimensions?.sensory?.mechanisms || {};

  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'exit_guidance', sensoryRole: 'guide' }, null, baseRules),
    0.24,
    'exit guidance should use exit weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'integrated_guidance', sensoryRole: 'guide' }, null, baseRules),
    0.24,
    'integrated guidance should use integrated weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'line_guidance', sensoryRole: 'guide' }, null, baseRules),
    0.22,
    'line guidance should use line weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'line_reference', sensoryRole: 'guide' }, null, baseRules),
    0.22,
    'line reference should use line weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'map_guidance', sensoryRole: 'guide' }, null, baseRules),
    0.20,
    'map guidance should use map weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'dynamic_platform_info', sensoryRole: 'guide' }, null, baseRules),
    0.18,
    'lcd/platform info should use lcd weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ guideType: 'service_guidance', sensoryRole: 'service' }, null, baseRules),
    0.14,
    'service guidance should use service weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ sensoryRole: 'node-cue' }, null, baseRules),
    0.18,
    'node cues should use node weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ semanticId: 'seat' }, null, baseRules),
    0.10,
    'seat should use seat weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ semanticId: 'hanging_signs', decisionRole: 'distractor', sensoryRole: 'guide' }, null, baseRules),
    0,
    'hanging signs should not also add object-load weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ semanticId: 'broadcast_guidance', sensoryRole: 'guide' }, null, baseRules),
    0,
    'broadcast guidance should contribute to support, not visual object-load weight'
  );
  assert.strictEqual(
    Sim.resolveSensoryRelevantObjectWeight({ semanticId: 'tactile_paving_endpoint', decisionRole: 'distractor', sensoryRole: 'node-cue' }, null, baseRules),
    0,
    'tactile paving endpoint should contribute to tactile support, not node object-load weight'
  );
}

main();
console.log('validate_sensory_object_weights: ok');
