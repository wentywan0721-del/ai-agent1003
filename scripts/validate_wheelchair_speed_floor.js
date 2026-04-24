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
  const startNode = prepared.nodeById.gate_in_1;
  const scenario = Sim.createScenario(prepared, {
    startPoint: {
      x: startNode.x,
      y: startNode.y,
      z: startNode.z,
    },
    targetRegionId: 'kdt',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 1,
        sensory: 1,
        cognitive: 1,
        psychological: 1,
        vitality: 1,
      },
    },
    seed: 20260411,
  });

  let peakSpeed = 0;
  for (let step = 0; step < 32; step += 1) {
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    peakSpeed = Math.max(peakSpeed, Number(scenario.focusAgent.currentWalkingSpeed || 0));
  }

  assert(
    peakSpeed >= 0.45,
    `wheelchair agent should not be compressed into a near-stop crawl at route start, got peak speed ${peakSpeed.toFixed(3)}`
  );
  assert(
    scenario.focusAgent.pathProgressDist >= 1.5,
    `wheelchair agent should make visible route progress after startup, got ${scenario.focusAgent.pathProgressDist.toFixed(3)}m`
  );
}

main();
console.log('validate_wheelchair_speed_floor: ok');
