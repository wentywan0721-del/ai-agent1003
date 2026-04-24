const Sim = require('../src/core.js');
const UnifiedRules = require('../data/unified-rules.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createPrepared(pressureObjects = []) {
  return {
    pressureObjects,
    activePressureObjects: pressureObjects,
    nodes: [],
    seats: [],
  };
}

function createProfile(capacityScores = {}) {
  return {
    ageBand: '70-74',
    walkingSpeed: 0.8,
    decisionDelay: 0,
    bmi: 23,
    gender: 'female',
    capacityScores: {
      locomotor: 3,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
      ...capacityScores,
    },
  };
}

function createAgent(capacityScores = {}, extra = {}) {
  return {
    id: 'focus-0',
    active: true,
    isFocusAgent: true,
    position: { x: 0, y: 0, z: 0 },
    profile: createProfile(capacityScores),
    accumulatedStress: 0,
    pressureEventStates: {},
    queueCount: 0,
    ...extra,
  };
}

function createScenario(agent = null, rngValues = [0]) {
  let index = 0;
  return {
    agents: agent ? [agent] : [],
    focusAgent: agent,
    rng: {
      next() {
        const value = rngValues[Math.min(index, rngValues.length - 1)];
        index += 1;
        return value;
      },
    },
  };
}

const neutralEnvironment = {
  crowdDensityLocal: 0,
  crowdDensityPerception: 0,
  noiseLevel: 60,
  lightingLevel: 250,
  crowdFatigueCoefficient: 1,
  noiseFatigueCoefficient: 1,
  lightingFatigueCoefficient: 1,
};

const calmEnvironment = {
  ...neutralEnvironment,
  noiseLevel: 59,
};

function manualPsychologicalExpectation(options = {}) {
  const mechanisms = UnifiedRules?.dimensions?.psychological?.mechanisms || {};
  const guidanceWeights = mechanisms.guidanceSupportWeights || {};
  const environmentalWeights = mechanisms.environmentalStressWeights || {};
  const arousalWeights = mechanisms.arousalWeights || {};
  const controlWeights = mechanisms.controlWeights || {};
  const recoveryBaseWeights = mechanisms.recoveryBaseWeights || {};
  const recoveryWeights = mechanisms.recoveryWeights || {};
  const finalWeights = mechanisms.finalWeights || {};
  const capacityScores = {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
    ...(options.capacityScores || {}),
  };

  const baseVp = { 1: 1.30, 2: 1.15, 3: 1.00, 4: 0.85, 5: 0.70 }[capacityScores.psychological];
  const cognitiveMod = { 1: 0.08, 2: 0.04, 3: 0.00, 4: -0.04, 5: -0.08 }[capacityScores.cognitive];
  const sensoryMod = { 1: 0.06, 2: 0.03, 3: 0.00, 4: -0.03, 5: -0.06 }[capacityScores.sensory];
  const locomotorMod = { 1: 0.04, 2: 0.02, 3: 0.00, 4: -0.02, 5: -0.04 }[capacityScores.locomotor];
  const vitalityMod = { 1: 0.08, 2: 0.04, 3: 0.00, 4: -0.04, 5: -0.08 }[capacityScores.vitality];
  const vulnerability = baseVp * (1 + cognitiveMod + sensoryMod + locomotorMod + vitalityMod);

  const noise = clamp((options.ambientNoiseStress || 0) / 100);
  const lighting = clamp((options.ambientLightingStress || 0) / 100);
  const crowd = clamp((options.ambientCrowdingStress || 0) / 100);
  const queue = clamp((options.ambientQueueStress || 0) / 40);
  const event = clamp(((options.persistentStress || 0) + (options.localVisibleStress || 0)) / 200);
  const guidanceSupport = clamp(
    (guidanceWeights.continuousGuideCoverage ?? 0.65) * (options.continuousGuideCoverage || 0)
      + (guidanceWeights.mapSupport ?? 0.20) * (options.mapSupport || 0)
      + (guidanceWeights.serviceSupport ?? 0.15) * (options.serviceSupport || 0)
  );

  const environmentalStress = clamp(
    (environmentalWeights.noise ?? 0.14) * noise
      + (environmentalWeights.lighting ?? 0.14) * lighting
      + (environmentalWeights.crowd ?? 0.26) * crowd
      + (environmentalWeights.queue ?? 0.20) * queue
      + (environmentalWeights.event ?? 0.26) * event
  );
  const arousal = clamp(
    (arousalWeights.environmentalStress ?? 0.34) * environmentalStress
      + (arousalWeights.noise ?? 0.10) * noise
      + (arousalWeights.lighting ?? 0.12) * lighting
      + (arousalWeights.crowd ?? 0.18) * crowd
      + (arousalWeights.queue ?? 0.12) * queue
      + (arousalWeights.event ?? 0.14) * event
  );
  const control = clamp(
    (controlWeights.base ?? 0.50)
      + (controlWeights.guidanceSupport ?? 0.50) * guidanceSupport
      + (controlWeights.crowd ?? -0.18) * crowd
      + (controlWeights.queue ?? -0.20) * queue
      + (controlWeights.noise ?? -0.08) * noise
      + (controlWeights.lighting ?? -0.06) * lighting
      + (controlWeights.event ?? -0.14) * event
  );
  const recoveryBase = clamp(
    (recoveryBaseWeights.quietness ?? 0.24) * (1 - noise)
      + (recoveryBaseWeights.lightingComfort ?? 0.23) * (1 - lighting)
      + (recoveryBaseWeights.lowCrowd ?? 0.29) * (1 - crowd)
      + (recoveryBaseWeights.lowQueue ?? 0.24) * (1 - queue)
  );
  const recovery = clamp(
    (recoveryWeights.base ?? 0.50)
      + (recoveryWeights.recoveryBase ?? 0.45) * recoveryBase
      + (recoveryWeights.environmentalStress ?? -0.20) * environmentalStress
      + (recoveryWeights.crowd ?? -0.12) * crowd
      + (recoveryWeights.queue ?? -0.12) * queue
      + (recoveryWeights.noise ?? -0.06) * noise
      + (recoveryWeights.lighting ?? -0.06) * lighting
      + (recoveryWeights.event ?? -0.08) * event
  );
  const mechanismRaw = clamp(
    (finalWeights.arousal ?? 0.50) * arousal
      + (finalWeights.lossOfControl ?? 0.30) * (1 - control)
      + (finalWeights.lossOfRecovery ?? 0.20) * (1 - recovery)
  );
  const score = clamp(100 * vulnerability * mechanismRaw, 0, 100);

  return {
    vulnerability,
    noise,
    lighting,
    crowd,
    queue,
    event,
    guidanceSupport,
    environmentalStress,
    arousal,
    control,
    recoveryBase,
    recovery,
    mechanismRaw,
    score,
  };
}

function main() {
  assert(typeof Sim.computePsychologicalBurdenState === 'function', 'computePsychologicalBurdenState should exist');

  const customerServiceRule = Sim.resolveStressRuleDescriptor({
    name: 'Customer Service Centre',
    feature: 'Customer Service Centre',
    category: 'facility',
  });
  assertEqual(customerServiceRule.ruleId, 'customer_service_centre', 'customer service rule');

  const aiRule = Sim.resolveStressRuleDescriptor({
    name: 'AI virtual service ambassador',
    feature: '',
    category: 'facility',
  });
  assertEqual(aiRule.ruleId, 'ai_virtual_service_ambassador', 'ai ambassador rule');

  const dynamicAdvertRule = Sim.resolveStressRuleDescriptor({
    name: 'Advertisement',
    feature: 'Dynamic/flashing ads,80 decibels',
    category: 'advert',
    decibel: 80,
  });
  assertEqual(dynamicAdvertRule.ruleId, 'advertisement_dynamic', 'dynamic advert rule');

  const signageRule = Sim.resolveStressRuleDescriptor({
    name: 'Common direction Signs',
    feature: 'EXITS & elevator&Transit Mode Direction',
    category: 'signage',
  });
  assertEqual(signageRule.ruleId, 'common_direction_signs_brief', 'common direction rule');

  const prepared = createPrepared([]);
  const vulnerableCapacityScores = {
    locomotor: 1,
    sensory: 1,
    cognitive: 1,
    psychological: 1,
    vitality: 1,
  };
  const profile = createProfile(vulnerableCapacityScores);
  const expectedMechanism = manualPsychologicalExpectation({
    capacityScores: vulnerableCapacityScores,
    ambientNoiseStress: 0,
    ambientCrowdingStress: 0,
    ambientLightingStress: 0,
    ambientQueueStress: 0,
    persistentStress: 200,
    localVisibleStress: 0,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  const computedMechanism = Sim.computePsychologicalBurdenState({
    capacityScores: vulnerableCapacityScores,
    ambientNoiseStress: 0,
    ambientCrowdingStress: 0,
    ambientLightingStress: 0,
    ambientQueueStress: 0,
    persistentStress: 200,
    localVisibleStress: 0,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  assertClose(computedMechanism.vulnerability, expectedMechanism.vulnerability, 0.001, 'psychological vulnerability');
  assertClose(computedMechanism.environmentalStress, expectedMechanism.environmentalStress, 0.001, 'psychological environmental stress');
  assertClose(computedMechanism.arousal, expectedMechanism.arousal, 0.001, 'psychological arousal');
  assertClose(computedMechanism.control, expectedMechanism.control, 0.001, 'psychological control');
  assertClose(computedMechanism.recovery, expectedMechanism.recovery, 0.001, 'psychological recovery');
  assertClose(computedMechanism.score, expectedMechanism.score, 0.05, 'psychological mechanism score');

  const dimensionState = Sim.deriveFiveDimensionStateAtPoint(
    prepared,
    createScenario(null),
    { x: 0, y: 0, z: 0 },
    {
      profile,
      environment: neutralEnvironment,
      pressureState: {
        pressureScore: 200,
        ambientNoiseStress: 0,
        ambientCrowdingStress: 0,
        ambientLightingStress: 0,
        ambientQueueStress: 0,
        persistentStress: 200,
        localVisibleStress: 0,
      },
      decisionInputs: {
        continuousGuideCoverage: 0,
        mapSupport: 0,
        serviceSupport: 0,
      },
      fatigue: 0,
      fatigueThreshold: 15,
    }
  );
  assertClose(
    dimensionState.vulnerabilities.psychological,
    1.638,
    0.001,
    'psychological composite vulnerability'
  );
  assertClose(
    dimensionState.burdens.psychological.score,
    expectedMechanism.score,
    0.05,
    'psychological burden should follow mechanism-layer formula'
  );
  assertClose(dimensionState.burdens.psychological.arousal, expectedMechanism.arousal, 0.001, 'dimension psychological arousal');
  assertClose(dimensionState.burdens.psychological.control, expectedMechanism.control, 0.001, 'dimension psychological control');
  assertClose(dimensionState.burdens.psychological.recovery, expectedMechanism.recovery, 0.001, 'dimension psychological recovery');

  const weakSupport = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 30,
    ambientCrowdingStress: 25,
    ambientLightingStress: 10,
    ambientQueueStress: 10,
    persistentStress: 70,
    localVisibleStress: 20,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  const strongSupport = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 30,
    ambientCrowdingStress: 25,
    ambientLightingStress: 10,
    ambientQueueStress: 10,
    persistentStress: 70,
    localVisibleStress: 20,
    continuousGuideCoverage: 1,
    mapSupport: 1,
    serviceSupport: 1,
  });
  assert(strongSupport.control > weakSupport.control, 'guidance support should improve psychological control');
  assert(strongSupport.score < weakSupport.score, 'guidance support should reduce psychological risk');

  const mildStress = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 10,
    ambientCrowdingStress: 5,
    ambientLightingStress: 0,
    ambientQueueStress: 0,
    persistentStress: 20,
    localVisibleStress: 0,
    continuousGuideCoverage: 0.8,
    mapSupport: 0.2,
    serviceSupport: 0.2,
  });
  const severeStress = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 60,
    ambientCrowdingStress: 45,
    ambientLightingStress: 30,
    ambientQueueStress: 25,
    persistentStress: 150,
    localVisibleStress: 80,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  assert(severeStress.arousal > mildStress.arousal, 'higher stress inputs should increase arousal');
  assert(severeStress.recovery < mildStress.recovery, 'higher stress inputs should reduce recovery');
  assert(severeStress.score > mildStress.score, 'higher stress inputs should increase psychological risk');

  const noiseOnly = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 100,
    ambientCrowdingStress: 0,
    ambientLightingStress: 0,
    ambientQueueStress: 0,
    persistentStress: 0,
    localVisibleStress: 0,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  const crowdOnly = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 0,
    ambientCrowdingStress: 100,
    ambientLightingStress: 0,
    ambientQueueStress: 0,
    persistentStress: 0,
    localVisibleStress: 0,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  const queueOnly = Sim.computePsychologicalBurdenState({
    capacityScores: { psychological: 3, cognitive: 3, sensory: 3, locomotor: 3, vitality: 3 },
    ambientNoiseStress: 0,
    ambientCrowdingStress: 0,
    ambientLightingStress: 0,
    ambientQueueStress: 40,
    persistentStress: 0,
    localVisibleStress: 0,
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  });
  assert(crowdOnly.score > noiseOnly.score, 'crowding should weigh more than pure noise in psychological burden');
  assert(queueOnly.score > noiseOnly.score, 'queue uncertainty should weigh more than pure noise in psychological burden');

  const advertPoint = {
    id: 'ad-1',
    name: 'Advertisement',
    feature: 'Static ads',
    category: 'advert',
    x: 0,
    y: 0,
    z: 0,
    range: 2.5,
    strength: 0.65,
    activeForSimulation: true,
    simRole: 'pressure',
    lux: 0,
    decibel: 0,
  };
  const advertPrepared = createPrepared([advertPoint]);
  const advertAgent = createAgent();
  const advertScenario = createScenario(advertAgent, [0.1]);
  const firstAdvertPressure = Sim.evaluatePressureStateAtPoint(
    advertPrepared,
    advertScenario,
    advertAgent.position,
    {
      agent: advertAgent,
      applyTriggers: true,
      environment: calmEnvironment,
      queueCount: 0,
    }
  );
  const secondAdvertPressure = Sim.evaluatePressureStateAtPoint(
    advertPrepared,
    advertScenario,
    advertAgent.position,
    {
      agent: advertAgent,
      applyTriggers: true,
      environment: calmEnvironment,
      queueCount: 0,
    }
  );
  assertClose(firstAdvertPressure.pressureScore, 10, 1e-6, 'advert should trigger once on entry');
  assertClose(secondAdvertPressure.pressureScore, 10, 1e-6, 'advert should not retrigger while still visible');
  assertClose(advertAgent.accumulatedStress, 10, 1e-6, 'advert stress should persist after trigger');

  const signagePoint = {
    id: 'sign-1',
    name: 'Common direction Signs',
    feature: 'Exit',
    category: 'signage',
    x: 0,
    y: 0,
    z: 0,
    range: 2.5,
    strength: 0.4,
    activeForSimulation: true,
    simRole: 'pressure',
    lux: 0,
    decibel: 0,
  };
  const signagePrepared = createPrepared([signagePoint]);
  const signageAgent = createAgent({}, { accumulatedStress: 50 });
  const signageScenario = createScenario(signageAgent, [0.1]);
  const firstSignagePressure = Sim.evaluatePressureStateAtPoint(
    signagePrepared,
    signageScenario,
    signageAgent.position,
    {
      agent: signageAgent,
      applyTriggers: true,
      environment: calmEnvironment,
      queueCount: 0,
    }
  );
  const secondSignagePressure = Sim.evaluatePressureStateAtPoint(
    signagePrepared,
    signageScenario,
    signageAgent.position,
    {
      agent: signageAgent,
      applyTriggers: true,
      environment: calmEnvironment,
      queueCount: 0,
    }
  );
  assertClose(firstSignagePressure.pressureScore, 30, 1e-6, 'signage should trigger once on first sight');
  assertClose(secondSignagePressure.pressureScore, 30, 1e-6, 'signage should not retrigger while still visible');
  assertClose(signageAgent.accumulatedStress, 30, 1e-6, 'signage relief should persist after trigger');

  const lightingPressure = Sim.evaluatePressureStateAtPoint(
    prepared,
    createScenario(null),
    { x: 0, y: 0, z: 0 },
    {
      environment: {
        ...neutralEnvironment,
        lightingLevel: 1200,
        lightingFatigueCoefficient: 1.3,
      },
      queueCount: 0,
    }
  );
  assertClose(lightingPressure.ambientLightingStress, 30, 1e-6, 'lighting ambient stress');
  assertClose(lightingPressure.pressureScore, 30, 1e-6, 'lighting should contribute to pressure');

  const queueAgent = createAgent({}, { queueCount: 6 });
  const queuePressure = Sim.evaluatePressureStateAtPoint(
    prepared,
    createScenario(queueAgent),
    queueAgent.position,
    {
      agent: queueAgent,
      environment: neutralEnvironment,
      queueCount: 6,
    }
  );
  assertClose(queuePressure.ambientQueueStress, 25, 1e-6, 'queue ambient stress');
  assertClose(queuePressure.pressureScore, 25, 1e-6, 'queue should contribute to pressure');

  console.log('Psychological rule validation passed');
}

main();
