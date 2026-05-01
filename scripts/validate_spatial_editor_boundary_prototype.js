const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

assertIncludes(app, 'boundaryEdits', 'editable boundary state');
assertIncludes(app, 'selectedBoundaryType', 'selected boundary type state');
assertIncludes(app, 'selectedBoundaryPointId', 'selected boundary point state');
assertIncludes(app, 'function buildSpatialEditorBoundaryTypeOptions', 'boundary type options');
assertIncludes(app, 'function ensureSpatialEditorBoundaryState', 'boundary state initializer');
assertIncludes(app, 'function createSpatialEditorBoundaryPointAtPoint', 'boundary point creation');
assertIncludes(app, 'function updateSpatialEditorSelectedBoundaryPoint', 'boundary point update');
assertIncludes(app, 'function deleteSpatialEditorSelectedBoundaryPoint', 'boundary point deletion');
assertIncludes(app, 'function findNearestSpatialEditorPoint', 'nearest point fallback hit testing');
assertIncludes(app, 'function captureSpatialEditorPointer', 'pointer capture helper');
assertIncludes(app, 'spatialEditorInteractionLayer', 'dedicated editor interaction layer');
assertIncludes(app, 'function isSpatialEditorEditLayerActive', 'shared edit layer activity guard');
assertIncludes(app, 'function handleSpatialEditorStageMouseDown', 'capture-stage mousedown handler');
assertIncludes(app, 'function handleSpatialEditorStageClick', 'capture-stage click handler');
assertIncludes(app, "spatialEditorPointerTarget.addEventListener('pointerdown', handleSpatialEditorStageMouseDown, true)", 'interaction layer pointerdown editor events');
assertIncludes(app, "spatialEditorPointerTarget.addEventListener('click', handleSpatialEditorStageClick, true)", 'interaction layer click add fallback');
assertIncludes(app, "window.addEventListener('mousemove'", 'window mousemove drag events');
assertIncludes(app, "window.addEventListener('mouseup'", 'window mouseup drag events');
assertIncludes(app, 'function handleSpatialEditorMapClick', 'map click add fallback handler');
assertIncludes(app, 'spatial-editor-hit-plane', 'full-map editor hit plane');
if (app.includes('spatial-editor-grid-pattern')) {
  throw new Error('SVG grid pattern should be removed; the editor uses the CSS stage grid only.');
}
assertIncludes(app, "tool === 'selectObject'", 'toolbar select does not switch to preview');
assertIncludes(app, 'data-spatial-editor-boundary-id', 'boundary point DOM hook');
assertIncludes(app, 'r="3"', 'boundary hit radius');
assertIncludes(app, 'isActive ? 1.2 : 0.8', 'boundary control point radii');
assertIncludes(app, 'boundaryTypeWalkable', 'walkable boundary i18n');
assertIncludes(app, 'boundaryTypeObstacle', 'obstacle boundary i18n');
assertIncludes(css, 'spatial-editor-boundary--active-walkable', 'walkable boundary highlight style');
assertIncludes(css, 'spatial-editor-boundary--active-obstacle', 'obstacle boundary highlight style');
assertIncludes(css, 'stroke-width: 0.8px;', 'thin active boundary highlight');
assertIncludes(css, '.spatial-editor-object--boundary-point', 'boundary control point style');
assertIncludes(css, '.spatial-editor-hit-plane', 'hit plane style');
if (css.includes('.spatial-editor-grid-line')) {
  throw new Error('SVG grid line style should be removed with the old internal grid.');
}
assertIncludes(css, 'background-size: 14px 14px;', 'fine stage grid spacing');

console.log('Spatial editor boundary prototype validation passed.');
