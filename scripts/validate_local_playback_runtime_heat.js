const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const { runHeatmapSimulation } = require('../server/heatmap-runner.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  const simData = readJson(path.join(PROJECT_ROOT, 'data', 'default-sim.json'));
  const healthyAgents = readJson(path.join(PROJECT_ROOT, 'data', 'healthy-agents.json'));
  const payload = {
    simData,
    healthyAgents,
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 100,
      focusRouteId: 'route2',
      focusProfile: {},
    },
    heatOptions: {
      warmupSeconds: 6,
      warmupDt: 0.25,
      maxSimulationSeconds: 8,
    },
  };

  const result = await runHeatmapSimulation(payload, { rootDir: PROJECT_ROOT });
  const serializedHeat = result?.heat?.heat;
  const serializedBackgroundField = result?.heat?.backgroundField;

  assert(serializedHeat, 'local playback result should include serialized heat state');
  assert(Array.isArray(serializedHeat.cells) && serializedHeat.cells.length > 0, 'serialized heat state should include cells');
  assert(Array.isArray(serializedHeat.raw), 'serialized heat state should preserve raw heat values for runtime replay');
  assert(Array.isArray(serializedHeat.pressureAcc), 'serialized heat state should preserve pressure accumulators for runtime replay');
  assert(Array.isArray(serializedHeat.fatigueAcc), 'serialized heat state should preserve fatigue accumulators for runtime replay');
  assert(Array.isArray(serializedHeat.progressAcc), 'serialized heat state should preserve progress accumulators for runtime replay');
  assert(serializedBackgroundField, 'local playback result should include serialized background playback data');
  assert(
    Array.isArray(serializedBackgroundField.frames) && serializedBackgroundField.frames.length > 0,
    'serialized background playback data should include frames'
  );
  assert(
    Array.isArray(serializedBackgroundField.frames[0]?.agents),
    'serialized background playback frames should include agent snapshots'
  );

  const prepared = Sim.prepareSimData(simData, { healthyAgents });
  const scenario = Sim.createScenario(prepared, payload.scenarioOptions);
  Sim.activateHeatmap(prepared, scenario, payload.heatOptions);

  const cells = serializedHeat.cells.map((cell) => ({ ...cell }));
  scenario.heat = {
    ...serializedHeat,
    cells,
    raw: serializedHeat.raw.slice(),
    pressureAcc: serializedHeat.pressureAcc.slice(),
    fatigueAcc: serializedHeat.fatigueAcc.slice(),
    progressAcc: serializedHeat.progressAcc.slice(),
    cellByIndex: Object.fromEntries(cells.map((cell) => [cell.index, cell])),
  };

  assert.doesNotThrow(
    () => Sim.stepScenario(prepared, scenario, 0.1, { skipFocusAgent: true }),
    'runtime replay should keep enough heat state to survive stepScenario refresh'
  );
}

main()
  .then(() => {
    console.log('validate_local_playback_runtime_heat: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
