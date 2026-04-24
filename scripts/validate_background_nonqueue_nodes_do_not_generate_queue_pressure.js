const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function placeAgentsNearNode(agents, node, count) {
  for (let index = 0; index < count; index += 1) {
    const agent = agents[index];
    const offsetX = (index % 2 === 0 ? -1 : 1) * (0.35 + 0.08 * (index % 3));
    const offsetY = 0.45 * Math.floor(index / 2);
    agent.active = true;
    agent.position = {
      x: node.x + offsetX,
      y: node.y + offsetY,
      z: node.z || 0,
    };
  }
}

function inspectNode(prepared, scenario, nodeId) {
  const node = prepared.nodeById?.[nodeId];
  assert(node, `node not found: ${nodeId}`);
  const subject = {
    id: `subject-${nodeId}`,
    active: true,
    profile: Sim.buildFocusProfile({}),
    selectedTargetNodeId: nodeId,
    position: { x: node.x, y: node.y, z: node.z || 0 },
  };
  return Sim.deriveFiveDimensionStateAtPoint(prepared, scenario, node, {
    agent: subject,
    profile: subject.profile,
    selectedTargetNodeId: nodeId,
  });
}

function main() {
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: prepared.focusRoutePresets[0].id,
    focusProfile: {},
    backgroundCrowdCount: 80,
    seed: 1,
  });

  const ordinaryNodeId = 'gate_out_1';
  const explicitQueueNodeId = (prepared.nodes || []).find((node) => /^train_door_?\d+$/i.test(node.id))?.id || 'elev_3';

  placeAgentsNearNode(scenario.agents, prepared.nodeById[ordinaryNodeId], 6);
  const ordinaryState = inspectNode(prepared, scenario, ordinaryNodeId);

  assert(
    ordinaryState.context.decisionInputs.queueCount >= 6,
    `ordinary terminal node should count nearby people within queue radius, got ${ordinaryState.context.decisionInputs.queueCount}`
  );
  assert.strictEqual(
    ordinaryState.context.decisionInputs.queueDecision,
    true,
    `ordinary terminal node should infer queueDecision, got ${ordinaryState.context.decisionInputs.queueDecision}`
  );
  assert(
    ordinaryState.burdens.psychological.ambientQueueStress > 0,
    `ordinary terminal node should contribute ambientQueueStress, got ${ordinaryState.burdens.psychological.ambientQueueStress}`
  );

  placeAgentsNearNode(scenario.agents, prepared.nodeById[explicitQueueNodeId], 6);
  const explicitQueueState = inspectNode(prepared, scenario, explicitQueueNodeId);

  assert(
    explicitQueueState.burdens.psychological.ambientQueueStress > 0,
    `explicit queue node should still produce ambientQueueStress, got ${explicitQueueState.burdens.psychological.ambientQueueStress}`
  );
}

main();
console.log('validate_background_nonqueue_nodes_do_not_generate_queue_pressure: ok');
