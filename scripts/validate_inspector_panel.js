const assert = require('assert');
const fs = require('fs');
const path = require('path');

const inspectorUtils = require('../src/inspector-utils.js');

const {
  getDynamicSimultaneousCount,
  getCurrentTravelTimeSeconds,
  getMetricRange,
  buildIssuePanelState,
  buildAgentProfileFieldState,
  buildAgentProfilePanelState,
} = inspectorUtils;

assert.strictEqual(
  getDynamicSimultaneousCount([
    { id: 'a', active: true },
    { id: 'b', active: false },
    { id: 'c' },
  ]),
  2,
  'simultaneous count should ignore only active === false agents'
);

assert.strictEqual(
  getCurrentTravelTimeSeconds({
    inspectionTime: 36.5,
    playbackTime: 20,
    scenarioTime: 12,
  }),
  36.5,
  'travel time should prefer inspection time'
);

assert.deepStrictEqual(
  getMetricRange([12, 4, 18, 7]),
  { minMetric: 4, maxMetric: 18 },
  'metric range should use actual current values'
);

const panelState = buildIssuePanelState({
  topPressureSources: [
    { id: 'p1', name: 'Ad Screen A', category: 'advert', feature: 'Bright ad', pressure: 27.5 },
    { id: 'p2', name: 'Crowd Merge', category: 'noise_congestion', feature: 'Crowd noise', pressure: 18.2 },
  ],
});

assert.strictEqual(panelState.mode, 'issues', 'panel should show issues when sources exist');
assert.strictEqual(panelState.items.length, 2, 'panel should keep all current issue items');
assert.strictEqual(panelState.items[0].rank, 1, 'issue items should keep rank order');

const emptyState = buildIssuePanelState({});
assert.strictEqual(emptyState.mode, 'hint', 'panel should fall back to hint when empty');

const sensoryIssueState = buildIssuePanelState({
  viewMode: 'sensory',
  locale: 'zh-CN',
  inspection: {
    environmentNoise: 74.6,
    environmentLighting: 920,
    crowdDensity: 1.45,
    fiveDimensions: {
      context: {
        decisionInputs: {
          continuousGuideCoverage: 0.24,
        },
      },
      burdens: {
        sensory: {
          perceptionRadius: 7.5,
          recognitionRate: 0.6,
          noiseThresholdDb: 50,
          lightingComfortLux: { min: 300, max: 400 },
          sensitiveNoise: true,
          sensitiveLight: true,
          visualClutterPenalty: 0.11,
          noisePenalty: 0.16,
          lightingPenalty: 0.14,
          occlusionPenalty: 0.08,
          supportRelief: 0.03,
          tactilePavingSupport: 0.1,
          audibleCueSupport: 0,
          nearbyServiceSupport: 0.2,
          recognizedObjects: [
            { id: 'guide-1', name: 'Integrated Guidance', confidence: 0.6 },
          ],
          missedObjects: [
            { id: 'sign-1', name: 'Ground ATM Signage', confidence: 0.6 },
          ],
        },
      },
    },
    decisionDiagnostics: {
      consideredObjects: [
        { id: 'ad-1', semanticId: 'flashing_ads', direction: 'load', relevance: 'distractor', value: 0.9 },
        { id: 'sign-1', semanticId: 'ground_atm_signage', direction: 'load', relevance: 'distractor', value: 0.7 },
        { id: 'noise-1', semanticId: 'broadcast_interference', direction: 'load', value: 0.65 },
      ],
    },
  },
  topPressureSources: [
    { id: 'ad-1', name: 'Advertisement A', category: 'advert', feature: 'Dynamic ad 1060 lux', pressure: 26.2 },
    { id: 'sign-1', name: 'Ground ATM Signage', category: 'signage', feature: 'Distracting signage', pressure: 18.1 },
    { id: 'noise-1', name: 'Broadcast Speaker', category: 'noise', feature: '74 dB broadcast noise', pressure: 20.4 },
    { id: 'light-1', name: 'Lightbox', category: 'facility', feature: 'Lighting 920 lux', pressure: 15.8 },
  ],
});

assert.strictEqual(sensoryIssueState.mode, 'issues', 'sensory view should show issue items');
assert(
  String(sensoryIssueState.summary || '').includes('7.5')
    && String(sensoryIssueState.summary || '').includes('60%')
    && String(sensoryIssueState.summary || '').includes('1 个'),
  'sensory view should expose a compact recognition summary with R, K, recognized, and missed counts'
);
assert(
  sensoryIssueState.items.some((item) => item.id === 'sensory-miss'),
  'sensory view should include a current missed-recognition issue card'
);
assert(
  sensoryIssueState.items.some((item) => item.id === 'sensory-support'),
  'sensory view should include a multimodal-support issue card'
);
const sensoryNoiseItem = sensoryIssueState.items.find((item) => item.id === 'sensory-noise');
const sensoryLightingItem = sensoryIssueState.items.find((item) => item.id === 'sensory-lighting');
const sensoryMissItem = sensoryIssueState.items.find((item) => item.id === 'sensory-miss');
const sensorySupportItem = sensoryIssueState.items.find((item) => item.id === 'sensory-support');
assert(
  sensoryNoiseItem && /50/.test(String(sensoryNoiseItem.feature || '')),
  'sensory noise card should compare the current noise value against the sensitivity threshold'
);
assert(
  sensoryLightingItem && /300-400/.test(String(sensoryLightingItem.feature || '')),
  'sensory lighting card should compare the current lux value against the comfort range'
);
assert(
  sensoryMissItem && String(sensoryMissItem.name || '').includes('漏识别'),
  'sensory recognition-loss card should use the new missed-recognition wording'
);
assert(
  sensorySupportItem
    && /24%/.test(String(sensorySupportItem.feature || ''))
    && /10%/.test(String(sensorySupportItem.feature || ''))
    && /20%/.test(String(sensorySupportItem.feature || '')),
  'sensory support card should expose the multimodal support breakdown'
);
assert(
  Array.isArray(sensoryNoiseItem?.mapTargetIds)
    && sensoryNoiseItem.mapTargetIds.includes('noise-1'),
  'sensory noise category should keep mapped noise sources'
);
assert(
  Array.isArray(sensoryLightingItem?.mapTargetIds)
    && sensoryLightingItem.mapTargetIds.includes('light-1'),
  'sensory lighting category should keep mapped lighting sources'
);
assert(
  sensoryMissItem && sensoryMissItem.mapTargetIds.includes('sign-1'),
  'sensory missed-recognition card should keep the missed object target when available'
);
assert(
  Array.isArray(sensoryIssueState.items.find((item) => item.id === 'sensory-clutter')?.mapTargetIds)
    && sensoryIssueState.items.find((item) => item.id === 'sensory-clutter').mapTargetIds.includes('ad-1')
    && sensoryIssueState.items.find((item) => item.id === 'sensory-clutter').mapTargetIds.includes('sign-1'),
  'sensory clutter category should keep mapped ad and sign distractors'
);

const selectedIssueState = buildIssuePanelState({
  topPressureSources: [
    { id: 'p1', name: 'Ad Screen A', category: 'advert', feature: 'Bright ad', pressure: 27.5 },
    { id: 'p2', name: 'Crowd Merge', category: 'noise_congestion', feature: 'Crowd noise', pressure: 18.2 },
  ],
  selectedIssue: { id: 'p9', name: 'Current clicked issue', category: 'signage', feature: 'Wrong direction', pressure: 35.1 },
});

assert.strictEqual(selectedIssueState.mode, 'issues', 'selected issue should still keep issue mode');
assert.strictEqual(selectedIssueState.items.length, 2, 'selected issue must not collapse the panel into a single card');
assert.deepStrictEqual(
  selectedIssueState.items.map((item) => item.id),
  ['p1', 'p2'],
  'selected issue should not replace the current issue list'
);

const cognitiveIssueState = buildIssuePanelState({
  viewMode: 'cognitive',
  locale: 'zh-CN',
  inspection: {
    environmentNoise: 78.2,
    environmentLighting: 960,
    crowdDensity: 1.65,
    decisionDiagnostics: {
      branchComplexity: 0.32,
      signConflict: 0.82,
      pathComparisonCost: 0.28,
      distractorLoad: 0.91,
      noisePenalty: 0.74,
      lightingPenalty: 0.26,
      crowdPenalty: 0.21,
      queueUncertainty: 0.19,
      guidanceSupport: 0.68,
      branchCount: 2,
      conflictingSignCount: 2,
      candidatePathCount: 2,
      queueCount: 3,
      flashingAdCount: 1,
      staticAdCount: 1,
      irrelevantSignCount: 2,
      broadcastInterference: 1,
      decisionNodeLabel: 'Concourse Branch',
      consideredObjects: [
        { id: 'problem-sign-1', name: 'Common direction Signs A', semanticId: 'confusing_signage', direction: 'load', value: 0.92 },
        { id: 'problem-sign-2', name: 'Hanging Signs B', semanticId: 'small_font_signage', direction: 'load', value: 0.78 },
        { id: 'guide-sign-1', name: 'Integrated Guidance A', semanticId: 'integrated_guidance', direction: 'support', relevance: 'direct', value: 0.81 },
        { id: 'guide-sign-2', name: 'Integrated Guidance B', semanticId: 'integrated_guidance', direction: 'support', relevance: 'direct', value: 0.74 },
        { id: 'distractor-sign-1', name: 'Ground ATM Signage', semanticId: 'ground_atm_signage', direction: 'load', relevance: 'distractor', value: 0.64 },
        { id: 'ad-1', name: 'Advertisement A', semanticId: 'flashing_ads', direction: 'load', value: 0.88 },
        { id: 'noise-1', name: 'Broadcast Speaker', semanticId: 'broadcast_interference', direction: 'load', value: 0.73 },
      ],
    },
  },
  topPressureSources: [
    { id: 'problem-sign-1', name: 'Common direction Signs', category: 'signage', feature: 'Confusing direction placement', pressure: 55.4 },
    { id: 'problem-sign-2', name: 'Hanging Signs', category: 'signage', feature: 'Font is too small', pressure: 49.8 },
    { id: 'ad-1', name: 'Advertisement Lightbox', category: 'advert', feature: 'Dynamic ad 1060 lux', pressure: 42.3 },
    { id: 'noise-1', name: 'Broadcast Speaker', category: 'noise', feature: '78 dB broadcast noise', pressure: 40.2 },
    { id: 'light-1', name: 'Lighting 1', category: 'facility', feature: 'Lighting 960 lux', pressure: 18.6 },
  ],
});

assert.strictEqual(cognitiveIssueState.mode, 'issues', 'cognitive view should show issue items');
assert.deepStrictEqual(
  cognitiveIssueState.items.map((item) => item.id),
  ['cognitive-distractor', 'cognitive-sign-conflict', 'cognitive-noise'],
  'cognitive view should rank decision burden categories instead of individual sources'
);
assert(
  Array.isArray(cognitiveIssueState.items[0].mapTargetIds)
    && cognitiveIssueState.items[0].mapTargetIds.includes('ad-1')
    && cognitiveIssueState.items[0].mapTargetIds.includes('distractor-sign-1'),
  'cognitive distractor category should keep all mapped distractor facilities'
);
assert(
  Array.isArray(cognitiveIssueState.items[1].mapTargetIds)
    && cognitiveIssueState.items[1].mapTargetIds.includes('problem-sign-1')
    && cognitiveIssueState.items[1].mapTargetIds.includes('problem-sign-2')
    && cognitiveIssueState.items[1].mapTargetIds.includes('guide-sign-1')
    && cognitiveIssueState.items[1].mapTargetIds.includes('guide-sign-2'),
  'cognitive sign-conflict category should keep problematic signs and involved guide-sign sources'
);
assert(
  Array.isArray(cognitiveIssueState.items[2].mapTargetIds)
    && cognitiveIssueState.items[2].mapTargetIds.includes('noise-1'),
  'cognitive noise category should keep mapped noise sources'
);
const cognitiveDistractorItem = cognitiveIssueState.items.find((item) => item.id === 'cognitive-distractor');
const cognitiveSignConflictItem = cognitiveIssueState.items.find((item) => item.id === 'cognitive-sign-conflict');
const cognitiveNoiseItem = cognitiveIssueState.items.find((item) => item.id === 'cognitive-noise');
assert(
  cognitiveDistractorItem?.name === '\u89c6\u89c9\u6742\u8baf\u5e72\u6270\u51b3\u7b56',
  'cognitive distractor card should use the confirmed title wording'
);
assert(
  String(cognitiveDistractorItem?.summary || '').includes('\u5f71\u54cd\u5bfc\u5411\u4f18\u5148\u8fdb\u5165\u89c6\u91ce')
    && String(cognitiveDistractorItem?.summary || '').includes('\u5f53\u524d\u95ea\u70c1\u5e7f\u544a'),
  'cognitive distractor card should explain the impact first, then report current values'
);
assert(
  cognitiveSignConflictItem?.name === '\u5bfc\u5411\u51b2\u7a81\u6216\u95ee\u9898\u6807\u8bc6',
  'cognitive sign-conflict card should use the confirmed title wording'
);
assert(
  String(cognitiveSignConflictItem?.summary || '').includes('\u5224\u65ad\u53d8\u5f97\u4e0d\u7a33\u5b9a')
    && String(cognitiveSignConflictItem?.summary || '').includes('\u5f53\u524d\u76f8\u5173\u6807\u8bc6'),
  'cognitive sign-conflict card should explain why sign conflicts destabilize decisions before listing counts'
);
assert(
  cognitiveNoiseItem?.name === '\u73af\u5883\u566a\u97f3\u5e72\u6270\u51b3\u7b56',
  'cognitive noise card should use the confirmed title wording'
);
assert(
  String(cognitiveNoiseItem?.summary || '').includes('\u6253\u65ad\u51b3\u7b56\u6ce8\u610f')
    && String(cognitiveNoiseItem?.summary || '').includes('dB'),
  'cognitive noise card should explain why noise affects decisions before showing the current dB value'
);

const compositeIssueState = buildIssuePanelState({
  viewMode: 'composite',
  locale: 'zh-CN',
  inspection: {
    burdenScores: {
      locomotor: 41,
      sensory: 63,
      cognitive: 57,
      psychological: 26,
      vitality: 71,
    },
  },
});

assert.strictEqual(
  compositeIssueState.mode,
  'issues',
  'composite view should expose ranked burden cards'
);
assert.strictEqual(
  compositeIssueState.items.length,
  5,
  'composite view should list all five burden dimensions'
);
assert.deepStrictEqual(
  compositeIssueState.items.map((item) => item.id),
  ['composite-vitality', 'composite-sensory', 'composite-cognitive', 'composite-locomotor', 'composite-psychological'],
  'composite view should sort all five burdens from high to low'
);
assert(
  String(compositeIssueState.summary || '').includes('等权')
    || String(compositeIssueState.summary || '').toLowerCase().includes('equal-weight'),
  'composite view should explain that it is an equal-weight overview'
);
assert.deepStrictEqual(
  compositeIssueState.items.map((item) => item.actionViewMode),
  ['vitality', 'sensory', 'cognitive', 'locomotor', 'psychological'],
  'composite issue cards should carry click-through target view ids'
);

const psychologicalIssueState = buildIssuePanelState({
  viewMode: 'psychological',
  locale: 'zh-CN',
  inspection: {
    environmentNoise: 72.4,
    environmentLighting: 820,
    crowdDensity: 1.9,
    queueCount: 6,
    fiveDimensions: {
      context: {
        decisionInputs: {
          continuousGuideCoverage: 0.2,
          mapSupport: 0.2,
          serviceSupport: 0.1,
        },
      },
      burdens: {
        psychological: {
          ambientNoiseStress: 60,
          ambientCrowdingStress: 55,
          ambientLightingStress: 20,
          ambientQueueStress: 6,
          persistentStress: 18,
          localVisibleStress: 12,
          noiseStress: 0.6,
          crowdStress: 0.55,
          lightingStress: 0.2,
          queueStress: 0.15,
          eventStress: 0.15,
          guidanceSupport: 0.22,
        },
      },
    },
  },
  topPressureSources: [
    { id: 'noise-1', name: 'Broadcast Horn', category: 'noise', feature: 'Broadcast noise source', pressure: 21.4 },
    { id: 'light-1', name: 'Ad Lightbox', category: 'facility', feature: 'Strong lighting source', pressure: 14.8 },
  ],
});

assert.strictEqual(psychologicalIssueState.mode, 'issues', 'psychological view should show issues when stress exists');
assert.deepStrictEqual(
  psychologicalIssueState.items.map((item) => item.id),
  ['psychological-guidance', 'psychological-noise', 'psychological-crowd'],
  'psychological view should rank the new top three psychological factor cards'
);
const psychologicalGuidanceItem = psychologicalIssueState.items.find((item) => item.id === 'psychological-guidance');
const psychologicalNoiseItem = psychologicalIssueState.items.find((item) => item.id === 'psychological-noise');
const psychologicalCrowdItem = psychologicalIssueState.items.find((item) => item.id === 'psychological-crowd');
assert(
  psychologicalGuidanceItem?.name === '连续导向影响心理稳定',
  'psychological guidance card should use the confirmed title wording'
);
assert(
  String(psychologicalGuidanceItem?.summary || '').includes('反复确认方向')
    && String(psychologicalGuidanceItem?.summary || '').includes('22%'),
  'psychological guidance card should explain the impact first, then report the current support rate'
);
assert(
  psychologicalNoiseItem?.name === '环境噪音持续刺激心理',
  'psychological noise card should use the confirmed title wording'
);
assert(
  String(psychologicalNoiseItem?.summary || '').includes('持续噪音会提高警觉水平')
    && String(psychologicalNoiseItem?.summary || '').includes('72.4 dB'),
  'psychological noise card should explain the impact first, then report the current noise value'
);
assert(
  Array.isArray(psychologicalNoiseItem?.mapTargetIds)
    && psychologicalNoiseItem.mapTargetIds.includes('noise-1'),
  'psychological noise card should keep mapped noise sources'
);
assert(
  psychologicalCrowdItem?.name === '人群拥挤增加压迫感',
  'psychological crowd card should use the confirmed title wording'
);
assert(
  String(psychologicalCrowdItem?.summary || '').includes('压缩个人空间')
    && String(psychologicalCrowdItem?.summary || '').includes('1.90 人/㎡'),
  'psychological crowd card should explain the impact first, then report the current crowd density'
);
assert(
  psychologicalIssueState.items.every((item) => item.id !== 'noise-1' && item.id !== 'light-1'),
  'psychological view should expose derived issue cards instead of raw pressure source cards'
);

const agentProfileState = buildAgentProfileFieldState({
  profile: {
    ageBand: '70-74',
    gender: 'female',
    bmiCategory: 'normal',
    bmi: 22.4,
    capacityScores: {
      locomotor: 4,
      sensory: 3,
      cognitive: 2,
      psychological: 3,
      vitality: 4,
    },
  },
  inspection: {
    heat: 26.5,
    crowdDensity: 1.7,
    progress: 0.42,
    visionRadius: 11,
    environmentNoise: 68,
    environmentLighting: 355,
    queueCount: 4,
    walkingSpeed: 0.83,
    decisionDelay: 1.2,
    burdenScores: {
      locomotor: 14,
      sensory: 22,
      cognitive: 39,
      psychological: 31,
      vitality: 18,
    },
  },
});

assert(agentProfileState.dynamicFields.some((item) => item.id === 'heat'), 'agent profile should keep heat');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'crowdDensity'), 'agent profile should keep crowd density');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'progress'), 'agent profile should keep progress');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'visionRadius'), 'agent profile should keep vision radius');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'environmentNoise'), 'agent profile should keep environment noise');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'environmentLighting'), 'agent profile should keep environment lighting');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'queueCount'), 'agent profile should keep queue count');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'walkingSpeed'), 'agent profile should keep walking speed');
assert(agentProfileState.dynamicFields.some((item) => item.id === 'decisionDelay'), 'agent profile should keep decision delay');
assert.strictEqual(agentProfileState.burdenFields.length, 5, 'agent profile should keep all five burden values');

const hiddenAgentPanel = buildAgentProfilePanelState({
  selectedDynamicKind: null,
  profile: {
    ageBand: '70-74',
    gender: 'female',
    bmiCategory: 'normal',
    bmi: 22.4,
    capacityScores: { locomotor: 4, sensory: 3, cognitive: 2, psychological: 3, vitality: 4 },
  },
  inspection: {
    heat: 26.5,
    burdenScores: { locomotor: 14, sensory: 22, cognitive: 39, psychological: 31, vitality: 18 },
  },
});

assert.strictEqual(hiddenAgentPanel.mode, 'hint', 'agent profile should stay hidden before selecting an agent');

const visibleAgentPanel = buildAgentProfilePanelState({
  selectedDynamicKind: 'focus-agent',
  profile: {
    ageBand: '70-74',
    gender: 'female',
    bmiCategory: 'normal',
    bmi: 22.4,
    capacityScores: { locomotor: 4, sensory: 3, cognitive: 2, psychological: 3, vitality: 4 },
  },
  inspection: {
    heat: 26.5,
    burdenScores: { locomotor: 14, sensory: 22, cognitive: 39, psychological: 31, vitality: 18 },
  },
});

assert.strictEqual(visibleAgentPanel.mode, 'details', 'agent profile should show details after selecting agent');
assert.strictEqual(visibleAgentPanel.fieldState.burdenFields.length, 5, 'agent detail should include five burden values');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
assert(
  appSource.includes('function resolveHotspotTargets(hotspot) {'),
  'app should resolve hotspot cards to one or more map targets'
);
assert(
  appSource.includes('item.categoryLabel || getCategoryLabel(item.category)'),
  'issue cards should prefer view-specific category labels'
);
assert(
  appSource.includes('item.advice || getSuggestionByCategory(item.category)'),
  'issue cards should prefer view-specific advice'
);
assert(
  appSource.includes('viewMode: state.viewMode'),
  'issue panel should receive current view mode'
);
assert(
  appSource.includes('panelState.summary'),
  'issue panel renderer should support an optional summary block above the issue cards'
);
assert(
  appSource.includes("item.id === id || item.mapTargetId === id || item.mapTargetIds?.includes(id)"),
  'hotspot lookup should support category cards mapped to multiple pressure ids'
);
assert(
  appSource.includes("t('hint.hotspotsPrompt')"),
  'issue panel should keep a shared hint before selection'
);
assert(
  appSource.includes("const hotspotLinkId = hotspotTargets.some((target) => target.type === 'pressure') ? (item.id || item.mapTargetId || '') : '';"),
  'only issue cards with mapped pressure targets should carry hotspot links'
);
assert(
  appSource.includes('const isClickable = Boolean(hotspotLinkId || actionViewMode);')
    && appSource.includes("hotspot-card glass-card${isClickable ? ' clickable' : ' static'}"),
  'issue cards should visually distinguish clickable and static cards, including composite jump cards'
);
assert(
  appSource.includes('getSelectedHotspotOverlayItems()'),
  'map overlay should support rendering multiple selected hotspot targets'
);
assert(
  appSource.includes(".filter((target) => target.type === 'pressure')"),
  'only pressure targets should produce hotspot overlays'
);
assert(
  appSource.includes('hotspot-highlight-badge'),
  'clicked hotspot cards should render numbered map badges'
);
assert(
  appSource.includes("const showHotspotRankBadge = state.viewMode !== 'cognitive' && state.viewMode !== 'psychological' && rank;"),
  'cognitive view should suppress ranking badges for highlighted facilities'
);
assert(
  appSource.includes("const showInlineHotspotRank = state.viewMode === 'psychological' && rank;"),
  'psychological view should support inline hotspot numbering'
);
assert(
  styleSource.includes('.hotspot-card.static') && styleSource.includes('.hotspot-card.clickable'),
  'styles should distinguish non-clickable and clickable hotspot cards'
);
assert(
  styleSource.includes('.hotspot-inline-rank'),
  'styles should support inline hotspot rank labels'
);

console.log('validate_inspector_panel: ok');
