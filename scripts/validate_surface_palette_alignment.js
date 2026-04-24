const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /--ui-glass-panel:\s*rgba\(20,\s*26,\s*37,\s*0\.5\)\s*;/.test(css),
  'Expected styles.css to define a single shared 50% glass panel color'
);

assert(
  /--ui-glass-blur:\s*6px\s*;/.test(css),
  'Expected styles.css to define a reduced shared glass blur so background texture can remain visible'
);

assert(
  /\.screen-locale-toggle\s*\{[\s\S]*top:\s*18px\s*;[\s\S]*right:\s*24px\s*;[\s\S]*min-width:\s*52px\s*;[\s\S]*height:\s*28px\s*;[\s\S]*padding:\s*0 10px\s*;[\s\S]*font-size:\s*10px\s*;/.test(css),
  'Expected the shared language toggle to align with the Section eyebrow top edge while keeping the compact size'
);

assert(
  /\.settings-screen\s*\{[\s\S]*linear-gradient\(rgba\(56,\s*210,\s*235,\s*0\.085\)\s*1px,\s*transparent\s*1px\)[\s\S]*linear-gradient\(90deg,\s*rgba\(56,\s*210,\s*235,\s*0\.085\)\s*1px,\s*transparent\s*1px\)[\s\S]*linear-gradient\(180deg,\s*rgba\(7,\s*14,\s*20,\s*0\.96\),\s*rgba\(7,\s*14,\s*20,\s*0\.82\)\s*48%,\s*rgba\(7,\s*14,\s*20,\s*0\.98\)\)/.test(css),
  'Expected the settings screen background to keep the landing palette while making the grid texture more visible'
);

assert(
  /\.visualization-shell\s*\{[\s\S]*linear-gradient\(rgba\(56,\s*210,\s*235,\s*0\.085\)\s*1px,\s*transparent\s*1px\)[\s\S]*linear-gradient\(90deg,\s*rgba\(56,\s*210,\s*235,\s*0\.085\)\s*1px,\s*transparent\s*1px\)[\s\S]*linear-gradient\(180deg,\s*rgba\(7,\s*14,\s*20,\s*0\.96\),\s*rgba\(7,\s*14,\s*20,\s*0\.82\)\s*48%,\s*rgba\(7,\s*14,\s*20,\s*0\.98\)\)/.test(css),
  'Expected the visualization overview background to keep the landing palette while making the grid texture more visible'
);

assert(
  /\.settings-card\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css),
  'Expected Section 01 cards to use the shared global glass panel tone'
);

assert(
  /\.settings-card\s*\{[\s\S]*backdrop-filter:\s*blur\(var\(--ui-glass-blur\)\)\s*;/.test(css)
  && /\.settings-dimension-card\s*\{[\s\S]*backdrop-filter:\s*blur\(var\(--ui-glass-blur\)\)\s*;/.test(css)
  && /\.visualization-card\s*\{[\s\S]*backdrop-filter:\s*blur\(var\(--ui-glass-blur\)\)\s*;/.test(css),
  'Expected the large glass panels to use the reduced shared blur so the grid texture can show through'
);

assert(
  /\.settings-upload-card\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css)
  && /\.settings-field__input\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css)
  && /\.settings-route-btn\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css)
  && /\.settings-dimension-card\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css),
  'Expected the second page rounded surfaces to use one shared panel color and opacity'
);

assert(
  /\.visualization-card\s*\{[\s\S]*background:\s*var\(--ui-glass-panel\)\s*;/.test(css),
  'Expected the third page rounded surfaces to use the shared global glass panel tone'
);

assert(
  /\.visualization-card__stage\s*\{[\s\S]*background:\s*transparent\s*;/.test(css)
  && /\.visualization-card__meta\s*\{[\s\S]*background:\s*transparent\s*;/.test(css),
  'Expected full-cover inner layers on visualization cards to be transparent so the shared outer panel remains visible'
);

assert(
  /\.settings-crowd-slider\s*\{[\s\S]*appearance:\s*none\s*;[\s\S]*height:\s*20px\s*;[\s\S]*background:\s*transparent\s*;/.test(css)
  && /\.settings-crowd-slider::\-webkit-slider-runnable-track\s*\{[\s\S]*height:\s*8px\s*;[\s\S]*border-radius:\s*999px\s*;/.test(css)
  && /\.settings-crowd-slider::\-webkit-slider-thumb\s*\{[\s\S]*width:\s*20px\s*;[\s\S]*height:\s*20px\s*;[\s\S]*border:\s*2px solid #38d2eb\s*;/.test(css),
  'Expected the background crowd slider to use a reference-style custom track and thumb'
);

assert(
  /function syncRangeSliderProgress\(element\)/.test(appJs)
  && /syncRangeSliderProgress\(elements\.settingsBackgroundCrowdSlider\)/.test(appJs),
  'Expected app.js to keep the settings crowd slider fill progress in sync with its value'
);

console.log('validate_surface_palette_alignment: ok');
