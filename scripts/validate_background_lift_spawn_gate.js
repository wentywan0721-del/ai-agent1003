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
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    backgroundCrowdCount: 4,
    focusProfile: {},
    seed: 20260421,
  });

  const waitingNode = prepared.nodeById?.elev_3;
  assert(waitingNode, 'expected elev_3 node');

  const liftOriginRoute = prepared.odRoutes.find((route) => (
    String(route?.startGroupId || '') === 'elev_3'
  ));
  assert(liftOriginRoute, 'expected a background route that starts from elev_3');

  const respawnAgent = scenario.backgroundAgents[0];
  const queueAgent = scenario.backgroundAgents[1];
  assert(respawnAgent && queueAgent, 'expected at least two background agents');

  respawnAgent.route = liftOriginRoute;
  respawnAgent.routeId = liftOriginRoute.id;
  respawnAgent.routeLabel = liftOriginRoute.label;
  respawnAgent.active = false;
  respawnAgent.respawnTimer = 0;

  queueAgent.active = true;
  queueAgent.backgroundState = 'queueing';
  queueAgent.queueTargetNodeId = waitingNode.id;
  queueAgent.queueJoinedAt = 0;
  queueAgent.queueSlotIndex = 1;
  queueAgent.rideRemaining = 0;
  queueAgent.position = { x: waitingNode.x, y: waitingNode.y };
  queueAgent.center = { x: waitingNode.x, y: waitingNode.y };

  scenario.backgroundFacilityQueues = {
    [waitingNode.id]: {
      nodeId: waitingNode.id,
      queueDirection: { x: 0, y: 1 },
      boardingsInCurrentBatch: 0,
      nextBoardReadyTime: scenario.time + 30,
    },
  };

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  assert.strictEqual(
    respawnAgent.active,
    false,
    'background agents should not respawn from elev_3 while the lift still has a visible waiting queue or closed service window'
  );
}

main();
console.log('validate_background_lift_spawn_gate: ok');
