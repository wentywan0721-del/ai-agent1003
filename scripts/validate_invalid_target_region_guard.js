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
  assert.throws(
    () => {
      Sim.createScenario(prepared, {
        startPoint: { x: startNode.x, y: startNode.y, z: startNode.z },
        targetRegionId: 'exit_d',
        backgroundCrowdCount: 80,
        focusProfile: {
          capacityScores: {
            locomotor: 1,
            sensory: 1,
            cognitive: 1,
            psychological: 1,
            vitality: 1,
          },
        },
        seed: 20260412,
      });
    },
    /缺少有效的目标区域|Unknown target region|target region/i,
    'invalid target region should fail with a clear explicit error instead of a null-property crash'
  );
}

main();
console.log('validate_invalid_target_region_guard: ok');
