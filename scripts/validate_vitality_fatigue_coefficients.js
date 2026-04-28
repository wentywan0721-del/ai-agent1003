const assert = require('assert');

const Sim = require('../src/core.js');
const UNIFIED_RULES = require('../data/unified-rules.js');

function assertClose(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

function assertTable(actual, expected, message) {
  assert.deepStrictEqual(
    Object.fromEntries(Object.entries(actual).map(([key, value]) => [key, Number(value)])),
    Object.fromEntries(Object.entries(expected).map(([key, value]) => [key, Number(value)])),
    message
  );
}

function main() {
  const vitality = UNIFIED_RULES.crossModifiers.vitality;
  assertTable(vitality.sensoryFatigueMultiplier, { 1: 1.6, 2: 1.35, 3: 1.15, 4: 1, 5: 1 }, 'sensory fatigue multiplier table mismatch');
  assertTable(vitality.psychologicalFatigueMultiplier, { 1: 1.5, 2: 1.3, 3: 1.1, 4: 1, 5: 1 }, 'psychological fatigue multiplier table mismatch');
  assertTable(vitality.cognitiveFatigueMultiplier, { 1: 1.55, 2: 1.32, 3: 1.12, 4: 1, 5: 1 }, 'cognitive fatigue multiplier table mismatch');
  assertTable(vitality.locomotorFatigueMultiplier, { 1: 1.1, 2: 1.8, 3: 1.5, 4: 1.2, 5: 1 }, 'locomotor fatigue multiplier table mismatch');

  assertClose(Sim.getCrowdingFatigueCoefficient(0.6), 1, 'crowding <1 coefficient mismatch');
  assertClose(Sim.getCrowdingFatigueCoefficient(2), 1.1, 'crowding 1-3 coefficient mismatch');
  assertClose(Sim.getCrowdingFatigueCoefficient(4.2), 1.2, 'crowding 3-5 coefficient mismatch');
  assertClose(Sim.getCrowdingFatigueCoefficient(6.5), 1.3, 'crowding >5 coefficient mismatch');

  assertClose(Sim.getNoiseFatigueCoefficient(55), 1, 'noise <=60 coefficient mismatch');
  assertClose(Sim.getNoiseFatigueCoefficient(65), 1.1, 'noise 61-70 coefficient mismatch');
  assertClose(Sim.getNoiseFatigueCoefficient(75), 1.1, 'noise 70-80 coefficient mismatch');
  assertClose(Sim.getNoiseFatigueCoefficient(85), 1.3, 'noise >80 coefficient mismatch');
}

main();
console.log('validate_vitality_fatigue_coefficients: ok');
