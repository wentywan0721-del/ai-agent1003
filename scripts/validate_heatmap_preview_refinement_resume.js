const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractConstNumber(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+);`));
  assert(match, `Expected ${name} constant to exist`);
  return Number(match[1]);
}

function extractFunctionSource(source, name, nextName) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Expected ${name} to exist`);
  const end = nextName ? source.indexOf(`function ${nextName}(`, start) : source.length;
  assert(end > start, `Expected ${name} extraction boundary to exist`);
  return source.slice(start, end);
}

const refinementPollIntervalMs = extractConstNumber(appJs, 'LOCAL_SIM_SERVER_REFINEMENT_POLL_INTERVAL_MS');
const refinementPollMaxAttempts = extractConstNumber(appJs, 'LOCAL_SIM_SERVER_REFINEMENT_POLL_MAX_ATTEMPTS');
assert(
  refinementPollIntervalMs * refinementPollMaxAttempts >= 90000,
  'Expected long-route refinement polling window to cover at least 90 seconds so preview playback can upgrade to final instead of timing out mid-route'
);

const fetchLocalHeatmapPlaybackSource = extractFunctionSource(appJs, 'fetchLocalHeatmapPlayback', 'precomputeHeatmapPlaybackInBrowser');
assert(
  /if \(locallyCachedPlayback\) \{[\s\S]*scheduleHeatmapRefinementPoll\(\{[\s\S]*playback:\s*locallyCachedPlayback[\s\S]*\}[\s\S]*return attachHeatmapSourceMeta\(locallyCachedPlayback, state\.heatmapSourceInfo\);/.test(fetchLocalHeatmapPlaybackSource),
  'Expected session-cached preview playback to resume refinement polling instead of returning a stale interrupted preview forever'
);

const scheduleHeatmapRefinementPollSource = extractFunctionSource(appJs, 'scheduleHeatmapRefinementPoll', 'delay');
assert(
  /const appliedUpgrade = applyRefinedHeatmapPlayback\(latestPlayback, liveMonitor\.serverCacheKey\);/.test(scheduleHeatmapRefinementPollSource),
  'Expected refinement polling to apply LLM/final upgrades whenever fresher playback is returned'
);
assert(
  /if \(appliedUpgrade\) \{[\s\S]*writeLocalHeatmapPlaybackCache\(liveMonitor\.localCacheKey, latestPlayback\);/.test(scheduleHeatmapRefinementPollSource),
  'Expected refinement polling to persist upgraded playback back into the local cache'
);
assert(
  /if \(!shouldPollForRefinedHeatmapPlayback\(latestPlayback\)\) \{[\s\S]*cancelHeatmapRefinementMonitor\(\);/.test(scheduleHeatmapRefinementPollSource),
  'Expected refinement polling to continue after preview-only LLM upgrades and stop only once no further refinement is needed'
);

console.log('validate_heatmap_preview_refinement_resume: ok');
