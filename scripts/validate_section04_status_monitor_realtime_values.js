const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

const playbackInspectionMatch = appJs.match(
  /function getPlaybackFocusInspection\(\) \{[\s\S]*?const inspection = \{([\s\S]*?)\n\s*};[\s\S]*?return inspection;\n\s*}/
);

assert(playbackInspectionMatch, 'Expected to find getPlaybackFocusInspection() in src/app.js');

const inspectionBody = playbackInspectionMatch[1];

assert(
  (
    /walkingSpeed:\s*Number\.isFinite\(Number\(snapshot\.currentWalkingSpeed\)\)\s*\?[\s\S]*snapshot\.currentWalkingSpeed/.test(inspectionBody)
    || /const realtimeWalkingSpeed = Number\(snapshot\.currentWalkingSpeed\);[\s\S]*walkingSpeed:\s*Number\.isFinite\(realtimeWalkingSpeed\)\s*\? realtimeWalkingSpeed/.test(appJs)
  ),
  'Expected Section04 playback inspection walkingSpeed to prefer realtime snapshot.currentWalkingSpeed'
);

assert(
  (
    /decisionDelay:\s*Number\.isFinite\(Number\(snapshot\.decisionReactionTime\)\)\s*\?[\s\S]*snapshot\.decisionReactionTime/.test(inspectionBody)
    || /const realtimeDecisionDelay = Number\(snapshot\.decisionReactionTime\);[\s\S]*decisionDelay:\s*Number\.isFinite\(realtimeDecisionDelay\)\s*\? realtimeDecisionDelay/.test(appJs)
  ),
  'Expected Section04 playback inspection decisionDelay to prefer realtime snapshot.decisionReactionTime'
);

console.log('validate_section04_status_monitor_realtime_values: ok');
