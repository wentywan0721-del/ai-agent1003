const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const Sim = require('../src/core.js');
const { runHeatmapSimulation } = require('../server/heatmap-runner.js');

function extractConst(source, name) {
  const pattern = new RegExp(`const ${name} = '([^']+)';`);
  const match = source.match(pattern);
  return match ? match[1] : null;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  const rootDir = path.join(__dirname, '..');
  const staleCachePath = path.join(
    rootDir,
    '.cache',
    'heatmap',
    'ac4921041eca23e5b5f00a869e1d83ce9b609fa29235513bcb8891c72c85160b.json'
  );
  assert(fs.existsSync(staleCachePath), 'expected the reported stale focus heatmap cache fixture to exist');
  const staleCache = loadJson(staleCachePath);
  const staleTrace = Array.isArray(staleCache?.heat?.traceSnapshots) ? staleCache.heat.traceSnapshots : [];
  const staleLast = staleTrace[staleTrace.length - 1] || null;
  assert(staleLast, 'expected stale focus cache fixture to contain trace snapshots');
  assert(
    Number(staleLast.progress || 0) < 0.6,
    `expected stale focus cache fixture to reflect the reported mid-route failure, got ${(Number(staleLast.progress || 0) * 100).toFixed(1)}%`
  );

  const raw = loadJson(path.join(rootDir, 'data', 'default-sim.json'));
  const healthyAgents = loadJson(path.join(rootDir, 'data', 'healthy-agents.json'));
  const prepared = Sim.prepareSimData(raw, { healthyAgents });
  const start = prepared.nodeById.gate_in_2;
  assert(start, 'expected gate_in_2 to exist in default sim data');

  const tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'planar-heatmap-fresh-'));
  const freshResult = await runHeatmapSimulation({
    scenarioOptions: {
      startNodeId: 'gate_in_2',
      startPoint: { x: start.x, y: start.y, z: start.z || 0 },
      targetRegionId: 'twl',
      backgroundCrowdCount: 100,
      focusProfile: {
        capacityScores: {
          locomotor: 2,
          sensory: 3,
          cognitive: 3,
          psychological: 3,
          vitality: 1,
        },
      },
      seed: 20260424,
    },
    heatOptions: {
      maxSimulationSeconds: 240,
      maxExtendedSimulationSeconds: 960,
      precomputeStepSeconds: 0.24,
    },
  }, {
    rootDir,
    cacheDir: tempCacheDir,
  });

  const freshTrace = Array.isArray(freshResult?.heat?.traceSnapshots) ? freshResult.heat.traceSnapshots : [];
  const freshLast = freshTrace[freshTrace.length - 1] || null;
  assert(freshLast, 'expected fresh focus playback to contain trace snapshots');
  assert(
    Number(freshLast.progress || 0) >= 0.9,
    `expected current focus simulation to recover far beyond the stale cached failure, got ${(Number(freshLast.progress || 0) * 100).toFixed(1)}%`
  );

  const runnerSource = fs.readFileSync(path.join(rootDir, 'server', 'heatmap-runner.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(rootDir, 'server', 'sim-server.js'), 'utf8');
  const runnerVersion = extractConst(runnerSource, 'HEATMAP_ENGINE_VERSION');
  const serverVersion = extractConst(serverSource, 'EXPECTED_HEATMAP_ENGINE_VERSION');

  assert(runnerVersion, 'expected heatmap runner engine version constant');
  assert(serverVersion, 'expected sim-server heatmap engine version constant');
  assert.strictEqual(serverVersion, runnerVersion, 'sim-server heatmap version gate should match the runner version');
  assert.notStrictEqual(
    staleCache?.meta?.engineVersion || null,
    runnerVersion,
    'expected the stale cached failure to be rejected by a bumped heatmap engine version'
  );
}

main()
  .then(() => {
    console.log('validate_heatmap_engine_version_invalidates_stale_focus_cache: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
