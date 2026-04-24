const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  appJs.includes('function localizeRouteAnalysisOutput(')
    && appJs.includes('localizeRouteAnalysisOutput(routeAnalysisState.result, locale)')
    && appJs.includes('localizeRouteAnalysisOutput(routeAnalysisState.result, state.locale)'),
  'Expected Section 04 and report rendering to localize stored LLM output per current UI language'
);

assert(
  serverJs.includes('summary_zh')
    && serverJs.includes('summary_en')
    && serverJs.includes('title_zh')
    && serverJs.includes('title_en')
    && serverJs.includes('bullets_zh')
    && serverJs.includes('bullets_en'),
  'Expected the local LLM route-analysis schema and normalization to request and keep bilingual content'
);

assert(
  /\.visualization-detail__subheading\s*\{[\s\S]*font-size:\s*14px;[\s\S]*color:\s*hsl\(210 20% 92%\);/.test(stylesCss)
    && /\.visualization-detail__report-copy[\s\S]*color:\s*rgba\(216, 225, 236, 0\.72\);/.test(stylesCss)
    && /\.visualization-detail__bullet-list[\s\S]*color:\s*rgba\(216, 225, 236, 0\.72\);/.test(stylesCss),
  'Expected Section 04 LLM section subtitles to stay white while the body copy and bullets use the grey text style'
);

console.log('validate_llm_analysis_localization: ok');
