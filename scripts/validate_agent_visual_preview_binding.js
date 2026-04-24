const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /settingsAgentVisualPanel:\s*document\.getElementById\('settings-agent-visual-panel'\)/.test(appJs)
  && /settingsAgentFigureStage:\s*document\.getElementById\('settings-agent-figure-stage'\)/.test(appJs)
  && /settingsAgentConnectorLayer:\s*document\.getElementById\('settings-agent-connector-layer'\)/.test(appJs),
  'Expected app.js to bind the new Section 02 preview elements'
);

assert(
  /function renderSettingsAgentVisualPreview\(/.test(appJs),
  'Expected a dedicated Section 02 agent visual preview renderer'
);

assert(
  /const dimensionScores = getEditableCapacityScores\(state\.agentModal\.draft\?\.capacityScores\);[\s\S]*renderSettingsAgentVisualPreview\(/.test(appJs),
  'Expected the Section 02 preview to render from the same live draft capacity scores as the radar editor'
);

assert(
  /const AGENT_PREVIEW_DIMENSION_ORDER = \['cognitive', 'sensory', 'psychological', 'vitality', 'locomotor'\];/.test(appJs),
  'Expected the preview cards to follow the approved top-to-bottom order'
);

console.log('validate_agent_visual_preview_binding: ok');
