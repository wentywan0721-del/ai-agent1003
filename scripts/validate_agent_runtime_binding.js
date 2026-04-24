const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  /handleSettingsStartAnalysis[\s\S]*state\.focusProfile\s*=\s*createFocusProfile\(state\.agentModal\.draft\);/.test(appJs),
  'Expected Section 02 analysis start to commit the current agent draft into the focus profile before generating the scenario'
);

assert(
  /function getVisualizationAgentProfile\(\)[\s\S]*state\.focusProfile[\s\S]*state\.scenario\?\.focusAgent\?\.profile/.test(appJs)
  && /renderVisualizationCapabilityRadar[\s\S]*const radarProfile = getVisualizationAgentProfile\(\);/.test(appJs),
  'Expected Section 04 Agent Attribute radar to read the configured focus-agent profile before any runtime-normalized scenario profile'
);

assert(
  /focusTraceSnapshots\.push\(\{[\s\S]*currentWalkingSpeed:\s*safeNumber\(agent\.currentWalkingSpeed/.test(coreJs)
  && /focusTraceSnapshots\.push\(\{[\s\S]*decisionReactionTime:\s*safeNumber\(dimensionState\?\.burdens\?\.cognitive\?\.decisionReactionTime/.test(coreJs),
  'Expected focus playback snapshots to store the realtime walking speed and decision reaction time'
);

assert(
  /walkingSpeed:\s*Number\(snapshot\.currentWalkingSpeed[\s\S]*decisionDelay:\s*Number\([\s\S]*snapshot\.decisionReactionTime/.test(appJs),
  'Expected playback inspection to use realtime snapshot speed and decision reaction time'
);

assert(
  /decisionDelay:\s*safeNumber\([\s\S]*decisionReactionTime/.test(coreJs),
  'Expected focus-agent inspection to expose decision delay from the cognitive reaction-time output instead of the static base profile only'
);

console.log('validate_agent_runtime_binding: ok');
