const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function sanitizeTimelineDisplayText\(text = '', item = \{\}\)/.test(appJs),
  'Expected Section04 timeline rendering to sanitize cached timeline text before display'
);
assert(
  /左手边\|右手边\|左侧\|右侧\|左边\|右边/.test(appJs),
  'Expected Section04 display sanitizer to neutralize unverified Chinese left/right wording'
);
assert(
  /\\bon\\s\+the\\s\+\(left\|right\)\\b/.test(appJs) || /left\|right/.test(appJs),
  'Expected Section04 display sanitizer to neutralize unverified English left/right wording'
);
assert(
  /isRestTimelineDisplayItem\(item\)/.test(appJs),
  'Expected rest wording to be preserved only for real rest timeline items'
);
assert(
  /sanitizeTimelineDisplayText\(item\.localizedThought \|\| '', item\)/.test(appJs),
  'Expected timeline copy rendering to use sanitized display text'
);

console.log('validate_section04_timeline_display_text_sanitization: ok');
