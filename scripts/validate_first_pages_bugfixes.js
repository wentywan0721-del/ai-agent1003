const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /id="settings-upload-file"/.test(indexHtml),
  'Expected the settings upload card to expose a dedicated uploaded-file label'
);

assert(
  /\.landing-screen__title-line\s*\{[\s\S]*font-size:\s*clamp\(36px,\s*5vw,\s*60px\)/.test(stylesCss),
  'Expected landing title size to match the tighter reference typography scale'
);

assert(
  /\.modal-shell\s*\{[\s\S]*z-index:\s*(7\d|8\d|9\d)/.test(stylesCss),
  'Expected modals to render above the settings screen layer'
);

assert(
  /settingsUploadFile:\s*document\.getElementById\('settings-upload-file'\)/.test(appJs),
  'Expected app.js to bind the upload-file label'
);

assert(
  /elements\.settingsUploadFile\.textContent\s*=/.test(appJs),
  'Expected app.js to update the uploaded-file label when model status changes'
);

assert(
  /function handleSettingsBack\(\)[\s\S]*closeRouteModal\(\)/.test(appJs),
  'Expected returning home from settings to close the route modal'
);

assert(
  /function handleSettingsStartAnalysis\(\)[\s\S]*closeRouteModal\(\)/.test(appJs),
  'Expected entering the workspace from settings to close the route modal'
);

console.log('validate_first_pages_bugfixes: ok');
