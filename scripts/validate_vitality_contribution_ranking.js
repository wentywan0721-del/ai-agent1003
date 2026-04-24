const assert = require('assert');
const fs = require('fs');
const path = require('path');

const inspectorUtilsJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');

assert(
  inspectorUtilsJs.includes('function getVitalityContributionScoreFromCoefficient(')
    && inspectorUtilsJs.includes('function getVitalityContributionCoefficient('),
  'Expected vitality issue ranking to define contribution helpers for coefficient-based scoring'
);

assert(
  /function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityContributionScoreFromCoefficient\(/.test(inspectorUtilsJs),
  'Expected vitality issue ranking to use coefficient-based contribution scores'
);

assert(
  !/function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityQueuePressure\(/.test(inspectorUtilsJs)
    && !/function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityCrowdPressure\(/.test(inspectorUtilsJs)
    && !/function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityPressureFromMultiplier\(/.test(inspectorUtilsJs)
    && !/function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityNoisePressure\(/.test(inspectorUtilsJs)
    && !/function buildVitalityReasonItems\(inspection, locale, topPressureSources\) \{[\s\S]*getVitalityLightingPressure\(/.test(inspectorUtilsJs),
  'Expected vitality issue ranking to stop using the old heuristic pressure helpers directly'
);

console.log('validate_vitality_contribution_ranking: ok');
