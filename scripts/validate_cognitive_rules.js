const Sim = require('../src/core.js');
const UnifiedRules = require('../data/unified-rules.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
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
    branchCount: 3,
    conflictingSignCount: 1,
    candidatePathCount: 3,
    levelChange: true,
    queueDecision: true,
    flashingAdCount: 1,
    staticAdCount: 2,
    irrelevantSignCount: 1,
    broadcastInterference: 1,
    noiseDb: 70,
    lux: 180,
    crowdDensity: 1.8,
    queueCount: 6,
    timeSinceLastEffectiveGuide: 8,
    distanceSinceLastEffectiveGuide: 10,
    continuousGuideCoverage: 0.25,
    mapSupport: 0.2,
    serviceSupport: 0.1,
    guideReviewLoad: 0,
    decisionNodeProximity: 1,
    ...overrides,
  };
}

function manualDecisionExpectation(options) {
  const scores = createCapacityScores(options.capacityScores);
  const decisionModel = UnifiedRules?.dimensions?.cognitive?.mechanisms?.decisionModel || {};
  const mechanismWeights = decisionModel.mechanismWeights || {};
  const finalScoreWeights = decisionModel.finalScore || {};
  const distractorWeights = decisionModel.distractorLoadWeights || {};
  const guidanceWeights = decisionModel.guidanceSupportWeights || {};
  const behaviorWeights = decisionModel.behaviorWeights || {};
  const vcBase = { 1: 1.3, 2: 1.15, 3: 1.0, 4: 0.85, 5: 0.7 }[scores.cognitive];
  const sensoryMod = { 1: 0.10, 2: 0.05, 3: 0.00, 4: -0.05, 5: -0.10 }[scores.sensory];
  const psychologicalMod = { 1: 0.08, 2: 0.04, 3: 0.00, 4: -0.04, 5: -0.08 }[scores.psychological];
  const locomotorMod = { 1: 0.04, 2: 0.02, 3: 0.00, 4: -0.02, 5: -0.04 }[scores.locomotor];
  const vitalityMod = { 1: 0.06, 2: 0.03, 3: 0.00, 4: -0.03, 5: -0.06 }[scores.vitality];
  const vc = vcBase * (1 + sensoryMod + psychologicalMod + locomotorMod + vitalityMod);

  const m0 = { 1: 0.35, 2: 0.50, 3: 0.65, 4: 0.80, 5: 0.92 }[scores.cognitive];
  const a0 = { 1: 0.40, 2: 0.55, 3: 0.70, 4: 0.84, 5: 0.94 }[scores.cognitive];
  const p0 = { 1: 0.35, 2: 0.50, 3: 0.65, 4: 0.80, 5: 0.92 }[scores.cognitive];

  const branchComplexity = clamp((options.branchCount - 1) / 4, 0, 1);
  const signConflict = clamp(options.conflictingSignCount / 2, 0, 1);
  const pathComparisonCost = clamp(
    ((options.candidatePathCount - 1) / 3)
      + (options.levelChange ? 0.25 : 0)
      + (options.queueDecision ? 0.25 : 0),
    0,
    1
  );
  const distractorLoad = clamp(
    (distractorWeights.flashingAds ?? 0.52) * clamp(options.flashingAdCount / 2, 0, 1)
      + (distractorWeights.staticAds ?? 0.20) * clamp(options.staticAdCount / 3, 0, 1)
      + (distractorWeights.irrelevantSigns ?? 0.20) * clamp(options.irrelevantSignCount / 3, 0, 1)
      + (distractorWeights.broadcastInterference ?? 0.08) * clamp(options.broadcastInterference / 1, 0, 1),
    0,
    1
  );
  const noisePenalty = clamp((options.noiseDb - 55) / 25, 0, 1);
  const lightingPenalty = clamp(
    Math.max((250 - options.lux) / 200, (options.lux - 800) / 1000, 0),
    0,
    1
  );
  const crowdPenalty = clamp((options.crowdDensity - 0.8) / 2.2, 0, 1);
  const queueUncertainty = clamp((options.queueCount - 2) / 8, 0, 1);
  const timeDecay = clamp(options.timeSinceLastEffectiveGuide / 12, 0, 1);
  const distanceDecay = clamp(options.distanceSinceLastEffectiveGuide / 18, 0, 1);
  const guidanceSupport = clamp(
    (guidanceWeights.continuousGuideCoverage ?? 0.55) * options.continuousGuideCoverage
      + (guidanceWeights.mapSupport ?? 0.30) * options.mapSupport
      + (guidanceWeights.serviceSupport ?? 0.15) * options.serviceSupport,
    0,
    1
  );
  const guideReviewLoad = clamp(options.guideReviewLoad, 0, 1);
  const decisionNodePeak = decisionModel.decisionNodePeak || {};
  const decisionNodeProximity = clamp(
    Number.isFinite(Number(options.decisionNodeProximity)) ? options.decisionNodeProximity : 0,
    0,
    1
  );
  const decisionNodePeakFactor = clamp(
    (decisionNodePeak.floor ?? 0.35) + (1 - (decisionNodePeak.floor ?? 0.35)) * decisionNodeProximity,
    0,
    1
  );
  const environmentWeightedAverage = clamp(
    (0.20 * noisePenalty) + (0.40 * lightingPenalty) + (0.40 * crowdPenalty),
    0,
    1
  );

  const m = clamp(
    m0
      + (mechanismWeights.memoryRetention?.timeDecay ?? -0.16) * timeDecay
      + (mechanismWeights.memoryRetention?.distanceDecay ?? -0.10) * distanceDecay
      + (mechanismWeights.memoryRetention?.distractorLoad ?? -0.24) * distractorLoad
      + (mechanismWeights.memoryRetention?.noisePenalty ?? -0.08) * noisePenalty
      + (mechanismWeights.memoryRetention?.lightingPenalty ?? -0.10) * lightingPenalty
      + (mechanismWeights.memoryRetention?.crowdPenalty ?? -0.11) * crowdPenalty
      + (mechanismWeights.memoryRetention?.branchComplexity ?? -0.10) * branchComplexity,
    0,
    1
  );
  const a = clamp(
    a0
      + (mechanismWeights.attentionFocus?.guidanceSupport ?? 0.30) * guidanceSupport
      + (mechanismWeights.attentionFocus?.distractorLoad ?? -0.30) * distractorLoad
      + (mechanismWeights.attentionFocus?.noisePenalty ?? -0.08) * noisePenalty
      + (mechanismWeights.attentionFocus?.lightingPenalty ?? -0.10) * lightingPenalty
      + (mechanismWeights.attentionFocus?.crowdPenalty ?? -0.10) * crowdPenalty,
    0,
    1
  );
  const p = clamp(
    p0
      + (mechanismWeights.problemSolving?.guidanceSupport ?? 0.24) * guidanceSupport
      + (mechanismWeights.problemSolving?.branchComplexity ?? -0.24) * branchComplexity
      + (mechanismWeights.problemSolving?.signConflict ?? -0.26) * signConflict
      + (mechanismWeights.problemSolving?.pathComparisonCost ?? -0.18) * pathComparisonCost
      + (mechanismWeights.problemSolving?.queueUncertainty ?? -0.12) * queueUncertainty
      + (mechanismWeights.problemSolving?.environmentWeightedAverage ?? -0.08) * environmentWeightedAverage,
    0,
    1
  );
  const o = clamp(0.34 * m + 0.33 * a + 0.33 * p, 0, 1);

  const decisionReactionTime = options.baseDecisionDelay * (
    1
    + (behaviorWeights.decisionReactionTime?.branchComplexity ?? 0.50) * branchComplexity
    + (behaviorWeights.decisionReactionTime?.signConflict ?? 0.35) * signConflict
    + (behaviorWeights.decisionReactionTime?.memoryDeficit ?? 0.40) * (1 - m)
    + (behaviorWeights.decisionReactionTime?.attentionDeficit ?? 0.45) * (1 - a)
    + (behaviorWeights.decisionReactionTime?.problemDeficit ?? 0.50) * (1 - p)
  );
  const missGuideProbability = clamp(
    (behaviorWeights.missGuideProbability?.attentionDeficit ?? 0.58) * (1 - a)
    + (behaviorWeights.missGuideProbability?.distractorLoad ?? 0.24) * distractorLoad
    + (behaviorWeights.missGuideProbability?.noisePenalty ?? 0.08) * noisePenalty,
    0,
    1
  );
  const wrongTurnProbability = clamp(
    (behaviorWeights.wrongTurnProbability?.problemDeficit ?? 0.42) * (1 - p)
    + (behaviorWeights.wrongTurnProbability?.signConflict ?? 0.30) * signConflict
    + (behaviorWeights.wrongTurnProbability?.memoryDeficit ?? 0.18) * (1 - m),
    0,
    1
  );
  const recheckProbability = clamp(0.35 * (1 - m) + 0.30 * (1 - a) + 0.20 * (1 - o), 0, 1);
  const backtrackProbability = clamp(
    0.45 * wrongTurnProbability
      + 0.25 * recheckProbability
      + 0.20 * (1 - o),
    0,
    1
  );
  const recheckPauseTime = clamp(
      0.8
      + 1.2 * branchComplexity
      + 0.8 * signConflict
      + 1.0 * (1 - a)
      + 0.8 * (1 - m),
    0.8,
    4.5
  );
  const recheckSlowWalkDuration = recheckPauseTime;
  const recheckSlowWalkFactor = 0.5;
  const missGuideExtraPause = clamp(0.6 + 1.0 * missGuideProbability, 0.6, 2.5);
  const wrongTurnAdvanceDistance = clamp(0.6 + 1.0 * wrongTurnProbability + 0.3 * branchComplexity, 0.6, 1.8);
  const backtrackDistance = clamp(0.5 + 0.9 * backtrackProbability, 0.5, 1.4);
  const backtrackPauseTime = clamp(1.0 + 1.5 * signConflict + 1.0 * (1 - p), 1.0, 4.0);
  const guideReviewPauseTime = guidanceSupport > 0.05
    ? clamp(0.25 + 1.45 * guideReviewLoad, 0, 1.8)
    : 0;
  const burden = clamp(
    100 * vc * Math.max(
      0,
      (finalScoreWeights.base ?? 0.05)
        + (finalScoreWeights.branchComplexity ?? 0.24) * branchComplexity * decisionNodePeakFactor
        + (finalScoreWeights.signConflict ?? 0.28) * signConflict * decisionNodePeakFactor
        + (finalScoreWeights.pathComparisonCost ?? 0.22) * pathComparisonCost * decisionNodePeakFactor
        + (finalScoreWeights.distractorLoad ?? 0.12) * distractorLoad
        + (finalScoreWeights.noisePenalty ?? 0.05) * noisePenalty
        + (finalScoreWeights.lightingPenalty ?? 0.04) * lightingPenalty
        + (finalScoreWeights.crowdPenalty ?? 0.04) * crowdPenalty
        + (finalScoreWeights.queueUncertainty ?? 0.10) * queueUncertainty * decisionNodePeakFactor
        + (finalScoreWeights.memoryDeficit ?? 0.13) * (1 - m)
        + (finalScoreWeights.attentionDeficit ?? 0.13) * (1 - a)
        + (finalScoreWeights.problemDeficit ?? 0.16) * (1 - p)
        + (finalScoreWeights.guidanceSupport ?? -0.12) * guidanceSupport
    ),
    0,
    100
  );

  return {
    vulnerability: vc,
    branchComplexity,
    signConflict,
    pathComparisonCost,
    distractorLoad,
    noisePenalty,
    lightingPenalty,
    crowdPenalty,
    queueUncertainty,
    decisionNodeProximity,
    decisionNodePeakFactor,
    timeDecay,
    distanceDecay,
    guidanceSupport,
    memoryRetention: m,
    attentionFocus: a,
    problemSolving: p,
    orientationConfidence: o,
    decisionReactionTime,
    missGuideProbability,
    wrongTurnProbability,
    recheckProbability,
    backtrackProbability,
    recheckPauseTime,
    recheckSlowWalkDuration,
    recheckSlowWalkFactor,
    missGuideExtraPause,
    wrongTurnAdvanceDistance,
    backtrackDistance,
    backtrackPauseTime,
    guideReviewLoad,
    guideReviewPauseTime,
    burden,
  };
}

function main() {
  assert(typeof Sim.computeDecisionBurdenState === 'function', 'computeDecisionBurdenState should exist');
  assert(typeof Sim.rollDecisionBehaviorOutcome === 'function', 'rollDecisionBehaviorOutcome should exist');
  assert(typeof Sim.classifyDecisionGuideFeature === 'function', 'classifyDecisionGuideFeature should exist');
  assert(typeof Sim.evaluateDecisionGuideMatch === 'function', 'evaluateDecisionGuideMatch should exist');

  const exitGuide = Sim.classifyDecisionGuideFeature('Hanging Signs', 'Exit types and direction icon');
  assert(exitGuide.guideType === 'exit_guidance', 'exit hanging sign should map to exit guidance');

  const lineGuide = Sim.classifyDecisionGuideFeature('Hanging Signs', 'Metro lines and two-way terminus icon and direction + Bilingual');
  assert(lineGuide.guideType === 'line_guidance', 'metro line hanging sign should map to line guidance');

  const integratedGuide = Sim.classifyDecisionGuideFeature('Hanging Signs', 'Exit types + Metro lines icon and direction + Accessibility and infrastructure + Bilingual');
  assert(integratedGuide.guideType === 'integrated_guidance', 'mixed exit-line-access sign should map to integrated guidance');

  const mapGuide = Sim.classifyDecisionGuideFeature('Panoramic guide map', 'Central Station location map topology + POI data + Accessibility legend');
  assert(mapGuide.guideType === 'map_guidance', 'panoramic guide map should map to map guidance');

  const lcdGuide = Sim.classifyDecisionGuideFeature('LCD', 'Destination & Status + Platform Allocation + Real-time arrival countdown + Weather & Temperature');
  assert(lcdGuide.guideType === 'dynamic_platform_info', 'lcd sign should map to dynamic platform info');

  const exitMatch = Sim.evaluateDecisionGuideMatch(exitGuide, {
    targetRegionId: 'exit_a',
    selectedTargetNodeLabel: 'Exit A',
  });
  const exitMismatch = Sim.evaluateDecisionGuideMatch(lineGuide, {
    targetRegionId: 'exit_a',
    selectedTargetNodeLabel: 'Exit A',
  });
  assert(exitMatch.relevanceScore > exitMismatch.relevanceScore, 'exit target should prefer exit guidance over line guidance');

  const lineMatch = Sim.evaluateDecisionGuideMatch(lineGuide, {
    targetRegionId: 'twl',
    selectedTargetNodeLabel: 'Tsuen Wan Line platform',
  });
  const lineMismatch = Sim.evaluateDecisionGuideMatch(exitGuide, {
    targetRegionId: 'twl',
    selectedTargetNodeLabel: 'Tsuen Wan Line platform',
  });
  assert(lineMatch.relevanceScore > lineMismatch.relevanceScore, 'line target should prefer line guidance over exit guidance');

  const integratedMatch = Sim.evaluateDecisionGuideMatch(integratedGuide, {
    targetRegionId: 'exit_b',
    selectedTargetNodeLabel: 'Exit B',
  });
  assert(integratedMatch.relevanceScore >= 0.75, 'integrated guidance should stay highly relevant for exit targets');

  const baselineOptions = createDecisionOptions();
  const expected = manualDecisionExpectation(baselineOptions);
  const actual = Sim.computeDecisionBurdenState(baselineOptions);

  assertClose(actual.vulnerability, expected.vulnerability, 0.001, 'decision vulnerability');
  assertClose(actual.branchComplexity, expected.branchComplexity, 0.001, 'branch complexity');
  assertClose(actual.decisionNodeProximity, expected.decisionNodeProximity, 0.001, 'decision node proximity');
  assertClose(actual.decisionNodePeakFactor, expected.decisionNodePeakFactor, 0.001, 'decision node peak factor');
  assertClose(actual.guidanceSupport, expected.guidanceSupport, 0.001, 'guidance support');
  assertClose(actual.memoryRetention, expected.memoryRetention, 0.001, 'memory retention');
  assertClose(actual.attentionFocus, expected.attentionFocus, 0.001, 'attention focus');
  assertClose(actual.problemSolving, expected.problemSolving, 0.001, 'problem solving');
  assertClose(actual.orientationConfidence, expected.orientationConfidence, 0.001, 'orientation confidence');
  assertClose(actual.decisionReactionTime, expected.decisionReactionTime, 0.001, 'decision reaction time');
  assertClose(actual.recheckPauseTime, expected.recheckPauseTime, 0.001, 'recheck pause time');
  assertClose(actual.recheckSlowWalkDuration, expected.recheckSlowWalkDuration, 0.001, 'recheck slow walk duration');
  assertClose(actual.recheckSlowWalkFactor, expected.recheckSlowWalkFactor, 0.001, 'recheck slow walk factor');
  assertClose(actual.wrongTurnAdvanceDistance, expected.wrongTurnAdvanceDistance, 0.001, 'wrong turn advance distance');
  assertClose(actual.backtrackDistance, expected.backtrackDistance, 0.001, 'backtrack distance');
  assertClose(actual.guideReviewPauseTime, expected.guideReviewPauseTime, 0.001, 'guide review pause time');
  assertClose(actual.score, expected.burden, 0.01, 'decision burden score');

  const weakGuidance = Sim.computeDecisionBurdenState(createDecisionOptions({
    continuousGuideCoverage: 0,
    mapSupport: 0,
    serviceSupport: 0,
  }));
  const strongGuidance = Sim.computeDecisionBurdenState(createDecisionOptions({
    continuousGuideCoverage: 1,
    mapSupport: 1,
    serviceSupport: 1,
  }));
  assert(strongGuidance.score < weakGuidance.score, 'guidance support should reduce burden');

  const lowCognition = Sim.computeDecisionBurdenState(createDecisionOptions({
    capacityScores: createCapacityScores({ cognitive: 1, sensory: 1, vitality: 1, locomotor: 1, psychological: 1 }),
  }));
  const highCognition = Sim.computeDecisionBurdenState(createDecisionOptions({
    capacityScores: createCapacityScores({ cognitive: 5, sensory: 5, vitality: 5, locomotor: 5, psychological: 5 }),
  }));
  assert(lowCognition.memoryRetention < highCognition.memoryRetention, 'lower cognitive score should reduce memory retention');
  assert(lowCognition.attentionFocus < highCognition.attentionFocus, 'lower cognitive score should reduce attention focus');
  assert(lowCognition.problemSolving < highCognition.problemSolving, 'lower cognitive score should reduce problem solving');
  assert(lowCognition.score > highCognition.score, 'lower cognitive score should increase burden');

  const mild = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 2,
    conflictingSignCount: 0,
    flashingAdCount: 0,
    staticAdCount: 0,
    irrelevantSignCount: 0,
    broadcastInterference: 0,
    noiseDb: 58,
    lux: 400,
    crowdDensity: 0.9,
    queueCount: 2,
    timeSinceLastEffectiveGuide: 1,
    distanceSinceLastEffectiveGuide: 2,
    continuousGuideCoverage: 0.8,
    mapSupport: 0.6,
    serviceSupport: 0.3,
  }));
  const severe = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 5,
    conflictingSignCount: 2,
    problemSignCount: 2,
    flashingAdCount: 2,
    staticAdCount: 3,
    irrelevantSignCount: 3,
    broadcastInterference: 1,
    noiseDb: 82,
    lux: 1200,
    crowdDensity: 3,
    queueCount: 10,
    timeSinceLastEffectiveGuide: 12,
    distanceSinceLastEffectiveGuide: 18,
    continuousGuideCoverage: 0.1,
    mapSupport: 0,
    serviceSupport: 0,
  }));
  assert(severe.decisionReactionTime > mild.decisionReactionTime, 'worse conditions should increase reaction time');
  assert(severe.score > mild.score, 'worse conditions should increase burden');

  const nearDecisionNode = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 5,
    conflictingSignCount: 2,
    candidatePathCount: 4,
    queueCount: 10,
    decisionNodeProximity: 1,
  }));
  const farDecisionNode = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 5,
    conflictingSignCount: 2,
    candidatePathCount: 4,
    queueCount: 10,
    decisionNodeProximity: 0,
  }));
  assert(nearDecisionNode.score > farDecisionNode.score, 'decision node proximity should raise local burden peaks');
  assert(nearDecisionNode.decisionNodePeakFactor > farDecisionNode.decisionNodePeakFactor, 'decision node peak factor should increase near decision nodes');

  const noiseHeavy = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 1,
    conflictingSignCount: 0,
    flashingAdCount: 0,
    staticAdCount: 0,
    irrelevantSignCount: 0,
    broadcastInterference: 0,
    noiseDb: 82,
    lux: 400,
    crowdDensity: 0.8,
    queueCount: 2,
  }));
  const crowdHeavy = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 1,
    conflictingSignCount: 0,
    flashingAdCount: 0,
    staticAdCount: 0,
    irrelevantSignCount: 0,
    broadcastInterference: 0,
    noiseDb: 55,
    lux: 400,
    crowdDensity: 3,
    queueCount: 2,
  }));
  const distractorHeavy = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 1,
    conflictingSignCount: 0,
    flashingAdCount: 2,
    staticAdCount: 0,
    irrelevantSignCount: 0,
    broadcastInterference: 0,
    noiseDb: 55,
    lux: 400,
    crowdDensity: 0.8,
    queueCount: 2,
  }));
  const signHeavy = Sim.computeDecisionBurdenState(createDecisionOptions({
    branchCount: 1,
    conflictingSignCount: 2,
    flashingAdCount: 0,
    staticAdCount: 0,
    irrelevantSignCount: 0,
    broadcastInterference: 0,
    noiseDb: 55,
    lux: 400,
    crowdDensity: 0.8,
    queueCount: 2,
  }));
  assert(signHeavy.score > distractorHeavy.score, 'problem signage should weigh more than pure noise-free distractors');
  assert(distractorHeavy.score > noiseHeavy.score, 'visual distractors should weigh more than noise in decision burden');
  assert(Math.abs(crowdHeavy.score - noiseHeavy.score) < 2, 'crowding and noise should stay secondary and close in weight');

  const lowReview = Sim.computeDecisionBurdenState(createDecisionOptions({
    continuousGuideCoverage: 0.8,
    mapSupport: 0.4,
    guideReviewLoad: 0,
  }));
  const highReview = Sim.computeDecisionBurdenState(createDecisionOptions({
    continuousGuideCoverage: 0.8,
    mapSupport: 0.4,
    guideReviewLoad: 0.9,
  }));
  assert(highReview.guideReviewPauseTime > lowReview.guideReviewPauseTime, 'relevant detailed guides should increase guide review pause');

  const behaviorOutcome = Sim.rollDecisionBehaviorOutcome(
    severe,
    {
      next() {
        return 0.1;
      },
    }
  );
  assert(behaviorOutcome.triggerRecheck, 'behavior outcome should allow recheck trigger');
  assert(behaviorOutcome.mayMissGuide, 'behavior outcome should allow miss-guide trigger');
  assert(behaviorOutcome.triggerWrongTurn, 'behavior outcome should allow wrong-turn trigger');
  assert(behaviorOutcome.triggerBacktrack, 'behavior outcome should allow backtrack trigger');
  assert(behaviorOutcome.triggerSlowWalk, 'recheck should trigger slow-walk state');
  assertClose(behaviorOutcome.slowWalkFactor, 0.5, 0.001, 'slow walk factor should be 0.5');
  assertClose(behaviorOutcome.slowWalkDuration, severe.recheckSlowWalkDuration, 0.001, 'slow walk duration should follow recheck duration');
  assertClose(
    behaviorOutcome.nodePauseTime,
    clamp(
      severe.decisionReactionTime
        + severe.guideReviewPauseTime
        + severe.missGuideExtraPause
        + severe.backtrackPauseTime,
      0,
      8
    ),
    0.001,
    'node pause time should follow approved formula'
  );

  const dimensionProfile = Sim.buildFocusProfile({
    capacityScores: baselineOptions.capacityScores,
  });
  const dimensionActual = manualDecisionExpectation({
    ...baselineOptions,
    baseDecisionDelay: dimensionProfile.decisionDelay,
  });

  const dimensionState = Sim.deriveFiveDimensionStateAtPoint(
    { pressureObjects: [], activePressureObjects: [], nodes: [], seats: [] },
    { agents: [], focusAgent: null, time: 0 },
    { x: 0, y: 0, z: 0 },
    {
      profile: dimensionProfile,
      environment: {
        crowdDensityLocal: 0,
        crowdDensityPerception: 0,
        noiseLevel: 60,
        lightingLevel: 250,
        crowdFatigueCoefficient: 1,
        noiseFatigueCoefficient: 1,
        lightingFatigueCoefficient: 1,
      },
      pressureState: {
        pressureScore: 0,
        ambientNoiseStress: 0,
        ambientCrowdingStress: 0,
        ambientLightingStress: 0,
        ambientQueueStress: 0,
        persistentStress: 0,
        localVisibleStress: 0,
        contributions: [],
      },
      fatigue: 0,
      fatigueThreshold: 100,
      decisionInputs: baselineOptions,
    }
  );
  assertClose(
    dimensionState.burdens.cognitive.score,
    dimensionActual.score,
    0.001,
    'five-dimension state should use new decision burden score'
  );
  assertClose(
    dimensionState.burdens.cognitive.memoryRetention,
    dimensionActual.memoryRetention,
    0.001,
    'five-dimension state should expose memory retention'
  );
  assertClose(
    dimensionState.burdens.cognitive.decisionReactionTime,
    dimensionActual.decisionReactionTime,
    0.001,
    'five-dimension state should expose decision reaction time'
  );
  assert(
    Object.prototype.hasOwnProperty.call(dimensionState.burdens.cognitive, 'guideReviewPauseTime'),
    'five-dimension state should expose guide review pause time'
  );
  assert(
    Object.prototype.hasOwnProperty.call(dimensionState.burdens.cognitive, 'recheckSlowWalkDuration'),
    'five-dimension state should expose recheck slow walk duration'
  );

  const distractorOnlyState = Sim.deriveFiveDimensionStateAtPoint(
    {
      pressureObjects: [],
      activePressureObjects: [
        { id: 'hang-1', name: 'Hanging Signs', feature: 'Exit types and direction icon', category: 'signage', x: 1.0, y: 0, z: 0 },
        { id: 'atm-1', name: 'Ground ATM signage', feature: 'Cantonese and English text may confuse mainland tourists', category: 'signage', x: 1.4, y: 0, z: 0 },
        { id: 'tactile-1', name: 'End point of tactile paving', feature: 'Blind elderly people may be confused', category: 'decision', x: 0.8, y: 0, z: 0 },
      ],
      nodes: [],
      seats: [],
    },
    { agents: [], focusAgent: null, time: 0 },
    { x: 0, y: 0, z: 0 },
    {
      profile: dimensionProfile,
      environment: {
        crowdDensityLocal: 0,
        crowdDensityPerception: 0,
        noiseLevel: 60,
        lightingLevel: 300,
        crowdFatigueCoefficient: 1,
        noiseFatigueCoefficient: 1,
        lightingFatigueCoefficient: 1,
      },
      pressureState: {
        pressureScore: 0,
        ambientNoiseStress: 0,
        ambientCrowdingStress: 0,
        ambientLightingStress: 0,
        ambientQueueStress: 0,
        persistentStress: 0,
        localVisibleStress: 0,
        contributions: [],
      },
      fatigue: 0,
      fatigueThreshold: 100,
      targetRegionId: 'exit_a',
      selectedTargetNodeLabel: 'Exit A',
    }
  );
  const distractorInputs = distractorOnlyState.context.decisionInputs;
  assert(distractorInputs.irrelevantSignCount >= 3, 'hanging signs, ground atm signage, and tactile paving should count as distractors');
  assert(distractorInputs.problemSignCount === 0, 'these three distractors should not count as problem signs');
  assert(distractorInputs.relevantGuideCount === 0, 'these three distractors should not count as relevant guides');
  assert(!distractorInputs.effectiveGuideDetected, 'distractors should not create effective guidance memory');
  assert(
    distractorInputs.consideredObjects.map((item) => item.id).join(',') === 'hang-1,atm-1,tactile-1',
    'distractor objects should still appear in considered objects'
  );
  assert(
    distractorInputs.consideredObjects.every((item) => item.direction === 'load'),
    'distractor objects should only contribute load, not support'
  );

  console.log('validate_cognitive_rules: ok');
}

main();
