const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  const paramsEnd = source.indexOf(')', start);
  const braceStart = source.indexOf('{', paramsEnd);
  assert(braceStart >= 0, `expected ${name} to have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

const snapshotBody = extractFunctionBody(appSource, 'getPlaybackSnapshotAtTime');

assert(
  /const previousIndex = findPlaybackTraceUpperBound\(snapshots, time\);/.test(snapshotBody),
  'playback snapshot lookup should use binary search to find the current snapshot window'
);

assert(
  !/for \(let index = 1; index < snapshots\.length; index \+= 1\)/.test(snapshotBody),
  'playback snapshot lookup should stop scanning snapshots from the beginning every bucket'
);

assert(
  /const previous = snapshots\[previousIndex\];/.test(snapshotBody),
  'playback snapshot lookup should resolve the previous snapshot directly from the binary-search index'
);

assert(
  /const current = snapshots\[Math\.min\(snapshots\.length - 1, previousIndex \+ 1\)\];/.test(snapshotBody),
  'playback snapshot lookup should resolve the next snapshot directly from the binary-search index'
);

assert(
  /function shouldRenderHeatmapDuringPlaybackFrame\(\)/.test(appSource),
  'playback rendering should expose a heatmap gating helper'
);

const playbackBody = extractFunctionBody(appSource, 'renderPlaybackFrame');

assert(
  /if \(shouldRenderHeatmapDuringPlaybackFrame\(\)\) \{\s*renderHeatmap\(\);\s*\}/.test(playbackBody),
  'playback-only rendering should skip heatmap work when the heat surface is already fully revealed'
);

const heatmapGateBody = extractFunctionBody(appSource, 'shouldRenderHeatmapDuringPlaybackFrame');

assert(
  /const playback = getActivePlayback\(\);/.test(heatmapGateBody),
  'heatmap playback gate should check the active precomputed playback state'
);

assert(
  /return !isHeatmapFullyRevealed\(playback\);/.test(heatmapGateBody),
  'heatmap playback gate should bypass heatmap reads once the playback heat surface is fully revealed'
);

console.log('validate_playback_lookup_and_heat_skip: ok');
