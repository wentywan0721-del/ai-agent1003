const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function createPreparedWithSeats() {
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
      { id: 'n0', x: 1, y: 1, z: 0 },
    ],
    pressureObjects: [],
    seats: [
      { id: 'seat-near', x: 1.5, y: 0, z: 0, seatCount: 1, label: 'Near seat' },
      { id: 'seat-far', x: 9, y: 0, z: 0, seatCount: 1, label: 'Far seat' },
    ],
  });
}

function createSimpleScenario(prepared, sensoryScore) {
  const profile = Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 3,
      sensory: sensoryScore,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
    },
  });
  const focusAgent = {
    id: 'focus-0',
    routeId: 'route-0',
    routeLabel: 'Route 0',
    isFocusAgent: true,
    active: true,
    queueLocked: false,
    restState: 'none',
    restMode: null,
    selectedTargetNodeId: null,
    selectedTargetNodeLabel: null,
    position: { x: 0, y: 0, z: 0 },
    progress: 0,
    currentPressure: 0,
    cognitiveLoad: 0,
    fatigue: 90,
    crowdDensity: 0,
    environmentNoise: Sim.BASE_ENVIRONMENT_NOISE,
    environmentLighting: Sim.BASE_ENVIRONMENT_LIGHTING,
    queueCount: 0,
    accumulatedStress: 0,
    fatigueThreshold: profile.fatigueThreshold,
    profile,
  };
  return {
    time: 0,
    agents: [focusAgent],
    focusAgentId: 'focus-0',
    focusAgent,
    heat: {
      cellByIndex: {
        0: { pressure: 0, fatigue: 90, heat: 0, usage: 0, progress: 0 },
      },
    },
    seatOccupancy: {},
  };
}

function main() {
  assert.strictEqual(typeof Sim.getPerceptionRadiusForScores, 'function', 'core should export a unified perception-radius helper');
  assert.strictEqual(Sim.getPerceptionRadiusForScores({ sensory: 1 }), 2, 'sensory 1 should map to a 2m perception radius');
  assert.strictEqual(Sim.getPerceptionRadiusForScores({ sensory: 2 }), 7.5, 'sensory 2 should map to a 7.5m perception radius');
  assert.strictEqual(Sim.getPerceptionRadiusForScores({ sensory: 3 }), 10, 'sensory 3 should map to a 10m perception radius');
  assert.strictEqual(Sim.getPerceptionRadiusForScores({ sensory: 4 }), 13, 'sensory 4 should map to a 13m perception radius');
  assert.strictEqual(Sim.getPerceptionRadiusForScores({ sensory: 5 }), 15, 'sensory 5 should map to a 15m perception radius');

  assert.strictEqual(typeof Sim.inspectNearbySeats, 'function', 'core should export seat inspection by perception radius');
  const prepared = createPreparedWithSeats();
  const scenarioLow = createSimpleScenario(prepared, 1);
  const scenarioHigh = createSimpleScenario(prepared, 4);
  const lowSeatInfo = Sim.inspectNearbySeats(prepared, { x: 0, y: 0 }, 90, 100, scenarioLow.focusAgent.profile);
  const highSeatInfo = Sim.inspectNearbySeats(prepared, { x: 0, y: 0 }, 90, 100, scenarioHigh.focusAgent.profile);
  assert.deepStrictEqual(lowSeatInfo.nearbySeats.map((seat) => seat.id), ['seat-near'], 'seat inspection should only include seats inside the low sensory radius');
  assert.deepStrictEqual(highSeatInfo.nearbySeats.map((seat) => seat.id), ['seat-near', 'seat-far'], 'seat inspection should include farther seats when sensory radius is larger');

  const lowInspection = Sim.inspectAgent(prepared, scenarioLow, 'focus-0');
  const highInspection = Sim.inspectAgent(prepared, scenarioHigh, 'focus-0');
  assert.strictEqual(lowInspection.visionRadius, 2, 'agent inspection should expose the low sensory vision radius');
  assert.strictEqual(highInspection.visionRadius, 13, 'agent inspection should expose the higher sensory vision radius');

  assert.strictEqual(typeof Sim.advanceRestSearchState, 'function', 'core should export the searching-rest state transition helper');
  const restAgent = {
    position: { x: 10, y: 10, z: 0 },
    fatigue: 90,
    restState: 'searching',
    restMode: null,
    restSearchElapsed: 35,
    restSearchAbandoned: false,
    restResumeThreshold: 20,
    reservedSeatId: null,
    profile: scenarioLow.focusAgent.profile,
  };
  const crowdedScenario = {
    agents: [],
    seatOccupancy: {},
  };
  const restResult = Sim.advanceRestSearchState(
    prepared,
    crowdedScenario,
    restAgent,
    { crowdDensityPerception: 4 },
    2
  );
  assert.strictEqual(restResult, false, 'searching should continue when no seat or standing point is available');
  assert.strictEqual(restAgent.restState, 'searching', 'agent should keep searching until a seat is reached');
  assert.strictEqual(restAgent.restSearchAbandoned, false, 'agent should not abandon seat search after a timeout');
  assert.strictEqual(
    restAgent.restTargetSeatId,
    null,
    'agent should not lock onto a seat outside the current perception radius while searching'
  );

  assert.strictEqual(typeof Sim.getStandingRestLocationBand, 'function', 'core should export the standing-rest location helper');
  const openRestBand = Sim.getStandingRestLocationBand(
    prepared,
    crowdedScenario,
    { position: { x: 10, y: 10, z: 0 } },
    { crowdDensityLocal: 0.5, crowdDensityPerception: 0.5 }
  );
  const nearWallBand = Sim.getStandingRestLocationBand(
    prepared,
    crowdedScenario,
    { position: { x: 0.3, y: 0.3, z: 0 } },
    { crowdDensityLocal: 0.5, crowdDensityPerception: 0.5 }
  );
  assert.notStrictEqual(openRestBand, null, 'low-density open areas should allow standing rest');
  assert.strictEqual(nearWallBand, 'medium', 'low-density cells with wall distance under 1m should fall back to medium standing rest rather than open-area rest');

  assert(
    appSource.includes("activeViewMode === 'sensory' || activeViewMode === 'vitality'"),
    'app should only show the vision ring in sensory and vitality views'
  );
  assert(
    appSource.includes('function applyVitalitySeatLayerPolicy'),
    'app should centralize vitality seat-layer auto-open and restore logic'
  );
  assert(
    appSource.includes("state.activeLayerCategory = 'seat'"),
    'app should auto-open the seat layer when entering vitality view'
  );
}

main();
console.log('validate_view_rest_rules: ok');
