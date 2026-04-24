const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const sensoryMatch = source.match(/sensory:\s*Object\.freeze\(\{([\s\S]*?)\n\s*\}\),\n\s*cognitive:/);
  assert(sensoryMatch, 'expected sensory heatmap style block in src/app.js');
  const block = sensoryMatch[1];
  const expectedStops = [
    'rgb: [192, 237, 245]',
    'rgb: [139, 223, 237]',
    'rgb: [92, 211, 232]',
    'rgb: [63, 183, 219]',
    'rgb: [41, 139, 200]',
    'rgb: [17, 97, 176]',
  ];
  let previousIndex = -1;
  expectedStops.forEach((token) => {
    const index = block.indexOf(token);
    assert(index >= 0, `expected sensory palette to include ${token}`);
    assert(index > previousIndex, `expected sensory palette stop order to preserve ${token}`);
    previousIndex = index;
  });
  assert(
    block.includes('深色表示更高的感知负担'),
    'expected sensory legend note to state that darker tones mean higher sensory burden'
  );
  assert(
    block.includes('blurScale: 0.24'),
    'expected sensory heatmap blurScale to tighten the raster field'
  );
}

main();
console.log('validate_sensory_heatmap_palette: ok');
