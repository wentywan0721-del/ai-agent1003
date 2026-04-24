const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rulesJs = fs.readFileSync(path.join(__dirname, '..', 'data', 'unified-rules.js'), 'utf8');

const locomotorZhBlockMatch = rulesJs.match(/locomotor:\s*\{[\s\S]*?agentSettingDescriptionsZh:\s*\{([\s\S]*?)\n\s*\},\n\s*agentSettingDescriptionsEn:/);
const locomotorEnBlockMatch = rulesJs.match(/locomotor:\s*\{[\s\S]*?agentSettingDescriptionsEn:\s*\{([\s\S]*?)\n\s*\},\n\s*mechanisms:/);

assert(locomotorZhBlockMatch, 'Expected to find locomotor Chinese setting descriptions');
assert(locomotorEnBlockMatch, 'Expected to find locomotor English setting descriptions');

assert(
  !/语义：/.test(locomotorZhBlockMatch[1]),
  'Expected locomotor Chinese descriptions to drop the "语义：" prefix'
);

assert(
  !/Semantic state:/.test(locomotorEnBlockMatch[1]),
  'Expected locomotor English descriptions to drop the "Semantic state:" prefix'
);

console.log('validate_locomotor_description_prefix: ok');
