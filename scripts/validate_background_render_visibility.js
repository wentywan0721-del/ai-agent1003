const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  !appSource.includes('const MAX_RENDERED_BACKGROUND_AGENTS = 480;'),
  'background rendering should not hard-cap the visible crowd to 480 agents'
);

assert(
  !appSource.includes('const renderedAgentCount = Math.min(activeAgents.length, MAX_RENDERED_BACKGROUND_AGENTS);'),
  'background rendering should stop frame-by-frame subsampling because it causes missing agents and flicker'
);

assert(
  appSource.includes('return backgroundAgents.filter((agent) => agent.active);')
  || appSource.includes('return activeAgents;'),
  'background rendering should expose the full active crowd set to the canvas renderer'
);

assert(
  appSource.includes('ctx.moveTo(point.x + radius, point.y);'),
  'background canvas renderer should start each dot as a separate subpath so dots do not get connected by gray lines'
);

assert(
  appSource.includes('function getBackgroundCrowdRenderStyle'),
  'background canvas renderer should expose a density-aware style helper so high crowd counts do not smear into a solid gray mass'
);

assert(
  appSource.includes('const personDiameterMeters = 0.4;'),
  'background crowd dots should be rendered from a fixed 0.4m physical body diameter so scale matches the plan view'
);

assert(
  appSource.includes('ctx.globalAlpha = renderStyle.alpha;'),
  'background canvas renderer should lower dot opacity dynamically for dense crowds'
);

console.log('validate_background_render_visibility: ok');
