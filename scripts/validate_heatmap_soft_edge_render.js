const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const startIndex = source.indexOf(signature);
  if (startIndex < 0) {
    throw new Error(`Expected ${name} to exist`);
  }
  const braceStart = source.indexOf('{', startIndex);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`Failed to parse ${name}`);
}

const createHeatFieldRasterBody = extractFunctionBody(appJs, 'createHeatFieldRaster');

assert(
  /const HEAT_RASTER_SUPERSAMPLE = 4;/.test(appJs),
  'Expected the heat raster supersample scale to be increased for smoother edges'
);

assert(
  createHeatFieldRasterBody.includes('const image = rasterCtx.createImageData(pixelWidth, pixelHeight);')
  && createHeatFieldRasterBody.includes('rasterCtx.putImageData(image, 0, 0);')
  && !createHeatFieldRasterBody.includes('createRadialGradient('),
  'Expected raster-field heatmaps to render from a crisp image buffer instead of gradient blur layers'
);

assert(
  !/paintHeatFieldKernels\(ctx, finalHeatCells, transform, localMetricMin, localMetricMax\);/.test(appJs),
  'Expected raster-field heatmaps to avoid the kernel overlay that causes grainy hotspots'
);

console.log('validate_heatmap_soft_edge_render: ok');
