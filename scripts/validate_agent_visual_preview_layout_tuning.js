const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function getAgentPreviewDisplayFrame\(/.test(appJs),
  'Expected agent preview to normalize pose display sizing with a dedicated display-frame helper'
);

assert(
  /const AGENT_PREVIEW_DISPLAY_SCALE_BY_SCORE = Object\.freeze\(\{/.test(appJs)
  && /1:\s*0\./.test(appJs)
  && /2:\s*0\./.test(appJs),
  'Expected wheelchair and walker poses to use additional display down-scaling'
);

assert(
  /connectorAnchors:\s*Object\.freeze\(/.test(appJs)
  && /function computeAgentPreviewPoseGeometryAnchorsFromCanvas\(/.test(appJs)
  && /function getAgentPreviewPoseGeometryAnchors\(/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_OFFSET_OVERRIDES = Object\.freeze\(\{/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_GLOBAL_SHIFT = Object\.freeze\(\{\s*x:\s*[0-9.]+,\s*y:\s*0\s*\}\);/.test(appJs)
  && /psychological:\s*Object\.freeze\(\{\s*x:\s*[0-9.]+,\s*y:\s*0\s*\}\)/.test(appJs)
  && /vitality:\s*Object\.freeze\(\{\s*x:\s*[0-9.]+,\s*y:\s*0\s*\}\)/.test(appJs)
  && /locomotor:\s*Object\.freeze\(\{\s*x:\s*[0-9.]+,\s*y:\s*0\s*\}\)/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_CARD_OVERLAP_PX = 44;/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_CANVAS_SHIFT_PX = 20;/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_START_X_OFFSETS_PX = Object\.freeze\(\{[\s\S]*cognitive:\s*15,[\s\S]*sensory:\s*15,[\s\S]*locomotor:\s*15,[\s\S]*\}\);/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_START_X_SCORE_OFFSETS_PX = Object\.freeze\(\{[\s\S]*5:\s*Object\.freeze\(\{[\s\S]*locomotor:\s*20,[\s\S]*\}\),[\s\S]*\}\);/.test(appJs)
  && /const AGENT_PREVIEW_CONNECTOR_START_Y_OFFSETS_PX = Object\.freeze\(\{[\s\S]*cognitive:\s*15,[\s\S]*sensory:\s*15,[\s\S]*\}\);/.test(appJs)
  && /const geometryAnchors = getAgentPreviewPoseGeometryAnchors\(safeScore\);/.test(appJs)
  && /score:\s*safeScore,/.test(appJs)
  && /const anchor = metadata\?\.connectorAnchors\?\.\[dimensionId\] \|\| region;/.test(appJs)
  && /const startXOffset = Number\(AGENT_PREVIEW_CONNECTOR_START_X_OFFSETS_PX\?\.\[dimensionId\] \|\| 0\);/.test(appJs)
  && /const scoreStartXOffset = Number\(AGENT_PREVIEW_CONNECTOR_START_X_SCORE_OFFSETS_PX\?\.\[Number\(metadata\?\.score \|\| 0\)\]\?\.\[dimensionId\] \|\| 0\);/.test(appJs)
  && /const startX = figureRect\.left - panelRect\.left \+ \(startAnchorX \/ 100\) \* figureRect\.width \+ AGENT_PREVIEW_CONNECTOR_CANVAS_SHIFT_PX \+ startXOffset \+ scoreStartXOffset;/.test(appJs)
  && /const startYOffset = Number\(AGENT_PREVIEW_CONNECTOR_START_Y_OFFSETS_PX\?\.\[dimensionId\] \|\| 0\);/.test(appJs)
  && /const startY = figureRect\.top - panelRect\.top \+ \(startAnchorY \/ 100\) \* figureRect\.height \+ startYOffset;/.test(appJs)
  && /const endX = cardRect\.left - panelRect\.left \+ AGENT_PREVIEW_CONNECTOR_CARD_OVERLAP_PX \+ AGENT_PREVIEW_CONNECTOR_CANVAS_SHIFT_PX;/.test(appJs),
  'Expected connector anchors to be derived from per-pose geometry centers and used as the connector source'
);

assert(
  /--radar-handle-fill:/.test(appJs),
  'Expected radar handles to expose a per-score fill color'
);

assert(
  /\.settings-agent-preview__connector-layer\s*\{[\s\S]*z-index:\s*5;/.test(stylesCss)
  && /\.settings-agent-preview__cards\s*\{[\s\S]*z-index:\s*4;/.test(stylesCss),
  'Expected connector lines to render above the description cards so they visually connect'
);

assert(
  /\.settings-agent-preview__figure-image\s*\{[\s\S]*opacity:\s*0\.6;/.test(stylesCss),
  'Expected the agent preview figure image opacity to be reduced to 60%'
);

assert(
  /\.settings-agent-preview__figure\s*\{[\s\S]*transform:\s*translateX\(-82px\);/.test(stylesCss)
  && /\.settings-agent-preview__cards\s*\{[\s\S]*gap:\s*30px;[\s\S]*width:\s*344px;[\s\S]*transform:\s*translateX\(-82px\);/.test(stylesCss),
  'Expected the figure and description cards to shift visibly left as a group'
);

assert(
  /\.agent-radar-handle\s*\{[\s\S]*stroke:\s*none;/.test(stylesCss)
  && /\.agent-radar-handle\.is-active\s*\{[\s\S]*stroke:\s*rgba\(255,\s*255,\s*255,\s*0\.98\);/.test(stylesCss),
  'Expected radar handles to show no outline by default and a white outline only when active'
);

console.log('validate_agent_visual_preview_layout_tuning: ok');
