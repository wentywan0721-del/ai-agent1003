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

const HEATMAP_ENGINE_VERSION = 'node-cache-v33';
const BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v25';
const BACKGROUND_FIELD_FRAME_STEP_SECONDS = 0.42;
const BACKGROUND_FIELD_MAX_SIMULATION_SECONDS = 480;
const FOCUS_HEATMAP_MAX_SIMULATION_SECONDS = 960;
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

function getBackgroundFieldScenarioOptions(payload, prepared = null) {
  const scenarioOptions = payload?.scenarioOptions || {};
  const canonicalRoute = Array.isArray(prepared?.focusRoutePresets)
    ? prepared.focusRoutePresets.find((preset) => preset?.id && prepared.focusRoutePresetById?.[preset.id])
    : null;
  if (canonicalRoute?.id) {
    return {
      crowdPresetId: scenarioOptions.crowdPresetId || 'normal',
      backgroundCrowdCount: scenarioOptions.backgroundCrowdCount,
      focusRouteId: canonicalRoute.id,
      focusProfile: {},
    };
  }
  return {
    crowdPresetId: scenarioOptions.crowdPresetId || 'normal',
    backgroundCrowdCount: scenarioOptions.backgroundCrowdCount,
    startPoint: scenarioOptions.startPoint,
    targetRegionId: scenarioOptions.targetRegionId,
    focusProfile: {},
  };
}

function getBackgroundFieldHeatOptions(payload, mode = 'final', options = {}) {
  const heatOptions = payload?.heatOptions || {};
  const backgroundCrowdCount = Number(payload?.scenarioOptions?.backgroundCrowdCount || 0);
  const minimumSimulationSeconds = Math.max(0, Number(options?.minimumSimulationSeconds || 0));
  const frameStepSeconds = backgroundCrowdCount > 1800
    ? 0.6
    : backgroundCrowdCount > 900
      ? 0.54
      : backgroundCrowdCount > 400
        ? 0.48
        : BACKGROUND_FIELD_FRAME_STEP_SECONDS;
  const resolvedFrameStepSeconds = mode === 'preview'
    ? Math.min(
        SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MAX_SECONDS,
        Math.max(BACKGROUND_FIELD_FRAME_STEP_SECONDS, frameStepSeconds * SERVER_PREVIEW_BACKGROUND_FRAME_STEP_MULTIPLIER)
      )
    : frameStepSeconds;
  return {
    maxSimulationSeconds: Math.min(
      BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
      Math.max(
        30,
        minimumSimulationSeconds,
        Math.min(
          mode === 'preview' ? SERVER_PREVIEW_BACKGROUND_MAX_SIMULATION_SECONDS : BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,
          Number(heatOptions.maxSimulationSeconds || BACKGROUND_FIELD_MAX_SIMULATION_SECONDS)
        )
      )
    ),
    frameStepSeconds: resolvedFrameStepSeconds,
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
  return {
    simData,
    healthyAgents,
    scenarioOptions: getBackgroundFieldScenarioOptions(payload, prepared),
    heatOptions: getBackgroundFieldHeatOptions(payload, options?.mode === 'preview' ? 'preview' : 'final'),
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
    fatiguePercent: Number(getSnapshotFatiguePercent(snapshot).toFixed(1)),
    restState: snapshot?.restState || 'none',
    restMode: snapshot?.restMode || null,
    topBurdenId: snapshot?.topBurdenId || null,
    topPressureSource: Array.isArray(snapshot?.topPressureSources) && snapshot.topPressureSources.length
      ? {
          id: snapshot.topPressureSources[0].id || null,
          name: snapshot.topPressureSources[0].name || null,
          category: snapshot.topPressureSources[0].category || null,
          feature: snapshot.topPressureSources[0].feature || null,
          score: Number(safeNumber(snapshot.topPressureSources[0].score, snapshot.topPressureSources[0].pressure || 0).toFixed(3)),
        }
      : null,
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
  const burdenSpikeSeen = new Set();
  snapshots.forEach((snapshot, index) => {
    const restState = String(snapshot?.restState || 'none');
    if (snapshot?.shortRestMarker) {
      events.push(createRuntimeEvent('short_rest_started', snapshot, index, snapshots.length, {
        thresholdPercent: Number(safeNumber(snapshot.shortRestMarker.thresholdPercent, 0).toFixed(1)),
      }));
    }
    if (restState !== previousRestState && restState !== 'none') {
      const type = restState === 'searching' ? 'seat_search_started' : 'rest_state_changed';
      events.push(createRuntimeEvent(type, snapshot, index, snapshots.length, {
        restState,
        restMode: snapshot?.restMode || restState,
        nearbySeatCount: Array.isArray(snapshot?.nearbySeats) ? snapshot.nearbySeats.length : 0,
        nearestSeatDistance: Array.isArray(snapshot?.nearbySeats) && snapshot.nearbySeats.length
          ? Number(safeNumber(snapshot.nearbySeats[0].distance, 0).toFixed(2))
          : null,
      }));
    }
    previousRestState = restState;

    Object.entries(snapshot?.burdenScores || {}).forEach(([dimension, value]) => {
      const score = safeNumber(value, 0);
      const threshold = dimension === 'vitality' ? 85 : 70;
      const key = `${dimension}:${Math.floor(score / 10) * 10}`;
      if (score >= threshold && !burdenSpikeSeen.has(key)) {
        burdenSpikeSeen.add(key);
        events.push(createRuntimeEvent('burden_spike', snapshot, index, snapshots.length, {
          dimension,
          score: Number(score.toFixed(1)),
          threshold,
        }));
      }
    });
  });
  const lastSnapshot = snapshots[snapshots.length - 1];
  const finalProgress = clamp(lastSnapshot?.progress, 0, 1);
  events.push(createRuntimeEvent(finalProgress >= 0.985 ? 'route_completed' : 'route_incomplete', lastSnapshot, snapshots.length - 1, snapshots.length, {
    finalProgress: Number(finalProgress.toFixed(3)),
  }));

  return events
    .sort((left, right) => safeNumber(left.timeSeconds, 0) - safeNumber(right.timeSeconds, 0))
    .slice(0, 24);
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
    },
    routeContext: humanContext?.routeContext || null,
    environmentContext: humanContext?.environmentContext || null,
    allowedPressureMentions,
    routeStyleHint: probe?.routeStyle || null,
    decisionPoints: Array.isArray(probe?.decisions) ? probe.decisions : [],
    runtimeEvents,
  };
}

function interpolateRuntimeEventValue(lowerValue, upperValue, ratio) {
  const safeRatio = clamp(ratio, 0, 1);
  const lower = safeNumber(lowerValue, 0);
  const upper = safeNumber(upperValue, lower);
  return lower + (upper - lower) * safeRatio;
}

function groundTimelineAgainstRuntimeEvents(timeline = [], runtimeEvents = [], playback = null) {
  const orderedTimeline = Array.isArray(timeline)
    ? timeline
      .filter(Boolean)
      .slice()
      .sort((left, right) => safeNumber(left?.order, 0) - safeNumber(right?.order, 0))
    : [];
  const orderedEvents = Array.isArray(runtimeEvents)
    ? runtimeEvents
      .filter(Boolean)
      .slice()
      .sort((left, right) => safeNumber(left?.timeSeconds, 0) - safeNumber(right?.timeSeconds, 0))
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
      return {
        ...item,
        timeSeconds: Number(interpolateRuntimeEventValue(timeStart, timeEnd, ratio).toFixed(2)),
        progress: Number(clamp(interpolateRuntimeEventValue(progressStart, progressEnd, ratio), 0, 1).toFixed(3)),
        runtimeEventType: String(event?.type || item?.runtimeEventType || '').trim() || null,
        runtimeRestState: String(event?.restState || item?.runtimeRestState || '').trim() || null,
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
    return {
      ...item,
      timeSeconds: Number(timeSeconds.toFixed(2)),
      progress: Number(clamp(progress, 0, 1).toFixed(3)),
      runtimeEventType: String(nearestEvent?.type || item?.runtimeEventType || '').trim() || null,
      runtimeRestState: String(nearestEvent?.restState || item?.runtimeRestState || '').trim() || null,
    };
  });
}

async function resolveLlmDecisionPlan(prepared, scenario, payload, playback = null) {
  const llmInput = buildDecisionPlanInput(prepared, scenario, payload, playback);
  if (!llmInput) {
    return null;
  }
  try {
    const result = await requestLlmDecisionPlan(llmInput);
    if (!result?.analysis) {
      return {
        ...buildDecisionPlanFailureAnalysis(result?.provider || null, 'LLM decision plan unavailable'),
        inputSummary: {
          decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
          runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
        },
      };
    }
    const groundedTimeline = groundTimelineAgainstRuntimeEvents(
      Array.isArray(result.analysis?.timeline) ? result.analysis.timeline : [],
      Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents : [],
      playback
    );
    return {
      ...result.analysis,
      timeline: groundedTimeline.length ? groundedTimeline : result.analysis.timeline,
      provider: result.provider || result.analysis.provider || null,
      inputSummary: {
        decisionPointCount: Array.isArray(llmInput?.decisionPoints) ? llmInput.decisionPoints.length : 0,
        runtimeEventCount: Array.isArray(llmInput?.runtimeEvents) ? llmInput.runtimeEvents.length : 0,
      },
    };
  } catch (error) {
    return {
      ...buildDecisionPlanFailureAnalysis(null, error),
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
  const { analysis } = await resolveDecisionPlanForMode(prepared, scenario, payload, 'final');
  return analysis;
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
  const backgroundFingerprint = buildBackgroundFieldFingerprint(payload, {
    ...options,
    mode,
    prepared,
    backgroundMinimumSimulationSeconds,
  });
  const backgroundCacheKey = buildHeatmapCacheKey(backgroundFingerprint);
  const startedAt = Date.now();
  const heatOptions = payload?.heatOptions || {};
  const backgroundScenarioOptions = getBackgroundFieldScenarioOptions(payload, prepared);
  let backgroundCacheHit = false;
  let backgroundField = options?.backgroundField || null;
  const backgroundStartedAt = Date.now();
  let backgroundDurationMs = 0;

  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'background-prepare',
      percent: mode === 'preview' ? 0.1 : 0.08,
      cacheKey,
      backgroundCacheKey,
    });
  }

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
    });
    const backgroundHeatOptions = {
      ...requestedBackgroundHeatOptions,
      maxSimulationSeconds: estimateBackgroundFieldBudgetSeconds(
        focusBudgetScenario,
        requestedBackgroundHeatOptions.maxSimulationSeconds
      ),
    };
    backgroundField = await Sim.precomputeBackgroundFieldAsync(prepared, backgroundScenario, {
      ...backgroundHeatOptions,
      frameBudgetMs: mode === 'preview' ? SERVER_PREVIEW_FRAME_BUDGET_MS : SERVER_FINAL_FRAME_BUDGET_MS,
      onProgress: typeof options?.onProgress === 'function'
        ? (progress) => options.onProgress({
            ...progress,
            stage: 'background',
            cacheKey,
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
    });
    options.onProgress({
      stage: 'background',
      cacheKey,
      backgroundCacheKey,
      simulatedSeconds: backgroundHeatOptions.maxSimulationSeconds,
      maxSimulationSeconds: backgroundHeatOptions.maxSimulationSeconds,
      completed: true,
      cacheHit: true,
    });
  }
  backgroundDurationMs = Date.now() - backgroundStartedAt;

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
  const preRuntimePlan = typeof Sim.buildFocusDecisionPlan === 'function'
    ? Sim.buildFocusDecisionPlan(prepared, scenario, scenario.focusAgent, {
        startAnchor: scenario.focusStartPoint,
        targetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id,
      })
    : null;
  if (scenario.focusAgent && preRuntimePlan?.routeStyle) {
    scenario.focusAgent.llmRouteStyle = { ...preRuntimePlan.routeStyle };
  }
  if (typeof options?.onProgress === 'function') {
    options.onProgress({
      stage: 'focus-ready',
      percent: mode === 'preview' ? 0.58 : 0.54,
      cacheKey,
      backgroundCacheKey,
      llmDeferred: mode === 'preview',
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
      stage: 'llm-decision',
      percent: mode === 'preview' ? 0.96 : 0.94,
      cacheKey,
      backgroundCacheKey,
    });
  }
  const { analysis: llmDecisionPlan, deferred: llmDeferred } = await resolveDecisionPlanForMode(prepared, scenario, payload, mode, playback);
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
  buildBackgroundFieldFingerprint,
  buildHeatmapRequestFingerprint,
  estimateBackgroundFieldBudgetSeconds,
  runHeatmapDecisionPlanOnly,
  runHeatmapSimulation,
  serializePlaybackResult,
  __private: {
    buildDecisionPlanInput,
    groundTimelineAgainstRuntimeEvents,
  },
};
