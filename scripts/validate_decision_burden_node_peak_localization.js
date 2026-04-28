const Sim = require('../src/core.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createCapacityScores(overrides = {}) {
  return {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
    ...overrides,
  };
}

function createDecisionOptions(overrides = {}) {
  return {
    capacityScores: createCapacityScores(overrides.capacityScores),
    baseDecisionDelay: 1.0,
    branchCount: 5,
    conflictingSignCount: 2,
    candidatePathCount: 4,
    levelChange: true,
    queueDecision: true,
    flashingAdCount: 1,
    staticAdCount: 1,
    irrelevantSignCount: 1,
    broadcastInterference: 0,
    noiseDb: 65,
    lux: 280,
    crowdDensity: 1.3,
    queueCount: 8,
    timeSinceLastEffectiveGuide: 4,
    distanceSinceLastEffectiveGuide: 6,
    continuousGuideCoverage: 0.3,
    mapSupport: 0.1,
    serviceSupport: 0.1,
    guideReviewLoad: 0,
    ...overrides,
  };
}

function main() {
  const nearNode = Sim.computeDecisionBurdenState(createDecisionOptions({
    decisionNodeProximity: 1,
  }));
  const midNode = Sim.computeDecisionBurdenState(createDecisionOptions({
    decisionNodeProximity: 0.5,
  }));
  const farNode = Sim.computeDecisionBurdenState(createDecisionOptions({
    decisionNodeProximity: 0,
  }));

  assert(nearNode.decisionNodePeakFactor > midNode.decisionNodePeakFactor, 'peak factor should decay away from decision node');
  assert(midNode.decisionNodePeakFactor > farNode.decisionNodePeakFactor, 'peak factor should continue decaying with distance');
  assert(nearNode.score > midNode.score, 'decision burden should be higher at the decision node');
  assert(midNode.score > farNode.score, 'decision burden should taper away from the decision node');
  assert(nearNode.signConflict === farNode.signConflict, 'input normalization should stay unchanged across proximity cases');
  assert(nearNode.pathComparisonCost === farNode.pathComparisonCost, 'path comparison normalization should stay unchanged across proximity cases');

  console.log('validate_decision_burden_node_peak_localization: ok');
}

main();
