const fs = require('fs');
const path = require('path');

const inspectorUtils = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /id:\s*'sensory-noise'[\s\S]*summary:\s*localize\([\s\S]*噪音会削弱信息识别能力/.test(inspectorUtils),
  'Expected sensory-noise summary to explain that noise weakens information recognition'
);

assert(
  /id:\s*'sensory-lighting'[\s\S]*summary:\s*localize\([\s\S]*光照会影响视觉辨识/.test(inspectorUtils),
  'Expected sensory-lighting summary to explain that lighting affects visual recognition'
);

assert(
  /id:\s*'sensory-clutter'[\s\S]*summary:\s*localize\([\s\S]*广告、干扰标识或问题标识/.test(inspectorUtils),
  'Expected sensory-clutter summary to explain which distractors are interfering'
);

assert(
  /id:\s*'sensory-support'[\s\S]*summary:\s*localize\([\s\S]*连续导向、盲道、语音提示或服务支持/.test(inspectorUtils),
  'Expected sensory-support summary to explain what multimodal support means'
);

assert(
  /id:\s*'sensory-support'[\s\S]*name:\s*localize\(locale,\s*'导向支持影响感知'/.test(inspectorUtils),
  'Expected sensory-support title to use the neutral wording 导向支持影响感知'
);

assert(
  /id:\s*'sensory-lighting'[\s\S]*name:\s*localize\(locale,\s*'环境光照影响辨识'/.test(inspectorUtils),
  'Expected sensory-lighting title to use the wording 环境光照影响辨识'
);

assert(
  /id:\s*'sensory-clutter'[\s\S]*name:\s*localize\(locale,\s*'视觉杂讯干扰感知'/.test(inspectorUtils),
  'Expected sensory-clutter title to use the wording 视觉杂讯干扰感知'
);

assert(
  /id:\s*'sensory-occlusion'[\s\S]*name:\s*localize\(locale,\s*'人群遮挡干扰感知'/.test(inspectorUtils),
  'Expected sensory-occlusion title to use the wording 人群遮挡干扰感知'
);

assert(
  /id:\s*'sensory-miss'[\s\S]*name:\s*localize\(locale,\s*'对象漏识'/.test(inspectorUtils),
  'Expected sensory-miss title to use the wording 对象漏识'
);

assert(
  /id:\s*'sensory-miss'[\s\S]*summary:\s*localize\([\s\S]*关键对象没有被成功识别/.test(inspectorUtils),
  'Expected sensory-miss summary to explain missed recognition directly'
);

assert(
  /id:\s*'sensory-occlusion'[\s\S]*summary:\s*localize\([\s\S]*人群遮挡会提高漏识概率/.test(inspectorUtils),
  'Expected sensory-occlusion summary to explain crowd occlusion directly'
);

console.log('validate_sensory_issue_copy: ok');
