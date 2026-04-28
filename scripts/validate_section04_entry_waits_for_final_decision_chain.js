const assert = require('assert');
const fs = require('fs');
const path = require('path');

const simServerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');
const heatmapRunnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');
const heatmapVersionMatch = heatmapRunnerJs.match(/const HEATMAP_ENGINE_VERSION = '([^']+)';/);
assert(heatmapVersionMatch, 'Expected heatmap runner to declare HEATMAP_ENGINE_VERSION');
const expectedHeatmapVersion = heatmapVersionMatch[1];

assert(
  simServerJs.includes(`const EXPECTED_HEATMAP_ENGINE_VERSION = '${expectedHeatmapVersion}';`),
  'Expected sim-server cache compatibility version to track the current heatmap engine so old preview caches cannot hide the latest Section04 decision-chain logic'
);

assert(
  /runHeatmapSimulationWithFallback\(payload,\s*\{[\s\S]*mode: 'final',/.test(simServerJs),
  'Expected the initial heatmap job to wait for the final simulation result so Section04 opens with the decision chain already available'
);

assert(
  !/runHeatmapSimulationWithFallback\(payload,\s*\{[\s\S]*mode: 'preview',/.test(simServerJs),
  'Expected the initial heatmap job flow to stop returning preview-only results that leave Section04 without an immediate decision chain'
);

console.log('validate_section04_entry_waits_for_final_decision_chain: ok');
