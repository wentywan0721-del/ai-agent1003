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
  const counts = {};

  for (let seed = 1; seed <= 80; seed += 1) {
    const scenario = Sim.createScenario(prepared, {
      crowdPresetId: 'normal',
      focusRouteId: 'route1',
      focusProfile: {},
      seed,
    });
    scenario.backgroundAgents.forEach((agent) => {
      const endGroupId = agent.route?.endGroupId || null;
      if (!endGroupId) {
        return;
      }
      counts[endGroupId] = Math.max(0, counts[endGroupId] || 0) + 1;
    });
  }

  const verticalDestinationIds = ['elev_3', 'es_down_1_top', 'es_down_4_top', 'es_down_5_top', 'es_down_6_top', 'stair_2_top'];
  const verticalTotal = verticalDestinationIds.reduce((sum, id) => sum + Math.max(0, counts[id] || 0), 0);
  const elevatorShare = verticalTotal > 0 ? (Math.max(0, counts.elev_3 || 0) / verticalTotal) : 0;
  assert(
    elevatorShare < 0.035,
    `expected elevator share to stay below 3.5% of vertical-transfer background routes after the latest rebalance, got ${(elevatorShare * 100).toFixed(1)}%`
  );

  const trainDoorIds = ['train_door1', 'train_door2', 'train_door3', 'train_door4', 'train_door5'];
  const trainDoorCounts = trainDoorIds.map((id) => Math.max(0, counts[id] || 0));
  const totalRoutes = Object.values(counts).reduce((sum, value) => sum + Math.max(0, value || 0), 0);
  const trainDoorTotal = trainDoorCounts.reduce((sum, value) => sum + value, 0);
  const trainShare = totalRoutes > 0 ? trainDoorTotal / totalRoutes : 0;
  const trainMean = trainDoorCounts.reduce((sum, value) => sum + value, 0) / Math.max(1, trainDoorCounts.length);
  const trainSpread = Math.max(...trainDoorCounts) - Math.min(...trainDoorCounts);
  assert(
    trainShare < 0.05,
    `expected train-door destinations to stay below 5% of long-run background routes after the latest rebalance, got ${(trainShare * 100).toFixed(1)}%`
  );
  assert(
    trainSpread <= trainMean * 0.5,
    `expected long-run train-door distribution to stay within 50% of the mean, got spread ${trainSpread} over mean ${trainMean.toFixed(2)}`
  );
  assert(
    new Set(trainDoorCounts).size > 1,
    'expected train-door balancing to stay soft rather than force an exact equal split'
  );
}

main();
console.log('validate_background_distribution_balance: ok');
