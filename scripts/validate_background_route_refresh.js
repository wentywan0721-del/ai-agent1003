const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  coreSource.includes('const nextRoute = routeOverride || persistedRoute || chooseBackgroundRouteForScenario(scenario, rng);'),
  'background agents should keep their assigned route across loop respawns unless an explicit override is supplied'
);

assert(
  !coreSource.includes('const nextRoute = chooseBackgroundRouteForScenario(scenario, rng) || persistedRoute;'),
  "background respawn should no longer refresh to a different weighted route before trying the agent's existing loop route"
);

console.log('validate_background_route_refresh: ok');
