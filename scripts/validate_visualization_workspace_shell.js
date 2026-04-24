const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const compositeCardMatch = html.match(/<article class="visualization-card visualization-card--composite"[\s\S]*?<\/article>/);

assert(
  /id="visualization-shell"/.test(html),
  'Expected a dedicated visualization shell inside the workspace screen'
);

assert(
  /id="visualization-back-btn"/.test(html),
  'Expected a back button at the upper-left of the visualization workspace header'
);

const cardMatches = html.match(/data-viz-card=/g) || [];
assert.strictEqual(cardMatches.length, 6, 'Expected exactly six visualization heatmap cards');

assert(
  /data-viz-card="composite"/.test(html),
  'Expected the visualization overview to keep a composite burden card'
);

assert(
  /data-viz-card="locomotor"[\s\S]*?<span class="visualization-card__index">1<\/span>/.test(html)
  && /data-viz-card="sensory"[\s\S]*?<span class="visualization-card__index">2<\/span>/.test(html)
  && /data-viz-card="cognitive"[\s\S]*?<span class="visualization-card__index">3<\/span>/.test(html)
  && /data-viz-card="psychological"[\s\S]*?<span class="visualization-card__index">4<\/span>/.test(html)
  && /data-viz-card="vitality"[\s\S]*?<span class="visualization-card__index">5<\/span>/.test(html),
  'Expected the five small burden cards to be labeled 1-5'
);

assert(
  compositeCardMatch && !/visualization-card__index/.test(compositeCardMatch[0]),
  'Expected the composite card to remove its number badge'
);

assert(
  !/class="visualization-shell__description"/.test(html),
  'Expected the extra visualization description sentence to be removed from the header'
);

assert(
  !/visualization-card__tag/.test(html),
  'Expected the blue mini-tags above each heatmap title to be removed'
);

assert(
  /id="visualization-sidebar-scroll"/.test(html),
  'Expected the right-side panel to be a single scrollable container'
);

assert(
  /id="visualization-environment-panel"/.test(html)
  && /id="visualization-status-monitor"/.test(html)
  && /id="visualization-capability-radar"/.test(html)
  && /id="visualization-burden-feedback"/.test(html),
  'Expected the right-side panel to include environment, elderly status, radar, and burden feedback sections'
);

assert(
  /id="visualization-export-report-btn"/.test(html),
  'Expected the new workspace shell to expose a report export button'
);

assert(
  /function renderVisualizationShell\(/.test(appJs),
  'Expected a dedicated renderer for the new visualization shell'
);

assert(
  /function renderVisualizationEnvironmentPanel\(/.test(appJs),
  'Expected dedicated environment panel rendering logic'
);

assert(
  /function renderVisualizationHeatmapCards\(/.test(appJs),
  'Expected dedicated six-card heatmap rendering logic'
);

assert(
  /renderBackgroundCrowdCanvas\(\)/.test(appJs)
  && /renderOverlayLayer\(\)/.test(appJs)
  && /blitVisualizationCanvas\(elements\.backgroundCrowdCanvas,\s*card\.background\)/.test(appJs)
  && /syncVisualizationSvgLayer\(elements\.overlayLayer,\s*card\.overlay\)/.test(appJs),
  'Expected visualization cards to include background crowd and moving agent overlays, not just the base map'
);

assert(
  /const previousHeatmapDisplayMode = state\.heatmapDisplayMode;/.test(appJs)
  && /state\.heatmapDisplayMode = 'final';/.test(appJs)
  && /state\.heatmapDisplayMode = previousHeatmapDisplayMode;/.test(appJs),
  'Expected visualization cards to render with final heatmaps while preserving the live playback state'
);

assert(
  /function computeTransformForViewportSize\(/.test(appJs)
  && /ctx\.drawImage\(\s*sourceCanvas,\s*sourceRect\.x,\s*sourceRect\.y,\s*sourceRect\.width,\s*sourceRect\.height,\s*targetRect\.x,\s*targetRect\.y,\s*targetRect\.width,\s*targetRect\.height\s*\)/.test(appJs),
  'Expected visualization canvas blitting to preserve the map transform instead of stretching the full source canvas'
);

assert(
  /\.visualization-shell/.test(css)
  && /\.visualization-grid/.test(css)
  && /\.visualization-sidebar/.test(css)
  && /\.visualization-sidebar__scroll/.test(css),
  'Expected styles for the new visualization workspace shell'
);

assert(
  /\.visualization-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;/.test(css),
  'Expected the overview page to remove the right sidebar column and let the six-card area take the full width'
);

assert(
  /\.visualization-sidebar\s*\{[\s\S]*display:\s*none\s*;/.test(css),
  'Expected the right-side detail panel to be hidden on the six-window overview page'
);

assert(
  /\.visualization-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*;/.test(css)
  && /\.visualization-grid\s*\{[\s\S]*grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/.test(css),
  'Expected the six overview heatmaps to use a uniform 3x2 grid'
);

assert(
  /\.workspace-layout--render-rig \.viewport-panel\s*\{[\s\S]*grid-column:\s*2\s*;/.test(css),
  'Expected the off-screen render rig viewport to stay in the middle grid column so source canvases keep a real width'
);

console.log('validate_visualization_workspace_shell: ok');
