const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appPath = path.join(__dirname, '..', 'src', 'app.js');
const stylesPath = path.join(__dirname, '..', 'styles.css');
const appSource = fs.readFileSync(appPath, 'utf8');
const stylesSource = fs.readFileSync(stylesPath, 'utf8');

const functionMatch = appSource.match(/function getVisualizationDetailIssueImpactState\(value, locale\) \{[\s\S]*?\n  \}/);
assert(functionMatch, 'impact-state function should exist in src/app.js');

const sandbox = {
  clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  },
};
vm.createContext(sandbox);
vm.runInContext(`${functionMatch[0]}; this.getVisualizationDetailIssueImpactState = getVisualizationDetailIssueImpactState;`, sandbox);

const getImpactState = sandbox.getVisualizationDetailIssueImpactState;
assert.strictEqual(getImpactState(10, 'zh-CN').label, '低', '0-20 should map to 低');
assert.strictEqual(getImpactState(20, 'zh-CN').label, '中低', '20 should map to 中低');
assert.strictEqual(getImpactState(39.9, 'zh-CN').label, '中低', '20-40 should map to 中低');
assert.strictEqual(getImpactState(40, 'zh-CN').label, '中', '40 should map to 中');
assert.strictEqual(getImpactState(60, 'zh-CN').label, '中高', '60 should map to 中高');
assert.strictEqual(getImpactState(80, 'zh-CN').label, '高', '80-100 should map to 高');
assert.strictEqual(getImpactState(95, 'en').label, 'High', 'english high label should remain High');
assert.strictEqual(getImpactState(65, 'en').label, 'Medium-High', 'english 60-80 label should be Medium-High');
assert.strictEqual(getImpactState(25, 'en').label, 'Medium-Low', 'english 20-40 label should be Medium-Low');

[
  'is-low',
  'is-medium-low',
  'is-medium',
  'is-medium-high',
  'is-high',
].forEach((className) => {
  assert(
    stylesSource.includes(`.visualization-detail__issue-impact-level.${className}`)
      || stylesSource.includes(`.visualization-detail__issue-impact-level.${className.replace('.', '')}`),
    `${className} color class should exist`
  );
});

assert(stylesSource.includes('#0062ea') || stylesSource.includes('0, 98, 234'), 'deep blue color should be present');
assert(stylesSource.includes('#00cfea') || stylesSource.includes('0, 207, 234'), 'blue color should be present');
assert(stylesSource.includes('#eadb00') || stylesSource.includes('234, 219, 0'), 'yellow color should be present');
assert(stylesSource.includes('#ea8100') || stylesSource.includes('234, 129, 0'), 'orange color should be present');
assert(stylesSource.includes('#ea0027') || stylesSource.includes('234, 0, 39'), 'red color should be present');

console.log('validate_issue_impact_levels: ok');
