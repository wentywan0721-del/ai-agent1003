const assert = require('assert');
const fs = require('fs');
const path = require('path');

const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const baseLegendBlock = styleSource.match(/\.view-heat-legend\s*\{([^}]*)\}/);

assert(
  indexSource.includes('id="view-heat-legend"'),
  'viewport should expose a dedicated legend mount for heatmap views'
);

assert(
  styleSource.includes('.view-heat-legend'),
  'styles should define the heatmap legend shell'
);

assert(
  /width:\s*clamp\(/.test(styleSource) || /min-width:\s*clamp\(/.test(styleSource),
  'legend card should use a fixed compact width so all views share the same legend length'
);

assert(
  styleSource.includes('grid-template-areas:'),
  'viewport header should use explicit grid areas to avoid legend and controls overlap'
);

assert(
  styleSource.includes('grid-area: legend;'),
  'legend should occupy its own viewport header area'
);

assert(
  styleSource.includes('grid-area: tools;'),
  'view tools should occupy their own viewport header area'
);

assert(
  appSource.includes('function getHeatmapViewStyle'),
  'app should define per-view heatmap style configuration'
);

assert(
  appSource.includes('composite: Object.freeze({'),
  'app should define a composite burden heatmap style'
);

assert(
  appSource.includes('const BURDEN_VIEW_ORDER = [\'composite\''),
  'app should expose composite mode in the burden-view order'
);

assert(
  appSource.includes('Composite Burden')
    || appSource.includes('综合负担'),
  'app should expose a localized composite burden label'
);

assert(
  appSource.includes('function renderViewHeatLegend'),
  'app should render a dynamic legend for the active heatmap view'
);

assert(
  appSource.includes('A classic red-to-blue gradient marks the equal-weight composite burden overview.')
    || appSource.includes('标准红到蓝渐变表示五项等权综合负担总览。'),
  'composite legend should describe the equal-weight overview'
);

assert(
  !appSource.includes('view-heat-width-swatch'),
  'legend should no longer render width swatch demos for vitality view'
);

assert(
  !appSource.includes('view-heat-legend-note'),
  'legend should no longer render the large explanatory note block'
);

assert(
  appSource.includes('view-heat-width-note'),
  'vitality legend should keep a compact width note'
);

assert(
  baseLegendBlock && !/grid-column:\s*1\s*\/\s*-1;/.test(baseLegendBlock[1]),
  'legend should no longer span the full header width'
);

assert(
  appSource.includes('function paintVitalityRateRibbon'),
  'app should render a vitality ribbon whose width reflects growth rate'
);

assert(
  appSource.includes('const VITALITY_RIBBON_MIN_WIDTH_METERS = 2;'),
  'vitality ribbon should define a 2m minimum width in world units'
);

assert(
  appSource.includes('const VITALITY_RIBBON_MAX_WIDTH_METERS = 6;'),
  'vitality ribbon should define a 6m maximum width in world units'
);

assert(
  /function getVitalityRibbonWidth\(growthRateNormalized,\s*transform\)/.test(appSource),
  'vitality ribbon width should be computed from map scale, not fixed pixels'
);

assert(
  !appSource.includes('ridgeGradient'),
  'vitality ribbon should not paint a fixed highlight stripe over the variable-width band'
);

assert(
  appSource.includes('function getTraceRevealRadiusMeters'),
  'heatmap rendering should expose a view-specific trace reveal radius'
);

console.log('validate_heatmap_palettes: ok');
