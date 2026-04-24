const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appSource.includes('/api/heatmap/jobs'),
  'app should request the local heatmap job API before falling back to browser-side precompute'
);

assert(
  appSource.includes('fetchLocalHeatmapPlayback'),
  'app should include a dedicated local heatmap fetch helper'
);

assert(
  appSource.includes('fetchHeatmapJobResult'),
  'app should poll local heatmap jobs until completion'
);

assert(
  appSource.includes('heatmapSourceInfo'),
  'app should track heatmap source info in state'
);

assert(
  appSource.includes("heatmapSource: '热力图来源'"),
  'app should define localized copy for heatmap source labels'
);

assert(
  appSource.includes("localCache: '本地服务缓存'"),
  'app should expose local cache source feedback'
);

assert(
  appSource.includes("browserFallback: '浏览器回退'"),
  'app should expose browser fallback source feedback'
);

assert(
  appSource.includes("t('label.heatmapSource')"),
  'run summary should render a heatmap source card'
);

assert(
  appSource.includes('setHeatmapSourceInfo('),
  'heatmap run flow should update source info'
);

console.log('validate_heatmap_server_client_bridge: ok');
