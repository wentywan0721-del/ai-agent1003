const assert = require('assert');

const { buildIssuePanelState } = require('../src/inspector-utils.js');

const issueState = buildIssuePanelState({
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
    { id: 'noise-1', name: 'Broadcast Horn', category: 'noise', feature: '72 dB broadcast noise', pressure: 21.4 },
    { id: 'light-1', name: 'Ad Lightbox', category: 'facility', feature: 'Strong lighting source 820 lux', pressure: 14.8 },
  ],
});

assert.strictEqual(issueState.mode, 'issues', 'psychological issue panel should enter issues mode');
assert.deepStrictEqual(
  issueState.items.map((item) => item.id),
  ['psychological-guidance', 'psychological-noise', 'psychological-crowd'],
  'psychological issue panel should rank the new top three psychological factors'
);

const guidanceItem = issueState.items.find((item) => item.id === 'psychological-guidance');
const noiseItem = issueState.items.find((item) => item.id === 'psychological-noise');
const crowdItem = issueState.items.find((item) => item.id === 'psychological-crowd');

assert.strictEqual(guidanceItem?.name, '连续导向影响心理稳定', 'guidance issue should use the confirmed title');
assert(
  String(guidanceItem?.summary || '').includes('反复确认方向')
    && String(guidanceItem?.summary || '').includes('22%'),
  'guidance issue should explain the impact first and then report the current support rate'
);

assert.strictEqual(noiseItem?.name, '环境噪音持续刺激心理', 'noise issue should use the confirmed title');
assert(
  String(noiseItem?.summary || '').includes('持续噪音会提高警觉水平')
    && String(noiseItem?.summary || '').includes('72.4 dB'),
  'noise issue should explain the psychological impact before reporting the current noise value'
);
assert(
  Array.isArray(noiseItem?.mapTargetIds) && noiseItem.mapTargetIds.includes('noise-1'),
  'noise issue should keep mapped noise sources for hotspot highlighting'
);

assert.strictEqual(crowdItem?.name, '人群拥挤增加压迫感', 'crowd issue should use the confirmed title');
assert(
  String(crowdItem?.summary || '').includes('压缩个人空间')
    && String(crowdItem?.summary || '').includes('1.90 人/㎡'),
  'crowd issue should explain the impact first and then report the current crowd density'
);

assert(
  issueState.items.every((item) => item.id !== 'noise-1' && item.id !== 'light-1'),
  'psychological issue panel should show derived issue cards instead of raw pressure source cards'
);

console.log('validate_psychological_issue_panel: ok');
