const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /visualizationDetailLayerHoveredValue:\s*null/.test(appJs),
  'Expected Section04 state to keep the currently hovered layer option while playback rerenders the menu'
);

assert(
  /function renderVisualizationDetailLayerSelect\([\s\S]*is-hovered/.test(appJs),
  'Expected Section04 layer-menu rendering to reapply the hovered class from stored state'
);

assert(
  /function handleVisualizationDetailLayerMenuPointerMove\(event\)/.test(appJs)
  && /function handleVisualizationDetailLayerMenuPointerLeave\(\)/.test(appJs),
  'Expected dedicated handlers to keep layer-option hover feedback alive during playback'
);

console.log('validate_section04_layer_menu_hover_persistence: ok');
