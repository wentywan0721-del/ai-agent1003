const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const inspectorUtils = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');

assert(
  /locomotorTag:\s*'Locomotor'/.test(appJs)
  && /locomotorTitle:\s*'Locomotor Burden Heatmap'/.test(appJs)
  && /sensoryTag:\s*'Sensory'/.test(appJs)
  && /sensoryCopy:\s*'Sensory burden from lighting, noise, visibility range, and sign recognition conditions\.'/.test(appJs)
  && /cognitiveTag:\s*'Decision'/.test(appJs)
  && /cognitiveTitle:\s*'Decision Burden Heatmap'/.test(appJs)
  && /vitalityTag:\s*'Fatigue'/.test(appJs)
  && /vitalityTitle:\s*'Fatigue Burden Heatmap'/.test(appJs),
  'Expected app labels to use Locomotor, Sensory, Decision, and Fatigue naming'
);

assert(
  /titleEn:\s*'Locomotor Burden Legend'/.test(appJs)
  && /noteEn:\s*'Muted pale blue to deep blue separates low and high locomotor resistance clearly\.'/.test(appJs)
  && /locomotor:\s*'Locomotor Burden'/.test(appJs)
  && /locomotor:\s*'Locomotor Capacity'/.test(appJs)
  && /cognitive:\s*'Cognitive Capacity'/.test(appJs)
  && /vitality:\s*'Vitality Capacity'/.test(appJs)
  && /cognitive:\s*'Cognitive'/.test(appJs)
  && /vitality:\s*'Vitality'/.test(appJs)
  && /cognitive:\s*'Decision Burden'/.test(appJs)
  && /vitality:\s*'Fatigue Burden'/.test(appJs)
  && /speed:\s*'Base Locomotor Limit'/.test(appJs),
  'Expected English capacity labels to stay Cognitive and Vitality while burden labels stay Decision and Fatigue'
);

assert(
  /Mobility Burden Heatmap/.test(indexHtml) === false
  && /Cognitive Burden Heatmap/.test(indexHtml) === false
  && /Vitality Burden Heatmap/.test(indexHtml) === false
  && /Perception burden from lighting, noise, visibility range, and sign recognition conditions\./.test(indexHtml) === false
  && /Locomotor Burden Heatmap/.test(indexHtml)
  && /Decision Burden Heatmap/.test(indexHtml)
  && /Fatigue Burden Heatmap/.test(indexHtml)
  && /Sensory burden from lighting, noise, visibility range, and sign recognition conditions\./.test(indexHtml),
  'Expected index.html fallback heatmap names and copy to match the renamed burden views'
);

assert(
  /'Mobility'/.test(inspectorUtils) === false
  && /Perception/.test(inspectorUtils) === false
  && /'Locomotor'/.test(inspectorUtils)
  && /'Noise Disrupts Sensory'/.test(inspectorUtils),
  'Expected user-facing inspector labels to replace Mobility/Perception with Locomotor/Sensory'
);

console.log('validate_visualization_labels: ok');
