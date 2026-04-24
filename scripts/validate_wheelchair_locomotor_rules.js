const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  assert.strictEqual(typeof Sim.buildFocusProfile, 'function', 'Expected buildFocusProfile to be exported');
  assert.strictEqual(typeof Sim.computeRealtimeFatigueDelta, 'function', 'Expected computeRealtimeFatigueDelta to be exported');

  const profile = Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 1,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 5,
    },
  });

  assert.strictEqual(profile.capacityScores.locomotor, 1, 'Wheelchair locomotor score should stay at 1');
  assert.strictEqual(profile.capacityScores.vitality, 5, 'Wheelchair locomotor branch should keep vitality independent');
  assert(profile.baseFatigueRatePercentPerSecond < 0.091, 'Wheelchair fatigue base rate should stay below the strongest walking baseline');
  assert.strictEqual(profile.disableShortRest, true, 'Wheelchair profile should disable short rest');
  assert.strictEqual(profile.disableSeatRest, true, 'Wheelchair profile should disable seat-rest search');
  assert.deepStrictEqual(profile.shortRestThresholdsPercent, [], 'Wheelchair profile should expose no short-rest thresholds');
  assert(profile.seatSearchThresholdPercent > 100, 'Wheelchair profile should not trigger seat-search rest');

  const quietDelta = Sim.computeRealtimeFatigueDelta(profile, {
    crowdFatigueCoefficient: 1,
    noiseFatigueCoefficient: 1,
    lightingFatigueCoefficient: 1,
  }, 1);
  const harshDelta = Sim.computeRealtimeFatigueDelta(profile, {
    crowdFatigueCoefficient: 1,
    noiseFatigueCoefficient: 1.5,
    lightingFatigueCoefficient: 1.3,
  }, 1);
  assert(
    harshDelta - quietDelta < 0.01,
    `Wheelchair fatigue should react only weakly to noise/light escalation, got quiet=${quietDelta}, harsh=${harshDelta}`
  );

  const prepared = loadPrepared();
  const preset = prepared.focusRoutePresets.find((item) => item.id === 'route1') || prepared.focusRoutePresets[0];
  const scenario = Sim.createScenario(prepared, {
    focusProfile: profile,
    crowdPresetId: prepared.crowdPresets[0].id,
    focusRouteId: preset.id,
    seed: 20260410,
  });
  scenario.focusAgent.fatigue = 95;
  scenario.focusAgent.restState = 'none';
  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
  assert.strictEqual(scenario.focusAgent.restState, 'none', 'Wheelchair agent should not trigger rest states even at high fatigue');
}

main();
console.log('validate_wheelchair_locomotor_rules: ok');
