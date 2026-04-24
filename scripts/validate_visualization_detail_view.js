const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /id="visualization-overview"/.test(html),
  'Expected the visualization page to expose a dedicated overview container'
);

assert(
  /id="visualization-detail"/.test(html)
  && /id="visualization-detail-summary"/.test(html)
  && /id="visualization-detail-report"/.test(html)
  && /id="visualization-detail-stage"/.test(html),
  'Expected the detail page to include the three main sections for summary, report, and single-view heatmap'
);

assert(
  !/id="visualization-detail-environment"/.test(html)
  && /id="visualization-detail-status"/.test(html)
  && /id="visualization-detail-radar"/.test(html)
  && /id="visualization-detail-feedback"/.test(html)
  && /id="visualization-detail-layer-select"/.test(html),
  'Expected the detail summary strip to expose only status, radar, and burden feedback containers'
);

assert(
  /data-i18n="visualization\.detailRadarTitle">[\s\S]*?<\/h3>[\s\S]*?id="visualization-detail-radar"[\s\S]*?data-i18n="visualization\.detailStatusTitle">[\s\S]*?<\/h3>[\s\S]*?id="visualization-detail-status"[\s\S]*?data-i18n="visualization\.detailFeedbackTitle">[\s\S]*?<\/h3>[\s\S]*?id="visualization-detail-feedback"/.test(html),
  'Expected the detail summary strip order to be radar, status, then burden feedback'
);

assert(
  /id="visualization-detail-cot"/.test(html)
  && /id="visualization-detail-issues"/.test(html)
  && /id="visualization-detail-export-report-btn"/.test(html),
  'Expected the detail report column to include chain-of-thought, issue suggestions, and export actions'
);

assert(
  /id="visualization-detail-view-select"/.test(html),
  'Expected the single-view detail panel to include a dedicated view select dropdown'
);

assert(
  /id="visualization-detail-stage-metrics"/.test(html)
  && /id="visualization-detail-stage-legend"/.test(html),
  'Expected the detail stage header to expose dedicated environment metrics and legend containers'
);

assert(
  !/id="visualization-detail-stage-min"/.test(html)
  && !/id="visualization-detail-stage-max"/.test(html),
  'Expected the single-view detail stage to remove the inline min/max labels'
);

assert(
  /id="visualization-shell-eyebrow"/.test(html)
  && /id="visualization-shell-title"/.test(html),
  'Expected the visualization shell header to expose dedicated nodes for Section 03 and Section 04 copy switching'
);

assert(
  /role="button"/.test(html)
  && /tabindex="0"/.test(html),
  'Expected overview cards to be keyboard-focusable interactive entries'
);

assert(
  /visualizationDetailView:\s*null/.test(appJs),
  'Expected app state to track whether a single visualization detail view is open'
);

assert(
  /visualizationDetailLayerCategories:\s*\[\]/.test(appJs),
  'Expected Section 04 to track a dedicated multi-select layer state'
);

assert(
  /function openVisualizationDetailView\(/.test(appJs)
  && /function closeVisualizationDetailView\(/.test(appJs)
  && /function renderVisualizationDetailView\(/.test(appJs),
  'Expected app.js to define open, close, and render helpers for the visualization detail page'
);

assert(
  /elements\.visualizationCards\.forEach\(\(item\)\s*=>\s*\{[\s\S]*item\.card\.addEventListener\('click', handleVisualizationCardActivate\)/.test(appJs)
  || /function handleVisualizationCardActivate\(/.test(appJs),
  'Expected overview cards to open the detail page when activated'
);

assert(
  /elements\.visualizationDetailOverlay\.addEventListener\('pointerdown', handleOverlayPointerDown\)/.test(appJs)
  && /elements\.visualizationDetailOverlay\.addEventListener\('click', handleOverlayClick\)/.test(appJs),
  'Expected the detail overlay to reuse the same focus-agent interaction bindings as the main workspace overlay'
);

assert(
  /function screenToWorld\(clientX, clientY, transform = state\.transform, referenceElement = elements\.overlayLayer\)/.test(appJs),
  'Expected screenToWorld to accept a reference overlay so detail-view clicks map to the correct viewport'
);

assert(
  /function findInteractiveTarget\(target, root = elements\.overlayLayer\)/.test(appJs),
  'Expected interactive target lookup to support both the main overlay and the detail overlay roots'
);

assert(
  /detailSection:\s*'Section 04'/.test(appJs)
  && /detailTitle:\s*'Detailed View Diagnosis'/.test(appJs),
  'Expected the shell header copy to switch from Section 03 to Section 04 when the detail view is open'
);

assert(
  /detailRadarTitle:\s*'Agent Attribute'/.test(appJs)
  && /detailStatusTitle:\s*'Agent Status'/.test(appJs)
  && /detailFeedbackTitle:\s*'Real-time Burden'/.test(appJs),
  'Expected visualization copy to rename the detail-side modules to Agent Attribute, Agent Status, and Real-time Burden'
);

assert(
  /const radarProfile = getVisualizationAgentProfile\(\);[\s\S]*buildAgentRadarSvg\(radarProfile,\s*state\.locale,\s*isDetailTarget\s*\?[\s\S]*getLabel:\s*getDimensionDisplayName/.test(appJs),
  'Expected the detail radar to reuse the same live draft source as the Section 01 radar'
);

assert(
  /const colorRgb = samplePaletteRgb\(clamp\(value \/ 100,\s*0,\s*1\),\s*HEATMAP_VIEW_STYLES\.composite\.colorStops\);/.test(appJs)
  && /background-color:\$\{escapeHtml\(rgbToCss\(colorRgb\)\)\}/.test(appJs),
  'Expected Real-time Burden bars to use fixed 0-100 mapping with a single composite-palette color per bar'
);

assert(
  /visualization\.minBurden/.test(appJs)
  && /visualization\.maxBurden/.test(appJs)
  && /const entries = isDetailTarget[\s\S]*\?\s*\[[\s\S]*label: t\('visualization\.minBurden'\)[\s\S]*label: t\('visualization\.maxBurden'\)/.test(appJs),
  'Expected Agent Status to prepend min/max burden entries before the live agent metrics'
);

assert(
  /function renderVisualizationDetailLayerSelect\(/.test(appJs)
  && /function handleVisualizationDetailLayerTrigger\(/.test(appJs)
  && /function handleVisualizationDetailLayerOption\(/.test(appJs)
  && /function handleVisualizationDetailLayerPointerMove\(/.test(appJs)
  && /state\.visualizationDetailLayerCategories = Array\.from\(activeCategoryIds\);/.test(appJs),
  'Expected Pressure Point Layer to expose a custom dropdown with persistent multi-select layer rows'
);

assert(
  /function renderVisualizationDetailStageMetrics\(/.test(appJs)
  && /function renderVisualizationDetailStageLegend\(/.test(appJs)
  && /renderVisualizationDetailStageMetrics\(elements\.visualizationDetailStageMetrics\)/.test(appJs)
  && /renderVisualizationDetailStageLegend\(activeView,\s*elements\.visualizationDetailStageLegend\)/.test(appJs),
  'Expected Section 04 center header to render dedicated environment metrics and heat legend blocks'
);

assert(
  /renderVisualizationStage\(activeView,\s*\{[\s\S]*min:\s*null,\s*max:\s*null/.test(appJs),
  'Expected the detail stage renderer to stop wiring min/max labels into the center heatmap panel'
);

assert(
  /\.visualization-card\s*\{[\s\S]*cursor:\s*pointer\s*;/.test(css)
  && /\.visualization-card:hover,\s*[\s\S]*\.visualization-card\.is-active/.test(css),
  'Expected visualization cards to reuse the same hover/selected motion language as the five-dimension explanation cards'
);

assert(
  /\.visualization-detail/.test(css)
  && /\.visualization-detail__panel/.test(css)
  && /\.visualization-detail__view-select/.test(css)
  && /\.visualization-detail__stage-metrics/.test(css)
  && /\.visualization-detail__stage-legend/.test(css),
  'Expected styles.css to define the single-view detail layout and dropdown styling'
);

assert(
  /\.visualization-detail__panel\s*\{[\s\S]*grid-template-columns:\s*minmax\(228px,\s*0\.72fr\)\s*minmax\(0,\s*2\.16fr\)\s*minmax\(228px,\s*0\.72fr\)[\s\S]*grid-template-areas:\s*"summary stage report"/.test(css),
  'Expected the detail page to be laid out as left summary, center stage, and right report columns'
);

assert(
  /\.visualization-detail__summary\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]*grid-template-rows:\s*repeat\(3,\s*minmax\(0,\s*auto\)\)/.test(css)
  && /\.visualization-detail__stage-panel \.visualization-stage-overlay,\s*#visualization-detail-overlay\s*\{[\s\S]*pointer-events:\s*auto/.test(css),
  'Expected the left summary column to stack three blocks vertically and the detail overlay to allow pointer interaction'
);

assert(
  /\.visualization-burden-row__fill\s*\{[\s\S]*background:\s*var\(--burden-fill,\s*#31d17d\)/.test(css),
  'Expected Real-time Burden fills to use a single resolved color instead of a left-to-right gradient'
);

assert(
  /\.visualization-detail__layer-menu/.test(css)
  && /\.visualization-detail__status\s+\.visualization-status-card\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/.test(css),
  'Expected Section 04 to style the layer dropdown menu and the status cards as left-label right-value pairs'
);

assert(
  /\.visualization-detail__layer-label\s*\{[\s\S]*font-size:\s*14px[\s\S]*font-weight:\s*700/.test(css)
  && /\.visualization-detail__view-select,\s*[\s\S]*border:\s*1px solid rgba\(56,\s*210,\s*235,\s*0\.42\)[\s\S]*border-radius:\s*10px/.test(css)
  && /\.visualization-detail__layer-option\.is-active\s*\{[\s\S]*background:\s*rgba\(56,\s*210,\s*235,\s*0\.14\)/.test(css),
  'Expected the detail view selector and Pressure Point Layer selected row state to align with the blue framed selector style'
);

assert(
  /\.visualization-detail__radar \.agent-radar-label\s*\{[\s\S]*fill:\s*rgba\(223,\s*236,\s*242,\s*0\.64\)[\s\S]*font-size:\s*16px[\s\S]*font-weight:\s*400/.test(css)
  && /\.visualization-detail__radar \.agent-radar-score\s*\{[\s\S]*font-size:\s*16px[\s\S]*font-weight:\s*800/.test(css)
  && /\.visualization-detail__status \.visualization-status-card__value\s*\{[\s\S]*color:\s*rgba\(56,\s*210,\s*235,\s*0\.96\)/.test(css)
  && /\.visualization-detail__layer-picker\s*\{[\s\S]*border-top:\s*1px solid rgba\(72,\s*83,\s*101,\s*0\.35\)/.test(css)
  && /\.visualization-detail__summary-block:first-child\s*\{[\s\S]*padding-top:\s*8px[\s\S]*padding-bottom:\s*0/.test(css)
  && /\.visualization-detail__summary-block:nth-child\(2\)\s*\{[\s\S]*padding-top:\s*13px[\s\S]*padding-bottom:\s*6px[\s\S]*row-gap:\s*13px/.test(css)
  && /\.visualization-detail__summary-block:nth-child\(3\)\s*\{[\s\S]*padding-top:\s*13px[\s\S]*row-gap:\s*13px/.test(css)
  && /\.visualization-detail__layer-picker\s*\{[\s\S]*margin-top:\s*6px[\s\S]*margin-left:\s*-16px[\s\S]*margin-right:\s*-16px[\s\S]*padding:\s*13px 16px 0/.test(css)
  && /\.visualization-detail__layer-picker\s*\{[\s\S]*gap:\s*13px/.test(css)
  && /\.visualization-detail__status\s*\{[\s\S]*gap:\s*8px 40px/.test(css)
  && /\.visualization-detail__feedback\s*\{[\s\S]*gap:\s*10px/.test(css)
  && /\.visualization-detail__radar\s*\{[\s\S]*min-height:\s*102px[\s\S]*margin-top:\s*-22px[\s\S]*margin-bottom:\s*-20px/.test(css)
  && /\.visualization-detail__status\s+\.visualization-status-card\s*\{[\s\S]*gap:\s*8px/.test(css),
  'Expected Section 04 to tighten the radar typography and move the Agent Status divider upward'
);

assert(
  /const detailViewRange = getViewMetricRange\(state\.visualizationDetailView \|\| state\.viewMode\);/.test(appJs)
  && /label: t\('visualization\.minBurden'\), value: formatMetricValue\(detailViewRange\.min\)/.test(appJs)
  && /label: t\('visualization\.maxBurden'\), value: formatMetricValue\(detailViewRange\.max\)/.test(appJs),
  'Expected Agent Status min/max to use the active detail heatmap range instead of the live five-dimension snapshot values'
);

assert(
  /\.visualization-detail__section-title,\s*[\s\S]*\.visualization-detail__report-title\s*\{[\s\S]*font-size:\s*14px/.test(css)
  && /\.visualization-detail__stage-title\s*\{[\s\S]*font-size:\s*14px/.test(css)
  && /\.visualization-detail__status \.visualization-status-card__label,\s*[\s\S]*\.visualization-detail__status \.visualization-status-card__value,\s*[\s\S]*\.visualization-detail__feedback \.visualization-burden-row__head\s*\{[\s\S]*font-size:\s*11\.5px/.test(css)
  && /\.visualization-detail__stage-description\s*\{[\s\S]*font-size:\s*11\.5px/.test(css)
  && /\.visualization-detail__report-copy,\s*[\s\S]*\.visualization-detail__issue-copy,\s*[\s\S]*\.visualization-detail__empty,\s*[\s\S]*\.visualization-detail__issue-meta[\s\S]*font-size:\s*11\.5px/.test(css)
  && /\.visualization-detail__timeline-copy\s*\{[\s\S]*font-size:\s*11\.5px/.test(css),
  'Expected Section 04 titles to use 14px and all non-radar small gray/detail text to use 11.5px'
);

assert(
  /\.visualization-detail__feedback \.visualization-burden-row__label\s*\{[\s\S]*color:\s*rgba\(223,\s*236,\s*242,\s*0\.64\)/.test(css)
  && /\.visualization-detail__feedback \.visualization-burden-row__value\s*\{[\s\S]*font-weight:\s*600/.test(css),
  'Expected Real-time Burden labels and values to align with Agent Status typography'
);

console.log('validate_visualization_detail_view: ok');
