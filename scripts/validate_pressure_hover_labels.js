const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  appJs.includes('function getPressurePointHoverDisplayLabel(item)'),
  'Expected a dedicated hover-label formatter that shows pressure point names and metric values together'
);

assert(
  appJs.includes('function buildVisualizationHoverTooltip('),
  'Expected a shared hover tooltip builder for node and pressure labels'
);

assert(
  !appJs.includes('<title>${escapeHtml(getPressurePointHoverDisplayLabel(hotspotItem))}</title>'),
  'Expected pressure hover rendering to stop using native browser SVG title tooltips'
);

assert(
  !appJs.includes('<title>${escapeHtml(label)}</title>'),
  'Expected node hover rendering to stop using native browser SVG title tooltips'
);

assert(
  appJs.includes('visualization-hover-tooltip'),
  'Expected node and pressure hover labels to share the same tooltip markup'
);

assert(
  appJs.includes('getPressurePointHoverDisplayLabel(hotspotItem)'),
  'Expected pressure tooltip content to remain localized through the existing formatter'
);

assert(
  appJs.includes('font-size="${fontSize}"'),
  'Expected hover tooltip text size to use the same computed scale as the tooltip box'
);

assert(
  appJs.includes('estimateVisualizationHoverTooltipEmWidth(safeLabel) * fontSize * 0.94 + paddingX * 2'),
  'Expected tooltip width calculation to fit label length more closely'
);

assert(
  !appJs.includes('worldRadiusForPixels(44, transform)'),
  'Expected hover tooltip width calculation to stop forcing an oversized fixed minimum width'
);

assert(
  appJs.includes('const cornerRadius = worldRadiusForPixels(3, transform);'),
  'Expected hover tooltip to use a smaller corner radius'
);

assert(
  stylesCss.includes('.visualization-hover-tooltip__backplate')
    && stylesCss.includes('fill: rgba(39, 43, 48, 0.96);')
    && stylesCss.includes('stroke: rgba(255, 255, 255, 0.94);')
    && stylesCss.includes('stroke-width: 0.5px;'),
  'Expected shared hover tooltip styling to use a dark backplate with a white outline'
);

assert(
  stylesCss.includes('.visualization-hover-tooltip__text')
    && stylesCss.includes('fill: rgba(255, 255, 255, 0.98);')
    && stylesCss.includes('font-weight: 400;'),
  'Expected shared hover tooltip text to use the same white label styling'
);

assert(
  stylesCss.includes('.route-node-label')
    && stylesCss.includes('paint-order: stroke fill;')
    && stylesCss.includes('stroke: rgba(255, 255, 255, 0.98);')
    && stylesCss.includes('stroke-width: 0.22px;'),
  'Expected Section 01 overlay node labels to use thin white outlines with black text'
);

assert(
  stylesCss.includes('.route-modal-node-label')
    && stylesCss.includes('stroke: rgba(255, 255, 255, 0.98);')
    && stylesCss.includes('stroke-width: 0.22px;'),
  'Expected Section 01 route modal node labels to use thin white outlines with black text'
);

console.log('validate_pressure_hover_labels: ok');
