const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function manualSensoryExpectation(options = {}) {
  const scores = {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
    ...(options.capacityScores || {}),
  };
  const base = 1 + (3 - scores.sensory) * 0.08;
  const vulnerability = base;

  const noiseThreshold = { 1: 45, 2: 50, 3: 60, 4: 80, 5: 999 }[scores.sensory];
  const noisePenalty = noiseThreshold >= 999
    ? 0
    : clamp(((options.noiseDb || 0) - noiseThreshold) / 25, 0, 1) * 0.22;

  const sensitiveLightRange = {
    1: { min: 300, max: 350 },
    2: { min: 300, max: 400 },
    3: { min: 200, max: 500 },
    4: { min: 200, max: 1000 },
    5: { min: 0, max: 9999 },
  }[scores.sensory];
  const comfort = {
    1: { min: 0, max: 300 },
    2: { min: 300, max: 400 },
    3: { min: 200, max: 500 },
    4: { min: 200, max: 1000 },
    5: { min: 0, max: 9999 },
  }[scores.sensory];
  let lightBase = 0;
  if ((options.lux || 0) < comfort.min) {
    lightBase = clamp((comfort.min - (options.lux || 0)) / Math.max(80, comfort.min || 80), 0, 1);
  } else if ((options.lux || 0) > comfort.max) {
    lightBase = clamp(((options.lux || 0) - comfort.max) / Math.max(200, comfort.max * 0.5 || 200), 0, 1);
  }
  const lightingPenalty = lightBase * 0.18;
  const occlusionPenalty = clamp((options.crowdDensityLocal || 0) / 5, 0, 1) * 0.16;
  const visualClutterBase = clamp(
    0.40 * clamp((options.flashingAds || 0) / 2, 0, 1)
    + 0.25 * clamp((options.staticAds || 0) / 3, 0, 1)
    + 0.20 * clamp((options.irrelevantSigns || 0) / 3, 0, 1)
    + 0.15 * clamp((options.hangingSignsInterference || 0) / 3, 0, 1),
    0,
    1
  );
  const visualClutterPenalty = visualClutterBase * 0.12;
  const supportBase = clamp(
    0.50 * (options.continuousGuideCoverage || 0)
    + 0.25 * (options.tactilePavingSupport || 0)
    + 0.15 * (options.audibleCueSupport || 0)
    + 0.10 * (options.nearbyServiceSupport || 0),
    0,
    1
  );
  const supportRelief = supportBase * 0.18;
  const raw = Math.max(
    0,
    Math.max(0, options.objectLoad || 0)
    + noisePenalty
    + lightingPenalty
    + occlusionPenalty
    + visualClutterPenalty
    - supportRelief
  );
  const score = clamp(raw * 100 * vulnerability, 0, 100);
  return {
    vulnerability,
    noisePenalty,
    lightingPenalty,
    occlusionPenalty,
    visualClutterPenalty,
    supportRelief,
    sensitiveLight:
      (options.recognizedObjectCount || 0) > 0
      && ((options.lux || 0) < sensitiveLightRange.min || (options.lux || 0) > sensitiveLightRange.max),
    raw,
    score,
  };
}

function main() {
  assert.strictEqual(typeof Sim.computeSensoryBurdenState, 'function', 'computeSensoryBurdenState should exist');

  const expected = manualSensoryExpectation({
    capacityScores: {
      sensory: 2,
      cognitive: 1,
      psychological: 2,
      locomotor: 1,
      vitality: 2,
    },
    objectLoad: 0.32,
    noiseDb: 72,
    lux: 180,
    crowdDensityLocal: 2.5,
    flashingAds: 2,
    staticAds: 2,
    irrelevantSigns: 2,
    hangingSignsInterference: 1,
    continuousGuideCoverage: 0.25,
    tactilePavingSupport: 0.1,
    audibleCueSupport: 0.0,
    nearbyServiceSupport: 0.2,
    recognizedObjectCount: 1,
  });

  const actual = Sim.computeSensoryBurdenState({
    capacityScores: {
      sensory: 2,
      cognitive: 1,
      psychological: 2,
      locomotor: 1,
      vitality: 2,
    },
    objectLoad: 0.32,
    noiseDb: 72,
    lux: 180,
    crowdDensityLocal: 2.5,
    flashingAds: 2,
    staticAds: 2,
    irrelevantSigns: 2,
    hangingSignsInterference: 1,
    continuousGuideCoverage: 0.25,
    tactilePavingSupport: 0.1,
    audibleCueSupport: 0.0,
    nearbyServiceSupport: 0.2,
    recognizedObjectCount: 1,
  });

  assertClose(actual.vulnerability, expected.vulnerability, 0.001, 'sensory vulnerability');
  assertClose(actual.visualClutterPenalty, expected.visualClutterPenalty, 0.001, 'sensory clutter penalty');
  assertClose(actual.supportRelief, expected.supportRelief, 0.001, 'sensory support relief');
  assertClose(actual.score, expected.score, 0.05, 'sensory burden score');
  assert.strictEqual(actual.sensitiveNoise, true, 'recognized-object noise sensitivity should be exposed when threshold is exceeded');
  assert.strictEqual(actual.sensitiveLight, expected.sensitiveLight, 'recognized-object light sensitivity should use the dedicated sensitivity range');

  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  const prepared = Sim.prepareSimData(raw, { healthyAgents });
  const profile = Sim.buildFocusProfile({
    capacityScores: { locomotor: 3, sensory: 3, cognitive: 3, psychological: 3, vitality: 3 },
  });
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: profile,
    seed: 20260406,
  });

  const denseHall = Sim.deriveFiveDimensionStateAtPoint(prepared, scenario, { x: 15, y: 9 }, { profile });
  const denseElevator = Sim.deriveFiveDimensionStateAtPoint(prepared, scenario, { x: 44, y: 8 }, { profile });
  const calmerMid = Sim.deriveFiveDimensionStateAtPoint(prepared, scenario, { x: 33, y: 10 }, { profile });

  assert(
    denseHall.burdens.sensory.score < 80,
    `expected dense hall sensory score to stay below 80 after sensory-rule alignment, got ${denseHall.burdens.sensory.score}`
  );
  assert(
    denseElevator.burdens.sensory.score < 82,
    `expected dense elevator sensory score to stay below 82 after sensory-rule alignment, got ${denseElevator.burdens.sensory.score}`
  );
  assert(
    denseHall.burdens.sensory.score > calmerMid.burdens.sensory.score,
    'expected dense hall sensory burden to remain higher than a calmer mid-concourse point'
  );
}

main();
console.log('validate_sensory_rules: ok');
