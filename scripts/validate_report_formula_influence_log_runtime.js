const assert = require('assert');

const Sim = require('../src/core.js');
const simData = require('../data/111.sim.json');

function main() {
  const prepared = Sim.prepareSimData(simData, { healthyAgents: [] });
  const scenario = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: 12.4, y: 34.414, z: 0 },
    targetRegionId: 'exit_d',
    backgroundCrowdCount: 180,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 2,
        cognitive: 2,
        psychological: 3,
        vitality: 3,
      },
    },
    seed: 20260429,
  });

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 180,
    maxExtendedSimulationSeconds: 240,
    precomputeStepSeconds: 0.36,
  });

  const log = Array.isArray(playback.influenceContributionLog) ? playback.influenceContributionLog : [];
  assert(log.length > 0, 'expected playback to include unified influence contribution logs');

  const areaEntries = log.filter((entry) => entry.sourceType === 'area');
  assert(areaEntries.length > 0, 'expected formula-level non-pressure area entries');
  assert(
    areaEntries.some((entry) => entry.componentKey && Number(entry.formulaContribution || entry.contribution || 0) > 0),
    'expected non-pressure entries to carry component keys and formula contributions'
  );

  const locomotorEntries = log.filter((entry) => entry.burdenType === 'locomotor');
  assert(
    locomotorEntries.some((entry) => ['crowdResistance', 'queueResistance', 'narrowPassageResistance', 'baseSpeedPenalty', 'verticalTransferResistance'].includes(entry.componentKey)),
    'expected locomotor formula components to be logged'
  );

  assert(
    log.every((entry) => Number.isFinite(Number(entry.time)) && Number.isFinite(Number(entry.x)) && Number.isFinite(Number(entry.y))),
    'expected every influence entry to include time and position'
  );
}

main();
console.log('validate_report_formula_influence_log_runtime: ok');
