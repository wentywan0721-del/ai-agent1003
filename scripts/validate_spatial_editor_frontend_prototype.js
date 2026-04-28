const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert(
  html.includes('id="settings-spatial-editor-btn"')
    && html.includes('data-i18n="spatialEditor.entryTitle"')
    && html.indexOf('id="settings-spatial-editor-btn"') < html.indexOf('data-i18n="settings.routeSettingsTitle"'),
  'Expected Section01 spatial model editor entry to sit between upload and route settings'
);

assert(
  html.includes('id="spatial-editor-screen"')
    && html.includes('settings-card settings-card--form spatial-editor-panel')
    && html.includes('settings-card settings-card--route-stage spatial-editor-stage')
    && html.includes('id="spatial-editor-route-map-stage"')
    && html.includes('id="spatial-editor-route-map"')
    && html.includes('Scheme Result Library'),
  'Expected standalone spatial editor page to reuse Section01 panel styles and render the imported model in an isolated SVG'
);

assert(
  app.includes("showUiScreen('spatial-editor')")
    && app.includes('renderSpatialEditorRouteMap')
    && app.includes('handleSpatialEditorAction')
    && app.includes('spatialEditor.statusSimulate'),
  'Expected spatial editor frontend interactions and imported-model preview without backend submission'
);

assert(
  css.includes('.settings-spatial-editor-entry')
    && css.includes('.spatial-editor-layout')
    && css.includes('.spatial-editor-pressure-point')
    && css.includes('@media (max-width: 900px)'),
  'Expected spatial editor styling and responsive layout rules'
);

assert(
  !/\.settings-spatial-editor-entry\s*\{[^}]*linear-gradient/s.test(css)
    && !/\.settings-spatial-editor-entry:hover\s*\{[^}]*linear-gradient/s.test(css),
  'Expected spatial editor entry button to use a flat non-gradient style'
);

assert(
  !/\.spatial-editor-panel__block\s*\{[^}]*background\s*:/s.test(css)
    && !/\.spatial-editor-panel__block\s*\{[^}]*border\s*:/s.test(css),
  'Expected left editor content sections to avoid nested card containers'
);

assert.strictEqual(
  (html.match(/id="settings-route-map"/g) || []).length,
  1,
  'Expected original Section01 route map SVG id to remain unique'
);

console.log('validate_spatial_editor_frontend_prototype: ok');
