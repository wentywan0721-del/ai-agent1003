const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('function buildReportRouteEndpointMarkers(')
    && appJs.includes('report-route-endpoint report-route-endpoint--${kind}')
    && appJs.includes("['start', 'S', endpoints.start]")
    && appJs.includes("['end', 'E', endpoints.end]"),
  'Expected report maps to render plain black S/E route endpoint text markers'
);

assert(
  /function buildReportThoughtMapSnapshot\(reportData[\s\S]*overlaySvg:[\s\S]*buildReportRouteEndpointMarkers\(transform\)[\s\S]*<\/svg>`/.test(appJs),
  'Expected the thought-chain report map overlay to include visible route endpoint markers'
);

assert(
  /function buildReportHeatMapSvg\(viewMode[\s\S]*const overlaySvg =[\s\S]*buildReportRouteEndpointMarkers\(transform\)[\s\S]*<\/svg>`/.test(appJs),
  'Expected report heatmap overlays to include visible route endpoint markers above the heat raster'
);

assert(
  appJs.includes('.report-route-endpoint {')
    && appJs.includes('fill:#111')
    && appJs.includes('font-size:4.8px')
    && !appJs.includes('report-route-endpoint-dot'),
  'Expected route endpoint markers to be black text only and larger than pressure-point numbers'
);

console.log('validate_report_route_endpoint_markers: ok');
