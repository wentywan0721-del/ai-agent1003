const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /detailCotTitle:\s*'代理人决策链'/.test(appJs)
  && /detailCotTitle:\s*'Agent Decision Chain'/.test(appJs),
  'Expected Section04 decision-chain title copy to be updated for zh/en locale switching'
);

assert(
  /function buildVisualizationDetailCotMetaMarkup\(activeView, locale = state\.locale\)[\s\S]*Current Mode[\s\S]*API Status/.test(appJs)
  && /function buildVisualizationDetailCotMarkup\(\)[\s\S]*buildVisualizationDetailCotMetaMarkup\(activeView, locale\)/.test(appJs),
  'Expected Section04 decision-chain header to include Current Mode and API Status meta rows'
);

assert(
  /function buildVisualizationDetailCotMarkup\(\)[\s\S]*visualization-detail__report-title visualization-detail__report-title--icon[\s\S]*getVisualizationDetailIcon\('brain'\)/.test(appJs)
  && /function buildVisualizationDetailIssuesMarkup\(\)[\s\S]*visualization-detail__report-title visualization-detail__report-title--icon[\s\S]*getVisualizationDetailIcon\('suggestion'\)/.test(appJs),
  'Expected Section04 right-panel titles to keep the brain and lightbulb icons'
);

assert(
  /\.visualization-detail__report-meta\s*\{/.test(stylesCss)
  && /\.visualization-detail__report-meta-column\s*\{/.test(stylesCss),
  'Expected Section04 decision-chain header meta rows to have dedicated styling'
);

console.log('validate_section04_decision_chain_meta_and_titles: ok');
