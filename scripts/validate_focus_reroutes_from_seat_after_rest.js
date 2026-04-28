const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  const prepared = loadPrepared();
  const startNode = prepared.nodeById.gate_in_4;
  assert(startNode, 'expected Exit D entry gate node');

  const scenario = Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'exit_c',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260427,
  });

  const agent = scenario.focusAgent;
  const seat = prepared.seats.find((item) => item.x < 60 && item.y < 16);
  assert(seat, 'expected a nearby seat fixture for the Exit D to Exit C route');

  agent.position = { x: seat.x, y: seat.y, z: seat.z || 0 };
  agent.center = { ...agent.position };
  agent.restState = 'sitting';
  agent.restMode = 'sitting';
  agent.restResumeThreshold = 80;
  agent.fatigue = 79.9;
  agent.reservedSeatId = seat.id;
  scenario.seatOccupancy[seat.id] = 1;

  const previousRouteId = agent.routeId;
  Sim.stepScenario(prepared, scenario, 0.18, {
    deferPostProcess: true,
    maxSubstepSeconds: 0.18,
  });

  assert.strictEqual(agent.restState, 'none', 'expected sitting rest to clear once fatigue is below resume threshold');
  assert.notStrictEqual(
    agent.routeId,
    previousRouteId,
    'expected focus route to be rebuilt from the actual seat position after rest'
  );
  assert(
    Sim.distance(agent.route.startAnchor, seat) <= 0.01,
    'expected the post-rest route start anchor to match the current seat position'
  );
  assert(
    agent.pathProgressDist <= 0.01,
    'expected path progress to restart on the new route from the seat position'
  );
}

main();
console.log('validate_focus_reroutes_from_seat_after_rest: ok');
