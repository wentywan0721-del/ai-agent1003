const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const Runner = require('../server/heatmap-runner.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function buildCrowdedBackgroundField(prepared) {
  const occupiedCellIndices = prepared.grid.walkableIndices.filter((index) => {
    const cell = prepared.grid.cells[index];
    return cell.x > 35 && cell.x < 95 && cell.y > 5 && cell.y < 28;
  });
  return {
    initialTime: 0,
    duration: 960,
    frames: [{ time: 0, agents: [] }],
    densityFrames: [{
      time: 0,
      occupiedCellIndices,
      occupiedCellCounts: occupiedCellIndices.map(() => 2),
    }],
    queueFrames: [],
  };
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
    backgroundField: buildCrowdedBackgroundField(prepared),
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

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 240,
    maxExtendedSimulationSeconds: 960,
    precomputeStepSeconds: 0.18,
  });
  const events = Runner.__private.buildRuntimeEventsFromPlayback(playback);
  const eventTypes = new Set(events.map((event) => event.type));
  ['slow_walk', 'short_rest_started', 'seat_search_started', 'seat_rest_started', 'rest_resumed', 'final_approach', 'route_completed'].forEach((type) => {
    assert(eventTypes.has(type), `expected runtime event ${type}`);
  });

  const plan = Runner.__private.buildRuntimeFallbackDecisionPlanAnalysis(null, events, playback, 'test');
  const thoughts = plan.timeline.map((item) => item.thoughtZh).join('\n');
  ['放慢', '喘口气', '找个座位', '坐下来', '继续往终点', '快到终点', '到达实际终点'].forEach((phrase) => {
    assert(thoughts.includes(phrase), `expected decision-chain thought to include "${phrase}"`);
  });
}

main();
console.log('validate_llm_runtime_chain_covers_rest_journey: ok');
