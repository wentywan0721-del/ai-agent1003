const http = require('http');
const path = require('path');
const { randomUUID } = require('crypto');
const { Worker } = require('worker_threads');

const {
  ensureCacheDir,
  buildHeatmapCacheKey,
  readHeatmapCache,
  writeHeatmapCache,
} = require('./heatmap-cache.js');
const {
  buildHeatmapRequestFingerprint,
  runHeatmapDecisionPlanOnly,
  runHeatmapSimulation,
} = require('./heatmap-runner.js');

const EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v25';
const EXPECTED_HEATMAP_ENGINE_VERSION = 'node-cache-v33';
const HEATMAP_SIM_WORKER_PATH = path.join(__dirname, 'heatmap-sim-worker.js');
const HEATMAP_USE_WORKER_THREADS = String(process.env.HEATMAP_USE_WORKER_THREADS || '1') !== '0';

function isCompatibleCachedHeatmapResult(result) {
  if (!result) {
    return false;
  }
  if (result?.meta?.engineVersion !== EXPECTED_HEATMAP_ENGINE_VERSION) {
    return false;
  }
  const llmProvider = getRouteAnalysisProviderConfig();
  if (llmProvider.enabled && (result?.meta?.llmDecisionPlan?.failed || result?.llmDecisionPlan?.failed)) {
    return false;
  }
  const backgroundField = result?.heat?.backgroundField || null;
  if (backgroundField && result?.meta?.backgroundFieldEngineVersion && result.meta.backgroundFieldEngineVersion !== EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION) {
    return false;
  }
  return true;
}

function getRouteAnalysisProviderConfig() {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  const model = String(process.env.OPENAI_MODEL || 'gpt-4.1-mini').trim();
  const baseUrl = String(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  return {
    apiKey,
    model,
    baseUrl,
    enabled: Boolean(apiKey && model),
  };
}

function buildRouteAnalysisSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'sections'],
    properties: {
      summary: { type: 'string' },
      sections: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'bullets'],
          properties: {
            title: { type: 'string' },
            bullets: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: { type: 'string' },
            },
          },
        },
      },
    },
  };
}

function extractResponseText(body) {
  if (typeof body?.output_text === 'string' && body.output_text.trim()) {
    return body.output_text.trim();
  }
  const outputs = Array.isArray(body?.output) ? body.output : [];
  for (const output of outputs) {
    const contents = Array.isArray(output?.content) ? output.content : [];
    for (const item of contents) {
      if (typeof item?.text === 'string' && item.text.trim()) {
        return item.text.trim();
      }
    }
  }
  return '';
}

function extractChatCompletionText(body) {
  return String(body?.choices?.[0]?.message?.content || '').trim();
}

function isDeepSeekCompatibleConfig(config) {
  return /deepseek\.com/i.test(String(config?.baseUrl || '')) || /^deepseek-/i.test(String(config?.model || ''));
}

function isMiniMaxCompatibleConfig(config) {
  return /api\.minimax\.io\/v1/i.test(String(config?.baseUrl || ''))
    || /api\.minimaxi\.com\/v1/i.test(String(config?.baseUrl || ''))
    || /^abab/i.test(String(config?.model || ''))
    || /^minimax/i.test(String(config?.model || ''));
}

function getChatCompatibleProviderMeta(config) {
  if (isDeepSeekCompatibleConfig(config)) {
    return {
      id: 'deepseek',
      label: 'DeepSeek',
      requestLabel: 'DeepSeek',
    };
  }
  if (isMiniMaxCompatibleConfig(config)) {
    return {
      id: 'minimax',
      label: 'MiniMax',
      requestLabel: 'MiniMax',
    };
  }
  return null;
}

function buildRouteAnalysisSystemPrompt(locale = 'zh-CN') {
  if (locale === 'en') {
    return [
      'You generate concise spatial-diagnosis summaries for a metro elderly-travel simulation interface.',
      'Return JSON only.',
      'The JSON must contain exactly two top-level fields: "summary" and "sections".',
      '"summary" must be a short string.',
      '"sections" must be an array of 2 to 4 objects, and each object must contain "title" and "bullets".',
      '"bullets" must be an array of 1 to 4 short strings.',
      'Do not reveal chain-of-thought.',
      'Use short, direct language suitable for a dashboard panel and report reuse.',
      'Focus on risk judgement, likely causes, and spatial recommendations.',
    ].join(' ');
  }
  return [
    '你是地铁站老年出行负担分析助手。',
    '只返回 JSON。',
    'JSON 顶层必须且只能包含 summary 和 sections 两个字段。',
    'summary 必须是一个简短字符串。',
    'sections 必须是 2 到 4 个对象组成的数组，每个对象必须包含 title 和 bullets。',
    'bullets 必须是 1 到 4 条简短字符串。',
    '不要输出思维链原文。',
    '语言要简洁直接，适合页面面板与报告复用。',
    '重点概括路线风险、主要成因和空间优化建议。',
  ].join('');
}

function buildRouteAnalysisUserPrompt(payload = {}, locale = 'zh-CN') {
  const label = locale === 'en'
    ? 'Analyze the following route-analysis input and generate a concise structured summary.'
    : '请分析以下路线诊断输入，并生成简洁的结构化摘要。';
  const schemaHint = locale === 'en'
    ? 'Required JSON shape: {"summary":"...","sections":[{"title":"...","bullets":["..."]}]}.'
    : '必须输出的 JSON 结构：{"summary":"...","sections":[{"title":"...","bullets":["..."]}]。';
  return `${label}\n${schemaHint}\n\n${JSON.stringify(payload, null, 2)}`;
}

function normalizeRouteAnalysisContent(parsed, locale = 'zh-CN') {
  const summary = String(
    parsed?.summary
    || parsed?.overview
    || parsed?.conclusion
    || parsed?.analysis
    || ''
  ).trim();
  const rawSections = Array.isArray(parsed?.sections)
    ? parsed.sections
    : Array.isArray(parsed?.cards)
      ? parsed.cards
      : [];
  const sections = rawSections
    .map((section) => ({
      title: String(section?.title || section?.heading || '').trim(),
      bullets: (Array.isArray(section?.bullets) ? section.bullets : Array.isArray(section?.items) ? section.items : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 4),
    }))
    .filter((section) => section.title && section.bullets.length)
    .slice(0, 4);
  return {
    summary: summary || (locale === 'en' ? 'Structured route analysis is ready.' : '结构化路线分析已生成。'),
    sections,
  };
}

function normalizeRouteAnalysisContent(parsed, locale = 'zh-CN') {
  const summary = String(
    parsed?.summary
    || parsed?.overview
    || parsed?.conclusion
    || parsed?.analysis
    || ''
  ).trim();
  const rawSections = Array.isArray(parsed?.sections)
    ? parsed.sections
    : Array.isArray(parsed?.cards)
      ? parsed.cards
      : [];
  const sections = rawSections
    .map((section) => ({
      title: String(section?.title || section?.heading || '').trim(),
      bullets: (Array.isArray(section?.bullets) ? section.bullets : Array.isArray(section?.items) ? section.items : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 4),
    }))
    .filter((section) => section.title && section.bullets.length)
    .slice(0, 4);
  const fallbackSummary = summary || (locale === 'en' ? 'Structured route analysis is ready.' : '结构化路线分析已生成。');
  return {
    summary: fallbackSummary,
    sections: sections.length ? sections : [{
      title: locale === 'en' ? 'Intelligent Summary' : '智能总结',
      bullets: [fallbackSummary],
    }],
  };
}

function buildRouteAnalysisSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary_zh', 'summary_en', 'sections'],
    properties: {
      summary_zh: { type: 'string' },
      summary_en: { type: 'string' },
      sections: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title_zh', 'title_en', 'bullets_zh', 'bullets_en'],
          properties: {
            title_zh: { type: 'string' },
            title_en: { type: 'string' },
            bullets_zh: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: { type: 'string' },
            },
            bullets_en: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: { type: 'string' },
            },
          },
        },
      },
    },
  };
}

function buildRouteAnalysisSystemPrompt(locale = 'zh-CN') {
  const prompt = [
    locale === 'en'
      ? 'You generate concise spatial-diagnosis summaries for a metro elderly-travel simulation interface.'
      : '你是地铁站老年出行负担分析助手。',
    locale === 'en' ? 'Return JSON only.' : '只返回 JSON。',
    locale === 'en'
      ? 'The JSON must contain exactly three top-level fields: "summary_zh", "summary_en", and "sections".'
      : 'JSON 顶层必须且只能包含 summary_zh、summary_en 和 sections 三个字段。',
    locale === 'en'
      ? '"summary_zh" and "summary_en" must describe the same route judgement in Chinese and English.'
      : 'summary_zh 与 summary_en 必须分别用中文和英文概括同一条路线判断。',
    locale === 'en'
      ? '"sections" must contain 2 to 4 objects with "title_zh", "title_en", "bullets_zh", and "bullets_en".'
      : 'sections 必须是 2 到 4 个对象组成的数组，每个对象必须包含 title_zh、title_en、bullets_zh、bullets_en。',
    locale === 'en'
      ? '"bullets_zh" and "bullets_en" must be 1 to 4 short corresponding bullet strings.'
      : 'bullets_zh 与 bullets_en 必须分别给出 1 到 4 条相互对应的短句。',
    locale === 'en' ? 'Do not reveal chain-of-thought.' : '不要输出思维链原文。',
    locale === 'en'
      ? 'Use short, direct language suitable for a dashboard panel and report reuse.'
      : '语言要简洁直接，适合页面面板与报告复用。',
    locale === 'en'
      ? 'Focus on risk judgement, likely causes, and spatial recommendations.'
      : '重点概括路线风险、主要成因和空间优化建议。',
  ];
  return prompt.join(' ');
}

function buildRouteAnalysisUserPrompt(payload = {}, locale = 'zh-CN') {
  const label = locale === 'en'
    ? 'Analyze the following route-analysis input and generate a concise bilingual structured summary.'
    : '请分析以下路线诊断输入，并生成简洁的双语结构化摘要。';
  const schemaHint = locale === 'en'
    ? 'Required JSON shape: {"summary_zh":"...","summary_en":"...","sections":[{"title_zh":"...","title_en":"...","bullets_zh":["..."],"bullets_en":["..."]}]}.'
    : '必须输出 JSON 结构：{"summary_zh":"...","summary_en":"...","sections":[{"title_zh":"...","title_en":"...","bullets_zh":["..."],"bullets_en":["..."]}]}.';
  return `${label}\n${schemaHint}\n\n${JSON.stringify(payload, null, 2)}`;
}

function normalizeRouteAnalysisContent(parsed, locale = 'zh-CN') {
  const summaryZh = String(parsed?.summary_zh || parsed?.summaryZh || parsed?.summary || parsed?.overview || parsed?.conclusion || parsed?.analysis || '').trim();
  const summaryEn = String(parsed?.summary_en || parsed?.summaryEn || parsed?.summary || parsed?.overview || parsed?.conclusion || parsed?.analysis || '').trim();
  const rawSections = Array.isArray(parsed?.sections)
    ? parsed.sections
    : Array.isArray(parsed?.cards)
      ? parsed.cards
      : [];
  const sections = rawSections
    .map((section) => ({
      titleZh: String(section?.title_zh || section?.titleZh || section?.title || section?.heading || '').trim(),
      titleEn: String(section?.title_en || section?.titleEn || section?.title || section?.heading || '').trim(),
      bulletsZh: (Array.isArray(section?.bullets_zh) ? section.bullets_zh : Array.isArray(section?.bulletsZh) ? section.bulletsZh : Array.isArray(section?.bullets) ? section.bullets : Array.isArray(section?.items) ? section.items : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 4),
      bulletsEn: (Array.isArray(section?.bullets_en) ? section.bullets_en : Array.isArray(section?.bulletsEn) ? section.bulletsEn : Array.isArray(section?.bullets) ? section.bullets : Array.isArray(section?.items) ? section.items : [])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 4),
    }))
    .filter((section) => (section.titleZh || section.titleEn) && (section.bulletsZh.length || section.bulletsEn.length))
    .slice(0, 4);
  const fallbackSummaryZh = summaryZh || '结构化路线分析已生成。';
  const fallbackSummaryEn = summaryEn || 'Structured route analysis is ready.';
  return {
    summaryZh: fallbackSummaryZh,
    summaryEn: fallbackSummaryEn,
    sections: sections.length ? sections : [{
      titleZh: '智能总结',
      titleEn: 'Intelligent Summary',
      bulletsZh: [fallbackSummaryZh],
      bulletsEn: [fallbackSummaryEn],
    }],
  };
}

function buildLocalizedRouteAnalysisPayload(parsed, provider, locale = 'zh-CN') {
  return {
    title: locale === 'en' ? 'Elderly Travel Chain-of-Thought Analysis' : '老年代理人出行链式分析',
    placeholder: locale === 'en' ? parsed.summaryEn : parsed.summaryZh,
    placeholderSub: locale === 'en' ? 'Generated by the local LLM proxy service.' : '由本地 LLM 代理服务生成。',
    placeholderZh: parsed.summaryZh,
    placeholderEn: parsed.summaryEn,
    placeholderSubZh: '由本地 LLM 代理服务生成。',
    placeholderSubEn: 'Generated by the local LLM proxy service.',
    provider,
    sections: (Array.isArray(parsed.sections) ? parsed.sections : []).map((section) => ({
      titleZh: String(section?.titleZh || ''),
      titleEn: String(section?.titleEn || ''),
      bulletsZh: Array.isArray(section?.bulletsZh) ? section.bulletsZh.map((item) => String(item || '')) : [],
      bulletsEn: Array.isArray(section?.bulletsEn) ? section.bulletsEn.map((item) => String(item || '')) : [],
    })),
  };
}

async function requestOpenAiRouteAnalysis(payload = {}, locale = 'zh-CN') {
  const config = getRouteAnalysisProviderConfig();
  const chatCompatibleProvider = getChatCompatibleProviderMeta(config);
  if (!config.enabled) {
    return {
      connected: false,
      provider: {
        id: 'local-service',
        label: locale === 'en' ? 'Local Service' : '本地服务',
        status: locale === 'en' ? 'No OPENAI_API_KEY configured on the local service' : '本地服务尚未配置 OPENAI_API_KEY',
        connected: false,
      },
      analysis: null,
    };
  }
  if (chatCompatibleProvider) {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: buildRouteAnalysisSystemPrompt(locale) },
          { role: 'user', content: buildRouteAnalysisUserPrompt(payload, locale) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1200,
        stream: false,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error?.message || body?.error || `${chatCompatibleProvider.requestLabel} request failed (${response.status})`);
    }
    const outputText = extractChatCompletionText(body);
    if (!outputText) {
      throw new Error(`${chatCompatibleProvider.requestLabel} response did not include chat completion text`);
    }
    const parsed = normalizeRouteAnalysisContent(JSON.parse(outputText), locale);
    return {
      connected: true,
      provider: {
        id: chatCompatibleProvider.id,
        label: chatCompatibleProvider.label,
        status: config.model,
        connected: true,
      },
      analysis: {
        title: locale === 'en' ? 'Elderly Travel Chain-of-Thought Analysis' : '老年代理人出行链式分析',
        placeholder: parsed.summary || '',
        placeholderSub: locale === 'en' ? 'Generated by the local LLM proxy service.' : '由本地 LLM 代理服务生成。',
        provider: {
          id: chatCompatibleProvider.id,
          label: chatCompatibleProvider.label,
          status: config.model,
          connected: true,
        },
        sections: Array.isArray(parsed.sections)
          ? parsed.sections.map((section) => ({
              title: String(section?.title || ''),
              bullets: Array.isArray(section?.bullets) ? section.bullets.map((item) => String(item || '')) : [],
            }))
          : [],
      },
    };
  }
  const response = await fetch(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: buildRouteAnalysisSystemPrompt(locale) }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: buildRouteAnalysisUserPrompt(payload, locale) }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'route_analysis_panel',
          schema: buildRouteAnalysisSchema(),
          strict: true,
        },
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.error || `OpenAI request failed (${response.status})`);
  }
  const outputText = extractResponseText(body);
  if (!outputText) {
    throw new Error('OpenAI response did not include structured text output');
  }
  const parsed = normalizeRouteAnalysisContent(JSON.parse(outputText), locale);
  return {
    connected: true,
    provider: {
      id: 'openai',
      label: 'OpenAI',
      status: config.model,
      connected: true,
    },
    analysis: {
      title: locale === 'en' ? 'Elderly Travel Chain-of-Thought Analysis' : '老年代理人出行链式分析',
      placeholder: parsed.summary || '',
      placeholderSub: locale === 'en' ? 'Generated by the local LLM proxy service.' : '由本地 LLM 代理服务生成。',
      provider: {
        id: 'openai',
        label: 'OpenAI',
        status: config.model,
        connected: true,
      },
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.map((section) => ({
            title: String(section?.title || ''),
            bullets: Array.isArray(section?.bullets) ? section.bullets.map((item) => String(item || '')) : [],
          }))
        : [],
    },
  };
}

async function requestOpenAiRouteAnalysis(payload = {}, locale = 'zh-CN') {
  const config = getRouteAnalysisProviderConfig();
  const chatCompatibleProvider = getChatCompatibleProviderMeta(config);
  if (!config.enabled) {
    return {
      connected: false,
      provider: {
        id: 'local-service',
        label: locale === 'en' ? 'Local Service' : '本地服务',
        status: locale === 'en' ? 'No OPENAI_API_KEY configured on the local service' : '本地服务尚未配置 OPENAI_API_KEY',
        connected: false,
      },
      analysis: null,
    };
  }
  if (chatCompatibleProvider) {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: buildRouteAnalysisSystemPrompt(locale) },
          { role: 'user', content: buildRouteAnalysisUserPrompt(payload, locale) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1200,
        stream: false,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error?.message || body?.error || `${chatCompatibleProvider.requestLabel} request failed (${response.status})`);
    }
    const outputText = extractChatCompletionText(body);
    if (!outputText) {
      throw new Error(`${chatCompatibleProvider.requestLabel} response did not include chat completion text`);
    }
    const parsed = normalizeRouteAnalysisContent(JSON.parse(outputText), locale);
    return {
      connected: true,
      provider: {
        id: chatCompatibleProvider.id,
        label: chatCompatibleProvider.label,
        status: config.model,
        connected: true,
      },
      analysis: buildLocalizedRouteAnalysisPayload(parsed, {
        id: chatCompatibleProvider.id,
        label: chatCompatibleProvider.label,
        status: config.model,
        connected: true,
      }, locale),
    };
  }
  const response = await fetch(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: buildRouteAnalysisSystemPrompt(locale) }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: buildRouteAnalysisUserPrompt(payload, locale) }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'route_analysis_panel',
          schema: buildRouteAnalysisSchema(),
          strict: true,
        },
      },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || body?.error || `OpenAI request failed (${response.status})`);
  }
  const outputText = extractResponseText(body);
  if (!outputText) {
    throw new Error('OpenAI response did not include structured text output');
  }
  const parsed = normalizeRouteAnalysisContent(JSON.parse(outputText), locale);
  return {
    connected: true,
    provider: {
      id: 'openai',
      label: 'OpenAI',
      status: config.model,
      connected: true,
    },
    analysis: buildLocalizedRouteAnalysisPayload(parsed, {
      id: 'openai',
      label: 'OpenAI',
      status: config.model,
      connected: true,
    }, locale),
  };
}

function resolveServerOptions(options = {}) {
  const rootDir = options.rootDir || path.join(__dirname, '..');
  const cacheDir = ensureCacheDir(options.cacheDir || path.join(rootDir, '.cache', 'heatmap'));
  return {
    rootDir,
    cacheDir,
  };
}

function buildSerializableHeatmapRunOptions(options = {}) {
  return {
    rootDir: options.rootDir,
    cacheDir: options.cacheDir,
    mode: options.mode,
  };
}

function runHeatmapSimulationInWorker(payload, options = {}) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(HEATMAP_SIM_WORKER_PATH, {
      workerData: {
        payload,
        options: buildSerializableHeatmapRunOptions(options),
      },
    });
    let settled = false;
    const finalize = (fn, value) => {
      if (settled) {
        return;
      }
      settled = true;
      fn(value);
    };
    worker.on('message', (message) => {
      if (message?.type === 'progress') {
        if (typeof options.onProgress === 'function') {
          options.onProgress(message.progress || {});
        }
        return;
      }
      if (message?.type === 'result') {
        finalize(resolve, message.result);
        return;
      }
      if (message?.type === 'error') {
        finalize(reject, new Error(message.error || 'Heatmap worker failed.'));
      }
    });
    worker.on('error', (error) => finalize(reject, error));
    worker.on('exit', (code) => {
      if (!settled && code !== 0) {
        finalize(reject, new Error(`Heatmap worker exited with code ${code}`));
      }
    });
  });
}

async function runHeatmapSimulationWithFallback(payload, options = {}) {
  // Preserve the legacy in-process path so we can switch back by env or on worker failure.
  if (!HEATMAP_USE_WORKER_THREADS) {
    return runHeatmapSimulation(payload, options);
  }
  try {
    return await runHeatmapSimulationInWorker(payload, options);
  } catch (error) {
    return runHeatmapSimulation(payload, options);
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function parseRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    const maxBodyBytes = 150 * 1024 * 1024;
    request.on('data', (chunk) => {
      totalLength += chunk.length;
      if (totalLength > maxBodyBytes) {
        reject(new Error('Request body too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function createJobSnapshot(job) {
  return {
    jobId: job.jobId,
    status: job.status,
    progress: Number(job.progress || 0),
    cacheHit: Boolean(job.cacheHit),
    cacheKey: job.cacheKey || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    error: job.error || null,
    result: job.status === 'completed' ? job.result : null,
  };
}

function createSimServer(options = {}) {
  const serverOptions = resolveServerOptions(options);
  const jobs = new Map();
  const activeJobByCacheKey = new Map();
  const refinementPromisesByCacheKey = new Map();
  const decisionPlanPromisesByCacheKey = new Map();

  function shouldRefineCachedHeatmapResult(result) {
    return Boolean(
      result
      && result?.meta?.resultQuality !== 'final'
      && result?.meta?.refinementPending
    );
  }

  function startHeatmapRefinement(cacheKey, payload) {
    if (!cacheKey || refinementPromisesByCacheKey.has(cacheKey)) {
      return;
    }
    const refinementPromise = (async () => {
      try {
        const currentCached = readHeatmapCache(serverOptions.cacheDir, cacheKey);
        if (
          isCompatibleCachedHeatmapResult(currentCached)
          && currentCached?.meta?.resultQuality === 'final'
          && !currentCached?.meta?.refinementPending
        ) {
          return;
        }
        const refinedResult = await runHeatmapSimulationWithFallback(payload, {
          rootDir: serverOptions.rootDir,
          cacheDir: serverOptions.cacheDir,
          mode: 'final',
        });
        writeHeatmapCache(serverOptions.cacheDir, cacheKey, refinedResult);
      } catch (error) {
        // Keep the fast preview cache if refinement fails.
      } finally {
        refinementPromisesByCacheKey.delete(cacheKey);
      }
    })();
    refinementPromisesByCacheKey.set(cacheKey, refinementPromise);
  }

  function shouldBackgroundRefineDecisionPlan(result) {
    return Boolean(
      result?.meta?.resultQuality === 'preview'
      && result?.meta?.refinementPending
      && result?.meta?.cacheKey
      && (result?.meta?.llmDecisionPlan?.pending || result?.heat?.llmDecisionPlan?.pending || result?.llmDecisionPlan?.pending)
    );
  }

  function mergeDecisionPlanIntoCachedPlayback(cacheKey, analysis) {
    if (!cacheKey || !analysis) {
      return;
    }
    const currentCached = readHeatmapCache(serverOptions.cacheDir, cacheKey);
    if (!isCompatibleCachedHeatmapResult(currentCached)) {
      return;
    }
    if (currentCached?.meta?.resultQuality === 'final' && !currentCached?.meta?.refinementPending) {
      return;
    }
    const merged = JSON.parse(JSON.stringify(currentCached));
    if (!merged.heat) {
      merged.heat = {};
    }
    merged.heat.llmDecisionPlan = JSON.parse(JSON.stringify(analysis));
    merged.llmDecisionPlan = JSON.parse(JSON.stringify(analysis));
    merged.meta = {
      ...(merged.meta || {}),
      llmDecisionPlan: JSON.parse(JSON.stringify(analysis)),
    };
    writeHeatmapCache(serverOptions.cacheDir, cacheKey, merged);
  }

  function startDecisionPlanRefinement(cacheKey, payload) {
    if (!cacheKey || decisionPlanPromisesByCacheKey.has(cacheKey)) {
      return;
    }
    const decisionPlanPromise = (async () => {
      try {
        const currentCached = readHeatmapCache(serverOptions.cacheDir, cacheKey);
        if (
          !shouldBackgroundRefineDecisionPlan(currentCached)
          || !isCompatibleCachedHeatmapResult(currentCached)
        ) {
          return;
        }
        const analysis = await runHeatmapDecisionPlanOnly(payload, {
          rootDir: serverOptions.rootDir,
          cacheDir: serverOptions.cacheDir,
        });
        if (analysis && !analysis.pending && !analysis.failed) {
          mergeDecisionPlanIntoCachedPlayback(cacheKey, analysis);
        }
      } catch (error) {
        // Keep the pending placeholder if separate decision-plan refinement fails.
      } finally {
        decisionPlanPromisesByCacheKey.delete(cacheKey);
      }
    })();
    decisionPlanPromisesByCacheKey.set(cacheKey, decisionPlanPromise);
  }

  function mapJobProgress(progress) {
    if (Number.isFinite(Number(progress?.percent))) {
      return Math.max(0, Math.min(0.99, Number(progress.percent)));
    }
    const stage = progress?.stage || 'focus';
    const simulatedSeconds = Number(progress?.simulatedSeconds || 0);
    const maxSimulationSeconds = Math.max(1e-6, Number(progress?.maxSimulationSeconds || 1));
    const ratio = Math.max(0, Math.min(1, simulatedSeconds / maxSimulationSeconds));
    if (stage === 'background') {
      return progress?.completed || progress?.cacheHit ? 0.45 : Math.min(0.45, ratio * 0.45);
    }
    const focusRatio = progress?.firstPassComplete ? 1 : ratio;
    return 0.45 + Math.min(0.55, focusRatio * 0.55);
  }

  async function handleCreateHeatmapJob(request, response) {
    const payload = await parseRequestBody(request);
    const fingerprint = buildHeatmapRequestFingerprint(payload, { rootDir: serverOptions.rootDir });
    const cacheKey = buildHeatmapCacheKey(fingerprint);
    const rawCachedResult = readHeatmapCache(serverOptions.cacheDir, cacheKey);
    const cachedResult = isCompatibleCachedHeatmapResult(rawCachedResult) ? rawCachedResult : null;
    if (cachedResult) {
      if (shouldRefineCachedHeatmapResult(cachedResult)) {
        startHeatmapRefinement(cacheKey, payload);
        startDecisionPlanRefinement(cacheKey, payload);
      }
      sendJson(response, 200, {
        status: 'completed',
        cacheHit: true,
        cacheKey,
        result: {
          ...cachedResult,
          cacheHit: true,
          meta: {
            ...(cachedResult.meta || {}),
            cacheKey,
          },
        },
      });
      return;
    }
    const existingJobId = activeJobByCacheKey.get(cacheKey);
    if (existingJobId && jobs.has(existingJobId)) {
      const existingJob = jobs.get(existingJobId);
      sendJson(response, 202, {
        jobId: existingJob.jobId,
        status: existingJob.status,
        progress: existingJob.progress,
        cacheHit: false,
        cacheKey,
      });
      return;
    }

    const jobId = randomUUID();
    const job = {
      jobId,
      status: 'queued',
      progress: 0,
      cacheHit: false,
      cacheKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      error: null,
      result: null,
    };
    jobs.set(jobId, job);
    activeJobByCacheKey.set(cacheKey, jobId);
    sendJson(response, 202, {
      jobId,
      status: job.status,
      progress: job.progress,
      cacheHit: false,
      cacheKey,
    });

    setImmediate(async () => {
      job.status = 'running';
      job.updatedAt = Date.now();
      try {
        const result = await runHeatmapSimulationWithFallback(payload, {
          rootDir: serverOptions.rootDir,
          cacheDir: serverOptions.cacheDir,
          mode: 'preview',
          onProgress: (progress) => {
            job.progress = Math.max(0, Math.min(0.99, mapJobProgress(progress)));
            job.updatedAt = Date.now();
          },
        });
        writeHeatmapCache(serverOptions.cacheDir, cacheKey, result);
        job.status = 'completed';
        job.progress = 1;
        job.updatedAt = Date.now();
        job.result = result;
        if (shouldRefineCachedHeatmapResult(result)) {
          startHeatmapRefinement(cacheKey, payload);
          startDecisionPlanRefinement(cacheKey, payload);
        }
      } catch (error) {
        job.status = 'failed';
        job.updatedAt = Date.now();
        job.error = error?.stack || error?.message || String(error);
      } finally {
        if (activeJobByCacheKey.get(cacheKey) === jobId) {
          activeJobByCacheKey.delete(cacheKey);
        }
      }
    });
  }

  async function handleRouteAnalysis(request, response) {
    try {
      const payload = await parseRequestBody(request);
      const locale = payload?.locale === 'en' ? 'en' : 'zh-CN';
      const result = await requestOpenAiRouteAnalysis(payload?.payload || {}, locale);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, { error: error?.message || String(error) });
    }
  }

  return http.createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        sendJson(response, 200, { ok: true });
        return;
      }

      const url = new URL(request.url, 'http://127.0.0.1');
      if (request.method === 'GET' && url.pathname === '/api/health') {
        sendJson(response, 200, { ok: true, cacheDir: serverOptions.cacheDir });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/heatmap/jobs') {
        await handleCreateHeatmapJob(request, response);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/route-analysis') {
        await handleRouteAnalysis(request, response);
        return;
      }

      if (request.method === 'GET' && url.pathname.startsWith('/api/heatmap/jobs/')) {
        const jobId = decodeURIComponent(url.pathname.slice('/api/heatmap/jobs/'.length));
        const job = jobs.get(jobId);
        if (!job) {
          sendJson(response, 404, { error: 'job not found' });
          return;
        }
        sendJson(response, 200, createJobSnapshot(job));
        return;
      }

      sendJson(response, 404, { error: 'not found' });
    } catch (error) {
      sendJson(response, 500, { error: error?.stack || error?.message || String(error) });
    }
  });
}

if (require.main === module) {
  const server = createSimServer();
  const port = Number(process.env.SIM_SERVER_PORT || 8891);
  server.listen(port, '127.0.0.1', () => {
    console.log(`sim-server listening on http://127.0.0.1:${port}`);
  });
}

module.exports = {
  createSimServer,
};
