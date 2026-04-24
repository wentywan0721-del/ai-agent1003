const assert = require('assert');
const fs = require('fs');
const path = require('path');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  /\.visualization-detail__report\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;[\s\S]*overflow:\s*hidden;/.test(stylesCss)
  && /\.visualization-detail__report-content\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;[\s\S]*overflow:\s*auto;/.test(stylesCss)
  && /<div class="visualization-detail__report-content">[\s\S]*id="visualization-detail-cot"[\s\S]*id="visualization-detail-issues"[\s\S]*id="visualization-detail-export-report-btn"/.test(indexHtml),
  'Expected Section 04 right report panel to use a dedicated scrollable content container so sections do not overlap and the export button stays in the same scroll flow'
);

assert(
  /\.visualization-detail__report-content\s*\{[\s\S]*padding-right:\s*6px;[\s\S]*margin-right:\s*-6px;[\s\S]*scrollbar-gutter:\s*stable both-edges;/.test(stylesCss)
  && /\.visualization-detail__report-title\s*\{[\s\S]*white-space:\s*nowrap;[\s\S]*overflow:\s*hidden;[\s\S]*text-overflow:\s*ellipsis;/.test(stylesCss)
  && /\.visualization-detail__report-title--icon[\s\S]*gap:\s*6px;/.test(stylesCss)
  && /\.visualization-detail__report-title--icon[\s\S]*min-width:\s*0;/.test(stylesCss)
  && /\.visualization-detail__report-title--icon svg[\s\S]*width:\s*16px;[\s\S]*height:\s*16px;/.test(stylesCss),
  'Expected Section 04 right report titles to stay on one line and the scrollbar gutter to shift outward'
);

assert(
  /\.visualization-detail__report-block--cot\s*\{[\s\S]*padding-bottom:\s*15px;/.test(stylesCss)
  && /\.visualization-detail__report-block--issues\s*\{[\s\S]*margin-top:\s*15px;[\s\S]*padding-top:\s*15px;/.test(stylesCss)
  && /\.visualization-detail__report-block--issues::before\s*\{[\s\S]*left:\s*0;[\s\S]*right:\s*0;/.test(stylesCss)
  && /\.visualization-detail__export\s*\{[\s\S]*margin:\s*15px 0 0;[\s\S]*margin-top:\s*auto;/.test(stylesCss),
  'Expected Section 04 export button to stay at the panel bottom when no scroll is needed and flow to the bottom of the scroll content when it is needed'
);

assert(
  /function buildVisualizationDetailCotMarkup\(\)[\s\S]*data-call-route-analysis="true"/.test(appJs)
  && !/function buildVisualizationDetailCotMarkup\(\)[\s\S]*visualization-detail__cot-placeholder/.test(appJs),
  'Expected Section 04 Chain-of-Thought panel to render a direct manual trigger button without the extra placeholder copy block'
);

console.log('validate_visualization_detail_report_layout: ok');
