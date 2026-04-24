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
    seed: 20260401,
  });

  const waitingNode = prepared.nodeById?.train_door1;
  assert(waitingNode, 'expected train_door1 node');

  const trainOriginRoute = prepared.odRoutes.find((route) => (
    String(route?.startGroupId || '').includes('train_door')
    && String(route?.startGroupId || '') !== 'train_door1'
  ));
  assert(trainOriginRoute, 'expected a background route that starts from another train door');

  const respawnAgent = scenario.backgroundAgents[0];
  const queueAgent = scenario.backgroundAgents[1];
  assert(respawnAgent && queueAgent, 'expected at least two background agents');

  respawnAgent.route = trainOriginRoute;
  respawnAgent.routeId = trainOriginRoute.id;
  respawnAgent.routeLabel = trainOriginRoute.label;
  respawnAgent.active = false;
  respawnAgent.respawnTimer = 0;

  queueAgent.active = true;
  queueAgent.backgroundState = 'riding';
  queueAgent.queueTargetNodeId = waitingNode.id;
  queueAgent.queueJoinedAt = 0;
  queueAgent.queueSlotIndex = 0;
  queueAgent.rideRemaining = 0.5;
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
    'background agents should not respawn from train doors while another train door is still serving a visible platform queue'
  );
}

main();
console.log('validate_background_train_spawn_gate: ok');
