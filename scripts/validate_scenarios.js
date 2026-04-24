const fs = require('fs');
const path = require('path');
const Sim = require('../src/core.js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const simDataPath = path.join(__dirname, '..', 'data', 'default-sim.json');
const agentPoolPath = path.join(__dirname, '..', 'data', 'healthy-agents.json');
const coreJsPath = path.join(__dirname, '..', 'src', 'core.js');

const raw = JSON.parse(fs.readFileSync(simDataPath, 'utf8'));
const healthyAgents = JSON.parse(fs.readFileSync(agentPoolPath, 'utf8'));
const prepared = Sim.prepareSimData(raw, { healthyAgents });
const unifiedRules = Sim.getUnifiedRules ? Sim.getUnifiedRules() : null;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(coreJsPath, 'utf8');
const actionPanelStart = html.indexOf('<section class="panel-section action-panel-section">');
const compactLayerStart = html.indexOf('<section class="panel-section compact-layer-panel">');
const actionPanelHtml = actionPanelStart >= 0 && compactLayerStart > actionPanelStart
  ? html.slice(actionPanelStart, compactLayerStart)
  : '';
const baselineCapacityScores = {
  locomotor: 3,
  sensory: 3,
  cognitive: 3,
  psychological: 3,
  vitality: 3,
};
const lowVitalityCapacityScores = {
  locomotor: 2,
  sensory: 3,
  cognitive: 3,
  psychological: 3,
  vitality: 1,
};

assert(prepared.walkableAreas.length === 1, 'Expected one walkable area in default sim');
assert(prepared.obstacles.length === 7, 'Expected obstacle polygons to load');
assert(prepared.nodes.length === 23, 'Expected node count to load');
assert(prepared.activePressureObjects.length === 27, 'Expected 27 active pressure objects');
assert(prepared.healthyAgentPool.length === 123, 'Expected 123 strict healthy agents');
assert(prepared.odRoutes.length > 0, 'Expected generated OD routes');
assert(prepared.targetRegions.length >= 3, 'Expected target regions to be generated');

assert(html.includes('app-topbar'), 'Expected compact top bar in index.html');
assert(html.includes('locale-zh'), 'Expected Chinese locale toggle in index.html');
assert(html.includes('locale-en'), 'Expected English locale toggle in index.html');
assert(html.includes('app-product-name'), 'Expected dedicated product name element in index.html');
assert(html.includes('app-file-name'), 'Expected dedicated file name element in index.html');
assert(html.includes('app-file-name-input'), 'Expected editable file name input in index.html');
assert(html.includes('topbar-help'), 'Expected topbar help icon element in index.html');
assert(html.includes('user-avatar'), 'Expected topbar user avatar element in index.html');
assert(!html.includes('age-band-select'), 'Did not expect legacy age selector in index.html');
assert(!html.includes('gender-select'), 'Did not expect legacy gender selector in index.html');
assert(!html.includes('bmi-category-select'), 'Did not expect legacy BMI selector in index.html');
assert(!html.includes('bmi-error'), 'Did not expect legacy BMI validation message element in index.html');
assert(!/(?<!<)\/(?:span|div|button|h2|label|option)>/.test(html), 'Expected index.html closing tags to stay syntactically valid');

assert(html.includes('route-pick-btn'), 'Expected route pick button in index.html');
assert(html.includes('agent-settings-btn'), 'Expected agent settings button in index.html');
assert(html.includes('background-crowd-slider'), 'Expected background crowd slider in index.html');
assert(html.includes('background-crowd-value'), 'Expected background crowd value readout in index.html');
assert(html.includes('background-crowd-peak-label'), 'Expected peak-period crowd label in index.html');
assert(html.includes('background-crowd-canvas'), 'Expected background crowd canvas layer in index.html');
assert(html.includes('show-final-heatmap-btn'), 'Expected final heatmap toggle button in index.html');
assert(/<div class="viewport-tools">[\s\S]*show-final-heatmap-btn[\s\S]*<\/div>/.test(html), 'Expected final heatmap toggle button inside the viewport tools area');
assert(!actionPanelHtml.includes('show-final-heatmap-btn'), 'Did not expect the final heatmap toggle button to stay in the left action panel');
assert(html.includes('controls-scroll'), 'Expected a dedicated inner scroll wrapper for the left panel');
assert(html.includes('inspector-scroll'), 'Expected a dedicated inner scroll wrapper for the right panel');
assert(html.includes('data-i18n="button.clear"'), 'Expected clear buttons to use i18n keys');
assert(html.includes('data-i18n="button.confirm"'), 'Expected confirm buttons to use i18n keys');
assert(html.includes('data-i18n="button.reset"'), 'Expected reset buttons to use i18n keys');
assert(!/<div class="background-crowd-marks"[\s\S]*?>[\s\S]*?<span>\s*1595\s*<\/span>/.test(html), 'Did not expect the old midpoint crowd label in the slider marks');
assert(!html.includes('summary-pill route-meta-card'), 'Did not expect left-panel route summary pills to keep the inner shell styling');
assert(!/id="agent-profile-summary" class="[^"]*(glass-card|detail-card)/.test(html), 'Did not expect left-panel agent summary to keep the inner glass shell classes');

assert(html.includes('route-modal'), 'Expected route modal container in index.html');
assert(html.includes('route-modal-instruction'), 'Expected route modal instruction node in index.html');
assert(html.includes('route-modal-map'), 'Expected route modal map container in index.html');
assert(html.includes('route-region-list'), 'Expected route region list in index.html');
assert(html.includes('route-modal-confirm-btn'), 'Expected route modal confirm button in index.html');
assert(html.includes('route-modal-clear-btn'), 'Expected route modal clear button in index.html');

assert(html.includes('agent-modal'), 'Expected agent modal container in index.html');
assert(html.includes('agent-capacity-radar'), 'Expected agent modal radar editor mount in index.html');
assert(html.includes('agent-behavior-panel'), 'Expected agent modal behavior explanation panel in index.html');
assert(html.includes('agent-modal-confirm-btn'), 'Expected agent modal confirm button in index.html');
assert(html.includes('agent-modal-clear-btn'), 'Expected agent modal clear button in index.html');

assert(html.includes('point-popover'), 'Expected point popover container in index.html');
assert(html.includes('point-popover-confirm-btn'), 'Expected point popover confirm button in index.html');
assert(html.includes('point-popover-reset-btn'), 'Expected point popover reset button in index.html');
assert(html.includes('inspector-agent-summary'), 'Expected right-panel agent profile hook in index.html');
assert(!html.includes('fatigue-primary-value'), 'Did not expect the removed dynamic status metrics hook in index.html');
assert(!html.includes('cognitive-load-primary-value'), 'Did not expect the removed dynamic status metrics hook in index.html');
assert(html.includes('export-report-btn'), 'Expected route-report export button in index.html');
assert(html.includes('report-modal'), 'Expected report modal container in index.html');
assert(html.includes('report-modal-title'), 'Expected report modal title hook in index.html');
assert(html.includes('report-modal-summary'), 'Expected report modal summary hook in index.html');
assert(html.includes('report-locale-zh'), 'Expected Chinese report locale toggle in index.html');
assert(html.includes('report-locale-en'), 'Expected English report locale toggle in index.html');
assert(html.includes('report-preview-frame'), 'Expected report preview iframe in index.html');
assert(html.includes('report-modal-export-btn'), 'Expected report modal export button in index.html');
assert(html.includes('report-modal-cancel-btn'), 'Expected report modal close button in index.html');
assert(!html.includes('report-modal-close-btn'), 'Did not expect a duplicate top-close button in the report modal');
assert(html.includes('report-modal-status'), 'Expected report modal status hook in index.html');
assert(html.includes('data/unified-rules.js'), 'Expected unified rules script to load before core/app');
assert(html.includes('view-mode-select'), 'Expected viewport burden view selector in index.html');
assert(html.includes('capacity-locomotor'), 'Expected locomotor capacity slider in index.html');
assert(html.includes('capacity-sensory'), 'Expected sensory capacity slider in index.html');
assert(html.includes('capacity-cognitive'), 'Expected cognitive capacity slider in index.html');
assert(html.includes('capacity-psychological'), 'Expected psychological capacity slider in index.html');
assert(html.includes('capacity-vitality'), 'Expected vitality capacity slider in index.html');

assert(html.includes('layer-category-grid'), 'Expected category layer button grid in index.html');
assert(html.includes('layer-category-flashing-ads'), 'Expected flashing ads layer button in index.html');
assert(html.includes('layer-category-static-ads'), 'Expected static ads layer button in index.html');
assert(html.includes('layer-category-ai-virtual-service-ambassador'), 'Expected AI virtual service ambassador layer button in index.html');
assert(html.includes('layer-category-common-direction-signs'), 'Expected common direction signs layer button in index.html');
assert(html.includes('layer-category-customer-service-centre'), 'Expected customer service centre layer button in index.html');
assert(html.includes('layer-category-noise'), 'Expected noise layer button in index.html');
assert(html.includes('layer-category-hanging-signs'), 'Expected hanging signs layer button in index.html');
assert(html.includes('layer-category-lcd'), 'Expected LCD layer button in index.html');
assert(html.includes('layer-category-panoramic-guide-map'), 'Expected panoramic guide map layer button in index.html');
assert(html.includes('layer-category-seat'), 'Expected seat layer button in index.html');

assert(!html.includes('focus-route-select'), 'Did not expect fixed focus route select in index.html');
assert(!html.includes('load-default-btn'), 'Did not expect load default button in compact UI');
assert(!html.includes('model-summary'), 'Did not expect model summary panel in compact UI');
assert(!html.includes('run-status'), 'Did not expect the left run status chip in index.html');
assert(!html.includes('run-hint'), 'Did not expect the left run hint copy in index.html');
assert(!html.includes('data-i18n="section.import"'), 'Did not expect a model import section heading in index.html');
assert(!html.includes('toggle-environmental-stressors'), 'Did not expect the old environmental stressor toggle in index.html');
assert(!html.includes('toggle-facility-nodes'), 'Did not expect the old facility node toggle in index.html');
assert(!html.includes('toggle-seating-resources'), 'Did not expect the old seating toggle in index.html');
assert(!html.includes('crowd-preset-select'), 'Did not expect the old crowd preset select in index.html');

assert(css.includes('.topbar-help'), 'Expected help icon styling in styles.css');
assert(css.includes('.user-avatar'), 'Expected avatar styling in styles.css');
assert(css.includes('.topbar-brand'), 'Expected topbar brand styling in styles.css');
assert(css.includes('.file-name-input'), 'Expected editable file name styling in styles.css');
assert(css.includes('.route-modal'), 'Expected route modal styling in styles.css');
assert(css.includes('.route-modal-node-hit'), 'Expected route modal invisible node hit area styling in styles.css');
assert(css.includes('.agent-modal'), 'Expected agent modal styling in styles.css');
assert(css.includes('.report-modal'), 'Expected report modal styling in styles.css');
assert(css.includes('.report-modal-panel'), 'Expected report modal panel styling in styles.css');
assert(css.includes('.report-preview-frame'), 'Expected report preview frame styling in styles.css');
assert(css.includes('.inspector-actions-section'), 'Expected inspector report action section styling in styles.css');
assert(css.includes('.report-export-btn'), 'Expected report export button styling in styles.css');
assert(css.includes('.report-locale-switch'), 'Expected report locale switch styling in styles.css');
assert(!/\.inspector-actions-section\s*\{[^}]*margin-top\s*:\s*auto/.test(css), 'Did not expect the inspector export action to stay pinned with margin-top auto');
assert(!/\.hotspots-section\s*\{[^}]*flex\s*:\s*1\s+1\s+auto/.test(css), 'Did not expect hotspots section to force the export action to stay pinned below the viewport');
assert(!css.includes('.panel::after'), 'Did not expect an extra inner panel pseudo-layer in styles.css');
assert(css.includes('.agent-radar-panel'), 'Expected radar editor styling in styles.css');
assert(css.includes('.agent-behavior-panel'), 'Expected behavior explanation panel styling in styles.css');
assert(css.includes('.background-crowd-slider'), 'Expected crowd slider styling in styles.css');
assert(css.includes('.background-crowd-canvas'), 'Expected background crowd canvas styling in styles.css');
assert(css.includes('.layer-category-btn'), 'Expected category layer button styling in styles.css');
assert(css.includes('.point-popover'), 'Expected point popover styling in styles.css');
assert(!css.includes('.agent-preview-silhouette'), 'Did not expect the removed agent silhouette styling in styles.css');
assert(css.includes('.map-marker-badge'), 'Expected outer map marker badge styling in styles.css');
assert(css.includes('.node-dot.exit-a'), 'Expected node group color hook for exit A in styles.css');
assert(css.includes('.node-dot.chai-wan'), 'Expected node group color hook for Chai Wan in styles.css');
assert(css.includes('.node-dot.kennedy-town'), 'Expected node group color hook for Kennedy Town in styles.css');
assert(css.includes('.node-dot.tsuen-wan'), 'Expected node group color hook for Tsuen Wan in styles.css');
assert(css.includes('.node-dot.elevator-node'), 'Expected node group color hook for elevator in styles.css');
assert(css.includes('.trace-path'), 'Expected trace path styling in styles.css');
assert(css.includes('.trace-sample'), 'Expected trace sample styling in styles.css');
assert(css.includes('.metric-value.threshold-alert'), 'Expected fatigue threshold alert styling in styles.css');
assert(/\.layer-category-grid\s*\{[\s\S]*grid-template-columns:/.test(css), 'Expected a category layer grid in styles.css');
assert(/\.controls-panel\s*\{[\s\S]*padding:\s*0\s*;/.test(css), 'Expected the left panel shell itself to stop scrolling directly');
assert(/\.controls-scroll\s*\{[\s\S]*overflow:\s*auto\s*;/.test(css), 'Expected the left panel to scroll through an inner wrapper');
assert(/\.inspector-panel\s*\{[\s\S]*padding:\s*0\s*;/.test(css), 'Expected the right panel shell itself to stop scrolling directly');
assert(/\.inspector-scroll\s*\{[\s\S]*overflow:\s*auto\s*;/.test(css), 'Expected the right panel to scroll through an inner wrapper');
assert(/\.walkable-shape\s*\{[\s\S]*fill:\s*rgba\(2[0-2][0-9],\s*2[0-2][0-9],\s*2[0-2][0-9],/.test(css), 'Expected a light gray floor tone in styles.css');
assert(/\.walkable-shape\s*\{[\s\S]*stroke:\s*rgba\([23-5][0-9],\s*[23-5][0-9],\s*[23-5][0-9],/.test(css), 'Expected darker gray map outline in styles.css');
assert(/\.walkable-shape\s*\{[\s\S]*stroke-width:\s*0\.(?:4|5|6)/.test(css), 'Expected thinner walkable outline in styles.css');
assert(/\.node-dot\s*\{[\s\S]*stroke:\s*none\s*;/.test(css), 'Expected node dots to remove their stroke in styles.css');
assert(/\.agent-dot\.focus\s*\{[\s\S]*fill:\s*rgba?\(0,\s*0,\s*0/.test(css) || /\.agent-dot\.focus\s*\{[\s\S]*fill:\s*#0{3,6}/.test(css), 'Expected pure black focus agent styling in styles.css');
assert(/\.agent-dot\.focus\s*\{[\s\S]*stroke:\s*none\s*;/.test(css), 'Expected focus agent to remove its stroke in styles.css');
assert(/const focusRadius = 0\.(?:7|8|9)\d*;/.test(appJs), 'Expected the focus agent dot to be enlarged to roughly double the current size in app.js');
assert(appJs.includes('route-modal-node-hit'), 'Expected route modal nodes to include a larger invisible hit area');
assert(/function handleRouteModalClear\(\)[\s\S]*state\.routeSelection = \{ startPoint: null, startNodeId: null, targetRegionId: null \};/.test(appJs), 'Expected route clearing to reset committed route selection state');
assert(/\.route-node-label\s*\{[\s\S]*font-size:\s*0?\.[0-9]+px/.test(css), 'Expected route node labels to become much smaller in styles.css');
assert(/\.hotspot-highlight-badge text\s*\{[\s\S]*font-size:\s*4(?:\.\d+)?px/.test(css), 'Expected hotspot badge numbers to shrink to roughly half-size in styles.css');
assert(/\.locale-btn\s*\{[\s\S]*min-width:\s*(3[0-9]|40)px/.test(css), 'Expected smaller locale buttons in styles.css');
assert(/select[\s\S]*color-scheme:\s*dark/.test(css), 'Expected dark color-scheme for selects in styles.css');
assert(/option\s*\{[\s\S]*background/.test(css), 'Expected explicit option styling in styles.css');
assert(/\.panel::before[\s\S]*(radial-gradient|linear-gradient)/.test(css), 'Expected stronger frosted panel shell highlight in styles.css');
assert(!/\.controls-panel,\s*\.inspector-panel\s*\{[\s\S]*background\s*:/.test(css), 'Did not expect side panels to paint a second inner background shell');

assert(appJs.includes('renderBackgroundCrowdCanvas'), 'Expected canvas background crowd renderer hook in app.js');
assert(appJs.includes('renderBackgroundCrowdSvgFallback'), 'Expected SVG fallback crowd renderer hook in app.js');
assert(appJs.includes('backgroundRendererMode'), 'Expected background renderer mode state in app.js');
assert(!appJs.includes('MAX_RENDERED_BACKGROUND_AGENTS'), 'Did not expect a hard render cap constant for background crowd display in app.js');
assert(appJs.includes('getRenderableBackgroundAgents'), 'Expected a shared helper for active background crowd rendering in app.js');
assert(/function getRenderableBackgroundAgents\([\s\S]*return backgroundAgents\.filter\(\(agent\) => agent\.active\);/.test(appJs), 'Expected background crowd rendering to expose the full active crowd set instead of frame-by-frame subsampling');
assert(appJs.includes('rebuildBackgroundCrowdPreview'), 'Expected immediate crowd preview rebuild hook in app.js');
assert(appJs.includes('precomputeHeatPlayback') || appJs.includes('precomputedPlayback'), 'Expected app.js to wire precomputed heat playback');
assert(appJs.includes('getPlaybackSnapshotAtTime'), 'Expected playback snapshot interpolation helper in app.js');
assert(appJs.includes('Sim.evaluatePressureStateAtPoint'), 'Expected app.js to derive live playback pressure from the core pressure-state helper');
assert(/function getPlaybackFocusInspection\(\)[\s\S]*evaluatePressureStateAtPoint/.test(appJs), 'Expected playback focus inspection to derive live pressure during playback');
assert(/function getPlaybackFocusInspection\(\)[\s\S]*snapshot\.persistentStress/.test(appJs), 'Expected playback focus inspection to reuse snapshot persistent-stress state');
assert(appJs.includes('clipHeatmapToWalkableArea'), 'Expected walkable heatmap clipping helper in app.js');
assert(appJs.includes('clipHeatmapToTraceCorridor'), 'Expected app.js to clip heat rendering to the 3m trace corridor');
assert(!appJs.includes("ctx.globalCompositeOperation = 'multiply'"), 'Did not expect multiply blending in the heat ribbon renderer');
assert(appJs.includes('selectedTracePoint'), 'Expected trace point selection state in app.js');
assert(appJs.includes('traceSnapshots') || appJs.includes('focusTraceSnapshots'), 'Expected trace snapshot review hooks in app.js');
assert(appJs.includes('HEAT_TRACE_RADIUS_METERS'), 'Expected a dedicated heat trace radius constant in app.js');
assert(/const HEAT_TRACE_RADIUS_METERS = 3(?:\.0)?;/.test(appJs), 'Expected the rendered heat trace radius to be 3m in app.js');
assert(/function handleGenerateCrowd\(\)[\s\S]*state\.animationPaused = true;/.test(appJs), 'Expected crowd generation to keep animation paused while playback is prepared');
assert(/function handleRunHeatmap\(\)[\s\S]*usePrecomputedHeatPlayback/.test(appJs), 'Expected run heatmap to switch into precomputed playback mode');
assert(appJs.includes('getRevealedHeatCells'), 'Expected app.js to reveal true heatmap cells along the playback path');
assert(/getFinalHeatCells\(heatState,\s*[A-Za-z]+TraceSnapshots,\s*activeViewMode,\s*traceRevealRadiusMeters\)/.test(appJs), 'Expected final heatmap mode to reveal the full route corridor instead of the whole map');
assert(appJs.includes('createHeatFieldRaster'), 'Expected app.js to build a smoothed heat-field raster before drawing');
assert(!/function getRevealedHeatCells\([\s\S]*cell\.pressure\s*\|\|\s*0\)\s*<=\s*1e-6/.test(appJs), 'Did not expect revealed heat cells to discard zero-pressure path cells');
assert(!appJs.includes("state.animationPaused = nextMode === 'final';"), 'Did not expect final heatmap mode to pause playback animation');
assert(/function getPlaybackFocusInspection\(\)[\s\S]*useSnapshotPressure/.test(appJs), 'Expected playback focus inspection to prefer deterministic precomputed snapshot pressure during replay');
assert(!appJs.includes('fillHeatRibbonSegment('), 'Did not expect ribbon-segment rendering to remain in app.js');
assert(appJs.includes('firstPassComplete'), 'Expected first-pass completion state in app.js');
assert(appJs.includes('loopPlaybackActive') || appJs.includes('replayLoopActive'), 'Expected loop playback state in app.js');
assert(/function getVisibleTraceSnapshots[\s\S]*state\.loopPlaybackActive[\s\S]*return playback\.traceSnapshots/.test(appJs), 'Expected completed playback loops to keep the full heat ribbon visible in app.js');
assert(appJs.includes('cognitiveLoad') || appJs.includes('cognitive-load'), 'Expected cognitive-load naming hook in app.js');
assert(appJs.includes('fatigueThreshold'), 'Expected fatigue threshold hook in app.js');
assert(appJs.includes('[124, 77, 255]') || appJs.includes('[128, 0, 255]'), 'Expected low-end purple heat palette stop in app.js');
assert(appJs.includes('[255, 0, 0]') || appJs.includes('[224, 62, 48]'), 'Expected high-end red heat palette stop in app.js');
assert(appJs.includes('pointerdown') && appJs.includes('handleOverlayPointerDown'), 'Expected pointerdown-based focus agent pausing in app.js');
assert(appJs.includes('suppressNextOverlayClick'), 'Expected one-shot click suppression after pointerdown in app.js');
assert(appJs.includes("markerLabelFill = 'rgba(255, 255, 255, 0.96)'"), 'Expected explicit white marker label fill in app.js');
assert(/state\.selectedDynamic\?\.kind === 'focus-agent'[\s\S]*state\.viewMode === 'sensory' \|\| state\.viewMode === 'vitality'[\s\S]*vision-ring/.test(appJs), 'Expected vision ring rendering to be limited to sensory and vitality views');
assert(appJs.includes('routePickMode'), 'Expected route pick mode state in app.js');
assert(appJs.includes('routeModal') || appJs.includes('route-modal'), 'Expected route modal state or hooks in app.js');
assert(appJs.includes('agentModal') || appJs.includes('agent-modal'), 'Expected agent modal state or hooks in app.js');
assert(appJs.includes('reportModal') || appJs.includes('report-modal'), 'Expected report modal state or hooks in app.js');
assert(appJs.includes('reportLocale'), 'Expected independent report locale state in app.js');
assert(appJs.includes('backgroundCrowd') || appJs.includes('background-crowd'), 'Expected background crowd state or hooks in app.js');
assert(appJs.includes('fileNameDraft') || appJs.includes('appFileNameInput'), 'Expected editable file name state or hooks in app.js');
assert(appJs.includes('pointPopover') || appJs.includes('point-popover'), 'Expected point popover state or hooks in app.js');
assert(appJs.includes('editedPressureOverrides') || appJs.includes('pressureOverrides'), 'Expected editable point override state in app.js');
assert(appJs.includes('target-region'), 'Expected target region interaction in app.js');
assert(appJs.includes('selectedHotspotId'), 'Expected explicit selected hotspot state in app.js');
assert(appJs.includes('handleHotspotClick'), 'Expected hotspot card click handler in app.js');
assert(appJs.includes('hotspot-highlight-ring'), 'Expected hotspot overlay highlight rendering in app.js');
assert(appJs.includes('getSelectedHotspotOverlayItem'), 'Expected app.js to expose a selected-hotspot overlay helper');
assert(/function renderOverlayLayer\(\)[\s\S]*getSelectedHotspotOverlayItem\(\)/.test(appJs), 'Expected renderOverlayLayer to force-render the selected hotspot on the map');
assert(appJs.includes('getHeatCellAlpha'), 'Expected a dedicated heat alpha helper in app.js');
assert(appJs.includes('getHeatDisplayRgb'), 'Expected a dedicated heat color-brightness helper in app.js');
assert(appJs.includes('revealedHeatCellsCache'), 'Expected app.js to keep a revealed heat-cell cache for playback rendering');
assert(appJs.includes('heatRasterCache'), 'Expected app.js to keep a cached heat raster for static replay rendering');
assert(appJs.includes('visibleTraceSnapshotCache'), 'Expected app.js to keep a visible-trace cache for playback rendering');
assert(/function buildTraceScopedHeatCells\([\s\S]*state\.revealedHeatCellsCache/.test(appJs), 'Expected heat playback rendering to reuse revealed heat cells from cache buckets');
assert(appJs.includes('heatmapDisplayMode'), 'Expected app.js to track final-vs-playback heatmap display mode');
assert(appJs.includes('showFinalHeatmapBtn'), 'Expected app.js to wire the final heatmap button');
assert(appJs.includes('getFinalHeatCells'), 'Expected app.js to support rendering the completed heatmap directly');
assert(appJs.includes('buildRouteReportData'), 'Expected route-report data builder in app.js');
assert(appJs.includes('buildRouteReportDocument'), 'Expected route-report HTML builder in app.js');
assert(appJs.includes('renderReportModal'), 'Expected report modal renderer in app.js');
assert(appJs.includes('setReportLocale'), 'Expected report locale switch handler in app.js');
assert(appJs.includes('handleExportReport'), 'Expected route-report export handler in app.js');
assert(appJs.includes('dimensionSnapshot'), 'Expected report copy to include the five-dimension snapshot section');
assert(appJs.includes('buildDimensionReportMarkup'), 'Expected app.js to render five-dimension burden markup');
assert(appJs.includes('viewMode'), 'Expected app.js to track the current burden view mode');
assert(appJs.includes('capacityScores'), 'Expected app.js to preserve capacity scores in the focus profile');
assert(appJs.includes('handleViewModeChange'), 'Expected app.js to expose a viewport view-mode change handler');
assert(appJs.includes('showSaveFilePicker'), 'Expected route-report export to attempt File System Access API saves');
assert(/URL\.createObjectURL|anchor\.download/.test(appJs), 'Expected route-report export to include a download fallback');
assert(/function getHeatDisplayRgb\(pressure,\s*localPressureMin,\s*localPressureMax(?:,[^)]+)?\)/.test(appJs), 'Expected displayed heat color to support route-local pressure normalization');
assert(/function createHeatFieldRaster\(revealedHeatCells,\s*localPressureMin,\s*localPressureMax(?:,[^)]+)?\)/.test(appJs), 'Expected heat raster creation to receive the current route pressure range');
assert(/function createHeatFieldRaster\([\s\S]*getHeatDisplayRgb\(pressure,\s*localPressureMin,\s*localPressureMax(?:,[^)]+)?\)/.test(appJs), 'Expected heat raster colors to use the current route pressure range when mapping colors');
assert(/function createHeatFieldRaster\([\s\S]*grid\.rows\s*-\s*1\s*-\s*gridCell\.row/.test(appJs), 'Expected heat raster rows to flip grid Y into canvas Y so clipped heat stays aligned to the walkable map');
assert(/function getHeatCellAlpha\([\s\S]*return safePressure >= 0 \? 1 : 0;/.test(appJs), 'Expected heat raster alpha to keep the full revealed corridor visible');
assert(!/function renderHeatmap\([\s\S]*paintHeatFieldKernels\(/.test(appJs), 'Did not expect renderHeatmap to stack extra heat kernels on top of the raster anymore');
assert((appJs.match(/ctx\.drawImage\(heatRaster/g) || []).length >= 2, 'Expected renderHeatmap to draw the heat raster in at least two passes for visibility');
assert(appJs.includes('buildAgentRadarSvg'), 'Expected app.js to render the interactive agent radar chart');
assert(!appJs.includes('displayedHotspots.forEach((hotspot, index) => {'), 'Did not expect Top 3 hotspots to be stamped onto the main map overlay before card selection');
assert(appJs.includes('resolveHotspotTarget'), 'Expected selected issue cards to resolve to the current view target object before rendering');
assert(appJs.includes('topPressureSources') || appJs.includes('currentPressureSources'), 'Expected app.js to support current-position top pressure sources');
assert(appJs.includes('threshold-alert'), 'Expected app.js to toggle threshold alert styling for fatigue');
assert(!/formatPercent\(summary\.averageFatigue\)/.test(appJs), 'Did not expect average fatigue to be formatted as a percentage in app.js');
assert(!/formatPercent\(inspection\.fatigue\s*\|\|\s*0\)/.test(appJs), 'Did not expect dynamic fatigue to be formatted as a percentage in app.js');
assert(!/formatPercent\(inspection\.pressure\s*\|\|\s*0\)/.test(appJs), 'Did not expect cognitive load to be formatted as a percentage in app.js');

assert(/facility:\s*0\.(?!0+\b)|facility:\s*[1-9]/.test(Sim.PRESSURE_WEIGHTS ? JSON.stringify(Sim.PRESSURE_WEIGHTS) : coreJs), 'Expected facility category to participate in pressure weighting');
assert(/const VISION_RADIUS = 15;/.test(coreJs), 'Expected 15m vision radius in core.js');
assert(/function lineIsWalkable\(start, end, prepared, options\)[\s\S]*minimumClearance,\s*1(?:\.0+)?\)/.test(coreJs), 'Expected line-of-sight smoothing to enforce at least 1m clearance');
assert(/const safeStartPoint = projectPointToWalkable\(prepared, startPoint, \{ minimumClearance: 1(?:\.0+)? \}\);/.test(coreJs), 'Expected pathfinding start projection to keep roughly 1m wall clearance');
assert(/const safeEndPoint = projectPointToWalkable\(prepared, endPoint, \{ minimumClearance: 1(?:\.0+)? \}\);/.test(coreJs), 'Expected pathfinding end projection to keep roughly 1m wall clearance');
assert(/turnPenalty = Math\.pow\(turnIntensity,\s*1\.2\)\s*\*\s*1\.(?:2|3|4|5)/.test(coreJs), 'Expected stronger turn penalty in core.js');
assert(/const desiredOffset = clamp\(agent\.laneBias \+ agent\.personalBias,\s*-0\.(?:3|4|5)\d*,\s*0\.(?:3|4|5)\d*\);/.test(coreJs), 'Expected lane offset to stay closer to path center in core.js');
assert(/BASE_ENVIRONMENT_NOISE\s*=\s*60/.test(coreJs), 'Expected 60dB base environment noise hook in core.js');
assert(/BASE_ENVIRONMENT_(LIGHT|LIGHTING|LUX)\w*\s*=\s*250/.test(coreJs), 'Expected 250lux base environment lighting hook in core.js');
assert(/FATIGUE_THRESHOLDS/.test(coreJs), 'Expected absolute fatigue threshold table hook in core.js');
assert(/firstPassComplete|first-pass/.test(coreJs), 'Expected first-pass heat retention hook in core.js');
assert(/traceSnapshots|focusTraceSnapshots/.test(coreJs), 'Expected stored trace snapshot hook in core.js');
assert(/const HEAT_RADIUS = 3(?:\.0)?;/.test(coreJs), 'Expected the heat stamp radius to be 3m in core.js');
assert(typeof Sim.precomputeHeatPlayback === 'function', 'Expected exported heat precomputation helper');
assert(typeof Sim.getTopPressureSourcesAtPoint === 'function', 'Expected exported helper for current-position top pressure sources');
assert(typeof Sim.getUnifiedRules === 'function', 'Expected exported unified rules accessor');
assert(typeof Sim.normalizeCapacityScores === 'function', 'Expected exported capacity-score normalizer');
assert(typeof Sim.deriveFiveDimensionStateAtPoint === 'function', 'Expected exported five-dimension derivation helper');
assert(typeof Sim.buildLLMDecisionContext === 'function', 'Expected exported LLM decision context helper');
assert(unifiedRules && unifiedRules.dimensions && unifiedRules.dimensions.cognitive, 'Expected unified rules to expose the five dimensions');
assert(unifiedRules.scale.vulnerabilityByScore[5] === 0.84, 'Expected unified rules to normalize score 5 vulnerability to 0.84');
assert(coreJs.includes('evaluatePressureStateAtPoint(prepared, scenario, cell'), 'Expected core heat deposition to sample each nearby cell using the real pressure-state helper');
assert(!coreJs.includes('const intensity = Math.max(1, actualPressure);'), 'Did not expect core heat deposition to force one minimum uniform stamp intensity across the full 3m reveal radius');

const scenario = Sim.createScenario(prepared, {
  crowdPresetId: 'normal',
  backgroundCrowdCount: 100,
  startPoint: { x: 159.824, y: 64.794, z: 10.5 },
  targetRegionId: 'chai_wan',
  focusProfile: { capacityScores: baselineCapacityScores },
});
Sim.activateHeatmap(prepared, scenario, { warmupSeconds: 8, warmupDt: 0.25 });
const inspection = Sim.inspectAgent(prepared, scenario, scenario.focusAgentId);
assert(inspection && inspection.burdenScores, 'Expected focus-agent inspection to expose five-dimension burden scores');
assert(Object.keys(inspection.burdenScores).length === 5, 'Expected exactly five burden-score entries');
assert(inspection.fiveDimensions && inspection.fiveDimensions.summary, 'Expected detailed five-dimension inspection payload');
const llmContext = Sim.buildLLMDecisionContext(prepared, scenario, scenario.focusAgent.position, { agent: scenario.focusAgent });
assert(llmContext && Array.isArray(llmContext.recognizedObjects), 'Expected LLM context to expose recognized objects');
assert(llmContext && Array.isArray(llmContext.nearbyNodes), 'Expected LLM context to expose nearby nodes');
assert(typeof Sim.resolveStressRuleDescriptor === 'function', 'Expected exported stress rule descriptor helper');
assert(typeof Sim.getCrowdingStressCoefficients === 'function', 'Expected exported crowding-stress coefficient helper');
assert(typeof Sim.getNoiseStressCoefficients === 'function', 'Expected exported noise-stress coefficient helper');
assert(prepared.grid.walkableIndices.every((index) => typeof prepared.grid.cells[index].wallDistance === 'number'), 'Expected wallDistance to be computed for walkable cells');
assert(typeof Sim.getFacilitySwitchProbability === 'function', 'Expected exported facility switch probability helper');
assert(typeof Sim.estimateFacilityWaitTime === 'function', 'Expected exported facility wait helper');
assert(typeof Sim.estimateFacilityRideTime === 'function', 'Expected exported facility ride helper');
assert(typeof Sim.getQueueFatigueCoefficient === 'function', 'Expected exported queue fatigue helper');
assert(typeof Sim.getLightingFatigueCoefficient === 'function', 'Expected exported lighting fatigue helper');
assert(typeof Sim.getNoiseFatigueCoefficient === 'function', 'Expected exported noise fatigue helper');
assert(typeof Sim.getCrowdingFatigueCoefficient === 'function', 'Expected exported crowding fatigue helper');
assert(typeof Sim.getPhysicalFatigueCoefficient === 'function', 'Expected exported physical fatigue helper');
assert(typeof Sim.getTargetCandidateNodes === 'function', 'Expected exported target candidate helper');
assert(typeof Sim.buildFocusProfile === 'function', 'Expected focus profile builder to be exposed');
assert(Sim.LONGEST_WALKING_TIME_MINUTES, 'Expected longest walking time table to be exposed');
assertClose(Sim.LONGEST_WALKING_TIME_MINUTES.default, 100 / (0.135 * 60), 1e-6, 'Default longest walking time mismatch');
assertClose(Sim.LONGEST_WALKING_TIME_MINUTES[1], 100 / (0.264 * 60), 1e-6, 'Vitality-1 longest walking time mismatch');
assertClose(Sim.LONGEST_WALKING_TIME_MINUTES[5], 100 / (0.091 * 60), 1e-6, 'Vitality-5 longest walking time mismatch');
assert(Sim.REST_RULES && Sim.REST_RULES.shortRestSeconds === 2, 'Expected short-rest duration to be exposed');
assert(Sim.REST_RULES && Sim.REST_RULES.seatSearchThresholdPercent === 85, 'Expected seat-search threshold to be exposed');
assert(Sim.REST_RULES && Sim.REST_RULES.resumeFatiguePercent === 20, 'Expected rest resume threshold to be exposed');
assert(Sim.REST_RULES && Sim.REST_RULES.slowWalkSpeedFactor === 0.5, 'Expected slow walk factor to be exposed');
assertClose(Sim.REST_RULES.sittingRecoveryPercentPerSecond, 0.333, 1e-6, 'Expected sitting recovery rate per second');
assertClose(Sim.REST_RULES.standingRecoveryPercentPerSecond, 0.083, 1e-6, 'Expected standing recovery rate per second');
assertClose(Sim.getFacilitySwitchProbability(3), 0, 1e-6, 'Queue <4 should not trigger switching');
assertClose(Sim.getFacilitySwitchProbability(4), 0.225, 1e-6, 'Queue 4-5 switch probability mismatch');
assertClose(Sim.getFacilitySwitchProbability(6), 0.55, 1e-6, 'Queue 6-10 switch probability mismatch');
assertClose(Sim.getFacilitySwitchProbability(12), 0.875, 1e-6, 'Queue 11-15 switch probability mismatch');
assertClose(Sim.getFacilitySwitchProbability(20), 0.875, 1e-6, 'Queue >15 switch probability mismatch');
assertClose(Sim.getQueueFatigueCoefficient(2), 1, 1e-6, 'Queue <3 fatigue coefficient mismatch');
assertClose(Sim.getQueueFatigueCoefficient(4), 1.2, 1e-6, 'Queue 3-5 fatigue coefficient mismatch');
assertClose(Sim.getQueueFatigueCoefficient(6), 1.5, 1e-6, 'Queue >5 fatigue coefficient mismatch');
assertClose(Sim.getCrowdingFatigueCoefficient(0.6), 1, 1e-6, 'Crowding <1 fatigue coefficient mismatch');
assertClose(Sim.getCrowdingFatigueCoefficient(2), 1.2, 1e-6, 'Crowding 1-3 fatigue coefficient mismatch');
assertClose(Sim.getCrowdingFatigueCoefficient(4.2), 1.4, 1e-6, 'Crowding 3-5 fatigue coefficient mismatch');
assertClose(Sim.getCrowdingFatigueCoefficient(6.5), 1.6, 1e-6, 'Crowding >5 fatigue coefficient mismatch');
assertClose(Sim.getNoiseFatigueCoefficient(55), 1, 1e-6, 'Noise <=60 fatigue coefficient mismatch');
assertClose(Sim.getNoiseFatigueCoefficient(65), 1.1, 1e-6, 'Noise 61-70 fatigue coefficient mismatch');
assertClose(Sim.getNoiseFatigueCoefficient(75), 1.3, 1e-6, 'Noise 70-80 fatigue coefficient mismatch');
assertClose(Sim.getNoiseFatigueCoefficient(85), 1.5, 1e-6, 'Noise >80 fatigue coefficient mismatch');
assertClose(Sim.getLightingFatigueCoefficient(1200), 1.3, 1e-6, 'Lighting >1000 fatigue coefficient mismatch');
assertClose(Sim.getLightingFatigueCoefficient(600), 1.1, 1e-6, 'Lighting 500-1000 fatigue coefficient mismatch');
assertClose(Sim.getLightingFatigueCoefficient(300), 1, 1e-6, 'Lighting 200-500 fatigue coefficient mismatch');
assertClose(Sim.getLightingFatigueCoefficient(150), 1.1, 1e-6, 'Lighting <200 fatigue coefficient mismatch');
assertClose(Sim.getPhysicalFatigueCoefficient({}), 1, 1e-6, 'Physical fatigue coefficient should no longer depend on BMI');

const dynamicAdRule = Sim.resolveStressRuleDescriptor({ name: 'Advertisement', feature: 'Dynamic/flashing ads, 1060 lux', lux: 1060, decibel: 0 });
assert(dynamicAdRule && dynamicAdRule.ruleId === 'advertisement_dynamic', 'Expected 1060 lux advertisement to map to dynamic/flashing ads');
assert(dynamicAdRule.triggerRadius === 15, 'Expected vision-triggered stress rules to use the 15m vision radius');
assert(dynamicAdRule.outcomes.some((item) => item.stressDelta === 40), 'Expected dynamic/flashing ads to include a +40 stress change rule');

const syntheticAdNoisePrepared = Sim.prepareSimData({
  walkableAreas: [
    [
      { x: -20, y: -20 },
      { x: 20, y: -20 },
      { x: 20, y: 20 },
      { x: -20, y: 20 },
    ],
  ],
  obstacles: [],
  nodes: [],
  pressureObjects: [
    {
      id: 'synthetic_ad_noise',
      name: 'Advertisement',
      feature: 'Dynamic/flashing ads',
      category: 'advertisement',
      x: 0,
      y: 0,
      z: 0,
      strength: 1,
      range: 15,
      lux: 1060,
      decibel: 80,
      activeForSimulation: true,
    },
  ],
  seats: [],
}, { healthyAgents });
const syntheticAdNoiseScenario = {
  rng: Sim.createRng(1),
  agents: [],
  prepared: syntheticAdNoisePrepared,
};
const syntheticAdNoiseAgent = {
  id: 'synthetic_ad_noise_agent',
  active: true,
  position: { x: 0, y: 0 },
  accumulatedStress: 0,
  pressureEventStates: {},
};
const syntheticAdNoisePressure = Sim.evaluatePressureStateAtPoint(
  syntheticAdNoisePrepared,
  syntheticAdNoiseScenario,
  { x: 0, y: 0 },
  { agent: syntheticAdNoiseAgent, applyTriggers: false }
);
assert(syntheticAdNoisePressure.ambientNoiseStress > 60, 'Expected advertisement points with 80dB to contribute ambient noise stress in addition to the ad rule itself');

const syntheticTracePrepared = {
  ...prepared,
  activePressureObjects: [],
};
const syntheticTraceScenario = Sim.createScenario(syntheticTracePrepared, {
  crowdPresetId: 'normal',
  backgroundCrowdCount: 1,
  startPoint: {
    x: syntheticTracePrepared.grid.cells[syntheticTracePrepared.grid.walkableIndices[0]].x,
    y: syntheticTracePrepared.grid.cells[syntheticTracePrepared.grid.walkableIndices[0]].y,
    z: 0,
  },
  targetRegionId: (syntheticTracePrepared.targetRegions.find((region) => region.id === 'kdt') || syntheticTracePrepared.targetRegions[0]).id,
  focusProfile: { capacityScores: baselineCapacityScores },
  seed: 7,
});
const syntheticTracePlayback = Sim.precomputeHeatPlayback(syntheticTracePrepared, syntheticTraceScenario, { warmupSeconds: 1, warmupDt: 0.2 });
assert(
  syntheticTracePlayback.heat.cells.some((cell) => Number(cell.heat || 0) > 1e-6),
  'Expected even zero-pressure routes to leave a visible heat ribbon corridor instead of disappearing entirely'
);

const customerServiceRule = Sim.resolveStressRuleDescriptor({ name: 'Customer Service Centre', feature: 'Customer Service Centre' });
assert(customerServiceRule && customerServiceRule.ruleId === 'customer_service_centre', 'Expected customer service centre rule resolution');
assert(customerServiceRule.outcomes.length === 3, 'Expected customer service centre to expose three probability outcomes');
const hangingSignsRule = Sim.resolveStressRuleDescriptor({ name: 'Hanging Signs', feature: 'Brief information' });
assert(hangingSignsRule && hangingSignsRule.ruleId === 'hanging_signs_brief', 'Expected hanging signs rule resolution');
assert(hangingSignsRule.outcomes.some((item) => item.stressDelta === -20), 'Expected hanging signs to expose the -20 brief-information rule');
const panoramicGuideRule = Sim.resolveStressRuleDescriptor({ name: 'Panoramic guide map', feature: 'Detailed information' });
assert(panoramicGuideRule && panoramicGuideRule.ruleId === 'panoramic_guide_map_detailed', 'Expected panoramic guide map rule resolution');
assert(panoramicGuideRule.outcomes.some((item) => item.stressDelta === -40), 'Expected panoramic guide map to expose the -40 detailed-information rule');

const positiveCrowdingCoefficients = Sim.getCrowdingStressCoefficients(4.2);
assertClose(positiveCrowdingCoefficients.positive, 1.4, 1e-6, 'Expected 3-5 crowding band positive stress coefficient');
assertClose(positiveCrowdingCoefficients.negative, 0.7, 1e-6, 'Expected 3-5 crowding band negative stress coefficient');

const positiveNoiseCoefficients = Sim.getNoiseStressCoefficients(74);
assertClose(positiveNoiseCoefficients.positive, 1.3, 1e-6, 'Expected 70-80 dB positive stress coefficient');
assertClose(positiveNoiseCoefficients.negative, 0.8, 1e-6, 'Expected 70-80 dB negative stress coefficient');
assert(typeof Sim.evaluatePressureStateAtPoint === 'function', 'Expected exported pressure-state evaluation helper');

const syntheticPrepared = Sim.prepareSimData({
  walkableAreas: [
    [
      { x: -20, y: -20 },
      { x: 20, y: -20 },
      { x: 20, y: 20 },
      { x: -20, y: 20 },
    ],
  ],
  obstacles: [],
  nodes: [],
  pressureObjects: [
    {
      id: 'synthetic_ad_dynamic',
      name: 'Advertisement',
      feature: 'Dynamic/flashing ads',
      category: 'advertisement',
      x: 0,
      y: 0,
      z: 0,
      strength: 1,
      range: 15,
      activeForSimulation: true,
    },
    {
      id: 'synthetic_customer_service',
      name: 'Customer Service Centre',
      feature: 'Customer Service Centre',
      category: 'facility',
      x: 0,
      y: 0,
      z: 0,
      strength: 1,
      range: 15,
      activeForSimulation: true,
    },
  ],
  seats: [],
}, { healthyAgents });

const syntheticPassiveScenario = {
  rng: Sim.createRng(1),
  agents: [],
  prepared: syntheticPrepared,
};
const syntheticPassiveAgent = {
  id: 'synthetic_focus_passive',
  active: true,
  position: { x: 0, y: 0 },
  accumulatedStress: 0,
  pressureEventStates: {},
};
const localVisualStress = Sim.evaluatePressureStateAtPoint(
  syntheticPrepared,
  syntheticPassiveScenario,
  { x: 0, y: 0 },
  { agent: syntheticPassiveAgent, applyTriggers: false }
);
assertClose(localVisualStress.pressureScore, 0, 1e-6, 'Expected first-sight stress sources to stay inactive before a trigger is sampled');

const syntheticTriggeredScenario = {
  rng: { next: () => 0.05 },
  agents: [],
  prepared: syntheticPrepared,
};
const syntheticTriggeredAgent = {
  id: 'synthetic_focus_triggered',
  active: true,
  position: { x: 0, y: 0 },
  accumulatedStress: 0,
  pressureEventStates: {},
};
const triggeredLocalPressure = Sim.evaluatePressureStateAtPoint(
  syntheticPrepared,
  syntheticTriggeredScenario,
  { x: 0, y: 0 },
  { agent: syntheticTriggeredAgent, applyTriggers: true }
);
assertClose(triggeredLocalPressure.pressureScore, 374, 1e-6, 'Expected customer-service and dynamic-ad triggers to persist after the first sight event is sampled');
const persistentRemotePressure = Sim.evaluatePressureStateAtPoint(
  syntheticPrepared,
  syntheticTriggeredScenario,
  { x: 16, y: 0 },
  { agent: syntheticTriggeredAgent, applyTriggers: false }
);
assertClose(persistentRemotePressure.pressureScore, 374, 1e-6, 'Expected first-sight stress to persist after leaving the local visual range');

const kdtCandidateIds = Sim.getTargetCandidateNodes(prepared, 'kdt').map((item) => item.id);
assert(kdtCandidateIds.includes('es_down_1_top'), 'Expected KDT candidates to include down escalator 1');
assert(kdtCandidateIds.includes('es_down_4_top'), 'Expected KDT candidates to include down escalator 4');
assert(kdtCandidateIds.includes('stair_2_top'), 'Expected KDT candidates to include stair 2');
assert(kdtCandidateIds.includes('elev_3'), 'Expected KDT candidates to include lift');
assert(!kdtCandidateIds.includes('es_up_1_top'), 'Did not expect KDT target candidates to include up escalator 1');

const twlCandidateIds = Sim.getTargetCandidateNodes(prepared, 'twl').map((item) => item.id);
assert(twlCandidateIds.includes('es_down_5_top'), 'Expected TWL candidates to include down escalator 5');
assert(twlCandidateIds.includes('es_down_6_top'), 'Expected TWL candidates to include down escalator 6');
assert(twlCandidateIds.includes('elev_3'), 'Expected TWL candidates to include lift');
assert(!twlCandidateIds.includes('es_up_5_top'), 'Did not expect TWL target candidates to include up escalator 5');
assertClose(Sim.estimateFacilityWaitTime(prepared.nodeById.es_up_1_top, 5), 5, 1e-6, 'Escalator wait time should be queueCount * 1 second');
assertClose(Sim.estimateFacilityWaitTime(prepared.nodeById.stair_2_top, 5), 5, 1e-6, 'Stair wait time should be queueCount * 1 second');
assertClose(Sim.estimateFacilityWaitTime(prepared.nodeById.elev_3, 1), 40, 1e-6, 'Elevator wait time should be queueCount * 40 seconds');
assertClose(Sim.estimateFacilityWaitTime(prepared.nodeById.train_door1 || prepared.nodeById.train_door_1, 16), 181, 1e-6, 'Platform wait time should include the missed-train cycle');
assertClose(Sim.estimateFacilityRideTime(prepared.nodeById.es_up_1_top), 15, 1e-6, 'Escalator ride time should be 15 seconds');
assertClose(Sim.estimateFacilityRideTime(prepared.nodeById.elev_3), 4, 1e-6, 'Elevator ride time should be 4 seconds');
assertClose(Sim.estimateFacilityRideTime(prepared.nodeById.stair_2_top), 20, 1e-6, 'Stair ride time should be 20 seconds');

const familyWeights = prepared.odRoutes.reduce((accumulator, route) => {
  accumulator[route.family] = (accumulator[route.family] || 0) + route.weight;
  return accumulator;
}, {});

assertClose(familyWeights.gate_in_to_train_door, 0.0175, 1e-6, 'gate_in_to_train_door family weight mismatch');
assertClose(familyWeights.gate_in_to_twl_down, 0.11, 1e-6, 'gate_in_to_twl_down family weight mismatch');
assertClose(familyWeights.gate_in_to_kdt_down, 0.09, 1e-6, 'gate_in_to_kdt_down family weight mismatch');
assertClose(familyWeights.train_door_to_gate_out, 0.15, 1e-6, 'train_door_to_gate_out family weight mismatch');
assertClose(familyWeights.train_door_to_twl_down, 0.14, 1e-6, 'train_door_to_twl_down family weight mismatch');
assertClose(familyWeights.train_door_to_kdt_down, 0.10, 1e-6, 'train_door_to_kdt_down family weight mismatch');
assertClose(familyWeights.twl_up_to_gate_out, 0.17, 1e-6, 'twl_up_to_gate_out family weight mismatch');
assertClose(familyWeights.twl_up_to_train_door, 0.01, 1e-6, 'twl_up_to_train_door family weight mismatch');
assertClose(familyWeights.kdt_up_to_gate_out, 0.11, 1e-6, 'kdt_up_to_gate_out family weight mismatch');
assertClose(familyWeights.kdt_up_to_train_door, 0.005, 1e-6, 'kdt_up_to_train_door family weight mismatch');

const customStartCell = prepared.grid.cells[prepared.grid.walkableIndices[0]];
const targetRegion = prepared.targetRegions.find((region) => region.id === 'kdt') || prepared.targetRegions[0];
const normalScenario = Sim.createScenario(prepared, {
  crowdPresetId: 'normal',
  startPoint: { x: customStartCell.x, y: customStartCell.y },
  targetRegionId: targetRegion.id,
  focusProfile: { capacityScores: baselineCapacityScores },
  seed: 17,
});

const fatigueProbeScenario = Sim.createScenario(prepared, {
  crowdPresetId: 'normal',
  startPoint: { x: customStartCell.x, y: customStartCell.y },
  targetRegionId: targetRegion.id,
  focusProfile: { capacityScores: lowVitalityCapacityScores },
  seed: 29,
});
Sim.stepScenario(prepared, fatigueProbeScenario, 240);
const fatigueProbeInspection = Sim.inspectAgent(prepared, fatigueProbeScenario, fatigueProbeScenario.focusAgentId);
const customCrowdScenario = Sim.createScenario(prepared, {
  crowdPresetId: 'normal',
  backgroundCrowdCount: 200,
  startPoint: { x: customStartCell.x, y: customStartCell.y },
  targetRegionId: targetRegion.id,
  focusProfile: { capacityScores: baselineCapacityScores },
  seed: 41,
});
const precomputedPlayback = Sim.precomputeHeatPlayback(prepared, customCrowdScenario, { warmupSeconds: 48, warmupDt: 0.25 });

assert(normalScenario.agents.length === 70, 'Normal scenario should create 70 agents');
assert(normalScenario.backgroundAgents.length === 69, 'Normal scenario should create 69 background agents');
assert(customCrowdScenario.agents.length === 200, 'Custom crowd scenario should create the full requested population');
assert(customCrowdScenario.backgroundAgents.length === 199, 'Custom crowd scenario should render the full requested background population');
assert(normalScenario.focusAgent.id === normalScenario.focusAgentId, 'Focus agent id should be stable');
assert(normalScenario.focusTargetRegion.id === targetRegion.id, 'Focus agent should target the chosen region');
assert(normalScenario.focusAgent.fatigue === 0, 'Focus agent fatigue should start at 0');
assert(precomputedPlayback && Array.isArray(precomputedPlayback.traceSnapshots) && precomputedPlayback.traceSnapshots.length > 12, 'Expected precomputed playback to contain a full trace snapshot sequence');
assert(precomputedPlayback && precomputedPlayback.pressureRange && Number.isFinite(precomputedPlayback.pressureRange.min), 'Expected precomputed playback to expose a pressure range');
assert(precomputedPlayback && precomputedPlayback.pressureRange.max + 1e-6 >= precomputedPlayback.pressureRange.min, 'Expected a valid precomputed pressure range ordering');
assert(precomputedPlayback && precomputedPlayback.duration > 0, 'Expected precomputed playback to expose playback duration');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.environmentNoise === 'number'), 'Expected precomputed playback snapshots to include environment noise');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.environmentLighting === 'number'), 'Expected precomputed playback snapshots to include environment lighting');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.queueCount === 'number'), 'Expected precomputed playback snapshots to include queue count');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.crowdDensity === 'number'), 'Expected precomputed playback snapshots to include crowd density');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.fatigueThreshold === 'number'), 'Expected precomputed playback snapshots to include fatigue threshold');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.persistentStress === 'number'), 'Expected precomputed playback snapshots to include persistent stress state');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => typeof snapshot.ambientNoiseStress === 'number'), 'Expected precomputed playback snapshots to include ambient-noise stress state');
assert(precomputedPlayback.traceSnapshots.some((snapshot) => Array.isArray(snapshot.topPressureSources)), 'Expected precomputed playback snapshots to include top pressure sources');
assert(fatigueProbeInspection && fatigueProbeInspection.fatigueThreshold === 100, 'Expected fatigue inspection to expose the five-dimension threshold');
assert(fatigueProbeInspection && typeof fatigueProbeInspection.environmentNoise === 'number', 'Expected fatigue inspection to expose environment noise');
assert(fatigueProbeInspection && typeof fatigueProbeInspection.environmentLighting === 'number', 'Expected fatigue inspection to expose environment lighting');
assert(fatigueProbeInspection && typeof fatigueProbeInspection.queueCount === 'number', 'Expected fatigue inspection to expose queue count');
assert(normalScenario.focusAgent.queueLocked === false, 'Focus agent queue lock should start false');
assert(normalScenario.backgroundAgents.every((agent) => agent.routeId !== normalScenario.focusRoute.id), 'Background agents must exclude current focus route');
assert(normalScenario.heat.totalDeposits === 0, 'Heat should be empty before run heatmap');

Sim.stepScenario(prepared, normalScenario, 2.5);
assert(Number.isFinite(normalScenario.focusAgent.position.x), 'Focus agent should have a valid X after stepping');
assert(Number.isFinite(normalScenario.focusAgent.position.y), 'Focus agent should have a valid Y after stepping');
assert(normalScenario.focusAgent.fatigue >= 0, 'Focus agent fatigue should be tracked');

Sim.activateHeatmap(prepared, normalScenario, { warmupSeconds: 48, warmupDt: 0.25 });
assert(normalScenario.heat.totalDeposits === 0, 'Heat should remain empty immediately after activating heatmap');
assert(normalScenario.hotspots.length === 0, 'Hotspots should remain empty until the focus agent starts moving');
assert(normalScenario.heatMode === 'cumulative-live', 'Expected cumulative-live heat mode after activation');

const priorTotalDeposits = normalScenario.heat.totalDeposits;
Sim.stepScenario(prepared, normalScenario, 1.2);
assert(normalScenario.heat.totalDeposits >= priorTotalDeposits, 'Expected cumulative heat deposits to stay or grow after stepping');
assert(normalScenario.hotspots.length === 3, 'Hotspots should contain top 3 items after the focus agent starts moving');
const priorHeatByIndex = new Map(
  normalScenario.heat.cells.filter((cell) => cell.heat > 0.5).slice(0, 24).map((cell) => [cell.index, cell.heat])
);
priorHeatByIndex.forEach((previousHeat, index) => {
  const currentCell = normalScenario.heat.cellByIndex[index];
  assert(currentCell.heat + 1e-6 >= previousHeat, `Expected heated cell ${index} to stay visible without fading`);
});

const maxHeatCell = normalScenario.heat.cells.reduce((best, cell) => (cell.heat > best.heat ? cell : best), normalScenario.heat.cells[0]);
if (maxHeatCell.heat > 1e-6) {
  const nearestTraceDistance = normalScenario.focusTrace.reduce((best, point) => {
    const dx = point.x - maxHeatCell.x;
    const dy = point.y - maxHeatCell.y;
    return Math.min(best, Math.sqrt(dx * dx + dy * dy));
  }, Number.POSITIVE_INFINITY);
  assert(nearestTraceDistance < 4.2, 'Hottest cell should stay close to the focus trajectory');
}

const pointInspection = Sim.inspectHeatPoint(prepared, normalScenario, { x: normalScenario.focusAgent.position.x, y: normalScenario.focusAgent.position.y });
assert(pointInspection, 'Heat inspection should work on walkable points');
assert(typeof pointInspection.pressure === 'number', 'Heat inspection should expose pressure');
assert(typeof pointInspection.fatigue === 'number', 'Heat inspection should expose fatigue');

const agentInspection = Sim.inspectAgent(prepared, normalScenario, normalScenario.focusAgentId);
assert(agentInspection, 'Focus agent inspection should succeed');
assert(agentInspection.routeId === normalScenario.focusRoute.id, 'Focus agent inspection should report focus route id');
assert(agentInspection.isFocusAgent === true, 'Focus agent inspection should identify focus agent');
assert(Array.isArray(agentInspection.topPressureSources), 'Focus agent inspection should expose current-position top pressure sources');
assert(agentInspection.topPressureSources.length <= 3, 'Current-position top pressure sources should be limited to top 3');

const peakScenario = Sim.createScenario(prepared, {
  crowdPresetId: 'peak',
  startPoint: { x: customStartCell.x + 1, y: customStartCell.y + 1 },
  targetRegionId: targetRegion.id,
  focusProfile: {
    capacityScores: {
      locomotor: 2,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 2,
    },
  },
  seed: 23,
});

assert(peakScenario.agents.length === 123, 'Peak scenario should create 123 agents');
assert(peakScenario.backgroundAgents.length === 122, 'Peak scenario should create 122 background agents');

let maxContinuousJump = 0;
let outOfBoundsCount = 0;
let focusMaxBackstep = 0;
const previousActivePositions = new Map();

for (let frame = 0; frame < 120; frame += 1) {
  Sim.stepScenario(prepared, peakScenario, 0.1);
  const activeAgents = peakScenario.agents.filter((agent) => agent.active);
  const activeIds = new Set(activeAgents.map((agent) => agent.id));
  Array.from(previousActivePositions.keys()).forEach((id) => {
    if (!activeIds.has(id)) {
      previousActivePositions.delete(id);
    }
  });
  activeAgents.forEach((agent) => {
    if (!Sim.isWalkablePoint(prepared, agent.position)) {
      outOfBoundsCount += 1;
    }
    const previous = previousActivePositions.get(agent.id);
    if (previous) {
      const dx = agent.position.x - previous.x;
      const dy = agent.position.y - previous.y;
      maxContinuousJump = Math.max(maxContinuousJump, Math.sqrt(dx * dx + dy * dy));
      if (agent.isFocusAgent) {
        focusMaxBackstep = Math.max(focusMaxBackstep, Math.max(0, previous.progressDist - agent.progressDist));
      }
    }
    previousActivePositions.set(agent.id, { x: agent.position.x, y: agent.position.y, progressDist: agent.progressDist });
  });
}

assert(outOfBoundsCount === 0, `Expected active agents to stay inside walkable area, got ${outOfBoundsCount} out-of-bounds samples`);
assert(maxContinuousJump <= 1.7, `Expected active agents to move smoothly, got ${maxContinuousJump.toFixed(3)}m jump`);
assert(focusMaxBackstep <= 0.05, `Expected focus agent progress to stay near-monotonic, got ${focusMaxBackstep.toFixed(3)}m backstep`);

console.log('Scenario validation passed');
console.log({
  odRoutes: prepared.odRoutes.length,
  healthyAgents: prepared.healthyAgentPool.length,
  normalAgents: normalScenario.agents.length,
  peakAgents: peakScenario.agents.length,
  maxContinuousJump: Number(maxContinuousJump.toFixed(3)),
  focusMaxBackstep: Number(focusMaxBackstep.toFixed(3)),
  outOfBoundsCount,
  hottestCellHeat: Number(maxHeatCell.heat.toFixed(1)),
  hotspots: normalScenario.hotspots.map((item) => item.id),
});
