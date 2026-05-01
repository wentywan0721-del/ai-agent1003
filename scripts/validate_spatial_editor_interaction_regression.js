const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

assertIncludes(html, 'styles.css?v=20260430-spatial-editor-interaction7', 'spatial editor CSS cache bust');
assertIncludes(html, 'src/app.js?v=20260430-spatial-editor-interaction7', 'spatial editor app cache bust');
assertIncludes(html, 'id="spatial-editor-interaction-layer"', 'dedicated spatial editor interaction layer');
assertIncludes(css, '.spatial-editor-interaction-layer', 'interaction layer style');
assertIncludes(css, 'pointer-events: none;', 'display svg does not intercept editor interaction events');
assertIncludes(css, 'rgba(112, 221, 255, 0.08) 0.4px', 'reduced visible fine grid opacity');
assertIncludes(css, 'background-size: 14px 14px;', 'fine grid spacing');
assertIncludes(app, "state.spatialEditor.nodeSourceSignature = '';", 'node state forced rebuild on editor open');
assertIncludes(app, "state.spatialEditor.pressureSourceSignature = '';", 'pressure state forced rebuild on editor open');
assertIncludes(app, "state.spatialEditor.boundarySourceSignature = '';", 'boundary state forced rebuild on editor open');
assertIncludes(app, "state.spatialEditor.statusText = '';\n    state.spatialEditor.statusKey = 'spatialEditor.statusIdle';", 'editor open clears stale MOVE done status');
assertIncludes(app, 'function activateSpatialEditorEditLayerForTool', 'toolbar tools can activate a usable edit layer');
assertIncludes(app, "activateSpatialEditorEditLayerForTool('node');", 'move/add from preview falls back to node layer');
assertIncludes(app, "MOVE tool ready", 'move tool shows usable active layer');
assertIncludes(app, 'function getSpatialEditorViewBoxBounds', 'editor viewBox coordinate bounds');
assertIncludes(app, 'getSpatialEditorViewBoxBounds()', 'editor viewBox clamp use');
if (app.includes('spatial-editor-hit-plane--top')) {
  throw new Error('Top hit plane should not be rendered above editable objects because it blocks direct selection and drag hit-testing.');
}
assertIncludes(app, 'spatialEditorInteractionLayer: document.getElementById', 'interaction layer element binding');
assertIncludes(app, "spatialEditorPointerTarget.addEventListener('pointerdown', handleSpatialEditorStageMouseDown, true)", 'interaction layer pointerdown binding');
assertIncludes(app, "spatialEditorPointerTarget.addEventListener('mousedown', handleSpatialEditorStageMouseDown, true)", 'interaction layer mousedown fallback');
assertIncludes(app, "window.addEventListener('pointermove', handleSpatialEditorMapPointerMove);", 'window pointermove drag tracking');
assertIncludes(app, "window.addEventListener('mousemove', handleSpatialEditorMapPointerMove);", 'window mousemove drag tracking');
assertIncludes(app, "document.addEventListener('pointerdown', handleSpatialEditorDocumentPointerDown, true);", 'document-level pointer fallback');
assertIncludes(app, "document.addEventListener('click', handleSpatialEditorDocumentClick, true);", 'document-level click fallback');
assertIncludes(app, "document.addEventListener('input', handleSpatialEditorDocumentInput, true);", 'document-level input fallback');
assertIncludes(app, 'function handleSpatialEditorDocumentPointerDown', 'document pointer handler');
assertIncludes(app, 'function handleSpatialEditorDocumentInput', 'document input handler');
assertIncludes(app, 'editor.statusText', 'visible editor action status text');
assertIncludes(app, "ADD tool ready", 'add tool status feedback');
assertIncludes(app, "const viewBox = getSpatialEditorViewBoxBounds();\n    const node = {", 'node creation clamps to editor viewBox');
assertIncludes(app, "const viewBox = getSpatialEditorViewBoxBounds();\n    const type = 'noise';", 'pressure creation clamps to editor viewBox');
assertIncludes(app, "const viewBox = getSpatialEditorViewBoxBounds();\n    const newPoint = {", 'boundary creation clamps to editor viewBox');
assertIncludes(app, "if (editor.activeTool === 'addPressure')", 'add tool creates objects before selection logic');
assertIncludes(app, "createSpatialEditorBoundaryPointAtPoint(point);", 'add tool creates boundary control points');
assertIncludes(app, "createSpatialEditorPressureAtPoint(point);", 'add tool creates pressure points');
assertIncludes(app, "createSpatialEditorNodeAtPoint(point);", 'add tool creates nodes');
assertIncludes(app, "const hit = findNearestSpatialEditorPoint(point, editor.nodeEdits);", 'node picking uses coordinate hit testing');
assertIncludes(app, "const hit = findNearestSpatialEditorPoint(point, editor.pressureEdits);", 'pressure picking uses coordinate hit testing');
assertIncludes(app, "container.addEventListener('input', handleSpatialEditorPropertyInput);", 'coordinate fields update object positions while typing');
assertIncludes(app, "data-spatial-editor-field=\"z\"", 'pressure Z coordinate field');
assertIncludes(app, 'function updateSpatialEditorDraggedDomPosition', 'drag moves existing SVG objects without rebuilding the map mid-drag');
assertIncludes(app, 'updateSpatialEditorDraggedDomPosition(drag, node.x, node.y);', 'node drag updates visible node position');
assertIncludes(app, 'updateSpatialEditorDraggedDomPosition(drag, item.x, item.y);', 'pressure drag updates visible pressure position');
assertIncludes(app, 'function updateSpatialEditorDragToPoint', 'drag movement commits coordinates through shared helper');
assertIncludes(app, 'function getSpatialEditorScreenToSvgScale', 'drag movement can use screen delta to update SVG coordinates');
assertIncludes(app, 'startClientX: event.clientX', 'drag records starting screen X for stable movement');
assertIncludes(app, "document.addEventListener('pointermove', handleSpatialEditorDocumentPointerMove, true);", 'document-level pointermove drag fallback');
assertIncludes(app, "document.addEventListener('mousemove', handleSpatialEditorDocumentPointerMove, true);", 'document-level mousemove drag fallback');
assertIncludes(app, "document.addEventListener('pointerup', handleSpatialEditorDocumentPointerEnd, true);", 'document-level pointerup drag fallback');
assertIncludes(app, 'renderSpatialEditorRouteMap();\n      requestRender();', 'drag movement immediately redraws the editor map');
assertIncludes(app, "const isLiveCoordinateInput = event.type === 'input' && (field === 'x' || field === 'y' || field === 'z');", 'live XYZ coordinate edits are handled without forcing full panel rerender');
assertIncludes(app, 'updateSpatialEditorSelectedNode(patch, { snapshot: !isLiveCoordinateInput });', 'node XYZ input updates selected node');
assertIncludes(app, 'updateSpatialEditorSelectedPressure(patch, { snapshot: !isLiveCoordinateInput });', 'pressure XYZ input updates selected pressure');
assertIncludes(app, 'requestRender();\n        return;', 'coordinate edits schedule a visible render after DOM position update');

console.log('Spatial editor interaction regression validation passed.');
