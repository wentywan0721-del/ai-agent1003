const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /const HEAT_RASTER_SUPERSAMPLE = 4;/.test(appJs),
  'Expected heatmap rendering to define a supersampled raster scale for smoother edges'
);

assert(
  /raster\.width = grid\.cols \* HEAT_RASTER_SUPERSAMPLE;/.test(appJs)
  && /raster\.height = grid\.rows \* HEAT_RASTER_SUPERSAMPLE;/.test(appJs),
  'Expected heatmap raster dimensions to use the supersample scale'
);

assert(
  /ctx\.imageSmoothingQuality = 'high';/.test(appJs),
  'Expected heatmap canvas rendering to request high image smoothing quality'
);

console.log('validate_heatmap_smooth_raster_render: ok');
