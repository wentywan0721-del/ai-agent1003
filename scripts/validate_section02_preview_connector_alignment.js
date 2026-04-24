const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function buildAgentPreviewRegionMaskCanvas\(sourceCanvas, components, regionMask = null, sourceSearchBox = null\)/.test(appJs),
  'Expected Section 02 preview mask generation to support semantic region clipping on top of exact selected components'
);

assert(
  /drawAgentPreviewRegionFromSource[\s\S]*buildAgentPreviewRegionMaskCanvas\(sourceCanvas,\s*selectedComponents,\s*regionMask,\s*metadata\.sourceSearchBox\)/.test(appJs),
  'Expected Section 02 exact region drawing to clip selected components by the semantic body-region mask'
);

assert(
  /const computedGeometryAnchors = computeAgentPreviewPoseGeometryAnchorsFromCanvas\(referenceSourceCanvas,\s*metadata\);/.test(appJs),
  'Expected connector anchors to be derived from the same masked reference regions that are rendered in Section 02'
);

assert(
  /const manualAnchor = poseMetadata\.connectorAnchors\?\.\[dimensionId\];[\s\S]*const derivedAnchor = computedGeometryAnchors\?\.\[dimensionId\];[\s\S]*const rawAnchorX = Number\(manualAnchor\?\.x \?\? derivedAnchor\?\.x \?\? 50\);[\s\S]*const rawAnchorY = Number\(manualAnchor\?\.y \?\? derivedAnchor\?\.y \?\? 50\);/.test(appJs),
  'Expected Section 02 preview composition to prefer per-pose manual connector anchors before falling back to geometry-derived centers'
);

assert(
  /function projectAgentPreviewSvgPointToPanel\(svgElement,\s*panelRect,\s*x,\s*y\)\s*\{[\s\S]*getScreenCTM\(\)[\s\S]*matrixTransform\(matrix\)[\s\S]*\}/.test(appJs),
  'Expected Section 02 connectors to project figure anchor points through the rendered SVG matrix so body regions and connector dots share the same coordinate system'
);

assert(
  /const connectorLayerRect = elements\.settingsAgentConnectorLayer\.getBoundingClientRect\(\);[\s\S]*elements\.settingsAgentConnectorLayer\.setAttribute\('viewBox', `0 0 \$\{connectorLayerRect\.width\.toFixed\(2\)\} \$\{connectorLayerRect\.height\.toFixed\(2\)\}`\);[\s\S]*const scoreStartShift = AGENT_PREVIEW_CONNECTOR_START_SHIFT_BY_SCORE_AND_DIMENSION\[previewData\.score\] \|\| \{\};[\s\S]*const anchor = previewData\.displayRegions\?\.\[dimensionId\] \|\| previewData\.connectorAnchors\?\.\[dimensionId\] \|\| previewData\.geometryAnchors\?\.\[dimensionId\] \|\| \{ x: 50, y: 50 \};[\s\S]*const projectedStart = projectAgentPreviewSvgPointToPanel\(figureSvg,\s*connectorLayerRect,\s*startAnchorX,\s*startAnchorY\);[\s\S]*const startOffsetX = Number\(scoreStartShift\[dimensionId\] \|\| 0\);[\s\S]*const endX = cardRect\.left - connectorLayerRect\.left \+ AGENT_PREVIEW_CONNECTOR_END_SHIFT_PX;[\s\S]*const midX = startX \+ \(endX - startX\) \* 0\.56;[\s\S]*const controlEndX = startX \+ \(endX - startX\) \* 0\.88;/.test(appJs),
  'Expected connector paths to keep the original curve shape while using connector-layer local coordinates and score-specific start shift overrides'
);

assert(
  /style="--connector-accent:\$\{color\}"/.test(appJs),
  'Expected active Section 02 connectors to inherit the same accent color as the selected dimension card'
);

assert(
  /\.settings-agent-preview__connector-line\.is-active\s*\{[\s\S]*stroke:\s*var\(--connector-accent/m.test(stylesCss)
  && /\.settings-agent-preview__connector-dot\.is-active\s*\{[\s\S]*fill:\s*var\(--connector-accent/m.test(stylesCss),
  'Expected active connector lines and anchor dots to use the selected dimension accent color'
);

console.log('validate_section02_preview_connector_alignment: ok');
