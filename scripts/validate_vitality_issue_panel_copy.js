const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const inspectorUtilsJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'inspector-utils.js'), 'utf8');

assert(
  /function buildVisualizationDetailIssuesMarkup\(\) \{[\s\S]*const vitalityStatusItem = activeView === 'vitality' \? issueItems\.find\(\(item\) => item\.isStatusCard\) \|\| null : null;[\s\S]*issueItems\.filter\(\(item\) => !item\.isStatusCard\)\.slice\(0,\s*3\)/.test(appJs),
  'Expected vitality detail view to keep one status card plus Top 3 issue cards'
);

assert(
  /function buildVisualizationDetailVitalityIssueCardMarkup\(item, options = \{\}\) \{[\s\S]*const bodyLabel = isStatusCard\s*\?\s*''\s*:\s*\(locale === 'en' \? 'Issue' :/.test(appJs),
  'Expected vitality status cards to remove the extra status label row'
);

assert(
  appJs.includes("class=\"visualization-detail__issue-impact-label\">${escapeHtml(impactLabel)}</span>")
    && appJs.includes("class=\"visualization-detail__issue-impact-level is-${escapeHtml(impactState.tone)}\">${escapeHtml(impactState.label)}</span>")
    && !/Math\.round\(impactState\.score\) \+ '\/100'/.test(appJs),
  'Expected vitality issue impact to render text-only levels without numeric values'
);

assert(
  appJs.includes("label: locale === 'en' ? 'Elevated' : '较高'")
    && appJs.includes("label: locale === 'en' ? 'High' : '高'")
    && appJs.includes("label: locale === 'en' ? 'Medium' : '中'")
    && appJs.includes("label: locale === 'en' ? 'Low' : '低'"),
  'Expected vitality impact levels to use 低 / 中 / 较高 / 高'
);

assert(
  inspectorUtilsJs.includes('\\u5efa\\u8bae\\u7ee7\\u7eed\\u901a\\u884c\\u3002')
    && inspectorUtilsJs.includes("name: localize(locale, '\\u75b2\\u52b3\\u72b6\\u6001', 'Fatigue Status')"),
  'Expected vitality status card default advice to recommend continuing the trip when not resting'
);

console.log('validate_vitality_issue_panel_copy: ok');
