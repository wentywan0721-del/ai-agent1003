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
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount: 120,
  });

  Sim.activateHeatmap(prepared, scenario, {});
  assert(scenario.focusTraceSnapshots.length >= 1, 'expected heatmap activation to seed an initial playback snapshot');
  assert.strictEqual(Number(scenario.focusTraceSnapshots[0].time || 0), 0, 'expected initial playback snapshot to start at time 0');
  assert.strictEqual(Number(scenario.focusTraceSnapshots[0].progress || 0), 0, 'expected initial playback snapshot to start from 0% progress');

  const focusAgent = scenario.focusAgent;
  scenario.focusProgressReferenceDistance = 100;
  focusAgent.progressDist = 24;
  focusAgent.pathProgressDist = 0;
  focusAgent.progress = 0;

  const inspection = Sim.inspectAgent(prepared, scenario, focusAgent.id);
  assert(
    Number(inspection?.progress || 0) > 0.2 && Number(inspection?.progress || 0) < 0.25,
    `expected focus progress to stay above zero after reroute by using accumulated trip distance, got ${inspection?.progress}`
  );
}

main();
console.log('validate_focus_progress_reference: ok');
