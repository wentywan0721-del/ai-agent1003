const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { randomUUID } = require('crypto');
const { Worker } = require('worker_threads');

const {
  ensureCacheDir,
  buildHeatmapCacheKey,
  readHeatmapCache,
  writeHeatmapCache,
} = require('./heatmap-cache.js');
const {
  buildBackgroundFieldFingerprint,
  buildHeatmapRequestFingerprint,
  resolveBackgroundFieldBucketCrowdCount,
  runHeatmapDecisionPlanOnly,
  runHeatmapSimulation,
} = require('./heatmap-runner.js');

const EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v27';
const EXPECTED_HEATMAP_ENGINE_VERSION = 'node-cache-v47';
const EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION = 'llm-decision-chain-v2';
const DEFAULT_BACKGROUND_FIELD_PREWARM_BUCKETS = Object.freeze([500, 1000, 1500, 2000]);
const BACKGROUND_FIELD_PREWARM_IDLE_POLL_MS = 250;
const HEATMAP_JOB_STALL_TIMEOUT_MS = Number(process.env.HEATMAP_JOB_STALL_TIMEOUT_MS || 180000);
const HEATMAP_JOB_STALL_CHECK_INTERVAL_MS = 5000;
const HEATMAP_SIM_WORKER_PATH = path.join(__dirname, 'heatmap-sim-worker.js');
const HEATMAP_USE_WORKER_THREADS = String(process.env.HEATMAP_USE_WORKER_THREADS || '1') !== '0';

function parsePositiveInteger(value, fallback) {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveHeatmapWorkerPoolOptions(options = {}, env = process.env) {
  const cpuCount = parsePositiveInteger(
    options.cpuCount ?? (typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length),
    2
  );
  const defaultForegroundConcurrency = Math.max(1, Math.min(2, cpuCount - 1 || 1));
  const foregroundConcurrency = parsePositiveInteger(
    options.heatmapForegroundWorkers ?? env.HEATMAP_FOREGROUND_WORKERS,
    defaultForegroundConcurrency
  );
  const backgroundConcurrency = parsePositiveInteger(
    options.heatmapBackgroundWorkers ?? env.HEATMAP_BACKGROUND_WORKERS,
    1
  );
  return {
    foregroundConcurrency,
    backgroundConcurrency,
  };
}

function parseBackgroundFieldPrewarmBuckets(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(
      value
        .map((item) => Math.round(Number(item || 0)))
        .filter((item) => Number.isFinite(item) && item > 0)
    )).sort((a, b) => a - b);
  }
  if (typeof value === 'string' && value.trim()) {
    return parseBackgroundFieldPrewarmBuckets(value.split(','));
  }
  return [];
}

function resolveBackgroundFieldPrewarmOptions(options = {}) {
  const configuredBuckets = parseBackgroundFieldPrewarmBuckets(
    options.backgroundFieldPrewarmBuckets ?? process.env.BACKGROUND_FIELD_PREWARM_BUCKETS
  );
  return {
    enabled: options.backgroundFieldPrewarm === true || String(process.env.BACKGROUND_FIELD_PREWARM || '0') === '1',
    buckets: configuredBuckets.length ? configuredBuckets : DEFAULT_BACKGROUND_FIELD_PREWARM_BUCKETS.slice(),
  };
}

function resolveMonotonicJobProgress(previousProgress, nextProgress) {
  const previous = Math.max(0, Math.min(0.99, Number(previousProgress || 0)));
  const next = Math.max(0, Math.min(0.99, Number(nextProgress || 0)));
  return Math.max(previous, next);
}

function shouldRunBackgroundFieldPrewarm(activeJobCount) {
  return Number(activeJobCount || 0) <= 0;
}

function createHeatmapForegroundSchedulerState() {
  let activeForegroundHeatmapJobCount = 0;
  let backgroundFieldPrewarmGeneration = 0;
  const activeForegroundJobIds = new Set();

  return {
    beginForegroundHeatmapJob() {
      const id = randomUUID();
      activeForegroundJobIds.add(id);
      activeForegroundHeatmapJobCount = activeForegroundJobIds.size;
      backgroundFieldPrewarmGeneration += 1;
      return { id, generation: backgroundFieldPrewarmGeneration };
    },
    endForegroundHeatmapJob(id) {
      if (id && activeForegroundJobIds.delete(id)) {
        activeForegroundHeatmapJobCount = activeForegroundJobIds.size;
      }
      return activeForegroundHeatmapJobCount;
    },
    getActiveForegroundHeatmapJobCount() {
      return activeForegroundHeatmapJobCount;
    },
    getBackgroundFieldPrewarmGeneration() {
      return backgroundFieldPrewarmGeneration;
    },
    canRunBackgroundFieldPrewarm(generation = backgroundFieldPrewarmGeneration) {
      return shouldRunBackgroundFieldPrewarm(activeForegroundHeatmapJobCount)
        && Number(generation) === backgroundFieldPrewarmGeneration;
    },
  };
}

function createBackgroundPrewarmDeferredError() {
  const error = new Error('Background field prewarm deferred while a foreground heatmap job is active.');
  error.code = 'BACKGROUND_PREWARM_DEFERRED';
  return error;
}

function isBackgroundPrewarmDeferredError(error) {
  return error?.code === 'BACKGROUND_PREWARM_DEFERRED';
}

function createHeatmapWorkerScheduler(options = {}) {
  const foregroundConcurrency = parsePositiveInteger(options.foregroundConcurrency, 1);
  const backgroundConcurrency = parsePositiveInteger(options.backgroundConcurrency, 1);
  const foregroundQueue = [];
  const backgroundQueue = [];
  const idleResolvers = [];
  let activeForegroundCount = 0;
  let activeBackgroundCount = 0;

  function getQueuedCount() {
    return foregroundQueue.length + backgroundQueue.length;
  }

  function notifyIdleIfNeeded() {
    if (activeForegroundCount > 0 || activeBackgroundCount > 0 || getQueuedCount() > 0) {
      return;
    }
    while (idleResolvers.length) {
      const resolve = idleResolvers.shift();
      resolve();
    }
  }

  function removeQueuedEntry(entry) {
    const queue = entry.priority === 'background' ? backgroundQueue : foregroundQueue;
    const index = queue.indexOf(entry);
    if (index >= 0) {
      queue.splice(index, 1);
      return true;
    }
    return false;
  }

  function finishEntry(entry) {
    if (entry.priority === 'background') {
      activeBackgroundCount = Math.max(0, activeBackgroundCount - 1);
    } else {
      activeForegroundCount = Math.max(0, activeForegroundCount - 1);
    }
    drain();
    notifyIdleIfNeeded();
  }

  function startEntry(entry) {
    if (entry.cancelled) {
      return;
    }
    entry.started = true;
    if (entry.priority === 'background') {
      activeBackgroundCount += 1;
    } else {
      activeForegroundCount += 1;
    }
    let task;
    try {
      task = entry.taskFactory();
      entry.activeTask = task;
    } catch (error) {
      entry.reject(error);
      finishEntry(entry);
      return;
    }
    Promise.resolve(task?.promise || task)
      .then(entry.resolve, entry.reject)
      .finally(() => finishEntry(entry));
  }

  function drain() {
    while (activeForegroundCount < foregroundConcurrency && foregroundQueue.length) {
      startEntry(foregroundQueue.shift());
    }
    if (activeForegroundCount > 0 || foregroundQueue.length > 0) {
      return;
    }
    while (activeBackgroundCount < backgroundConcurrency && backgroundQueue.length) {
      startEntry(backgroundQueue.shift());
    }
  }

  function schedule(taskFactory, taskOptions = {}) {
    const priority = taskOptions.priority === 'background' ? 'background' : 'foreground';
    let entry;
    const promise = new Promise((resolve, reject) => {
      entry = {
        activeTask: null,
        cancelled: false,
        priority,
        reject,
        resolve,
        started: false,
        taskFactory,
      };
    });
    entry.promise = promise;
    entry.cancel = (reason = createBackgroundPrewarmDeferredError()) => {
      if (entry.cancelled) {
        return Promise.resolve();
      }
      entry.cancelled = true;
      if (!entry.started && removeQueuedEntry(entry)) {
        entry.reject(reason);
        notifyIdleIfNeeded();
        return Promise.resolve();
      }
      if (entry.activeTask && typeof entry.activeTask.cancel === 'function') {
        return entry.activeTask.cancel(reason);
      }
      return Promise.resolve();
    };

    if (priority === 'background') {
      backgroundQueue.push(entry);
    } else {
      foregroundQueue.push(entry);
    }
    drain();
    return entry;
  }

  return {
    schedule,
    idle() {
      if (activeForegroundCount <= 0 && activeBackgroundCount <= 0 && getQueuedCount() <= 0) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        idleResolvers.push(resolve);
      });
    },
    getSnapshot() {
      return {
        activeBackgroundCount,
        activeForegroundCount,
        backgroundConcurrency,
        backgroundQueueLength: backgroundQueue.length,
        foregroundConcurrency,
        foregroundQueueLength: foregroundQueue.length,
      };
    },
  };
}

function isCompatibleCachedHeatmapResult(result) {
  if (!result) {
    return false;
  }
  if (result?.meta?.engineVersion !== EXPECTED_HEATMAP_ENGINE_VERSION) {
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
  prompt.push(
    'For the front summary page after the cover, write one executive route diagnosis that combines route judgement, core problems, and model adjustment recommendations.',
    'Avoid vague advice; name the route segment, hot zone, spatial element, facility, or numbered pressure point whenever the input provides it.',
    'Only refer to stressors by the supplied global pressure-point numbers.',
    'Do not use ambiguous Zone labels; use the supplied hot-zone labels such as Composite hot zone 1 or Decision hot zone 2.',
    'Every recommendation must be traceable to the supplied route, hot zones, burden scores, or numbered pressure points.',
    'For exported reports, prefer these section meanings: route score interpretation, spatial model changes, priority modification areas, and priority facilities.',
    'Use route score, five burden scores, high-heat zones, ranked stressors, and pressure-point numbers as evidence.',
    'Facility recommendations must mention numbered pressure points when available and must not repeat one generic sentence for every facility.',
    'Write evidence-dense professional diagnosis with concrete modification intent; avoid filler, slogans, or generic score restatement.',
    'Do not invent new geometry, formulas, heatmap values, or pressure points.'
  );
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
    .map((section) => ({
      ...section,
      title: locale === 'en' ? (section.titleEn || section.titleZh) : (section.titleZh || section.titleEn),
      bullets: locale === 'en'
        ? (section.bulletsEn.length ? section.bulletsEn : section.bulletsZh)
        : (section.bulletsZh.length ? section.bulletsZh : section.bulletsEn),
    }))
    .filter((section) => (section.titleZh || section.titleEn) && (section.bulletsZh.length || section.bulletsEn.length))
    .slice(0, 4);
  const fallbackSummaryZh = summaryZh || '结构化路线分析已生成。';
  const fallbackSummaryEn = summaryEn || 'Structured route analysis is ready.';
  return {
    summary: locale === 'en' ? fallbackSummaryEn : fallbackSummaryZh,
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
    backgroundFieldPrewarm: resolveBackgroundFieldPrewarmOptions(options),
    heatmapWorkerPool: resolveHeatmapWorkerPoolOptions(options),
  };
}

function buildSerializableHeatmapRunOptions(options = {}) {
  return {
    rootDir: options.rootDir,
    cacheDir: options.cacheDir,
    mode: options.mode,
    ...(Array.isArray(options.backgroundCrowdBuckets)
      ? { backgroundCrowdBuckets: options.backgroundCrowdBuckets.slice() }
      : {}),
  };
}

function createHeatmapWorkerTask(taskType, payload, options = {}) {
  let rejectPromise = null;
  const worker = new Worker(HEATMAP_SIM_WORKER_PATH, {
    workerData: {
      taskType,
      payload,
      options: buildSerializableHeatmapRunOptions(options),
    },
  });
  let settled = false;
  const promise = new Promise((resolve, reject) => {
    rejectPromise = reject;
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
          try {
            options.onProgress(message.progress || {});
          } catch (error) {
            finalize(reject, error);
            worker.terminate().catch(() => {});
          }
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

  return {
    worker,
    promise,
    cancel() {
      if (settled) {
        return Promise.resolve();
      }
      settled = true;
      if (typeof rejectPromise === 'function') {
        rejectPromise(createBackgroundPrewarmDeferredError());
      }
      return worker.terminate().catch(() => {});
    },
  };
}

function runHeatmapSimulationInWorker(payload, options = {}) {
  const task = createHeatmapWorkerTask('simulation', payload, options);
  if (typeof options.onScheduledTask === 'function') {
    options.onScheduledTask(task);
  }
  return task.promise;
}

function runBackgroundFieldPrewarmInWorker(payload, options = {}) {
  return createHeatmapWorkerTask('background-prewarm', payload, options);
}

async function runHeatmapSimulationWithFallback(payload, options = {}) {
  // Preserve the legacy in-process path so we can switch back by env or on worker failure.
  if (!HEATMAP_USE_WORKER_THREADS) {
    return runHeatmapSimulation(payload, options);
  }
  try {
    if (options.workerScheduler) {
      const scheduledTask = options.workerScheduler.schedule(
        () => createHeatmapWorkerTask('simulation', payload, options),
        { priority: 'foreground' }
      );
      if (typeof options.onScheduledTask === 'function') {
        options.onScheduledTask(scheduledTask);
      }
      return await scheduledTask.promise;
    }
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

function sendPdf(response, buffer, fileName = 'route-report.pdf') {
  const safeFileName = String(fileName || 'route-report.pdf').replace(/[^\w\u4e00-\u9fa5.-]+/g, '_');
  response.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': buffer.length,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFileName)}"`,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store',
  });
  response.end(buffer);
}

function findChromiumExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.CHROMIUM_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1219', 'chrome-win64', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1208', 'chrome-win64', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate);
    } catch (error) {
      return false;
    }
  }) || '';
}

function execFileAsync(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function renderReportHtmlToPdf(html, fileName = 'route-report.pdf') {
  const chromePath = findChromiumExecutable();
  if (!chromePath) {
    throw new Error('Chromium executable not found. Set CHROME_PATH or install Playwright Chromium.');
  }
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'route-report-pdf-'));
  const htmlPath = path.join(tempDir, 'report.html');
  const pdfPath = path.join(tempDir, 'report.pdf');
  try {
    await fs.promises.writeFile(htmlPath, String(html || ''), 'utf8');
    await execFileAsync(chromePath, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      '--disable-dev-shm-usage',
      `--print-to-pdf=${pdfPath}`,
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      `file:///${htmlPath.replace(/\\/g, '/')}`,
    ], { timeout: 120000, windowsHide: true });
    const buffer = await fs.promises.readFile(pdfPath);
    if (!buffer.length) {
      throw new Error(`Failed to render ${fileName}`);
    }
    return buffer;
  } finally {
    fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
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
    stage: job.stage || null,
    cacheHit: Boolean(job.cacheHit),
    cacheKey: job.cacheKey || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    lastProgressAt: job.lastProgressAt || job.updatedAt,
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
  const backgroundFieldPrewarmPromisesByCacheKey = new Map();
  const foregroundScheduler = createHeatmapForegroundSchedulerState();
  const workerScheduler = createHeatmapWorkerScheduler(serverOptions.heatmapWorkerPool);
  let backgroundFieldPrewarmQueue = Promise.resolve();
  let backgroundFieldPrewarmPollTimer = null;
  let activeBackgroundFieldPrewarmTask = null;

  function clearBackgroundFieldPrewarmPollTimer() {
    if (backgroundFieldPrewarmPollTimer) {
      clearTimeout(backgroundFieldPrewarmPollTimer);
      backgroundFieldPrewarmPollTimer = null;
    }
  }

  function terminateActiveBackgroundFieldPrewarmWorker() {
    const task = activeBackgroundFieldPrewarmTask;
    activeBackgroundFieldPrewarmTask = null;
    if (task && typeof task.cancel === 'function') {
      task.cancel();
    }
  }

  function beginForegroundHeatmapJob() {
    const marker = foregroundScheduler.beginForegroundHeatmapJob();
    clearBackgroundFieldPrewarmPollTimer();
    terminateActiveBackgroundFieldPrewarmWorker();
    return marker;
  }

  function endForegroundHeatmapJob(marker) {
    return foregroundScheduler.endForegroundHeatmapJob(marker?.id);
  }

  function cancelHeatmapJobTask(job, reason) {
    if (!job || !job.activeTask || typeof job.activeTask.cancel !== 'function') {
      return;
    }
    try {
      job.activeTask.cancel(reason);
    } catch (error) {
      // The job is already being failed; cancellation errors should not mask the stall diagnostic.
    }
  }

  function hasHeatmapJobProgressHeartbeat(progress) {
    return Boolean(
      progress
      && (
        progress.stage
        || Number.isFinite(Number(progress.percent))
        || Number.isFinite(Number(progress.simulatedSeconds))
        || Number.isFinite(Number(progress.guard))
        || progress.completed
        || progress.cacheHit
      )
    );
  }

  function markHeatmapJobProgress(job, progress) {
    const previousProgress = Number(job.progress || 0);
    const nextProgress = resolveMonotonicJobProgress(previousProgress, mapJobProgress(progress));
    job.stage = progress?.stage || job.stage || null;
    job.progress = nextProgress;
    job.updatedAt = Date.now();
    if (hasHeatmapJobProgressHeartbeat(progress)) {
      job.lastProgressAt = job.updatedAt;
    } else if (nextProgress > previousProgress + 1e-6) {
      job.lastProgressAt = job.updatedAt;
    }
  }

  function failStalledHeatmapJob(job) {
    if (!job || job.status !== 'running') {
      return false;
    }
    const stalledForMs = Date.now() - Number(job.lastProgressAt || job.updatedAt || job.createdAt || Date.now());
    if (stalledForMs < HEATMAP_JOB_STALL_TIMEOUT_MS) {
      return false;
    }
    job.status = 'failed';
    job.updatedAt = Date.now();
    job.error = `Heatmap job stalled after ${Math.round(stalledForMs / 1000)}s without progress.`;
    cancelHeatmapJobTask(job, new Error(job.error));
    return true;
  }

  function waitForBackgroundFieldPrewarmWindow() {
    return new Promise((resolve) => {
      const check = () => {
        if (shouldRunBackgroundFieldPrewarm(foregroundScheduler.getActiveForegroundHeatmapJobCount())) {
          clearBackgroundFieldPrewarmPollTimer();
          resolve();
          return;
        }
        backgroundFieldPrewarmPollTimer = setTimeout(check, BACKGROUND_FIELD_PREWARM_IDLE_POLL_MS);
      };
      check();
    });
  }

  function buildBackgroundFieldPrewarmPayload(payload = {}, backgroundCrowdCount) {
    const scenarioOptions = payload?.scenarioOptions || {};
    return {
      ...(payload?.simData ? { simData: payload.simData } : {}),
      ...(payload?.healthyAgents ? { healthyAgents: payload.healthyAgents } : {}),
      scenarioOptions: {
        crowdPresetId: scenarioOptions.crowdPresetId || 'normal',
        backgroundCrowdCount,
        ...(scenarioOptions.focusRouteId ? { focusRouteId: scenarioOptions.focusRouteId } : {}),
        ...(scenarioOptions.startPoint ? { startPoint: scenarioOptions.startPoint } : {}),
        ...(scenarioOptions.startNodeId ? { startNodeId: scenarioOptions.startNodeId } : {}),
        ...(scenarioOptions.targetRegionId ? { targetRegionId: scenarioOptions.targetRegionId } : {}),
        focusProfile: {},
      },
      heatOptions: {
        maxSimulationSeconds: 480,
      },
    };
  }

  function enqueueBackgroundFieldPrewarm(payload = {}, backgroundCrowdCount) {
    if (!serverOptions.backgroundFieldPrewarm.enabled) {
      return;
    }
    const prewarmPayload = buildBackgroundFieldPrewarmPayload(payload, backgroundCrowdCount);
    const backgroundFingerprint = buildBackgroundFieldFingerprint(prewarmPayload, {
      rootDir: serverOptions.rootDir,
      backgroundCrowdBuckets: serverOptions.backgroundFieldPrewarm.buckets,
      maxSimulationSecondsOverride: 480,
    });
    const backgroundCacheKey = buildHeatmapCacheKey(backgroundFingerprint);
    if (readHeatmapCache(serverOptions.cacheDir, backgroundCacheKey)) {
      return;
    }
    if (backgroundFieldPrewarmPromisesByCacheKey.has(backgroundCacheKey)) {
      return;
    }
    const prewarmGeneration = foregroundScheduler.getBackgroundFieldPrewarmGeneration();
    const prewarmPromise = backgroundFieldPrewarmQueue
      .catch(() => {})
      .then(async () => {
        let deferred = false;
        let prewarmTask = null;
        try {
          await waitForBackgroundFieldPrewarmWindow();
          if (!foregroundScheduler.canRunBackgroundFieldPrewarm(prewarmGeneration)) {
            throw createBackgroundPrewarmDeferredError();
          }
          if (readHeatmapCache(serverOptions.cacheDir, backgroundCacheKey)) {
            return;
          }
          prewarmTask = workerScheduler.schedule(
            () => runBackgroundFieldPrewarmInWorker(prewarmPayload, {
              rootDir: serverOptions.rootDir,
              cacheDir: serverOptions.cacheDir,
              backgroundCrowdBuckets: serverOptions.backgroundFieldPrewarm.buckets,
              onProgress: (progress) => {
                if (!foregroundScheduler.canRunBackgroundFieldPrewarm(prewarmGeneration)) {
                  throw createBackgroundPrewarmDeferredError();
                }
                return progress;
              },
            }),
            { priority: 'background' }
          );
          activeBackgroundFieldPrewarmTask = prewarmTask;
          await prewarmTask.promise;
        } catch (error) {
          if (isBackgroundPrewarmDeferredError(error)) {
            deferred = true;
            return;
          }
          // Keep startup/request handling independent from background prewarm failures.
        } finally {
          if (activeBackgroundFieldPrewarmTask === prewarmTask) {
            activeBackgroundFieldPrewarmTask = null;
          }
          backgroundFieldPrewarmPromisesByCacheKey.delete(backgroundCacheKey);
          if (deferred) {
            setTimeout(() => {
              enqueueBackgroundFieldPrewarm(payload, backgroundCrowdCount);
            }, BACKGROUND_FIELD_PREWARM_IDLE_POLL_MS);
          }
        }
      });
    backgroundFieldPrewarmPromisesByCacheKey.set(backgroundCacheKey, prewarmPromise);
    backgroundFieldPrewarmQueue = prewarmPromise;
  }

  function scheduleBackgroundFieldPrewarm(payload = {}, options = {}) {
    if (!serverOptions.backgroundFieldPrewarm.enabled) {
      return [];
    }
    const requestedBackgroundCrowdCount = Number(payload?.scenarioOptions?.backgroundCrowdCount || 0);
    const skipBucket = resolveBackgroundFieldBucketCrowdCount(
      requestedBackgroundCrowdCount,
      { backgroundCrowdBuckets: serverOptions.backgroundFieldPrewarm.buckets }
    );
    const scheduled = [];
    serverOptions.backgroundFieldPrewarm.buckets.forEach((backgroundCrowdCount) => {
      if (!options.includeRequested && backgroundCrowdCount === skipBucket) {
        return;
      }
      enqueueBackgroundFieldPrewarm(payload, backgroundCrowdCount);
      scheduled.push(backgroundCrowdCount);
    });
    return scheduled;
  }

  function shouldRefineCachedHeatmapResult(result) {
    return Boolean(
      result
      && result?.meta?.resultQuality !== 'final'
      && result?.meta?.refinementPending
    );
  }

  function getCachedDecisionPlan(result) {
    return result?.meta?.llmDecisionPlan
      || result?.heat?.llmDecisionPlan
      || result?.llmDecisionPlan
      || null;
  }

  function shouldRefreshCachedDecisionPlan(result) {
    const llmProvider = getRouteAnalysisProviderConfig();
    if (!llmProvider.enabled || !isCompatibleCachedHeatmapResult(result)) {
      return false;
    }
    const plan = getCachedDecisionPlan(result);
    if (!plan || plan.pending || plan.failed) {
      return true;
    }
    return result?.meta?.llmDecisionPlanCacheVersion !== EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION;
  }

  function stampDecisionPlanCacheVersion(result) {
    if (!result) {
      return result;
    }
    const stamped = JSON.parse(JSON.stringify(result));
    const plan = getCachedDecisionPlan(stamped);
    stamped.meta = {
      ...(stamped.meta || {}),
      ...(plan && !plan.pending && !plan.failed
        ? { llmDecisionPlanCacheVersion: EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION }
        : {}),
    };
    return stamped;
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
          workerScheduler,
        });
        writeHeatmapCache(serverOptions.cacheDir, cacheKey, stampDecisionPlanCacheVersion(refinedResult));
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

  function mergeDecisionPlanIntoCachedPlayback(cacheKey, analysis, options = {}) {
    if (!cacheKey || !analysis) {
      return;
    }
    const currentCached = readHeatmapCache(serverOptions.cacheDir, cacheKey);
    if (!isCompatibleCachedHeatmapResult(currentCached)) {
      return;
    }
    if (!options.force && currentCached?.meta?.resultQuality === 'final' && !currentCached?.meta?.refinementPending) {
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
      ...(!analysis.pending && !analysis.failed
        ? { llmDecisionPlanCacheVersion: EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION }
        : {}),
    };
    writeHeatmapCache(serverOptions.cacheDir, cacheKey, merged);
  }

  async function refreshCachedDecisionPlanOnly(cacheKey, payload) {
    if (!cacheKey) {
      return null;
    }
    const existingPromise = decisionPlanPromisesByCacheKey.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }
    const refreshPromise = (async () => {
      try {
        const currentCached = readHeatmapCache(serverOptions.cacheDir, cacheKey);
        if (!shouldRefreshCachedDecisionPlan(currentCached)) {
          return currentCached;
        }
        const analysis = await runHeatmapDecisionPlanOnly(payload, {
          rootDir: serverOptions.rootDir,
          cacheDir: serverOptions.cacheDir,
          playback: currentCached?.heat || currentCached?.playback || null,
        });
        if (analysis && !analysis.pending) {
          mergeDecisionPlanIntoCachedPlayback(cacheKey, analysis, { force: true });
          return readHeatmapCache(serverOptions.cacheDir, cacheKey) || currentCached;
        }
        return currentCached;
      } finally {
        decisionPlanPromisesByCacheKey.delete(cacheKey);
      }
    })();
    decisionPlanPromisesByCacheKey.set(cacheKey, refreshPromise);
    return refreshPromise;
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
          playback: currentCached?.heat || currentCached?.playback || null,
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
      let resultForResponse = cachedResult;
      if (shouldRefreshCachedDecisionPlan(cachedResult)) {
        try {
          resultForResponse = await refreshCachedDecisionPlanOnly(cacheKey, payload) || cachedResult;
        } catch (error) {
          resultForResponse = cachedResult;
        }
      }
      sendJson(response, 200, {
        status: 'completed',
        cacheHit: true,
        cacheKey,
        result: {
          ...resultForResponse,
          cacheHit: true,
          meta: {
            ...(resultForResponse.meta || {}),
            cacheKey,
          },
        },
      });
      setImmediate(() => {
        scheduleBackgroundFieldPrewarm(payload);
      });
      return;
    }
    const existingJobId = activeJobByCacheKey.get(cacheKey);
    if (existingJobId && jobs.has(existingJobId)) {
      const existingJob = jobs.get(existingJobId);
      sendJson(response, 202, createJobSnapshot(existingJob));
      return;
    }

    const jobId = randomUUID();
    const job = {
      jobId,
      status: 'queued',
      progress: 0,
      stage: null,
      cacheHit: false,
      cacheKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
      error: null,
      result: null,
      activeTask: null,
    };
    const foregroundMarker = beginForegroundHeatmapJob();
    jobs.set(jobId, job);
    activeJobByCacheKey.set(cacheKey, jobId);
    sendJson(response, 202, createJobSnapshot(job));

    setImmediate(async () => {
      job.status = 'running';
      job.updatedAt = Date.now();
      job.lastProgressAt = job.updatedAt;
      const stallTimer = setInterval(() => {
        failStalledHeatmapJob(job);
      }, HEATMAP_JOB_STALL_CHECK_INTERVAL_MS);
      try {
        const result = await runHeatmapSimulationWithFallback(payload, {
          rootDir: serverOptions.rootDir,
          cacheDir: serverOptions.cacheDir,
          mode: 'final',
          workerScheduler,
          onScheduledTask: (task) => {
            job.activeTask = task;
          },
          onProgress: (progress) => {
            markHeatmapJobProgress(job, progress);
          },
        });
        if (job.status === 'failed') {
          return;
        }
        const stampedResult = stampDecisionPlanCacheVersion(result);
        writeHeatmapCache(serverOptions.cacheDir, cacheKey, stampedResult);
        job.status = 'completed';
        job.progress = 1;
        job.updatedAt = Date.now();
        job.lastProgressAt = job.updatedAt;
        job.result = stampedResult;
      } catch (error) {
        job.status = 'failed';
        job.updatedAt = Date.now();
        job.error = error?.stack || error?.message || String(error);
      } finally {
        clearInterval(stallTimer);
        job.activeTask = null;
        if (activeJobByCacheKey.get(cacheKey) === jobId) {
          activeJobByCacheKey.delete(cacheKey);
        }
        if (endForegroundHeatmapJob(foregroundMarker) <= 0) {
          setImmediate(() => {
            scheduleBackgroundFieldPrewarm(payload);
          });
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

  async function handleReportPdf(request, response) {
    const payload = await parseRequestBody(request);
    const html = String(payload?.html || '');
    if (!html.trim()) {
      sendJson(response, 400, { error: 'report html is required' });
      return;
    }
    const requestedName = String(payload?.fileName || 'route-report.pdf');
    const fileName = requestedName.toLowerCase().endsWith('.pdf')
      ? requestedName
      : requestedName.replace(/\.html?$/i, '') + '.pdf';
    const pdfBuffer = await renderReportHtmlToPdf(html, fileName);
    sendPdf(response, pdfBuffer, fileName);
  }

  async function handleBackgroundFieldPrewarm(request, response) {
    const payload = await parseRequestBody(request);
    const scheduledBuckets = scheduleBackgroundFieldPrewarm(payload, { includeRequested: true });
    sendJson(response, 202, {
      status: 'scheduled',
      buckets: scheduledBuckets,
      enabled: Boolean(serverOptions.backgroundFieldPrewarm.enabled),
    });
  }

  const server = http.createServer(async (request, response) => {
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

      if (request.method === 'POST' && url.pathname === '/api/report/pdf') {
        await handleReportPdf(request, response);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/background-field/prewarm') {
        await handleBackgroundFieldPrewarm(request, response);
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

  if (serverOptions.backgroundFieldPrewarm.enabled) {
    setImmediate(() => {
      scheduleBackgroundFieldPrewarm();
    });
  }

  return server;
}

if (require.main === module) {
  const server = createSimServer({
    backgroundFieldPrewarm: true,
  });
  const port = Number(process.env.SIM_SERVER_PORT || 8891);
  server.listen(port, '127.0.0.1', () => {
    console.log(`sim-server listening on http://127.0.0.1:${port}`);
  });
}

module.exports = {
  createSimServer,
  createBackgroundPrewarmDeferredError,
  createHeatmapForegroundSchedulerState,
  createHeatmapWorkerScheduler,
  DEFAULT_BACKGROUND_FIELD_PREWARM_BUCKETS,
  isBackgroundPrewarmDeferredError,
  resolveHeatmapWorkerPoolOptions,
  resolveMonotonicJobProgress,
  resolveBackgroundFieldPrewarmOptions,
  shouldRunBackgroundFieldPrewarm,
};
