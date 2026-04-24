const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const metadataStartIndex = appJs.indexOf('const AGENT_PREVIEW_POSE_METADATA = Object.freeze({');
assert(metadataStartIndex !== -1, 'Expected Section 02 pose metadata definition to exist');
const metadataJs = appJs.slice(metadataStartIndex);

function getScoreBlock(score) {
  const startToken = `\n    ${score}: Object.freeze({`;
  const startIndex = metadataJs.indexOf(startToken);
  assert(startIndex !== -1, `Expected to find Section 02 pose metadata block for score ${score}`);
  const nextScore = score + 1;
  const endToken = `\n    ${nextScore}: Object.freeze({`;
  const endIndex = metadataJs.indexOf(endToken, startIndex + startToken.length);
  return endIndex === -1 ? metadataJs.slice(startIndex) : metadataJs.slice(startIndex, endIndex);
}

function assertContains(text, pattern, message) {
  assert(pattern.test(text), message);
}

function assertNotContains(text, pattern, message) {
  assert(!pattern.test(text), message);
}

assert(
  /regionFragmentSeeds:\s*Object\.freeze\(\{[\s\S]*psychological:[\s\S]*vitality:/m.test(appJs),
  'Expected Section 02 pose metadata to support fragment seeds for psychological and vitality regions where the reference artwork splits into small extra components'
);

assert(
  /function expandAgentPreviewRegionComponentsWithFragmentSeeds\(/.test(appJs),
  'Expected a shared helper to append fragment-seed components onto the base fixed region selection'
);

assert(
  /metadata\?\.regionFragmentSeeds\?\.\[dimensionId\]/.test(appJs),
  'Expected region selection to read optional fragment seeds per dimension'
);

const score2Block = getScoreBlock(2);
const score3Block = getScoreBlock(3);
const score4Block = getScoreBlock(4);
const score5Block = getScoreBlock(5);
const score1Block = getScoreBlock(1);

assertContains(
  score1Block,
  /vitality:\s*createAgentPreviewRegionSeedGroup\(\[\[\s*313,\s*278\s*\]\]\)/,
  'Expected score 1 vitality fragment seeds to include the coat pocket fragment'
);

assertContains(
  score2Block,
  /psychological:\s*createAgentPreviewRegionSeedGroup\(\[\[287,\s*197\]\]\)/,
  'Expected score 2 psychological fragment seeds to include the missing chest fragment'
);

assertContains(
  score2Block,
  /vitality:\s*createAgentPreviewRegionSeedGroup\(\[\[\s*274,\s*304\s*\],\s*\[\s*263,\s*342\s*\]\]\)/,
  'Expected score 2 vitality fragment seeds to include the coat pocket fragments'
);

assertContains(
  score3Block,
  /vitality:\s*createAgentPreviewRegionSeedGroup\(\[\[133,\s*361\],\s*\[143,\s*359\],\s*\[222,\s*330\],\s*\[274,\s*300\]\]\)/,
  'Expected score 3 vitality fragment seeds to include the coat hem, pocket, and abdomen fragments'
);

assertContains(
  score4Block,
  /vitality:\s*createAgentPreviewRegionSeedGroup\(\[\[113,\s*358\],\s*\[123,\s*360\],\s*\[201,\s*329\],\s*\[255,\s*300\]\]\)/,
  'Expected score 4 vitality fragment seeds to include the coat hem, pocket, and abdomen fragments'
);

assertContains(
  score5Block,
  /psychological:\s*createAgentPreviewRegionSeedGroup\(\[\[294,\s*244\],\s*\[211,\s*248\]\]\)/,
  'Expected score 5 psychological fragment seeds to include the missing heart fragment without spilling into the abdomen'
);

assertContains(
  score5Block,
  /vitality:\s*createAgentPreviewRegionSeedGroup\(\[\[166,\s*362\],\s*\[249,\s*313\],\s*\[309,\s*295\]\]\)/,
  'Expected score 5 vitality fragment seeds to include the coat hem, pocket, and abdomen fragments'
);

assertContains(
  stylesCss,
  /\.settings-agent-preview__region-fill\s*\{[\s\S]*opacity:\s*0\.5/m,
  'Expected Section 02 region fill opacity to be reduced to 50%'
);

console.log('validate_section02_fragment_seed_groups: ok');
