const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const {
  buildHeatmapCacheKey,
  readHeatmapCache,
  writeHeatmapCache,
} = require('./heatmap-cache.js');
const {
  buildDecisionPlanFailureAnalysis,
  buildDecisionPlanPendingAnalysis,
  requestLlmDecisionPlan,
  getLlmProviderConfig,
} = require('./llm-decision-plan.js');

const HEATMAP_ENGINE_VERSION = 'node-cache-v48';
const BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v27';
const BACKGROUND_FIELD_BUCKET_CROWD_COUNTS = Object.freeze([500, 1000, 1500, 2000]);
const BACKGROUND_FIELD_FRAME_STEP_SECONDS = 0.42;
const BACKGROUND_FIELD_MAX_SIMULATION_SECONDS = 180;
const FOCUS_HEATMAP_MAX_SIMULATION_SECONDS = 1800;
const SERVER_PREVIEW_FRAME_BUDGET_MS = 180;
const SERVER_FINAL_FRAME_BUDGET_MS = 72;
const SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MULTIPLIER = 1.9;
const SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MAX_SECONDS = 1.08;
const SERVER_PREVIEW_BACKGROUND_MAX_SIMULATION_SECONDS = 108;
const SERVER_PREVIEW_FOCUS_STEP_SECONDS = 1.8;

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveRootDir(rootDir) {
  return rootDir || path.join(__dirname, '..');
}

function loadRequestData(payload, options = {}) {
  const rootDir = resolveRootDir(options.rootDir);
  return {
    simData: payload?.simData || readJsonFile(path.join(rootDir, 'data', 'default-sim.json')),
    healthyAgents: payload?.healthyAgents || readJsonFile(path.join(rootDir, 'data', 'healthy-agents.json')),
  };
}

function normalizeBackgroundCrowdCount(value) {
  const count = Math.round(Number(value || 0));
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getConfiguredBackgroundCrowdBuckets(options = {}) {
  const source = Array.isArray(options?.backgroundCrowdBuckets) && options.backgroundCrowdBuckets.length
    ? options.backgroundCrowdBuckets
    : BACKGROUND_FIELD_BUCKET_CROWD_COUNTS;
  return Array.from(new Set(
    source
      .map((value) => normalizeBackgroundCrowdCount(value))
      .filter((value) => value > 0)
  )).sort((a, b) => a - b);
}

function resolveBackgroundFieldBucketCrowdCount(backgroundCrowdCount, options = {}) {
  const requested = normalizeBackgroundCrowdCount(backgroundCrowdCount);
  const buckets = getConfiguredBackgroundCrowdBuckets(options);
  if (!requested || !buckets.length) {
    return requested;
  }
  if (requested < buckets[0] || requested > buckets[buckets.length - 1]) {
    return requested;
  }
  let resolved = buckets[0];
  let bestDistance = Math.abs(requested - resolved);
  for (let index = 1; index < buckets.length; index += 1) {
    const candidate = buckets[index];
    const distance = Math.abs(requested - candidate);
    if (distance < bestDistance || (distance === bestDistance && candidate < resolved)) {
      resolved = candidate;
      bestDistance = distance;
    }
  }
  return resolved;
}

function buildHeatmapRequestFingerprint(payload, options = {}) {
  const { simData, healthyAgents } = loadRequestData(payload, options);
  const llmProvider = getLlmProviderConfig();
  return {
    simData,
    healthyAgents,
    scenarioOptions: payload?.scenarioOptions || {},
    heatOptions: payload?.heatOptions || {},
    llmProvider: {
      enabled: Boolean(llmProvider?.enabled),
      model: llmProvider?.enabled ? String(llmProvider.model || '') : '',
      baseUrl: llmProvider?.enabled ? String(llmProvider.baseUrl || '') : '',
    },
    rulesVersion: Sim.getUnifiedRules?.()?.version || 'unknown',
    engineVersion: HEATMAP_ENGINE_VERSION,
  };
}

function getBackgroundFieldScenarioOptions(payload, prepared = null, options = {}) {
  const scenarioOptions = payload?.scenarioOptions || {};
  const resolvedBackgroundCrowdCount = resolveBackgroundFieldBucketCrowdCount(
    scenarioOptions.backgroundCrowdCount,
    options
  );
  const canonicalRoute = Array.isArray(prepared?.focusRoutePresets)
    ? prepared.focusRoutePresets.find((preset) => preset?.id && prepared.focusRoutePresetById?.[preset.id])
    : null;
  if (canonicalRoute?.id) {
    return {
      crowdPresetId: scenarioOptions.crowdPresetId || 'normal',
      backgroundCrowdCount: resolvedBackgroundCrowdCount || scenarioOptions.backgroundCrowdCount,
      focusRouteId: canonicalRoute.id,
      focusProfile: {},
    };
  }
  return {
    crowdPresetId: scenarioOptions.crowdPresetId || 'normal',
    backgroundCrowdCount: resolvedBackgroundCrowdCount || scenarioOptions.backgroundCrowdCount,
    startPoint: scenarioOptions.startPoint,
    targetRegionId: scenarioOptions.targetRegionId,
    focusProfile: {},
  };
}

function getBackgroundFieldHeatOptions(payload, mode = 'final', options = {}) {
  const backgroundCrowdCount = Number(
    options?.resolvedBackgroundCrowdCount
    || payload?.scenarioOptions?.backgroundCrowdCount
    || 0
  );
  const minimumSimulationSeconds = Math.max(0, Number(options?.minimumSimulationSeconds || 0));
  const frameStepSeconds = backgroundCrowdCount > 1800
    ? 1.8
    : backgroundCrowdCount > 900
      ? 1.35
      : backgroundCrowdCount > 400
        ? 1.05
        : BACKGROUND_FIELD_FRAME_STEP_SECONDS;
  const visualFrameStepSeconds = backgroundCrowdCount > 1800
    ? 2.4
    : backgroundCrowdCount > 900
      ? 1.8
      : backgroundCrowdCount > 400
        ? 1.35
        : 0.9;
  const resolvedFrameStepSeconds = mode === 'preview'
    ? Math.min(
        SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MAX_SECONDS,
        Math.max(BACKGROUND_FIELD_FRAME_STEP_SECONDS, frameStepSeconds * SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MULTIPLIER)
      )
    : frameStepSeconds;
  const resolvedVisualFrameStepSeconds = mode === 'preview'
    ? Math.max(visualFrameStepSeconds, resolvedFrameStepSeconds)
    : visualFrameStepSeconds;
  return {
    maxSimulationSeconds: Math.min(
      BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
      Math.max(
        30,
        minimumSimulationSeconds,
        Math.min(
          mode === 'preview' ? SERVER_PREVIEW_BACKGROUND_MAX_SIMULATION_SECONDS : BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
          Number(
            options?.maxSimulationSecondsOverride
            || BACKGROUND_FIELD_MAX_SIMULATION_SECONDS
          )
        )
      )
    ),
    frameStepSeconds: resolvedFrameStepSeconds,
    visualFrameStepSeconds: resolvedVisualFrameStepSeconds,
  };
}

function estimateBackgroundFieldBudgetSeconds(scenario, requestedSeconds) {
  const requested = Math.max(30, Number(requestedSeconds || 0));
  const pathLength = Number(scenario?.focusAgent?.pathLength || scenario?.focusRoute?.pathLength || 0);
  const walkingSpeed = Math.max(0.15, Number(scenario?.focusAgent?.profile?.walkingSpeed || 0.9));
  const baseTravelSeconds = pathLength > 0 ? pathLength / walkingSpeed : 0;
  const recommended = Math.ceil((Math.max(baseTravelSeconds, 0) * 1.18 + 24) / 12) * 12;
  return Math.max(36, Math.min(BACKGROUND_FIELD_MAX_SIMULATION_SECONDS, Math.max(requested, recommended || requested)));
}

function buildBackgroundFieldFingerprint(payload, options = {}) {
  const { simData, healthyAgents } = loadRequestData(payload, options);
  const prepared = options?.prepared || Sim.prepareSimData(simData, { healthyAgents });
  const backgroundScenarioOptions = getBackgroundFieldScenarioOptions(payload, prepared, options);
  return {
    simData,
    healthyAgents,
    scenarioOptions: backgroundScenarioOptions,
    heatOptions: getBackgroundFieldHeatOptions(payload, options?.mode === 'preview' ? 'preview' : 'final', {
      resolvedBackgroundCrowdCount: Number(backgroundScenarioOptions.backgroundCrowdCount || 0),
      maxSimulationSecondsOverride: options?.maxSimulationSecondsOverride,
    }),
    rulesVersion: Sim.getUnifiedRules?.()?.version || 'unknown',
    engineVersion: BACKGROUND_FIELD_ENGINE_VERSION,
  };
}

function getFocusPlaybackHeatOptions(payload, scenario, mode = 'final') {
  const heatOptions = payload?.heatOptions || {};
  const resolved = {
    ...heatOptions,
    maxSimulationSeconds: estimateFocusHeatmapBudgetSeconds(scenario, heatOptions.maxSimulationSeconds),
    maxExtendedSimulationSeconds: mode === 'preview'
      ? estimateFocusHeatmapBudgetSeconds(scenario, heatOptions.maxSimulationSeconds)
      : FOCUS_HEATMAP_MAX_SIMULATION_SECONDS,
  };
  if (mode === 'preview') {
    resolved.precomputeStepSeconds = Math.max(
      SERVER_PREVIEW_FOCUS_STEP_SECONDS,
      Number(heatOptions.precomputeStepSeconds || 0)
    );
  }
  return resolved;
}

function cloneNumericArray(values) {
  return Array.isArray(values) ? values.map((value) => Number(value || 0)) : [];
}

function serializeHeatState(heat) {
  return {
    cells: Array.isArray(heat?.cells) ? heat.cells.map((cell) => ({ ...cell })) : [],
    maxHeat: Number(heat?.maxHeat || 0),
    totalDeposits: Number(heat?.totalDeposits || 0),
  };
}

function serializePlaybackPoint(point, fallback = null) {
  const source = point || fallback;
  if (!source) {
    return null;
  }
  return {
    x: Number(source.x || 0),
    y: Number(source.y || 0),
  };
}

function serializeBackgroundPlaybackAgent(agent) {
  return {
    id: agent?.id || null,
    active: Boolean(agent?.active),
    backgroundState: agent?.backgroundState || 'moving',
    position: serializePlaybackPoint(agent?.position),
  };
}

function serializeBackgroundPlaybackField(backgroundField, options = {}) {
  if (!backgroundField) {
    return null;
  }
  const rawFrames = Array.isArray(backgroundField.frames) ? backgroundField.frames : [];
  const frameStride = 1;
  const sampledFrames = rawFrames.filter((frame, index) => (
    index === 0
    || index === rawFrames.length - 1
    || index % frameStride === 0
  ));
  return {
    version: backgroundField.version || 'background-field-playback',
    duration: Number(backgroundField.duration || 0),
    maxSimulationSeconds: Number(backgroundField.maxSimulationSeconds || 0),
    frameStepSeconds: Number(backgroundField.frameStepSeconds || 0),
    visualFrameStepSeconds: Number(backgroundField.visualFrameStepSeconds || backgroundField.frameStepSeconds || 0),
    initialTime: Number(backgroundField.initialTime || 0),
    initialAgents: Array.isArray(backgroundField.initialAgents)
      ? backgroundField.initialAgents.map((agent) => serializeBackgroundPlaybackAgent(agent))
      : [],
    frames: sampledFrames.map((frame) => ({
          time: Number(frame?.time || 0),
          agents: Array.isArray(frame?.agents)
            ? frame.agents.map((agent) => serializeBackgroundPlaybackAgent(agent))
            : [],
        })),
    summary: {
      ...(backgroundField.summary ? { ...backgroundField.summary } : {}),
      playbackFrameStride: frameStride,
      playbackFrameCount: sampledFrames.length,
    },
  };
}

function serializePlaybackResult(playback, meta = {}) {
  return {
    cacheHit: Boolean(meta.cacheHit),
    heat: {
      traceSnapshots: Array.isArray(playback?.traceSnapshots) ? playback.traceSnapshots.map((item) => ({ ...item })) : [],
      pressureContributionLog: Array.isArray(playback?.pressureContributionLog) ? playback.pressureContributionLog.map((item) => ({ ...item })) : [],
      influenceContributionLog: Array.isArray(playback?.influenceContributionLog) ? playback.influenceContributionLog.map((item) => ({ ...item })) : [],
      pressureRange: playback?.pressureRange ? { ...playback.pressureRange } : { min: 0, max: 0 },
      duration: Number(playback?.duration || 0),
      startTime: Number(playback?.startTime || 0),
      endTime: Number(playback?.endTime || 0),
      heat: serializeHeatState(playback?.heat),
      hotspots: Array.isArray(playback?.hotspots) ? playback.hotspots.map((item) => ({ ...item })) : [],
      suggestions: Array.isArray(playback?.suggestions) ? playback.suggestions.slice() : [],
      summary: playback?.summary ? { ...playback.summary } : null,
      backgroundField: serializeBackgroundPlaybackField(playback?.backgroundField, {
        simulatedCrowdCount: meta.simulatedCrowdCount,
      }),
      llmDecisionPlan: playback?.llmDecisionPlan ? JSON.parse(JSON.stringify(playback.llmDecisionPlan)) : null,
    },
    summary: playback?.summary ? { ...playback.summary } : null,
    meta: {
      durationMs: Number(meta.durationMs || 0),
      cacheKey: meta.cacheKey || null,
      backgroundCacheKey: meta.backgroundCacheKey || null,
      backgroundCacheHit: Boolean(meta.backgroundCacheHit),
      backgroundDurationMs: Number(meta.backgroundDurationMs || 0),
      engineVersion: HEATMAP_ENGINE_VERSION,
      backgroundFieldEngineVersion: BACKGROUND_FIELD_ENGINE_VERSION,
      simulatedRouteId: meta.simulatedRouteId || null,
      focusRoutePresetId: meta.focusRoutePresetId || null,
      focusTargetRegionId: meta.focusTargetRegionId || null,
      simulatedCrowdCount: Number(meta.simulatedCrowdCount || 0),
      resultQuality: meta.resultQuality || 'final',
      refinementPending: Boolean(meta.refinementPending),
      llmDeferred: Boolean(meta.llmDeferred),
      llmDecisionPlan: meta.llmDecisionPlan ? JSON.parse(JSON.stringify(meta.llmDecisionPlan)) : null,
    },
  };
}

function getConfiguredDecisionPlanProvider() {
  const config = getLlmProviderConfig();
  const enabled = Boolean(config?.enabled);
  if (!enabled) {
    return {
      enabled: false,
      provider: {
        id: 'local-service',
        label: 'Local Service',
        status: 'No OPENAI_API_KEY configured on the local service',
        connected: false,
      },
    };
  }
  let providerId = 'openai';
  let providerLabel = 'OpenAI';
  const baseUrl = String(config?.baseUrl || '');
  const model = String(config?.model || '');
  if (/deepseek\.com/i.test(baseUrl) || /^deepseek-/i.test(model)) {
    providerId = 'deepseek';
    providerLabel = 'DeepSeek';
  } else if (
    /api\.minimax\.io\/v1/i.test(baseUrl)
    || /api\.minimaxi\.com\/v1/i.test(baseUrl)
    || /^abab/i.test(model)
    || /^minimax/i.test(model)
  ) {
    providerId = 'minimax';
    providerLabel = 'MiniMax';
  }
  return {
    enabled: true,
    provider: {
      id: providerId,
      label: providerLabel,
      status: model,
      connected: true,
    },
  };
}

function getNodeLabel(node) {
  return String(
    node?.labelZh
    || node?.labelEn
    || node?.name
    || node?.id
    || ''
  ).trim();
}

function getNodeContextLabel(prepared, node) {
  const baseLabel = getNodeLabel(node);
  if (!prepared || !node?.id || !Array.isArray(prepared.targetRegions)) {
    return baseLabel;
  }
  const region = prepared.targetRegions.find((item) => (
    Array.isArray(item?.nodeIds) && item.nodeIds.includes(node.id)
  ));
  const regionLabel = String(region?.labelEn || region?.labelZh || region?.id || '').trim();
  if (!regionLabel || regionLabel === baseLabel) {
    return baseLabel;
  }
  return `${regionLabel} / ${baseLabel}`;
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, safeNumber(value, min)));
}

function findNearestNode(prepared, point, maxDistance = 2.2) {
  if (!prepared || !point || !Array.isArray(prepared.nodes)) {
    return null;
  }
  let best = null;
  prepared.nodes.forEach((node) => {
    const distance = Math.hypot(Number(node.x || 0) - Number(point.x || 0), Number(node.y || 0) - Number(point.y || 0));
    if (!Number.isFinite(distance) || distance > maxDistance) {
      return;
    }
    if (!best || distance < best.distance) {
      best = { node, distance };
    }
  });
  return best?.node || null;
}

function classifyStartContext(prepared, node, startPoint) {
  const label = getNodeContextLabel(prepared, node);
  const text = `${node?.id || ''} ${label}`.toLowerCase();
  const isExitOrGate = /\bexit\b|出口|gate|闸机/.test(text);
  const isTrainLike = /train|platform|boarding|alighting|乘车|上车|下车|月台|站台|港岛线|荃湾线|kennedy|tsuen wan/.test(text)
    && !isExitOrGate;
  return {
    nodeId: node?.id || null,
    label: label || node?.id || null,
    kind: isTrainLike ? 'train_or_platform' : (isExitOrGate ? 'exit_or_gate' : 'custom_or_concourse'),
    mayMentionAlighting: Boolean(isTrainLike),
    point: startPoint ? {
      x: Number(startPoint.x || 0),
      y: Number(startPoint.y || 0),
      z: Number(startPoint.z || 0),
    } : null,
  };
}

function collectAllowedPressureMentions(humanContext, decisionPoints) {
  const byKey = new Map();
  const addSource = (source) => {
    if (!source) {
      return;
    }
    const id = String(source.id || source.pressurePointId || '').trim();
    const name = String(source.name || source.label || id || '').trim();
    const category = String(source.category || source.sourceKind || '').trim();
    const feature = String(source.feature || '').trim();
    const key = id || `${name}:${category}:${feature}`;
    if (!key || byKey.has(key)) {
      return;
    }
    byKey.set(key, {
      id: id || null,
      name: name || null,
      category: category || null,
      feature: feature || null,
    });
  };
  (humanContext?.environmentContext?.sampleSummaries || []).forEach((sample) => {
    (sample?.topPressureSources || []).forEach(addSource);
  });
  (decisionPoints || []).forEach((decision) => {
    (decision?.llmContext?.nearbyPressureSources || []).forEach(addSource);
    (decision?.llmContext?.topPressureSources || []).forEach(addSource);
  });
  return Array.from(byKey.values()).slice(0, 24);
}

function collectRuntimePressureMentions(runtimeEvents) {
  const byKey = new Map();
  (Array.isArray(runtimeEvents) ? runtimeEvents : []).forEach((event) => {
    const source = event?.topPressureSource || null;
    if (!source) {
      return;
    }
    const id = String(source.id || source.pressurePointId || '').trim();
    const name = String(source.name || source.label || id || '').trim();
    const category = String(source.category || source.sourceKind || '').trim();
    const feature = String(source.feature || '').trim();
    const key = id || `${name}:${category}:${feature}`;
    if (!key || byKey.has(key)) {
      return;
    }
    byKey.set(key, {
      id: id || null,
      name: name || null,
      category: category || null,
      feature: feature || null,
    });
  });
  return Array.from(byKey.values());
}

function getSnapshotFatiguePercent(snapshot) {
  const threshold = Math.max(1, safeNumber(snapshot?.fatigueThreshold, 100));
  return clamp((safeNumber(snapshot?.fatigue, 0) / threshold) * 100, 0, 100);
}

const RUNTIME_BURDEN_THRESHOLDS = Object.freeze({
  locomotor: [60, 75],
  sensory: [60, 75],
  cognitive: [60, 75],
  psychological: [60, 75],
  vitality: [45, 60, 75, 90],
});

function serializeRuntimePressureSource(source = null) {
  if (!source) {
    return null;
  }
  return {
    id: source.id || null,
    name: source.name || null,
    category: source.category || null,
    feature: source.feature || null,
    score: Number(safeNumber(source.score, source.pressure || source.influence || 0).toFixed(3)),
    burdenType: source.burdenType || null,
    sourceKind: source.sourceKind || null,
  };
}

function getRuntimeEventPressureSource(snapshot, dimension = '') {
  const sources = Array.isArray(snapshot?.topPressureSources) ? snapshot.topPressureSources : [];
  if (!sources.length) {
    return null;
  }
  const normalizedDimension = String(dimension || '').trim();
  const matched = normalizedDimension
    ? sources.find((source) => String(source?.burdenType || '').trim() === normalizedDimension)
    : null;
  return serializeRuntimePressureSource(matched || sources[0]);
}

function makeRuntimeEventNodeId(snapshot, index, total) {
  const explicitNodeId = String(
    snapshot?.activeDecisionNodeId
    || snapshot?.decisionDiagnostics?.decisionNodeId
    || ''
  ).trim();
  if (explicitNodeId) {
    return explicitNodeId;
  }
  const progress = clamp(snapshot?.progress, 0, 1);
  const sampleOrder = Math.max(1, Math.round(progress * Math.max(1, Math.min(12, total || 1))) + 1);
  return `path_sample_${sampleOrder}`;
}

function createRuntimeEvent(type, snapshot, index, total, extra = {}) {
  return {
    type,
    eventId: `${type}_${String(index + 1).padStart(3, '0')}`,
    node_id: makeRuntimeEventNodeId(snapshot, index, total),
    timeSeconds: Number(safeNumber(snapshot?.time, 0).toFixed(2)),
    progress: Number(clamp(snapshot?.progress, 0, 1).toFixed(3)),
    x: Number(safeNumber(snapshot?.x, 0).toFixed(3)),
    y: Number(safeNumber(snapshot?.y, 0).toFixed(3)),
    walkingSpeed: Number(safeNumber(snapshot?.currentWalkingSpeed ?? snapshot?.walkingSpeed, 0).toFixed(3)),
    fatiguePercent: Number(getSnapshotFatiguePercent(snapshot).toFixed(1)),
    restState: snapshot?.restState || 'none',
    restMode: snapshot?.restMode || null,
    topBurdenId: snapshot?.topBurdenId || null,
    burdenScores: snapshot?.burdenScores ? { ...snapshot.burdenScores } : null,
    topPressureSource: getRuntimeEventPressureSource(snapshot, extra.dimension || snapshot?.topBurdenId || ''),
    ...extra,
  };
}

function buildRuntimeEventsFromPlayback(playback) {
  const snapshots = Array.isArray(playback?.traceSnapshots)
    ? playback.traceSnapshots.filter(Boolean)
    : [];
  if (!snapshots.length) {
    return [];
  }
  const events = [];
  let previousRestState = 'none';
  let finalApproachSeen = false;
  let slowWalkSeen = false;
  const guidancePauseSeen = new Set();
  const burdenSpikeSeen = new Set();
  snapshots.forEach((snapshot, index) => {
    const restState = String(snapshot?.restState || 'none');
    const currentWalkingSpeed = safeNumber(snapshot?.currentWalkingSpeed ?? snapshot?.walkingSpeed, 0);
    const decisionDiagnostics = snapshot?.decisionDiagnostics || null;
    const decisionNodeId = String(decisionDiagnostics?.decisionNodeId || snapshot?.activeDecisionNodeId || '').trim();
    const interactionSourceId = String(snapshot?.decisionInteractionSourceId || '').trim();
    const interactionState = String(snapshot?.decisionInteractionState || '').trim();
    const interactionMode = String(snapshot?.decisionInteractionMode || '').trim();
    const hasGuidanceContext = Boolean(
      decisionNodeId
      && (
        safeNumber(decisionDiagnostics?.problemSignCount, 0) > 0
        || safeNumber(decisionDiagnostics?.guideReviewPauseTime, 0) > 0
        || safeNumber(decisionDiagnostics?.recheckProbability, 0) >= 0.12
        || safeNumber(decisionDiagnostics?.branchCount, 0) > 1
      )
    );
    const snapshotProgress = safeNumber(snapshot?.progress, 0);
    const isTerminalSnapshot = Boolean(snapshot?.playbackComplete || snapshotProgress >= 0.985);
    if (
      !isTerminalSnapshot
      && interactionState === 'pause'
      && interactionSourceId
      && !guidancePauseSeen.has(interactionSourceId)
    ) {
      guidancePauseSeen.add(interactionSourceId);
      events.push(createRuntimeEvent('guidance_pause', snapshot, index, snapshots.length, {
        decisionNodeId: interactionSourceId,
        reason: interactionMode || 'decision_interaction',
        sourceId: interactionSourceId,
      }));
    }
    if (restState === 'none' && !isTerminalSnapshot && currentWalkingSpeed <= 0.05 && hasGuidanceContext && !guidancePauseSeen.has(decisionNodeId)) {
      guidancePauseSeen.add(decisionNodeId);
      events.push(createRuntimeEvent('guidance_pause', snapshot, index, snapshots.length, {
        decisionNodeId,
        reason: 'guidance_check',
        problemSignCount: Number(safeNumber(decisionDiagnostics?.problemSignCount, 0).toFixed(1)),
        branchCount: Number(safeNumber(decisionDiagnostics?.branchCount, 0).toFixed(1)),
      }));
    }
    if (snapshot?.shortRestMarker) {
      events.push(createRuntimeEvent('short_rest_started', snapshot, index, snapshots.length, {
        thresholdPercent: Number(safeNumber(snapshot.shortRestMarker.thresholdPercent, 0).toFixed(1)),
      }));
    }
    if (
      !slowWalkSeen
      && restState === 'none'
      && currentWalkingSpeed > 0.05
      && currentWalkingSpeed <= 0.35
      && safeNumber(snapshot?.progress, 0) > 0.05
    ) {
      slowWalkSeen = true;
      events.push(createRuntimeEvent('slow_walk', snapshot, index, snapshots.length, {
        reason: 'low_speed',
      }));
    }
    if (restState !== previousRestState && restState !== 'none') {
      const type = restState === 'searching'
        ? 'seat_search_started'
        : restState === 'sitting'
          ? 'seat_rest_started'
          : 'rest_state_changed';
      if (restState === 'short-rest' && snapshot?.shortRestMarker) {
        previousRestState = restState;
        return;
      }
      events.push(createRuntimeEvent(type, snapshot, index, snapshots.length, {
        restState,
        restMode: snapshot?.restMode || restState,
        nearbySeatCount: Array.isArray(snapshot?.nearbySeats) ? snapshot.nearbySeats.length : 0,
        nearestSeatDistance: Array.isArray(snapshot?.nearbySeats) && snapshot.nearbySeats.length
          ? Number(safeNumber(snapshot.nearbySeats[0].distance, 0).toFixed(2))
          : null,
      }));
    }
    if (restState === 'none' && previousRestState && previousRestState !== 'none') {
      events.push(createRuntimeEvent('rest_resumed', snapshot, index, snapshots.length, {
        previousRestState,
      }));
    }
    if (
      !finalApproachSeen
      && restState === 'none'
      && safeNumber(snapshot?.progress, 0) >= 0.9
    ) {
      finalApproachSeen = true;
      events.push(createRuntimeEvent('final_approach', snapshot, index, snapshots.length, {
        reason: 'near_destination',
      }));
    }
    previousRestState = restState;

    Object.entries(snapshot?.burdenScores || {}).forEach(([dimension, value]) => {
      const score = safeNumber(value, 0);
      const thresholds = RUNTIME_BURDEN_THRESHOLDS[dimension] || [60, 75];
      thresholds.forEach((threshold) => {
        const key = `${dimension}:${threshold}`;
        if (score < threshold || burdenSpikeSeen.has(key)) {
          return;
        }
        burdenSpikeSeen.add(key);
        events.push(createRuntimeEvent('burden_spike', snapshot, index, snapshots.length, {
          dimension,
          score: Number(score.toFixed(1)),
          threshold,
          intensity: threshold >= 75 ? 'high' : 'moderate',
          topPressureSource: getRuntimeEventPressureSource(snapshot, dimension),
        }));
      });
    });
  });
  const lastSnapshot = snapshots[snapshots.length - 1];
  const finalProgress = clamp(lastSnapshot?.progress, 0, 1);
  const playbackCompleted = Boolean(lastSnapshot?.playbackComplete);
  events.push(createRuntimeEvent(playbackCompleted ? 'route_completed' : 'route_incomplete', lastSnapshot, snapshots.length - 1, snapshots.length, {
    finalProgress: Number(finalProgress.toFixed(3)),
  }));

  const progressEvents = buildPlaybackProgressTimelineEvents(playback, events);
  const orderedEvents = [...events, ...progressEvents]
    .sort((left, right) => safeNumber(left.timeSeconds, 0) - safeNumber(right.timeSeconds, 0));
  const flowTypes = new Set([
    'route_started',
    'route_progress',
    'guidance_pause',
    'slow_walk',
    'short_rest_started',
    'seat_search_started',
    'seat_rest_started',
    'rest_state_changed',
    'rest_resumed',
    'final_approach',
    'route_completed',
    'route_incomplete',
  ]);
  const flowEvents = orderedEvents.filter((event) => flowTypes.has(event.type));
  const burdenEvents = orderedEvents
    .filter((event) => event.type === 'burden_spike')
    .slice(0, Math.max(0, 28 - flowEvents.length));
  return selectRuntimeEventsForTimeline([...flowEvents, ...burdenEvents], 28);
}

function describeAgentMobilityPersona(agent) {
  const locomotorScore = clamp(safeNumber(agent?.profile?.capacityScores?.locomotor, 3), 1, 5);
  if (locomotorScore <= 1) {
    return 'wheelchair-speed elder who prioritizes barrier-free width, smooth turning, elevators, and manageable pauses';
  }
  if (locomotorScore === 2) {
    return 'very cautious elder with strong walking limitations who prefers steady pacing, barrier-free choices, and frequent confirmation';
  }
  if (locomotorScore === 3) {
    return 'slow, careful elder with cane-like caution who notices slope, crowd pressure, and uncertain turns';
  }
  if (locomotorScore === 4) {
    return 'generally steady elder who can keep moving but still reacts to crowding and confusing guidance';
  }
  return 'relatively capable elder who still reacts to burden, noise, and route uncertainty like an older passenger';
}

function buildDecisionPlanInput(prepared, scenario, payload, playback = null) {
  const focusAgent = scenario?.focusAgent || null;
  if (!focusAgent) {
    return null;
  }
  const probe = Sim.buildFocusDecisionPlan(prepared, scenario, focusAgent, {
    startAnchor: scenario.focusStartPoint,
    targetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id,
  });
  const targetRegion = scenario.focusTargetRegion || prepared.targetRegionById?.[scenario.focusTargetRegionId] || null;
  const humanContext = typeof Sim.buildFocusHumanContext === 'function'
    ? Sim.buildFocusHumanContext(prepared, scenario, focusAgent, {
        startAnchor: scenario.focusStartPoint,
        targetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id,
        decisionPlan: probe,
      })
    : null;
  const startNode = payload?.scenarioOptions?.startNodeId
    ? prepared?.nodeById?.[payload.scenarioOptions.startNodeId] || null
    : findNearestNode(prepared, scenario.focusStartPoint || payload?.scenarioOptions?.startPoint || null);
  const runtimeEvents = buildRuntimeEventsFromPlayback(playback);
  const allowedPressureMentions = [
    ...collectAllowedPressureMentions(humanContext, probe?.decisions || []),
    ...collectRuntimePressureMentions(runtimeEvents),
  ].slice(0, 32);
  return {
    request: {
      startNodeId: startNode?.id || payload?.scenarioOptions?.startNodeId || scenario?.focusRoute?.startGroupId || null,
      targetRegionId: scenario.focusTargetRegionId || targetRegion?.id || null,
      targetRegionLabel: targetRegion?.labelEn || targetRegion?.labelZh || targetRegion?.id || null,
      backgroundCrowdCount: Number(payload?.scenarioOptions?.backgroundCrowdCount || scenario?.simulatedCrowdCount || 0),
    },
    startContext: classifyStartContext(prepared, startNode, scenario.focusStartPoint || payload?.scenarioOptions?.startPoint || null),
    agent: {
      capacityScores: { ...(focusAgent?.profile?.capacityScores || {}) },
      walkingSpeed: Number(focusAgent?.profile?.walkingSpeed || 0),
      fatigueThreshold: Number(focusAgent?.fatigueThreshold || focusAgent?.profile?.fatigueThreshold || 0),
      locomotorPersona: describeAgentMobilityPersona(focusAgent),
      seatSearchThresholdPercent: Number(focusAgent?.profile?.seatSearchThresholdPercent || 0),
      shortRestThresholdsPercent: Array.isArray(focusAgent?.profile?.shortRestThresholdsPercent)
        ? focusAgent.profile.shortRestThresholdsPercent.map((value) => Number(value || 0))
        : [],
      disableShortRest: Boolean(focusAgent?.profile?.disableShortRest),
      disableSeatRest: Boolean(focusAgent?.profile?.disableSeatRest),
    },
    routeContext: humanContext?.routeContext || null,
    environmentContext: humanContext?.environmentContext || null,
    allowedPressureMentions,
    routeStyleHint: probe?.routeStyle || null,
    decisionPoints: Array.isArray(probe?.decisions) ? probe.decisions : [],
    runtimeEvents,
  };
}

const ROUTE_STYLE_KEYS = Object.freeze([
  'crowdAvoidanceBias',
  'wallAvoidanceBias',
  'centerlineBias',
  'turnCommitmentBias',
  'hesitationBias',
]);

function normalizeRouteStyleForSimulation(routeStyle = {}, fallbackRouteStyle = {}) {
  const source = routeStyle && typeof routeStyle === 'object' ? routeStyle : {};
  const fallback = fallbackRouteStyle && typeof fallbackRouteStyle === 'object' ? fallbackRouteStyle : {};
  const defaults = {
    crowdAvoidanceBias: 0.38,
    wallAvoidanceBias: 0.34,
    centerlineBias: 0.32,
    turnCommitmentBias: 0.58,
    hesitationBias: 0.46,
  };
  return ROUTE_STYLE_KEYS.reduce((result, key) => {
    const value = Number.isFinite(safeNumber(source[key], Number.NaN))
      ? source[key]
      : Number.isFinite(safeNumber(fallback[key], Number.NaN))
        ? fallback[key]
        : defaults[key];
    result[key] = Number(clamp(value, 0, 1).toFixed(3));
    return result;
  }, {});
}

function buildDeterministicPreRuntimeDecisionPlan(provider, fallbackProbe = {}, reason = '') {
  return {
    analysisKind: 'decision-plan',
    title: 'Elderly Travel Decision Chain',
    summaryZh: '已使用确定性路线策略驱动本次代理人运行。',
    summaryEn: 'The focus agent is driven by a deterministic route strategy for this run.',
    placeholderZh: '',
    placeholderEn: '',
    provider: provider || {
      id: 'runtime-strategy',
      label: 'Runtime Strategy',
      status: reason || 'Deterministic route strategy',
      connected: false,
    },
    routeStyle: normalizeRouteStyleForSimulation(null, fallbackProbe?.routeStyle || null),
    anchors: [],
    timeline: [],
    decisions: Array.isArray(fallbackProbe?.decisions) ? fallbackProbe.decisions : [],
    sections: [],
    failed: false,
    fallback: true,
    strategySource: 'deterministic',
    error: String(reason || '').trim(),
  };
}

function normalizePreRuntimeDecisionPlanForSimulation(analysis = null, fallbackProbe = {}, provider = null) {
  if (!analysis || analysis.failed) {
    return buildDeterministicPreRuntimeDecisionPlan(
      analysis?.provider || provider,
      fallbackProbe,
      analysis?.error || provider?.status || 'LLM strategy unavailable'
    );
  }
  return {
    ...analysis,
    provider: analysis.provider || provider || null,
    routeStyle: normalizeRouteStyleForSimulation(analysis.routeStyle || null, fallbackProbe?.routeStyle || null),
    decisions: Array.isArray(analysis.decisions) ? analysis.decisions : [],
    anchors: Array.isArray(analysis.anchors) ? analysis.anchors : [],
    timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
    sections: Array.isArray(analysis.sections) ? analysis.sections : [],
    failed: false,
    fallback: false,
    strategySource: 'llm-pre-runtime',
  };
}

async function resolvePreRuntimeDecisionPlanForSimulation(prepared, scenario, payload, mode = 'final', fallbackProbe = null) {
  const deterministicPlan = buildDeterministicPreRuntimeDecisionPlan(null, fallbackProbe || {});
  if (mode === 'preview') {
    const configuredProvider = getConfiguredDecisionPlanProvider();
    return {
      ...deterministicPlan,
      provider: configuredProvider.provider,
      pending: Boolean(configuredProvider.enabled),
      strategySource: 'deterministic-preview',
    };
  }
  const configuredProvider = getConfiguredDecisionPlanProvider();
  if (!configuredProvider.enabled) {
    return buildDeterministicPreRuntimeDecisionPlan(configuredProvider.provider, fallbackProbe || {}, configuredProvider.provider.status);
  }
  const llmInput = buildDecisionPlanInput(prepared, scenario, payload, null);
  if (!llmInput) {
    return buildDeterministicPreRuntimeDecisionPlan(configuredProvider.provider, fallbackProbe || {}, 'Missing focus agent for LLM strategy');
  }
  const result = await requestLlmDecisionPlan({
    ...llmInput,
    runtimeEvents: [],
    executionPhase: 'pre_runtime_strategy',
  });
  return normalizePreRuntimeDecisionPlanForSimulation(
    result?.analysis || null,
    fallbackProbe || {},
    result?.provider || configuredProvider.provider
  );
}

function mergePreRuntimePlanWithRuntimeTimeline(preRuntimePlan = null, runtimeFallback = null) {
  const fallback = runtimeFallback || buildRuntimeFallbackDecisionPlanAnalysis(null, [], null, 'Runtime timeline unavailable');
  const routeStyle = normalizeRouteStyleForSimulation(preRuntimePlan?.routeStyle || null, fallback?.routeStyle || null);
  const provider = preRuntimePlan?.provider || fallback.provider || null;
  return {
    ...fallback,
    ...(preRuntimePlan || {}),
    provider,
    routeStyle,
    anchors: Array.isArray(preRuntimePlan?.anchors) ? preRuntimePlan.anchors : [],
    decisions: Array.isArray(preRuntimePlan?.decisions) ? preRuntimePlan.decisions : [],
    sections: Array.isArray(preRuntimePlan?.sections) ? preRuntimePlan.sections : [],
    timeline: Array.isArray(fallback.timeline) ? sanitizeGroundedTimelineText(fallback.timeline) : [],
    runtimeGrounded: true,
    timelineSource: fallback?.timelineSource || 'runtime-events',
    strategySource: preRuntimePlan?.strategySource || (preRuntimePlan?.fallback ? 'deterministic' : 'llm-pre-runtime'),
    failed: false,
    pending: Boolean(preRuntimePlan?.pending),
    fallback: Boolean(preRuntimePlan?.fallback),
  };
}

function normalizePolishedTimelineTextValue(value = '') {
  const text = String(value || '').trim();
  return text || null;
}

function getPolishedTimelineTextPatch(polishedItem = null) {
  if (!polishedItem || typeof polishedItem !== 'object') {
    return null;
  }
  const patch = {};
  const textKeys = ['thoughtZh', 'thoughtEn', 'cueZh', 'cueEn'];
  textKeys.forEach((key) => {
    const value = normalizePolishedTimelineTextValue(polishedItem[key]);
    if (value) {
      patch[key] = value;
    }
  });
  return Object.keys(patch).length ? patch : null;
}

function applyPolishedTextToRuntimeTimeline(runtimeTimeline = [], polishedTimeline = []) {
  const runtimeItems = Array.isArray(runtimeTimeline) ? runtimeTimeline.filter(Boolean) : [];
  const polishedItems = Array.isArray(polishedTimeline) ? polishedTimeline.filter(Boolean) : [];
  if (!runtimeItems.length || !polishedItems.length) {
    return sanitizeGroundedTimelineText(runtimeItems);
  }

  const polishedByTriggerId = new Map();
  polishedItems.forEach((item) => {
    const triggerId = String(item?.triggerEventId || item?.trigger_event_id || '').trim();
    if (triggerId && !polishedByTriggerId.has(triggerId)) {
      polishedByTriggerId.set(triggerId, item);
    }
  });

  const polishedByOrder = new Map();
  polishedItems.forEach((item, index) => {
    const order = Math.max(1, Math.round(safeNumber(item?.order, index + 1)));
    if (!polishedByOrder.has(order)) {
      polishedByOrder.set(order, item);
    }
  });

  return sanitizeGroundedTimelineText(runtimeItems.map((runtimeItem, index) => {
    const triggerId = String(runtimeItem?.triggerEventId || runtimeItem?.trigger_event_id || '').trim();
    const polishedItem = (triggerId ? polishedByTriggerId.get(triggerId) : null)
      || polishedByOrder.get(Math.max(1, Math.round(safeNumber(runtimeItem?.order, index + 1))))
      || null;
    const patch = getPolishedTimelineTextPatch(polishedItem);
    return patch ? { ...runtimeItem, ...patch } : { ...runtimeItem };
  }));
}

function interpolateRuntimeEventValue(lowerValue, upperValue, ratio) {
  const safeRatio = clamp(ratio, 0, 1);
  const lower = safeNumber(lowerValue, 0);
  const upper = safeNumber(upperValue, lower);
  return lower + (upper - lower) * safeRatio;
}

function buildTimelineEventAnchors(runtimeEvents = [], playbackStartTime = 0) {
  const orderedEvents = Array.isArray(runtimeEvents)
    ? runtimeEvents
      .filter(Boolean)
      .slice()
      .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0))
    : [];
  if (!orderedEvents.length) {
    return [];
  }
  const firstEventTime = safeNumber(orderedEvents[0]?.timeSeconds, playbackStartTime);
  const firstEventProgress = clamp(safeNumber(orderedEvents[0]?.progress, 0), 0, 1);
  const needsSyntheticStart = (
    Math.abs(firstEventTime - safeNumber(playbackStartTime, 0)) > 0.5
    || firstEventProgress > 0.02
  );
  if (!needsSyntheticStart) {
    return orderedEvents;
  }
  return [
    {
      eventId: 'route_started_000',
      type: 'route_started',
      node_id: String(orderedEvents[0]?.node_id || 'route_start').trim() || 'route_start',
      timeSeconds: Number(safeNumber(playbackStartTime, 0).toFixed(2)),
      progress: 0,
      restState: 'none',
      restMode: null,
      topBurdenId: null,
      topPressureSource: null,
      synthetic: true,
    },
    ...orderedEvents,
  ];
}

function buildPlaybackProgressTimelineEvents(playback = null, existingEvents = []) {
  const snapshots = Array.isArray(playback?.traceSnapshots)
    ? playback.traceSnapshots.filter(Boolean)
    : [];
  if (snapshots.length < 8) {
    return [];
  }
  const startTime = safeNumber(snapshots[0]?.time, 0);
  const endTime = safeNumber(snapshots[snapshots.length - 1]?.time, startTime);
  const duration = Math.max(0, endTime - startTime);
  const endProgress = clamp(safeNumber(snapshots[snapshots.length - 1]?.progress, 0), 0, 1);
  if (duration < 45 && endProgress < 0.65) {
    return [];
  }
  const existingProgress = (Array.isArray(existingEvents) ? existingEvents : [])
    .map((event) => clamp(safeNumber(event?.progress, Number.NaN), 0, 1))
    .filter(Number.isFinite);
  const checkpoints = duration >= 150
    ? [0.14, 0.28, 0.42, 0.56, 0.7, 0.84]
    : [0.2, 0.4, 0.6, 0.8];
  return checkpoints
    .filter((progress) => progress < Math.max(0.88, endProgress - 0.04))
    .filter((progress) => !existingProgress.some((existing) => Math.abs(existing - progress) <= 0.055))
    .map((progress, index) => {
      let bestSnapshot = snapshots[0];
      let bestIndex = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      snapshots.forEach((snapshot, snapshotIndex) => {
        const distanceToProgress = Math.abs(clamp(safeNumber(snapshot?.progress, 0), 0, 1) - progress);
        if (distanceToProgress < bestDistance) {
          bestSnapshot = snapshot;
          bestIndex = snapshotIndex;
          bestDistance = distanceToProgress;
        }
      });
      return createRuntimeEvent('route_progress', bestSnapshot, bestIndex, snapshots.length, {
        eventId: `route_progress_${String(index + 1).padStart(3, '0')}`,
        reason: 'long_route_checkpoint',
      });
    });
}

function getRuntimeEventPriority(event = {}) {
  const type = String(event?.type || '').trim();
  if (type === 'route_started' || type === 'route_completed' || type === 'route_incomplete') return 100;
  if (type === 'seat_search_started' || type === 'seat_rest_started' || type === 'rest_resumed') return 96;
  if (type === 'short_rest_started' || type === 'rest_state_changed') return 94;
  if (type === 'guidance_pause' || type === 'final_approach') return 90;
  if (type === 'slow_walk') return 86;
  if (type === 'burden_spike') {
    const threshold = safeNumber(event?.threshold, 0);
    return threshold >= 75 ? 82 : 74;
  }
  if (type === 'route_progress') return 62;
  return 50;
}

function getRuntimeEventDedupeKey(event = {}) {
  const type = String(event?.type || '').trim();
  if (type === 'burden_spike') {
    return `${type}:${event?.dimension || event?.topBurdenId || ''}:${event?.threshold || ''}`;
  }
  if (type === 'route_progress') {
    return `${type}:${Math.round(clamp(event?.progress, 0, 1) * 10)}`;
  }
  if (type === 'guidance_pause') {
    return `${type}:${event?.sourceId || event?.decisionNodeId || event?.node_id || ''}`;
  }
  return `${type}:${event?.eventId || event?.node_id || event?.timeSeconds || ''}`;
}

function selectRuntimeEventsForTimeline(sourceEvents = [], limit = 28) {
  const events = (Array.isArray(sourceEvents) ? sourceEvents : [])
    .filter(Boolean)
    .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0));
  const byKey = new Map();
  events.forEach((event) => {
    const key = getRuntimeEventDedupeKey(event);
    const existing = byKey.get(key);
    if (!existing || getRuntimeEventPriority(event) > getRuntimeEventPriority(existing)) {
      byKey.set(key, event);
    }
  });
  const uniqueEvents = Array.from(byKey.values())
    .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0));
  const resolvedLimit = Math.max(4, Math.floor(safeNumber(limit, 28)));
  if (uniqueEvents.length <= resolvedLimit) {
    return uniqueEvents;
  }
  const requiredTypes = new Set([
    'route_started',
    'route_completed',
    'route_incomplete',
    'seat_search_started',
    'seat_rest_started',
    'rest_resumed',
    'short_rest_started',
    'guidance_pause',
    'final_approach',
    'slow_walk',
  ]);
  const selected = [];
  uniqueEvents.forEach((event) => {
    if (requiredTypes.has(String(event?.type || '').trim())) {
      selected.push(event);
    }
  });
  uniqueEvents
    .filter((event) => !selected.includes(event))
    .sort((left, right) => {
      const priorityDiff = getRuntimeEventPriority(right) - getRuntimeEventPriority(left);
      if (priorityDiff) return priorityDiff;
      return safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0);
    })
    .forEach((event) => {
      if (selected.length < resolvedLimit) {
        selected.push(event);
      }
    });
  return selected
    .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0))
    .slice(0, resolvedLimit);
}

function normalizeDecisionTriggerCandidates(triggerContext = {}) {
  const llmDecisions = Array.isArray(triggerContext?.llmDecisions) ? triggerContext.llmDecisions : [];
  const decisionPoints = Array.isArray(triggerContext?.decisionPoints) ? triggerContext.decisionPoints : [];
  return [
    ...llmDecisions.map((item) => ({
      order: Math.max(1, Math.round(safeNumber(item?.order, 0))),
      decisionNodeId: String(item?.decisionNodeId || item?.decision_node_id || '').trim() || null,
      targetNodeId: String(item?.chosenTargetNodeId || item?.chosen_target_node_id || '').trim() || null,
    })),
    ...decisionPoints.map((item) => ({
      order: Math.max(1, Math.round(safeNumber(item?.order, 0))),
      decisionNodeId: String(item?.decisionNodeId || item?.decision_node_id || '').trim() || null,
      targetNodeId: String(item?.recommendedTargetNodeId || item?.recommended_target_node_id || item?.chosenTargetNodeId || '').trim() || null,
    })),
  ].filter((item) => item.decisionNodeId);
}

function resolveTimelineDecisionTrigger(item, triggerContext = {}) {
  const decisionCandidates = normalizeDecisionTriggerCandidates(triggerContext);
  if (!decisionCandidates.length) {
    return null;
  }
  const explicitDecisionNodeId = String(item?.triggerDecisionNodeId || item?.decisionNodeId || item?.decision_node_id || '').trim() || null;
  const explicitTargetNodeId = String(item?.triggerTargetNodeId || item?.chosenTargetNodeId || item?.chosen_target_node_id || '').trim() || null;
  const itemNodeId = String(item?.nodeId || item?.node_id || '').trim() || null;
  const itemOrder = Math.max(1, Math.round(safeNumber(item?.order, 0)));

  const findCandidate = (predicate) => decisionCandidates.find((candidate) => (
    predicate(candidate)
    && (!explicitTargetNodeId || candidate.targetNodeId === explicitTargetNodeId)
  )) || null;

  const matchedDecision = (
    (explicitDecisionNodeId ? findCandidate((candidate) => candidate.decisionNodeId === explicitDecisionNodeId) : null)
    || (itemNodeId ? findCandidate((candidate) => candidate.decisionNodeId === itemNodeId) : null)
    || findCandidate((candidate) => candidate.order === itemOrder)
  );

  if (!matchedDecision) {
    return null;
  }
  return {
    triggerKind: 'decision',
    triggerDecisionNodeId: matchedDecision.decisionNodeId,
    triggerTargetNodeId: explicitTargetNodeId || matchedDecision.targetNodeId || null,
  };
}

function resolveTimelineRuntimeEvent(item, orderedEvents = [], fallbackEvent = null) {
  const itemTriggerEventId = String(item?.triggerEventId || item?.trigger_event_id || '').trim() || null;
  const itemNodeId = String(item?.nodeId || item?.node_id || '').trim() || null;
  const itemEventType = String(item?.runtimeEventType || item?.runtime_event_type || '').trim() || null;
  const itemRestState = String(item?.runtimeRestState || item?.runtime_rest_state || '').trim() || null;
  const itemProgress = safeNumber(item?.progress, Number.NaN);
  const itemTime = safeNumber(item?.timeSeconds, Number.NaN);
  let bestEvent = null;
  let bestScore = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  orderedEvents.forEach((event) => {
    let score = 0;
    if (itemTriggerEventId && String(event?.eventId || '').trim() === itemTriggerEventId) {
      score += 10;
    }
    if (itemEventType && String(event?.type || '').trim() === itemEventType) {
      score += 5;
    }
    if (itemRestState && String(event?.restState || '').trim() === itemRestState) {
      score += 3;
    }
    if (itemNodeId && String(event?.node_id || '').trim() === itemNodeId) {
      score += 2;
    }
    if (score <= 0) {
      return;
    }
    const progressDistance = Number.isFinite(itemProgress)
      ? Math.abs(safeNumber(event?.progress, itemProgress) - itemProgress)
      : 0;
    const timeDistance = Number.isFinite(itemTime)
      ? Math.abs(safeNumber(event?.timeSeconds, itemTime) - itemTime)
      : 0;
    const distancePenalty = progressDistance * 100 + timeDistance;
    if (score > bestScore || (score === bestScore && distancePenalty < bestDistance)) {
      bestEvent = event;
      bestScore = score;
      bestDistance = distancePenalty;
    }
  });

  return bestEvent || fallbackEvent || null;
}

function buildTimelineTriggerMetadata(item, matchedEvent = null, triggerContext = {}) {
  const decisionTrigger = resolveTimelineDecisionTrigger(item, triggerContext);
  const runtimeLike = Boolean(
    String(item?.triggerEventId || item?.trigger_event_id || '').trim()
    || String(item?.runtimeEventType || item?.runtime_event_type || '').trim()
    || String(item?.runtimeRestState || item?.runtime_rest_state || '').trim()
  );
  if (runtimeLike && matchedEvent) {
    return {
      triggerKind: 'runtime_event',
      triggerEventId: String(matchedEvent?.eventId || item?.triggerEventId || '').trim() || null,
      triggerEventType: String(matchedEvent?.type || item?.runtimeEventType || '').trim() || null,
      triggerRestState: String(matchedEvent?.restState || item?.runtimeRestState || '').trim() || null,
      triggerBurdenDimension: String(matchedEvent?.dimension || '').trim() || null,
    };
  }
  const inferredRuntimeLike = Boolean(
    String(item?.runtimeEventType || item?.runtime_event_type || '').trim()
    || String(item?.runtimeRestState || item?.runtime_rest_state || '').trim()
  );
  if (inferredRuntimeLike && matchedEvent) {
    return {
      triggerKind: 'runtime_event',
      triggerEventId: String(matchedEvent?.eventId || '').trim() || null,
      triggerEventType: String(matchedEvent?.type || '').trim() || null,
      triggerRestState: String(matchedEvent?.restState || item?.runtimeRestState || '').trim() || null,
      triggerBurdenDimension: String(matchedEvent?.dimension || '').trim() || null,
    };
  }
  if (decisionTrigger) {
    return decisionTrigger;
  }
  return null;
}

function neutralizeUnsupportedDirectionalText(text = '') {
  return String(text || '')
    .replace(/左手边|右手边|左侧|右侧|左边|右边|左前方|右前方|左后方|右后方/g, '附近')
    .replace(/往左|向左|往右|向右/g, '顺着指引')
    .replace(/\bon\s+the\s+(left|right)\b/gi, 'nearby')
    .replace(/\bto\s+the\s+(left|right)\b/gi, 'along the route')
    .replace(/\b(left|right)\s+side\b/gi, 'nearby area')
    .replace(/\b(left|right)\b/gi, 'nearby');
}

function removeUnsupportedRestClaimText(text = '', options = {}) {
  const preserveStopWording = Boolean(options?.preserveStopWording);
  let sanitized = String(text || '')
    .replace(/先?停下来缓一下/g, '先放慢一点')
    .replace(/休息一下|休息一会儿|休息一会|休息/g, '缓一缓节奏')
    .replace(/歇一下|歇一会儿|歇一会|歇/g, '缓一缓节奏')
    .replace(/缓一下/g, '放慢一点')
    .replace(/\bstop\s+and\s+rest\b/gi, 'slow down')
    .replace(/\bstop\s+for\s+a\s+short\s+rest\b/gi, 'slow down for a moment')
    .replace(/\bshort\s+rest\b/gi, 'slower pace')
    .replace(/\brest\b/gi, 'slow down');
  if (!preserveStopWording) {
    sanitized = sanitized
      .replace(/停下来/g, '放慢一点')
      .replace(/停下/g, '放慢')
      .replace(/\bstop\b/gi, 'slow down')
      .replace(/\bpause\b/gi, 'slow down');
  }
  return sanitized;
}

function isRestRuntimeTimelineItem(item = {}) {
  const eventType = String(item?.runtimeEventType || item?.triggerEventType || '').trim();
  const restState = String(item?.runtimeRestState || item?.triggerRestState || '').trim();
  return (
    eventType === 'short_rest_started'
    || eventType === 'seat_search_started'
    || eventType === 'seat_rest_started'
    || eventType === 'rest_state_changed'
    || eventType === 'rest_resumed'
    || ['searching', 'short-rest', 'sitting', 'standing'].includes(restState)
  );
}

function isGuidancePauseTimelineItem(item = {}) {
  const eventType = String(item?.runtimeEventType || item?.triggerEventType || '').trim();
  const walkingSpeed = safeNumber(item?.walkingSpeed ?? item?.currentWalkingSpeed, Number.NaN);
  return eventType === 'guidance_pause' && (!Number.isFinite(walkingSpeed) || walkingSpeed <= 0.05);
}

function sanitizeGroundedTimelineText(timeline = []) {
  return (Array.isArray(timeline) ? timeline : []).map((item) => {
    const allowRestWording = isRestRuntimeTimelineItem(item);
    const allowGuidanceStopWording = isGuidancePauseTimelineItem(item);
    const sanitizeText = (value) => {
      const directionNeutral = neutralizeUnsupportedDirectionalText(value);
      return allowRestWording
        ? directionNeutral
        : removeUnsupportedRestClaimText(directionNeutral, {
          preserveStopWording: allowGuidanceStopWording,
        });
    };
    return {
      ...item,
      thoughtZh: sanitizeText(item?.thoughtZh),
      thoughtEn: sanitizeText(item?.thoughtEn),
      cueZh: sanitizeText(item?.cueZh),
      cueEn: sanitizeText(item?.cueEn),
    };
  });
}

function normalizeRuntimePressureLabelZh(name = '', category = '', dimension = '') {
  const raw = `${name} ${category} ${dimension}`.toLowerCase();
  if (/advert|ad\b|flashing|static/.test(raw)) return '广告信息';
  if (/noise|sound|speaker|audio|噪/.test(raw)) return '噪音';
  if (/light|lighting|lux|照明|光/.test(raw)) return '光线';
  if (/crowd|queue|density|人流|拥挤|排队/.test(raw)) return '人流';
  if (/sign|guide|wayfinding|direction|标识|导向/.test(raw)) return '标识';
  if (/seat|bench|座/.test(raw)) return '座位';
  if (/elev|lift|电梯/.test(raw)) return '电梯';
  if (/screen|lcd|display|service|服务|信息屏/.test(raw)) return '信息屏';
  if (/cognitive|decision|认知|决策/.test(raw)) return '方向判断';
  if (/sensory|perception|感知/.test(raw)) return '识别信息';
  if (/psychological|心理/.test(raw)) return '周围环境';
  if (/locomotor|mobility|行动/.test(raw)) return '通行空间';
  if (/vitality|fatigue|疲劳|活力/.test(raw)) return '体力消耗';
  return '周围环境';
}

function normalizeRuntimePressureLabelEn(name = '', category = '', dimension = '') {
  const raw = `${name} ${category} ${dimension}`.toLowerCase();
  if (/advert|ad\b|flashing|static/.test(raw)) return 'advertising';
  if (/noise|sound|speaker|audio/.test(raw)) return 'noise';
  if (/light|lighting|lux/.test(raw)) return 'lighting';
  if (/crowd|queue|density/.test(raw)) return 'crowding';
  if (/sign|guide|wayfinding|direction/.test(raw)) return 'signage';
  if (/seat|bench/.test(raw)) return 'seating';
  if (/elev|lift/.test(raw)) return 'the elevator area';
  if (/screen|lcd|display|service/.test(raw)) return 'the information screen';
  if (/cognitive|decision/.test(raw)) return 'wayfinding';
  if (/sensory|perception/.test(raw)) return 'recognition';
  if (/psychological/.test(raw)) return 'the surroundings';
  if (/locomotor|mobility/.test(raw)) return 'walking space';
  if (/vitality|fatigue/.test(raw)) return 'fatigue';
  return 'the surroundings';
}

function getBurdenSpikeRuntimeThought(event = {}) {
  const source = event?.topPressureSource || {};
  const dimension = String(event?.dimension || event?.topBurdenId || '').trim();
  const sourceZh = normalizeRuntimePressureLabelZh(source.name || source.feature || '', source.category || '', dimension);
  const sourceEn = normalizeRuntimePressureLabelEn(source.name || source.feature || '', source.category || '', dimension);
  const lower = `${source.name || ''} ${source.feature || ''} ${source.category || ''} ${dimension}`.toLowerCase();
  const score = Number.isFinite(safeNumber(event?.score, Number.NaN)) ? safeNumber(event.score, 0).toFixed(0) : '';
  const suffixZh = score ? `，负担大约${score}` : '';
  const suffixEn = score ? `, around ${score}` : '';
  if (dimension === 'sensory') {
    if (/light|lighting|lux/.test(lower)) {
      return {
        zh: `光线有点晃眼${suffixZh}，我得慢点看清路和指示牌。`,
        en: `The lighting is glaring${suffixEn}, so I need to slow down and read the path and signs carefully.`,
      };
    }
    if (/noise|sound|speaker|audio/.test(lower)) {
      return {
        zh: `噪音让我听不清、也分散注意${suffixZh}，我得多看几眼前面的信息。`,
        en: `The noise is distracting my recognition${suffixEn}, so I need to look at the information ahead more carefully.`,
      };
    }
    return {
      zh: `${sourceZh}影响我识别周围信息${suffixZh}，我得看清楚再继续。`,
      en: `${sourceEn} is affecting what I can recognize${suffixEn}, so I need to check before continuing.`,
    };
  }
  if (dimension === 'cognitive') {
    return {
      zh: `${sourceZh}让我判断方向更费劲${suffixZh}，我得再确认一下。`,
      en: `${sourceEn} is making wayfinding harder${suffixEn}, so I need to confirm the direction again.`,
    };
  }
  if (dimension === 'locomotor') {
    return {
      zh: `${sourceZh}让通行空间变紧${suffixZh}，我得把步子放稳一点。`,
      en: `${sourceEn} is making the walking space tighter${suffixEn}, so I need to steady my steps.`,
    };
  }
  if (dimension === 'psychological') {
    return {
      zh: `${sourceZh}让我有点紧张${suffixZh}，我先稳住情绪继续走。`,
      en: `${sourceEn} is making me uneasy${suffixEn}, so I need to stay calm and keep moving.`,
    };
  }
  if (dimension === 'vitality') {
    return {
      zh: `体力消耗又上来了${suffixZh}，我得控制节奏，别一下子走太急。`,
      en: `My fatigue is building again${suffixEn}, so I need to control my pace and not rush.`,
    };
  }
  if (/advert|ad\b|flashing|static/.test(lower)) {
    return {
      zh: '广告信息有点干扰，我得更专注地看清路线。',
      en: 'The advertising is distracting, so I need to focus more on the route.',
    };
  }
  if (/cognitive|decision/.test(lower)) {
    return {
      zh: '这里的信息和方向判断有点费劲，我得再确认一下。',
      en: 'The wayfinding here takes more effort, so I need to confirm it again.',
    };
  }
  if (/noise|sound|speaker|audio/.test(lower)) {
    return {
      zh: '噪音有点影响我判断方向，我得看仔细一点。',
      en: 'The noise is making it harder to judge the direction, so I need to look more carefully.',
    };
  }
  if (/light|lighting|lux/.test(lower)) {
    return {
      zh: '这里光线让我看得不太舒服，我得慢慢确认前面的信息。',
      en: 'The lighting is uncomfortable, so I need to confirm the information ahead carefully.',
    };
  }
  if (/crowd|queue|density/.test(lower)) {
    return {
      zh: '人流让我通过不太顺，我得留出一点余地继续走。',
      en: 'The crowd is making passage less smooth, so I need to leave more room as I move.',
    };
  }
  return {
    zh: `${sourceZh}让我有点不踏实，我得更谨慎一点。`,
    en: `${sourceEn} is making this part less comfortable, so I need to be more careful.`,
  };
}

function getRouteProgressRuntimeThought(event = {}) {
  const progress = clamp(safeNumber(event?.progress, 0), 0, 1);
  const dimension = String(event?.topBurdenId || event?.dimension || '').trim();
  const source = event?.topPressureSource || {};
  const sourceZh = normalizeRuntimePressureLabelZh(source.name || source.feature || '', source.category || '', dimension);
  const sourceEn = normalizeRuntimePressureLabelEn(source.name || source.feature || '', source.category || '', dimension);
  const burdenScores = event?.burdenScores || {};
  const topScore = safeNumber(
    burdenScores[dimension],
    safeNumber(event?.score, safeNumber(event?.fatiguePercent, 0))
  );
  if (topScore >= 60 && dimension) {
    if (dimension === 'sensory') {
      return {
        zh: `${sourceZh}让我看周围信息更费劲，我得边走边确认。`,
        en: `${sourceEn} is making recognition harder, so I need to check as I walk.`,
      };
    }
    if (dimension === 'cognitive') {
      return {
        zh: `${sourceZh}让我判断方向慢一点，我得继续留意标识。`,
        en: `${sourceEn} is slowing my wayfinding, so I need to keep watching the signs.`,
      };
    }
    if (dimension === 'locomotor') {
      return {
        zh: `${sourceZh}让这一段不好走，我先把步子放稳。`,
        en: `${sourceEn} is making this part harder to pass, so I will steady my steps.`,
      };
    }
    if (dimension === 'psychological') {
      return {
        zh: `${sourceZh}让我有点不安，我先保持稳一点往前走。`,
        en: `${sourceEn} is making me uneasy, so I will keep steady as I move forward.`,
      };
    }
  }
  if (dimension === 'vitality' && progress >= 0.35) {
    return {
      zh: '体力在慢慢消耗，我先稳住节奏继续往前走。',
      en: 'My energy is gradually dropping, so I will keep a steady pace and continue.',
    };
  }
  if (progress < 0.24) {
    return {
      zh: '我先沿着当前路线走，边走边看前面的标识。',
      en: 'I will follow the current route while watching the signs ahead.',
    };
  }
  if (progress < 0.42) {
    return {
      zh: '这一段信息不少，我要看仔细一点再往前走。',
      en: 'There is quite a bit of information here, so I need to look carefully as I move.',
    };
  }
  if (progress < 0.6) {
    return {
      zh: '路上人和标识都要留意，我保持稳一点继续走。',
      en: 'I need to watch both people and signs, so I will keep moving steadily.',
    };
  }
  if (progress < 0.78) {
    return {
      zh: '已经走过一段了，我继续按这个方向前进。',
      en: 'I have covered part of the route, so I will keep going in this direction.',
    };
  }
  return {
    zh: '离终点更近了，我再稳住节奏往前走。',
    en: 'I am getting closer to the destination, so I will keep a steady pace.',
  };
}

function getRuntimeEventFallbackThought(event = {}, index = 0) {
  const type = String(event?.type || '').trim();
  const topPressureName = String(event?.topPressureSource?.name || event?.topPressureSource?.feature || '').trim();
  const dimension = String(event?.dimension || event?.topBurdenId || '').trim();
  const fatiguePercent = Number.isFinite(safeNumber(event?.fatiguePercent, Number.NaN))
    ? `${safeNumber(event.fatiguePercent, 0).toFixed(0)}%`
    : '';
  if (type === 'route_started') {
    return {
      zh: '我先看清楚起点和方向，慢慢往前走。',
      en: 'I will first confirm the start and direction, then move forward carefully.',
    };
  }
  if (type === 'guidance_pause') {
    return {
      zh: '这里信息有点多，我得先确认一下再继续。',
      en: 'There is a lot of information here, so I need to confirm it before moving on.',
    };
  }
  if (type === 'seat_search_started') {
    return {
      zh: `有点累了，我先看看附近有没有座位${event?.nearbySeatCount !== undefined ? `，现在能看到${safeNumber(event.nearbySeatCount, 0).toFixed(0)}个` : ''}。`,
      en: `I am getting tired, so I should check for nearby seats${event?.nearbySeatCount !== undefined ? `; I can see ${safeNumber(event.nearbySeatCount, 0).toFixed(0)} now` : ''}.`,
    };
  }
  if (type === 'short_rest_started' || type === 'rest_state_changed') {
    return {
      zh: `疲劳已经上来了${fatiguePercent ? `，大约${fatiguePercent}` : ''}，我需要把节奏缓下来。`,
      en: `My fatigue is rising${fatiguePercent ? `, around ${fatiguePercent}` : ''}, so I need to slow my pace.`,
    };
  }
  if (type === 'burden_spike') {
    return {
      zh: `${topPressureName || dimension || '周围环境'}让我负担变重了，我得更谨慎一点。`,
      en: `${topPressureName || dimension || 'The surrounding environment'} is adding burden, so I need to be more careful.`,
    };
  }
  if (type === 'route_completed') {
    return {
      zh: '终于到达实际终点了，这一段可以结束了。',
      en: 'I have finally reached the actual endpoint, so this trip can finish.',
    };
  }
  if (type === 'route_incomplete') {
    return {
      zh: '现在还没真正走完全程，先停在当前进度记录下来。',
      en: 'I have not fully completed the route yet, so I will record the current progress.',
    };
  }
  return {
    zh: index === 0 ? '我先稳住方向，按当前路线继续走。' : '这一段继续观察周围情况，保持慢一点的节奏。',
    en: index === 0 ? 'I will keep my direction steady and continue along the route.' : 'I will keep watching the surroundings and move at a slower pace.',
  };
}

function getRuntimeEventFallbackThoughtV2(event = {}, index = 0) {
  const type = String(event?.type || '').trim();
  const topPressureName = String(event?.topPressureSource?.name || event?.topPressureSource?.feature || '').trim();
  const dimension = String(event?.dimension || event?.topBurdenId || '').trim();
  const fatiguePercent = Number.isFinite(safeNumber(event?.fatiguePercent, Number.NaN))
    ? `${safeNumber(event.fatiguePercent, 0).toFixed(0)}%`
    : '';
  if (type === 'route_started') {
    return {
      zh: '我先看清楚起点和方向，慢慢往前走。',
      en: 'I will first confirm the start and direction, then move forward carefully.',
    };
  }
  if (type === 'guidance_pause') {
    return {
      zh: '这里信息有点多，我得先确认一下标识再继续。',
      en: 'There is a lot of information here, so I need to confirm the signs before moving on.',
    };
  }
  if (type === 'route_progress') {
    return getRouteProgressRuntimeThought(event);
  }
  if (type === 'slow_walk') {
    return {
      zh: '这里走起来有点吃力，我先把步子放慢一点。',
      en: 'This part feels hard to walk through, so I will slow down a little.',
    };
  }
  if (type === 'short_rest_started') {
    return {
      zh: `有点喘不过来了${fatiguePercent ? `，疲劳大约${fatiguePercent}` : ''}，我先停下来喘口气。`,
      en: `I feel short of breath${fatiguePercent ? `, fatigue is around ${fatiguePercent}` : ''}, so I will stop briefly to catch my breath.`,
    };
  }
  if (type === 'seat_search_started') {
    return {
      zh: `体力撑不住了，我得先找个座位${event?.nearbySeatCount !== undefined ? `，现在能看到${safeNumber(event.nearbySeatCount, 0).toFixed(0)}个` : ''}。`,
      en: `I am too tired to keep going, so I need to look for a seat${event?.nearbySeatCount !== undefined ? `; I can see ${safeNumber(event.nearbySeatCount, 0).toFixed(0)} now` : ''}.`,
    };
  }
  if (type === 'seat_rest_started') {
    return {
      zh: '看到座位了，我先坐下来恢复一下，再继续去终点。',
      en: 'I found a seat, so I will sit down and recover before continuing to the destination.',
    };
  }
  if (type === 'rest_resumed') {
    return {
      zh: '休息得差不多了，我准备继续往终点走。',
      en: 'I have recovered enough, so I am ready to keep going toward the destination.',
    };
  }
  if (type === 'rest_state_changed') {
    return {
      zh: `疲劳已经上来了${fatiguePercent ? `，大约${fatiguePercent}` : ''}，我需要把节奏缓下来。`,
      en: `My fatigue is rising${fatiguePercent ? `, around ${fatiguePercent}` : ''}, so I need to slow my pace.`,
    };
  }
  if (type === 'burden_spike') {
    return getBurdenSpikeRuntimeThought(event);
  }
  if (type === 'final_approach') {
    return {
      zh: '快到终点了，再坚持一下就到了。',
      en: 'I am close to the destination now, just a little further.',
    };
  }
  if (type === 'route_completed') {
    return {
      zh: '终于到达实际终点了，这一段可以结束了。',
      en: 'I have finally reached the actual endpoint, so this trip can finish.',
    };
  }
  if (type === 'route_incomplete') {
    return {
      zh: '现在还没真正走完全程，先停在当前进度记录下来。',
      en: 'I have not fully completed the route yet, so I will record the current progress.',
    };
  }
  return {
    zh: index === 0 ? '我先稳住方向，按当前路线继续走。' : '这一段继续观察周围情况，保持慢一点的节奏。',
    en: index === 0 ? 'I will keep my direction steady and continue along the route.' : 'I will keep watching the surroundings and move at a slower pace.',
  };
}

function selectTimelineSourceEvents(sourceEvents = [], limit = 24) {
  const events = Array.isArray(sourceEvents) ? sourceEvents.filter(Boolean) : [];
  const resolvedLimit = Math.max(2, Math.floor(safeNumber(limit, 24)));
  if (events.length <= resolvedLimit) {
    return events;
  }
  return selectRuntimeEventsForTimeline(events, resolvedLimit);
}

function buildRuntimeFallbackDecisionPlanAnalysis(provider, runtimeEvents = [], playback = null, error = '') {
  const traceSnapshots = Array.isArray(playback?.traceSnapshots) ? playback.traceSnapshots.filter(Boolean) : [];
  const playbackStartTime = traceSnapshots.length ? safeNumber(traceSnapshots[0]?.time, 0) : 0;
  const orderedEvents = buildTimelineEventAnchors(runtimeEvents, playbackStartTime);
  const sourceEvents = orderedEvents.length ? orderedEvents : [
    {
      eventId: 'route_started_000',
      type: 'route_started',
      node_id: 'route_start',
      timeSeconds: playbackStartTime,
      progress: 0,
      restState: 'none',
    },
  ];
  const progressEvents = buildPlaybackProgressTimelineEvents(playback, sourceEvents);
  const timelineEvents = [...sourceEvents, ...progressEvents]
    .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0));
  const timeline = selectTimelineSourceEvents(timelineEvents, 28).map((event, index) => {
    const thought = getRuntimeEventFallbackThoughtV2(event, index);
    return {
      order: index + 1,
      nodeId: String(event?.node_id || `path_sample_${index + 1}`).trim(),
      phase: String(event?.type || 'progress').trim() || 'progress',
      timeSeconds: Number(safeNumber(event?.timeSeconds, playbackStartTime).toFixed(2)),
      progress: Number(clamp(safeNumber(event?.progress, index / Math.max(1, timelineEvents.length - 1)), 0, 1).toFixed(3)),
      runtimeEventType: String(event?.type || '').trim() || null,
      runtimeRestState: String(event?.restState || '').trim() || null,
      triggerKind: 'runtime_event',
      triggerEventId: String(event?.eventId || '').trim() || null,
      triggerEventType: String(event?.type || '').trim() || null,
      triggerRestState: String(event?.restState || '').trim() || null,
      triggerBurdenDimension: String(event?.dimension || '').trim() || null,
      walkingSpeed: Number.isFinite(safeNumber(event?.walkingSpeed, Number.NaN))
        ? Number(safeNumber(event.walkingSpeed, 0).toFixed(3))
        : null,
      thoughtZh: thought.zh,
      thoughtEn: thought.en,
      cueZh: thought.zh,
      cueEn: thought.en,
    };
  });
  const status = String(error instanceof Error ? error.message : (error || 'LLM decision plan fell back to runtime events')).trim();
  const resolvedProvider = provider
    ? { ...provider, status, connected: false }
    : {
        id: 'runtime-fallback',
        label: 'Runtime Events',
        status,
        connected: false,
      };
  return {
    analysisKind: 'decision-plan',
    title: 'Elderly Travel Decision Chain',
    summaryZh: 'LLM 返回格式异常，已使用真实运行事件生成可播放的代理人决策链。',
    summaryEn: 'The LLM response format was invalid, so a playable agent decision chain was generated from runtime events.',
    placeholderZh: '',
    placeholderEn: '',
    provider: resolvedProvider,
    routeStyle: {},
    anchors: [],
    timeline: sanitizeGroundedTimelineText(timeline),
    decisions: [],
    sections: [],
    failed: false,
    fallback: true,
    error: status,
  };
}

function groundTimelineAgainstRuntimeEvents(timeline = [], runtimeEvents = [], playback = null, triggerContext = {}) {
  const orderedTimeline = Array.isArray(timeline)
    ? timeline
      .filter(Boolean)
      .slice()
      .sort((left, right) => safeNumber(left?.order, 0) - safeNumber(right?.order, 0))
    : [];
  const traceSnapshots = Array.isArray(playback?.traceSnapshots)
    ? playback.traceSnapshots.filter(Boolean)
    : [];
  const playbackStartTime = traceSnapshots.length ? safeNumber(traceSnapshots[0]?.time, 0) : 0;
  const playbackEndTime = traceSnapshots.length
    ? safeNumber(traceSnapshots[traceSnapshots.length - 1]?.time, playbackStartTime)
    : Math.max(playbackStartTime, safeNumber(playback?.summary?.duration, playbackStartTime));
  const playbackEndProgress = traceSnapshots.length
    ? clamp(safeNumber(traceSnapshots[traceSnapshots.length - 1]?.progress, 1), 0, 1)
    : 1;
  const orderedEvents = buildTimelineEventAnchors(runtimeEvents, playbackStartTime);
  if (!orderedTimeline.length || !orderedEvents.length) {
    return orderedTimeline;
  }
  if (orderedEvents.length === 1) {
    const event = orderedEvents[0];
    const timeStart = Number.isFinite(playbackStartTime) ? playbackStartTime : 0;
    const timeEnd = Math.max(timeStart, Number.isFinite(playbackEndTime) ? playbackEndTime : safeNumber(event?.timeSeconds, timeStart));
    const progressStart = 0;
    const progressEnd = clamp(
      Number.isFinite(playbackEndProgress) ? playbackEndProgress : safeNumber(event?.progress, 1),
      0,
      1
    );
    return orderedTimeline.map((item, index) => {
      const ratio = orderedTimeline.length <= 1 ? 0 : index / Math.max(1, orderedTimeline.length - 1);
      const matchedEvent = resolveTimelineRuntimeEvent(item, orderedEvents, event);
      const triggerMetadata = buildTimelineTriggerMetadata(item, matchedEvent, triggerContext);
      const useExactRuntimeTiming = Boolean(
        matchedEvent
        && (
          String(item?.triggerEventId || item?.trigger_event_id || '').trim()
          || String(item?.runtimeEventType || item?.runtime_event_type || '').trim()
          || String(item?.runtimeRestState || item?.runtime_rest_state || '').trim()
        )
      );
      const shouldAttachRuntimeMetadata = Boolean(useExactRuntimeTiming || triggerMetadata?.triggerKind === 'runtime_event');
      return {
        ...item,
        timeSeconds: Number((useExactRuntimeTiming ? safeNumber(matchedEvent?.timeSeconds, interpolateRuntimeEventValue(timeStart, timeEnd, ratio)) : interpolateRuntimeEventValue(timeStart, timeEnd, ratio)).toFixed(2)),
        progress: Number(clamp(
          useExactRuntimeTiming ? safeNumber(matchedEvent?.progress, interpolateRuntimeEventValue(progressStart, progressEnd, ratio)) : interpolateRuntimeEventValue(progressStart, progressEnd, ratio),
          0,
          1
        ).toFixed(3)),
        runtimeEventType: shouldAttachRuntimeMetadata
          ? String(matchedEvent?.type || event?.type || item?.runtimeEventType || '').trim() || null
          : null,
        runtimeRestState: shouldAttachRuntimeMetadata
          ? String(matchedEvent?.restState || event?.restState || item?.runtimeRestState || '').trim() || null
          : null,
        walkingSpeed: shouldAttachRuntimeMetadata && Number.isFinite(safeNumber(matchedEvent?.walkingSpeed, Number.NaN))
          ? Number(safeNumber(matchedEvent?.walkingSpeed, 0).toFixed(3))
          : item?.walkingSpeed ?? null,
        ...(triggerMetadata || {}),
      };
    });
  }
  const maxTimelineIndex = Math.max(1, orderedTimeline.length - 1);
  const maxEventIndex = Math.max(1, orderedEvents.length - 1);
  return orderedTimeline.map((item, index) => {
    const scaledIndex = (index / maxTimelineIndex) * maxEventIndex;
    const lowerIndex = clamp(Math.floor(scaledIndex), 0, orderedEvents.length - 1);
    const upperIndex = clamp(Math.ceil(scaledIndex), 0, orderedEvents.length - 1);
    const lowerEvent = orderedEvents[lowerIndex] || orderedEvents[0];
    const upperEvent = orderedEvents[upperIndex] || lowerEvent;
    const ratio = scaledIndex - lowerIndex;
    const timeSeconds = interpolateRuntimeEventValue(lowerEvent?.timeSeconds, upperEvent?.timeSeconds, ratio);
    const progress = interpolateRuntimeEventValue(lowerEvent?.progress, upperEvent?.progress, ratio);
    const nearestEvent = ratio < 0.5 ? lowerEvent : upperEvent;
    const matchedEvent = resolveTimelineRuntimeEvent(item, orderedEvents, nearestEvent);
    const triggerMetadata = buildTimelineTriggerMetadata(item, matchedEvent, triggerContext);
    const useExactRuntimeTiming = Boolean(
      matchedEvent
      && (
        String(item?.triggerEventId || item?.trigger_event_id || '').trim()
        || String(item?.runtimeEventType || item?.runtime_event_type || '').trim()
        || String(item?.runtimeRestState || item?.runtime_rest_state || '').trim()
      )
    );
    const shouldAttachRuntimeMetadata = Boolean(useExactRuntimeTiming || triggerMetadata?.triggerKind === 'runtime_event');
    return {
      ...item,
      timeSeconds: Number((useExactRuntimeTiming ? safeNumber(matchedEvent?.timeSeconds, timeSeconds) : timeSeconds).toFixed(2)),
      progress: Number(clamp(useExactRuntimeTiming ? safeNumber(matchedEvent?.progress, progress) : progress, 0, 1).toFixed(3)),
      runtimeEventType: shouldAttachRuntimeMetadata
        ? String(matchedEvent?.type || nearestEvent?.type || item?.runtimeEventType || '').trim() || null
        : null,
      runtimeRestState: shouldAttachRuntimeMetadata
        ? String(matchedEvent?.restState || nearestEvent?.restState || item?.runtimeRestState || '').trim() || null
        : null,
      walkingSpeed: shouldAttachRuntimeMetadata && Number.isFinite(safeNumber(matchedEvent?.walkingSpeed, Number.NaN))
        ? Number(safeNumber(matchedEvent?.walkingSpeed, 0).toFixed(3))
        : item?.walkingSpeed ?? null,
      ...(triggerMetadata || {}),
    };
  });
}

async function resolveLlmDecisionPlan(prepared, scenario, payload, playback = null) {
  const llmInput = buildDecisionPlanInput(prepared, scenario, payload, playback);
  if (!llmInput) {
    return null;
  }
  const runtimeEvents = Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents : [];
  try {
    const result = await requestLlmDecisionPlan(llmInput);
    if (!result?.analysis) {
      return {
        ...buildRuntimeFallbackDecisionPlanAnalysis(result?.provider || null, runtimeEvents, playback, 'LLM decision plan unavailable'),
        inputSummary: {
          decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
          runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
        },
      };
    }
    if (result.analysis?.failed || !Array.isArray(result.analysis?.timeline) || !result.analysis.timeline.length) {
      return {
        ...buildRuntimeFallbackDecisionPlanAnalysis(result.provider || result.analysis.provider || null, runtimeEvents, playback, result.analysis?.error || result.provider?.status || 'LLM decision plan unavailable'),
        inputSummary: {
          decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
          runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
        },
      };
    }
    if (!runtimeEvents.length) {
      return {
        ...result.analysis,
        timeline: sanitizeGroundedTimelineText(Array.isArray(result.analysis?.timeline) ? result.analysis.timeline : []),
        provider: result.provider || result.analysis.provider || null,
        runtimeGrounded: false,
        timelineSource: 'llm-unavailable-runtime',
        inputSummary: {
          decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
          runtimeEventCount: 0,
        },
      };
    }
    const runtimeProviderFallback = buildRuntimeFallbackDecisionPlanAnalysis(
      result.provider || result.analysis.provider || null,
      runtimeEvents,
      playback,
      'Runtime-grounded decision chain polished by LLM'
    );
    const finalTimeline = applyPolishedTextToRuntimeTimeline(
      runtimeProviderFallback.timeline,
      Array.isArray(result.analysis?.timeline) ? result.analysis.timeline : []
    );
    return {
      ...result.analysis,
      timeline: finalTimeline.length ? finalTimeline : runtimeProviderFallback.timeline,
      provider: result.provider || result.analysis.provider || null,
      runtimeGrounded: true,
      timelineSource: 'runtime-events-llm-polished',
      inputSummary: {
        decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
        runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
      },
    };
  } catch (error) {
    return {
      ...buildRuntimeFallbackDecisionPlanAnalysis(null, runtimeEvents, playback, error),
      inputSummary: {
        decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
        runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
      },
    };
  }
}

async function resolveDecisionPlanForMode(prepared, scenario, payload, mode = 'final', playback = null) {
  const configuredProvider = getConfiguredDecisionPlanProvider();
  if (mode === 'preview') {
    if (!configuredProvider.enabled) {
      return {
        analysis: buildDecisionPlanFailureAnalysis(
          configuredProvider.provider,
          configuredProvider.provider.status
        ),
        deferred: false,
      };
    }
    return {
      analysis: buildDecisionPlanPendingAnalysis(
        configuredProvider.provider,
        configuredProvider.enabled
          ? `${configuredProvider.provider.status} · background refinement pending`
          : configuredProvider.provider.status
      ),
      deferred: Boolean(configuredProvider.enabled),
    };
  }
  return {
    analysis: await resolveLlmDecisionPlan(prepared, scenario, payload, playback),
    deferred: false,
  };
}

async function runHeatmapDecisionPlanOnly(payload, options = {}) {
  const { simData, healthyAgents } = loadRequestData(payload, options);
  const prepared = Sim.prepareSimData(simData, { healthyAgents });
  const mode = 'final';
  let backgroundField = options?.backgroundField || null;
  if (!backgroundField && options?.cacheDir) {
    const backgroundFingerprint = buildBackgroundFieldFingerprint(payload, { ...options, mode, prepared });
    const backgroundCacheKey = buildHeatmapCacheKey(backgroundFingerprint);
    backgroundField = readHeatmapCache(options.cacheDir, backgroundCacheKey);
  }
  const scenario = Sim.createScenario(prepared, {
    ...(payload?.scenarioOptions || {}),
    ...(backgroundField ? { backgroundField } : {}),
  });
  const { analysis } = await resolveDecisionPlanForMode(
    prepared,
    scenario,
    payload,
    'final',
    options?.playback || null
  );
  return analysis;
}

async function ensureBackgroundFieldForSimulation(payload, options = {}) {
  const mode = options.mode === 'preview' ? 'preview' : 'final';
  const prepared = options.prepared;
  const focusBudgetScenario = options.focusBudgetScenario;
  const backgroundMinimumSimulationSeconds = Math.min(
    BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
    Number(options.backgroundMinimumSimulationSeconds || 0)
  );
  const backgroundFingerprint = buildBackgroundFieldFingerprint(payload, {
    ...options,
    mode,
    prepared,
    backgroundMinimumSimulationSeconds,
  });
  const backgroundCacheKey = buildHeatmapCacheKey(backgroundFingerprint);
  const backgroundScenarioOptions = getBackgroundFieldScenarioOptions(payload, prepared, options);
  const resolvedBackgroundCrowdCount = normalizeBackgroundCrowdCount(backgroundScenarioOptions.backgroundCrowdCount);
  let backgroundCacheHit = false;
  let backgroundField = options?.backgroundField || null;
  const backgroundStartedAt = Date.now();

  if (!backgroundField && options?.cacheDir) {
    backgroundField = readHeatmapCache(options.cacheDir, backgroundCacheKey);
    backgroundCacheHit = Boolean(backgroundField);
    if (backgroundField && Number(backgroundField.duration || 0) + 1e-6 < backgroundMinimumSimulationSeconds) {
      backgroundField = null;
      backgroundCacheHit = false;
    }
  }

  if (!backgroundField) {
    const backgroundScenario = Sim.createScenario(prepared, backgroundScenarioOptions);
    const requestedBackgroundHeatOptions = getBackgroundFieldHeatOptions(payload, mode, {
      minimumSimulationSeconds: backgroundMinimumSimulationSeconds,
      resolvedBackgroundCrowdCount,
      maxSimulationSecondsOverride: options?.maxSimulationSecondsOverride,
    });
    const backgroundHeatOptions = {
      ...requestedBackgroundHeatOptions,
      maxSimulationSeconds: Math.min(
        BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
        Math.max(
          requestedBackgroundHeatOptions.maxSimulationSeconds,
          Number(options?.forceBackgroundMaxSimulationSeconds || 0) || estimateBackgroundFieldBudgetSeconds(
            focusBudgetScenario,
            requestedBackgroundHeatOptions.maxSimulationSeconds
          )
        )
      ),
    };
    backgroundField = await Sim.precomputeBackgroundFieldAsync(prepared, backgroundScenario, {
      ...backgroundHeatOptions,
      frameBudgetMs: mode === 'preview' ? SERVER_PREVIEW_FRAME_BUDGET_MS : SERVER_FINAL_FRAME_BUDGET_MS,
      onProgress: typeof options?.onProgress === 'function'
        ? (progress) => options.onProgress({
            ...progress,
            stage: 'background',
            cacheKey: options.cacheKey || null,
            backgroundCacheKey,
          })
        : undefined,
    });
    if (options?.cacheDir) {
      writeHeatmapCache(options.cacheDir, backgroundCacheKey, backgroundField);
    }
  } else if (typeof options?.onProgress === 'function') {
    const backgroundHeatOptions = getBackgroundFieldHeatOptions(payload, mode, {
      minimumSimulationSeconds: backgroundMinimumSimulationSeconds,
      resolvedBackgroundCrowdCount,
      maxSimulationSecondsOverride: options?.maxSimulationSecondsOverride,
    });
    options.onProgress({
      stage: 'background',
      cacheKey: options.cacheKey || null,
      backgroundCacheKey,
      simulatedSeconds: backgroundHeatOptions.maxSimulationSeconds,
      maxSimulationSeconds: backgroundHeatOptions.maxSimulationSeconds,
      completed: true,
      cacheHit: true,
    });
  }

  return {
    backgroundCacheHit,
    backgroundCacheKey,
    backgroundDurationMs: Date.now() - backgroundStartedAt,
    backgroundField,
    resolvedBackgroundCrowdCount,
  };
}

async function prewarmBackgroundField(payload, options = {}) {
  const { simData, healthyAgents } = loadRequestData(payload, options);
  const prepared = Sim.prepareSimData(simData, { healthyAgents });
  const focusBudgetScenario = Sim.createScenario(prepared, payload?.scenarioOptions || {});
  return ensureBackgroundFieldForSimulation(payload, {
    ...options,
    mode: 'final',
    prepared,
    focusBudgetScenario,
    backgroundMinimumSimulationSeconds: BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
    forceBackgroundMaxSimulationSeconds: BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
  });
}

function estimateFocusHeatmapBudgetSeconds(scenario, requestedSeconds) {
  const requested = Math.max(30, Number(requestedSeconds || 0));
  const pathLength = Number(scenario?.focusAgent?.pathLength || scenario?.focusRoute?.pathLength || 0);
  const walkingSpeed = Math.max(0.15, Number(scenario?.focusAgent?.profile?.walkingSpeed || 0.9));
  const baseTravelSeconds = pathLength > 0 ? pathLength / walkingSpeed : 0;
  const recommended = Math.ceil((baseTravelSeconds * 1.18 + 24) / 12) * 12;
  return Math.max(requested, Math.min(FOCUS_HEATMAP_MAX_SIMULATION_SECONDS, recommended || requested));
}

async function runHeatmapSimulation(payload, options = {}) {
  const mode = options.mode === 'preview' ? 'preview' : 'final';
  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'bootstrap',
      percent: mode === 'preview' ? 0.05 : 0.03,
    });
  }
  const { simData, healthyAgents } = loadRequestData(payload, options);
  const prepared = Sim.prepareSimData(simData, { healthyAgents });
  const focusBudgetScenario = Sim.createScenario(prepared, payload?.scenarioOptions || {});
  const focusPlaybackHeatOptions = getFocusPlaybackHeatOptions(payload, focusBudgetScenario, mode);
  const backgroundMinimumSimulationSeconds = focusPlaybackHeatOptions.maxSimulationSeconds;
  const requestFingerprint = buildHeatmapRequestFingerprint(payload, options);
  const cacheKey = buildHeatmapCacheKey(requestFingerprint);
  const startedAt = Date.now();

  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'background-prepare',
      percent: mode === 'preview' ? 0.1 : 0.08,
      cacheKey,
      backgroundCacheKey: null,
    });
  }

  const {
    backgroundCacheHit,
    backgroundCacheKey,
    backgroundDurationMs,
    backgroundField,
  } = await ensureBackgroundFieldForSimulation(payload, {
    ...options,
    mode,
    prepared,
    focusBudgetScenario,
    backgroundMinimumSimulationSeconds,
    cacheKey,
  });

  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'focus-prepare',
      percent: mode === 'preview' ? 0.52 : 0.48,
      cacheKey,
      backgroundCacheKey,
      cacheHit: backgroundCacheHit,
    });
  }

  const scenario = Sim.createScenario(prepared, {
    ...(payload?.scenarioOptions || {}),
    backgroundField,
  });
  const deterministicProbe = typeof Sim.buildFocusDecisionPlan === 'function'
    ? Sim.buildFocusDecisionPlan(prepared, scenario, scenario.focusAgent, {
        startAnchor: scenario.focusStartPoint,
        targetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id,
      })
    : null;
  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'llm-strategy',
      percent: mode === 'preview' ? 0.55 : 0.51,
      cacheKey,
      backgroundCacheKey,
      cacheHit: backgroundCacheHit,
    });
  }
  const preRuntimePlan = await resolvePreRuntimeDecisionPlanForSimulation(
    prepared,
    scenario,
    payload,
    mode,
    deterministicProbe
  );
  if (scenario.focusAgent && preRuntimePlan?.routeStyle) {
    scenario.focusAgent.llmRouteStyle = { ...preRuntimePlan.routeStyle };
    scenario.llmDecisionPlan = preRuntimePlan;
  }
  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'focus-ready',
      percent: mode === 'preview' ? 0.58 : 0.54,
      cacheKey,
      backgroundCacheKey,
      llmDeferred: Boolean(preRuntimePlan?.pending),
    });
  }
  const focusHeatOptions = getFocusPlaybackHeatOptions(payload, scenario, mode);
  const playback = await Sim.precomputeHeatPlaybackAsync(prepared, scenario, {
    ...focusHeatOptions,
    frameBudgetMs: mode === 'preview' ? SERVER_PREVIEW_FRAME_BUDGET_MS : SERVER_FINAL_FRAME_BUDGET_MS,
    onProgress: typeof options?.onProgress === 'function'
      ? (progress) => options.onProgress({
          ...progress,
          stage: 'focus',
          cacheKey,
          backgroundCacheKey,
        })
      : undefined,
  });
  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'runtime-decision-chain',
      percent: mode === 'preview' ? 0.96 : 0.94,
      cacheKey,
      backgroundCacheKey,
    });
  }
  const runtimeEvents = buildRuntimeEventsFromPlayback(playback);
  const runtimeFallback = buildRuntimeFallbackDecisionPlanAnalysis(
    preRuntimePlan?.provider || null,
    runtimeEvents,
    playback,
    'Runtime-grounded decision chain'
  );
  let runtimeTimelinePlan = runtimeFallback;
  if (mode !== 'preview' && getConfiguredDecisionPlanProvider().enabled) {
    if (typeof options?.onProgress === 'function') {
      options.onProgress({
        stage: 'runtime-decision-chain-polish',
        percent: 0.965,
        cacheKey,
        backgroundCacheKey,
      });
    }
    runtimeTimelinePlan = await resolveLlmDecisionPlan(prepared, scenario, payload, playback) || runtimeFallback;
  }
  const llmDecisionPlan = mergePreRuntimePlanWithRuntimeTimeline(preRuntimePlan, runtimeTimelinePlan);
  const llmDeferred = Boolean(preRuntimePlan?.pending);
  if (llmDecisionPlan) {
    playback.llmDecisionPlan = llmDecisionPlan;
    scenario.llmDecisionPlan = llmDecisionPlan;
  }
  return serializePlaybackResult(playback, {
    cacheHit: false,
    cacheKey,
    backgroundCacheKey,
    backgroundCacheHit,
    backgroundDurationMs,
    durationMs: Date.now() - startedAt,
    simulatedRouteId: scenario.focusRoute?.id || null,
    focusRoutePresetId: scenario.focusRoutePreset?.id || payload?.scenarioOptions?.focusRouteId || null,
    focusTargetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id || null,
    simulatedCrowdCount: scenario.simulatedCrowdCount || 0,
    resultQuality: llmDeferred ? 'preview' : 'final',
    refinementPending: llmDeferred,
    llmDeferred,
    llmDecisionPlan,
  });
}

module.exports = {
  BACKGROUND_FIELD_BUCKET_CROWD_COUNTS,
  buildBackgroundFieldFingerprint,
  buildHeatmapRequestFingerprint,
  estimateBackgroundFieldBudgetSeconds,
  prewarmBackgroundField,
  resolveBackgroundFieldBucketCrowdCount,
  runHeatmapDecisionPlanOnly,
  runHeatmapSimulation,
  serializePlaybackResult,
  __private: {
    buildDecisionPlanInput,
    buildRuntimeEventsFromPlayback,
    groundTimelineAgainstRuntimeEvents,
    mergePreRuntimePlanWithRuntimeTimeline,
    applyPolishedTextToRuntimeTimeline,
    normalizeRouteStyleForSimulation,
    sanitizeGroundedTimelineText,
    buildRuntimeFallbackDecisionPlanAnalysis,
  },
};
