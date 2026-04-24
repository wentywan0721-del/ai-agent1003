const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rules = require('../data/unified-rules.js');

const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  indexSource.includes('id="agent-capacity-radar"'),
  'agent modal should expose a dedicated interactive radar mount'
);
assert(
  indexSource.includes('id="agent-behavior-panel"'),
  'agent modal should expose a dedicated behavior explanation panel'
);
assert(
  !indexSource.includes('agent-preview-silhouette'),
  'agent modal should remove the legacy silhouette preview'
);
assert(
  !indexSource.includes('agent-modal-preview-stage'),
  'agent modal should remove the legacy preview stage container'
);

assert(
  styleSource.includes('.agent-radar-panel'),
  'styles should define the radar panel shell'
);
assert(
  styleSource.includes('.agent-behavior-panel'),
  'styles should define the behavior explanation panel shell'
);
assert(
  !styleSource.includes('silhouette-spin'),
  'styles should remove the old spinning silhouette animation'
);

assert(
  appSource.includes('function buildAgentRadarSvg'),
  'app should render the interactive five-dimension radar chart'
);
assert(
  appSource.includes('function getEditableCapacityScores'),
  'app should keep editable capacity scores separate from runtime-normalized scores so dragging one handle does not auto-move another'
);
assert(
  appSource.includes('function renderAgentBehaviorPanel'),
  'app should render the right-side behavior explanation cards'
);
assert(
  appSource.includes('function updateAgentRadarScore'),
  'app should support changing capacity scores from radar interaction'
);
assert(
  appSource.includes('capacityScores: getEditableCapacityScores(profile.capacityScores, profile)'),
  'agent draft creation should preserve the user-edited radar scores instead of immediately re-normalizing them'
);
assert(
  appSource.includes("elements.agentCapacityRadar.addEventListener('pointerdown', handleAgentRadarPointerDown)"),
  'app should bind radar pointerdown so the chart can start score editing'
);
assert(
  appSource.includes("elements.agentCapacityRadar.addEventListener('pointermove', handleAgentRadarPointerMove)"),
  'app should bind radar pointermove so dragging updates the score continuously'
);
assert(
  appSource.includes("elements.agentCapacityRadar.addEventListener('pointerup', handleAgentRadarPointerEnd)"),
  'app should release radar dragging when the pointer ends'
);
assert(
  appSource.includes("elements.agentBehaviorPanel.addEventListener('click', handleAgentBehaviorPanelClick)"),
  'app should bind the behavior list so clicking a card focuses that dimension'
);
assert(
  !appSource.includes('function buildAgentPreviewSvg'),
  'app should remove the legacy agent preview renderer'
);
assert(
  appSource.includes('<circle class="agent-radar-hit"'),
  'radar should use dedicated handle hit circles so nearby axes do not steal the drag target'
);
assert(
  !appSource.includes('<line class="agent-radar-hit"'),
  'radar should not use full-axis hit lines because they make adjacent handles interfere with each other'
);

const radarLayoutMatch = appSource.match(/function getAgentRadarLayout\(\)\s*\{\s*return\s*\{([\s\S]*?)\};\s*\}/);
assert(radarLayoutMatch, 'app should define a radar layout helper for the agent editor');

function getLayoutNumber(name) {
  const match = radarLayoutMatch[1].match(new RegExp(`${name}:\\s*(\\d+(?:\\.\\d+)?)`));
  assert(match, `agent radar layout should define ${name}`);
  return Number(match[1]);
}

assert(
  getLayoutNumber('viewBoxWidth') >= 430,
  'agent radar layout should reserve extra horizontal padding so side labels stay visible'
);
assert(
  getLayoutNumber('viewBoxHeight') >= 430,
  'agent radar layout should reserve extra vertical padding so top and bottom labels stay visible'
);

assert.strictEqual(
  rules?.dimensions?.vitality?.agentSettingDescriptionsZh?.[1],
  '静态休息状态下体力恢复极慢，即使极短距离的移动也会构成巨大生理负担',
  'vitality score 1 should expose the CSV behavior description'
);
assert(
  String(rules?.dimensions?.locomotor?.agentSettingDescriptionsZh?.[1] || '').includes('轮椅'),
  'locomotor score 1 should expose the wheelchair behavior description'
);

console.log('validate_agent_modal: ok');
