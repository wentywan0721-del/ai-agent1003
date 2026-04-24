const assert = require('assert');

const Sim = require('../src/core.js');

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function createPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'node-0', x: 10, y: 10, z: 0 },
    ],
    pressureObjects: [],
    seats: [],
  });
}

function createScenario() {
  return {
    time: 0,
    agents: [],
    seatOccupancy: {},
    rng: {
      next() {
        return 0.5;
      },
    },
  };
}

function createState(prepared, distanceMeters, recognitionSample) {
  const capacityScores = {
    locomotor: 3,
    sensory: 1,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
  };
  const profile = Sim.buildFocusProfile({ capacityScores });
  const point = { x: 2, y: 2, z: 0 };
  const semantic = {
    semanticId: 'common_direction_signs',
    decisionRole: 'guide',
    decisionSupport: 'continuous-guide',
    sensoryRole: 'guide',
  };
  return Sim.deriveFiveDimensionStateAtPoint(prepared, createScenario(), point, {
    profile,
    capacityScores,
    environment: {
      crowdDensityLocal: 0,
      crowdDensityPerception: 0,
      noiseLevel: 60,
      lightingLevel: 300,
      crowdFatigueCoefficient: 1,
      noiseFatigueCoefficient: 1,
      lightingFatigueCoefficient: 1,
    },
    pressureState: {
      pressureScore: 0,
      normalizedPressure: 0,
      contributions: [],
      persistentStress: 0,
      localVisibleStress: 0,
      ambientNoiseStress: 0,
      ambientCrowdingStress: 0,
      ambientLightingStress: 0,
      ambientQueueStress: 0,
    },
    pressureObjects: [
      {
        item: {
          id: `guide-${distanceMeters}`,
          name: 'common direction signs',
          x: point.x + distanceMeters,
          y: point.y,
          z: 0,
        },
        distance: distanceMeters,
        semantic,
      },
    ],
    nearbyNodes: [],
    nearbySeats: [],
    recognitionSampler() {
      return recognitionSample;
    },
  });
}

function main() {
  const prepared = createPrepared();

  const recognizedState = createState(prepared, 1.5, 0.2);
  assert(
    recognizedState.burdens.sensory.recognizedObjects.some((item) => item.id === 'guide-1.5'),
    'an object inside the perception radius should be recognized when rand() < Conf_i'
  );
  assert.strictEqual(
    recognizedState.burdens.sensory.missedObjects.length,
    0,
    'recognized-object sampling should not also classify the same object as missed'
  );

  const missedInsideState = createState(prepared, 1.5, 0.4);
  assert(
    missedInsideState.burdens.sensory.missedObjects.some((item) => item.id === 'guide-1.5'),
    'an object inside the perception radius should be missed when rand() >= Conf_i'
  );

  const missedOutsideState = createState(prepared, 5, 0.0);
  const farMiss = missedOutsideState.burdens.sensory.missedObjects.find((item) => item.id === 'guide-5');
  assert.strictEqual(farMiss, undefined, 'objects outside the perception radius should not enter the current sensory recognition set');
  assertClose(
    missedOutsideState.burdens.sensory.objectLoad,
    0,
    0.001,
    'objects beyond the perception radius should not contribute to the current sensory object load'
  );
}

main();
console.log('validate_sensory_recognition_rules: ok');
