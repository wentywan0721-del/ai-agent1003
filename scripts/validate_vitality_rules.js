const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function createCapacityScores(overrides = {}) {
  return {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
    ...overrides,
  };
}

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  assert(typeof Sim.buildFocusProfile === 'function', 'Expected buildFocusProfile to be exported');

  const referenceScores = createCapacityScores({
    locomotor: 4,
    sensory: 3,
    cognitive: 4,
    psychological: 2,
    vitality: 4,
  });

  const youngerProfile = Sim.buildFocusProfile({
    ageBand: '65-69',
    gender: 'male',
    bmi: 18.2,
    capacityScores: referenceScores,
  });
  const olderProfile = Sim.buildFocusProfile({
    ageBand: '85+',
    gender: 'female',
    bmi: 35.0,
    capacityScores: referenceScores,
  });

  assertClose(youngerProfile.walkingSpeed, olderProfile.walkingSpeed, 1e-6, 'Walking speed should depend on five-dimension scores, not age/gender/BMI');
  assertClose(youngerProfile.decisionDelay, olderProfile.decisionDelay, 1e-6, 'Decision delay should depend on five-dimension scores, not age/gender/BMI');
  assertClose(youngerProfile.fatigueThreshold, 100, 1e-6, 'Fatigue threshold should use the 0-100 vitality scale');
  assertClose(olderProfile.fatigueThreshold, 100, 1e-6, 'Fatigue threshold should stay on the 0-100 vitality scale');

  assertClose(youngerProfile.walkingSpeed, 0.90, 1e-6, 'Locomotor 4 with vitality 4 should produce the expected base walking speed');
  assertClose(youngerProfile.decisionDelay, 0.81, 1e-6, 'Cognitive 4 with sensory 3 and psychological 2 should produce the expected decision delay');
  assertClose(youngerProfile.baseFatigueRatePercentPerSecond, 0.056, 1e-6, 'Vitality 4 should expose the updated lower base fatigue accumulation rate');
  assertClose(youngerProfile.seatSearchThresholdPercent, 85, 1e-6, 'Seat-search threshold should follow the 0325 vitality rule');
  assert(Array.isArray(youngerProfile.shortRestThresholdsPercent), 'Expected short-rest thresholds to be exposed');
  assert(youngerProfile.shortRestThresholdsPercent.join(',') === '85', 'Vitality 4 short-rest thresholds should match the rules table');

  const normalized = Sim.normalizeCapacityScores({
    locomotor: 5,
    vitality: 1,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
  }, {});
  assert(normalized.locomotor === 5, 'Locomotor score should stay unchanged');
  assert(normalized.vitality === 4, 'Vitality score should be clamped to within one level of locomotor');

  const constrainedProfile = Sim.buildFocusProfile({
    capacityScores: createCapacityScores({
      locomotor: 5,
      vitality: 1,
      cognitive: 5,
      sensory: 5,
      psychological: 5,
    }),
  });
  assertClose(constrainedProfile.walkingSpeed, 1.10, 1e-6, 'Walking speed should follow locomotor baseline without a vitality speed multiplier');
  assertClose(constrainedProfile.baseFatigueRatePercentPerSecond, 0.056, 1e-6, 'Constrained vitality should lift the fatigue rate to the allowed adjacent score');

  const state = Sim.deriveFiveDimensionStateAtPoint(
    { pressureObjects: [], activePressureObjects: [], nodes: [], seats: [] },
    { agents: [], time: 0 },
    { x: 0, y: 0, z: 0 },
    {
      profile: youngerProfile,
      capacityScores: youngerProfile.capacityScores,
      environment: {
        crowdDensityLocal: 0,
        crowdDensityPerception: 0,
        noiseLevel: 60,
        lightingLevel: 250,
        crowdFatigueCoefficient: 1,
        noiseFatigueCoefficient: 1,
        lightingFatigueCoefficient: 1,
      },
      pressureState: { pressureScore: 0, normalizedPressure: 0, contributions: [] },
      fatigue: 50,
      fatigueThreshold: 100,
      queueCount: 0,
    }
  );
  assert(state && state.burdens && state.burdens.vitality, 'Expected vitality burden payload');
  assertClose(state.burdens.vitality.raw, 50, 1e-6, 'Vitality raw value should stay on the 0-100 fatigue scale');
  assertClose(state.burdens.vitality.score, 46, 1e-6, 'Vitality burden should be current fatigue percentage multiplied by vitality vulnerability');

  const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
  const fatigueDeltaMatch = coreSource.match(/const fatigueDelta =([\s\S]*?)agent\.crowdDensity =/);
  assert(fatigueDeltaMatch, 'Expected to find the real-time fatigueDelta formula');
  assert(!fatigueDeltaMatch[1].includes('queueFatigueCoefficient'), 'Real-time fatigue accumulation should no longer multiply by queue coefficient');
  assert(coreSource.includes('const waitCost = waitTime * (0.5 * basalVelocity) * getQueueFatigueCoefficient(queueCount);'), 'Queue fatigue coefficient should remain in the facility wait-cost layer');

  const prepared = loadPrepared();
  const preset = prepared.focusRoutePresets.find((item) => item.id === 'route1') || prepared.focusRoutePresets[0];
  const pauseScenario = Sim.createScenario(prepared, {
    focusProfile: {
      capacityScores: createCapacityScores({ locomotor: 3, sensory: 3, cognitive: 3, psychological: 3, vitality: 3 }),
    },
    crowdPresetId: prepared.crowdPresets[0].id,
    focusRouteId: preset.id,
  });
  pauseScenario.focusAgent.fatigue = 10;
  pauseScenario.focusAgent.decisionPauseRemaining = 0.6;
  const fatigueBeforePause = pauseScenario.focusAgent.fatigue;
  Sim.stepScenario(prepared, pauseScenario, 0.25, { deferPostProcess: true });
  assert(
    pauseScenario.focusAgent.fatigue > fatigueBeforePause,
    'Decision pauses should still consume time and increase fatigue outside of rest states'
  );
}

main();
console.log('validate_vitality_rules: ok');
