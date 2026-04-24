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
  assert.strictEqual(
    typeof Sim.getScenarioCrowdDensityAtPoint,
    'function',
    'expected core to export getScenarioCrowdDensityAtPoint so focus agents can read background density directly'
  );

  const probePoint = prepared.nodeById.gate_in_2 || prepared.nodeById.gate_in_1;
  assert(probePoint, 'expected a gate-in node to exist for density probing');
  const densityCell = prepared.grid.walkableIndices.find((index) => Sim.distance(prepared.grid.cells[index], probePoint) <= prepared.grid.cellSize * 1.5);
  assert(Number.isInteger(densityCell), 'expected to find a walkable cell near the probe point');

  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundField: {
      version: 'density-probe-only',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents: [],
      frames: [{ time: 0, seatOccupancy: {}, agents: [] }],
      densityFrames: [{
        time: 0,
        occupiedCellIndices: [densityCell],
        occupiedCellCounts: [6],
      }],
      queueFrames: [{
        time: 0,
        nodes: [{ nodeId: 'gate_in_2', count: 0 }],
      }],
    },
  });

  scenario.backgroundAgents.forEach((agent) => {
    agent.active = false;
  });

  const localDensity = Sim.getScenarioCrowdDensityAtPoint(prepared, scenario, probePoint, scenario.focusAgent, 'local');
  const perceptionDensity = Sim.getScenarioCrowdDensityAtPoint(prepared, scenario, probePoint, scenario.focusAgent, 'perception');
  assert(localDensity > 0, 'expected focus-agent crowd lookup to read local density from the precomputed background field');
  assert(perceptionDensity > 0, 'expected focus-agent crowd lookup to read perceived density from the precomputed background field');

  const annulusCell = prepared.grid.walkableIndices.find((index) => {
    const cell = prepared.grid.cells[index];
    const cellDistance = Sim.distance(cell, probePoint);
    return cellDistance >= 3.45 && cellDistance <= 3.95;
  });
  assert(Number.isInteger(annulusCell), 'expected to find a walkable cell in the 3.5m-4.0m density annulus around the probe point');

  const annulusScenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundField: {
      version: 'density-probe-4m-radius',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents: [],
      frames: [{ time: 0, seatOccupancy: {}, agents: [] }],
      densityFrames: [{
        time: 0,
        occupiedCellIndices: [annulusCell],
        occupiedCellCounts: [1],
      }],
      queueFrames: [{
        time: 0,
        nodes: [],
      }],
    },
  });
  annulusScenario.backgroundAgents.forEach((agent) => {
    agent.active = false;
  });

  const annulusLocalDensity = Sim.getScenarioCrowdDensityAtPoint(prepared, annulusScenario, probePoint, annulusScenario.focusAgent, 'local');
  assert(
    annulusLocalDensity > 0,
    'expected local crowd density to still detect occupants between 3.5m and 4.0m from the probe point'
  );
}

main();
console.log('validate_focus_reads_background_density: ok');
