const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

const thoughtSourceMatch = appJs.match(/function getLocalizedDecisionPlanThought\(item, locale = state\.locale\) \{[\s\S]*?return locale === 'en'[\s\S]*?\n  \}/);
assert(thoughtSourceMatch, 'Expected getLocalizedDecisionPlanThought to exist');

const localizeSourceMatch = appJs.match(/function localizeRouteAnalysisOutput\(analysis, locale = state\.locale\) \{[\s\S]*?\n  function hydrateRouteAnalysisFromHeatmapPlayback/);
assert(localizeSourceMatch, 'Expected localizeRouteAnalysisOutput to exist');

const context = {
  state: { locale: 'zh-CN' },
};

vm.createContext(context);
vm.runInContext(
  `${thoughtSourceMatch[0]}; ${localizeSourceMatch[0].replace(/\n  function hydrateRouteAnalysisFromHeatmapPlayback$/, '')}; this.localizeRouteAnalysisOutput = localizeRouteAnalysisOutput;`,
  context
);

const localized = context.localizeRouteAnalysisOutput({
  analysisKind: 'decision-plan',
  timeline: [
    { order: 1, thoughtZh: '第一句' },
    { order: 2, thoughtZh: '第二句' },
    { order: 2, thoughtZh: '重复顺序的最后一句' },
  ],
}, 'zh-CN');

assert.deepStrictEqual(
  localized.timeline.map((item) => item.order),
  [1, 2, 3],
  'Section04 should normalize duplicate LLM timeline orders into unique display orders before DOM highlight matching'
);
assert.deepStrictEqual(
  localized.timeline.map((item) => item.sourceOrder),
  [1, 2, 2],
  'Section04 should preserve the original LLM order separately for diagnostics'
);

console.log('validate_section04_timeline_unique_display_order: ok');
