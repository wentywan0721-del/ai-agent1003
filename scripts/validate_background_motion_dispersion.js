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
    backgroundCrowdCount: 40,
    focusProfile: {},
    seed: 20260401,
  });

  const templateAgent = scenario.backgroundAgents.find((agent) => agent?.active && agent?.path?.length > 10);
  assert(templateAgent, 'expected an active background agent with a usable path');

  const sampleAgents = scenario.backgroundAgents
    .filter((agent) => agent?.active)
    .slice(0, 12);

  assert(sampleAgents.length >= 10, 'expected enough background agents to measure same-route dispersion');

  sampleAgents.forEach((agent) => {
    agent.route = templateAgent.route;
    agent.routeId = templateAgent.routeId;
    agent.routeLabel = templateAgent.routeLabel;
    agent.path = templateAgent.path;
    agent.pathLength = templateAgent.pathLength;
    agent.pathProgressDist = agent.path.length * 0.45;
    agent.progressDist = agent.pathProgressDist;
    agent.backgroundState = 'moving';
    agent.active = true;
    agent.profile = {
      ...(agent.profile || {}),
      walkingSpeed: 0.95,
    };
    agent.personalBias = 0;
    agent.laneBias = 0;
  });

  Sim.stepScenario(prepared, scenario, 0.05, { deferPostProcess: true, skipFocusAgent: true });

  let maxPairDistance = 0;
  for (let leftIndex = 0; leftIndex < sampleAgents.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sampleAgents.length; rightIndex += 1) {
      const leftAgent = sampleAgents[leftIndex];
      const rightAgent = sampleAgents[rightIndex];
      const pairDistance = Math.hypot(
        Number(leftAgent.position?.x || 0) - Number(rightAgent.position?.x || 0),
        Number(leftAgent.position?.y || 0) - Number(rightAgent.position?.y || 0)
      );
      maxPairDistance = Math.max(maxPairDistance, pairDistance);
    }
  }

  assert(
    maxPairDistance > 0.55,
    `background agents on the same route and same progress should still show a broad dispersion cloud, got max pair distance ${maxPairDistance}`
  );
}

main();
console.log('validate_background_motion_dispersion: ok');
