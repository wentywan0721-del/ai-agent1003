const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  /function buildVisualizationDetailCotMarkup\(\)[\s\S]*data-call-route-analysis="true"/.test(appJs)
  && !/function buildVisualizationDetailCotMarkup\(\)[\s\S]*visualization-detail__cot-placeholder/.test(appJs),
  'Expected Section 04 LLM panel to render the trigger button without the extra two-line placeholder copy block'
);

assert(
  /function buildVisualizationDetailCotMarkup\(\)[\s\S]*data-call-route-analysis="true"[\s\S]*data-loading="\$\{isLoading \? 'true' : 'false'\}"/.test(appJs)
  && /function buildVisualizationDetailCotMarkup\(\)[\s\S]*onclick="window.__triggerRouteAnalysis && window.__triggerRouteAnalysis\(event\)"/.test(appJs)
  && !/function buildVisualizationDetailCotMarkup\(\)[\s\S]*\$\{isLoading \? 'disabled' : ''\}/.test(appJs),
  'Expected the Section 04 LLM trigger button to stay hoverable/clickable, expose loading state through data attributes, and include a global click fallback'
);

assert(
  /function buildVisualizationDetailCotMarkup\(\)[\s\S]*const readySummary = canShowSummary && llmAnalysis\??\.placeholder[\s\S]*visualization-detail__llm-summary/.test(appJs),
  'Expected the Section 04 LLM panel to render the returned summary text when the LLM call succeeds, even if structured sections are empty'
);

assert(
  appJs.includes('function bindVisualizationDetailCotTrigger() {')
    && appJs.includes("button.addEventListener('click', handleVisualizationDetailCotClick);")
    && appJs.includes("button.addEventListener('pointerdown', handleVisualizationDetailCotPointerDown);")
    && appJs.includes('window.__triggerRouteAnalysis = (event) => {'),
  'Expected the Section 04 LLM trigger button to receive direct click/pointer bindings after each render plus a global fallback trigger'
);

assert(
  /\.visualization-detail__llm-trigger\s*\{[\s\S]*border:\s*1px solid rgba\(56, 210, 235, 0\.52\);[\s\S]*box-shadow:/.test(stylesCss)
    && /\.visualization-detail__llm-trigger\s*\{[\s\S]*pointer-events:\s*auto;[\s\S]*position:\s*relative;[\s\S]*z-index:\s*2;/.test(stylesCss)
    && /\.visualization-detail__report\s*\{[\s\S]*position:\s*relative;[\s\S]*z-index:\s*8;/.test(stylesCss)
    && /\.visualization-detail__report-content\s*\{[\s\S]*position:\s*relative;[\s\S]*z-index:\s*9;/.test(stylesCss)
    && /\.visualization-detail__stage-panel\s*\{[\s\S]*position:\s*relative;[\s\S]*z-index:\s*1;/.test(stylesCss)
    && /\.visualization-detail__llm-trigger:hover[\s\S]*box-shadow:/.test(stylesCss)
    && /\.visualization-detail__llm-trigger:focus-visible[\s\S]*box-shadow:/.test(stylesCss),
  'Expected the Section 04 LLM trigger button to have a stronger bright-blue idle, hover, and focus effect while the whole report panel stays above the stage panel'
);

assert(
  /\.visualization-detail__llm-trigger\[data-loading="true"\][\s\S]*cursor:\s*progress;/.test(stylesCss),
  'Expected the Section 04 LLM trigger button to expose a visible loading style without losing pointer interaction'
);

assert(
  /\.visualization-detail__llm-summary\s*\{[\s\S]*font-size:\s*11\.5px;[\s\S]*color:\s*rgba\(216, 225, 236, 0\.72\);/.test(stylesCss),
  'Expected the Section 04 LLM summary text block to use the same grey body-copy style as the rest of the panel'
);

assert(
  serverJs.includes('function isMiniMaxCompatibleConfig(config) {')
    && serverJs.includes('const chatCompatibleProvider = getChatCompatibleProviderMeta(config);')
    && serverJs.includes('if (chatCompatibleProvider) {')
    && serverJs.includes('if (isDeepSeekCompatibleConfig(config)) {')
    && /api\\\.minimax\\\.io\\\/v1/.test(serverJs)
    && /api\\\.minimaxi\\\.com\\\/v1/.test(serverJs)
    && serverJs.includes("id: 'minimax'")
    && serverJs.includes("label: 'MiniMax'"),
  'Expected the local LLM proxy service to support MiniMax OpenAI-compatible chat completions'
);

assert(
  /const fallbackSummary = summary \|\|[\s\S]*sections:\s*sections\.length \? sections : \[\{[\s\S]*bullets:\s*\[fallbackSummary\]/.test(serverJs),
  'Expected the local LLM proxy service to synthesize a fallback section from the returned summary when the model omits structured sections'
);

assert(
  /state\.routeAnalysis\s*=\s*\{[\s\S]*status:\s*'loading'[\s\S]*promise:\s*requestPromise[\s\S]*\};[\s\S]*requestRender\(\);[\s\S]*return requestPromise;/.test(appJs),
  'Expected the Section 04 manual LLM trigger to render the loading state immediately after clicking'
);

console.log('validate_route_analysis_provider_switch: ok');
