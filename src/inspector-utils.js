(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    global.InspectorUtils = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getDynamicSimultaneousCount(agents) {
    if (!Array.isArray(agents)) {
      return 0;
    }
    return agents.reduce((count, agent) => (
      agent && agent.active !== false ? count + 1 : count
    ), 0);
  }

  function getCurrentTravelTimeSeconds(options) {
    const candidates = [
      safeNumber(options?.inspectionTime, Number.NaN),
      safeNumber(options?.playbackTime, Number.NaN),
      safeNumber(options?.scenarioTime, Number.NaN),
    ];
    const match = candidates.find((value) => Number.isFinite(value));
    return Number.isFinite(match) ? Math.max(0, match) : 0;
  }

  function getMetricRange(values, fallbackMax = 0) {
    const validValues = Array.isArray(values)
      ? values
        .map((value) => safeNumber(value, Number.NaN))
        .filter((value) => Number.isFinite(value))
      : [];
    if (validValues.length) {
      return {
        minMetric: Math.max(0, Math.min(...validValues)),
        maxMetric: Math.max(0, Math.max(...validValues)),
      };
    }
    const maximum = Math.max(0, safeNumber(fallbackMax, 0));
    return {
      minMetric: 0,
      maxMetric: maximum,
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(safeNumber(value, minimum), minimum), maximum);
  }

  function localize(locale, zh, en) {
    return locale === 'en' ? en : zh;
  }

  function formatCompactMetric(value, fractionDigits = 1) {
    const numeric = safeNumber(value, 0);
    const rounded = Number(numeric.toFixed(fractionDigits));
    return String(Math.abs(rounded - Math.round(rounded)) <= 1e-9 ? Math.round(rounded) : rounded);
  }

  function formatPercentValue(value) {
    return `${Math.round(safeNumber(value, 0))}%`;
  }

  const BURDEN_DIMENSION_ORDER = Object.freeze([
    'locomotor',
    'sensory',
    'cognitive',
    'psychological',
    'vitality',
  ]);

  function getBurdenLabel(id, locale) {
    const labels = {
      locomotor: localize(locale, '行动负担', 'Locomotor Burden'),
      sensory: localize(locale, '感知负担', 'Sensory Burden'),
      cognitive: localize(locale, '决策负担', 'Decision Burden'),
      psychological: localize(locale, '心理负担', 'Psychological Burden'),
      vitality: localize(locale, '疲劳负担', 'Fatigue Burden'),
    };
    return labels[id] || id;
  }

  function sortIssueItems(items, limit = 3) {
    return items
      .filter((item) => item && safeNumber(item.pressure, 0) > 0)
      .sort((left, right) => safeNumber(right.pressure, 0) - safeNumber(left.pressure, 0))
      .slice(0, limit);
  }

  function uniqueIds(values) {
    return Array.from(new Set(
      (Array.isArray(values) ? values : []).filter((value) => Boolean(value))
    ));
  }

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }

  function includesAnyText(value, fragments) {
    const normalized = normalizeText(value);
    return fragments.some((fragment) => normalized.includes(fragment));
  }

  function collectIssueTargetIds(items, predicate) {
    return uniqueIds(
      (Array.isArray(items) ? items : [])
        .filter((item) => item && predicate(item))
        .map((item) => item.id)
    );
  }

  const COGNITIVE_PROBLEM_SEMANTIC_IDS = new Set([
    'small_font_signage',
    'confusing_signage',
    'decision_conflict',
  ]);

  const COGNITIVE_DISTRACTOR_SEMANTIC_IDS = new Set([
    'flashing_ads',
    'static_ads',
    'hanging_signs',
    'ground_atm_signage',
    'tactile_paving_endpoint',
  ]);

  function isLightingSourceItem(item) {
    return includesAnyText(`${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`, [
      'lux',
      'light',
      'lighting',
      'lightbox',
      'glare',
      'bright',
      'illumination',
      createIssueItem({
        id: 'locomotor-obstacle',
        name: localize(locale, '避障频繁打断移动', 'Obstacle Avoidance Breaks Movement Rhythm'),
        category: 'facility',
        categoryLabel: localize(locale, '避障干扰', 'Obstacle Avoidance'),
        feature: localize(locale, '当前路径存在障碍与窄道干扰', 'The current route is affected by obstacles and narrow passages'),
        pressure: obstaclePressure,
        summary: localize(
          locale,
          '周边障碍与窄道正在增加转向和避让次数，通行连续性下降。',
          'Nearby obstacles and narrow passages are increasing steering and avoidance frequency, reducing movement continuity.'
        ),
        advice: localize(
          locale,
          '建议放宽关键转角与窄口处的净空，减少连续避障造成的移动打断。',
          'Widen critical turning areas and narrow passages to reduce repeated interruption from obstacle avoidance.'
        ),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'locomotor-assistive',
        name: localize(locale, '辅助出行通行受限', 'Assistive Movement Is Constrained'),
        category: 'facility',
        categoryLabel: localize(locale, '辅助通行', 'Assistive Access'),
        feature: localize(locale, '当前通行条件对辅助出行设备不够友好', 'Current passage conditions are not friendly to assistive mobility devices'),
        pressure: assistivePressure,
        summary: localize(
          locale,
          '当前通行条件对轮椅、助行器等辅助出行方式不够友好，移动阻力正在增加。',
          'Current passage conditions are not friendly to wheelchairs or walkers, increasing movement resistance.'
        ),
        advice: localize(
          locale,
          '建议优先保证无障碍净宽与转弯空间，减少辅助出行设备受阻。',
          'Ensure clear width and turning space for assistive mobility devices.'
        ),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
      }),
    ]);
  }

  function isLightingSourceItem(item) {
    return includesAnyText(`${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`, [
      'lux',
      'light',
      'lighting',
      'lightbox',
      'glare',
      'bright',
      'illumination',
    ]);
  }

  function isNoiseSourceItem(item) {
    return includesAnyText(`${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`, [
      'noise',
      'broadcast',
      'db',
      'decibel',
      'speaker',
      'horn',
      'noisy',
    ]);
  }

  function isProblemSignSourceItem(item) {
    return includesAnyText(`${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`, [
      'small font',
      'too small',
      'confuse',
      'confusing',
      'conflict',
      'wrong place',
      'improper',
      'mislead',
    ]);
  }

  function isDistractorSourceItem(item) {
    if (includesAnyText(item?.category, ['advert'])) {
      return true;
    }
    return includesAnyText(`${item?.name || ''} ${item?.feature || ''}`, [
      'hanging signs',
      'ground atm signage',
      'end point of tactile paving',
      'advertisement',
      'dynamic ad',
    ]);
  }

  function isConsideredProblemObject(item) {
    const semanticId = normalizeText(item?.semanticId);
    if (COGNITIVE_PROBLEM_SEMANTIC_IDS.has(semanticId)) {
      return true;
    }
    return normalizeText(item?.direction) === 'load'
      && normalizeText(item?.relevance) === 'irrelevant'
      && !COGNITIVE_DISTRACTOR_SEMANTIC_IDS.has(semanticId)
      && semanticId !== 'broadcast_interference';
  }

  function isConsideredDistractorObject(item) {
    const semanticId = normalizeText(item?.semanticId);
    if (COGNITIVE_DISTRACTOR_SEMANTIC_IDS.has(semanticId)) {
      return true;
    }
    return normalizeText(item?.direction) === 'load'
      && normalizeText(item?.relevance) === 'distractor';
  }

  function isConsideredNoiseObject(item) {
    const semanticId = normalizeText(item?.semanticId);
    return semanticId === 'broadcast_interference' || semanticId === 'noise';
  }

  function isConsideredGuideObject(item) {
    const semanticId = normalizeText(item?.semanticId);
    return normalizeText(item?.direction) === 'support'
      && semanticId !== 'service_guidance'
      && semanticId !== 'customer_service_centre'
      && semanticId !== 'ai_virtual_service_ambassador';
  }

  function isGuideSourceItem(item) {
    const combined = `${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`;
    return (
      includesAnyText(combined, ['sign', 'guide', 'direction', 'map', 'lcd'])
      && !isDistractorSourceItem(item)
      && !isNoiseSourceItem(item)
    );
  }

  function createIssueItem(item) {
    const mapTargetIds = uniqueIds([
      ...(Array.isArray(item.mapTargetIds) ? item.mapTargetIds : []),
      item.mapTargetId,
      item.mapTargetId === undefined ? item.id : null,
    ]);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      categoryLabel: item.categoryLabel,
      feature: item.feature,
      pressure: safeNumber(item.pressure, 0),
      score: safeNumber(item.score, safeNumber(item.pressure, 0)),
      pressureDelta: safeNumber(item.pressureDelta, safeNumber(item.pressure, 0)),
      sourceKind: item.sourceKind || null,
      summary: item.summary || item.feature || null,
      advice: item.advice || null,
      metricLabel: item.metricLabel || null,
      isStatusCard: Boolean(item.isStatusCard),
      showImpact: item.showImpact !== false,
      actionViewMode: item.actionViewMode || null,
      overlayKind: item.overlayKind || null,
      mapTargetId: item.mapTargetId === undefined
        ? (mapTargetIds[0] || item.id || null)
        : (item.mapTargetId || mapTargetIds[0] || null),
      mapTargetIds,
    };
  }

  function buildLocomotorIssueItems(inspection, locale) {
    const locomotor = inspection?.fiveDimensions?.burdens?.locomotor || {};
    const nearbyNode = inspection?.fiveDimensions?.context?.nearbyNodes?.[0] || null;
    const crowdPressure = clamp((safeNumber(inspection?.crowdDensity, 0) - 0.8) / 2.2, 0, 1) * 100;
    const queuePressure = clamp((safeNumber(inspection?.queueCount, 0) - 2) / 8, 0, 1) * 100;
    return sortIssueItems([
      createIssueItem({
        id: 'locomotor-speed',
        name: localize(locale, '步行速度受限', 'Walking Speed Reduced'),
        category: 'facility',
        categoryLabel: localize(locale, '行动效率', 'Locomotor'),
        feature: localize(locale, `当前速度 ${safeNumber(inspection?.walkingSpeed, 0).toFixed(2)} m/s`, `Current speed ${safeNumber(inspection?.walkingSpeed, 0).toFixed(2)} m/s`),
        pressure: safeNumber(locomotor.speedPenaltyRatio, 0) * 100,
        advice: localize(locale, '建议降低连续转向和局部对冲，保证步行线更直更顺。', 'Reduce repeated turning and crossing conflicts so walking lines stay direct.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
        name: localize(locale, '人群密度阻碍通行', 'Crowd Density Obstructs Movement'),
        categoryLabel: localize(locale, '人群阻碍', 'Crowd Friction'),
        feature: localize(
          locale,
          `当前人群密度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/m²`,
          `Current crowd density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`
        ),
        summary: localize(
          locale,
          '当前位置周边人群密度较高，正在压缩可通行空间并降低通过效率。',
          'Crowd density around the agent is compressing usable passage space and lowering movement efficiency.'
        ),
        advice: localize(
          locale,
          '建议优先疏解瓶颈处汇流，并为低行动能力代理人预留更连续的通行带。',
          'Reduce bottleneck merging and keep a more continuous passage band for low-mobility agents.'
        ),
        metricLabel: localize(locale, '影响程度', 'Impact'),
      }),
      createIssueItem({
        id: 'locomotor-facility',
        name: localize(locale, '设施转换门槛高', 'Facility Transition Barrier'),
        category: 'facility',
        categoryLabel: localize(locale, '设施门槛', 'Facility Barrier'),
        feature: nearbyNode
          ? localize(locale, `邻近节点：${nearbyNode.name || nearbyNode.id}`, `Nearby node: ${nearbyNode.name || nearbyNode.id}`)
          : localize(locale, '附近存在设施切换节点', 'Facility switching occurs nearby'),
        pressure: safeNumber(locomotor.facilityBarrier, 0) * 100,
        advice: localize(locale, '建议优先优化楼梯、扶梯、电梯附近的通行衔接。', 'Improve circulation transitions near stairs, escalators, and elevators.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
        name: localize(locale, '竖向换乘增加行动负担', 'Vertical Transfer Raises Locomotor Burden'),
        categoryLabel: localize(locale, '竖向换乘', 'Vertical Transfer'),
        feature: nearbyNodeLabel
          ? localize(locale, `当前关联节点 ${nearbyNodeLabel}`, `Current linked node ${nearbyNodeLabel}`)
          : localize(locale, '当前处于竖向换乘敏感区', 'The agent is near a vertical-transfer-sensitive zone'),
        summary: nearbyNodeLabel
          ? localize(
            locale,
            `当前位置接近${nearbyNodeLabel}，竖向换乘正在抬高行动负担。`,
            `The current position is close to ${nearbyNodeLabel}, where vertical transfer is increasing locomotor burden.`
          )
          : localize(
            locale,
            '当前位置接近竖向换乘节点，换层动作正在抬高行动负担。',
            'The current position is close to a vertical transfer node, increasing locomotor burden.'
          ),
        advice: localize(
          locale,
          '建议优先优化电梯或换乘节点与主通道的衔接，减少换层阻滞。',
          'Improve the connection between elevators or transfer nodes and the main corridor to reduce transfer resistance.'
        ),
        metricLabel: localize(locale, '影响程度', 'Impact'),
      }),
      createIssueItem({
        id: 'locomotor-crowd',
        name: localize(locale, '局部拥挤阻行', 'Crowding Slows Movement'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '人流拥挤', 'Crowding'),
        feature: localize(locale, `当前拥挤度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡`, `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`),
        pressure: crowdPressure,
        advice: localize(locale, '建议减小瓶颈口汇流并扩展绕行空间。', 'Reduce merging at bottlenecks and provide more bypass space.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'locomotor-queue',
        name: localize(locale, '排队阻塞通行', 'Queue Blocks Movement'),
        category: 'facility',
        categoryLabel: localize(locale, '排队阻塞', 'Queueing'),
        feature: localize(locale, `排队人数 ${Math.round(safeNumber(inspection?.queueCount, 0))} 人`, `Queue count ${Math.round(safeNumber(inspection?.queueCount, 0))}`),
        pressure: queuePressure,
        advice: localize(locale, '建议将排队区与主通道脱开，避免行走路径被占用。', 'Separate queueing space from the main corridor to keep paths clear.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
    ]);
  }

  function buildLocomotorIssueItemsV2(inspection, locale) {
    const locomotor = inspection?.fiveDimensions?.burdens?.locomotor || {};
    const nearbyNode = inspection?.fiveDimensions?.context?.nearbyNodes?.[0] || null;
    const nearbyNodeLabel = nearbyNode?.name || nearbyNode?.id || null;
    const crowdPressure = clamp(
      safeNumber(locomotor.crowdResistance, 0) * 100 + safeNumber(locomotor.microJam, 0),
      0,
      100
    );
    const verticalPressure = clamp(safeNumber(locomotor.verticalTransferResistance, 0) * 140 + 6, 0, 100);
    const queuePressure = clamp(safeNumber(locomotor.queueResistance, 0) * 85, 0, 100);
    const obstaclePressure = clamp(
      safeNumber(locomotor.obstacleAvoidanceResistance, 0) * 100
      + safeNumber(locomotor.narrowPassageResistance, 0) * 45
      + safeNumber(locomotor.wallFollowStrength, 0) * 25,
      0,
      100
    );
    const assistivePressure = clamp(safeNumber(locomotor.assistiveDeviceResistance, 0) * 15, 0, 100);
    return sortIssueItems([
      createIssueItem({
        id: 'locomotor-crowd',
        name: localize(locale, '高拥挤阻碍通行', 'Crowd Resistance'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '人流阻力', 'Crowd'),
        feature: localize(locale, `当前密度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡`, `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`),
        pressure: crowdPressure,
        advice: localize(locale, '建议减小瓶颈区汇流并增加绕行余量。', 'Reduce bottleneck merging and add bypass space.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'locomotor-vertical',
        name: localize(locale, '垂直换乘阻力高', 'Vertical Transfer Resistance'),
        category: 'facility',
        categoryLabel: localize(locale, '设施转换', 'Vertical Access'),
        feature: nearbyNode
          ? localize(locale, `邻近节点 ${nearbyNode.name || nearbyNode.id}`, `Nearby node ${nearbyNode.name || nearbyNode.id}`)
          : localize(locale, '当前处于设施切换敏感区', 'Facility transition zone nearby'),
        pressure: verticalPressure,
        advice: localize(locale, '建议优先优化电梯与主通道的衔接，减少换乘阻滞。', 'Improve elevator and corridor connection to reduce transfer resistance.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
        name: localize(locale, '排队占道增加绕行', 'Queue Occupies the Passage'),
        categoryLabel: localize(locale, '排队占道', 'Queue Occupancy'),
        feature: localize(
          locale,
          `当前排队人数 ${Math.round(safeNumber(inspection?.queueCount, 0))} 人`,
          `Current queue count ${Math.round(safeNumber(inspection?.queueCount, 0))}`
        ),
        summary: localize(
          locale,
          '排队人群正在占用主通行带，代理人需要减速或绕行通过。',
          'Queueing people are occupying the main corridor, forcing the agent to slow down or detour.'
        ),
        advice: localize(
          locale,
          '建议将排队区从主通行带旁移开，避免连续通行路径被占用。',
          'Move queueing away from the main corridor so the continuous route remains clear.'
        ),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        overlayKind: 'queue-zone',
      }),
      createIssueItem({
        id: 'locomotor-queue',
        name: localize(locale, '排队阻塞通行', 'Queue Blocks Movement'),
        category: 'facility',
        categoryLabel: localize(locale, '排队阻塞', 'Queueing'),
        feature: localize(locale, `排队人数 ${Math.round(safeNumber(inspection?.queueCount, 0))} 人`, `Queue count ${Math.round(safeNumber(inspection?.queueCount, 0))}`),
        pressure: queuePressure,
        advice: localize(locale, '建议将排队区与主通道脱开，避免占用连续通行带。', 'Separate queue zones from the main corridor.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
      }),
    ]);
  }

  function buildSensoryIssueItemsLegacy(inspection, locale) {
    const sensory = inspection?.fiveDimensions?.burdens?.sensory || {};
    const missedObjects = Array.isArray(sensory.missedObjects) ? sensory.missedObjects : [];
    const missedPrimary = missedObjects[0] || null;
    return sortIssueItems([
      createIssueItem({
        id: 'sensory-miss',
        name: localize(locale, '导向漏读', 'Guidance Missed'),
        category: 'signage',
        categoryLabel: localize(locale, '识别缺失', 'Recognition Loss'),
        feature: missedPrimary
          ? localize(locale, `易漏读对象：${missedPrimary.name || missedPrimary.id}`, `Missed object: ${missedPrimary.name || missedPrimary.id}`)
          : localize(locale, `漏读对象 ${missedObjects.length} 个`, `${missedObjects.length} objects missed`),
        pressure: clamp(missedObjects.length / 3, 0, 1) * 100,
        advice: localize(locale, '建议提高关键标识对比度、字号或降低遮挡。', 'Increase contrast, font size, or reduce occlusion for key signs.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: missedPrimary?.id || null,
      }),
      createIssueItem({
        id: 'sensory-noise',
        name: localize(locale, '环境噪音干扰感知', 'Noise Disrupts Sensory'),
        category: 'noise',
        categoryLabel: localize(locale, '噪音干扰', 'Noise'),
        feature: localize(locale, `当前噪音 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`, `Noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`),
        pressure: safeNumber(sensory.noisePenalty, 0) * 100,
        advice: localize(locale, '建议压低高噪声源或减少其与导向信息的重叠。', 'Reduce high-noise sources or separate them from wayfinding cues.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'sensory-lighting',
        name: localize(locale, '光照条件不利识别', 'Lighting Hinders Recognition'),
        category: 'facility',
        categoryLabel: localize(locale, '光照异常', 'Lighting'),
        feature: localize(locale, `当前照度 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`, `Lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`),
        pressure: safeNumber(sensory.lightingPenalty, 0) * 100,
        advice: localize(locale, '建议修正过暗或过亮区域，避免标识被淹没。', 'Correct overly dim or bright zones so wayfinding remains legible.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'sensory-occlusion',
        name: localize(locale, '人群遮挡增加漏读', 'Crowd Occlusion Increases Misses'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '遮挡拥挤', 'Occlusion'),
        feature: localize(locale, `当前拥挤度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡`, `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`),
        pressure: safeNumber(sensory.occlusionPenalty, 0) * 100,
        advice: localize(locale, '建议在遮挡高发区提前布置更高位或更连续的导向。', 'Add higher or more continuous guidance where crowd occlusion is common.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
    ]);
  }

  function buildSensoryIssueItemsLegacyV2(inspection, topPressureSources, locale) {
    const sensory = inspection?.fiveDimensions?.burdens?.sensory || {};
    const cognitive = inspection?.decisionDiagnostics || inspection?.fiveDimensions?.burdens?.cognitive || {};
    const consideredObjects = Array.isArray(cognitive.consideredObjects) ? cognitive.consideredObjects : [];
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];
    const clutterTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredDistractorObject),
      ...collectIssueTargetIds(consideredObjects, isConsideredProblemObject),
      ...collectIssueTargetIds(explicitSources, isDistractorSourceItem),
      ...collectIssueTargetIds(explicitSources, isProblemSignSourceItem),
    ]);
    const noiseTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredNoiseObject),
      ...collectIssueTargetIds(explicitSources, isNoiseSourceItem),
    ]);
    const lightingTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isLightingSourceItem));
    return sortIssueItems([
      createIssueItem({
        id: 'sensory-clutter',
        name: localize(locale, '视觉杂乱过高', 'Visual Clutter Too High'),
        category: 'advert',
        categoryLabel: localize(locale, '视觉杂乱', 'Visual Clutter'),
        feature: localize(
          locale,
          `视觉干扰源 ${clutterTargetIds.length} 个`,
          `${clutterTargetIds.length} visual distractor sources`
        ),
        pressure: safeNumber(sensory.visualClutterPenalty, 0) * 100,
        advice: localize(locale, '建议减少广告、干扰标识和问题标识在同一视野内的叠加。', 'Reduce ads, distractor signs, and problematic signs within the same field of view.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: clutterTargetIds,
      }),
      createIssueItem({
        id: 'sensory-noise',
        name: localize(locale, '环境噪音干扰感知', 'Noise Disrupts Sensory'),
        category: 'noise',
        categoryLabel: localize(locale, '噪音干扰', 'Noise'),
        feature: localize(
          locale,
          `当前噪音 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB${noiseTargetIds.length ? `，来源 ${noiseTargetIds.length} 个` : ''}`,
          `Noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB${noiseTargetIds.length ? `, ${noiseTargetIds.length} sources` : ''}`
        ),
        pressure: safeNumber(sensory.noisePenalty, 0) * 100,
        advice: localize(locale, '建议降低高噪音源，或减少它与关键导向信息的重叠。', 'Reduce high-noise sources or separate them from key wayfinding cues.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'sensory-lighting',
        name: localize(locale, '光照条件不利识别', 'Lighting Hinders Recognition'),
        category: 'facility',
        categoryLabel: localize(locale, '光照异常', 'Lighting'),
        feature: localize(
          locale,
          `当前照度 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux${lightingTargetIds.length ? `，来源 ${lightingTargetIds.length} 个` : ''}`,
          `Lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux${lightingTargetIds.length ? `, ${lightingTargetIds.length} sources` : ''}`
        ),
        pressure: safeNumber(sensory.lightingPenalty, 0) * 100,
        advice: localize(locale, '建议修正过暗或过亮区域，避免标识被淹没。', 'Correct overly dim or bright zones so wayfinding remains legible.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: lightingTargetIds,
      }),
      createIssueItem({
        id: 'sensory-occlusion',
        name: localize(locale, '人群遮挡增加漏读', 'Crowd Occlusion Increases Misses'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '遮挡拥挤', 'Occlusion'),
        feature: localize(
          locale,
          `当前拥挤度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡`,
          `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`
        ),
        pressure: safeNumber(sensory.occlusionPenalty, 0) * 100,
        advice: localize(locale, '建议在遮挡高发区提前布置更高位或更连续的导向。', 'Add higher or more continuous guidance where crowd occlusion is common.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: [],
      }),
    ]);
  }

  function buildSensoryIssueItems(inspection, topPressureSources, locale) {
    const sensory = inspection?.fiveDimensions?.burdens?.sensory || {};
    const cognitive = inspection?.decisionDiagnostics || inspection?.fiveDimensions?.burdens?.cognitive || {};
    const decisionInputs = inspection?.fiveDimensions?.context?.decisionInputs || {};
    const consideredObjects = Array.isArray(cognitive.consideredObjects) ? cognitive.consideredObjects : [];
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];
    const recognizedObjects = Array.isArray(sensory.recognizedObjects) ? sensory.recognizedObjects : [];
    const missedObjects = Array.isArray(sensory.missedObjects) ? sensory.missedObjects : [];
    const recognitionTotal = recognizedObjects.length + missedObjects.length;
    const clutterTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredDistractorObject),
      ...collectIssueTargetIds(consideredObjects, isConsideredProblemObject),
      ...collectIssueTargetIds(explicitSources, isDistractorSourceItem),
      ...collectIssueTargetIds(explicitSources, isProblemSignSourceItem),
    ]);
    const noiseTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredNoiseObject),
      ...collectIssueTargetIds(explicitSources, isNoiseSourceItem),
    ]);
    const lightingTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isLightingSourceItem));
    const guideTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredGuideObject),
      ...collectIssueTargetIds(explicitSources, isGuideSourceItem),
    ]);
    const supportBreakdown = {
      continuousGuideCoverage: safeNumber(decisionInputs.continuousGuideCoverage, 0),
      tactilePavingSupport: safeNumber(sensory.tactilePavingSupport, 0),
      audibleCueSupport: safeNumber(sensory.audibleCueSupport, 0),
      nearbyServiceSupport: safeNumber(sensory.nearbyServiceSupport, 0),
    };
    const supportPressure = Math.max(0, (0.18 - safeNumber(sensory.supportRelief, 0)) * 100);
    const missedNames = missedObjects
      .map((item) => item?.name || item?.id || '')
      .filter(Boolean)
      .slice(0, 3);
    const missedTargetIds = uniqueIds(
      missedObjects.flatMap((item) => [
        ...(Array.isArray(item?.mapTargetIds) ? item.mapTargetIds : []),
        item?.mapTargetId,
        item?.id,
      ].filter(Boolean))
    );
    const missedPressure = clamp(
      recognitionTotal ? (missedObjects.length / recognitionTotal) : (1 - safeNumber(sensory.recognitionRate, 0)),
      0,
      1
    ) * 100;

    return sortIssueItems([
      createIssueItem({
        id: 'sensory-miss',
        name: localize(locale, '对象漏识', 'Object Recognition Misses'),
        category: 'signage',
        categoryLabel: localize(locale, '漏识别', 'Missed Recognition'),
        feature: localize(
          locale,
          `R ${formatCompactMetric(sensory.perceptionRadius, 1)} m · K ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)} · ${missedNames.length ? `漏识别：${missedNames.join('、')}` : '本次未识别到关键对象'}`,
          `R ${formatCompactMetric(sensory.perceptionRadius, 1)} m · K ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)} · ${missedNames.length ? `Missed: ${missedNames.join(', ')}` : 'No key object recognized this step'}`
        ),
        summary: localize(
          locale,
          `关键对象没有被成功识别，当前识别半径 ${formatCompactMetric(sensory.perceptionRadius, 1)} m、识别率 ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)}。${missedNames.length ? `本次漏识别：${missedNames.join('、')}。` : '本次未能稳定识别到关键导向对象。'}`,
          `Key objects were not recognized successfully. Current recognition radius is ${formatCompactMetric(sensory.perceptionRadius, 1)} m and recognition rate is ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)}.${missedNames.length ? ` Missed objects: ${missedNames.join(', ')}.` : ' No key wayfinding object was recognized reliably in this step.'}`
        ),
        pressure: missedPressure,
        advice: localize(locale, '建议优先提高关键导向设施的可读性与连续性，减少近距离仍漏识别的情况。', 'Improve readability and continuity of key wayfinding elements so nearby objects are less likely to be missed.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: missedTargetIds,
      }),
      createIssueItem({
        id: 'sensory-noise',
        name: localize(locale, '环境噪音干扰感知', 'Noise Disrupts Sensory'),
        category: 'noise',
        categoryLabel: localize(locale, '噪音干扰', 'Noise'),
        feature: localize(
          locale,
          `当前 ${formatCompactMetric(inspection?.environmentNoise, 1)} dB / 阈值 ${formatCompactMetric(sensory.noiseThresholdDb, 0)} dB，${sensory.sensitiveNoise ? '已超出' : '未超出'}`,
          `Current ${formatCompactMetric(inspection?.environmentNoise, 1)} dB / threshold ${formatCompactMetric(sensory.noiseThresholdDb, 0)} dB, ${sensory.sensitiveNoise ? 'above threshold' : 'within threshold'}`
        ),
        summary: localize(
          locale,
          `噪音会削弱信息识别能力，当前噪音 ${formatCompactMetric(inspection?.environmentNoise, 1)} dB。${sensory.sensitiveNoise ? '当前噪音已经触及或超过该感知等级对应的噪音敏感阈值，更容易漏读环境提示。' : '当前噪音正在持续干扰环境信息读取。'}`,
          `Noise weakens information recognition. Current noise is ${formatCompactMetric(inspection?.environmentNoise, 1)} dB.${sensory.sensitiveNoise ? ' The current level has reached or exceeded the noise sensitivity threshold for this sensory level, making wayfinding cues easier to miss.' : ' The current level is already interfering with environmental information reading.'}`
        ),
        pressure: safeNumber(sensory.noisePenalty, 0) * 100,
        advice: localize(locale, '建议降低广播和噪声源与导向信息的重叠。', 'Reduce overlap between loud noise sources and wayfinding information.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'sensory-lighting',
        name: localize(locale, '环境光照影响辨识', 'Lighting Affects Recognition'),
        category: 'facility',
        categoryLabel: localize(locale, '光照异常', 'Lighting'),
        feature: localize(
          locale,
          `当前 ${formatCompactMetric(inspection?.environmentLighting, 0)} lux / 舒适范围 ${formatCompactMetric(sensory?.lightingComfortLux?.min, 0)}-${formatCompactMetric(sensory?.lightingComfortLux?.max, 0)} lux，${sensory.sensitiveLight ? '已超出' : '未超出'}`,
          `Current ${formatCompactMetric(inspection?.environmentLighting, 0)} lux / comfort ${formatCompactMetric(sensory?.lightingComfortLux?.min, 0)}-${formatCompactMetric(sensory?.lightingComfortLux?.max, 0)} lux, ${sensory.sensitiveLight ? 'outside range' : 'within range'}`
        ),
        summary: localize(
          locale,
          `光照会影响视觉辨识，当前照度 ${formatCompactMetric(inspection?.environmentLighting, 0)} lux。${sensory.sensitiveLight ? '当前位置光照已经超出该感知等级的舒适范围，标识和设施会更难看清。' : '当前位置光照条件正在降低对标识与设施的辨识效率。'}`,
          `Lighting affects visual recognition. Current illuminance is ${formatCompactMetric(inspection?.environmentLighting, 0)} lux.${sensory.sensitiveLight ? ' The local lighting is already outside the comfort range for this sensory level, making signs and facilities harder to read.' : ' The current lighting condition is already reducing recognition efficiency for signs and facilities.'}`
        ),
        pressure: safeNumber(sensory.lightingPenalty, 0) * 100,
        advice: localize(locale, '建议校正过亮或过暗区域，避免关键设施被光照压制。', 'Correct overly bright or dim areas so key facilities remain legible.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: lightingTargetIds,
      }),
      createIssueItem({
        id: 'sensory-support',
        name: localize(locale, '导向支持影响感知', 'Guidance Support Affects Sensory'),
        category: 'service',
        categoryLabel: localize(locale, '补偿支持', 'Support'),
        feature: localize(
          locale,
          '连续导向、盲道、语音提示、服务支持',
          'Guidance, tactile paving, audio cues, service support'
        ),
        summary: localize(
          locale,
          '连续导向、盲道、语音提示或服务支持会影响当前感知负担；当这些辅助信息不足或不连续时，环境信息更难被稳定识别。',
          'Guidance continuity, tactile paving, audio cues, and service support all affect the current sensory burden; when these supports are weak or discontinuous, environmental information becomes harder to recognize reliably.'
        ),
        pressure: supportPressure,
        advice: localize(locale, '建议补连续导向、盲道、语音提示或邻近服务支持，降低单一视觉识别压力。', 'Add continuous guidance, tactile support, audio cues, or nearby service support to reduce reliance on visual recognition alone.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: guideTargetIds,
      }),
      createIssueItem({
        id: 'sensory-clutter',
        name: localize(locale, '视觉杂讯干扰感知', 'Visual Clutter Disrupts Sensory'),
        category: 'advert',
        categoryLabel: localize(locale, '视觉杂讯', 'Visual Clutter'),
        feature: localize(
          locale,
          `干扰源 ${clutterTargetIds.length} 个`,
          `${clutterTargetIds.length} visual distractor sources`
        ),
        summary: localize(
          locale,
          `广告、干扰标识或问题标识会分散注意，并干扰有效信息识别。当前视野内共有 ${clutterTargetIds.length} 个干扰源。`,
          `Ads, distractor signs, or problematic signs are diverting attention and interfering with valid information recognition. There are currently ${clutterTargetIds.length} distractor sources in view.`
        ),
        pressure: safeNumber(sensory.visualClutterPenalty, 0) * 100,
        advice: localize(locale, '建议减少广告、干扰标识和问题标识在同一视野中的叠加。', 'Reduce ads, distractor signs, and problematic signs within the same field of view.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: clutterTargetIds,
      }),
      createIssueItem({
        id: 'sensory-occlusion',
        name: localize(locale, '人群遮挡干扰感知', 'Crowd Occlusion Disrupts Sensory'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '遮挡拥挤', 'Occlusion'),
        feature: localize(
          locale,
          `当前密度 ${formatCompactMetric(inspection?.crowdDensity, 2)} 人/㎡`,
          `Density ${formatCompactMetric(inspection?.crowdDensity, 2)} p/m²`
        ),
        summary: localize(
          locale,
          `人群遮挡会提高漏识概率，当前密度 ${formatCompactMetric(inspection?.crowdDensity, 2)} 人/㎡。局部视线被遮挡后，关键信息更容易被漏读。`,
          `Crowd occlusion increases the chance of missed recognition. Current density is ${formatCompactMetric(inspection?.crowdDensity, 2)} p/m². When sightlines are blocked locally, key information is easier to miss.`
        ),
        pressure: safeNumber(sensory.occlusionPenalty, 0) * 100,
        advice: localize(locale, '建议在高遮挡区域提前布置更连续的导向。', 'Add more continuous guidance in zones where crowd occlusion is common.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetIds: [],
      }),
    ], 5);
  }

  function buildSensoryIssueSummary(inspection, locale) {
    const sensory = inspection?.fiveDimensions?.burdens?.sensory || {};
    const recognizedCount = Array.isArray(sensory.recognizedObjects) ? sensory.recognizedObjects.length : 0;
    const missedCount = Array.isArray(sensory.missedObjects) ? sensory.missedObjects.length : 0;
    return localize(
      locale,
      `感知范围 ${formatCompactMetric(sensory.perceptionRadius, 1)} m · 基础识别率 ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)} · 本次识别 ${recognizedCount} 个 · 本次漏识别 ${missedCount} 个`,
      `Range ${formatCompactMetric(sensory.perceptionRadius, 1)} m · Base recognition ${formatPercentValue(safeNumber(sensory.recognitionRate, 0) * 100)} · Recognized ${recognizedCount} · Missed ${missedCount}`
    );
  }

  function buildCognitiveIssueItems(inspection, topPressureSources, locale) {
    const cognitive = inspection?.decisionDiagnostics || inspection?.fiveDimensions?.burdens?.cognitive || {};
    const loadObject = (cognitive.consideredObjects || []).find((item) => item && item.direction === 'load') || null;
    const sourceItems = (Array.isArray(topPressureSources) ? topPressureSources : [])
      .map((item) => createIssueItem({
        ...item,
        metricLabel: localize(locale, '影响值', 'Impact'),
      }));
    const hasExplicitNoiseSource = sourceItems.some((item) => item.category === 'noise');
    const hasExplicitLightingSource = sourceItems.some((item) => (
      item.category === 'facility'
      && /lux|light|lighting|光/.test(String(item.feature || item.name || '').toLowerCase())
    ));
    const mechanismItems = [
      createIssueItem({
        id: 'cognitive-branch',
        name: localize(locale, '分支复杂度高', 'Branch Complexity High'),
        category: 'decision',
        categoryLabel: localize(locale, '节点复杂', 'Decision Node'),
        feature: localize(locale, `当前节点 ${cognitive.decisionNodeLabel || '--'}，可选分支 ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} 个`, `Node ${cognitive.decisionNodeLabel || '--'}, ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} branches`),
        pressure: safeNumber(cognitive.branchComplexity, 0) * 100,
        advice: localize(locale, '建议在岔路前提前给出方向信息，减少现场比较。', 'Place direction cues before branch points so less comparison is needed on site.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-sign-conflict',
        name: localize(locale, '导向冲突或问题标识', 'Sign Conflict or Problem Sign'),
        category: 'signage',
        categoryLabel: localize(locale, '导向冲突', 'Sign Conflict'),
        feature: localize(locale, `冲突/问题标识 ${Math.max(0, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} 个`, `${Math.max(0, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} conflicting signs`),
        pressure: safeNumber(cognitive.signConflict, 0) * 100,
        advice: localize(locale, '建议统一标识语义和朝向，避免同视野内出现相互矛盾提示。', 'Align sign meaning and direction so conflicting cues do not appear in the same view.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-path-compare',
        name: localize(locale, '路径比较成本高', 'Path Comparison Cost High'),
        category: 'decision',
        categoryLabel: localize(locale, '路径比较', 'Path Comparison'),
        feature: localize(locale, `候选路径 ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} 条`, `${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} candidate paths`),
        pressure: safeNumber(cognitive.pathComparisonCost, 0) * 100,
        advice: localize(locale, '建议降低同时可选路径数量，并提前标明首选路径。', 'Reduce simultaneous path options and mark the preferred route earlier.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-distractor',
        name: localize(locale, '视野干扰过多', 'Visual Distractors Too High'),
        category: 'advert',
        categoryLabel: localize(locale, '干扰负荷', 'Distractor Load'),
        feature: localize(locale, `闪烁广告 ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))}，无关标识 ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))}`, `${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))} flashing ads, ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))} irrelevant signs`),
        pressure: safeNumber(cognitive.distractorLoad, 0) * 100,
        advice: localize(locale, '建议降低广告与无关标识密度，保证有效导向优先进入视野。', 'Reduce ad and irrelevant-sign density so valid guidance is seen first.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-guidance',
        name: localize(locale, '连续导向不足', 'Continuous Guidance Weak'),
        category: 'signage',
        categoryLabel: localize(locale, '导向支持不足', 'Guidance Support'),
        feature: localize(locale, `连续导向支持 ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`, `Guidance support ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`),
        pressure: Math.max(0, 100 - safeNumber(cognitive.guidanceSupport, 0) * 100),
        advice: localize(locale, '建议补足连续导向链，避免长时间无有效提示。', 'Fill gaps in the guidance chain so users do not lose cues for long stretches.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-noise',
        name: localize(locale, '噪音干扰决策', 'Noise Interferes with Decisions'),
        category: 'noise',
        categoryLabel: localize(locale, '环境噪音', 'Noise'),
        feature: localize(locale, `当前噪音 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`, `Noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`),
        pressure: safeNumber(cognitive.noisePenalty, 0) * 100,
        advice: localize(locale, '建议降低关键决策点周边噪音，减少注意力被打断。', 'Reduce noise around decision points so attention is not interrupted.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-lighting',
        name: localize(locale, '光照增加判断负担', 'Lighting Adds Decision Burden'),
        category: 'facility',
        categoryLabel: localize(locale, '环境光照', 'Lighting'),
        feature: localize(locale, `当前照度 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`, `Lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`),
        pressure: safeNumber(cognitive.lightingPenalty, 0) * 100,
        advice: localize(locale, '建议修正决策节点附近的过暗或眩光区域。', 'Correct dim or glaring lighting near decision nodes.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-crowd',
        name: localize(locale, '拥挤增加判断不确定性', 'Crowding Increases Uncertainty'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '拥挤干扰', 'Crowding'),
        feature: localize(locale, `当前拥挤度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡`, `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`),
        pressure: safeNumber(cognitive.crowdPenalty, 0) * 100,
        advice: localize(locale, '建议在高拥挤节点提供更明确、更前置的导向。', 'Provide clearer and earlier wayfinding at crowded nodes.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'cognitive-queue',
        name: localize(locale, '排队提高决策不确定性', 'Queueing Raises Decision Uncertainty'),
        category: 'facility',
        categoryLabel: localize(locale, '排队干扰', 'Queueing'),
        feature: localize(locale, `排队人数 ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))} 人`, `Queue count ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))}`),
        pressure: safeNumber(cognitive.queueUncertainty, 0) * 100,
        advice: localize(locale, '建议把等待信息前置展示，让排队与绕行选择更清楚。', 'Expose waiting information earlier so queueing and bypass choices are clearer.'),
        metricLabel: localize(locale, '影响值', 'Impact'),
        mapTargetId: null,
      }),
    ];
    const filteredMechanismItems = mechanismItems.filter((item) => {
      if (hasExplicitNoiseSource && item.id === 'cognitive-noise') {
        return false;
      }
      if (hasExplicitLightingSource && item.id === 'cognitive-lighting') {
        return false;
      }
      return true;
    });
    const prioritizedSourceItems = sortIssueItems(sourceItems, 3);
    if (prioritizedSourceItems.length >= 3) {
      return prioritizedSourceItems;
    }
    const remainingMechanismItems = sortIssueItems(filteredMechanismItems, 3 - prioritizedSourceItems.length);
    return prioritizedSourceItems.concat(remainingMechanismItems);
  }

  /*
  function buildCognitiveCategoryIssueItems(inspection, topPressureSources, locale) {
    const cognitive = inspection?.decisionDiagnostics || inspection?.fiveDimensions?.burdens?.cognitive || {};
    const consideredObjects = Array.isArray(cognitive.consideredObjects) ? cognitive.consideredObjects : [];
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];

    const problemTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredProblemObject),
      ...collectIssueTargetIds(explicitSources, isProblemSignSourceItem),
    ]);
    const guideTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredGuideObject),
      ...collectIssueTargetIds(explicitSources, isGuideSourceItem),
    ]);
    const signConflictTargetIds = uniqueIds([
      ...problemTargetIds,
      ...guideTargetIds,
    ]);
    const distractorTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredDistractorObject),
      ...collectIssueTargetIds(explicitSources, isDistractorSourceItem),
    ]);
    const noiseTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredNoiseObject),
      ...collectIssueTargetIds(explicitSources, isNoiseSourceItem),
    ]);
    const lightingTargetIds = collectIssueTargetIds(explicitSources, isLightingSourceItem);

    return sortIssueItems([
      createIssueItem({
        id: 'cognitive-distractor',
        name: localize(locale, '瑙嗛噹骞叉壈杩囧', 'Visual Distractors Too High'),
        category: 'advert',
        categoryLabel: localize(locale, '骞叉壈璐熻嵎', 'Distractor Load'),
        feature: localize(
          locale,
          `闂儊骞垮憡 ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))}锛屾棤鍏虫爣璇?${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))}`,
          `${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))} flashing ads, ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))} irrelevant signs`
        ),
        pressure: safeNumber(cognitive.distractorLoad, 0) * 100,
        advice: localize(locale, '寤鸿闄嶄綆骞垮憡涓庢棤鍏虫爣璇嗗瘑搴︼紝淇濊瘉鏈夋晥瀵煎悜浼樺厛杩涘叆瑙嗛噹銆?', 'Reduce ad and irrelevant-sign density so valid guidance is seen first.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: distractorTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-sign-conflict',
        name: localize(locale, '瀵煎悜鍐茬獊鎴栭棶棰樻爣璇?, 'Sign Conflict or Problem Sign'),
        category: 'signage',
        categoryLabel: localize(locale, '瀵煎悜鍐茬獊', 'Sign Conflict'),
        feature: localize(
          locale,
          `鍐茬獊/闂鏍囪瘑 ${Math.max(problemTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} 涓?`,
          `${Math.max(problemTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} conflicting/problem signs`
        ),
        pressure: safeNumber(cognitive.signConflict, 0) * 100,
        advice: localize(locale, '寤鸿缁熶竴鏍囪瘑璇箟鍜屾湞鍚戯紝閬垮厤鍚岃閲庡唴鍑虹幇鐩镐簰鐭涚浘鎻愮ず銆?', 'Align sign meaning and direction so conflicting cues do not appear in the same view.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: problemTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-noise',
        name: localize(locale, '鍣煶骞叉壈鍐崇瓥', 'Noise Interferes with Decisions'),
        category: 'noise',
        categoryLabel: localize(locale, '鐜鍣煶', 'Noise'),
        feature: localize(
          locale,
          `褰撳墠鍣煶 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB${noiseTargetIds.length ? `锛屽奖鍝嶆簮 ${noiseTargetIds.length} 涓?` : ''}`,
          `Noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB${noiseTargetIds.length ? `, ${noiseTargetIds.length} sources` : ''}`
        ),
        pressure: safeNumber(cognitive.noisePenalty, 0) * 100,
        advice: localize(locale, '寤鸿闄嶄綆鍏抽敭鍐崇瓥鐐瑰懆杈瑰櫔闊筹紝鍑忓皯娉ㄦ剰鍔涜鎵撴柇銆?', 'Reduce noise around decision points so attention is not interrupted.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-lighting',
        name: localize(locale, '鍏夌収澧炲姞鍒ゆ柇璐熸媴', 'Lighting Adds Decision Burden'),
        category: 'facility',
        categoryLabel: localize(locale, '鐜鍏夌収', 'Lighting'),
        feature: localize(
          locale,
          `褰撳墠鐓у害 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux${lightingTargetIds.length ? `锛屽奖鍝嶅厜婧?${lightingTargetIds.length} 涓?` : ''}`,
          `Lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux${lightingTargetIds.length ? `, ${lightingTargetIds.length} sources` : ''}`
        ),
        pressure: safeNumber(cognitive.lightingPenalty, 0) * 100,
        advice: localize(locale, '寤鸿淇鍐崇瓥鑺傜偣闄勮繎鐨勮繃鏆楁垨鐪╁厜鍖哄煙銆?', 'Correct dim or glaring lighting near decision nodes.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: lightingTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-path-complexity',
        name: localize(locale, '璺緞涓庡垎鏀鏉傚害楂?', 'Path and Branch Complexity High'),
        category: 'decision',
        categoryLabel: localize(locale, '璺緞澶嶆潅', 'Path Complexity'),
        feature: localize(
          locale,
          `褰撳墠鑺傜偣 ${cognitive.decisionNodeLabel || '--'}锛屽垎鏀?${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} 涓紝鍊欓€夎矾寰?${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} 鏉?`,
          `Node ${cognitive.decisionNodeLabel || '--'}, ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} branches, ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} candidate paths`
        ),
        pressure: Math.max(
          safeNumber(cognitive.branchComplexity, 0) * 100,
          safeNumber(cognitive.pathComparisonCost, 0) * 100
        ),
        advice: localize(locale, '寤鸿鍦ㄥ矓璺墠鎻愬墠缁欏嚭鏂瑰悜淇℃伅锛屽噺灏戠幇鍦烘瘮杈冧笌璺緞閫夋嫨銆?', 'Place direction cues before branch points and reduce on-site path comparison.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: [],
      }),
      createIssueItem({
        id: 'cognitive-crowd-queue',
        name: localize(locale, '鎷ユ尋涓庢帓闃熷共鎵板喅绛?', 'Crowding and Queueing Interfere'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '鎷ユ尋/鎺掗槦', 'Crowding / Queueing'),
        feature: localize(
          locale,
          `褰撳墠鎷ユ尋搴?${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 浜?銕, 鎺掗槦浜烘暟 ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))}`,
          `Density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m2, queue count ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))}`
        ),
        pressure: Math.max(
          safeNumber(cognitive.crowdPenalty, 0) * 100,
          safeNumber(cognitive.queueUncertainty, 0) * 100
        ),
        advice: localize(locale, '寤鸿鍦ㄩ珮鎷ユ尋鑺傜偣鎻愪緵鏇存槑纭€佹洿鍓嶇疆鐨勫鍚戯紝骞跺噺灏戞帓闃熷鍐崇瓥鐨勫共鎵般€?', 'Provide earlier wayfinding at crowded nodes and reduce queue interference around decision points.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: [],
      }),
      createIssueItem({
        id: 'cognitive-guidance',
        name: localize(locale, '杩炵画瀵煎悜涓嶈冻', 'Continuous Guidance Weak'),
        category: 'signage',
        categoryLabel: localize(locale, '瀵煎悜鏀寔涓嶈冻', 'Guidance Support'),
        feature: localize(locale, `杩炵画瀵煎悜鏀寔 ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`, `Guidance support ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`),
        pressure: Math.max(0, 100 - safeNumber(cognitive.guidanceSupport, 0) * 100),
        advice: localize(locale, '寤鸿琛ヨ冻杩炵画瀵煎悜閾撅紝閬垮厤闀挎椂闂存棤鏈夋晥鎻愮ず銆?', 'Fill gaps in the guidance chain so users do not lose cues for long stretches.'),
        metricLabel: localize(locale, '褰卞搷鍊?, 'Impact'),
        mapTargetIds: [],
      }),
    ]);
  }

  */

  function buildCognitiveCategoryIssueItems(inspection, topPressureSources, locale) {
    const cognitive = inspection?.decisionDiagnostics || inspection?.fiveDimensions?.burdens?.cognitive || {};
    const consideredObjects = Array.isArray(cognitive.consideredObjects) ? cognitive.consideredObjects : [];
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];

    const problemTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredProblemObject),
      ...collectIssueTargetIds(explicitSources, isProblemSignSourceItem),
    ]);
    const guideTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredGuideObject),
      ...collectIssueTargetIds(explicitSources, isGuideSourceItem),
    ]);
    const signConflictTargetIds = uniqueIds([
      ...problemTargetIds,
      ...guideTargetIds,
    ]);
    const distractorTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredDistractorObject),
      ...collectIssueTargetIds(explicitSources, isDistractorSourceItem),
    ]);
    const noiseTargetIds = uniqueIds([
      ...collectIssueTargetIds(consideredObjects, isConsideredNoiseObject),
      ...collectIssueTargetIds(explicitSources, isNoiseSourceItem),
    ]);
    const lightingTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isLightingSourceItem));

    return sortIssueItems([
      createIssueItem({
        id: 'cognitive-distractor',
        name: localize(locale, '视觉杂讯干扰决策', 'Visual Distractors Interfere with Decisions'),
        category: 'advert',
        categoryLabel: localize(locale, '视觉杂讯', 'Visual Distractors'),
        feature: localize(
          locale,
          `当前闪烁广告 ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))} 个，无关标识 ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))} 个`,
          `Current flashing ads ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))}, irrelevant signs ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))}`
        ),
        summary: localize(
          locale,
          `闪烁广告和无关标识会分散决策注意力，影响导向优先进入视野。当前闪烁广告 ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))} 个，无关标识 ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))} 个。`,
          `Flashing ads and irrelevant signs can distract decision-making attention and prevent guidance from entering view first. Current flashing ads ${Math.max(0, Math.round(safeNumber(cognitive.flashingAdCount, 0)))}, irrelevant signs ${Math.max(0, Math.round(safeNumber(cognitive.irrelevantSignCount, 0)))}.`
        ),
        pressure: safeNumber(cognitive.distractorLoad, 0) * 100,
        advice: localize(locale, '建议降低广告与无关标识密度，让有效导向优先进入视野。', 'Reduce ad and irrelevant-sign density so valid guidance is seen first.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: distractorTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-sign-conflict',
        name: localize(locale, '导向冲突或问题标识', 'Sign Conflict or Problem Signs'),
        category: 'signage',
        categoryLabel: localize(locale, '导向冲突', 'Sign Conflict'),
        feature: localize(
          locale,
          `当前相关标识 ${Math.max(signConflictTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} 个`,
          `Current related signs ${Math.max(signConflictTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))}`
        ),
        summary: localize(
          locale,
          `相互冲突或存在问题的导向标识，会让判断变得不稳定。当前相关标识 ${Math.max(signConflictTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))} 个。`,
          `Conflicting or problematic wayfinding signs can make decisions less stable. Current related signs ${Math.max(signConflictTargetIds.length, Math.round(safeNumber(cognitive.conflictingSignCount, 0)))}.`
        ),
        pressure: safeNumber(cognitive.signConflict, 0) * 100,
        advice: localize(locale, '建议统一标识语义、方向和优先级，避免同视野内出现矛盾提示。', 'Align sign meaning and direction so conflicting cues do not appear in the same view.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: signConflictTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-noise',
        name: localize(locale, '环境噪音干扰决策', 'Environmental Noise Interferes with Decisions'),
        category: 'noise',
        categoryLabel: localize(locale, '环境噪音', 'Environmental Noise'),
        feature: localize(
          locale,
          `当前噪音 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`,
          `Current noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB`
        ),
        summary: localize(
          locale,
          `环境噪音会打断决策注意，影响对导向信息的持续判断。当前噪音 ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB。`,
          `Environmental noise can interrupt decision attention and disrupt continuous judgment of guidance information. Current noise ${safeNumber(inspection?.environmentNoise, 0).toFixed(1)} dB.`
        ),
        pressure: safeNumber(cognitive.noisePenalty, 0) * 100,
        advice: localize(locale, '建议优先降低关键决策点周边噪音，减少注意力被打断。', 'Reduce noise around decision points so attention is not interrupted.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-lighting',
        name: localize(locale, '光照增加判断负担', 'Lighting Increases Judgment Burden'),
        category: 'facility',
        categoryLabel: localize(locale, '环境光照', 'Lighting'),
        feature: localize(
          locale,
          `当前照度 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`,
          `Current lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux`
        ),
        summary: localize(
          locale,
          `过暗、过亮或眩光会增加判断负担，影响对路径与导向信息的辨识。当前照度 ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux。`,
          `Dim light, over-bright light, or glare can increase judgment burden and reduce path and guidance recognition. Current lighting ${safeNumber(inspection?.environmentLighting, 0).toFixed(0)} lux.`
        ),
        pressure: safeNumber(cognitive.lightingPenalty, 0) * 100,
        advice: localize(locale, '建议修正决策点附近的过暗、过亮或眩光区域。', 'Correct dim or glaring lighting near decision nodes.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: lightingTargetIds,
      }),
      createIssueItem({
        id: 'cognitive-path-complexity',
        name: localize(locale, '路径分支影响决策', 'Path Branches Affect Decisions'),
        category: 'decision',
        categoryLabel: localize(locale, '路径分支', 'Path Branches'),
        feature: localize(
          locale,
          `当前位于 ${cognitive.decisionNodeLabel || '--'} 决策点，附近分支 ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} 个，候选路径 ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} 条`,
          `Current decision point ${cognitive.decisionNodeLabel || '--'}, ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} branches, ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} candidate paths`
        ),
        summary: localize(
          locale,
          `岔路多、可选路径多，会提高比较和判断成本。当前位于 ${cognitive.decisionNodeLabel || '--'} 决策点，附近分支 ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} 个，候选路径 ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} 条。`,
          `More branches and more candidate paths increase comparison and decision cost. Current decision point ${cognitive.decisionNodeLabel || '--'}, ${Math.max(1, Math.round(safeNumber(cognitive.branchCount, 1)))} branches, ${Math.max(1, Math.round(safeNumber(cognitive.candidatePathCount, 1)))} candidate paths.`
        ),
        pressure: Math.max(
          safeNumber(cognitive.branchComplexity, 0) * 100,
          safeNumber(cognitive.pathComparisonCost, 0) * 100
        ),
        advice: localize(locale, '建议在分支前提前给出方向提示，并减少现场路径比较负担。', 'Place direction cues before branch points and reduce on-site path comparison.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: [],
      }),
      createIssueItem({
        id: 'cognitive-crowd-queue',
        name: localize(locale, '拥挤与排队干扰决策', 'Crowding and Queueing Interfere with Decisions'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '拥挤/排队', 'Crowding / Queueing'),
        feature: localize(
          locale,
          `当前人群密度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡，排队人数 ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))} 人`,
          `Current density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m², queue count ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))}`
        ),
        summary: localize(
          locale,
          `拥挤与排队会遮挡视线并压缩停留判断空间，增加路径选择的不确定性。当前人群密度 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} 人/㎡，排队人数 ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))} 人。`,
          `Crowding and queueing can block views and compress stopping space for decisions, increasing route-choice uncertainty. Current density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m², queue count ${Math.round(safeNumber(cognitive.queueCount, inspection?.queueCount || 0))}.`
        ),
        pressure: Math.max(
          safeNumber(cognitive.crowdPenalty, 0) * 100,
          safeNumber(cognitive.queueUncertainty, 0) * 100
        ),
        advice: localize(locale, '建议在拥挤节点提供更前置的导向，并减少排队对判断区的占用。', 'Provide earlier wayfinding at crowded nodes and reduce queue interference around decision points.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: [],
      }),
      createIssueItem({
        id: 'cognitive-guidance',
        name: localize(locale, '连续导向影响路径确认', 'Continuous Guidance Affects Route Confirmation'),
        category: 'signage',
        categoryLabel: localize(locale, '连续导向', 'Continuous Guidance'),
        feature: localize(
          locale,
          `当前连续导向支持率 ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`,
          `Current guidance support ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}`
        ),
        summary: localize(
          locale,
          `连续导向链一旦中断，代理人需要反复确认方向，路径确认过程会被拉长。当前连续导向支持率 ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}。`,
          `When the continuous guidance chain is interrupted, the agent must repeatedly confirm direction and route confirmation takes longer. Current guidance support ${formatPercentValue(safeNumber(cognitive.guidanceSupport, 0) * 100)}.`
        ),
        pressure: Math.max(0, 100 - safeNumber(cognitive.guidanceSupport, 0) * 100),
        advice: localize(locale, '建议补足连续导向链，减少中途反复确认方向。', 'Fill gaps in the guidance chain so users do not need to repeatedly reconfirm direction.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: [],
      }),
    ]);
  }

  function buildPsychologicalIssueItems(inspection, topPressureSources, locale) {
    const psychological = inspection?.fiveDimensions?.burdens?.psychological || {};
    const decisionInputs = inspection?.fiveDimensions?.context?.decisionInputs || {};
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];
    const noiseTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isNoiseSourceItem));
    const lightingTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isLightingSourceItem));
    const crowdDensity = safeNumber(inspection?.crowdDensity, 0);
    const queueCount = Math.max(0, Math.round(safeNumber(inspection?.queueCount, 0)));
    const environmentNoise = safeNumber(inspection?.environmentNoise, 0);
    const environmentLighting = safeNumber(inspection?.environmentLighting, 0);
    const persistentStress = Math.max(0, safeNumber(psychological.persistentStress, 0));
    const localVisibleStress = Math.max(0, safeNumber(psychological.localVisibleStress, 0));
    const guidanceSupport = clamp(
      safeNumber(
        psychological.guidanceSupport,
        0.65 * safeNumber(decisionInputs.continuousGuideCoverage, 0)
          + 0.20 * safeNumber(decisionInputs.mapSupport, 0)
          + 0.15 * safeNumber(decisionInputs.serviceSupport, 0)
      ),
      0,
      1
    );
    const crowdPressure = clamp(
      safeNumber(psychological.crowdStress, safeNumber(psychological.ambientCrowdingStress, 0) / 100) * 100,
      0,
      100
    );
    const queuePressure = clamp(
      safeNumber(psychological.queueStress, safeNumber(psychological.ambientQueueStress, 0) / 40) * 100,
      0,
      100
    );
    const noisePressure = clamp(
      safeNumber(psychological.noiseStress, safeNumber(psychological.ambientNoiseStress, 0) / 100) * 100,
      0,
      100
    );
    const lightingPressure = clamp(
      safeNumber(psychological.lightingStress, safeNumber(psychological.ambientLightingStress, 0) / 100) * 100,
      0,
      100
    );
    const persistentPressure = clamp(
      safeNumber(psychological.eventStress, (persistentStress + localVisibleStress) / 200) * 100,
      0,
      100
    );
    const guidancePressure = clamp((1 - guidanceSupport) * 100, 0, 100);

    return sortIssueItems([
      createIssueItem({
        id: 'psychological-persistent',
        name: localize(locale, '持续压力累积影响情绪稳定', 'Accumulated Stress Affects Emotional Stability'),
        category: 'decision',
        categoryLabel: localize(locale, '持续压力', 'Accumulated Stress'),
        feature: localize(
          locale,
          `当前累积压力 ${persistentStress.toFixed(1)}，当前可见刺激压力 ${localVisibleStress.toFixed(1)}`,
          `Current accumulated stress ${persistentStress.toFixed(1)}, visible trigger stress ${localVisibleStress.toFixed(1)}`
        ),
        summary: localize(
          locale,
          `前序路段累积的压力和尚未消退的可见刺激，会持续推高心理负担并影响情绪稳定。当前累积压力 ${persistentStress.toFixed(1)}，当前可见刺激压力 ${localVisibleStress.toFixed(1)}。`,
          `Accumulated stress from previous segments and still-visible triggers continue to raise psychological burden and affect emotional stability. Current accumulated stress ${persistentStress.toFixed(1)}, visible trigger stress ${localVisibleStress.toFixed(1)}.`
        ),
        pressure: persistentPressure,
        advice: localize(locale, '建议尽快离开连续高刺激区，并提供更平静的过渡通行空间。', 'Move the agent out of sustained high-stimulation areas and provide a calmer transition space.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'psychological-crowd',
        name: localize(locale, '人群拥挤增加压迫感', 'Crowding Increases Oppression'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '人群拥挤', 'Crowding'),
        feature: localize(
          locale,
          `当前人群密度 ${crowdDensity.toFixed(2)} 人/㎡`,
          `Current crowd density ${crowdDensity.toFixed(2)} p/m²`
        ),
        summary: localize(
          locale,
          `高密度人流会压缩个人空间，增加压迫和紧张感。当前人群密度 ${crowdDensity.toFixed(2)} 人/㎡。`,
          `High crowd density compresses personal space and increases pressure and tension. Current crowd density ${crowdDensity.toFixed(2)} p/m².`
        ),
        pressure: crowdPressure,
        advice: localize(locale, '建议优先缓解汇流拥堵，释放更可呼吸的通行空间。', 'Relieve crowd merging first and restore more breathable passage space.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'psychological-queue',
        name: localize(locale, '排队与停滞增加焦躁', 'Queueing and Stagnation Increase Agitation'),
        category: 'facility',
        categoryLabel: localize(locale, '排队停滞', 'Queueing'),
        feature: localize(
          locale,
          `当前排队人数 ${queueCount} 人`,
          `Current queue count ${queueCount}`
        ),
        summary: localize(
          locale,
          `排队等待和停滞会增强受限感与焦躁感。当前排队人数 ${queueCount} 人。`,
          `Queueing and stagnation increase the sense of restriction and agitation. Current queue count ${queueCount}.`
        ),
        pressure: queuePressure,
        advice: localize(locale, '建议优化排队组织，减少等待区对主要通行空间的压迫。', 'Improve queue organization so waiting zones put less pressure on the main circulation space.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'psychological-noise',
        name: localize(locale, '环境噪音持续刺激心理', 'Environmental Noise Continuously Stimulates Psychological Burden'),
        category: 'noise',
        categoryLabel: localize(locale, '环境噪音', 'Environmental Noise'),
        feature: localize(
          locale,
          `当前噪音 ${environmentNoise.toFixed(1)} dB`,
          `Current noise ${environmentNoise.toFixed(1)} dB`
        ),
        summary: localize(
          locale,
          `持续噪音会提高警觉水平，削弱情绪稳定。当前噪音 ${environmentNoise.toFixed(1)} dB。`,
          `Sustained noise raises alertness and weakens emotional stability. Current noise ${environmentNoise.toFixed(1)} dB.`
        ),
        pressure: noisePressure,
        advice: localize(locale, '建议优先降低关键区域的高噪音源，减少持续声刺激。', 'Reduce high-noise sources around key areas to limit sustained acoustic stimulation.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'psychological-lighting',
        name: localize(locale, '光照刺激增加心理负担', 'Lighting Stimulation Increases Psychological Burden'),
        category: 'facility',
        categoryLabel: localize(locale, '环境光照', 'Lighting'),
        feature: localize(
          locale,
          `当前照度 ${environmentLighting.toFixed(0)} lux`,
          `Current lighting ${environmentLighting.toFixed(0)} lux`
        ),
        summary: localize(
          locale,
          `过暗、过亮或眩光会增加不适和紧张感。当前照度 ${environmentLighting.toFixed(0)} lux。`,
          `Dim light, over-bright light, or glare can increase discomfort and tension. Current lighting ${environmentLighting.toFixed(0)} lux.`
        ),
        pressure: lightingPressure,
        advice: localize(locale, '建议修正过暗、过亮或眩光区域，降低持续视觉刺激。', 'Correct dim, over-bright, or glaring areas to reduce sustained visual stimulation.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetIds: lightingTargetIds,
      }),
      createIssueItem({
        id: 'psychological-guidance',
        name: localize(locale, '连续导向影响心理稳定', 'Continuous Guidance Affects Psychological Stability'),
        category: 'signage',
        categoryLabel: localize(locale, '连续导向', 'Continuous Guidance'),
        feature: localize(
          locale,
          `当前连续导向支持率 ${formatPercentValue(guidanceSupport * 100)}`,
          `Current guidance support ${formatPercentValue(guidanceSupport * 100)}`
        ),
        summary: localize(
          locale,
          `连续导向链较弱时，代理人需要反复确认方向，心理稳定性更容易被打断。当前连续导向支持率 ${formatPercentValue(guidanceSupport * 100)}。`,
          `When the continuous guidance chain is weak, the agent must repeatedly confirm direction and psychological stability is more easily disrupted. Current guidance support ${formatPercentValue(guidanceSupport * 100)}.`
        ),
        pressure: guidancePressure,
        advice: localize(locale, '建议补足连续导向链，减少中途反复确认方向带来的紧张感。', 'Fill gaps in the guidance chain to reduce tension from repeated direction checking.'),
        metricLabel: localize(locale, '影响程度', 'Impact'),
        mapTargetId: null,
      }),
    ]);
  }

  function getVitalityPressureFromMultiplier(multiplier, maxIncrease = 0.6) {
    return clamp((safeNumber(multiplier, 1) - 1) / maxIncrease, 0, 1) * 100;
  }

  function getVitalityQueuePressure(queueCount) {
    if (queueCount < 3) return 0;
    if (queueCount <= 5) return 40;
    return 100;
  }

  function getVitalityCrowdPressure(crowdDensity) {
    const density = safeNumber(crowdDensity, 0);
    if (density < 1) return 0;
    if (density < 3) return 40;
    if (density <= 5) return 67;
    return 100;
  }

  function getVitalityNoisePressure(noiseLevel) {
    const noise = safeNumber(noiseLevel, 0);
    if (noise <= 60) return 0;
    if (noise <= 70) return 40;
    if (noise <= 80) return 67;
    return 100;
  }

  function getVitalityLightingPressure(lightingLevel) {
    const lighting = safeNumber(lightingLevel, 0);
    if (lighting >= 200 && lighting <= 500) return 0;
    if (lighting > 1000 || lighting < 120) return 67;
    return 40;
  }

  function getVitalityContributionCoefficient(coefficient, damping = 1) {
    const normalizedCoefficient = Math.max(1, safeNumber(coefficient, 1));
    const normalizedDamping = clamp(safeNumber(damping, 1), 0, 1);
    return 1 + (normalizedCoefficient - 1) * normalizedDamping;
  }

  function getVitalityContributionScoreFromCoefficient(coefficient, maxIncrease = 0.6) {
    const normalizedIncrease = Math.max(0, getVitalityContributionCoefficient(coefficient) - 1);
    return clamp(normalizedIncrease / Math.max(0.01, safeNumber(maxIncrease, 0.6)), 0, 1) * 100;
  }

  function getVitalityQueueCoefficient(queueCount) {
    if (queueCount < 3) return 1;
    if (queueCount <= 5) return 1.2;
    return 1.5;
  }

  function getVitalityCrowdCoefficient(crowdDensity) {
    const density = safeNumber(crowdDensity, 0);
    if (density < 1) return 1;
    if (density < 3) return 1.2;
    if (density <= 5) return 1.4;
    return 1.6;
  }

  function getVitalityNoiseCoefficient(noiseLevel, isWheelchair = false) {
    const noise = safeNumber(noiseLevel, 0);
    let coefficient = 1;
    if (noise > 80) {
      coefficient = 1.5;
    } else if (noise > 70) {
      coefficient = 1.3;
    } else if (noise > 60) {
      coefficient = 1.1;
    }
    return isWheelchair
      ? getVitalityContributionCoefficient(coefficient, 0.08)
      : coefficient;
  }

  function getVitalityLightingCoefficient(lightingLevel, isWheelchair = false) {
    const lighting = safeNumber(lightingLevel, 0);
    let coefficient = 1;
    if (lighting > 1000) {
      coefficient = 1.3;
    } else if (lighting >= 500) {
      coefficient = 1.1;
    } else if (lighting < 200) {
      coefficient = 1.1;
    }
    return isWheelchair
      ? getVitalityContributionCoefficient(coefficient, 0.08)
      : coefficient;
  }

  function getVitalityUpcomingStage(vitality, fatigueRatio) {
    const seatThreshold = safeNumber(vitality?.seatSearchThresholdPercent, 85);
    const shortRestThresholds = (Array.isArray(vitality?.shortRestThresholdsPercent) ? vitality.shortRestThresholdsPercent : [])
      .map((value) => clamp(safeNumber(value, 0), 0, 100))
      .filter((value) => value > 0 && value < seatThreshold)
      .sort((left, right) => left - right);
    const nextShortRestThreshold = shortRestThresholds.find((value) => fatigueRatio < value);
    if (nextShortRestThreshold !== undefined) {
      return 'short-rest';
    }
    if (fatigueRatio < seatThreshold) {
      return 'seat-search';
    }
    return 'limit';
  }

  function buildVitalityStatusCard(inspection, locale) {
    const vitality = inspection?.fiveDimensions?.burdens?.vitality || {};
    const nearbySeats = Array.isArray(inspection?.nearbySeats) ? inspection.nearbySeats : [];
    const fatigueRatio = clamp(safeNumber(vitality.fatigueRatioPercent, safeNumber(inspection?.fatigue, 0)), 0, 100);
    const restState = inspection?.restState || 'none';
    let summary = localize(
      locale,
      '\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
      'Current fatigue is ' + formatPercentValue(fatigueRatio) + '.'
    );
    let advice = localize(
      locale,
      '\u5efa\u8bae\u7ee7\u7eed\u901a\u884c\u3002',
      'Continue moving along the route.'
    );

    if (restState === 'short-rest') {
      summary = localize(
        locale,
        '\u4ee3\u7406\u4eba\u6b63\u5728\u77ed\u6682\u4f11\u606f\u72b6\u6001\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
        'The agent is in a short-rest state, with current fatigue at ' + formatPercentValue(fatigueRatio) + '.'
      );
      advice = localize(
        locale,
        '\u5efa\u8bae\u7ee7\u7eed\u77ed\u6682\u6062\u590d\uff0c\u968f\u540e\u7ee7\u7eed\u901a\u884c\u3002',
        'Continue the brief rest, then proceed.'
      );
    } else if (restState === 'searching') {
      summary = localize(
        locale,
        nearbySeats.length
          ? '\u4ee3\u7406\u4eba\u6b63\u5728\u627e\u5ea7\u4f4d\u72b6\u6001\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\uff0c\u5f53\u524d\u89c6\u91ce\u8303\u56f4\u5185\u53ef\u8bc6\u522b\u5ea7\u4f4d ' + nearbySeats.length + ' \u4e2a\u3002'
          : '\u4ee3\u7406\u4eba\u6b63\u5728\u627e\u5ea7\u4f4d\u72b6\u6001\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\uff0c\u5f53\u524d\u89c6\u91ce\u8303\u56f4\u5185\u672a\u8bc6\u522b\u5230\u53ef\u7528\u5ea7\u4f4d\u3002',
        nearbySeats.length
          ? 'The agent is searching for a seat, with fatigue at ' + formatPercentValue(fatigueRatio) + ' and ' + nearbySeats.length + ' recognizable seats within the current view range.'
          : 'The agent is searching for a seat, with fatigue at ' + formatPercentValue(fatigueRatio) + ' and no recognizable seat currently within the view range.'
      );
      advice = localize(
        locale,
        nearbySeats.length
          ? '\u5efa\u8bae\u4f18\u5148\u524d\u5f80\u53ef\u89c1\u5ea7\u4f4d\u4f11\u606f\u3002'
          : '\u5efa\u8bae\u8865\u5145\u4f11\u606f\u8bbe\u65bd\u3002',
        nearbySeats.length
          ? 'Prioritize resting at a visible seat.'
          : 'Add more rest-support facilities.'
      );
    } else if (restState === 'sitting' || restState === 'standing') {
      summary = localize(
        locale,
        '\u4ee3\u7406\u4eba\u6b63\u5728\u6b63\u5f0f\u4f11\u606f\u72b6\u6001\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
        'The agent is in a formal rest state, with current fatigue at ' + formatPercentValue(fatigueRatio) + '.'
      );
      advice = localize(
        locale,
        '\u5efa\u8bae\u4f18\u5148\u5b8c\u6210\u5f53\u524d\u4f11\u606f\uff0c\u518d\u7ee7\u7eed\u901a\u884c\u3002',
        'Finish the current rest phase before continuing.'
      );
    } else {
      const upcomingStage = getVitalityUpcomingStage(vitality, fatigueRatio);
      if (upcomingStage === 'short-rest') {
        summary = localize(
          locale,
          '\u75b2\u52b3\u6c34\u5e73\u6301\u7eed\u5347\u9ad8\uff0c\u4ee3\u7406\u4eba\u5373\u5c06\u8fdb\u5165\u77ed\u6682\u4f11\u606f\u9636\u6bb5\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
          'Fatigue is continuing to rise, and the agent is approaching a short-rest stage. Current fatigue is ' + formatPercentValue(fatigueRatio) + '.'
        );
        advice = localize(
          locale,
          '\u5efa\u8bae\u7ee7\u7eed\u901a\u884c\u3002',
          'Continue moving along the route.'
        );
      } else if (upcomingStage === 'seat-search') {
        summary = localize(
          locale,
          '\u75b2\u52b3\u6c34\u5e73\u6301\u7eed\u5347\u9ad8\uff0c\u4ee3\u7406\u4eba\u5373\u5c06\u8fdb\u5165\u627e\u5ea7\u4f4d\u4f11\u606f\u9636\u6bb5\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
          'Fatigue is continuing to rise, and the agent is approaching a seat-search rest stage. Current fatigue is ' + formatPercentValue(fatigueRatio) + '.'
        );
        advice = localize(
          locale,
          nearbySeats.length
            ? '\u5efa\u8bae\u4f18\u5148\u524d\u5f80\u53ef\u89c1\u5ea7\u4f4d\u4f11\u606f\u3002'
            : '\u5efa\u8bae\u8865\u5145\u4f11\u606f\u8bbe\u65bd\u3002',
          nearbySeats.length
            ? 'Prioritize resting at a visible seat.'
            : 'Add more rest-support facilities.'
        );
      } else {
        summary = localize(
          locale,
          '\u75b2\u52b3\u6c34\u5e73\u6301\u7eed\u5347\u9ad8\uff0c\u4ee3\u7406\u4eba\u5df2\u63a5\u8fd1\u75b2\u52b3\u4e0a\u9650\uff0c\u5f53\u524d\u75b2\u52b3 ' + formatPercentValue(fatigueRatio) + '\u3002',
          'Fatigue is continuing to rise, and the agent is approaching the upper fatigue limit. Current fatigue is ' + formatPercentValue(fatigueRatio) + '.'
        );
        advice = localize(
          locale,
          nearbySeats.length
            ? '\u5efa\u8bae\u4f18\u5148\u524d\u5f80\u53ef\u89c1\u5ea7\u4f4d\u4f11\u606f\u3002'
            : '\u5efa\u8bae\u8865\u5145\u4f11\u606f\u8bbe\u65bd\u3002',
          nearbySeats.length
            ? 'Prioritize resting at a visible seat.'
            : 'Add more rest-support facilities.'
        );
      }
    }

    return createIssueItem({
      id: 'vitality-status',
      name: localize(locale, '\u75b2\u52b3\u72b6\u6001', 'Fatigue Status'),
      category: 'status',
      categoryLabel: localize(locale, '\u72b6\u6001', 'Status'),
      feature: summary,
      summary,
      pressure: fatigueRatio,
      advice,
      metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
      mapTargetId: null,
      isStatusCard: true,
      showImpact: false,
    });
  }

  function buildVitalityReasonItems(inspection, locale, topPressureSources) {
    const vitality = inspection?.fiveDimensions?.burdens?.vitality || {};
    const capacityScores = inspection?.capacityScores || inspection?.fiveDimensions?.capacityScores || {};
    const isWheelchair = safeNumber(capacityScores?.locomotor, 3) === 1;
    const explicitSources = Array.isArray(topPressureSources) ? topPressureSources : [];
    const queueCount = Math.max(0, Math.round(safeNumber(inspection?.queueCount, 0)));
    const crowdDensity = safeNumber(inspection?.crowdDensity, 0);
    const environmentNoise = safeNumber(inspection?.environmentNoise, 0);
    const environmentLighting = safeNumber(inspection?.environmentLighting, 0);
    const noiseTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isNoiseSourceItem));
    const lightingTargetIds = uniqueIds(collectIssueTargetIds(explicitSources, isLightingSourceItem));
    const locomotorContributionCoefficient = isWheelchair
      ? getVitalityContributionCoefficient(vitality.locomotorFatigueMultiplier, 0.25)
      : Math.max(1, safeNumber(vitality.locomotorFatigueMultiplier, 1));
    const sensoryContributionCoefficient = isWheelchair
      ? getVitalityContributionCoefficient(vitality.sensoryFatigueMultiplier, 0.25)
      : Math.max(1, safeNumber(vitality.sensoryFatigueMultiplier, 1));
    const cognitiveContributionCoefficient = isWheelchair
      ? getVitalityContributionCoefficient(vitality.cognitiveFatigueMultiplier, 0.25)
      : Math.max(1, safeNumber(vitality.cognitiveFatigueMultiplier, 1));
    const psychologicalContributionCoefficient = isWheelchair
      ? getVitalityContributionCoefficient(vitality.psychologicalFatigueMultiplier, 0.25)
      : Math.max(1, safeNumber(vitality.psychologicalFatigueMultiplier, 1));
    const queueContributionCoefficient = getVitalityQueueCoefficient(queueCount);
    const crowdContributionCoefficient = getVitalityCrowdCoefficient(crowdDensity);
    const noiseContributionCoefficient = getVitalityNoiseCoefficient(environmentNoise, isWheelchair);
    const lightingContributionCoefficient = getVitalityLightingCoefficient(environmentLighting, isWheelchair);
    return sortIssueItems([
      createIssueItem({
        id: 'vitality-queue',
        name: localize(locale, '\u6392\u961f\u52a0\u901f\u75b2\u52b3', 'Queueing Accelerates Fatigue'),
        category: 'facility',
        categoryLabel: localize(locale, '\u6392\u961f', 'Queue'),
        feature: localize(locale, '\u5f53\u524d\u6392\u961f\u4eba\u6570 ' + queueCount + ' \u4eba', 'Current queue count is ' + queueCount),
        summary: localize(locale, '\u5f53\u524d\u6392\u961f\u4eba\u6570 ' + queueCount + ' \u4eba\uff0c\u6392\u961f\u6b63\u5728\u63d0\u9ad8\u75b2\u52b3\u79ef\u7d2f\u901f\u5ea6\u3002', 'Current queue count is ' + queueCount + ', and queueing is increasing fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(queueContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u7f29\u77ed\u6392\u961f\u957f\u5ea6\uff0c\u6216\u5728\u6392\u961f\u533a\u9644\u8fd1\u63d0\u4f9b\u66f4\u8fd1\u7684\u4f11\u606f\u652f\u6301\u3002', 'Shorten the queue or provide closer rest support near the waiting area.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-crowd',
        name: localize(locale, '\u4eba\u6d41\u5bc6\u5ea6\u63d0\u9ad8\u75b2\u52b3', 'Crowd Density Amplifies Fatigue'),
        category: 'facility',
        categoryLabel: localize(locale, '\u4eba\u6d41', 'Crowd'),
        feature: localize(locale, '\u5f53\u524d\u4eba\u7fa4\u5bc6\u5ea6 ' + formatCompactMetric(crowdDensity, 2) + ' \u4eba/\u33a1', 'Current crowd density is ' + formatCompactMetric(crowdDensity, 2) + ' people/m2'),
        summary: localize(locale, '\u5f53\u524d\u4eba\u7fa4\u5bc6\u5ea6 ' + formatCompactMetric(crowdDensity, 2) + ' \u4eba/\u33a1\uff0c\u4eba\u7fa4\u5bc6\u5ea6\u6b63\u5728\u63d0\u9ad8\u75b2\u52b3\u79ef\u7d2f\u901f\u5ea6\u3002', 'Current crowd density is ' + formatCompactMetric(crowdDensity, 2) + ' people/m2, and crowd density is increasing fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(crowdContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u964d\u4f4e\u6c47\u6d41\u5bc6\u5ea6\uff0c\u907f\u514d\u4ee3\u7406\u4eba\u5728\u9ad8\u62e5\u6324\u73af\u5883\u4e2d\u6301\u7eed\u6d88\u8017\u3002', 'Reduce merging density so the agent is not forced to keep expending energy in crowded conditions.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-sensory-multiplier',
        name: localize(locale, '\u611f\u77e5\u8d1f\u62c5\u653e\u5927\u75b2\u52b3', 'Sensory Burden Amplifies Fatigue'),
        category: 'decision',
        categoryLabel: localize(locale, '\u611f\u77e5\u653e\u5927', 'Sensory Amplification'),
        feature: localize(locale, '\u5f53\u524d\u611f\u77e5\u653e\u5927\u7cfb\u6570 ' + safeNumber(vitality.sensoryFatigueMultiplier, 1).toFixed(2), 'Current sensory multiplier is ' + safeNumber(vitality.sensoryFatigueMultiplier, 1).toFixed(2)),
        summary: localize(locale, '\u5f53\u524d\u611f\u77e5\u653e\u5927\u7cfb\u6570\u4e3a ' + safeNumber(vitality.sensoryFatigueMultiplier, 1).toFixed(2) + '\uff0c\u611f\u77e5\u8d1f\u62c5\u6b63\u5728\u653e\u5927\u75b2\u52b3\u79ef\u7d2f\u3002', 'The current sensory multiplier is ' + safeNumber(vitality.sensoryFatigueMultiplier, 1).toFixed(2) + ', and sensory burden is amplifying fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(sensoryContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u540c\u6b65\u4f18\u5316\u53ef\u8bc6\u522b\u4fe1\u606f\u3001\u566a\u97f3\u4e0e\u5149\u7167\u73af\u5883\uff0c\u907f\u514d\u611f\u77e5\u8d1f\u62c5\u7ee7\u7eed\u63a8\u9ad8\u75b2\u52b3\u3002', 'Improve recognizable information, noise, and lighting together so sensory burden stops amplifying fatigue.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-locomotor-multiplier',
        name: localize(locale, '\u884c\u52a8\u8d1f\u62c5\u653e\u5927\u75b2\u52b3', 'Locomotor Burden Amplifies Fatigue'),
        category: 'decision',
        categoryLabel: localize(locale, '\u884c\u52a8\u653e\u5927', 'Locomotor Amplification'),
        feature: localize(locale, '\u5f53\u524d\u884c\u52a8\u653e\u5927\u7cfb\u6570 ' + safeNumber(vitality.locomotorFatigueMultiplier, 1).toFixed(2), 'Current locomotor multiplier is ' + safeNumber(vitality.locomotorFatigueMultiplier, 1).toFixed(2)),
        summary: localize(locale, '\u5f53\u524d\u884c\u52a8\u653e\u5927\u7cfb\u6570\u4e3a ' + safeNumber(vitality.locomotorFatigueMultiplier, 1).toFixed(2) + '\uff0c\u884c\u52a8\u8d1f\u62c5\u6b63\u5728\u653e\u5927\u75b2\u52b3\u79ef\u7d2f\u3002', 'The current locomotor multiplier is ' + safeNumber(vitality.locomotorFatigueMultiplier, 1).toFixed(2) + ', and locomotor burden is amplifying fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(locomotorContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u964d\u4f4e\u63a5\u4e0b\u6765\u8def\u6bb5\u7684\u79fb\u52a8\u963b\u529b\u4e0e\u53cd\u590d\u7ed5\u884c\uff0c\u51cf\u5c11\u989d\u5916\u4f53\u529b\u6d88\u8017\u3002', 'Reduce movement resistance and unnecessary detours in the next segment to lower extra exertion.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-cognitive-multiplier',
        name: localize(locale, '\u8ba4\u77e5\u8d1f\u62c5\u653e\u5927\u75b2\u52b3', 'Cognitive Burden Amplifies Fatigue'),
        category: 'decision',
        categoryLabel: localize(locale, '\u8ba4\u77e5\u653e\u5927', 'Cognitive Amplification'),
        feature: localize(locale, '\u5f53\u524d\u8ba4\u77e5\u653e\u5927\u7cfb\u6570 ' + safeNumber(vitality.cognitiveFatigueMultiplier, 1).toFixed(2), 'Current cognitive multiplier is ' + safeNumber(vitality.cognitiveFatigueMultiplier, 1).toFixed(2)),
        summary: localize(locale, '\u5f53\u524d\u8ba4\u77e5\u653e\u5927\u7cfb\u6570\u4e3a ' + safeNumber(vitality.cognitiveFatigueMultiplier, 1).toFixed(2) + '\uff0c\u8ba4\u77e5\u8d1f\u62c5\u6b63\u5728\u653e\u5927\u75b2\u52b3\u79ef\u7d2f\u3002', 'The current cognitive multiplier is ' + safeNumber(vitality.cognitiveFatigueMultiplier, 1).toFixed(2) + ', and cognitive burden is amplifying fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(cognitiveContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u51cf\u5c11\u4e34\u8fd1\u8282\u70b9\u7684\u5224\u65ad\u538b\u529b\uff0c\u907f\u514d\u5728\u9ad8\u75b2\u52b3\u72b6\u6001\u4e0b\u7ee7\u7eed\u6d88\u8017\u51b3\u7b56\u8d44\u6e90\u3002', 'Reduce decision pressure near the next node so cognitive effort does not keep draining energy under fatigue.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-psychological-multiplier',
        name: localize(locale, '\u5fc3\u7406\u8d1f\u62c5\u653e\u5927\u75b2\u52b3', 'Psychological Burden Amplifies Fatigue'),
        category: 'decision',
        categoryLabel: localize(locale, '\u5fc3\u7406\u653e\u5927', 'Psychological Amplification'),
        feature: localize(locale, '\u5f53\u524d\u5fc3\u7406\u653e\u5927\u7cfb\u6570 ' + safeNumber(vitality.psychologicalFatigueMultiplier, 1).toFixed(2), 'Current psychological multiplier is ' + safeNumber(vitality.psychologicalFatigueMultiplier, 1).toFixed(2)),
        summary: localize(locale, '\u5f53\u524d\u5fc3\u7406\u653e\u5927\u7cfb\u6570\u4e3a ' + safeNumber(vitality.psychologicalFatigueMultiplier, 1).toFixed(2) + '\uff0c\u5fc3\u7406\u8d1f\u62c5\u6b63\u5728\u653e\u5927\u75b2\u52b3\u79ef\u7d2f\u3002', 'The current psychological multiplier is ' + safeNumber(vitality.psychologicalFatigueMultiplier, 1).toFixed(2) + ', and psychological burden is amplifying fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(psychologicalContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u964d\u4f4e\u6301\u7eed\u538b\u8feb\u611f\u4e0e\u505c\u6ede\u611f\uff0c\u907f\u514d\u5fc3\u7406\u8d1f\u62c5\u8fdb\u4e00\u6b65\u63a8\u9ad8\u75b2\u52b3\u3002', 'Reduce sustained pressure and stagnation so psychological burden does not keep pushing fatigue upward.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'vitality-noise',
        name: localize(locale, '\u566a\u97f3\u52a0\u901f\u75b2\u52b3', 'Noise Accelerates Fatigue'),
        category: 'noise',
        categoryLabel: localize(locale, '\u566a\u97f3', 'Noise'),
        feature: localize(locale, '\u5f53\u524d\u566a\u97f3 ' + safeNumber(environmentNoise, 0).toFixed(0) + ' dB', 'Current noise is ' + safeNumber(environmentNoise, 0).toFixed(0) + ' dB'),
        summary: localize(locale, '\u5f53\u524d\u566a\u97f3 ' + safeNumber(environmentNoise, 0).toFixed(0) + ' dB\uff0c\u566a\u97f3\u6b63\u5728\u63d0\u9ad8\u75b2\u52b3\u79ef\u7d2f\u901f\u5ea6\u3002', 'Current noise is ' + safeNumber(environmentNoise, 0).toFixed(0) + ' dB, and noise is increasing fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(noiseContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u4f18\u5148\u5904\u7406\u5f53\u524d\u9ad8\u566a\u97f3\u538b\u529b\u6e90\uff0c\u964d\u4f4e\u6301\u7eed\u58f0\u538b\u523a\u6fc0\u3002', 'Prioritize the current high-noise sources to reduce sustained acoustic stimulation.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetIds: noiseTargetIds,
      }),
      createIssueItem({
        id: 'vitality-lighting',
        name: localize(locale, '\u5149\u7167\u6761\u4ef6\u52a0\u901f\u75b2\u52b3', 'Lighting Conditions Accelerate Fatigue'),
        category: 'facility',
        categoryLabel: localize(locale, '\u5149\u7167', 'Lighting'),
        feature: localize(locale, '\u5f53\u524d\u7167\u5ea6 ' + safeNumber(environmentLighting, 0).toFixed(0) + ' lux', 'Current lighting is ' + safeNumber(environmentLighting, 0).toFixed(0) + ' lux'),
        summary: localize(locale, '\u5f53\u524d\u7167\u5ea6 ' + safeNumber(environmentLighting, 0).toFixed(0) + ' lux\uff0c\u5149\u7167\u6761\u4ef6\u6b63\u5728\u63d0\u9ad8\u75b2\u52b3\u79ef\u7d2f\u901f\u5ea6\u3002', 'Current lighting is ' + safeNumber(environmentLighting, 0).toFixed(0) + ' lux, and lighting conditions are increasing fatigue accumulation.'),
        pressure: getVitalityContributionScoreFromCoefficient(lightingContributionCoefficient),
        advice: localize(locale, '\u5efa\u8bae\u4f18\u5148\u4fee\u6b63\u5f53\u524d\u8fc7\u6697\u6216\u8fc7\u4eae\u7684\u5149\u7167\u538b\u529b\u6e90\uff0c\u964d\u4f4e\u89c6\u89c9\u75b2\u52b3\u3002', 'Prioritize correcting dim or over-bright lighting sources to reduce visual fatigue.'),
        metricLabel: localize(locale, '\u8d1f\u62c5\u503c', 'Burden'),
        mapTargetIds: lightingTargetIds,
      }),
    ], 3);
  }

  function buildVitalityIssueItems(inspection, locale, topPressureSources) {
    const statusCard = buildVitalityStatusCard(inspection, locale);
    const reasonItems = buildVitalityReasonItems(inspection, locale, topPressureSources);
    return [statusCard].concat(reasonItems);
  }

  function buildLocomotorIssueItemsV3(inspection, locale) {
    const locomotor = inspection?.fiveDimensions?.burdens?.locomotor || {};
    const nearbyNode = inspection?.fiveDimensions?.context?.nearbyNodes?.[0] || null;
    const nearbyNodeLabel = nearbyNode?.name || nearbyNode?.id || '';
    const crowdPressure = clamp(
      safeNumber(locomotor.crowdResistance, 0) * 100 + safeNumber(locomotor.microJam, 0),
      0,
      100
    );
    const queuePressure = clamp(safeNumber(locomotor.queueResistance, 0) * 85, 0, 100);
    const verticalPressure = clamp(safeNumber(locomotor.verticalTransferResistance, 0) * 140 + 6, 0, 100);
    const obstaclePressure = clamp(
      safeNumber(locomotor.obstacleAvoidanceResistance, 0) * 100
      + safeNumber(locomotor.narrowPassageResistance, 0) * 45
      + safeNumber(locomotor.wallFollowStrength, 0) * 25,
      0,
      100
    );
    const assistivePressure = clamp(safeNumber(locomotor.assistiveDeviceResistance, 0) * 15, 0, 100);
    return sortIssueItems([
      createIssueItem({
        id: 'locomotor-crowd',
        name: localize(locale, '\u4eba\u7fa4\u5bc6\u5ea6\u963b\u788d\u901a\u884c', 'Crowd Density Obstructs Movement'),
        category: 'noise_congestion',
        categoryLabel: localize(locale, '\u4eba\u7fa4\u963b\u788d', 'Crowd Friction'),
        feature: localize(
          locale,
          `\u5f53\u524d\u4eba\u7fa4\u5bc6\u5ea6 ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} \u4eba/\u33a1`,
          `Current crowd density ${safeNumber(inspection?.crowdDensity, 0).toFixed(2)} p/m²`
        ),
        summary: localize(
          locale,
          '\u4eba\u7fa4\u4f1a\u538b\u7f29\u53ef\u901a\u884c\u7a7a\u95f4\u5e76\u964d\u4f4e\u901a\u884c\u6548\u7387\uff0c\u5f53\u524d\u4eba\u7fa4\u5bc6\u5ea6\u504f\u9ad8\u3002',
          'Crowd compresses usable passage space and lowers movement efficiency, with crowd density currently elevated.'
        ),
        pressure: crowdPressure,
        advice: localize(
          locale,
          '\u5efa\u8bae\u4f18\u5148\u758f\u89e3\u74f6\u9888\u5904\u6c47\u6d41\uff0c\u5e76\u4e3a\u4f4e\u884c\u52a8\u80fd\u529b\u4ee3\u7406\u4eba\u9884\u7559\u66f4\u8fde\u7eed\u7684\u901a\u884c\u5e26\u3002',
          'Reduce bottleneck merging and keep a more continuous passage band for low-mobility agents.'
        ),
        metricLabel: localize(locale, '\u5f71\u54cd\u7a0b\u5ea6', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'locomotor-queue',
        name: localize(locale, '\u6392\u961f\u5360\u9053\u589e\u52a0\u7ed5\u884c', 'Queue Occupies the Passage'),
        category: 'facility',
        categoryLabel: localize(locale, '\u6392\u961f\u5360\u9053', 'Queue Occupancy'),
        feature: localize(
          locale,
          `\u5f53\u524d\u6392\u961f\u4eba\u6570 ${Math.round(safeNumber(inspection?.queueCount, 0))} \u4eba`,
          `Current queue count ${Math.round(safeNumber(inspection?.queueCount, 0))}`
        ),
        summary: localize(
          locale,
          '\u6392\u961f\u4eba\u7fa4\u6b63\u5728\u5360\u7528\u4e3b\u901a\u884c\u5e26\uff0c\u4ee3\u7406\u4eba\u9700\u8981\u51cf\u901f\u6216\u7ed5\u884c\u901a\u8fc7\u3002',
          'Queueing people are occupying the main corridor, forcing the agent to slow down or detour.'
        ),
        pressure: queuePressure,
        advice: localize(
          locale,
          '\u5efa\u8bae\u5c06\u6392\u961f\u533a\u4ece\u4e3b\u901a\u884c\u5e26\u65c1\u79fb\u5f00\uff0c\u907f\u514d\u8fde\u7eed\u901a\u884c\u8def\u5f84\u88ab\u5360\u7528\u3002',
          'Move queueing away from the main corridor so the continuous route remains clear.'
        ),
        metricLabel: localize(locale, '\u5f71\u54cd\u7a0b\u5ea6', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
        overlayKind: 'queue-zone',
      }),
      createIssueItem({
        id: 'locomotor-vertical',
        name: localize(locale, '\u7ad6\u5411\u6362\u4e58\u589e\u52a0\u884c\u52a8\u8d1f\u62c5', 'Vertical Transfer Raises Locomotor Burden'),
        category: 'facility',
        categoryLabel: localize(locale, '\u7ad6\u5411\u6362\u4e58', 'Vertical Transfer'),
        feature: nearbyNodeLabel
          ? localize(locale, `\u5f53\u524d\u5173\u8054\u8282\u70b9 ${nearbyNodeLabel}`, `Current linked node ${nearbyNodeLabel}`)
          : localize(locale, '\u5f53\u524d\u5904\u4e8e\u7ad6\u5411\u6362\u4e58\u654f\u611f\u533a', 'The agent is near a vertical-transfer-sensitive zone'),
        summary: nearbyNodeLabel
          ? localize(
            locale,
            `\u5f53\u524d\u4f4d\u7f6e\u63a5\u8fd1${nearbyNodeLabel}\uff0c\u7ad6\u5411\u6362\u4e58\u6b63\u5728\u62ac\u9ad8\u884c\u52a8\u8d1f\u62c5\u3002`,
            `The current position is close to ${nearbyNodeLabel}, where vertical transfer is increasing locomotor burden.`
          )
          : localize(
            locale,
            '\u5f53\u524d\u4f4d\u7f6e\u63a5\u8fd1\u7ad6\u5411\u6362\u4e58\u8282\u70b9\uff0c\u6362\u5c42\u52a8\u4f5c\u6b63\u5728\u62ac\u9ad8\u884c\u52a8\u8d1f\u62c5\u3002',
            'The current position is close to a vertical transfer node, increasing locomotor burden.'
          ),
        pressure: verticalPressure,
        advice: localize(
          locale,
          '\u5efa\u8bae\u4f18\u5148\u4f18\u5316\u7535\u68af\u6216\u6362\u4e58\u8282\u70b9\u4e0e\u4e3b\u901a\u9053\u7684\u8854\u63a5\uff0c\u51cf\u5c11\u6362\u5c42\u963b\u6ede\u3002',
          'Improve the connection between elevators or transfer nodes and the main corridor to reduce transfer resistance.'
        ),
        metricLabel: localize(locale, '\u5f71\u54cd\u7a0b\u5ea6', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
      }),
      createIssueItem({
        id: 'locomotor-obstacle',
        name: localize(locale, '\u907f\u969c\u9891\u7e41\u6253\u65ad\u79fb\u52a8', 'Obstacle Avoidance Breaks Movement Rhythm'),
        category: 'facility',
        categoryLabel: localize(locale, '\u907f\u969c\u5e72\u6270', 'Obstacle Avoidance'),
        feature: localize(locale, '\u5f53\u524d\u8def\u5f84\u5b58\u5728\u969c\u788d\u4e0e\u7a84\u9053\u5e72\u6270', 'The current route is affected by obstacles and narrow passages'),
        summary: localize(
          locale,
          '\u5468\u8fb9\u969c\u788d\u4e0e\u7a84\u9053\u6b63\u5728\u589e\u52a0\u8f6c\u5411\u548c\u907f\u8ba9\u6b21\u6570\uff0c\u901a\u884c\u8fde\u7eed\u6027\u4e0b\u964d\u3002',
          'Nearby obstacles and narrow passages are increasing steering and avoidance frequency, reducing movement continuity.'
        ),
        pressure: obstaclePressure,
        advice: localize(
          locale,
          '\u5efa\u8bae\u653e\u5bbd\u5173\u952e\u8f6c\u89d2\u4e0e\u7a84\u53e3\u5904\u7684\u51c0\u7a7a\uff0c\u51cf\u5c11\u8fde\u7eed\u907f\u969c\u9020\u6210\u7684\u79fb\u52a8\u6253\u65ad\u3002',
          'Widen critical turning areas and narrow passages to reduce repeated interruption from obstacle avoidance.'
        ),
        metricLabel: localize(locale, '\u5f71\u54cd\u7a0b\u5ea6', 'Impact'),
        mapTargetId: null,
      }),
      createIssueItem({
        id: 'locomotor-assistive',
        name: localize(locale, '\u8f85\u52a9\u51fa\u884c\u901a\u884c\u53d7\u9650', 'Assistive Movement Is Constrained'),
        category: 'facility',
        categoryLabel: localize(locale, '\u8f85\u52a9\u901a\u884c', 'Assistive Access'),
        feature: localize(locale, '\u5f53\u524d\u901a\u884c\u6761\u4ef6\u5bf9\u8f85\u52a9\u51fa\u884c\u8bbe\u5907\u4e0d\u591f\u53cb\u597d', 'Current passage conditions are not friendly to assistive mobility devices'),
        summary: localize(
          locale,
          '\u5f53\u524d\u901a\u884c\u6761\u4ef6\u5bf9\u8f6e\u6905\u3001\u52a9\u884c\u5668\u7b49\u8f85\u52a9\u51fa\u884c\u65b9\u5f0f\u4e0d\u591f\u53cb\u597d\uff0c\u79fb\u52a8\u963b\u529b\u6b63\u5728\u589e\u52a0\u3002',
          'Current passage conditions are not friendly to wheelchairs or walkers, increasing movement resistance.'
        ),
        pressure: assistivePressure,
        advice: localize(
          locale,
          '\u5efa\u8bae\u4f18\u5148\u4fdd\u8bc1\u65e0\u969c\u788d\u51c0\u5bbd\u4e0e\u8f6c\u5f2f\u7a7a\u95f4\uff0c\u51cf\u5c11\u8f85\u52a9\u51fa\u884c\u8bbe\u5907\u53d7\u963b\u3002',
          'Ensure clear width and turning space for assistive mobility devices.'
        ),
        metricLabel: localize(locale, '\u5f71\u54cd\u7a0b\u5ea6', 'Impact'),
        mapTargetId: nearbyNode?.id || null,
      }),
    ]);
  }

  function buildCompositeIssueItems(inspection, locale) {
    const burdenScores = inspection?.burdenScores || {};
    return BURDEN_DIMENSION_ORDER
      .map((id) => {
        const pressure = clamp(safeNumber(burdenScores?.[id], 0), 0, 100);
        return createIssueItem({
          id: `composite-${id}`,
          name: getBurdenLabel(id, locale),
          category: 'composite',
          categoryLabel: localize(locale, '五维排序', 'Burden Ranking'),
          feature: localize(
            locale,
            `当前值 ${formatCompactMetric(pressure, 1)} / 100`,
            `Current value ${formatCompactMetric(pressure, 1)} / 100`
          ),
          pressure,
          advice: localize(
            locale,
            `点击切换到${getBurdenLabel(id, locale)}视图。`,
            `Click to switch to the ${getBurdenLabel(id, locale)} view.`
          ),
          metricLabel: localize(locale, '负担值', 'Burden'),
          mapTargetId: null,
          mapTargetIds: [],
          actionViewMode: id,
        });
      })
      .sort((left, right) => safeNumber(right.pressure, 0) - safeNumber(left.pressure, 0));
  }

  function buildInspectionIssueItems(options) {
    const inspection = options?.inspection || null;
    if (!inspection) {
      return [];
    }
    const locale = options?.locale || 'zh-CN';
    const viewMode = options?.viewMode || 'cognitive';
    const topPressureSources = Array.isArray(options?.topPressureSources) ? options.topPressureSources : [];
    if (viewMode === 'locomotor') {
      return buildLocomotorIssueItemsV3(inspection, locale);
    }
    if (viewMode === 'sensory') {
      return buildSensoryIssueItems(inspection, topPressureSources, locale);
    }
    if (viewMode === 'psychological') {
      return buildPsychologicalIssueItems(inspection, topPressureSources, locale);
    }
    if (viewMode === 'vitality') {
      return buildVitalityIssueItems(inspection, locale, topPressureSources);
    }
    if (viewMode === 'composite') {
      return buildCompositeIssueItems(inspection, locale);
    }
    return buildCognitiveCategoryIssueItems(inspection, topPressureSources, locale);
  }

  function normalizeIssueItem(item, rank) {
    if (!item) {
      return null;
    }
    const pressure = safeNumber(
      item.pressure,
      safeNumber(item.score, safeNumber(item.pressureDelta, 0))
    );
    const mapTargetIds = uniqueIds([
      ...(Array.isArray(item.mapTargetIds) ? item.mapTargetIds : []),
      item.mapTargetId,
      item.mapTargetId === undefined ? item.id : null,
    ]);
    return {
      id: item.id || `issue-${rank}`,
      rank,
      name: item.name || item.id || `Issue ${rank}`,
      category: item.category || 'unknown',
      feature: item.feature || '--',
      pressure,
      score: pressure,
      pressureDelta: safeNumber(item.pressureDelta, pressure),
      sourceKind: item.sourceKind || null,
      summary: item.summary || item.feature || item.name || null,
      categoryLabel: item.categoryLabel || null,
      advice: item.advice || null,
      metricLabel: item.metricLabel || null,
      isStatusCard: Boolean(item.isStatusCard),
      showImpact: item.showImpact !== false,
      actionViewMode: item.actionViewMode || null,
      overlayKind: item.overlayKind || null,
      mapTargetId: item.mapTargetId === undefined
        ? (mapTargetIds[0] || item.id || null)
        : (item.mapTargetId || mapTargetIds[0] || null),
      mapTargetIds,
    };
  }

  function buildIssuePanelState(options) {
    const inspection = options?.inspection || null;
    const topPressureSources = Array.isArray(options?.topPressureSources)
      ? options.topPressureSources
      : [];
    const selectedIssue = options?.selectedIssue || null;
    const viewMode = options?.viewMode || 'cognitive';
    const locale = options?.locale || 'zh-CN';
    const inspectionItems = buildInspectionIssueItems({
      inspection,
      topPressureSources,
      viewMode,
      locale,
    });
    const sourceItems = inspectionItems.length
      ? inspectionItems
      : (topPressureSources.length ? topPressureSources : (selectedIssue ? [selectedIssue] : []));
    const items = sourceItems
      .map((item, index) => normalizeIssueItem(item, index + 1))
      .filter(Boolean);
    return {
      mode: items.length ? 'issues' : 'hint',
      summary: viewMode === 'sensory' && inspection && items.length
        ? buildSensoryIssueSummary(inspection, locale)
        : (viewMode === 'composite' && inspection && items.length
          ? localize(locale, '综合负担是五项负担的等权平均，用于总览，不替代单项诊断。', 'Composite burden is the equal-weight average of the five burdens for overview, not a replacement for single-burden diagnosis.')
          : null),
      items,
    };
  }

  function buildAgentProfileFieldState(options) {
    const profile = options?.profile || {};
    const inspection = options?.inspection || {};
    const capacityScores = profile.capacityScores || {};
    const burdenScores = inspection.burdenScores || {};
    return {
      staticFields: [],
      capacityFields: [
        { id: 'locomotor', value: safeNumber(capacityScores.locomotor, 0) },
        { id: 'sensory', value: safeNumber(capacityScores.sensory, 0) },
        { id: 'cognitive', value: safeNumber(capacityScores.cognitive, 0) },
        { id: 'psychological', value: safeNumber(capacityScores.psychological, 0) },
        { id: 'vitality', value: safeNumber(capacityScores.vitality, 0) },
      ],
      dynamicFields: [
        { id: 'heat', value: safeNumber(inspection.heat, 0) },
        { id: 'crowdDensity', value: safeNumber(inspection.crowdDensity, 0) },
        { id: 'progress', value: safeNumber(inspection.progress, 0) },
        { id: 'visionRadius', value: safeNumber(inspection.visionRadius, 0) },
        { id: 'environmentNoise', value: safeNumber(inspection.environmentNoise, 0) },
        { id: 'environmentLighting', value: safeNumber(inspection.environmentLighting, 0) },
        { id: 'queueCount', value: safeNumber(inspection.queueCount, 0) },
        { id: 'walkingSpeed', value: safeNumber(inspection.walkingSpeed, 0) },
        { id: 'decisionDelay', value: safeNumber(inspection.decisionDelay, 0) },
        { id: 'movementBehavior', value: inspection?.movementBehavior || inspection?.fiveDimensions?.burdens?.locomotor?.movementBehavior || 'normal_walk' },
        { id: 'movementMainCause', value: inspection?.movementMainCause || inspection?.fiveDimensions?.burdens?.locomotor?.movementMainCause || 'speed' },
        {
          id: 'movementSpeedFactor',
          value: safeNumber(
            inspection?.movementSpeedFactor,
            safeNumber(inspection?.fiveDimensions?.burdens?.locomotor?.movementSpeedFactor, 1)
          ),
        },
      ],
      burdenFields: [
        { id: 'locomotor', value: safeNumber(burdenScores.locomotor, 0) },
        { id: 'sensory', value: safeNumber(burdenScores.sensory, 0) },
        { id: 'cognitive', value: safeNumber(burdenScores.cognitive, 0) },
        { id: 'psychological', value: safeNumber(burdenScores.psychological, 0) },
        { id: 'vitality', value: safeNumber(burdenScores.vitality, 0) },
      ],
    };
  }

  function buildAgentProfilePanelState(options) {
    const selectedDynamicKind = options?.selectedDynamicKind || null;
    if (selectedDynamicKind !== 'focus-agent') {
      return {
        mode: 'hint',
        fieldState: null,
      };
    }
    return {
      mode: 'details',
      fieldState: buildAgentProfileFieldState(options),
    };
  }

  return {
    getDynamicSimultaneousCount,
    getCurrentTravelTimeSeconds,
    getMetricRange,
    buildInspectionIssueItems,
    buildIssuePanelState,
    buildAgentProfileFieldState,
    buildAgentProfilePanelState,
  };
});
