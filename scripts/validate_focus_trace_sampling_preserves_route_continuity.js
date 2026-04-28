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
    backgroundField: {
      initialTime: 0,
      duration: 960,
      frames: [{ time: 0, agents: [] }],
      densityFrames: [{
        time: 0,
        occupiedCellIndices: prepared.grid.walkableIndices.filter((index) => {
          const cell = prepared.grid.cells[index];
          return cell.x > 35 && cell.x < 95 && cell.y > 5 && cell.y < 28;
        }),
        occupiedCellCounts: prepared.grid.walkableIndices
          .filter((index) => {
            const cell = prepared.grid.cells[index];
            return cell.x > 35 && cell.x < 95 && cell.y > 5 && cell.y < 28;
          })
          .map(() => 2),
      }],
      queueFrames: [],
    },
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
  const trace = Array.isArray(playback.traceSnapshots) ? playback.traceSnapshots : [];
  assert(trace.length > 1000, 'expected a long playback trace');

  let maxGap = 0;
  let maxGapIndex = -1;
  for (let index = 1; index < trace.length; index += 1) {
    const gap = Number(trace[index].time || 0) - Number(trace[index - 1].time || 0);
    if (gap > maxGap) {
      maxGap = gap;
      maxGapIndex = index;
    }
  }

  assert(
    maxGap <= 3,
    `expected trace downsampling to preserve route continuity; max time gap was ${maxGap.toFixed(2)}s at index ${maxGapIndex}`
  );
}

main();
console.log('validate_focus_trace_sampling_preserves_route_continuity: ok');
