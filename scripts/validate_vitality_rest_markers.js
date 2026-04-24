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
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

  assert(appSource.includes('short-rest-marker'), 'app should render dedicated short-rest markers in the vitality view');
  assert(styleSource.includes('.short-rest-marker'), 'styles should define the short-rest marker appearance');

  const prepared = loadPrepared();
  const preset = prepared.focusRoutePresets.find((item) => item.id === 'route1') || prepared.focusRoutePresets[0];
  const scenario = Sim.createScenario(prepared, {
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    crowdPresetId: prepared.crowdPresets[0].id,
    focusRouteId: preset.id,
  });

  Sim.activateHeatmap(prepared, scenario, {});
  scenario.focusAgent.fatigue = 45;
  scenario.focusAgent.shortRestTriggeredThresholds = {};
  scenario.focusAgent.restState = 'none';
  scenario.focusAgent.restMode = null;

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });

  assert(Array.isArray(scenario.focusTraceSnapshots) && scenario.focusTraceSnapshots.length > 0, 'heat playback should capture focus trace snapshots');
  const markerSnapshot = scenario.focusTraceSnapshots.find((snapshot) => snapshot.shortRestMarker);
  assert(markerSnapshot, 'a short-rest trigger should be recorded into the focus trace snapshots');
  assert.strictEqual(markerSnapshot.shortRestMarker.thresholdPercent, 30, 'the first short-rest threshold should be recorded');
  assert(markerSnapshot.shortRestMarker.fatiguePercent >= 45, 'marker metadata should include the fatigue percentage at trigger time');
  assert(markerSnapshot.shortRestMarker.radiusMeters > 0, 'marker radius should scale from fatigue percentage');
}

main();
console.log('validate_vitality_rest_markers: ok');
