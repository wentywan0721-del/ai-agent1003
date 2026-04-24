const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stablePayloadStart = appJs.indexOf('function buildStableRouteAnalysisRequestPayload({');
const stablePayloadEnd = appJs.indexOf('async function requestRouteAnalysisFromLocalService', stablePayloadStart);
const stablePayloadSource = stablePayloadStart >= 0 && stablePayloadEnd > stablePayloadStart
  ? appJs.slice(stablePayloadStart, stablePayloadEnd)
  : '';

assert(
  /startNodeId:[\s\S]*targetRegionId:[\s\S]*activeViewId:[\s\S]*riskClassName:[\s\S]*hotspotPeak:[\s\S]*averageTravelTime:[\s\S]*averageFatigue:/.test(stablePayloadSource),
  'Expected route-analysis cache key payload to depend on stable route/scenario fields instead of localized labels'
);

assert(
  !/startLabel:|targetLabel:|label:|summary:\s*risk\./.test(stablePayloadSource),
  'Expected route-analysis cache key payload to avoid localized labels and summaries'
);

assert(
  appJs.includes('function sanitizeRouteAnalysisStatusMessage(')
    && /currentStatus === 'unavailable'[\s\S]*sanitizeRouteAnalysisStatusMessage\(routeAnalysisState\.error/.test(appJs)
    && /currentStatus === 'error'[\s\S]*sanitizeRouteAnalysisStatusMessage\(routeAnalysisState\.error/.test(appJs),
  'Expected Section 04 route-analysis status rendering to sanitize backend/provider errors before showing them in the panel'
);

console.log('validate_route_analysis_cache_stability: ok');
