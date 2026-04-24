function getLlmProviderConfig() {
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
    return { id: 'deepseek', label: 'DeepSeek', requestLabel: 'DeepSeek' };
  }
  if (isMiniMaxCompatibleConfig(config)) {
    return { id: 'minimax', label: 'MiniMax', requestLabel: 'MiniMax' };
  }
  return null;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}

function isRetryableLlmStatus(statusCode) {
  return [408, 409, 429, 500, 502, 503, 504].includes(Number(statusCode || 0));
}

function buildDecisionPlanSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['summary_zh', 'summary_en', 'route_style', 'decisions'],
    properties: {
      summary_zh: { type: 'string' },
      summary_en: { type: 'string' },
      route_style: {
        type: 'object',
        additionalProperties: false,
        required: ['crowd_avoidance_bias', 'wall_avoidance_bias', 'centerline_bias'],
        properties: {
          crowd_avoidance_bias: { type: 'number' },
          wall_avoidance_bias: { type: 'number' },
          centerline_bias: { type: 'number' },
          turn_commitment_bias: { type: 'number' },
          hesitation_bias: { type: 'number' },
        },
      },
      anchors: {
        type: 'array',
        minItems: 0,
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['order', 'node_id', 'anchor_kind', 'label_zh', 'label_en'],
          properties: {
            order: { type: 'integer' },
            node_id: { type: 'string' },
            anchor_kind: { type: 'string' },
            label_zh: { type: 'string' },
            label_en: { type: 'string' },
            note_zh: { type: 'string' },
            note_en: { type: 'string' },
          },
        },
      },
      timeline: {
        type: 'array',
        minItems: 0,
        maxItems: 28,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['order', 'node_id', 'phase', 'thought_zh', 'thought_en', 'cue_zh', 'cue_en'],
          properties: {
            order: { type: 'integer' },
            node_id: { type: 'string' },
            phase: { type: 'string' },
            thought_zh: { type: 'string' },
            thought_en: { type: 'string' },
            cue_zh: { type: 'string' },
            cue_en: { type: 'string' },
          },
        },
      },
      decisions: {
        type: 'array',
        minItems: 0,
        maxItems: 8,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['order', 'decision_node_id', 'chosen_target_node_id', 'decision_zh', 'decision_en', 'reason_zh', 'reason_en', 'context_zh', 'context_en'],
          properties: {
            order: { type: 'integer' },
            decision_node_id: { type: 'string' },
            chosen_target_node_id: { type: 'string' },
            decision_zh: { type: 'string' },
            decision_en: { type: 'string' },
            reason_zh: { type: 'string' },
            reason_en: { type: 'string' },
            context_zh: { type: 'string' },
            context_en: { type: 'string' },
          },
        },
      },
    },
  };
}

function buildDecisionPlanSystemPrompt() {
  return [
    'You are generating a structured high-level decision plan for an elderly metro-station walking simulation.',
    'Return JSON only.',
    'Do not reveal hidden chain-of-thought or internal reasoning tokens.',
    'Use the provided candidate nodes only. Never invent node ids.',
    'Ground every sentence in the provided input: only reference nodes, pressure objects, and cues that appear in the provided input.',
    'Do not mention LCD, screens, train-arrival displays, or platform display panels unless allowedPressureMentions explicitly includes LCD or an LCD-like item.',
    'Do not say the passenger just got off a train, just alighted, or starts from a platform unless startContext.mayMentionAlighting is true.',
    'If the passenger checks an ordinary sign or common direction sign, describe it as an ordinary sign, not as LCD.',
    'Prefer the shorter accessible route unless a provided pressure, queue, crowd, fatigue, or accessibility constraint justifies a longer route.',
    'Each decision must choose exactly one target node from the provided candidate list.',
    'If there are no decision points, return an empty decisions array and still provide route_style, anchors, and timeline.',
    'Balance accessibility, queue burden, crowd density, fatigue, and wayfinding clarity.',
    'The route_style values must stay between 0 and 1.',
    'Make route_style strong enough to create a visibly distinct but still realistic walking trajectory.',
    'Use anchors for intermediate wayfinding checkpoints or attention shifts between decisions.',
    'Use timeline for short public-facing micro-thought entries that explain moment-to-moment hesitation or confidence without exposing hidden chain-of-thought.',
    'Write short bilingual text suitable for a dashboard decision log.',
    'Timeline thought text must sound like immediate, human, first-person-adjacent self-talk from the elderly passenger, not like a system summary or reporting template.',
    'Avoid robotic phrasing such as "generate plan", "route from start to target", or repeated template sentence structures.',
    'Prefer concrete moment-to-moment thoughts such as checking signs, pausing, reconfirming direction, slowing down, avoiding noise, or deciding whether to keep moving.',
    'When runtimeEvents is provided, timeline must be grounded primarily in those events. Mention short rests, seat search, sitting or standing rest, burden spikes, and route completion only when those event types are present.',
    'Do not claim arrival, completion, rest, seat search, signage checking, or burden reactions unless the corresponding runtimeEvents, decisionPoints, or allowedPressureMentions support it.',
    'For burden_spike events, respond to the provided dimension and topPressureSource rather than inventing a generic concern.',
  ].join(' ');
}

function buildDecisionPlanPromptShapeExample() {
  return {
    summary_zh: '...',
    summary_en: '...',
    route_style: {
      crowd_avoidance_bias: '0-1',
      wall_avoidance_bias: '0-1',
      centerline_bias: '0-1',
      turn_commitment_bias: '0-1',
      hesitation_bias: '0-1',
    },
    anchors: [{
      order: 1,
      node_id: '...',
      anchor_kind: 'scan',
      label_zh: '...',
      label_en: '...',
      note_zh: '...',
      note_en: '...',
    }],
    timeline: [{
      order: 1,
      node_id: '...',
      phase: 'hesitate',
      thought_zh: '...',
      thought_en: '...',
      cue_zh: '...',
      cue_en: '...',
    }],
    decisions: [{
      order: 1,
      decision_node_id: '...',
      chosen_target_node_id: '...',
      decision_zh: '...',
      decision_en: '...',
      reason_zh: '...',
      reason_en: '...',
      context_zh: '...',
      context_en: '...',
    }],
  };
}

function buildDecisionPlanUserPrompt(payload = {}) {
  const supportsAnchorGeneration = Boolean(payload?.routeContext?.supportsAnchorGeneration);
  const decisionPointCount = Math.max(0, Math.round(safeNumber(payload?.routeContext?.decisionPointCount, 0)));
  const pathLengthMeters = Math.max(0, safeNumber(payload?.routeContext?.pathLengthMeters, 0));
  const denseTimelineRequested = supportsAnchorGeneration && (pathLengthMeters >= 60 || decisionPointCount >= 2);
  const conditionalGuidance = supportsAnchorGeneration
    ? [
        'Because routeContext.supportsAnchorGeneration is true, do not treat this as a trivial straight path.',
        denseTimelineRequested
          ? 'Return at least 1 anchor and at least 8 timeline items unless the provided route data makes that impossible.'
          : 'Return at least 1 anchor and at least 4 timeline items unless the provided route data makes that impossible.',
        'Even when decisions[] is empty, anchors[] and timeline[] must still capture intermediate observation, hesitation, confirmation, or correction moments.',
        'Do not summarize the route as having "no decision points" only because classic decision nodes are sparse.',
        'Include human-like wayfinding moments such as checking signs, pausing near guidance, hesitating at branches, slowing down in uncertainty, or recovering after momentary confusion when the context suggests them.',
        'If the route is long, dense, noisy, or branch-heavy, keep the timeline granular rather than compressing it into only a few steps.',
      ].join(' ')
    : '';
  return [
    'Generate one cached high-level decision plan for this analysis request.',
    'Required JSON shape:',
    JSON.stringify(buildDecisionPlanPromptShapeExample()),
    'The anchors, timeline, and decisions arrays may be empty when the route has no intermediate checkpoints or decision points.',
    'anchors are intermediate checkpoints or attention shifts.',
    'timeline entries are brief public-facing micro-thoughts, not hidden reasoning.',
    'Write the timeline thoughts in a natural, human, moment-to-moment style rather than system-report language.',
    'Before writing any timeline item, check startContext and allowedPressureMentions. Do not invent "just got off", LCD, platform, or train-screen details when they are not explicitly allowed.',
    'If runtimeEvents is non-empty, use runtimeEvents as the factual source of the timeline. Cover the important runtime events in time order, especially seat_search_started, rest_state_changed, short_rest_started, burden_spike, route_completed, and route_incomplete.',
    'Use each runtime event node_id as the timeline node_id when describing that event.',
    conditionalGuidance,
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}

function extractFirstBalancedJsonObject(text = '') {
  const source = String(text || '');
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaping = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }
    if (char === '}') {
      if (depth <= 0) {
        continue;
      }
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  return '';
}

function stripMarkdownCodeFence(text = '') {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function trimTrailingComma(text = '') {
  return String(text || '').replace(/,\s*$/, '');
}

function repairJsonLikeText(text = '') {
  const source = String(text || '').trim();
  if (!source) {
    return '';
  }
  const contextStack = [];
  let repaired = '';
  let inString = false;
  let escaping = false;
  let stringRole = 'value';

  const currentContext = () => (contextStack.length ? contextStack[contextStack.length - 1] : null);
  const nextSignificantChar = (startIndex) => {
    for (let index = startIndex; index < source.length; index += 1) {
      const char = source[index];
      if (!/\s/.test(char)) {
        return char;
      }
    }
    return '';
  };
  const markValueComplete = () => {
    const context = currentContext();
    if (!context) {
      return;
    }
    if (context.type === 'object' && (context.state === 'valueOrEnd' || context.state === 'afterKey')) {
      context.state = 'afterValue';
      return;
    }
    if (context.type === 'array' && context.state === 'valueOrEnd') {
      context.state = 'afterValue';
    }
  };
  const popContext = (expectedType) => {
    if (!contextStack.length) {
      return false;
    }
    const context = currentContext();
    if (context.type !== expectedType) {
      return false;
    }
    contextStack.pop();
    markValueComplete();
    return true;
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaping) {
        if (char === '\r') {
          repaired += 'r';
        } else if (char === '\n') {
          repaired += 'n';
        } else if (char === '\t') {
          repaired += 't';
        } else {
          repaired += char;
        }
        escaping = false;
        continue;
      }
      if (char === '\\') {
        repaired += '\\';
        escaping = true;
        continue;
      }
      if (char === '"') {
        const nextChar = nextSignificantChar(index + 1);
        const shouldClose = stringRole === 'key'
          ? nextChar === ':'
          : (!nextChar || nextChar === ',' || nextChar === '}' || nextChar === ']');
        if (shouldClose) {
          repaired += '"';
          inString = false;
          if (stringRole === 'key') {
            const context = currentContext();
            if (context?.type === 'object') {
              context.state = 'afterKey';
            }
          } else {
            markValueComplete();
          }
          stringRole = 'value';
        } else {
          repaired += '\\"';
        }
        continue;
      }
      if (char === '\r') {
        repaired += '\\r';
        continue;
      }
      if (char === '\n') {
        repaired += '\\n';
        continue;
      }
      if (char === '\t') {
        repaired += '\\t';
        continue;
      }
      if (char < ' ') {
        repaired += ' ';
        continue;
      }
      repaired += char;
      continue;
    }

    if (char === '"') {
      const context = currentContext();
      stringRole = context?.type === 'object' && context.state === 'keyOrEnd' ? 'key' : 'value';
      repaired += '"';
      inString = true;
      escaping = false;
      continue;
    }
    if (char === '{') {
      repaired += char;
      contextStack.push({ type: 'object', state: 'keyOrEnd' });
      continue;
    }
    if (char === '[') {
      repaired += char;
      contextStack.push({ type: 'array', state: 'valueOrEnd' });
      continue;
    }
    if (char === '}') {
      repaired = trimTrailingComma(repaired);
      if (popContext('object')) {
        repaired += char;
      }
      continue;
    }
    if (char === ']') {
      repaired = trimTrailingComma(repaired);
      if (popContext('array')) {
        repaired += char;
      }
      continue;
    }
    if (char === ':') {
      repaired += char;
      const context = currentContext();
      if (context?.type === 'object') {
        context.state = 'valueOrEnd';
      }
      continue;
    }
    if (char === ',') {
      repaired = trimTrailingComma(repaired);
      repaired += char;
      const context = currentContext();
      if (context?.type === 'object') {
        context.state = 'keyOrEnd';
      } else if (context?.type === 'array') {
        context.state = 'valueOrEnd';
      }
      continue;
    }
    repaired += char;
  }

  if (escaping) {
    repaired += '\\';
  }
  if (inString) {
    repaired += '"';
    if (stringRole === 'key') {
      const context = currentContext();
      if (context?.type === 'object') {
        context.state = 'afterKey';
      }
    } else {
      markValueComplete();
    }
  }

  while (contextStack.length) {
    const context = contextStack.pop();
    repaired = trimTrailingComma(repaired);
    repaired += context.type === 'object' ? '}' : ']';
  }

  return repaired.trim();
}

function parseDecisionPlanJson(text = '') {
  const raw = String(text || '').trim();
  if (!raw) {
    throw new Error('LLM response did not include decision plan JSON');
  }
  const candidates = [];
  const pushCandidate = (value) => {
    const normalized = String(value || '').trim();
    if (normalized && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };
  pushCandidate(raw);
  const unfenced = stripMarkdownCodeFence(raw);
  pushCandidate(unfenced);
  pushCandidate(extractFirstBalancedJsonObject(raw));
  pushCandidate(extractFirstBalancedJsonObject(unfenced));
  pushCandidate(repairJsonLikeText(raw));
  pushCandidate(repairJsonLikeText(unfenced));
  pushCandidate(repairJsonLikeText(extractFirstBalancedJsonObject(raw)));
  pushCandidate(repairJsonLikeText(extractFirstBalancedJsonObject(unfenced)));
  let lastError = null;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Failed to parse decision plan JSON');
}

function buildDecisionPlanFailureAnalysis(provider, error) {
  const status = String(error instanceof Error ? error.message : (error || 'LLM decision plan unavailable')).trim()
    || 'LLM decision plan unavailable';
  const resolvedProvider = provider
    ? {
        ...provider,
        status,
        connected: false,
      }
    : {
        id: 'local-service',
        label: 'Local Service',
        status,
        connected: false,
      };
  return {
    analysisKind: 'decision-plan',
    title: 'Elderly Travel Decision Chain',
    placeholderZh: '本次分析未成功生成可用的 LLM 决策链，当前已保留失败状态供面板直接显示。',
    placeholderEn: 'The LLM decision chain was not generated successfully; the failure state is preserved for direct display.',
    placeholderSubZh: '问题发生在“开始分析”阶段，不会再额外触发旧的二次请求。',
    placeholderSubEn: 'The failure happened during the initial analysis pass, with no legacy second request.',
    summaryZh: 'LLM 决策链生成失败。',
    summaryEn: 'The LLM decision chain could not be generated.',
    provider: resolvedProvider,
    routeStyle: null,
    anchors: [],
    timeline: [],
    decisions: [],
    sections: [],
    failed: true,
    error: status,
  };
}

function buildDecisionPlanPendingAnalysis(provider, status) {
  const pendingStatus = String(status || '').trim()
    || 'Pending background refinement';
  const resolvedProvider = provider
    ? {
        ...provider,
        status: pendingStatus,
        connected: Boolean(provider.connected),
      }
    : {
        id: 'local-service',
        label: 'Local Service',
        status: pendingStatus,
        connected: false,
      };
  return {
    analysisKind: 'decision-plan',
    title: 'Elderly Travel Decision Chain',
    placeholderZh: 'LLM 决策链正在后台继续完善，当前先显示快速热力图结果。',
    placeholderEn: 'The LLM decision chain is still being refined in the background; the fast heatmap result is shown first.',
    placeholderSubZh: '本次首次分析不会等待 LLM 完成，完善后的结果会写入缓存供同参数后续直接复用。',
    placeholderSubEn: 'The first analysis pass does not wait for the LLM; the refined result is written to cache for later reuse.',
    summaryZh: 'LLM 决策链正在后台生成。',
    summaryEn: 'The LLM decision chain is being generated in the background.',
    provider: resolvedProvider,
    routeStyle: null,
    anchors: [],
    timeline: [],
    decisions: [],
    sections: [{
      titleZh: '后台完善中',
      titleEn: 'Background Refinement',
      items: [{
        labelZh: '状态',
        labelEn: 'Status',
        valueZh: '当前先显示快速结果，LLM 决策链会在后台生成并写入缓存。',
        valueEn: 'The fast result is shown first; the LLM decision chain is being generated in the background and will be cached.',
      }],
    }],
    pending: true,
    failed: false,
    error: '',
  };
}

async function requestChatCompletionJsonWithRetry(config, providerMeta, payload) {
  const maxAttempts = providerMeta?.id === 'deepseek' ? 2 : 1;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const requestBody = buildChatCompletionRequestBody(config, providerMeta, payload);
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      return {
        response,
        body,
      };
    }
    lastError = new Error(body?.error?.message || body?.error || `${providerMeta.requestLabel} request failed (${response.status})`);
    if (attempt >= maxAttempts || !isRetryableLlmStatus(response.status)) {
      throw lastError;
    }
    await sleep(providerMeta?.id === 'deepseek' ? 350 : 200);
  }
  throw lastError || new Error(`${providerMeta?.requestLabel || 'LLM'} request failed`);
}

function buildChatCompletionRequestBody(config, providerMeta, payload) {
  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: buildDecisionPlanSystemPrompt() },
      { role: 'user', content: buildDecisionPlanUserPrompt(payload) },
    ],
    max_tokens: providerMeta?.id === 'deepseek' ? 1400 : 2200,
    stream: false,
  };
  if (providerMeta?.id === 'deepseek') {
    body.response_format = { type: 'json_object' };
  }
  return body;
}

function normalizeDecisionPlanContent(parsed, provider) {
  const summaryZh = String(parsed?.summary_zh || parsed?.summaryZh || '').trim() || '已生成重点代理人的高层决策计划。';
  const summaryEn = String(parsed?.summary_en || parsed?.summaryEn || '').trim() || 'A high-level decision plan is ready for the focus agent.';
  const rawRouteStyle = parsed?.route_style || parsed?.routeStyle || {};
  const routeStyle = {
    crowdAvoidanceBias: Number(clamp(safeNumber(rawRouteStyle.crowd_avoidance_bias ?? rawRouteStyle.crowdAvoidanceBias, 0.72), 0, 1).toFixed(3)),
    wallAvoidanceBias: Number(clamp(safeNumber(rawRouteStyle.wall_avoidance_bias ?? rawRouteStyle.wallAvoidanceBias, 0.68), 0, 1).toFixed(3)),
    centerlineBias: Number(clamp(safeNumber(rawRouteStyle.centerline_bias ?? rawRouteStyle.centerlineBias, 0.64), 0, 1).toFixed(3)),
    turnCommitmentBias: Number(clamp(safeNumber(rawRouteStyle.turn_commitment_bias ?? rawRouteStyle.turnCommitmentBias, 0.58), 0, 1).toFixed(3)),
    hesitationBias: Number(clamp(safeNumber(rawRouteStyle.hesitation_bias ?? rawRouteStyle.hesitationBias, 0.46), 0, 1).toFixed(3)),
  };
  const anchors = (Array.isArray(parsed?.anchors) ? parsed.anchors : [])
    .map((item, index) => ({
      order: Math.max(1, Math.round(safeNumber(item?.order, index + 1))),
      nodeId: String(item?.node_id || item?.nodeId || '').trim(),
      anchorKind: String(item?.anchor_kind || item?.anchorKind || '').trim() || 'checkpoint',
      labelZh: String(item?.label_zh || item?.labelZh || '').trim(),
      labelEn: String(item?.label_en || item?.labelEn || '').trim(),
      noteZh: String(item?.note_zh || item?.noteZh || '').trim(),
      noteEn: String(item?.note_en || item?.noteEn || '').trim(),
    }))
    .filter((item) => item.nodeId && (item.labelZh || item.labelEn))
    .sort((left, right) => left.order - right.order)
    .slice(0, 12);
  const timeline = (Array.isArray(parsed?.timeline) ? parsed.timeline : [])
    .map((item, index) => ({
      order: Math.max(1, Math.round(safeNumber(item?.order, index + 1))),
      nodeId: String(item?.node_id || item?.nodeId || '').trim(),
      phase: String(item?.phase || '').trim() || 'progress',
      timeSeconds: Number.isFinite(safeNumber(item?.time_seconds ?? item?.timeSeconds, Number.NaN))
        ? Number(safeNumber(item?.time_seconds ?? item?.timeSeconds, 0).toFixed(2))
        : null,
      progress: Number.isFinite(safeNumber(item?.progress, Number.NaN))
        ? Number(clamp(safeNumber(item?.progress, 0), 0, 1).toFixed(3))
        : null,
      runtimeEventType: String(item?.runtime_event_type || item?.runtimeEventType || '').trim() || null,
      runtimeRestState: String(item?.runtime_rest_state || item?.runtimeRestState || '').trim() || null,
      thoughtZh: String(item?.thought_zh || item?.thoughtZh || '').trim(),
      thoughtEn: String(item?.thought_en || item?.thoughtEn || '').trim(),
      cueZh: String(item?.cue_zh || item?.cueZh || '').trim(),
      cueEn: String(item?.cue_en || item?.cueEn || '').trim(),
    }))
    .filter((item) => item.nodeId && (item.thoughtZh || item.thoughtEn || item.cueZh || item.cueEn))
    .sort((left, right) => left.order - right.order)
    .slice(0, 24);
  const decisions = (Array.isArray(parsed?.decisions) ? parsed.decisions : [])
    .map((item, index) => ({
      order: Math.max(1, Math.round(safeNumber(item?.order, index + 1))),
      decisionNodeId: String(item?.decision_node_id || item?.decisionNodeId || '').trim(),
      chosenTargetNodeId: String(item?.chosen_target_node_id || item?.chosenTargetNodeId || '').trim(),
      titleZh: `Decision ${Math.max(1, Math.round(safeNumber(item?.order, index + 1))).toString().padStart(2, '0')}`,
      titleEn: `Decision ${Math.max(1, Math.round(safeNumber(item?.order, index + 1))).toString().padStart(2, '0')}`,
      decisionZh: String(item?.decision_zh || item?.decisionZh || '').trim(),
      decisionEn: String(item?.decision_en || item?.decisionEn || '').trim(),
      reasonZh: String(item?.reason_zh || item?.reasonZh || '').trim(),
      reasonEn: String(item?.reason_en || item?.reasonEn || '').trim(),
      contextZh: String(item?.context_zh || item?.contextZh || '').trim(),
      contextEn: String(item?.context_en || item?.contextEn || '').trim(),
    }))
    .filter((item) => item.decisionNodeId && item.chosenTargetNodeId && (item.decisionZh || item.decisionEn))
    .sort((left, right) => left.order - right.order)
    .slice(0, 8);

  const sections = decisions.map((item) => ({
    titleZh: item.titleZh,
    titleEn: item.titleEn,
    items: [
      {
        labelZh: 'Decision',
        labelEn: 'Decision',
        valueZh: item.decisionZh || item.decisionEn || '--',
        valueEn: item.decisionEn || item.decisionZh || '--',
      },
      {
        labelZh: 'Reason',
        labelEn: 'Reason',
        valueZh: item.reasonZh || item.reasonEn || '--',
        valueEn: item.reasonEn || item.reasonZh || '--',
      },
      {
        labelZh: 'Context',
        labelEn: 'Context',
        valueZh: item.contextZh || item.contextEn || '--',
        valueEn: item.contextEn || item.contextZh || '--',
      },
    ],
    decisionNodeId: item.decisionNodeId,
    chosenTargetNodeId: item.chosenTargetNodeId,
  }));

  return {
    analysisKind: 'decision-plan',
    title: 'Elderly Travel Decision Chain',
    placeholderZh: summaryZh,
    placeholderEn: summaryEn,
    placeholderSubZh: '由开始分析阶段的单次 LLM 决策生成。',
    placeholderSubEn: 'Generated from the single LLM decision pass during analysis startup.',
    summaryZh,
    summaryEn,
    provider,
    routeStyle,
    anchors,
    timeline,
    decisions,
    sections,
  };
}

async function requestLlmDecisionPlan(payload = {}) {
  const config = getLlmProviderConfig();
  const chatCompatibleProvider = getChatCompatibleProviderMeta(config);
  if (!config.enabled) {
    const provider = {
      id: 'local-service',
      label: 'Local Service',
      status: 'No OPENAI_API_KEY configured on the local service',
      connected: false,
    };
    return {
      connected: false,
      provider,
      analysis: buildDecisionPlanFailureAnalysis(provider, provider.status),
    };
  }

  const provider = chatCompatibleProvider
    ? {
        id: chatCompatibleProvider.id,
        label: chatCompatibleProvider.label,
        status: config.model,
        connected: true,
      }
    : {
        id: 'openai',
        label: 'OpenAI',
        status: config.model,
        connected: true,
      };

  try {
    if (chatCompatibleProvider) {
      const { body } = await requestChatCompletionJsonWithRetry(config, chatCompatibleProvider, payload);
      const outputText = extractChatCompletionText(body);
      if (!outputText) {
        throw new Error(`${chatCompatibleProvider.requestLabel} response did not include chat completion text`);
      }
      return {
        connected: true,
        provider,
        analysis: normalizeDecisionPlanContent(parseDecisionPlanJson(outputText), provider),
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
            content: [{ type: 'input_text', text: buildDecisionPlanSystemPrompt() }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: buildDecisionPlanUserPrompt(payload) }],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'focus_agent_decision_plan',
            schema: buildDecisionPlanSchema(),
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
    return {
      connected: true,
      provider,
      analysis: normalizeDecisionPlanContent(parseDecisionPlanJson(outputText), provider),
    };
  } catch (error) {
    const failedProvider = {
      ...provider,
      status: String(error instanceof Error ? error.message : error || provider.status || '').trim() || provider.status,
      connected: false,
    };
    return {
      connected: false,
      provider: failedProvider,
      analysis: buildDecisionPlanFailureAnalysis(failedProvider, error),
    };
  }
}

module.exports = {
  buildDecisionPlanFailureAnalysis,
  buildDecisionPlanPendingAnalysis,
  getLlmProviderConfig,
  parseDecisionPlanJson,
  requestLlmDecisionPlan,
  __private: {
    buildDecisionPlanSchema,
    buildDecisionPlanUserPrompt,
    normalizeDecisionPlanContent,
    buildChatCompletionRequestBody,
    repairJsonLikeText,
  },
};
