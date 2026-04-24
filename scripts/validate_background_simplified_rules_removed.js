const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const corePath = path.join(__dirname, '..', 'src', 'core.js');
  const source = fs.readFileSync(corePath, 'utf8');
  const forbiddenMarkers = [
    'BACKGROUND_NONQUEUE_NODE_AVOID_RADIUS',
    'BACKGROUND_NONQUEUE_NODE_BYPASS_RADIUS',
    'BACKGROUND_SPAWN_NODE_CLEARANCE_RADIUS',
    'BACKGROUND_SPAWN_PROGRESS_STEP_MIN',
    'BACKGROUND_SPAWN_PROGRESS_STEP_MAX',
    'function findSpawnPlacement(',
    'function findNearestLeaderOnRoute(',
    'SAME_ROUTE_PROGRESS_GAP',
    'function getBackgroundOrdinaryNodes(',
  ];

  const offenders = forbiddenMarkers.filter((marker) => source.includes(marker));

  assert.strictEqual(
    offenders.length,
    0,
    `simplified background mode should fully remove legacy queue-fixup rules, offenders: ${JSON.stringify(offenders)}`
  );
}

main();
console.log('validate_background_simplified_rules_removed: ok');
