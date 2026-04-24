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
  const start = prepared.nodeById.gate_in_1;
  const scenario = Sim.createScenario(prepared, {
    focusProfile: {},
    crowdPresetId: 'normal',
    backgroundCrowdCount: 100,
    startPoint: { x: start.x, y: start.y, z: start.z },
    targetRegionId: 'kdt',
    seed: 20260327,
  });

  let previousWrong = 0;
  let previousBacktrack = 0;
  for (let frame = 0; frame < 1200; frame += 1) {
    Sim.stepScenario(prepared, scenario, 0.1, { deferPostProcess: true });
    const focus = scenario.focusAgent;
    const wrong = Number(focus.decisionWrongTurnRemaining || 0);
    const backtrack = Number(focus.decisionBacktrackRemaining || 0);
    const triggeredWrong = wrong > 1e-6 && previousWrong <= 1e-6;
    const triggeredBacktrack = backtrack > 1e-6 && previousBacktrack <= 1e-6;
    if (triggeredWrong || triggeredBacktrack) {
      const problemSignCount = Number(focus.lastDecisionDiagnostics?.problemSignCount || 0);
      assert(
        problemSignCount > 0,
        `expected wrong-turn/backtrack to require a problem sign, got problemSignCount=${problemSignCount} at node ${focus.lastDecisionDiagnostics?.decisionNodeId || 'unknown'}`
      );
    }
    previousWrong = wrong;
    previousBacktrack = backtrack;
  }
}

main();
console.log('validate_focus_problem_sign_gating: ok');
