const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('function buildStableRouteAnalysisRequestPayload('),
  'Expected a dedicated stable payload builder for route analysis requests'
);

assert(
  appJs.includes('const stableRouteAnalysisPayload = buildStableRouteAnalysisRequestPayload({')
    && appJs.includes('const routeAnalysisKey = createRouteAnalysisRequestKey(stableRouteAnalysisPayload);'),
  'Expected route analysis request keys to be derived from the stable payload instead of volatile live inspection data'
);

assert(
  !appJs.includes('const routeAnalysisKey = createRouteAnalysisRequestKey({\n      locale,\n      llmInput,'),
  'Did not expect route analysis keys to be built directly from the full live llmInput payload'
);

const stablePayloadStart = appJs.indexOf('function buildStableRouteAnalysisRequestPayload(');
const stablePayloadEnd = appJs.indexOf('async function requestRouteAnalysisFromLocalService', stablePayloadStart);
const stablePayloadBlock = stablePayloadStart >= 0 && stablePayloadEnd > stablePayloadStart
  ? appJs.slice(stablePayloadStart, stablePayloadEnd)
  : '';

assert(
  stablePayloadBlock.includes('function buildStableRouteAnalysisRequestPayload(')
    && stablePayloadBlock.includes('route = {}')
    && stablePayloadBlock.includes('pressureCategorySummary = []')
    && !stablePayloadBlock.includes('locale,')
    && !stablePayloadBlock.includes('locale:'),
  'Did not expect the stable route analysis request payload to include locale, because language switching should not invalidate the cache key'
);

console.log('validate_route_analysis_key_stability: ok');
