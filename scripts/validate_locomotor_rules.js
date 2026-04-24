const assert = require('assert');

const Sim = require('../src/core.js');
const inspectorUtils = require('../src/inspector-utils.js');

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
        [30, 0],
        [30, 18],
        [0, 18],
      ],
    ],
    obstacles: [
      [
        [10, 7],
        [12, 7],
        [12, 11],
        [10, 11],
      ],
    ],
    nodes: [
      { id: 'gate_out_1', x: 27, y: 9 },
      { id: 'elev_1', x: 22, y: 9 },
      { id: 'stair_1', x: 6, y: 9, attributes: { name: 'stair_1' } },
      { id: 'es_up_1', x: 14, y: 9, attributes: { name: 'es_up_1' } },
    ],
    pressureObjects: [],
    seats: [],
  });
}

function createEnvironment(overrides = {}) {
  return {
    crowdDensityLocal: 0,
    crowdDensityPerception: 0,
    noiseLevel: Sim.BASE_ENVIRONMENT_NOISE,
    lightingLevel: Sim.BASE_ENVIRONMENT_LIGHTING,
    crowdFatigueCoefficient: 1,
    noiseFatigueCoefficient: 1,
    lightingFatigueCoefficient: 1,
    ...overrides,
  };
}

function main() {
  assert.strictEqual(typeof Sim.computeLocomotorMechanicsAtPoint, 'function', 'Expected locomotor mechanics helper export');
  assert.strictEqual(typeof Sim.getLocomotorFacilityEligibility, 'function', 'Expected locomotor facility eligibility helper export');

  const profile = Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 2,
      sensory: 1,
      cognitive: 2,
      psychological: 1,
      vitality: 1,
    },
  });
  const prepared = createPrepared();
  const scenario = {
    agents: [],
    time: 0,
    focusAgent: {
      profile,
      fatigue: 20,
      fatigueThreshold: 100,
      queueCount: 12,
      selectedTargetNodeId: 'elev_1',
    },
  };
  const point = { x: 21.2, y: 9 };

  const mechanics = Sim.computeLocomotorMechanicsAtPoint(
    prepared,
    scenario,
    point,
    {
      profile,
      fatigue: 20,
      fatigueThreshold: 100,
      queueCount: 12,
      environment: createEnvironment({
        crowdDensityLocal: 3.8,
        crowdDensityPerception: 3.8,
      }),
    }
  );

  assert(mechanics.vulnerability > 1.2, 'Cross-capacity vulnerability should amplify locomotor burden');
  assert(mechanics.crowdMultiplier >= 1.5, 'Locomotor-2 should use the amplified high-density crowd multiplier');
  assert(mechanics.microJam > 0, 'High density with low locomotor score should generate micro-jam pressure');
  assert(mechanics.narrowPassageResistance >= 0, 'Mechanics payload should expose narrow-passage resistance');
  assert.strictEqual(mechanics.behavior, 'severely_blocked', 'Low locomotor score in dense vertical zone should enter severe blocking behavior');
  assertClose(mechanics.speedFactor, 0.25, 1e-6, 'Locomotor-2 severe blocking should clamp speed factor to 0.25');

  const lowEligibility = Sim.getLocomotorFacilityEligibility(profile.capacityScores, 'stair');
  const escalatorEligibility = Sim.getLocomotorFacilityEligibility(profile.capacityScores, 'escalator');
  const elevatorEligibility = Sim.getLocomotorFacilityEligibility(profile.capacityScores, 'elevator');
  assert.strictEqual(lowEligibility.allowed, false, 'Locomotor-2 should forbid stairs');
  assert.strictEqual(escalatorEligibility.allowed, false, 'Locomotor-2 should forbid escalators');
  assert.strictEqual(elevatorEligibility.allowed, true, 'Locomotor-2 should still allow elevators');

  const openCorridorMechanics = Sim.computeLocomotorMechanicsAtPoint(
    prepared,
    {
      agents: [],
      time: 0,
      focusAgent: {
        profile,
        fatigue: 20,
        fatigueThreshold: 100,
        queueCount: 0,
      },
    },
    { x: 20, y: 3 },
    {
      profile,
      fatigue: 20,
      fatigueThreshold: 100,
      queueCount: 0,
      environment: createEnvironment({
        crowdDensityLocal: 0,
        crowdDensityPerception: 0,
      }),
    }
  );
  assert(openCorridorMechanics.score < 50, 'Open corridor should not stay in a high locomotor burden band');
  assert.notStrictEqual(openCorridorMechanics.behavior, 'crowd_blocked', 'Open corridor should not be classified as crowd blocked');

  const farFromVerticalMechanics = Sim.computeLocomotorMechanicsAtPoint(
    prepared,
    {
      agents: [],
      time: 0,
      focusAgent: {
        profile,
        fatigue: 20,
        fatigueThreshold: 100,
        queueCount: 0,
      },
    },
    { x: 20, y: 3 },
    {
      profile,
      fatigue: 20,
      fatigueThreshold: 100,
      queueCount: 0,
      environment: createEnvironment({
        crowdDensityLocal: 0.6,
        crowdDensityPerception: 0.6,
      }),
    }
  );
  assert(farFromVerticalMechanics.verticalTransferResistance < 0.03, 'Vertical-transfer resistance should stay local to the facility area');

  const fieldState = inspectorUtils.buildAgentProfileFieldState({
    profile,
    inspection: {
      walkingSpeed: profile.walkingSpeed,
      crowdDensity: 3.8,
      queueCount: 12,
      burdenScores: { locomotor: mechanics.score },
      fiveDimensions: {
        burdens: {
          locomotor: mechanics,
        },
      },
    },
  });
  assert(fieldState.dynamicFields.some((item) => item.id === 'movementBehavior'), 'Agent panel should expose locomotor behavior');
  assert(fieldState.dynamicFields.some((item) => item.id === 'movementMainCause'), 'Agent panel should expose locomotor main cause');

  const issuePanelState = inspectorUtils.buildIssuePanelState({
    viewMode: 'locomotor',
    locale: 'zh-CN',
    inspection: {
      x: point.x,
      y: point.y,
      walkingSpeed: profile.walkingSpeed,
      crowdDensity: 3.8,
      queueCount: 12,
      fiveDimensions: {
        context: {
          nearbyNodes: [
            { id: 'elev_1', name: 'Elevator 1', semanticId: 'elevator', distance: 1.2 },
          ],
        },
        burdens: {
          locomotor: mechanics,
        },
      },
    },
  });
  assert.strictEqual(issuePanelState.mode, 'issues', 'Locomotor view should expose issue items');
  assert.deepStrictEqual(
    issuePanelState.items.map((item) => item.id),
    ['locomotor-crowd', 'locomotor-queue', 'locomotor-vertical'],
    'Locomotor issue panel should rank the new locomotor categories'
  );
  const crowdItem = issuePanelState.items.find((item) => item.id === 'locomotor-crowd');
  const queueItem = issuePanelState.items.find((item) => item.id === 'locomotor-queue');
  const verticalItem = issuePanelState.items.find((item) => item.id === 'locomotor-vertical');
  assert(
    crowdItem && String(crowdItem.summary || '').includes('人群密度'),
    'Locomotor crowd card should explain that crowd density is obstructing movement'
  );
  assert(
    queueItem && String(queueItem.summary || '').includes('排队') && String(queueItem.summary || '').includes('主通行带'),
    'Locomotor queue card should explain that queueing is occupying the main corridor'
  );
  assert.strictEqual(
    queueItem?.mapTargetId,
    'elev_1',
    'Locomotor queue card should anchor to the nearby vertical-transfer node for approximate queue highlighting'
  );
  assert.strictEqual(
    queueItem?.overlayKind,
    'queue-zone',
    'Locomotor queue card should request queue-zone overlay rendering'
  );
  assert(
    verticalItem && String(verticalItem.summary || '').includes('竖向换乘'),
    'Locomotor vertical card should explain that vertical transfer is increasing locomotor burden'
  );
  assert.strictEqual(
    verticalItem?.mapTargetId,
    'elev_1',
    'Locomotor vertical card should map to the nearby vertical node'
  );
}

main();
console.log('validate_locomotor_rules: ok');
