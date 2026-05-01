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

assertIncludes(app, 'nodeLayerVisible', 'spatial editor node layer state');
assertIncludes(app, 'nodeEdits', 'spatial editor editable node state');
assertIncludes(app, 'undoStack', 'spatial editor undo stack');
assertIncludes(app, 'data-spatial-editor-node-id', 'node id data attribute');
assertIncludes(app, 'data-spatial-editor-field="name"', 'editable node name field');
assertIncludes(app, 'data-spatial-editor-field="x"', 'editable x coordinate field');
assertIncludes(app, 'data-spatial-editor-field="y"', 'editable y coordinate field');
assertIncludes(app, 'data-spatial-editor-field="type"', 'editable node type field');
assertIncludes(app, 'function buildSpatialEditorNodeTypeOptions', 'node type options builder');
assertIncludes(app, 'function handleSpatialEditorPropertyInput', 'property input handler');
assertIncludes(app, 'function createSpatialEditorNodeAtPoint', 'node creation handler');
assertIncludes(app, 'function deleteSpatialEditorSelectedNode', 'node deletion handler');
assertIncludes(app, 'function undoSpatialEditorNodeEdit', 'node undo handler');
assertIncludes(app, "toolbarAddPressure: '新增'", 'Chinese add toolbar label');
assertIncludes(app, "toolbarAddPressure: 'Add'", 'English add toolbar label');
assertIncludes(html, 'data-spatial-editor-tool="addPressure"', 'existing add toolbar hook');
assertIncludes(css, '.spatial-editor-field', 'editable property field styles');
assertIncludes(css, '.spatial-editor-object--node.active', 'selected node visual state');

console.log('Spatial editor node prototype validation passed.');
