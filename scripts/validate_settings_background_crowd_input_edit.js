const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /document\.activeElement\s*!==\s*elements\.settingsBackgroundCrowdInput/.test(appSource),
  'settings background crowd input should preserve the live typed value while focused'
);

console.log('validate_settings_background_crowd_input_edit: ok');
