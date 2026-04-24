const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /id="landing-screen"/.test(indexHtml),
  'Expected index.html to include a landing screen container'
);

assert(
  /<video[^>]+class="landing-screen__video"/.test(indexHtml),
  'Expected landing page to include the reference full-screen video background'
);

assert(
  /id="landing-title-line-1"/.test(indexHtml) && /id="landing-title-line-2"/.test(indexHtml),
  'Expected landing title to be split into two dedicated lines'
);

assert(
  /id="screen-locale-toggle"/.test(indexHtml),
  'Expected landing/settings shell to include the fixed top-right language toggle'
);

assert(
  /\.landing-screen__title\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*[^;]+;/.test(stylesCss),
  'Expected landing title styles to use a grid layout with explicit line gap'
);

assert(
  /\.landing-screen\.is-exiting\s*\{[\s\S]*opacity:\s*0;/.test(stylesCss),
  'Expected landing page styles to include a fade-out exit state'
);

assert(
  /landing:\s*\{[\s\S]*titleLine1:[\s\S]*titleLine2:[\s\S]*start:/.test(appJs),
  'Expected locale copy for landing title lines and start button'
);

assert(
  /landingStartBtn:\s*document\.getElementById\('landing-start-btn'\)/.test(appJs),
  'Expected app.js to bind the landing start button'
);

assert(
  /uiScreen:\s*'landing'/.test(appJs),
  'Expected app.js to track the current UI screen starting from landing'
);

assert(
  /function handleLandingStart\(\)/.test(appJs) && /classList\.add\('is-exiting'\)/.test(appJs),
  'Expected app.js to start a fade transition before entering the next screen'
);

console.log('validate_landing_title_layout: ok');
