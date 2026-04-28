const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /id: 'walkingSpeed'[\s\S]*?multilineLabel: true[\s\S]*?labelLines: \['Walking', 'Speed'\]/.test(appJs),
  'Expected Section04 Walking Speed label to render as two English lines'
);

console.log('validate_section04_status_walking_speed_label_layout: ok');
