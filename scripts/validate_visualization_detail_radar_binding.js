const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function renderVisualizationCapabilityRadar\(target = elements\.visualizationCapabilityRadar\)[\s\S]*const inspection = state\.scenario \? getCurrentFocusInspection\(\) : null;/.test(appJs),
  'Expected Section 04 Agent Attribute radar rendering to keep access to current inspection context'
);

assert(
  /function getVisualizationAgentProfile\(\)[\s\S]*if \(state\.focusProfile\) \{[\s\S]*return createFocusProfile\(state\.focusProfile\);[\s\S]*if \(state\.scenario\?\.focusAgent\?\.profile\) \{[\s\S]*return state\.scenario\.focusAgent\.profile;/.test(appJs)
  && /const radarProfile = getVisualizationAgentProfile\(\);/.test(appJs),
  'Expected Section 04 Agent Attribute radar to prefer the configured focus profile before any runtime-normalized scenario profile'
);

assert(
  /buildAgentRadarSvg\(radarProfile,\s*state\.locale,\s*isDetailTarget \? \{[\s\S]*interactive:\s*false,/.test(appJs),
  'Expected Section 04 Agent Attribute radar to render in non-interactive static mode'
);

assert(
  /const interactive = options\.interactive !== false;/.test(appJs)
  && /const activeDimensionId = interactive \? getAgentRadarActiveDimensionId\(\) : null;/.test(appJs)
  && /interactive \? `[\s\S]*agent-radar-hit[\s\S]*agent-radar-handle[\s\S]*` : ''/.test(appJs),
  'Expected the shared radar SVG builder to disable handle and hit-area rendering for static detail views'
);

console.log('validate_visualization_detail_radar_binding: ok');
