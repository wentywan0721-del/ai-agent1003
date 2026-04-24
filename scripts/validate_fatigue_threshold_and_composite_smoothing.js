const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createScenario(prepared, capacityScores, seed = 20260422) {
  const startNode = prepared.nodeById.gate_in_2 || prepared.nodeById.gate_in_1;
  return Sim.createScenario(prepared, {
    startPoint: {
      x: startNode.x,
      y: startNode.y,
      z: startNode.z,
    },
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 12,
    focusProfile: {
      capacityScores,
    },
    seed,
  });
}

function stepUntilWalking(prepared, scenario, maxSteps = 32) {
  for (let step = 0; step < maxSteps; step += 1) {
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    if (Number(scenario.focusAgent.currentWalkingSpeed || 0) > 1e-6) {
      return;
    }
  }
  throw new Error('Focus agent never started walking during validation');
}

function main() {
  const prepared = loadPrepared();
  const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

  assert(
    /const BASAL_FATIGUE_VELOCITY = Object\.freeze\(\{\s*1: 0\.135,\s*2: 0\.105,\s*3: 0\.082,\s*4: 0\.066,\s*5: 0\.052,\s*\}\);/m.test(coreJs),
    'expected updated walking fatigue base-rate table'
  );
  assert(
    /const WHEELCHAIR_BASE_FATIGUE_VELOCITY = Object\.freeze\(\{\s*1: 0\.052,\s*2: 0\.046,\s*3: 0\.041,\s*4: 0\.037,\s*5: 0\.032,\s*\}\);/m.test(coreJs),
    'expected updated wheelchair fatigue base-rate table'
  );
  assert(
    /const FATIGUE_THRESHOLD_SLOW_WALK_FACTOR = 0\.5;/.test(coreJs),
    'expected an explicit half-speed factor for post-threshold walking'
  );

  const thresholdScenario = createScenario(prepared, {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
  }, 7001);
  stepUntilWalking(prepared, thresholdScenario);
  const baselineSpeed = Number(thresholdScenario.focusAgent.currentWalkingSpeed || 0);
  assert(
    baselineSpeed > 0.4,
    `expected baseline walking speed before fatigue threshold, got ${baselineSpeed.toFixed(3)}`
  );

  const thresholdAgent = thresholdScenario.focusAgent;
  thresholdAgent.fatigue = thresholdAgent.fatigueThreshold;
  thresholdAgent.restState = 'none';
  thresholdAgent.restMode = null;
  thresholdAgent.restSearchElapsed = 0;
  thresholdAgent.restSearchAbandoned = false;
  thresholdAgent.decisionPauseRemaining = 0;
  thresholdAgent.shortRestRemaining = 0;

  Sim.stepScenario(prepared, thresholdScenario, 0.25, { deferPostProcess: true });

  const slowedSpeed = Number(thresholdAgent.currentWalkingSpeed || 0);
  assert(
    thresholdAgent.restState === 'searching',
    `fatigue threshold should keep the focus agent searching for a seat, got ${thresholdAgent.restState}`
  );
  assert(
    slowedSpeed > 0.01,
    `fatigue threshold should still allow forward movement, got ${slowedSpeed.toFixed(3)}`
  );
  assert(
    slowedSpeed >= baselineSpeed * 0.45 && slowedSpeed <= baselineSpeed * 0.55,
    `fatigue threshold should slow movement to about half speed, baseline=${baselineSpeed.toFixed(3)} slowed=${slowedSpeed.toFixed(3)}`
  );

  const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert(
    /composite:\s*Object\.freeze\(\{[\s\S]*fieldRadiusScale:\s*1\.\d+[\s\S]*densityThresholdScale:\s*0\.\d+[\s\S]*postBlurPixels:\s*(?:0|1)\.\d+/m.test(appJs),
    'composite heatmap style should define display-only smoothing controls for softer transitions and edges'
  );
  assert(
    /paintHeatSurface\(ctx,\s*heatSurface,\s*width,\s*height,\s*heatmapStyle\)/.test(appJs),
    'composite heatmap smoothing should pass the current view style into the heat surface painter'
  );
}

main();
console.log('validate_fatigue_threshold_and_composite_smoothing: ok');
