const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getSettingsAgentPreviewFigureImageUrl\(dimensionScores\)\s*\{[\s\S]*if \(state\.agentModal\.previewPoseDataUrl && state\.agentModal\.previewPoseCacheKey === cacheKey\)\s*\{[\s\S]*return state\.agentModal\.previewPoseDataUrl;[\s\S]*\}/.test(appJs),
  'Expected Section 02 to reuse the previous preview image only when it belongs to the same score combination, so stale poses and colors do not leak into a new radar state'
);

console.log('validate_agent_visual_preview_stale_pose_fallback: ok');
