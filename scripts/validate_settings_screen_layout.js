const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /id="settings-screen"/.test(indexHtml),
  'Expected index.html to include the Section 01 settings screen'
);

assert(
  /id="agent-settings-screen"/.test(indexHtml),
  'Expected index.html to include the Section 02 agent settings screen'
);

assert(
  /id="settings-upload-trigger"/.test(indexHtml),
  'Expected the settings screen to include the upload card trigger'
);

assert(
  /id="settings-route-map-stage"/.test(indexHtml) && /id="settings-route-map"/.test(indexHtml),
  'Expected the settings screen to include an inline route map stage'
);

assert(
  /id="settings-origin-value"/.test(indexHtml)
  && /id="settings-destination-trigger"/.test(indexHtml)
  && /id="settings-destination-menu"/.test(indexHtml),
  'Expected the settings screen to expose an origin field and inline destination selector'
);

assert(
  /id="settings-route-clear-btn"/.test(indexHtml) && /id="settings-route-confirm-btn"/.test(indexHtml),
  'Expected the settings screen to include inline route clear and confirm actions'
);

assert(
  /id="settings-background-crowd-slider"/.test(indexHtml)
  && /id="settings-background-crowd-input"/.test(indexHtml)
  && /id="settings-background-crowd-input"[\s\S]*type="text"[\s\S]*inputmode="numeric"/.test(indexHtml),
  'Expected the settings screen to include its own background crowd slider and underline-style numeric text input'
);

assert(
  /id="settings-next-btn"/.test(indexHtml) && /id="settings-back-btn"/.test(indexHtml),
  'Expected Section 01 to include back and next-step actions'
);

assert(
  /id="settings-capacity-radar"/.test(indexHtml)
  && /id="settings-dimension-list"/.test(indexHtml)
  && /id="settings-start-analysis-btn"/.test(indexHtml)
  && /id="agent-settings-back-btn"/.test(indexHtml),
  'Expected Section 02 to include the radar, dimension list, start-analysis button, and back action'
);

assert(
  /\.settings-screen__grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(296px,\s*0\.82fr\)\s+minmax\(0,\s*2\.18fr\);/.test(stylesCss),
  'Expected settings screen CSS to slightly narrow the left panel and widen the right plan panel'
);

assert(
  /\.agent-settings-screen__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(stylesCss),
  'Expected Section 02 to use a three-equal-column layout'
);

assert(
  /\.settings-card__divider\s*\{[\s\S]*margin-top:\s*40px;/.test(stylesCss)
  && /\.settings-card__divider\s*\{[\s\S]*margin:[\s\S]*-20px/.test(stylesCss)
  && /\.settings-card__section\s*\{[\s\S]*margin-top:\s*40px;/.test(stylesCss),
  'Expected the settings screen divider spacing to expand to 40px and stretch to the card edges'
);

assert(
  /\.settings-card--route-stage\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\);/.test(stylesCss)
  && /\.settings-route-map-stage\s*\{[\s\S]*border:\s*0;[\s\S]*background:\s*transparent;/.test(stylesCss),
  'Expected the inline Section 01 route stage to reuse the shared settings panel background and remove the extra inner frame'
);

assert(
  /\.settings-field__input\s*\{[\s\S]*height:\s*36px;/.test(stylesCss)
  && /\.settings-field__input\s*\{[\s\S]*line-height:\s*34px;/.test(stylesCss)
  && /\.settings-field__select\s*\{[\s\S]*height:\s*36px;/.test(stylesCss),
  'Expected the origin and destination fields to use matching heights'
);

assert(
  /\.settings-route-primary-btn\s*\{[\s\S]*border:\s*1px solid rgba\(72,\s*83,\s*101,\s*0\.5\);[\s\S]*background:\s*rgba\(31,\s*38,\s*49,\s*0\.72\);/.test(stylesCss),
  'Expected the confirm button to match the clear button appearance'
);

assert(
  /\.settings-crowd-slider-row\s*\{[\s\S]*grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto\s+80px;/.test(stylesCss)
  && /\.settings-crowd-input\s*\{[\s\S]*width:\s*80px;[\s\S]*border:\s*none;[\s\S]*border-bottom:\s*1px solid rgba\(152,\s*166,\s*179,\s*0\.78\);[\s\S]*background:\s*transparent(?:\s*!important)?;/.test(stylesCss),
  'Expected the crowd numeric input to use an underline-style compact input'
);

assert(
  /\.settings-card--route-stage\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\);/.test(stylesCss)
  && /\.settings-card--route-stage\s+\.obstacle-shape\s*\{[\s\S]*fill:\s*var\(--route-stage-obstacle-fill\);/.test(stylesCss)
  && /\.settings-card--route-stage\s+\.route-modal-node-label\s*\{[\s\S]*fill:\s*rgba\(103,\s*111,\s*120,\s*0\.96\);/.test(stylesCss)
  && /\.settings-card--route-stage\s+\.route-modal-node-ring\s*\{[\s\S]*fill:\s*none;[\s\S]*stroke:\s*currentColor;/.test(stylesCss)
  && /function getRouteSelectionLabelPlacement\(/.test(appJs)
  && /id\.startsWith\('train_door'\)/.test(appJs)
  && /id\.startsWith\('gate_in_2'\)/.test(appJs),
  'Expected the right-side plan shell to share the settings panel fill, match obstacle fill, render an active node ring, and keep explicit label placement overrides'
);

assert(
  /settingsScreen:\s*document\.getElementById\('settings-screen'\)/.test(appJs),
  'Expected app.js to bind the settings screen container'
);

assert(
  /agentSettingsScreen:\s*document\.getElementById\('agent-settings-screen'\)/.test(appJs),
  'Expected app.js to bind the Section 02 screen container'
);

assert(
  /settingsDestinationTrigger:\s*document\.getElementById\('settings-destination-trigger'\)/.test(appJs)
  && /settingsRouteMapStage:\s*document\.getElementById\('settings-route-map-stage'\)/.test(appJs),
  'Expected app.js to bind the inline destination trigger and route map stage'
);

assert(
  /function renderSettingsRoutePlanner\(\)/.test(appJs),
  'Expected app.js to render the inline Section 01 route planner'
);

assert(
  /function handleSettingsDestinationToggle\(\)/.test(appJs),
  'Expected app.js to support the inline destination dropdown'
);

assert(
  /function handleSettingsNext\(\)/.test(appJs)
  && /function handleAgentSettingsBack\(\)/.test(appJs)
  && /showUiScreen\('agent-settings'\)/.test(appJs),
  'Expected app.js to support the Section 01 -> Section 02 flow'
);

assert(
  /route-modal-node-ring/.test(appJs)
  && /<circle class="route-modal-node-ring/.test(appJs),
  'Expected app.js route map markup to include a dedicated selected-node ring element'
);

console.log('validate_settings_screen_layout: ok');
