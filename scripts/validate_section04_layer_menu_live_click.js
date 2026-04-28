const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function handleVisualizationDetailLayerTrigger\(event\) \{[\s\S]*event\?\.stopPropagation\?\.\(\);[\s\S]*state\.suppressNextDetailLayerTriggerClick = true;/.test(appJs),
  'Expected Section04 layer trigger pointerdown to stop propagation and commit immediately during playback'
);

assert(
  /function handleVisualizationDetailLayerMenuClick\(event\) \{[\s\S]*event\?\.preventDefault\?\.\(\);[\s\S]*event\?\.stopPropagation\?\.\(\);[\s\S]*state\.suppressNextDetailLayerMenuClick = true;/.test(appJs),
  'Expected Section04 layer-option pointerdown to stop propagation and commit immediately during playback'
);

assert(
  /visualizationDetailLayerSelect\.addEventListener\('pointerdown', handleVisualizationDetailLayerTrigger\)/.test(appJs),
  'Expected Section04 layer trigger to intercept pointerdown events during playback'
);

assert(
  /visualizationDetailLayerMenu\.addEventListener\('pointerdown', handleVisualizationDetailLayerMenuClick\)/.test(appJs),
  'Expected Section04 layer menu to intercept pointerdown events during playback'
);

console.log('validate_section04_layer_menu_live_click: ok');
