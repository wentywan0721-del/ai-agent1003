const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

assertIncludes(app, 'pressureLayerVisible', 'pressure layer state');
assertIncludes(app, 'pressureEdits', 'editable pressure state');
assertIncludes(app, 'selectedPressureId', 'selected pressure id state');
assertIncludes(app, 'data-spatial-editor-pressure-id', 'pressure id data attribute');
assertIncludes(app, 'function buildSpatialEditorPressureTypeOptions', 'pressure type options builder');
assertIncludes(app, 'function pressureSupportsNoiseEdit', 'noise edit support check');
assertIncludes(app, 'function pressureSupportsLightEdit', 'light edit support check');
assertIncludes(app, 'function createSpatialEditorPressureAtPoint', 'pressure creation handler');
assertIncludes(app, 'function deleteSpatialEditorSelectedPressure', 'pressure deletion handler');
assertIncludes(app, 'function updateSpatialEditorSelectedPressure', 'pressure update handler');
assertIncludes(app, 'function handleSpatialEditorParameterInput', 'pressure parameter input handler');
assertIncludes(app, "element.dataset?.spatialEditorParam === field", 'pressure parameter sibling input sync');
assertIncludes(app, 'element.value = value;', 'pressure parameter numeric display updates while dragging slider');
assertIncludes(app, 'data-spatial-editor-field="z"', 'pressure z coordinate field');
assertIncludes(app, 'spatialEditorPressureParameter', 'pressure parameter i18n');
assertIncludes(html, 'data-spatial-editor-param="decibel"', 'noise parameter input hook');
assertIncludes(html, 'data-spatial-editor-param="lux"', 'lighting parameter input hook');
if (html.includes('spatial-editor-ads') || html.includes('spatial-editor-signage')) {
  throw new Error('Ad/signage sliders should be removed from the spatial editor panel.');
}
assertIncludes(css, '.spatial-editor-parameter-value', 'parameter number input styles');
assertIncludes(css, '.spatial-editor-object--pressure.active', 'selected pressure visual state');
assertIncludes(css, 'stroke-width: 0.5px;', 'thin spatial editor boundary lines');
assertIncludes(css, 'stroke: #ffffff;', 'white selected object outline');

console.log('Spatial editor pressure prototype validation passed.');
