(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    global.PlanarSim = factory();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const CATEGORY_COLORS = {
    noise_congestion: '#ff925f',
    noise: '#b774ff',
    advert: '#ffad61',
    signage: '#5dc9ff',
    decision: '#77b8ff',
    facility: '#79d7c4',
    unknown: '#74879d',
  };

  const PRESSURE_WEIGHTS = {
    noise_congestion: 1.18,
    noise: 0.96,
    advert: 0.84,
    signage: 0.72,
    decision: 0.8,
    facility: 0.78,
    unknown: 0.25,
  };

  const NODE_GROUP_COLORS = {
    gate_in: '#4fd1c5',
    gate_out: '#f6ad55',
    chai_wan_train: '#f87171',
    twl_up: '#c084fc',
    twl_down: '#8b5cf6',
    kdt_up: '#60a5fa',
    kdt_down: '#2563eb',
    elevator: '#7dd3fc',
    stair: '#cbd5e1',
    node: '#94a3b8',
  };

  const TARGET_REGION_COLORS = {
    exit_a: '#4fd1c5',
    exit_b: '#2dd4bf',
    exit_c: '#14b8a6',
    exit_d: '#0f766e',
    chai_wan: '#f87171',
    twl: '#a855f7',
    kdt: '#3b82f6',
  };

  const FOCUS_ROUTE_PRESETS = [
    { id: 'route1', name: 'Route 1 · gate_in_2 → train_door4', startNodeId: 'gate_in_2', endNodeId: 'train_door4', highlightColor: '#ff7e6b' },
    { id: 'route2', name: 'Route 2 · es_up_1_top → gate_out_1', startNodeId: 'es_up_1_top', endNodeId: 'gate_out_1', highlightColor: '#65d9ff' },
    { id: 'route3', name: 'Route 3 · train_door1 → es_down_5_top', startNodeId: 'train_door1', endNodeId: 'es_down_5_top', highlightColor: '#ffd56e' },
  ];

  const CROWD_PRESETS = [
    { id: 'normal', label: '平时', simultaneousCount: 70, backgroundCount: 69, focusCount: 1 },
    { id: 'peak', label: '高峰', simultaneousCount: 123, backgroundCount: 122, focusCount: 1 },
  ];

  const CROWD_INPUT_MARKERS = [
    { requested: 100, simulated: 12 },
    { requested: 1595, simulated: 70 },
    { requested: 3190, simulated: 123 },
  ];

  const ROUTE_FAMILY_RULES = [
    { family: 'gate_in_to_train_door', startCollection: 'gate_in', endCollection: 'train_door', weight: 0.0175 },
    { family: 'gate_in_to_twl_down', startCollection: 'gate_in', endCollection: 'twl_down', weight: 0.11 },
    { family: 'gate_in_to_kdt_down', startCollection: 'gate_in', endCollection: 'kdt_down', weight: 0.09 },
    { family: 'train_door_to_gate_out', startCollection: 'train_door', endCollection: 'gate_out', weight: 0.15 },
    { family: 'train_door_to_twl_down', startCollection: 'train_door', endCollection: 'twl_down', weight: 0.14 },
    { family: 'train_door_to_kdt_down', startCollection: 'train_door', endCollection: 'kdt_down', weight: 0.10 },
    { family: 'twl_up_to_gate_out', startCollection: 'twl_up', endCollection: 'gate_out', weight: 0.17 },
    { family: 'twl_up_to_train_door', startCollection: 'twl_up', endCollection: 'train_door', weight: 0.01 },
    { family: 'kdt_up_to_gate_out', startCollection: 'kdt_up', endCollection: 'gate_out', weight: 0.11 },
    { family: 'kdt_up_to_train_door', startCollection: 'kdt_up', endCollection: 'train_door', weight: 0.005 },
  ];

  const BACKGROUND_ELEVATOR_ROUTE_WEIGHT_FACTOR = 0.02;
  const BACKGROUND_TRAIN_BALANCE_STRENGTH = 0.42;
  const BACKGROUND_TRAIN_BALANCE_MIN_FACTOR = 0.45;
  const BACKGROUND_TRAIN_BALANCE_MAX_FACTOR = 1.75;
  const SENSORY_OBJECT_LOAD_COMPRESSION = 1.15;

  const LOCOMOTOR_BASE_WALKING_SPEED = Object.freeze({
    1: 0.75,
    2: 0.55,
    3: 0.70,
    4: 0.90,
    5: 1.10,
  });

  const COGNITIVE_BASE_DECISION_DELAY = Object.freeze({
    1: 0.85,
    2: 0.82,
    3: 0.80,
    4: 0.75,
    5: 0.73,
  });

  const SENSORY_DECISION_DELAY_OFFSET = Object.freeze({
    1: 0.10,
    2: 0.06,
    3: 0.02,
    4: 0.01,
    5: 0.00,
  });

  const PSYCHOLOGICAL_DECISION_DELAY_OFFSET = Object.freeze({
    1: 0.09,
    2: 0.04,
    3: 0.02,
    4: 0.01,
    5: 0.00,
  });

  const SENSORY_CROSS_MODIFIERS = Object.freeze({
    cognitive: Object.freeze({ 1: 0.06, 2: 0.03, 3: 0.00, 4: -0.03, 5: -0.06 }),
    psychological: Object.freeze({ 1: 0.05, 2: 0.025, 3: 0.00, 4: -0.025, 5: -0.05 }),
    locomotor: Object.freeze({ 1: 0.04, 2: 0.02, 3: 0.00, 4: -0.02, 5: -0.04 }),
    vitality: Object.freeze({ 1: 0.04, 2: 0.02, 3: 0.00, 4: -0.02, 5: -0.04 }),
  });

  const LOCOMOTOR_CROSS_MODIFIERS = Object.freeze({
    sensory: Object.freeze({ 1: 0.08, 2: 0.04, 3: 0.00, 4: -0.04, 5: -0.08 }),
    cognitive: Object.freeze({ 1: 0.04, 2: 0.02, 3: 0.00, 4: -0.02, 5: -0.04 }),
    psychological: Object.freeze({ 1: 0.06, 2: 0.03, 3: 0.00, 4: -0.03, 5: -0.06 }),
    vitality: Object.freeze({ 1: 0.10, 2: 0.05, 3: 0.00, 4: -0.03, 5: -0.06 }),
  });

  const LOCOMOTOR_CROWD_MULTIPLIER = Object.freeze({
    1: 1.60,
    2: 1.50,
    3: 1.40,
    4: 1.10,
    5: 1.00,
  });

  const LOCOMOTOR_NARROW_MULTIPLIER = Object.freeze({
    1: 1.55,
    2: 1.40,
    3: 1.25,
    4: 1.10,
    5: 1.00,
  });

  const LOCOMOTOR_ASSISTIVE_RESISTANCE = Object.freeze({
    1: 0.28,
    2: 0.22,
    3: 0.12,
    4: 0.05,
    5: 0.02,
  });

  const LOCOMOTOR_VERTICAL_PENALTY = Object.freeze({
    stair: Object.freeze({ 1: 1.00, 2: 1.00, 3: 0.85, 4: 0.50, 5: 0.30 }),
    escalator: Object.freeze({ 1: 1.00, 2: 1.00, 3: 0.55, 4: 0.28, 5: 0.18 }),
    elevator: Object.freeze({ 1: 0.42, 2: 0.36, 3: 0.24, 4: 0.18, 5: 0.12 }),
    gate: Object.freeze({ 1: 0.32, 2: 0.26, 3: 0.20, 4: 0.14, 5: 0.10 }),
    platform: Object.freeze({ 1: 0.18, 2: 0.14, 3: 0.10, 4: 0.08, 5: 0.05 }),
    generic: Object.freeze({ 1: 0.16, 2: 0.12, 3: 0.10, 4: 0.08, 5: 0.06 }),
  });

  const LOCOMOTOR_MICRO_JAM = Object.freeze({
    1: 16,
    2: 12,
    3: 8,
  });

  const LOCOMOTOR_WALL_FOLLOW_STRENGTH = Object.freeze({
    1: 0.75,
    2: 0.55,
    3: 0.35,
  });

  const LOCOMOTOR_VERTICAL_EFFECT_RADIUS = 3.2;
  const LOCOMOTOR_ASSISTIVE_BASELINE = 0.35;

  const LOCOMOTOR_SPEED_FACTORS = Object.freeze({
    reduced: Object.freeze({ 1: 0.65, 2: 0.72, 3: 0.80, 4: 0.88, 5: 0.92 }),
    blocked: Object.freeze({ 1: 0.50, 2: 0.58, 3: 0.68, 4: 0.78, 5: 0.85 }),
    queue: Object.freeze({ 1: 0.35, 2: 0.42, 3: 0.55, 4: 0.65, 5: 0.72 }),
    severe: Object.freeze({ 1: 0.18, 2: 0.25, 3: 0.35, 4: 0.45, 5: 0.55 }),
  });
  const WHEELCHAIR_SPEED_FACTORS = Object.freeze({
    reduced: 0.84,
    blocked: 0.72,
    queue: 0.58,
    severe: 0.46,
  });
  const WHEELCHAIR_MIN_MOVING_SPEED = 0.42;
  const FATIGUE_THRESHOLD_SLOW_WALK_FACTOR = 0.5;

  const BASAL_FATIGUE_VELOCITY = Object.freeze({
    1: 0.135,
    2: 0.105,
    3: 0.082,
    4: 0.066,
    5: 0.052,
  });

  const WHEELCHAIR_BASE_FATIGUE_VELOCITY = Object.freeze({
    1: 0.052,
    2: 0.046,
    3: 0.041,
    4: 0.037,
    5: 0.032,
  });

  const WHEELCHAIR_FATIGUE_MULTIPLIER_DAMPING = 0.25;
  const WHEELCHAIR_FATIGUE_ENVIRONMENT_DAMPING = Object.freeze({
    noise: 0.08,
    lighting: 0.08,
  });

  const FATIGUE_THRESHOLDS = Object.freeze({
    default: 100,
    1: 100,
    2: 100,
    3: 100,
    4: 100,
    5: 100,
    '65-69': 100,
    '70-74': 100,
    '75-79': 100,
    '80-84': 100,
    '85+': 100,
  });

  const LONGEST_WALKING_TIME_MINUTES = Object.freeze({
    1: 100 / (BASAL_FATIGUE_VELOCITY[1] * 60),
    2: 100 / (BASAL_FATIGUE_VELOCITY[2] * 60),
    3: 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    4: 100 / (BASAL_FATIGUE_VELOCITY[4] * 60),
    5: 100 / (BASAL_FATIGUE_VELOCITY[5] * 60),
    default: 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    '65-69': 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    '70-74': 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    '75-79': 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    '80-84': 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
    '85+': 100 / (BASAL_FATIGUE_VELOCITY[3] * 60),
  });

  const FACILITY_ROUTE_FATIGUE_MULTIPLIER = Object.freeze({
    stair: 1.20,
    escalator_up: 1.05,
    escalator_down: 0.95,
    elevator: 1.00,
    generic: 1.00,
  });

  const VITALITY_SHORT_REST_THRESHOLDS = Object.freeze({
    1: Object.freeze([30, 45, 60, 75, 85]),
    2: Object.freeze([45, 60, 75, 85]),
    3: Object.freeze([60, 75, 85]),
    4: Object.freeze([85]),
    5: Object.freeze([100]),
  });

  const REST_RULES = Object.freeze({
    shortRestSeconds: 2,
    slowWalkSpeedFactor: 0.5,
    sittingRecoveryPercentPerSecond: 0.333,
    standingRecoveryPercentPerSecond: 0.083,
    resumeFatiguePercent: 80,
    seatSearchThresholdPercent: 85,
    seatSearchTimeoutSeconds: 36,
    interruptionDensity: 3,
    openAreaDensityMax: 1,
    mediumAreaDensityMax: 3,
  });

  const BACKGROUND_AGENT_MIN_SPEED = 0.35;
  const BACKGROUND_QUEUE_JOIN_DISTANCE = 1.0;
  const BACKGROUND_NONQUEUE_TERMINAL_FINISH_DISTANCE = 1.35;
  const BACKGROUND_PLAYBACK_NONQUEUE_TERMINAL_CULL_DISTANCE = 0.18;
  const BACKGROUND_PLAYBACK_ORIGIN_CULL_DISTANCE = 0.18;
  const BACKGROUND_PLAYBACK_NODE_CLEARANCE_RADIUS = 0.96;
  const BACKGROUND_PLAYBACK_NODE_CLEARANCE_JITTER = 0.16;
  const BACKGROUND_QUEUE_SPACING = 0.9;
  const BACKGROUND_QUEUE_LATERAL_SPACING = 0.55;
  const BACKGROUND_QUEUE_PATCH_DEPTH_JITTER = 0.28;
  const BACKGROUND_QUEUE_PATCH_LATERAL_JITTER = 0.65;
  const BACKGROUND_QUEUE_MIN_CLEARANCE = 0.45;
  const BACKGROUND_PLATFORM_QUEUE_NEIGHBOR_REACH_FACTOR = 0.46;
  const PLATFORM_QUEUE_CLUSTER_CAPACITY = 6;
  const PLATFORM_QUEUE_GROUP_CAPACITY = 12;
  const PLATFORM_QUEUE_CLUSTER_FORWARD_NEAR = 0.72;
  const PLATFORM_QUEUE_CLUSTER_FORWARD_FAR = 2.15;
  const PLATFORM_QUEUE_CLUSTER_LATERAL_NEAR = 0.34;
  const PLATFORM_QUEUE_CLUSTER_LATERAL_FAR = 1.45;
  const PLATFORM_QUEUE_WALL_SPREAD_STEP = 0.96;
  const PLATFORM_QUEUE_WALL_FORWARD_STEP = 0.54;
  const BACKGROUND_FLOW_MAX_OFFSET = 2.2;
  const BACKGROUND_FLOW_SWAY_AMPLITUDE = 0.82;
  const BACKGROUND_FLOW_MIN_CLEARANCE = 0.45;
  const BACKGROUND_FLOW_ENDPOINT_RELIEF_RADIUS = 1.4;
  const ELEVATOR_QUEUE_BATCH_SIZE = 13;
  const ELEVATOR_IDLE_DEPARTURE_SECONDS = 2;
  const ELEVATOR_REOPEN_SECONDS = 40;
  const ELEVATOR_BOARDING_SECONDS = 1;
  const ESCALATOR_BOARDING_SECONDS = 1;
  const STAIR_BOARDING_SECONDS = 1;
  const PLATFORM_QUEUE_BATCH_SIZE = 15;
  const PLATFORM_BOARDING_SECONDS = 1;
  const PLATFORM_TRAIN_HEADWAY_SECONDS = 180;
  const BACKGROUND_LOCAL_DENSITY_RADIUS = 4;

  const GRID_CELL_SIZE = 1.15;
  const VISION_RADIUS = 15;
  const BASE_ENVIRONMENT_NOISE = 60;
  const BASE_ENVIRONMENT_LIGHTING = 250;
  const HEAT_RADIUS = 3;
  const HEAT_TRACE_FLOOR = 0.02;
  const HEAT_DECAY_SECONDS = 140;
  const CUMULATIVE_HEAT_MODE = 'cumulative-live';
  const MAX_TRACE_POINTS = 3200;
  const WALL_CLEARANCE_TARGET = 2.0;
  const ENDPOINT_RELIEF_RADIUS = 2.2;
  const AVOIDANCE_TARGET_DISTANCE = 2.0;
  const MIN_RESOLUTION_DISTANCE = 0.05;
  const DECISION_NODE_RADIUS = 2.6;
  const DECISION_INTERACTION_OFFSET_DISTANCE = 1.0;
  const DECISION_INTERACTION_MIN_CLEARANCE = 0.35;
  const DECISION_INTERACTION_MIN_SOURCE_DISTANCE = 0.55;
  const QUEUE_LOCK_RADIUS = 3;
  const AMBIENT_NOISE_STRESS_SCALE = 0.8;
  const AMBIENT_CROWD_STRESS_SCALE = 100;
  const PRESSURE_NORMALIZATION_MAX = 400;
  const PHYSICAL_FATIGUE_FACTORS = {
    default: 1,
  };

  const STRESS_RULE_LIBRARY = {
    customer_service_centre: {
      ruleId: 'customer_service_centre',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'fall Consultation', probability: 0.1, stressDelta: 300 },
        { state: 'Successful Consultation', probability: 0.1, stressDelta: -300 },
        { state: 'Not used', probability: 0.8, stressDelta: 0 },
      ],
    },
    ai_virtual_service_ambassador: {
      ruleId: 'ai_virtual_service_ambassador',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'fall Consultation', probability: 0.3, stressDelta: 200 },
        { state: 'Successful Consultation', probability: 0.2, stressDelta: -200 },
        { state: 'Not used', probability: 0.5, stressDelta: 0 },
      ],
    },
    lcd_brief: {
      ruleId: 'lcd_brief',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Brief information', probability: 0.3, stressDelta: -20 },
        { state: 'No effect', probability: 0.7, stressDelta: 0 },
      ],
    },
    common_direction_signs_brief: {
      ruleId: 'common_direction_signs_brief',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Brief information', probability: 0.3, stressDelta: -20 },
        { state: 'No effect', probability: 0.7, stressDelta: 0 },
      ],
    },
    panoramic_guide_map_detailed: {
      ruleId: 'panoramic_guide_map_detailed',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Detailed information', probability: 0.1, stressDelta: -40 },
        { state: 'No effect', probability: 0.9, stressDelta: 0 },
      ],
    },
    hanging_signs_brief: {
      ruleId: 'hanging_signs_brief',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Brief information', probability: 0.4, stressDelta: -20 },
        { state: 'No effect', probability: 0.6, stressDelta: 0 },
      ],
    },
    signage_confusing: {
      ruleId: 'signage_confusing',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Improper location', probability: 1, stressDelta: 50 },
      ],
    },
    signage_small_font: {
      ruleId: 'signage_small_font',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'The font is too small', probability: 1, stressDelta: 70 },
      ],
    },
    decision_conflict: {
      ruleId: 'decision_conflict',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Decision confusion', probability: 1, stressDelta: 50 },
      ],
    },
    advertisement_static: {
      ruleId: 'advertisement_static',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Static ads', probability: 0.3, stressDelta: 10 },
        { state: 'No effect', probability: 0.7, stressDelta: 0 },
      ],
    },
    advertisement_dynamic: {
      ruleId: 'advertisement_dynamic',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Dynamic/flashing ads', probability: 0.2, stressDelta: 40 },
        { state: 'No effect', probability: 0.8, stressDelta: 0 },
      ],
    },
    advertisement_psa: {
      ruleId: 'advertisement_psa',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'PSA/artwork', probability: 0.2, stressDelta: -30 },
        { state: 'No effect', probability: 0.8, stressDelta: 0 },
      ],
    },
    broadcast_clear: {
      ruleId: 'broadcast_clear',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Broadcast information clearly', probability: 1, stressDelta: -30 },
      ],
    },
    broadcast_blurry: {
      ruleId: 'broadcast_blurry',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Blurry', probability: 1, stressDelta: 40 },
      ],
    },
    broadcast_alarm: {
      ruleId: 'broadcast_alarm',
      triggerRadius: VISION_RADIUS,
      effectMode: 'persistent-event',
      outcomes: [
        { state: 'Emergency/Alarm Broadcasting', probability: 1, stressDelta: 100 },
      ],
    },
    ambient_noise: {
      ruleId: 'ambient_noise',
      triggerRadius: 6,
      ambientOnly: true,
      effectMode: 'ambient',
      outcomes: [],
    },
  };

  const UNIFIED_RULES = resolveUnifiedRules();
  const FIVE_DIMENSION_ORDER = Object.freeze(['locomotor', 'sensory', 'cognitive', 'psychological', 'vitality']);

  function resolveUnifiedRules() {
    if (typeof globalThis !== 'undefined' && globalThis.__UNIFIED_RULES__) {
      return globalThis.__UNIFIED_RULES__;
    }
    if (typeof require === 'function') {
      try {
        return require('../data/unified-rules.js');
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  function getDefaultCapacityScores() {
    return {
      locomotor: 3,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
      ...(UNIFIED_RULES?.scale?.defaultCapacityScores || {}),
    };
  }

  function normalizeCapacityKey(key) {
    const normalized = String(key || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    const aliases = {
      locomotor: 'locomotor',
      locomotorcapacity: 'locomotor',
      action: 'locomotor',
      movement: 'locomotor',
      mobility: 'locomotor',
      sensory: 'sensory',
      sensorycapacity: 'sensory',
      perception: 'sensory',
      perceptual: 'sensory',
      cognitive: 'cognitive',
      cognitivecapacity: 'cognitive',
      decision: 'cognitive',
      psychological: 'psychological',
      psychologicalcapacity: 'psychological',
      psych: 'psychological',
      vitality: 'vitality',
      fatigue: 'vitality',
      stamina: 'vitality',
      '行动能力': 'locomotor',
      '行动': 'locomotor',
      '感知能力': 'sensory',
      '感知': 'sensory',
      '认知能力': 'cognitive',
      '认知': 'cognitive',
      '心理能力': 'psychological',
      '心理': 'psychological',
      '活力能力': 'vitality',
      '活力': 'vitality',
    };
    return aliases[normalized] || null;
  }

  function clampCapacityScore(value, fallback = 3) {
    return clamp(Math.round(safeNumber(value, fallback)), 1, 5);
  }

  function getNearestMappedScore(value, mapping, fallback = 3) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return clampCapacityScore(fallback, 3);
    }
    let bestScore = clampCapacityScore(fallback, 3);
    let bestDistance = Number.POSITIVE_INFINITY;
    Object.entries(mapping || {}).forEach(([scoreKey, mappedValue]) => {
      const score = clampCapacityScore(scoreKey, fallback);
      const distanceToTarget = Math.abs(numeric - safeNumber(mappedValue, numeric));
      if (distanceToTarget < bestDistance) {
        bestDistance = distanceToTarget;
        bestScore = score;
      }
    });
    return bestScore;
  }

  function deriveLocomotorScoreFromProfile(profile) {
    const mobilityMode = normalizeRuleToken(profile?.mobilityMode || profile?.assistiveMode || profile?.movementMode);
    if (mobilityMode.includes('wheelchair')) {
      return 1;
    }
    const walkingSpeed = Number(profile?.walkingSpeed);
    if (!Number.isFinite(walkingSpeed)) {
      return 3;
    }
    if (walkingSpeed >= 1.0) return 5;
    if (walkingSpeed >= 0.8) return 4;
    if (walkingSpeed >= 0.6) return 3;
    if (walkingSpeed >= 0.5) return 2;
    return 1;
  }

  function deriveCognitiveScoreFromProfile(profile) {
    return getNearestMappedScore(profile?.decisionDelay, COGNITIVE_BASE_DECISION_DELAY, 3);
  }

  function deriveVitalityScoreFromProfile(profile) {
    const explicitBaseRate = Number(
      profile?.baseFatigueRatePercentPerSecond
      ?? profile?.fatigueRatePercentPerSecond
      ?? profile?.effectiveBasalFatigueVelocity
      ?? profile?.basalFatigueVelocity
    );
    if (Number.isFinite(explicitBaseRate) && explicitBaseRate > 0) {
      return getNearestMappedScore(explicitBaseRate, BASAL_FATIGUE_VELOCITY, 3);
    }
    const legacyFatigueRate = Number(profile?.fatigueRate);
    if (Number.isFinite(legacyFatigueRate)) {
      if (legacyFatigueRate <= 0.88) return 5;
      if (legacyFatigueRate <= 0.97) return 4;
      if (legacyFatigueRate <= 1.08) return 3;
      if (legacyFatigueRate <= 1.22) return 2;
      return 1;
    }
    return 3;
  }

  function enforceLocomotorVitalityConstraint(scores) {
    const locomotor = clampCapacityScore(scores?.locomotor, 3);
    const rawVitality = clampCapacityScore(scores?.vitality, 3);
    const vitality = locomotor === 1
      ? rawVitality
      : clamp(
          rawVitality,
          Math.max(1, locomotor - 1),
          Math.min(5, locomotor + 1)
        );
    return {
      ...(scores || {}),
      locomotor,
      vitality,
    };
  }

  function getBaseWalkingSpeedForScores(scores) {
    const locomotorScore = clampCapacityScore(scores?.locomotor, 3);
    return safeNumber(LOCOMOTOR_BASE_WALKING_SPEED[locomotorScore], LOCOMOTOR_BASE_WALKING_SPEED[3]);
  }

  function isWheelchairLocomotorProfile(profileOrScores) {
    return clampCapacityScore(
      profileOrScores?.capacityScores?.locomotor
      ?? profileOrScores?.locomotor,
      3
    ) === 1;
  }

  function getBaseDecisionDelayForScores(scores) {
    const cognitiveScore = clampCapacityScore(scores?.cognitive, 3);
    const sensoryScore = clampCapacityScore(scores?.sensory, 3);
    const psychologicalScore = clampCapacityScore(scores?.psychological, 3);
    return safeNumber(COGNITIVE_BASE_DECISION_DELAY[cognitiveScore], COGNITIVE_BASE_DECISION_DELAY[3])
      + safeNumber(SENSORY_DECISION_DELAY_OFFSET[sensoryScore], 0)
      + safeNumber(PSYCHOLOGICAL_DECISION_DELAY_OFFSET[psychologicalScore], 0);
  }

  function getBaseFatigueRatePercentPerSecond(vitalityScore) {
    return safeNumber(BASAL_FATIGUE_VELOCITY[clampCapacityScore(vitalityScore, 3)], BASAL_FATIGUE_VELOCITY[3]);
  }

  function getWheelchairBaseFatigueRatePercentPerSecond(vitalityScore) {
    return safeNumber(
      WHEELCHAIR_BASE_FATIGUE_VELOCITY[clampCapacityScore(vitalityScore, 3)],
      WHEELCHAIR_BASE_FATIGUE_VELOCITY[3]
    );
  }

  function getPerceptionRadiusForScores(scores) {
    const sensoryRules = UNIFIED_RULES?.dimensions?.sensory?.mechanisms || {};
    return safeNumber(
      sensoryRules.thresholds?.perceptionRadiusMeters?.[clampCapacityScore(scores?.sensory, 3)],
      VISION_RADIUS
    );
  }

  function getPerceptionRadiusForProfile(profile) {
    return getPerceptionRadiusForScores(profile?.capacityScores || profile);
  }

  function normalizeLocomotorFacilityMode(modeOrNode) {
    const rawMode = typeof modeOrNode === 'string'
      ? modeOrNode
      : modeOrNode?.facilityMode || modeOrNode?.semanticId || facilityModeForNode(modeOrNode);
    switch (rawMode) {
      case 'stair':
        return 'stair';
      case 'escalator_up':
      case 'escalator_down':
      case 'escalator':
        return 'escalator';
      case 'elevator':
        return 'elevator';
      case 'gate_in':
      case 'gate_out':
      case 'gate':
        return 'gate';
      case 'platform':
        return 'platform';
      default:
        return 'generic';
    }
  }

  function getLocomotorFacilityEligibility(scoresOrScore, modeOrNode, queueCount = 0) {
    const locomotorScore = clampCapacityScore(
      typeof scoresOrScore === 'number' ? scoresOrScore : scoresOrScore?.locomotor,
      3
    );
    const mode = normalizeLocomotorFacilityMode(modeOrNode);
    const queue = Math.max(0, safeNumber(queueCount, 0));
    let allowed = true;
    let reason = null;
    if (locomotorScore <= 2 && (mode === 'stair' || mode === 'escalator')) {
      allowed = false;
      reason = 'vertical_restriction';
    }
    if (locomotorScore <= 1 && mode === 'generic') {
      reason = reason || 'barrier_free_only';
    }
    return {
      allowed,
      mode,
      absolutePreferred: locomotorScore === 3 && mode === 'elevator' && queue < 10,
      requiresBarrierFree: locomotorScore === 1,
      reason,
    };
  }

  function getVitalityShortRestThresholds(vitalityScore) {
    return (VITALITY_SHORT_REST_THRESHOLDS[clampCapacityScore(vitalityScore, 3)] || VITALITY_SHORT_REST_THRESHOLDS[3]).slice();
  }

  function getVitalityFatigueRateComponents(scores) {
    const vitalityModifiers = UNIFIED_RULES?.crossModifiers?.vitality || {};
    return {
      sensory: safeNumber(vitalityModifiers.sensoryFatigueMultiplier?.[clampCapacityScore(scores?.sensory, 3)], 1),
      locomotor: safeNumber(vitalityModifiers.locomotorFatigueMultiplier?.[clampCapacityScore(scores?.locomotor, 3)], 1),
      psychological: safeNumber(vitalityModifiers.psychologicalFatigueMultiplier?.[clampCapacityScore(scores?.psychological, 3)], 1),
      cognitive: safeNumber(vitalityModifiers.cognitiveFatigueMultiplier?.[clampCapacityScore(scores?.cognitive, 3)], 1),
    };
  }

  function getVitalityFatigueRateMultiplier(scores) {
    const components = getVitalityFatigueRateComponents(scores);
    return components.sensory * components.locomotor * components.psychological * components.cognitive;
  }

  function getEffectiveFatigueRateMultiplier(scores) {
    const baseMultiplier = getVitalityFatigueRateMultiplier(scores);
    if (!isWheelchairLocomotorProfile(scores)) {
      return baseMultiplier;
    }
    return 1 + (baseMultiplier - 1) * WHEELCHAIR_FATIGUE_MULTIPLIER_DAMPING;
  }

  function dampWheelchairFatigueEnvironmentCoefficient(value, damping) {
    const coefficient = Math.max(0, safeNumber(value, 1));
    return 1 + (coefficient - 1) * damping;
  }

  function computeRealtimeFatigueDelta(profile, environment, dt) {
    const fatigueVelocity = getEffectiveBasalFatigueVelocity(profile);
    const fatigueRateMultiplier = getEffectiveFatigueRateMultiplier(profile?.capacityScores || {});
    const isWheelchair = isWheelchairLocomotorProfile(profile);
    const crowdFatigueCoefficient = safeNumber(environment?.crowdFatigueCoefficient, 1);
    const noiseFatigueCoefficient = isWheelchair
      ? dampWheelchairFatigueEnvironmentCoefficient(
          environment?.noiseFatigueCoefficient,
          WHEELCHAIR_FATIGUE_ENVIRONMENT_DAMPING.noise
        )
      : safeNumber(environment?.noiseFatigueCoefficient, 1);
    const lightingFatigueCoefficient = isWheelchair
      ? dampWheelchairFatigueEnvironmentCoefficient(
          environment?.lightingFatigueCoefficient,
          WHEELCHAIR_FATIGUE_ENVIRONMENT_DAMPING.lighting
        )
      : safeNumber(environment?.lightingFatigueCoefficient, 1);
    return dt
      * fatigueVelocity
      * fatigueRateMultiplier
      * crowdFatigueCoefficient
      * noiseFatigueCoefficient
      * lightingFatigueCoefficient;
  }

  function deriveProfileMetricsFromCapacityScores(scores) {
    const normalizedScores = enforceLocomotorVitalityConstraint(scores);
    const vitalityScore = clampCapacityScore(normalizedScores.vitality, 3);
    const isWheelchair = isWheelchairLocomotorProfile(normalizedScores);
    const baseFatigueRatePercentPerSecond = isWheelchair
      ? getWheelchairBaseFatigueRatePercentPerSecond(vitalityScore)
      : getBaseFatigueRatePercentPerSecond(vitalityScore);
    const fatigueThreshold = getFatigueThreshold(vitalityScore);
    const fatigueRateMultiplier = getEffectiveFatigueRateMultiplier(normalizedScores);
    return {
      walkingSpeed: Number(clamp(getBaseWalkingSpeedForScores(normalizedScores), 0.35, 1.45).toFixed(3)),
      decisionDelay: Number(clamp(getBaseDecisionDelayForScores(normalizedScores), 0.55, 1.36).toFixed(3)),
      baseFatigueRatePercentPerSecond: Number(baseFatigueRatePercentPerSecond.toFixed(3)),
      fatigueRate: Number(baseFatigueRatePercentPerSecond.toFixed(3)),
      basalFatigueVelocity: Number(baseFatigueRatePercentPerSecond.toFixed(3)),
      effectiveBasalFatigueVelocity: Number(baseFatigueRatePercentPerSecond.toFixed(3)),
      fatigueThreshold,
      longestWalkingTimeSeconds: Number((fatigueThreshold / Math.max(baseFatigueRatePercentPerSecond, 1e-6)).toFixed(3)),
      seatSearchThresholdPercent: safeNumber(REST_RULES.seatSearchThresholdPercent, 85),
      shortRestThresholdsPercent: isWheelchair ? [] : getVitalityShortRestThresholds(vitalityScore),
      shortRestSeconds: isWheelchair ? 0 : safeNumber(REST_RULES.shortRestSeconds, 2),
      sittingRecoveryPercentPerSecond: safeNumber(REST_RULES.sittingRecoveryPercentPerSecond, 0.333),
      standingRecoveryPercentPerSecond: safeNumber(REST_RULES.standingRecoveryPercentPerSecond, 0.083),
      fatigueRateMultiplier: Number(fatigueRateMultiplier.toFixed(3)),
      disableShortRest: isWheelchair,
      disableSeatRest: false,
    };
  }

  function normalizeCapacityScores(rawScores, profile) {
    const defaults = getDefaultCapacityScores();
    const next = {
      ...defaults,
      locomotor: deriveLocomotorScoreFromProfile(profile),
      cognitive: deriveCognitiveScoreFromProfile(profile),
      vitality: deriveVitalityScoreFromProfile(profile),
    };
    Object.entries(rawScores || {}).forEach(([key, value]) => {
      const normalizedKey = normalizeCapacityKey(key);
      if (normalizedKey) {
        next[normalizedKey] = clampCapacityScore(value, next[normalizedKey]);
      }
    });
    return enforceLocomotorVitalityConstraint(next);
  }

  function attachCapacityScoresToProfile(profile) {
    const capacityScores = normalizeCapacityScores(
      profile?.capacityScores || profile?.capacities || profile?.intrinsicCapacities,
      profile || {}
    );
    return {
      ...(profile || {}),
      capacityScores,
      ...deriveProfileMetricsFromCapacityScores(capacityScores),
    };
  }

  function getBaseCapacityVulnerability(score) {
    const normalized = clampCapacityScore(score, 3);
    const configured = UNIFIED_RULES?.scale?.vulnerabilityByScore || {};
    return safeNumber(configured[normalized], 1 + (3 - normalized) * 0.08);
  }

  function buildCapacityVulnerabilities(scores) {
    const result = {};
    FIVE_DIMENSION_ORDER.forEach((id) => {
      result[id] = Number(getBaseCapacityVulnerability(scores[id]).toFixed(3));
    });
    return result;
  }

  function getPsychologicalCompositeVulnerability(scores) {
    const base = getBaseCapacityVulnerability(scores.psychological);
    const modifiers = UNIFIED_RULES?.crossModifiers?.psychological || {};
    let sum = 0;
    ['sensory', 'cognitive', 'locomotor', 'vitality'].forEach((id) => {
      sum += safeNumber(modifiers[id]?.[clampCapacityScore(scores[id], 3)], 0);
    });
    return Number((base * (1 + sum)).toFixed(3));
  }

  function getSensoryCompositeVulnerability(scores) {
    return Number(getBaseCapacityVulnerability(scores.sensory).toFixed(3));
  }

  function getEffectiveCapacityVulnerabilities(scores) {
    const vulnerabilities = buildCapacityVulnerabilities(scores);
    vulnerabilities.sensory = getSensoryCompositeVulnerability(scores);
    vulnerabilities.locomotor = getLocomotorCompositeVulnerability(scores);
    vulnerabilities.cognitive = getCognitiveCompositeVulnerability(scores);
    vulnerabilities.psychological = getPsychologicalCompositeVulnerability(scores);
    return vulnerabilities;
  }

  function hasPsychologicalMechanismInputs(options) {
    if (!options) {
      return false;
    }
    return [
      'ambientNoiseStress',
      'ambientCrowdingStress',
      'ambientLightingStress',
      'ambientQueueStress',
      'persistentStress',
      'localVisibleStress',
      'continuousGuideCoverage',
      'mapSupport',
      'serviceSupport',
    ].some((key) => Object.prototype.hasOwnProperty.call(options, key));
  }

  function computePsychologicalBurdenState(options) {
    const profile = attachCapacityScoresToProfile(options?.profile || {});
    const capacityScores = normalizeCapacityScores(
      options?.capacityScores || profile.capacityScores,
      profile
    );
    const psychologicalRules = UNIFIED_RULES?.dimensions?.psychological?.mechanisms || {};
    const guidanceWeights = psychologicalRules.guidanceSupportWeights || {};
    const environmentalWeights = psychologicalRules.environmentalStressWeights || {};
    const arousalWeights = psychologicalRules.arousalWeights || {};
    const controlWeights = psychologicalRules.controlWeights || {};
    const recoveryBaseWeights = psychologicalRules.recoveryBaseWeights || {};
    const recoveryWeights = psychologicalRules.recoveryWeights || {};
    const finalWeights = psychologicalRules.finalWeights || {};
    const vulnerabilities = getEffectiveCapacityVulnerabilities(capacityScores);
    const vulnerability = safeNumber(options?.vulnerability, vulnerabilities.psychological);
    const pressureScore = Math.max(0, safeNumber(options?.pressureScore, 0));

    const noiseStress = clamp(Math.max(0, safeNumber(options?.ambientNoiseStress, 0)) / 100, 0, 1);
    const lightingStress = clamp(Math.max(0, safeNumber(options?.ambientLightingStress, 0)) / 100, 0, 1);
    const crowdStress = clamp(Math.max(0, safeNumber(options?.ambientCrowdingStress, 0)) / 100, 0, 1);
    const queueStress = clamp(Math.max(0, safeNumber(options?.ambientQueueStress, 0)) / 40, 0, 1);
    const eventStress = clamp(
      (
        Math.max(0, safeNumber(options?.persistentStress, 0))
        + Math.max(0, safeNumber(options?.localVisibleStress, 0))
      ) / 200,
      0,
      1
    );
    const guidanceSupport = clamp(
      safeNumber(guidanceWeights.continuousGuideCoverage, 0.65) * safeNumber(options?.continuousGuideCoverage, 0)
      + safeNumber(guidanceWeights.mapSupport, 0.20) * safeNumber(options?.mapSupport, 0)
      + safeNumber(guidanceWeights.serviceSupport, 0.15) * safeNumber(options?.serviceSupport, 0),
      0,
      1
    );
    const environmentalStress = clamp(
      safeNumber(environmentalWeights.noise, 0.14) * noiseStress
      + safeNumber(environmentalWeights.lighting, 0.14) * lightingStress
      + safeNumber(environmentalWeights.crowd, 0.26) * crowdStress
      + safeNumber(environmentalWeights.queue, 0.20) * queueStress
      + safeNumber(environmentalWeights.event, 0.26) * eventStress,
      0,
      1
    );
    const arousal = clamp(
      safeNumber(arousalWeights.environmentalStress, 0.34) * environmentalStress
      + safeNumber(arousalWeights.noise, 0.10) * noiseStress
      + safeNumber(arousalWeights.lighting, 0.12) * lightingStress
      + safeNumber(arousalWeights.crowd, 0.18) * crowdStress
      + safeNumber(arousalWeights.queue, 0.12) * queueStress
      + safeNumber(arousalWeights.event, 0.14) * eventStress,
      0,
      1
    );
    const control = clamp(
      safeNumber(controlWeights.base, 0.50)
      + safeNumber(controlWeights.guidanceSupport, 0.50) * guidanceSupport
      + safeNumber(controlWeights.crowd, -0.18) * crowdStress
      + safeNumber(controlWeights.queue, -0.20) * queueStress
      + safeNumber(controlWeights.noise, -0.08) * noiseStress
      + safeNumber(controlWeights.lighting, -0.06) * lightingStress
      + safeNumber(controlWeights.event, -0.14) * eventStress,
      0,
      1
    );
    const recoveryBase = clamp(
      safeNumber(recoveryBaseWeights.quietness, 0.24) * (1 - noiseStress)
      + safeNumber(recoveryBaseWeights.lightingComfort, 0.23) * (1 - lightingStress)
      + safeNumber(recoveryBaseWeights.lowCrowd, 0.29) * (1 - crowdStress)
      + safeNumber(recoveryBaseWeights.lowQueue, 0.24) * (1 - queueStress),
      0,
      1
    );
    const recovery = clamp(
      safeNumber(recoveryWeights.base, 0.50)
      + safeNumber(recoveryWeights.recoveryBase, 0.45) * recoveryBase
      + safeNumber(recoveryWeights.environmentalStress, -0.20) * environmentalStress
      + safeNumber(recoveryWeights.crowd, -0.12) * crowdStress
      + safeNumber(recoveryWeights.queue, -0.12) * queueStress
      + safeNumber(recoveryWeights.noise, -0.06) * noiseStress
      + safeNumber(recoveryWeights.lighting, -0.06) * lightingStress
      + safeNumber(recoveryWeights.event, -0.08) * eventStress,
      0,
      1
    );
    const raw = clamp(
      safeNumber(finalWeights.arousal, 0.50) * arousal
      + safeNumber(finalWeights.lossOfControl, 0.30) * (1 - control)
      + safeNumber(finalWeights.lossOfRecovery, 0.20) * (1 - recovery),
      0,
      1
    );
    const score = clamp(100 * vulnerability * raw, 0, 100);

    return {
      pressureScore: Number(pressureScore.toFixed(3)),
      vulnerability: Number(vulnerability.toFixed(3)),
      noiseStress: Number(noiseStress.toFixed(3)),
      lightingStress: Number(lightingStress.toFixed(3)),
      crowdStress: Number(crowdStress.toFixed(3)),
      queueStress: Number(queueStress.toFixed(3)),
      eventStress: Number(eventStress.toFixed(3)),
      guidanceSupport: Number(guidanceSupport.toFixed(3)),
      environmentalStress: Number(environmentalStress.toFixed(3)),
      arousal: Number(arousal.toFixed(3)),
      control: Number(control.toFixed(3)),
      recoveryBase: Number(recoveryBase.toFixed(3)),
      recovery: Number(recovery.toFixed(3)),
      raw: Number(raw.toFixed(3)),
      score: Number(score.toFixed(2)),
    };
  }

  function computePsychologicalBurdenScore(pressureScore, options) {
    const profile = attachCapacityScoresToProfile(options?.profile || {});
    const capacityScores = normalizeCapacityScores(
      options?.capacityScores || profile.capacityScores,
      profile
    );
    const vulnerabilities = getEffectiveCapacityVulnerabilities(capacityScores);
    const psychologicalRaw = Math.max(0, safeNumber(pressureScore, 0));
    if (hasPsychologicalMechanismInputs(options)) {
      return computePsychologicalBurdenState({
        ...(options || {}),
        profile,
        capacityScores,
        pressureScore: psychologicalRaw,
        vulnerability: vulnerabilities.psychological,
      }).score;
    }
    const psychologicalNormalizedLegacy = clamp(psychologicalRaw / PRESSURE_NORMALIZATION_MAX * 100, 0, 100);
    return clamp(psychologicalNormalizedLegacy * vulnerabilities.psychological, 0, 100);
  }

  function getCognitiveCompositeVulnerability(scores) {
    const base = getBaseCapacityVulnerability(scores.cognitive);
    const modifiers = UNIFIED_RULES?.crossModifiers?.cognitive || {};
    let sum = 0;
    ['sensory', 'psychological', 'locomotor', 'vitality'].forEach((id) => {
      sum += safeNumber(modifiers[id]?.[clampCapacityScore(scores[id], 3)], 0);
    });
    return Number((base * (1 + sum)).toFixed(3));
  }

  function getLocomotorCompositeVulnerability(scores) {
    const base = getBaseCapacityVulnerability(scores.locomotor);
    const modifiers = UNIFIED_RULES?.crossModifiers?.locomotor || {};
    let sum = 0;
    ['sensory', 'cognitive', 'psychological', 'vitality'].forEach((id) => {
      const modifierMap = modifiers[id] || LOCOMOTOR_CROSS_MODIFIERS[id] || {};
      sum += safeNumber(modifierMap?.[clampCapacityScore(scores[id], 3)], 0);
    });
    return Number((base * (1 + sum)).toFixed(3));
  }

  function getLocomotorSpeedFactor(kind, locomotorScore) {
    const normalizedScore = clampCapacityScore(locomotorScore, 3);
    if (normalizedScore === 1 && Number.isFinite(WHEELCHAIR_SPEED_FACTORS[kind])) {
      return WHEELCHAIR_SPEED_FACTORS[kind];
    }
    const table = LOCOMOTOR_SPEED_FACTORS[kind] || LOCOMOTOR_SPEED_FACTORS.reduced;
    return safeNumber(table[normalizedScore], 1);
  }

  function computeLocomotorMechanicsAtPoint(prepared, scenario, point, options) {
    const profile = attachCapacityScoresToProfile(
      options?.profile
      || options?.agent?.profile
      || scenario?.focusAgent?.profile
      || {}
    );
    const capacityScores = normalizeCapacityScores(profile.capacityScores, profile);
    const locomotorScore = clampCapacityScore(capacityScores.locomotor, 3);
    const isWheelchair = locomotorScore === 1;
    const vulnerability = getLocomotorCompositeVulnerability(capacityScores);
    const environment = options?.environment || evaluateEnvironmentAtPoint(prepared, scenario, point, options?.agent || null);
    const queueCount = Math.max(
      0,
      safeNumber(
        options?.queueCount,
        safeNumber(options?.agent?.queueCount, safeNumber(scenario?.focusAgent?.queueCount, 0))
      )
    );
    const nearbyNodes = options?.nearbyNodes || collectNodesWithinRadius(prepared, point, VISION_RADIUS);
    const nearestNode = nearbyNodes.length
      ? nearbyNodes.slice().sort((left, right) => left.distance - right.distance)[0]
      : null;
    const nodeType = normalizeLocomotorFacilityMode(nearestNode?.node || nearestNode?.semantic?.semanticId || nearestNode?.semanticId || null);
    const facilityEligibility = getLocomotorFacilityEligibility(capacityScores, nodeType, queueCount);
    const walkableCell = prepared?.grid ? findNearestWalkableCell(prepared.grid, point) : null;
    const wallDistance = Math.max(0, safeNumber(walkableCell?.wallDistance, WALL_CLEARANCE_TARGET));
    const walkingSpeed = Math.max(0.35, safeNumber(profile.walkingSpeed, getBaseWalkingSpeedForScores(capacityScores)));
    const speedPenaltyRatio = clamp((1.08 - walkingSpeed) / 0.55, 0, 1);
    const baseSpeedPenalty = isWheelchair ? 0 : speedPenaltyRatio * 0.18;
    const crowdDensity = Math.max(0, safeNumber(environment?.crowdDensityLocal, 0));
    const highDensityCrowdMultiplier = safeNumber(LOCOMOTOR_CROWD_MULTIPLIER[locomotorScore], 1);
    const crowdMultiplier = crowdDensity >= 3
      ? highDensityCrowdMultiplier
      : Number((1 + (highDensityCrowdMultiplier - 1) * clamp(crowdDensity / 3, 0, 1)).toFixed(3));
    const crowdResistance = clamp(crowdDensity / 3.2, 0, 1.4) * 0.18 * crowdMultiplier;
    const queueResistance = clamp(queueCount / 12, 0, 1.4) * (nodeType === 'elevator' ? 0.22 : 0.14);
    const verticalBasePenaltyMap = LOCOMOTOR_VERTICAL_PENALTY[nodeType] || LOCOMOTOR_VERTICAL_PENALTY.generic;
    const verticalEligible = nodeType === 'stair' || nodeType === 'escalator' || nodeType === 'elevator';
    const verticalProximity = nearestNode
      ? clamp(1 - safeNumber(nearestNode.distance, VISION_RADIUS) / LOCOMOTOR_VERTICAL_EFFECT_RADIUS, 0, 1)
      : 0;
    const verticalTransferResistance = verticalEligible
      ? safeNumber(verticalBasePenaltyMap[locomotorScore], 0.08) * verticalProximity
      : 0;
    const narrowMultiplier = safeNumber(LOCOMOTOR_NARROW_MULTIPLIER[locomotorScore], 1);
    const narrowRatio = clamp((2.4 - wallDistance) / 2.4, 0, 1);
    const narrowPassageResistance = narrowRatio * 0.12 * narrowMultiplier;
    const obstacleAvoidanceResistance = clamp((1.35 - wallDistance) / 1.35, 0, 1) * 0.08 * (crowdDensity >= 1.2 ? 1.15 : 1);
    const localFrictionSignal = clamp(
      Math.max(
        clamp(crowdDensity / 3, 0, 1),
        clamp(queueCount / 10, 0, 1),
        verticalProximity,
        narrowRatio,
        clamp((1.35 - wallDistance) / 1.35, 0, 1)
      ),
      0,
      1
    );
    const assistiveDeviceResistance = safeNumber(LOCOMOTOR_ASSISTIVE_RESISTANCE[locomotorScore], 0.12)
      * (LOCOMOTOR_ASSISTIVE_BASELINE + (1 - LOCOMOTOR_ASSISTIVE_BASELINE) * localFrictionSignal);
    const effectiveAssistiveResistance = isWheelchair
      ? Number((0.028 + localFrictionSignal * 0.058).toFixed(3))
      : assistiveDeviceResistance;
    const raw =
      0.06
      + baseSpeedPenalty
      + crowdResistance
      + queueResistance
      + narrowPassageResistance
      + verticalTransferResistance
      + effectiveAssistiveResistance
      + obstacleAvoidanceResistance;
    const microJam = crowdDensity > 3 && locomotorScore <= 3
      ? safeNumber(LOCOMOTOR_MICRO_JAM[locomotorScore], 0) * clamp((crowdDensity - 3) / 0.8, 0, 1)
      : 0;
    const score = clamp(raw * 100 * vulnerability + microJam, 0, 100);
    const rankedCauses = [
      ['crowd', crowdResistance + microJam / 100],
      ['vertical', verticalTransferResistance],
      ['queue', queueResistance],
      ['narrow', narrowPassageResistance],
      ['assistive', effectiveAssistiveResistance],
      ['obstacle', obstacleAvoidanceResistance],
      ['speed', baseSpeedPenalty],
    ].sort((left, right) => right[1] - left[1]);
    const movementMainCause = rankedCauses[0]?.[0] || 'speed';
    let behavior = 'normal_walk';
    let speedFactor = 1;
    if (score >= 80) {
      behavior = 'severely_blocked';
      speedFactor = getLocomotorSpeedFactor('severe', locomotorScore);
    } else if (score >= 65) {
      behavior = movementMainCause === 'queue' ? 'queue_blocked' : 'vertical_transfer_decision';
      speedFactor = movementMainCause === 'queue'
        ? getLocomotorSpeedFactor('queue', locomotorScore)
        : getLocomotorSpeedFactor('blocked', locomotorScore);
    } else if (score >= 45) {
      behavior = movementMainCause === 'narrow' || movementMainCause === 'obstacle'
        ? 'wall_follow'
        : 'crowd_blocked';
      speedFactor = getLocomotorSpeedFactor('blocked', locomotorScore);
    } else if (score >= 25) {
      behavior = 'slow_walk';
      speedFactor = getLocomotorSpeedFactor('reduced', locomotorScore);
    }
    const wallFollowStrength = locomotorScore <= 3 && (behavior === 'wall_follow' || behavior === 'crowd_blocked' || behavior === 'severely_blocked')
      ? Number((safeNumber(LOCOMOTOR_WALL_FOLLOW_STRENGTH[locomotorScore], 0) * Math.max(0.35, narrowRatio || 0.35)).toFixed(3))
      : 0;
    return {
      vulnerability: Number(vulnerability.toFixed(3)),
      speedPenaltyRatio: Number(speedPenaltyRatio.toFixed(3)),
      crowdMultiplier: Number(crowdMultiplier.toFixed(3)),
      baseSpeedPenalty: Number(baseSpeedPenalty.toFixed(3)),
      crowdResistance: Number(crowdResistance.toFixed(3)),
      queueResistance: Number(queueResistance.toFixed(3)),
      narrowPassageResistance: Number(narrowPassageResistance.toFixed(3)),
      verticalTransferResistance: Number(verticalTransferResistance.toFixed(3)),
      assistiveDeviceResistance: Number(effectiveAssistiveResistance.toFixed(3)),
      obstacleAvoidanceResistance: Number(obstacleAvoidanceResistance.toFixed(3)),
      microJam: Number(microJam.toFixed(3)),
      raw: Number(raw.toFixed(3)),
      score: Number(score.toFixed(2)),
      behavior,
      movementBehavior: behavior,
      speedFactor: Number(speedFactor.toFixed(3)),
      movementSpeedFactor: Number(speedFactor.toFixed(3)),
      movementMainCause,
      wallFollowStrength,
      nodeType,
      wallDistance: Number(wallDistance.toFixed(3)),
      facilityEligibility,
    };
  }

  function getSensoryFatigueMultiplier(scores) {
    return getVitalityFatigueRateComponents(scores).sensory;
  }

  function createDecisionGuideProfile(overrides) {
    const supportWeights = overrides?.supportWeights || {};
    const normalizedSupportWeights = {
      continuousGuide: safeNumber(supportWeights.continuousGuide, 0),
      map: safeNumber(supportWeights.map, 0),
      service: safeNumber(supportWeights.service, 0),
    };
    const primarySupport = normalizedSupportWeights.service >= normalizedSupportWeights.map
      && normalizedSupportWeights.service >= normalizedSupportWeights.continuousGuide
      ? 'service'
      : normalizedSupportWeights.map >= normalizedSupportWeights.continuousGuide
        ? 'map'
        : 'continuous-guide';
    return {
      guideType: overrides?.guideType || 'generic_guidance',
      targetKinds: Array.from(new Set((overrides?.targetKinds || ['generic']).filter(Boolean))),
      supportWeights: normalizedSupportWeights,
      supportWeight: safeNumber(overrides?.supportWeight, 0.35),
      reviewWeight: safeNumber(overrides?.reviewWeight, 0.18),
      distractorWeight: safeNumber(overrides?.distractorWeight, 1),
      primarySupport,
      detailLevel: overrides?.detailLevel || 'brief',
    };
  }

  function inferDecisionGuideTargetKinds(text) {
    const combined = normalizeRuleToken(text);
    const targetKinds = new Set();
    if (!combined) {
      return [];
    }
    if (includesAny(combined, ['exit types', 'exit type', ' exits ', ' exit ', 'exits', 'exit'])) {
      targetKinds.add('exit');
    }
    if (includesAny(combined, [
      'metro lines',
      'metro line',
      'line icon',
      'line direction',
      'terminus',
      'platform allocation',
      'real time arrival',
      'arrival countdown',
      'destination status',
      'destination & status',
      'transit mode',
      'platform',
    ])) {
      targetKinds.add('line');
    }
    if (includesAny(combined, ['platform allocation', 'real time arrival', 'arrival countdown', 'platform'])) {
      targetKinds.add('platform');
    }
    if (includesAny(combined, [
      'accessibility',
      'infrastructure',
      'elevator',
      'lift',
      'barrier free',
      'accessible',
      'toilet',
      'restroom',
    ])) {
      targetKinds.add('facility');
    }
    if (includesAny(combined, ['map', 'topology', 'poi'])) {
      targetKinds.add('map');
    }
    if (includesAny(combined, ['service', 'ambassador', 'help'])) {
      targetKinds.add('service');
    }
    if (includesAny(combined, ['brief information', 'brief'])) {
      targetKinds.add('generic');
    }
    return Array.from(targetKinds);
  }

  function classifyDecisionGuideFeature(nameOrItem, featureValue) {
    const item = typeof nameOrItem === 'object' && nameOrItem !== null
      ? nameOrItem
      : { name: nameOrItem, feature: featureValue };
    const normalizedName = normalizeRuleToken(item?.name || item?.id);
    const normalizedFeature = normalizeRuleToken(item?.feature || featureValue);
    const normalizedCategory = normalizeRuleToken(item?.category);
    const combined = `${normalizedName} ${normalizedFeature} ${normalizedCategory}`.trim();

    if (
      normalizedName.includes('customer service centre')
      || normalizedName.includes('customer service center')
      || normalizedName.includes('help line')
    ) {
      return createDecisionGuideProfile({
        guideType: 'service_guidance',
        targetKinds: ['exit', 'line', 'facility', 'service'],
        supportWeights: { service: 1 },
        supportWeight: 0.5,
        reviewWeight: 0.28,
        detailLevel: 'assisted',
      });
    }

    if (normalizedName.includes('ai virtual service ambassador')) {
      return createDecisionGuideProfile({
        guideType: 'service_guidance',
        targetKinds: ['exit', 'line', 'facility', 'service'],
        supportWeights: { service: 1 },
        supportWeight: 0.46,
        reviewWeight: 0.24,
        detailLevel: 'assisted',
      });
    }

    if (normalizedName.includes('panoramic guide map')) {
      return createDecisionGuideProfile({
        guideType: 'map_guidance',
        targetKinds: ['exit', 'line', 'facility', 'map'],
        supportWeights: { map: 1 },
        supportWeight: 0.62,
        reviewWeight: 0.56,
        detailLevel: 'detailed',
      });
    }

    if (
      normalizedName.includes('lcd')
      || includesAny(combined, ['platform allocation', 'real time arrival', 'arrival countdown', 'destination & status'])
    ) {
      return createDecisionGuideProfile({
        guideType: 'dynamic_platform_info',
        targetKinds: ['line', 'platform'],
        supportWeights: { map: 0.78, continuousGuide: 0.22 },
        supportWeight: 0.5,
        reviewWeight: 0.3,
        detailLevel: 'dynamic',
      });
    }

    const targetKinds = inferDecisionGuideTargetKinds(combined);
    const hasExit = targetKinds.includes('exit');
    const hasLine = targetKinds.includes('line') || targetKinds.includes('platform');
    const hasFacility = targetKinds.includes('facility');
    const isIntegrated = (
      (hasExit && hasLine)
      || (hasExit && hasFacility)
      || (hasLine && hasFacility)
      || includesAny(combined, ['multimodal cognitive assistance features', 'photographic cues'])
    );

    if (includesAny(combined, ['brief information'])) {
      return createDecisionGuideProfile({
        guideType: 'brief_information',
        targetKinds: ['generic'],
        supportWeights: { continuousGuide: 0.35 },
        supportWeight: 0.18,
        reviewWeight: 0.1,
        distractorWeight: 0.55,
        detailLevel: 'brief',
      });
    }

    if (normalizedName.includes('common direction signs') && isIntegrated) {
      return createDecisionGuideProfile({
        guideType: 'integrated_guidance',
        targetKinds: Array.from(new Set([...targetKinds, 'exit', 'line', 'facility'])),
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.58,
        reviewWeight: 0.42,
        detailLevel: 'integrated',
      });
    }

    if (isIntegrated) {
      return createDecisionGuideProfile({
        guideType: 'integrated_guidance',
        targetKinds: Array.from(new Set(targetKinds.concat(['exit', 'line']))),
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.55,
        reviewWeight: 0.4,
        detailLevel: 'integrated',
      });
    }

    if (hasExit) {
      return createDecisionGuideProfile({
        guideType: 'exit_guidance',
        targetKinds: ['exit'],
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.48,
        reviewWeight: 0.22,
        detailLevel: 'directional',
      });
    }

    if (hasLine && !includesAny(combined, ['direction', 'terminus', 'platform allocation', 'arrival'])) {
      return createDecisionGuideProfile({
        guideType: 'line_reference',
        targetKinds: ['line'],
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.3,
        reviewWeight: 0.16,
        detailLevel: 'reference',
      });
    }

    if (hasLine) {
      return createDecisionGuideProfile({
        guideType: 'line_guidance',
        targetKinds: ['line', 'platform'],
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.5,
        reviewWeight: 0.24,
        detailLevel: 'directional',
      });
    }

    if (hasFacility) {
      return createDecisionGuideProfile({
        guideType: 'accessibility_guidance',
        targetKinds: ['facility'],
        supportWeights: { continuousGuide: 0.8, service: 0.2 },
        supportWeight: 0.4,
        reviewWeight: 0.22,
        detailLevel: 'facility',
      });
    }

    if (
      normalizedName.includes('common direction signs')
      || (
        normalizedCategory.includes('signage')
        && !normalizedName.includes('hanging signs')
      )
    ) {
      return createDecisionGuideProfile({
        guideType: 'generic_guidance',
        targetKinds: targetKinds.length ? targetKinds : ['generic'],
        supportWeights: { continuousGuide: 1 },
        supportWeight: 0.32,
        reviewWeight: 0.18,
        detailLevel: 'generic',
      });
    }

    return null;
  }

  function inferDecisionTargetKinds(targetRegionId, selectedTargetNodeLabel, targetTokens) {
    const targetKinds = new Set();
    const combined = normalizeRuleToken([
      targetRegionId,
      selectedTargetNodeLabel,
      ...(Array.isArray(targetTokens) ? targetTokens : []),
    ].filter(Boolean).join(' '));

    if (!combined) {
      return [];
    }
    if (String(targetRegionId || '').startsWith('exit_') || includesAny(combined, ['exit', 'gate out'])) {
      targetKinds.add('exit');
    }
    if (
      includesAny(combined, [
        'twl',
        'tsuen wan',
        'kdt',
        'kennedy town',
        'chai wan',
        'platform',
        'train',
        'metro line',
        'line',
        'terminus',
      ])
    ) {
      targetKinds.add('line');
    }
    if (includesAny(combined, ['platform', 'arrival', 'departure', 'train'])) {
      targetKinds.add('platform');
    }
    if (includesAny(combined, ['elevator', 'lift', 'stair', 'escalator', 'accessibility', 'toilet', 'service'])) {
      targetKinds.add('facility');
    }
    return Array.from(targetKinds);
  }

  function evaluateDecisionGuideMatch(guideProfile, options) {
    const profile = guideProfile?.guideType
      ? guideProfile
      : classifyDecisionGuideFeature(options?.name || '', options?.feature || '');
    if (!profile) {
      return {
        targetKinds: [],
        relevanceScore: 0,
        matchKind: 'irrelevant',
        supportContribution: 0,
        reviewContribution: 0,
      };
    }

    const targetKinds = Array.isArray(options?.targetKinds) && options.targetKinds.length
      ? options.targetKinds.slice()
      : inferDecisionTargetKinds(options?.targetRegionId, options?.selectedTargetNodeLabel, options?.targetTokens);
    const guideKinds = (profile.targetKinds || []).filter((kind) => kind !== 'generic' && kind !== 'map' && kind !== 'service');
    const directMatch = guideKinds.some((kind) => (
      targetKinds.includes(kind)
      || (kind === 'line' && targetKinds.includes('platform'))
      || (kind === 'platform' && targetKinds.includes('line'))
    ));

    let relevanceScore = 0.35;
    let matchKind = 'generic';
    if (!targetKinds.length) {
      switch (profile.guideType) {
        case 'map_guidance':
          relevanceScore = 0.72;
          matchKind = 'context';
          break;
        case 'service_guidance':
          relevanceScore = 0.66;
          matchKind = 'service';
          break;
        case 'dynamic_platform_info':
          relevanceScore = 0.48;
          matchKind = 'partial';
          break;
        case 'brief_information':
          relevanceScore = 0.32;
          matchKind = 'generic';
          break;
        default:
          relevanceScore = 0.58;
          matchKind = 'generic';
          break;
      }
    } else if (directMatch) {
      matchKind = 'direct';
      switch (profile.guideType) {
        case 'integrated_guidance':
          relevanceScore = 0.92;
          break;
        case 'map_guidance':
          relevanceScore = 0.82;
          break;
        case 'service_guidance':
          relevanceScore = 0.74;
          break;
        case 'dynamic_platform_info':
          relevanceScore = targetKinds.includes('line') || targetKinds.includes('platform') ? 0.88 : 0.55;
          break;
        case 'line_reference':
          relevanceScore = 0.7;
          break;
        case 'brief_information':
          relevanceScore = 0.45;
          break;
        default:
          relevanceScore = 0.96;
          break;
      }
    } else {
      switch (profile.guideType) {
        case 'map_guidance':
          relevanceScore = 0.68;
          matchKind = 'context';
          break;
        case 'service_guidance':
          relevanceScore = 0.62;
          matchKind = 'context';
          break;
        case 'brief_information':
          relevanceScore = 0.26;
          matchKind = 'generic';
          break;
        case 'dynamic_platform_info':
          relevanceScore = 0.18;
          matchKind = 'partial';
          break;
        case 'accessibility_guidance':
          relevanceScore = 0.18;
          matchKind = 'partial';
          break;
        default:
          relevanceScore = 0.12;
          matchKind = 'irrelevant';
          break;
      }
    }

    const supportContribution = clamp(profile.supportWeight * relevanceScore, 0, 1);
    const reviewContribution = clamp(profile.reviewWeight * relevanceScore, 0, 1);
    return {
      targetKinds,
      relevanceScore: Number(clamp(relevanceScore, 0, 1).toFixed(3)),
      matchKind,
      supportContribution: Number(supportContribution.toFixed(3)),
      reviewContribution: Number(reviewContribution.toFixed(3)),
    };
  }

  function classifyPressureObjectSemantic(item) {
    const normalizedName = normalizeRuleToken(item?.name || item?.id);
    const normalizedFeature = normalizeRuleToken(item?.feature);
    const normalizedCategory = normalizeRuleToken(item?.category);
    const combined = `${normalizedName} ${normalizedFeature} ${normalizedCategory}`.trim();

    if (combined.includes('hanging signs') && includesAny(combined, ['small font', 'font is too small', 'too small'])) {
      return { semanticId: 'small_font_signage', decisionRole: 'problem-sign', decisionSupport: 'continuous-guide', sensoryRole: 'guide' };
    }
    if (combined.includes('hanging signs')) {
      return { semanticId: 'hanging_signs', decisionRole: 'distractor', decisionSupport: 'continuous-guide', sensoryRole: 'guide', distractorWeight: 1 };
    }
    if (combined.includes('ground atm signage')) {
      return { semanticId: 'ground_atm_signage', decisionRole: 'distractor', decisionSupport: 'continuous-guide', sensoryRole: 'guide', distractorWeight: 1 };
    }
    if (combined.includes('end point of tactile paving')) {
      return { semanticId: 'tactile_paving_endpoint', decisionRole: 'distractor', decisionSupport: 'node-cue', sensoryRole: 'node-cue', distractorWeight: 1 };
    }
    if (combined.includes('common direction signs') && includesAny(combined, ['confuse', 'confusion', 'improper', 'wrong place'])) {
      return { semanticId: 'confusing_signage', decisionRole: 'problem-sign', decisionSupport: 'continuous-guide', sensoryRole: 'guide' };
    }
    if (combined.includes('decision conflict')) {
      return { semanticId: 'decision_conflict', decisionRole: 'problem-sign', decisionSupport: 'node-cue', sensoryRole: 'node-cue' };
    }

    const guideProfile = classifyDecisionGuideFeature(item);
    if (guideProfile) {
      return {
        semanticId: guideProfile.guideType,
        decisionRole: guideProfile.guideType === 'service_guidance' ? 'service' : 'guide',
        decisionSupport: guideProfile.primarySupport,
        sensoryRole: guideProfile.guideType === 'service_guidance' ? 'service' : 'guide',
        guideType: guideProfile.guideType,
        guideProfile,
      };
    }
    if (combined.includes('common direction signs')) {
      if (includesAny(combined, ['confuse', 'confusion', 'improper', 'wrong place'])) {
        return { semanticId: 'confusing_signage', decisionRole: 'problem-sign', decisionSupport: 'continuous-guide', sensoryRole: 'guide' };
      }
      return { semanticId: 'common_direction_signs', decisionRole: 'guide', decisionSupport: 'continuous-guide', sensoryRole: 'guide' };
    }
    if (combined.includes('ground atm signage')) {
      return { semanticId: 'confusing_signage', decisionRole: 'problem-sign', decisionSupport: 'continuous-guide', sensoryRole: 'guide' };
    }
    if (combined.includes('panoramic guide map')) {
      return { semanticId: 'panoramic_guide_map', decisionRole: 'guide', decisionSupport: 'map', sensoryRole: 'guide' };
    }
    if (normalizedName.includes('lcd') || normalizedFeature.includes('train arrival')) {
      return { semanticId: 'lcd', decisionRole: 'guide', decisionSupport: 'map', sensoryRole: 'guide' };
    }
    if (
      normalizedName.includes('customer service centre')
      || normalizedName.includes('customer service center')
      || normalizedName.includes('help line')
    ) {
      return { semanticId: 'customer_service_centre', decisionRole: 'guide', decisionSupport: 'service', sensoryRole: 'service' };
    }
    if (normalizedName.includes('ai virtual service ambassador')) {
      return { semanticId: 'ai_virtual_service_ambassador', decisionRole: 'guide', decisionSupport: 'service', sensoryRole: 'service' };
    }
    if (combined.includes('broadcast')) {
      if (includesAny(combined, ['alarm', 'emergency', 'blur', 'blurry', 'unclear'])) {
        return { semanticId: 'broadcast_interference', decisionRole: 'distractor', decisionSupport: 'broadcast', sensoryRole: 'distractor' };
      }
      return { semanticId: 'broadcast_guidance', decisionRole: 'guide', decisionSupport: 'service', sensoryRole: 'guide' };
    }
    if (combined.includes('end point of tactile paving') || combined.includes('decision conflict')) {
      return { semanticId: 'decision_conflict', decisionRole: 'problem-sign', decisionSupport: 'node-cue', sensoryRole: 'node-cue' };
    }
    if (normalizedCategory.includes('advert')) {
      if (
        combined.includes('dynamic')
        || combined.includes('flashing')
        || combined.includes('1060lux')
        || combined.includes('540lux')
      ) {
        return { semanticId: 'flashing_ads', decisionRole: 'distractor', decisionSupport: 'distractor', sensoryRole: 'distractor' };
      }
      return { semanticId: 'static_ads', decisionRole: 'distractor', decisionSupport: 'distractor', sensoryRole: 'distractor' };
    }
    if (normalizedCategory.includes('noise') || combined.includes('decibel') || combined.includes('noisy')) {
      return { semanticId: 'noise', decisionRole: 'environment', decisionSupport: 'environment', sensoryRole: 'noise-source' };
    }
    if (normalizedCategory.includes('facility')) {
      return { semanticId: 'service_facility', decisionRole: 'service', decisionSupport: 'service', sensoryRole: 'service' };
    }
    return { semanticId: 'unknown', decisionRole: 'neutral', decisionSupport: 'neutral', sensoryRole: 'neutral' };
  }

  function classifyNodeSemantic(node) {
    const facilityMode = facilityModeForNode(node);
    switch (facilityMode) {
      case 'gate_in':
      case 'gate_out':
        return { semanticId: 'gate', facilityMode };
      case 'escalator_up':
      case 'escalator_down':
        return { semanticId: 'escalator', facilityMode };
      case 'stair':
        return { semanticId: 'stair', facilityMode };
      case 'elevator':
        return { semanticId: 'elevator', facilityMode };
      case 'platform':
        return { semanticId: 'platform', facilityMode };
      default:
        return { semanticId: 'generic', facilityMode };
    }
  }

  function collectPressureObjectsWithinRadius(prepared, point, radiusMeters) {
    return prepared.activePressureObjects
      .map((item) => ({
        item,
        distance: distance(point, item),
        semantic: classifyPressureObjectSemantic(item),
      }))
      .filter(({ distance: currentDistance }) => currentDistance <= radiusMeters);
  }

  function collectNodesWithinRadius(prepared, point, radiusMeters) {
    return prepared.nodes
      .map((node) => ({
        node,
        distance: distance(point, node),
        semantic: classifyNodeSemantic(node),
      }))
      .filter(({ distance: currentDistance }) => currentDistance <= radiusMeters);
  }

  function collectSeatsWithinRadius(prepared, point, radiusMeters) {
    return prepared.seats
      .map((seat) => ({
        seat,
        distance: distance(point, seat),
      }))
      .filter(({ distance: currentDistance }) => currentDistance <= radiusMeters);
  }

  function computeRecognitionConfidence(currentDistance, perceptionRadius, recognitionRate) {
    const radius = Math.max(0.5, safeNumber(perceptionRadius, VISION_RADIUS));
    const rate = clamp(safeNumber(recognitionRate, 1), 0, 1);
    if (currentDistance <= radius) {
      return rate;
    }
    return 0;
  }

  function getRecognitionSampleUnit(agent, scenario, objectKey, sampler) {
    if (typeof sampler === 'function') {
      return clamp(safeNumber(sampler({ agent, scenario, objectKey }), 0), 0, 0.999999);
    }
    if (agent) {
      agent.sensoryRecognitionSamples = agent.sensoryRecognitionSamples || {};
      if (!Number.isFinite(agent.sensoryRecognitionSamples[objectKey])) {
        const fallbackSample = ((stableHash(`${agent.id || 'agent'}:${objectKey}`) % 1000000) + 0.5) / 1000000;
        agent.sensoryRecognitionSamples[objectKey] = typeof scenario?.rng?.next === 'function'
          ? clamp(safeNumber(scenario.rng.next(), fallbackSample), 0, 0.999999)
          : fallbackSample;
      }
      return clamp(safeNumber(agent.sensoryRecognitionSamples[objectKey], 0), 0, 0.999999);
    }
    return clamp((((stableHash(String(objectKey)) % 1000000) + 0.5) / 1000000), 0, 0.999999);
  }

  function isRecognizedObject(confidence, sampleUnit) {
    const probability = clamp(safeNumber(confidence, 0), 0, 1);
    return probability > 0 && clamp(safeNumber(sampleUnit, 1), 0, 0.999999) < probability;
  }

  function resolveSensoryRelevantObjectWeight(semantic, item, sensoryRules) {
    const weights = sensoryRules?.relevantObjectWeights || {};
    const semanticId = semantic?.semanticId || null;
    const sensoryRole = semantic?.sensoryRole || null;
    const decisionRole = semantic?.decisionRole || null;
    const guideType = semantic?.guideType
      || semantic?.guideProfile?.guideType
      || classifyDecisionGuideFeature(item)?.guideType
      || semanticId;

    if (semanticId === 'seat') {
      return safeNumber(weights.seat, 0.1);
    }
    if (
      semanticId === 'broadcast_guidance'
      || semanticId === 'tactile_paving_endpoint'
      || decisionRole === 'distractor'
      || decisionRole === 'problem-sign'
    ) {
      return 0;
    }
    if (sensoryRole === 'service') {
      return safeNumber(weights.service, 0.09);
    }
    if (sensoryRole === 'node-cue') {
      return safeNumber(weights.node, 0.12);
    }

    switch (guideType) {
      case 'exit_guidance':
        return safeNumber(weights.exit, 0.16);
      case 'integrated_guidance':
      case 'accessibility_guidance':
        return safeNumber(weights.integrated, 0.16);
      case 'line_guidance':
      case 'line_reference':
        return safeNumber(weights.line, 0.14);
      case 'map_guidance':
        return safeNumber(weights.map, 0.13);
      case 'dynamic_platform_info':
        return safeNumber(weights.lcd, 0.12);
      case 'service_guidance':
        return safeNumber(weights.service, 0.09);
      case 'brief_information':
      case 'generic_guidance':
        return safeNumber(weights.guide, safeNumber(weights.line, 0.14));
      default:
        break;
    }

    if (semanticId === 'panoramic_guide_map') {
      return safeNumber(weights.map, 0.13);
    }
    if (semanticId === 'lcd') {
      return safeNumber(weights.lcd, 0.12);
    }
    if (
      semanticId === 'customer_service_centre'
      || semanticId === 'ai_virtual_service_ambassador'
      || semanticId === 'service_facility'
    ) {
      return safeNumber(weights.service, 0.09);
    }
    if (sensoryRole === 'guide') {
      return safeNumber(weights.guide, safeNumber(weights.line, 0.14));
    }
    return 0;
  }

  function computeLightingComfortPenalty(lightingLevel, comfortRange) {
    const minimum = safeNumber(comfortRange?.min, 0);
    const maximum = safeNumber(comfortRange?.max, 9999);
    if (lightingLevel < minimum) {
      return clamp((minimum - lightingLevel) / Math.max(80, minimum || 80), 0, 1);
    }
    if (lightingLevel > maximum) {
      return clamp((lightingLevel - maximum) / Math.max(200, maximum * 0.5 || 200), 0, 1);
    }
    return 0;
  }

  function computeSensoryBurdenState(options) {
    const profile = attachCapacityScoresToProfile(options?.profile || {});
    const capacityScores = normalizeCapacityScores(
      options?.capacityScores || profile.capacityScores,
      profile
    );
    const sensoryRules = UNIFIED_RULES?.dimensions?.sensory?.mechanisms || {};
    const vulnerability = clamp(
      safeNumber(options?.vulnerability, getSensoryCompositeVulnerability(capacityScores)),
      0.7,
      1.6
    );
    const sensoryScore = clampCapacityScore(capacityScores.sensory, 3);
    const noiseThreshold = safeNumber(
      sensoryRules.thresholds?.noiseSensitiveAboveDb?.[sensoryScore],
      999
    );
    const lightingSensitive = sensoryRules.thresholds?.lightingSensitiveLux?.[sensoryScore] || { min: 0, max: 9999 };
    const lightingComfort = sensoryRules.thresholds?.lightingComfortLux?.[sensoryScore] || { min: 0, max: 9999 };
    const recognizedObjectCount = Math.max(0, safeNumber(options?.recognizedObjectCount, 0));
    const noisePenalty = noiseThreshold >= 999
      ? 0
      : clamp((safeNumber(options?.noiseDb, BASE_ENVIRONMENT_NOISE) - noiseThreshold) / 25, 0, 1)
        * safeNumber(sensoryRules.burdenWeights?.noise, 0.22);
    const lightingPenalty =
      computeLightingComfortPenalty(
        safeNumber(options?.lux, BASE_ENVIRONMENT_LIGHTING),
        lightingComfort
      ) * safeNumber(sensoryRules.burdenWeights?.lighting, 0.18);
    const occlusionPenalty =
      clamp(getUnifiedCrowdDensity(options, 0) / 5, 0, 1)
      * safeNumber(sensoryRules.burdenWeights?.occlusion, 0.16);
    const visualClutterBase = clamp(
      0.40 * clamp(safeNumber(options?.flashingAds, 0) / 2, 0, 1)
      + 0.25 * clamp(safeNumber(options?.staticAds, 0) / 3, 0, 1)
      + 0.20 * clamp(safeNumber(options?.irrelevantSigns, 0) / 3, 0, 1)
      + 0.15 * clamp(safeNumber(options?.hangingSignsInterference, 0) / 3, 0, 1),
      0,
      1
    );
    const visualClutterPenalty = visualClutterBase * 0.12;
    const supportBase = clamp(
      0.50 * safeNumber(options?.continuousGuideCoverage, 0)
      + 0.25 * safeNumber(options?.tactilePavingSupport, 0)
      + 0.15 * safeNumber(options?.audibleCueSupport, 0)
      + 0.10 * safeNumber(options?.nearbyServiceSupport, 0),
      0,
      1
    );
    const supportRelief = supportBase * 0.18;
    const rawObjectLoad = Math.max(0, safeNumber(options?.objectLoad, 0));
    const objectLoad = rawObjectLoad;
    const raw = Math.max(
      0,
      objectLoad
      + noisePenalty
      + lightingPenalty
      + occlusionPenalty
      + visualClutterPenalty
      - supportRelief
    );
    const score = clamp(raw * 100 * vulnerability, 0, 100);
    const sensitiveNoise = recognizedObjectCount > 0 && noiseThreshold < 999 && safeNumber(options?.noiseDb, BASE_ENVIRONMENT_NOISE) > noiseThreshold;
    const currentLux = safeNumber(options?.lux, BASE_ENVIRONMENT_LIGHTING);
    const sensitiveLight = recognizedObjectCount > 0
      && (currentLux < safeNumber(lightingSensitive.min, 0) || currentLux > safeNumber(lightingSensitive.max, 9999));
    return {
      vulnerability: Number(vulnerability.toFixed(3)),
      objectLoad: Number(objectLoad.toFixed(3)),
      objectLoadRaw: Number(rawObjectLoad.toFixed(3)),
      noisePenalty: Number(noisePenalty.toFixed(3)),
      lightingPenalty: Number(lightingPenalty.toFixed(3)),
      occlusionPenalty: Number(occlusionPenalty.toFixed(3)),
      visualClutterPenalty: Number(visualClutterPenalty.toFixed(3)),
      supportRelief: Number(supportRelief.toFixed(3)),
      noiseThresholdDb: noiseThreshold,
      lightingComfortLux: {
        min: safeNumber(lightingComfort.min, 0),
        max: safeNumber(lightingComfort.max, 9999),
      },
      lightingSensitiveLux: {
        min: safeNumber(lightingSensitive.min, 0),
        max: safeNumber(lightingSensitive.max, 9999),
      },
      sensitiveNoise,
      sensitiveLight,
      raw: Number(raw.toFixed(3)),
      score: Number(score.toFixed(2)),
    };
  }

  function computeDecisionEnvironmentPenalty(environment) {
    const config = UNIFIED_RULES?.dimensions?.cognitive?.mechanisms?.environmentPenalty || {};
    const crowdPenalty = clamp(getUnifiedCrowdDensity(environment, 0) / 5, 0, 1) * safeNumber(config.crowdDensity, 0.28);
    const noisePenalty = clamp((safeNumber(environment?.noiseLevel, BASE_ENVIRONMENT_NOISE) - 60) / 25, 0, 1) * safeNumber(config.noise, 0.18);
    const lightingLevel = safeNumber(environment?.lightingLevel, BASE_ENVIRONMENT_LIGHTING);
    let lightingRatio = 0;
    if (lightingLevel < 200) {
      lightingRatio = clamp((200 - lightingLevel) / 200, 0, 1);
    } else if (lightingLevel > 1000) {
      lightingRatio = clamp((lightingLevel - 1000) / 600, 0, 1);
    } else if (lightingLevel > 500) {
      lightingRatio = clamp((lightingLevel - 500) / 500, 0, 1) * 0.5;
    }
    const lightingPenalty = lightingRatio * safeNumber(config.lighting, 0.14);
    return {
      crowdPenalty,
      noisePenalty,
      lightingPenalty,
      total: crowdPenalty + noisePenalty + lightingPenalty,
    };
  }

  function getDecisionMechanismConfig() {
    return UNIFIED_RULES?.dimensions?.cognitive?.mechanisms?.decisionModel || {};
  }

  function getDecisionBaseStateMap(key, fallback) {
    return getDecisionMechanismConfig()?.[key] || fallback;
  }

  function expandDecisionTokens(value) {
    const normalized = normalizeRuleToken(value);
    if (!normalized) {
      return [];
    }
    const parts = normalized.split(' ').filter((item) => item.length >= 2);
    const tokens = new Set([normalized]);
    for (let index = 0; index < parts.length - 1; index += 1) {
      tokens.add(`${parts[index]} ${parts[index + 1]}`);
    }
    return Array.from(tokens).filter((item) => item.length >= 3);
  }

  function getDecisionTargetTokens(targetRegionId, selectedTargetNodeLabel) {
    const tokenSet = new Set();
    const regionTokens = {
      exit_a: ['exit a', 'a exit'],
      exit_b: ['exit b', 'b exit'],
      exit_c: ['exit c', 'c exit'],
      exit_d: ['exit d', 'd exit'],
      chai_wan: ['chai wan'],
      twl: ['tsuen wan', 'twl'],
      kdt: ['kennedy town', 'kdt'],
    };
    (regionTokens[targetRegionId] || []).forEach((token) => tokenSet.add(token));
    expandDecisionTokens(selectedTargetNodeLabel).forEach((token) => tokenSet.add(token));
    return Array.from(tokenSet);
  }

  function isLevelChangeFacilityMode(facilityMode) {
    return ['escalator_up', 'escalator_down', 'stair', 'elevator'].includes(facilityMode);
  }

  function isDecisionGuideRelevant(item, semantic, targetTokens, options) {
    if (!semantic) {
      return false;
    }
    if (semantic.decisionSupport === 'service') {
      return true;
    }
    const guideProfile = semantic.guideProfile || classifyDecisionGuideFeature(item);
    const evaluation = evaluateDecisionGuideMatch(guideProfile, {
      targetTokens,
      targetRegionId: options?.targetRegionId,
      selectedTargetNodeLabel: options?.selectedTargetNodeLabel,
      targetKinds: options?.targetKinds,
    });
    return evaluation.relevanceScore >= 0.55;
  }

  function deriveDecisionSceneInputs(prepared, scenario, point, options) {
    const agent = options?.agent || null;
    const pressureObjects = options?.pressureObjects || collectPressureObjectsWithinRadius(prepared, point, VISION_RADIUS);
    const nearbyNodes = options?.nearbyNodes || collectNodesWithinRadius(prepared, point, VISION_RADIUS);
    const targetRegionId = options?.targetRegionId || scenario?.focusTargetRegionId || scenario?.focusTargetRegion?.id || null;
    const selectedTargetNodeId = options?.selectedTargetNodeId || agent?.selectedTargetNodeId || scenario?.focusAgent?.selectedTargetNodeId || null;
    const selectedTargetNode = selectedTargetNodeId ? prepared.nodeById?.[selectedTargetNodeId] || null : null;
    const selectedTargetNodeLabel = options?.selectedTargetNodeLabel
      || agent?.selectedTargetNodeLabel
      || selectedTargetNode?.displayLabelEn
      || selectedTargetNode?.displayLabel
      || selectedTargetNode?.id
      || null;
    const targetTokens = getDecisionTargetTokens(targetRegionId, selectedTargetNodeLabel);
    const targetKinds = inferDecisionTargetKinds(targetRegionId, selectedTargetNodeLabel, targetTokens);
    let flashingAdCount = 0;
    let staticAdCount = 0;
    let irrelevantSignCount = 0;
    let broadcastInterference = 0;
    let problemSignCount = 0;
    let relevantGuideCount = 0;
    let continuousGuideSignal = 0;
    let mapSupportSignal = 0;
    let serviceSupportSignal = 0;
    let guideReviewSignal = 0;
    const consideredObjects = [];

    pressureObjects.forEach(({ item, distance: currentDistance, semantic }) => {
      const proximity = clamp(1 - currentDistance / VISION_RADIUS, 0, 1);
      const label = item.name || item.id;
      if (semantic.semanticId === 'flashing_ads') {
        flashingAdCount += 1;
        consideredObjects.push({ id: item.id, name: label, semanticId: semantic.semanticId, direction: 'load', value: Number(proximity.toFixed(3)) });
        return;
      }
      if (semantic.semanticId === 'static_ads') {
        staticAdCount += 1;
        consideredObjects.push({ id: item.id, name: label, semanticId: semantic.semanticId, direction: 'load', value: Number(proximity.toFixed(3)) });
        return;
      }
      if (semantic.semanticId === 'broadcast_interference') {
        broadcastInterference += 1;
        consideredObjects.push({ id: item.id, name: label, semanticId: semantic.semanticId, direction: 'load', value: Number(proximity.toFixed(3)) });
        return;
      }
      if (semantic.decisionRole === 'distractor') {
        irrelevantSignCount += safeNumber(semantic.distractorWeight, 1);
        consideredObjects.push({
          id: item.id,
          name: label,
          semanticId: semantic.semanticId,
          direction: 'load',
          relevance: 'distractor',
          value: Number(proximity.toFixed(3)),
        });
        return;
      }
      if (semantic.decisionRole === 'problem-sign') {
        problemSignCount += 1;
        consideredObjects.push({ id: item.id, name: label, semanticId: semantic.semanticId, direction: 'load', value: Number(proximity.toFixed(3)) });
        return;
      }
      if (semantic.decisionRole === 'guide' || semantic.decisionRole === 'service') {
        const guideProfile = semantic.guideProfile || classifyDecisionGuideFeature(item);
        const evaluation = evaluateDecisionGuideMatch(guideProfile, {
          targetTokens,
          targetKinds,
          targetRegionId,
          selectedTargetNodeLabel,
        });
        if (evaluation.relevanceScore < 0.28 && semantic.decisionSupport !== 'service') {
          irrelevantSignCount += safeNumber(guideProfile?.distractorWeight, 1);
          consideredObjects.push({
            id: item.id,
            name: label,
            semanticId: semantic.semanticId,
            guideType: guideProfile?.guideType || semantic.semanticId,
            direction: 'load',
            relevance: 'irrelevant',
            relevanceScore: evaluation.relevanceScore,
            value: Number(proximity.toFixed(3)),
          });
          return;
        }
        if (evaluation.relevanceScore < 0.55 && semantic.decisionSupport !== 'service') {
          irrelevantSignCount += (0.55 - evaluation.relevanceScore) * safeNumber(guideProfile?.distractorWeight, 1);
        }
        relevantGuideCount += evaluation.relevanceScore;
        const supportSignal = proximity * safeNumber(evaluation.supportContribution, 0);
        continuousGuideSignal += supportSignal * safeNumber(guideProfile?.supportWeights?.continuousGuide, semantic.decisionSupport === 'continuous-guide' ? 1 : 0);
        mapSupportSignal += supportSignal * safeNumber(guideProfile?.supportWeights?.map, semantic.decisionSupport === 'map' ? 1 : 0);
        serviceSupportSignal += supportSignal * safeNumber(guideProfile?.supportWeights?.service, semantic.decisionSupport === 'service' ? 1 : 0);
        guideReviewSignal += proximity * safeNumber(evaluation.reviewContribution, 0);
        consideredObjects.push({
          id: item.id,
          name: label,
          semanticId: semantic.semanticId,
          guideType: guideProfile?.guideType || semantic.semanticId,
          direction: 'support',
          relevance: evaluation.matchKind,
          relevanceScore: evaluation.relevanceScore,
          supportValue: Number(supportSignal.toFixed(3)),
          reviewValue: Number((proximity * safeNumber(evaluation.reviewContribution, 0)).toFixed(3)),
          value: Number(proximity.toFixed(3)),
        });
        return;
      }
      if (semantic.decisionRole === 'neutral' && normalizeRuleToken(item?.category).includes('signage')) {
        irrelevantSignCount += 1;
      }
    });

    const branchNodes = nearbyNodes.filter(({ distance: currentDistance }) => (
      currentDistance <= Math.max(4.2, DECISION_NODE_RADIUS * 1.6)
    ));
    const visibleTargetCandidates = targetRegionId ? getVisibleTargetCandidates(prepared, point, targetRegionId) : [];
    const branchCount = Math.max(1, branchNodes.length || (visibleTargetCandidates.length || 1));
    const candidatePathCount = Math.max(1, visibleTargetCandidates.length || branchNodes.length || 1);
    const inferredQueueCount = selectedTargetNodeId
      ? computeQueuePopulation(scenario, selectedTargetNodeId, { includeOrdinaryTargetNode: true })
      : 0;
    const queueCount = Number.isFinite(Number(options?.queueCount))
      ? safeNumber(options.queueCount, 0)
      : safeNumber(agent?.queueCount, inferredQueueCount);
    const levelChange = branchNodes.some(({ semantic }) => isLevelChangeFacilityMode(semantic.facilityMode))
      || isLevelChangeFacilityMode(facilityModeForNode(selectedTargetNode));
    const queueDecision = queueCount > 2 || branchNodes.some(({ node }) => computeQueuePopulation(scenario, node.id) > 2);
    const conflictingSignCount = problemSignCount + (relevantGuideCount > 0.35 && irrelevantSignCount > 0.25 ? 1 : 0);
    const continuousGuideCoverage = clamp(continuousGuideSignal, 0, 1);
    const mapSupport = clamp(mapSupportSignal, 0, 1);
    const serviceSupport = clamp(serviceSupportSignal, 0, 1);
    const guideReviewLoad = clamp(guideReviewSignal, 0, 1);
    const effectiveGuideDetected = continuousGuideCoverage > 0.12 || mapSupport > 0.12 || serviceSupport > 0.12;
    const agentProgressDist = safeNumber(agent?.pathProgressDist, safeNumber(agent?.progressDist, 0));
    let timeSinceLastEffectiveGuide = 0;
    let distanceSinceLastEffectiveGuide = 0;
    if (agent && Number.isFinite(agent.lastEffectiveGuideTime) && Number.isFinite(agent.lastEffectiveGuideDistance)) {
      timeSinceLastEffectiveGuide = Math.max(0, safeNumber(scenario?.time, 0) - safeNumber(agent.lastEffectiveGuideTime, 0));
      distanceSinceLastEffectiveGuide = Math.max(0, agentProgressDist - safeNumber(agent.lastEffectiveGuideDistance, 0));
    } else if (!effectiveGuideDetected) {
      timeSinceLastEffectiveGuide = 12;
      distanceSinceLastEffectiveGuide = 18;
    }

    return {
      branchCount,
      conflictingSignCount,
      candidatePathCount,
      levelChange,
      queueDecision,
      flashingAdCount,
      staticAdCount,
      irrelevantSignCount,
      broadcastInterference,
      queueCount,
      timeSinceLastEffectiveGuide,
      distanceSinceLastEffectiveGuide,
      continuousGuideCoverage,
      mapSupport,
      serviceSupport,
      guideReviewLoad,
      relevantGuideCount,
      problemSignCount,
      effectiveGuideDetected,
      decisionNodeId: getDecisionNode(prepared, point)?.id || null,
      decisionNodeLabel: getDecisionNode(prepared, point)?.displayLabelEn || getDecisionNode(prepared, point)?.displayLabel || getDecisionNode(prepared, point)?.id || null,
      selectedTargetNodeId,
      selectedTargetNodeLabel,
      targetRegionId,
      consideredObjects: consideredObjects.slice(0, 12),
    };
  }

  function computeDecisionBurdenState(options) {
    const capacityScores = normalizeCapacityScores(options?.capacityScores || {}, {});
    const vulnerability = safeNumber(options?.vulnerability, getCognitiveCompositeVulnerability(capacityScores));
    const baseDecisionDelay = Math.max(0, safeNumber(options?.baseDecisionDelay, 1));
    const decisionModelConfig = getDecisionMechanismConfig();
    const distractorWeights = decisionModelConfig?.distractorLoadWeights || {};
    const guidanceWeights = decisionModelConfig?.guidanceSupportWeights || {};
    const mechanismWeights = decisionModelConfig?.mechanismWeights || {};
    const finalScoreWeights = decisionModelConfig?.finalScore || {};
    const behaviorWeights = decisionModelConfig?.behaviorWeights || {};
    const memoryBaseMap = getDecisionBaseStateMap('memoryRetentionByScore', { 1: 0.35, 2: 0.50, 3: 0.65, 4: 0.80, 5: 0.92 });
    const attentionBaseMap = getDecisionBaseStateMap('attentionFocusByScore', { 1: 0.40, 2: 0.55, 3: 0.70, 4: 0.84, 5: 0.94 });
    const problemBaseMap = getDecisionBaseStateMap('problemSolvingByScore', { 1: 0.35, 2: 0.50, 3: 0.65, 4: 0.80, 5: 0.92 });
    const memoryBase = safeNumber(memoryBaseMap[clampCapacityScore(capacityScores.cognitive, 3)], 0.65);
    const attentionBase = safeNumber(attentionBaseMap[clampCapacityScore(capacityScores.cognitive, 3)], 0.70);
    const problemBase = safeNumber(problemBaseMap[clampCapacityScore(capacityScores.cognitive, 3)], 0.65);

    const branchComplexity = clamp((safeNumber(options?.branchCount, 1) - 1) / 4, 0, 1);
    const signConflict = clamp(safeNumber(options?.conflictingSignCount, 0) / 2, 0, 1);
    const pathComparisonCost = clamp(
      ((safeNumber(options?.candidatePathCount, 1) - 1) / 3)
      + (options?.levelChange ? 0.25 : 0)
      + (options?.queueDecision ? 0.25 : 0),
      0,
      1
    );
    const distractorLoad = clamp(
      safeNumber(distractorWeights.flashingAds, 0.52) * clamp(safeNumber(options?.flashingAdCount, 0) / 2, 0, 1)
      + safeNumber(distractorWeights.staticAds, 0.20) * clamp(safeNumber(options?.staticAdCount, 0) / 3, 0, 1)
      + safeNumber(distractorWeights.irrelevantSigns, 0.20) * clamp(safeNumber(options?.irrelevantSignCount, 0) / 3, 0, 1)
      + safeNumber(distractorWeights.broadcastInterference, 0.08) * clamp(safeNumber(options?.broadcastInterference, 0) / 1, 0, 1),
      0,
      1
    );
    const noisePenalty = clamp((safeNumber(options?.noiseDb, BASE_ENVIRONMENT_NOISE) - 55) / 25, 0, 1);
    const lux = safeNumber(options?.lux, BASE_ENVIRONMENT_LIGHTING);
    const lightingPenalty = clamp(
      Math.max((250 - lux) / 200, (lux - 800) / 1000, 0),
      0,
      1
    );
    const crowdPenalty = clamp((safeNumber(options?.crowdDensity, 0) - 0.8) / 2.2, 0, 1);
    const queueUncertainty = clamp((safeNumber(options?.queueCount, 0) - 2) / 8, 0, 1);
    const timeDecay = clamp(safeNumber(options?.timeSinceLastEffectiveGuide, 0) / 12, 0, 1);
    const distanceDecay = clamp(safeNumber(options?.distanceSinceLastEffectiveGuide, 0) / 18, 0, 1);
    const guidanceSupport = clamp(
      safeNumber(guidanceWeights.continuousGuideCoverage, 0.55) * safeNumber(options?.continuousGuideCoverage, 0)
      + safeNumber(guidanceWeights.mapSupport, 0.30) * safeNumber(options?.mapSupport, 0)
      + safeNumber(guidanceWeights.serviceSupport, 0.15) * safeNumber(options?.serviceSupport, 0),
      0,
      1
    );
    const guideReviewLoad = clamp(safeNumber(options?.guideReviewLoad, 0), 0, 1);
    const environmentWeightedAverage = clamp(
      (0.20 * noisePenalty) + (0.40 * lightingPenalty) + (0.40 * crowdPenalty),
      0,
      1
    );

    const memoryRetention = clamp(
      memoryBase
      + safeNumber(mechanismWeights.memoryRetention?.timeDecay, -0.16) * timeDecay
      + safeNumber(mechanismWeights.memoryRetention?.distanceDecay, -0.10) * distanceDecay
      + safeNumber(mechanismWeights.memoryRetention?.distractorLoad, -0.24) * distractorLoad
      + safeNumber(mechanismWeights.memoryRetention?.noisePenalty, -0.08) * noisePenalty
      + safeNumber(mechanismWeights.memoryRetention?.lightingPenalty, -0.10) * lightingPenalty
      + safeNumber(mechanismWeights.memoryRetention?.crowdPenalty, -0.11) * crowdPenalty
      + safeNumber(mechanismWeights.memoryRetention?.branchComplexity, -0.10) * branchComplexity,
      0,
      1
    );
    const attentionFocus = clamp(
      attentionBase
      + safeNumber(mechanismWeights.attentionFocus?.guidanceSupport, 0.30) * guidanceSupport
      + safeNumber(mechanismWeights.attentionFocus?.distractorLoad, -0.30) * distractorLoad
      + safeNumber(mechanismWeights.attentionFocus?.noisePenalty, -0.08) * noisePenalty
      + safeNumber(mechanismWeights.attentionFocus?.lightingPenalty, -0.10) * lightingPenalty
      + safeNumber(mechanismWeights.attentionFocus?.crowdPenalty, -0.10) * crowdPenalty,
      0,
      1
    );
    const problemSolving = clamp(
      problemBase
      + safeNumber(mechanismWeights.problemSolving?.guidanceSupport, 0.24) * guidanceSupport
      + safeNumber(mechanismWeights.problemSolving?.branchComplexity, -0.24) * branchComplexity
      + safeNumber(mechanismWeights.problemSolving?.signConflict, -0.26) * signConflict
      + safeNumber(mechanismWeights.problemSolving?.pathComparisonCost, -0.18) * pathComparisonCost
      + safeNumber(mechanismWeights.problemSolving?.queueUncertainty, -0.12) * queueUncertainty
      + safeNumber(mechanismWeights.problemSolving?.environmentWeightedAverage, -0.08) * environmentWeightedAverage,
      0,
      1
    );
    const orientationConfidence = clamp(
      0.34 * memoryRetention
      + 0.33 * attentionFocus
      + 0.33 * problemSolving,
      0,
      1
    );

    const decisionReactionTime = baseDecisionDelay * (
      1
      + safeNumber(behaviorWeights.decisionReactionTime?.branchComplexity, 0.50) * branchComplexity
      + safeNumber(behaviorWeights.decisionReactionTime?.signConflict, 0.35) * signConflict
      + safeNumber(behaviorWeights.decisionReactionTime?.memoryDeficit, 0.40) * (1 - memoryRetention)
      + safeNumber(behaviorWeights.decisionReactionTime?.attentionDeficit, 0.45) * (1 - attentionFocus)
      + safeNumber(behaviorWeights.decisionReactionTime?.problemDeficit, 0.50) * (1 - problemSolving)
    );
    const missGuideProbability = clamp(
      safeNumber(behaviorWeights.missGuideProbability?.attentionDeficit, 0.58) * (1 - attentionFocus)
      + safeNumber(behaviorWeights.missGuideProbability?.distractorLoad, 0.24) * distractorLoad
      + safeNumber(behaviorWeights.missGuideProbability?.noisePenalty, 0.08) * noisePenalty,
      0,
      1
    );
    const wrongTurnProbability = clamp(
      safeNumber(behaviorWeights.wrongTurnProbability?.problemDeficit, 0.42) * (1 - problemSolving)
      + safeNumber(behaviorWeights.wrongTurnProbability?.signConflict, 0.30) * signConflict
      + safeNumber(behaviorWeights.wrongTurnProbability?.memoryDeficit, 0.18) * (1 - memoryRetention),
      0,
      1
    );
    const recheckProbability = clamp(
      0.35 * (1 - memoryRetention)
      + 0.30 * (1 - attentionFocus)
      + 0.20 * (1 - orientationConfidence),
      0,
      1
    );
    const backtrackProbability = clamp(
      0.45 * wrongTurnProbability
      + 0.25 * recheckProbability
      + 0.20 * (1 - orientationConfidence),
      0,
      1
    );
    const recheckPauseTime = clamp(
      0.8
      + 1.2 * branchComplexity
      + 0.8 * signConflict
      + 1.0 * (1 - attentionFocus)
      + 0.8 * (1 - memoryRetention),
      0.8,
      4.5
    );
    const recheckSlowWalkDuration = recheckPauseTime;
    const recheckSlowWalkFactor = 0.5;
    const missGuideExtraPause = clamp(0.6 + 1.0 * missGuideProbability, 0.6, 2.5);
    const wrongTurnAdvanceDistance = clamp(0.6 + 1.0 * wrongTurnProbability + 0.3 * branchComplexity, 0.6, 1.8);
    const backtrackDistance = clamp(0.5 + 0.9 * backtrackProbability, 0.5, 1.4);
    const backtrackPauseTime = clamp(1.0 + 1.5 * signConflict + 1.0 * (1 - problemSolving), 1.0, 4.0);
    const guideReviewPauseTime = guidanceSupport > 0.05
      ? clamp(0.25 + 1.45 * guideReviewLoad, 0, 1.8)
      : 0;
    const rawBurden = Math.max(
      0,
      safeNumber(finalScoreWeights.base, 0.10)
      + safeNumber(finalScoreWeights.branchComplexity, 0.17) * branchComplexity
      + safeNumber(finalScoreWeights.signConflict, 0.20) * signConflict
      + safeNumber(finalScoreWeights.pathComparisonCost, 0.14) * pathComparisonCost
      + safeNumber(finalScoreWeights.distractorLoad, 0.15) * distractorLoad
      + safeNumber(finalScoreWeights.noisePenalty, 0.04) * noisePenalty
      + safeNumber(finalScoreWeights.lightingPenalty, 0.07) * lightingPenalty
      + safeNumber(finalScoreWeights.crowdPenalty, 0.07) * crowdPenalty
      + safeNumber(finalScoreWeights.queueUncertainty, 0.06) * queueUncertainty
      + safeNumber(finalScoreWeights.memoryDeficit, 0.13) * (1 - memoryRetention)
      + safeNumber(finalScoreWeights.attentionDeficit, 0.13) * (1 - attentionFocus)
      + safeNumber(finalScoreWeights.problemDeficit, 0.16) * (1 - problemSolving)
      + safeNumber(finalScoreWeights.guidanceSupport, -0.20) * guidanceSupport
    );
    const score = clamp(100 * vulnerability * rawBurden, 0, 100);

    return {
      vulnerability: Number(vulnerability.toFixed(3)),
      branchComplexity: Number(branchComplexity.toFixed(3)),
      signConflict: Number(signConflict.toFixed(3)),
      pathComparisonCost: Number(pathComparisonCost.toFixed(3)),
      distractorLoad: Number(distractorLoad.toFixed(3)),
      noisePenalty: Number(noisePenalty.toFixed(3)),
      lightingPenalty: Number(lightingPenalty.toFixed(3)),
      crowdPenalty: Number(crowdPenalty.toFixed(3)),
      queueUncertainty: Number(queueUncertainty.toFixed(3)),
      timeDecay: Number(timeDecay.toFixed(3)),
      distanceDecay: Number(distanceDecay.toFixed(3)),
      guidanceSupport: Number(guidanceSupport.toFixed(3)),
      guideReviewLoad: Number(guideReviewLoad.toFixed(3)),
      memoryRetention: Number(memoryRetention.toFixed(3)),
      attentionFocus: Number(attentionFocus.toFixed(3)),
      problemSolving: Number(problemSolving.toFixed(3)),
      orientationConfidence: Number(orientationConfidence.toFixed(3)),
      decisionReactionTime: Number(decisionReactionTime.toFixed(3)),
      missGuideProbability: Number(missGuideProbability.toFixed(3)),
      wrongTurnProbability: Number(wrongTurnProbability.toFixed(3)),
      recheckProbability: Number(recheckProbability.toFixed(3)),
      backtrackProbability: Number(backtrackProbability.toFixed(3)),
      problemSignCount: Math.max(0, Math.round(safeNumber(options?.problemSignCount, 0))),
      recheckPauseTime: Number(recheckPauseTime.toFixed(3)),
      recheckSlowWalkDuration: Number(recheckSlowWalkDuration.toFixed(3)),
      recheckSlowWalkFactor: Number(recheckSlowWalkFactor.toFixed(3)),
      guideReviewPauseTime: Number(guideReviewPauseTime.toFixed(3)),
      missGuideExtraPause: Number(missGuideExtraPause.toFixed(3)),
      wrongTurnAdvanceDistance: Number(wrongTurnAdvanceDistance.toFixed(3)),
      backtrackDistance: Number(backtrackDistance.toFixed(3)),
      backtrackPauseTime: Number(backtrackPauseTime.toFixed(3)),
      raw: Number(rawBurden.toFixed(3)),
      score: Number(score.toFixed(2)),
    };
  }

  function rollDecisionBehaviorOutcome(decisionState, rng) {
    const randomSource = rng && typeof rng.next === 'function'
      ? rng
      : { next: () => Math.random() };
    const problemSignCount = Math.max(0, Math.round(safeNumber(decisionState?.problemSignCount, 0)));
    const allowWrongTurnFamily = problemSignCount > 0;
    const triggerRecheck = randomSource.next() < safeNumber(decisionState?.recheckProbability, 0);
    const mayMissGuide = randomSource.next() < safeNumber(decisionState?.missGuideProbability, 0);
    const triggerWrongTurn = allowWrongTurnFamily
      && randomSource.next() < safeNumber(decisionState?.wrongTurnProbability, 0);
    const triggerBacktrack = allowWrongTurnFamily
      && randomSource.next() < safeNumber(decisionState?.backtrackProbability, 0);
    const triggerSlowWalk = triggerRecheck;
    const guideReviewPauseTime = safeNumber(decisionState?.guideReviewPauseTime, 0);
    const triggerGuideReview = guideReviewPauseTime > 0.05;
    const nodePauseTime = clamp(
      safeNumber(decisionState?.decisionReactionTime, 0)
      + guideReviewPauseTime
      + (mayMissGuide ? safeNumber(decisionState?.missGuideExtraPause, 0) : 0)
      + (triggerBacktrack ? safeNumber(decisionState?.backtrackPauseTime, 0) : 0),
      0,
      8
    );
    return {
      triggerGuideReview,
      triggerRecheck,
      triggerSlowWalk,
      mayMissGuide,
      triggerWrongTurn,
      triggerBacktrack,
      nodePauseTime: Number(nodePauseTime.toFixed(3)),
      guideReviewPauseTime: triggerGuideReview ? guideReviewPauseTime : 0,
      recheckPauseTime: triggerRecheck ? safeNumber(decisionState?.recheckPauseTime, 0) : 0,
      slowWalkDuration: triggerSlowWalk ? safeNumber(decisionState?.recheckSlowWalkDuration, 0) : 0,
      slowWalkFactor: triggerSlowWalk ? safeNumber(decisionState?.recheckSlowWalkFactor, 1) : 1,
      missGuideExtraPause: mayMissGuide ? safeNumber(decisionState?.missGuideExtraPause, 0) : 0,
      wrongTurnAdvanceDistance: triggerWrongTurn ? safeNumber(decisionState?.wrongTurnAdvanceDistance, 0) : 0,
      backtrackDistance: triggerBacktrack ? safeNumber(decisionState?.backtrackDistance, 0) : 0,
      backtrackPauseTime: triggerBacktrack ? safeNumber(decisionState?.backtrackPauseTime, 0) : 0,
    };
  }

  function updateDecisionGuideMemory(agent, scenario, decisionInputs) {
    if (!agent || !decisionInputs?.effectiveGuideDetected) {
      return;
    }
    agent.lastEffectiveGuideTime = safeNumber(scenario?.time, 0);
    agent.lastEffectiveGuideDistance = safeNumber(agent.pathProgressDist, safeNumber(agent.progressDist, 0));
  }

  function updateDecisionVisualOffset(agent, dt) {
    agent.decisionLateralOffset = safeNumber(agent?.decisionLateralOffset, 0) * 0.7;
    if (Math.abs(agent.decisionLateralOffset) < 0.01) {
      agent.decisionLateralOffset = 0;
    }
  }

  function reversePolyline(polyline) {
    const reversedPoints = Array.isArray(polyline?.points) ? polyline.points.slice().reverse() : [];
    return buildPolyline(reversedPoints);
  }

  function clearDecisionInteraction(agent) {
    agent.decisionInteractionState = null;
    agent.decisionInteractionMode = null;
    agent.decisionInteractionSourceId = null;
    agent.decisionInteractionTarget = null;
    agent.decisionInteractionPath = null;
    agent.decisionInteractionReturnPath = null;
    agent.decisionInteractionProgress = 0;
    agent.decisionInteractionPauseRemaining = 0;
    agent.decisionInteractionQueuedOutcome = null;
  }

  function shouldSuppressRepeatedDecisionSource(agent, selection) {
    if (!selection?.item || !agent?.lastDecisionInteractionSourceId || !agent?.lastDecisionInteractionSourcePoint) {
      return false;
    }
    if (agent.lastDecisionInteractionSourceId !== selection.item.id) {
      return false;
    }
    return distance(agent.position, agent.lastDecisionInteractionSourcePoint) <= DECISION_NODE_RADIUS * 1.8;
  }

  function hasActiveDecisionInteraction(agent) {
    return Boolean(agent?.decisionInteractionState && agent?.decisionInteractionPath);
  }

  function getRemainingForwardPathDistance(agent) {
    return Math.max(0, safeNumber(agent?.path?.length, safeNumber(agent?.pathLength, 0)) - safeNumber(agent?.pathProgressDist, 0));
  }

  function getAvailableBacktrackDistance(agent) {
    return Math.max(0, safeNumber(agent?.pathProgressDist, 0));
  }

  function applyDecisionMotionOutcome(agent, outcome, options) {
    const includePause = options?.includePause !== false;
    if (includePause) {
      agent.decisionPauseRemaining = Math.max(
        safeNumber(agent.decisionPauseRemaining, 0),
        safeNumber(outcome?.nodePauseTime, 0)
      );
    }
    if (outcome?.triggerSlowWalk) {
      agent.decisionSlowWalkRemaining = Math.max(
        safeNumber(agent.decisionSlowWalkRemaining, 0),
        safeNumber(outcome.slowWalkDuration, 0)
      );
      agent.decisionSlowWalkFactor = Math.min(
        safeNumber(agent.decisionSlowWalkFactor, 1),
        clamp(safeNumber(outcome.slowWalkFactor, 1), 0.2, 1)
      );
    }
    if (outcome?.triggerWrongTurn) {
      const availableForwardDistance = getRemainingForwardPathDistance(agent);
      agent.decisionWrongTurnRemaining = Math.max(
        safeNumber(agent.decisionWrongTurnRemaining, 0),
        Math.min(safeNumber(outcome.wrongTurnAdvanceDistance, 0), availableForwardDistance)
      );
    }
    if (outcome?.triggerBacktrack) {
      const availableBacktrackDistance = getAvailableBacktrackDistance(agent);
      agent.decisionBacktrackRemaining = Math.max(
        safeNumber(agent.decisionBacktrackRemaining, 0),
        Math.min(safeNumber(outcome.backtrackDistance, 0), availableBacktrackDistance)
      );
    }
  }

  function scoreDecisionInteractionCandidate(entry, semantic, currentDistance) {
    const proximity = clamp(1 - currentDistance / VISION_RADIUS, 0, 1);
    let score =
      proximity
      + safeNumber(entry?.reviewValue, 0) * 1.9
      + safeNumber(entry?.supportValue, 0) * 1.35
      + safeNumber(entry?.relevanceScore, 0) * 0.5
      + safeNumber(entry?.value, 0) * 0.35;
    if (semantic?.semanticId === 'panoramic_guide_map') {
      score += 0.42;
    } else if (semantic?.semanticId === 'customer_service_centre' || semantic?.semanticId === 'ai_virtual_service_ambassador') {
      score += 0.35;
    } else if (semantic?.semanticId === 'common_direction_signs') {
      score += 0.18;
    }
    return score;
  }

  function selectDecisionInteractionSource(decisionInputs, pressureObjects, outcome) {
    const consideredById = new Map((decisionInputs?.consideredObjects || []).map((entry) => [entry.id, entry]));
    const wantsProblemConfirm = Boolean(outcome?.triggerWrongTurn || outcome?.triggerBacktrack);
    const wantsGuideReview = Boolean(outcome?.triggerGuideReview || outcome?.triggerSlowWalk);
    let bestProblem = null;
    let bestGuide = null;

    pressureObjects.forEach(({ item, distance: currentDistance, semantic }) => {
      const considered = consideredById.get(item.id) || null;
      if (semantic?.semanticId === 'hanging_signs') {
        return;
      }
      if (semantic?.decisionRole === 'problem-sign') {
        const score =
          1.4
          + clamp(1 - currentDistance / VISION_RADIUS, 0, 1)
          + safeNumber(considered?.value, 0) * 0.5
          + safeNumber(considered?.relevanceScore, 0) * 0.5;
        if (!bestProblem || score > bestProblem.score) {
          bestProblem = {
            mode: 'problem-confirm',
            item,
            score,
          };
        }
        return;
      }
      if (!wantsGuideReview) {
        return;
      }
      if (semantic?.decisionRole !== 'guide' && semantic?.decisionRole !== 'service') {
        return;
      }
      if (considered?.direction !== 'support' && semantic?.decisionSupport !== 'service') {
        return;
      }
      const score = scoreDecisionInteractionCandidate(considered, semantic, currentDistance);
      if (!bestGuide || score > bestGuide.score) {
        bestGuide = {
          mode: outcome?.triggerGuideReview ? 'guide-review' : 'slow-review',
          item,
          score,
        };
      }
    });

    if (wantsProblemConfirm && bestProblem) {
      return bestProblem;
    }
    if (bestGuide) {
      return bestGuide;
    }
    return null;
  }

  function buildDecisionInteractionPlan(prepared, agent, sourceItem, selection, outcome) {
    if (!prepared || !agent?.position || !sourceItem) {
      return null;
    }
    const fallbackDirection = agent.tangent
      ? normalizeVector({ x: -agent.tangent.x, y: -agent.tangent.y }, { x: 0, y: 1 })
      : { x: 0, y: 1 };
    const baseDirection = normalizeVector({
      x: safeNumber(agent.position.x, 0) - safeNumber(sourceItem.x, 0),
      y: safeNumber(agent.position.y, 0) - safeNumber(sourceItem.y, 0),
    }, fallbackDirection);
    const angleOffsets = [0, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3, Math.PI / 2, -Math.PI / 2, Math.PI];
    let bestPlan = null;

    angleOffsets.forEach((angleOffset) => {
      const candidateDirection = normalizeVector(rotateVector(baseDirection, angleOffset), baseDirection);
      const rawTarget = {
        x: safeNumber(sourceItem.x, 0) + candidateDirection.x * DECISION_INTERACTION_OFFSET_DISTANCE,
        y: safeNumber(sourceItem.y, 0) + candidateDirection.y * DECISION_INTERACTION_OFFSET_DISTANCE,
      };
      const targetPoint = projectPointToWalkable(prepared, rawTarget, {
        minimumClearance: DECISION_INTERACTION_MIN_CLEARANCE,
      });
      if (distance(targetPoint, sourceItem) < DECISION_INTERACTION_MIN_SOURCE_DISTANCE) {
        return;
      }
      const path = findPath(prepared, agent.position, targetPoint)
        || (lineIsWalkable(agent.position, targetPoint, prepared, { minimumClearance: 0.15 })
          ? buildPolyline([agent.position, targetPoint])
          : null);
      if (!path || safeNumber(path.length, 0) <= 1e-6) {
        return;
      }
      const directionAlignment = clamp(
        candidateDirection.x * baseDirection.x + candidateDirection.y * baseDirection.y,
        -1,
        1
      );
      const score =
        safeNumber(path.length, Number.POSITIVE_INFINITY)
        + distance(targetPoint, rawTarget) * 1.4
        - directionAlignment * 0.35;
      if (!bestPlan || score < bestPlan.score) {
        bestPlan = {
          score,
          targetPoint,
          path,
        };
      }
    });

    if (!bestPlan) {
      return null;
    }

    return {
      state: 'approach',
      mode: selection.mode,
      sourceId: sourceItem.id,
      target: bestPlan.targetPoint,
      path: bestPlan.path,
      returnPath: null,
      pauseRemaining: safeNumber(outcome?.nodePauseTime, 0),
      queuedOutcome: { ...outcome },
    };
  }

  function startDecisionInteraction(agent, interactionPlan) {
    agent.decisionInteractionState = interactionPlan.state;
    agent.decisionInteractionMode = interactionPlan.mode;
    agent.decisionInteractionSourceId = interactionPlan.sourceId;
    agent.decisionInteractionTarget = interactionPlan.target ? { ...interactionPlan.target } : null;
    agent.decisionInteractionPath = interactionPlan.path;
    agent.decisionInteractionReturnPath = interactionPlan.returnPath;
    agent.decisionInteractionProgress = 0;
    agent.decisionInteractionPauseRemaining = safeNumber(interactionPlan.pauseRemaining, 0);
    agent.decisionInteractionQueuedOutcome = interactionPlan.queuedOutcome ? { ...interactionPlan.queuedOutcome } : null;
  }

  function rerouteFocusAgentFromCurrentPosition(prepared, scenario, agent) {
    if (!prepared || !scenario || !agent?.isFocusAgent) {
      return false;
    }
    const targetRegionId = scenario.focusTargetRegion?.id || scenario.focusTargetRegionId;
    if (!targetRegionId || !agent.position) {
      return false;
    }
    const resolution = resolveFocusRoute(
      prepared,
      scenario,
      agent,
      {
        x: safeNumber(agent.position.x, 0),
        y: safeNumber(agent.position.y, 0),
        z: safeNumber(agent.position.z, 0),
      },
      targetRegionId,
      agent.selectedTargetNodeId
    );
    if (!resolution?.route) {
      return false;
    }
    applyFocusRoute(prepared, scenario, agent, resolution, { preservePosition: true });
    return true;
  }

  function finalizeDecisionInteraction(prepared, scenario, agent) {
    const queuedOutcome = agent?.decisionInteractionQueuedOutcome ? { ...agent.decisionInteractionQueuedOutcome } : null;
    agent.lastDecisionInteractionSourceId = agent?.decisionInteractionSourceId || null;
    agent.lastDecisionInteractionSourcePoint = agent?.decisionInteractionTarget
      ? { ...agent.decisionInteractionTarget }
      : null;
    rerouteFocusAgentFromCurrentPosition(prepared, scenario, agent);
    clearDecisionInteraction(agent);
    if (queuedOutcome) {
      applyDecisionMotionOutcome(agent, queuedOutcome, { includePause: false });
    }
  }

  function materializeDecisionInteractionPosition(agent) {
    const interactionPath = agent?.decisionInteractionPath;
    if (!interactionPath) {
      return;
    }
    const sample = samplePolyline(interactionPath, safeNumber(agent.decisionInteractionProgress, 0));
    agent.center = { x: sample.x, y: sample.y };
    agent.position = { x: sample.x, y: sample.y };
    agent.tangent = sample.tangent;
    agent.normal = sample.normal;
    agent.progress = agent.pathLength <= 1e-6 ? 0 : clamp(safeNumber(agent.pathProgressDist, 0) / agent.pathLength, 0, 1);
    agent.offset = 0;
  }

  function advanceDecisionInteraction(prepared, scenario, agent, speed, dt) {
    if (!hasActiveDecisionInteraction(agent)) {
      return { handled: false, movedDistance: 0 };
    }
    if (agent.decisionInteractionState === 'pause') {
      agent.decisionInteractionPauseRemaining = Math.max(0, safeNumber(agent.decisionInteractionPauseRemaining, 0) - safeNumber(dt, 0));
      if (agent.decisionInteractionPauseRemaining <= 1e-6) {
        if (agent.decisionInteractionReturnPath && safeNumber(agent.decisionInteractionReturnPath.length, 0) > 1e-6) {
          agent.decisionInteractionState = 'return';
          agent.decisionInteractionPath = agent.decisionInteractionReturnPath;
          agent.decisionInteractionProgress = 0;
        } else {
          finalizeDecisionInteraction(prepared, scenario, agent);
        }
      }
      return { handled: true, movedDistance: 0 };
    }

    const interactionPath = agent.decisionInteractionPath;
    if (!interactionPath) {
      clearDecisionInteraction(agent);
      return { handled: false, movedDistance: 0 };
    }

    const travelBudget = Math.max(0, safeNumber(speed, 0) * safeNumber(dt, 0));
    if (travelBudget <= 1e-6) {
      return { handled: true, movedDistance: 0 };
    }

    const remainingDistance = Math.max(0, safeNumber(interactionPath.length, 0) - safeNumber(agent.decisionInteractionProgress, 0));
    const travel = Math.min(travelBudget, remainingDistance);
    agent.decisionInteractionProgress = Math.min(
      safeNumber(interactionPath.length, 0),
      safeNumber(agent.decisionInteractionProgress, 0) + travel
    );
    agent.progressDist = safeNumber(agent.progressDist, 0) + travel;

    if (safeNumber(interactionPath.length, 0) - safeNumber(agent.decisionInteractionProgress, 0) <= 1e-6) {
      if (agent.decisionInteractionState === 'approach') {
        if (safeNumber(agent.decisionInteractionPauseRemaining, 0) > 1e-6) {
          agent.decisionInteractionState = 'pause';
          agent.decisionInteractionProgress = safeNumber(interactionPath.length, 0);
        } else if (agent.decisionInteractionReturnPath && safeNumber(agent.decisionInteractionReturnPath.length, 0) > 1e-6) {
          agent.decisionInteractionState = 'return';
          agent.decisionInteractionPath = agent.decisionInteractionReturnPath;
          agent.decisionInteractionProgress = 0;
        } else {
          finalizeDecisionInteraction(prepared, scenario, agent);
        }
      } else if (agent.decisionInteractionState === 'return') {
        finalizeDecisionInteraction(prepared, scenario, agent);
      }
    }

    return { handled: true, movedDistance: travel };
  }

  function consumeDecisionMotion(prepared, scenario, agent, speed, dt) {
    const interactionMotion = advanceDecisionInteraction(prepared, scenario, agent, speed, dt);
    if (interactionMotion.handled) {
      return interactionMotion;
    }
    const travelBudget = Math.max(0, safeNumber(speed, 0) * safeNumber(dt, 0));
    if (travelBudget <= 1e-6) {
      return { handled: false, movedDistance: 0 };
    }
    if (safeNumber(agent?.decisionWrongTurnRemaining, 0) > 1e-6) {
      const travel = Math.min(travelBudget, safeNumber(agent.decisionWrongTurnRemaining, 0));
      agent.pathProgressDist = clamp(safeNumber(agent.pathProgressDist, 0) + travel, 0, agent.path.length);
      agent.progressDist = safeNumber(agent.progressDist, 0) + travel;
      agent.decisionWrongTurnRemaining = Math.max(0, safeNumber(agent.decisionWrongTurnRemaining, 0) - travel);
      return { handled: true, movedDistance: travel };
    }
    if (safeNumber(agent?.decisionBacktrackRemaining, 0) > 1e-6) {
      const travel = Math.min(travelBudget, safeNumber(agent.decisionBacktrackRemaining, 0));
      agent.pathProgressDist = clamp(safeNumber(agent.pathProgressDist, 0) - travel, 0, agent.path.length);
      agent.progressDist = Math.max(0, safeNumber(agent.progressDist, 0) - travel);
      agent.decisionBacktrackRemaining = Math.max(0, safeNumber(agent.decisionBacktrackRemaining, 0) - travel);
      return { handled: true, movedDistance: travel };
    }
    return { handled: false, movedDistance: 0 };
  }

  function applyDecisionBehaviorOutcome(prepared, scenario, agent, decisionNode, decisionInputs, pressureObjects, decisionState) {
    if (!agent?.isFocusAgent || !decisionState) {
      return null;
    }
    const outcome = rollDecisionBehaviorOutcome(decisionState, scenario?.rng);
    const selection = selectDecisionInteractionSource(decisionInputs, pressureObjects || [], outcome);
    const suppressRepeatedSource = shouldSuppressRepeatedDecisionSource(agent, selection);
    const effectiveOutcome = suppressRepeatedSource
      ? {
          ...outcome,
          triggerGuideReview: false,
          triggerRecheck: false,
          triggerSlowWalk: false,
          triggerWrongTurn: false,
          triggerBacktrack: false,
          nodePauseTime: 0,
          guideReviewPauseTime: 0,
          recheckPauseTime: 0,
          slowWalkDuration: 0,
          slowWalkFactor: 1,
          missGuideExtraPause: 0,
          wrongTurnAdvanceDistance: 0,
          backtrackDistance: 0,
          backtrackPauseTime: 0,
        }
      : outcome;
    const interactionPlan = selection
      ? suppressRepeatedSource
        ? null
        : buildDecisionInteractionPlan(prepared, agent, selection.item, selection, effectiveOutcome)
      : null;
    if (interactionPlan) {
      startDecisionInteraction(agent, interactionPlan);
    } else {
      applyDecisionMotionOutcome(agent, effectiveOutcome);
    }
    agent.lastDecisionDiagnostics = {
      decisionNodeId: decisionNode?.id || null,
      decisionNodeLabel: decisionNode?.displayLabelEn || decisionNode?.displayLabel || decisionNode?.id || null,
      time: safeNumber(scenario?.time, 0),
      ...decisionState,
      behavior: {
        ...effectiveOutcome,
        interactionMode: interactionPlan?.mode || null,
        interactionSourceId: interactionPlan?.sourceId || null,
      },
    };
    return effectiveOutcome;
  }

  function extractBurdenScores(dimensionState) {
    const result = {};
    FIVE_DIMENSION_ORDER.forEach((id) => {
      result[id] = safeNumber(dimensionState?.burdens?.[id]?.score, 0);
    });
    return result;
  }

  function deriveFiveDimensionStateAtPoint(prepared, scenario, point, options) {
    const agent = options?.agent || null;
    const profile = attachCapacityScoresToProfile(
      options?.profile
      || agent?.profile
      || scenario?.focusAgent?.profile
      || {}
    );
    const capacityScores = normalizeCapacityScores(profile.capacityScores, profile);
    const vulnerabilities = getEffectiveCapacityVulnerabilities(capacityScores);

    const selectedTargetNodeId = options?.selectedTargetNodeId || agent?.selectedTargetNodeId || null;
    const selectedTargetNode = selectedTargetNodeId ? prepared?.nodeById?.[selectedTargetNodeId] || null : null;
    const inferredQueueCount = selectedTargetNodeId
      ? computeQueuePopulation(scenario, selectedTargetNodeId, { includeOrdinaryTargetNode: true })
      : undefined;
    const queueCount = Number.isFinite(Number(options?.queueCount))
      ? safeNumber(options.queueCount, 0)
      : Number.isFinite(Number(agent?.queueCount))
        ? safeNumber(agent.queueCount, 0)
        : inferredQueueCount;
    const pressureQueueCount = (
      Number.isFinite(Number(options?.queueCount))
      || Number.isFinite(Number(agent?.queueCount))
      || (selectedTargetNode && !isExplicitBackgroundQueueNode(selectedTargetNode))
    )
      ? queueCount
      : undefined;
    const environment = options?.environment || evaluateEnvironmentAtPoint(prepared, scenario, point, agent);
    const pressureState = options?.pressureState || extractPressureAtPoint(prepared, scenario, point, {
      agent,
      applyTriggers: false,
      environment,
      queueCount: pressureQueueCount,
      selectedTargetNodeId,
    });
    const pressureObjects = options?.pressureObjects || collectPressureObjectsWithinRadius(prepared, point, VISION_RADIUS);
    const nearbyNodes = options?.nearbyNodes || collectNodesWithinRadius(prepared, point, VISION_RADIUS);
    const nearbySeats = options?.nearbySeats || collectSeatsWithinRadius(prepared, point, VISION_RADIUS);

    const locomotorState = computeLocomotorMechanicsAtPoint(prepared, scenario, point, {
      ...options,
      agent,
      profile,
      environment,
      nearbyNodes,
      queueCount,
    });

    const decisionInputs = options?.decisionInputs
      ? { ...options.decisionInputs }
      : deriveDecisionSceneInputs(prepared, scenario, point, {
          agent,
          pressureObjects,
          nearbyNodes,
          environment,
          queueCount,
          targetRegionId: options?.targetRegionId,
          selectedTargetNodeId,
          selectedTargetNodeLabel: options?.selectedTargetNodeLabel,
        });
    const sensoryRules = UNIFIED_RULES?.dimensions?.sensory?.mechanisms || {};
    const perceptionRadius = getPerceptionRadiusForScores(capacityScores);
    const recognitionRate = safeNumber(
      sensoryRules.thresholds?.signRecognitionRate?.[clampCapacityScore(capacityScores.sensory, 3)],
      1
    );
    const recognitionSampler = typeof options?.recognitionSampler === 'function' ? options.recognitionSampler : null;
    const sensoryPressureObjects = pressureObjects.filter(
      ({ distance: currentDistance }) => safeNumber(currentDistance, Number.POSITIVE_INFINITY) <= perceptionRadius
    );
    const sensoryNearbyNodes = nearbyNodes.filter(
      ({ distance: currentDistance }) => safeNumber(currentDistance, Number.POSITIVE_INFINITY) <= perceptionRadius
    );
    const sensoryNearbySeats = nearbySeats.filter(
      ({ distance: currentDistance }) => safeNumber(currentDistance, Number.POSITIVE_INFINITY) <= perceptionRadius
    );
    const recognizedObjects = [];
    const missedObjects = [];
    let sensoryObjectLoad = 0;
    let hangingSignsInterference = 0;
    let tactilePavingSupport = 0;
    let audibleCueSupport = 0;
    let nearbyServiceSupport = 0;
    sensoryPressureObjects.forEach(({ item, distance: currentDistance, semantic }) => {
      const weight = resolveSensoryRelevantObjectWeight(semantic, item, sensoryRules);
      const confidence = computeRecognitionConfidence(currentDistance, perceptionRadius, recognitionRate);
      if (weight > 0) {
        const objectKey = `pressure:${item.id}`;
        const recognized = isRecognizedObject(
          confidence,
          getRecognitionSampleUnit(agent, scenario, objectKey, recognitionSampler)
        );
        sensoryObjectLoad += weight * (1 - confidence);
        const payload = {
          id: item.id,
          name: item.name || item.id,
          semanticId: semantic.semanticId,
          distance: Number(currentDistance.toFixed(2)),
          confidence: Number(confidence.toFixed(3)),
        };
        if (recognized) {
          recognizedObjects.push(payload);
        } else {
          missedObjects.push(payload);
        }
      }
      const proximity = clamp(1 - currentDistance / VISION_RADIUS, 0, 1);
      if (semantic.semanticId === 'hanging_signs') {
        hangingSignsInterference += proximity;
      }
      if (
        semantic.semanticId === 'broadcast_guidance'
        || normalizeRuleToken(item?.feature).includes('audio')
        || normalizeRuleToken(item?.feature).includes('voice')
      ) {
        audibleCueSupport += proximity;
      }
      if (
        semantic.semanticId === 'tactile_paving_endpoint'
        || normalizeRuleToken(item?.feature).includes('tactile paving')
      ) {
        tactilePavingSupport += proximity;
      }
      if (
        semantic.semanticId === 'customer_service_centre'
        || semantic.semanticId === 'ai_virtual_service_ambassador'
        || semantic.semanticId === 'service_facility'
      ) {
        nearbyServiceSupport += proximity;
      }
    });
    sensoryNearbyNodes.forEach(({ node, distance: currentDistance, semantic }) => {
      const confidence = computeRecognitionConfidence(currentDistance, perceptionRadius, recognitionRate);
      const weight = safeNumber(sensoryRules.relevantObjectWeights?.node, 0.18);
      const objectKey = `node:${node.id}`;
      const recognized = isRecognizedObject(
        confidence,
        getRecognitionSampleUnit(agent, scenario, objectKey, recognitionSampler)
      );
      sensoryObjectLoad += weight * (1 - confidence);
      const payload = {
        id: node.id,
        name: node.displayLabelEn || node.displayLabel || node.id,
        semanticId: semantic.semanticId,
        distance: Number(currentDistance.toFixed(2)),
        confidence: Number(confidence.toFixed(3)),
      };
      if (recognized) {
        recognizedObjects.push(payload);
      } else {
        missedObjects.push(payload);
      }
    });
    sensoryNearbySeats.forEach(({ seat, distance: currentDistance }) => {
      const confidence = computeRecognitionConfidence(currentDistance, perceptionRadius, recognitionRate);
      const weight = safeNumber(sensoryRules.relevantObjectWeights?.seat, 0.1);
      const objectKey = `seat:${seat.id}`;
      const recognized = isRecognizedObject(
        confidence,
        getRecognitionSampleUnit(agent, scenario, objectKey, recognitionSampler)
      );
      sensoryObjectLoad += weight * (1 - confidence);
      const payload = {
        id: seat.id,
        name: seat.label || seat.id,
        semanticId: 'seat',
        distance: Number(currentDistance.toFixed(2)),
        confidence: Number(confidence.toFixed(3)),
      };
      if (recognized) {
        recognizedObjects.push(payload);
      } else {
        missedObjects.push(payload);
      }
    });
    const sensoryState = computeSensoryBurdenState({
      profile,
      capacityScores,
      vulnerability: vulnerabilities.sensory,
      objectLoad: sensoryObjectLoad,
      noiseDb: safeNumber(environment.noiseLevel, BASE_ENVIRONMENT_NOISE),
      lux: safeNumber(environment.lightingLevel, BASE_ENVIRONMENT_LIGHTING),
      crowdDensityLocal: getUnifiedCrowdDensity(environment, 0),
      crowdDensityPerception: getUnifiedCrowdDensity(environment, 0),
      flashingAds: safeNumber(decisionInputs.flashingAdCount, 0),
      staticAds: safeNumber(decisionInputs.staticAdCount, 0),
      irrelevantSigns: safeNumber(decisionInputs.irrelevantSignCount, 0),
      hangingSignsInterference,
      continuousGuideCoverage: safeNumber(decisionInputs.continuousGuideCoverage, 0),
      tactilePavingSupport: clamp(tactilePavingSupport, 0, 1),
      audibleCueSupport: clamp(audibleCueSupport, 0, 1),
      nearbyServiceSupport: clamp(
        Math.max(nearbyServiceSupport, safeNumber(decisionInputs.serviceSupport, 0)),
        0,
        1
      ),
      recognizedObjectCount: recognizedObjects.length,
    });
    const sensoryScore = clamp(safeNumber(sensoryState.score, 0), 0, 100);
    const decisionState = computeDecisionBurdenState({
      ...decisionInputs,
      capacityScores,
      baseDecisionDelay: safeNumber(profile.decisionDelay, 0.8),
      noiseDb: Number.isFinite(Number(decisionInputs.noiseDb))
        ? safeNumber(decisionInputs.noiseDb, BASE_ENVIRONMENT_NOISE)
        : safeNumber(environment.noiseLevel, BASE_ENVIRONMENT_NOISE),
      lux: Number.isFinite(Number(decisionInputs.lux))
        ? safeNumber(decisionInputs.lux, BASE_ENVIRONMENT_LIGHTING)
        : safeNumber(environment.lightingLevel, BASE_ENVIRONMENT_LIGHTING),
      crowdDensity: Number.isFinite(Number(decisionInputs.crowdDensity))
        ? safeNumber(decisionInputs.crowdDensity, 0)
        : getUnifiedCrowdDensity(environment, 0),
      queueCount: safeNumber(decisionInputs.queueCount, queueCount),
      vulnerability: vulnerabilities.cognitive,
    });
    const cognitiveScore = clamp(decisionState.score, 0, 100);

    const psychologicalRaw = safeNumber(pressureState.pressureScore, 0);
    const psychologicalState = computePsychologicalBurdenState({
      profile,
      capacityScores,
      vulnerability: vulnerabilities.psychological,
      pressureScore: psychologicalRaw,
      ambientNoiseStress: safeNumber(pressureState.ambientNoiseStress, 0),
      ambientCrowdingStress: safeNumber(pressureState.ambientCrowdingStress, 0),
      ambientLightingStress: safeNumber(pressureState.ambientLightingStress, 0),
      ambientQueueStress: safeNumber(pressureState.ambientQueueStress, 0),
      persistentStress: safeNumber(pressureState.persistentStress, 0),
      localVisibleStress: safeNumber(pressureState.localVisibleStress, 0),
      continuousGuideCoverage: safeNumber(decisionInputs.continuousGuideCoverage, 0),
      mapSupport: safeNumber(decisionInputs.mapSupport, 0),
      serviceSupport: safeNumber(decisionInputs.serviceSupport, 0),
    });
    const psychologicalScore = safeNumber(psychologicalState.score, 0);

    const fatigueThreshold = safeNumber(
      options?.fatigueThreshold,
      safeNumber(agent?.fatigueThreshold, getFatigueThreshold(capacityScores?.vitality))
    );
    const currentFatigue = safeNumber(options?.fatigue, safeNumber(agent?.fatigue, 0));
    const fatigueRatioPercent = fatigueThreshold > 0 ? clamp((currentFatigue / fatigueThreshold) * 100, 0, 100) : 0;
    const fatigueRateComponents = getVitalityFatigueRateComponents(capacityScores);
    const fatigueRateMultiplier = getEffectiveFatigueRateMultiplier(capacityScores);
    const baseFatigueRatePercentPerSecond = isWheelchairLocomotorProfile(capacityScores)
      ? getWheelchairBaseFatigueRatePercentPerSecond(capacityScores?.vitality)
      : getBaseFatigueRatePercentPerSecond(capacityScores?.vitality);
    const vitalityScore = clamp(
      fatigueRatioPercent * vulnerabilities.vitality,
      0,
      100
    );

    const burdens = {
      locomotor: {
        score: Number(safeNumber(locomotorState.score, 0).toFixed(2)),
        raw: Number(safeNumber(locomotorState.raw, 0).toFixed(3)),
        labelZh: UNIFIED_RULES?.dimensions?.locomotor?.burdenLabelZh || '移动负担',
        labelEn: UNIFIED_RULES?.dimensions?.locomotor?.burdenLabelEn || 'Movement Burden',
        vulnerability: Number(safeNumber(locomotorState.vulnerability, vulnerabilities.locomotor).toFixed(3)),
        speedPenaltyRatio: Number(safeNumber(locomotorState.speedPenaltyRatio, 0).toFixed(3)),
        crowdMultiplier: Number(safeNumber(locomotorState.crowdMultiplier, 1).toFixed(3)),
        baseSpeedPenalty: Number(safeNumber(locomotorState.baseSpeedPenalty, 0).toFixed(3)),
        crowdResistance: Number(safeNumber(locomotorState.crowdResistance, 0).toFixed(3)),
        queueResistance: Number(safeNumber(locomotorState.queueResistance, 0).toFixed(3)),
        narrowPassageResistance: Number(safeNumber(locomotorState.narrowPassageResistance, 0).toFixed(3)),
        verticalTransferResistance: Number(safeNumber(locomotorState.verticalTransferResistance, 0).toFixed(3)),
        assistiveDeviceResistance: Number(safeNumber(locomotorState.assistiveDeviceResistance, 0).toFixed(3)),
        obstacleAvoidanceResistance: Number(safeNumber(locomotorState.obstacleAvoidanceResistance, 0).toFixed(3)),
        microJam: Number(safeNumber(locomotorState.microJam, 0).toFixed(3)),
        movementBehavior: locomotorState.movementBehavior || locomotorState.behavior || 'normal_walk',
        movementMainCause: locomotorState.movementMainCause || 'speed',
        movementSpeedFactor: Number(safeNumber(locomotorState.movementSpeedFactor, safeNumber(locomotorState.speedFactor, 1)).toFixed(3)),
        wallFollowStrength: Number(safeNumber(locomotorState.wallFollowStrength, 0).toFixed(3)),
        nodeType: locomotorState.nodeType || 'generic',
        wallDistance: Number(safeNumber(locomotorState.wallDistance, 0).toFixed(3)),
        facilityEligibility: locomotorState.facilityEligibility
          ? { ...locomotorState.facilityEligibility }
          : getLocomotorFacilityEligibility(capacityScores, 'generic', queueCount),
      },
      sensory: {
        score: Number(sensoryScore.toFixed(2)),
        raw: Number(safeNumber(sensoryState.raw, 0).toFixed(3)),
        labelZh: UNIFIED_RULES?.dimensions?.sensory?.burdenLabelZh || '感知负担',
        labelEn: UNIFIED_RULES?.dimensions?.sensory?.burdenLabelEn || 'Sensory Burden',
        perceptionRadius,
        recognitionRate: Number(recognitionRate.toFixed(3)),
        vulnerability: Number(safeNumber(sensoryState.vulnerability, vulnerabilities.sensory).toFixed(3)),
        objectLoad: Number(safeNumber(sensoryState.objectLoad, sensoryObjectLoad).toFixed(3)),
        noisePenalty: Number(safeNumber(sensoryState.noisePenalty, 0).toFixed(3)),
        lightingPenalty: Number(safeNumber(sensoryState.lightingPenalty, 0).toFixed(3)),
        occlusionPenalty: Number(safeNumber(sensoryState.occlusionPenalty, 0).toFixed(3)),
        visualClutterPenalty: Number(safeNumber(sensoryState.visualClutterPenalty, 0).toFixed(3)),
        supportRelief: Number(safeNumber(sensoryState.supportRelief, 0).toFixed(3)),
        noiseThresholdDb: safeNumber(sensoryState.noiseThresholdDb, 999),
        lightingComfortLux: sensoryState.lightingComfortLux
          ? { ...sensoryState.lightingComfortLux }
          : { min: 0, max: 9999 },
        lightingSensitiveLux: sensoryState.lightingSensitiveLux
          ? { ...sensoryState.lightingSensitiveLux }
          : { min: 0, max: 9999 },
        sensitiveNoise: Boolean(sensoryState.sensitiveNoise),
        sensitiveLight: Boolean(sensoryState.sensitiveLight),
        hangingSignsInterference: Number(hangingSignsInterference.toFixed(3)),
        tactilePavingSupport: Number(clamp(tactilePavingSupport, 0, 1).toFixed(3)),
        audibleCueSupport: Number(clamp(audibleCueSupport, 0, 1).toFixed(3)),
        nearbyServiceSupport: Number(clamp(Math.max(nearbyServiceSupport, safeNumber(decisionInputs.serviceSupport, 0)), 0, 1).toFixed(3)),
        recognizedObjects: recognizedObjects.slice(0, 12),
        missedObjects: missedObjects.slice(0, 12),
      },
      cognitive: {
        score: Number(cognitiveScore.toFixed(2)),
        raw: Number(safeNumber(decisionState.raw, 0).toFixed(3)),
        labelZh: UNIFIED_RULES?.dimensions?.cognitive?.burdenLabelZh || '决策负担',
        labelEn: UNIFIED_RULES?.dimensions?.cognitive?.burdenLabelEn || 'Decision Burden',
        vulnerability: Number(safeNumber(decisionState.vulnerability, vulnerabilities.cognitive).toFixed(3)),
        branchComplexity: Number(safeNumber(decisionState.branchComplexity, 0).toFixed(3)),
        signConflict: Number(safeNumber(decisionState.signConflict, 0).toFixed(3)),
        pathComparisonCost: Number(safeNumber(decisionState.pathComparisonCost, 0).toFixed(3)),
        distractorLoad: Number(safeNumber(decisionState.distractorLoad, 0).toFixed(3)),
        noisePenalty: Number(safeNumber(decisionState.noisePenalty, 0).toFixed(3)),
        lightingPenalty: Number(safeNumber(decisionState.lightingPenalty, 0).toFixed(3)),
        crowdPenalty: Number(safeNumber(decisionState.crowdPenalty, 0).toFixed(3)),
        queueUncertainty: Number(safeNumber(decisionState.queueUncertainty, 0).toFixed(3)),
        guidanceSupport: Number(safeNumber(decisionState.guidanceSupport, 0).toFixed(3)),
        guideReviewLoad: Number(safeNumber(decisionState.guideReviewLoad, 0).toFixed(3)),
        timeDecay: Number(safeNumber(decisionState.timeDecay, 0).toFixed(3)),
        distanceDecay: Number(safeNumber(decisionState.distanceDecay, 0).toFixed(3)),
        memoryRetention: Number(safeNumber(decisionState.memoryRetention, 0).toFixed(3)),
        attentionFocus: Number(safeNumber(decisionState.attentionFocus, 0).toFixed(3)),
        problemSolving: Number(safeNumber(decisionState.problemSolving, 0).toFixed(3)),
        orientationConfidence: Number(safeNumber(decisionState.orientationConfidence, 0).toFixed(3)),
        decisionReactionTime: Number(safeNumber(decisionState.decisionReactionTime, 0).toFixed(3)),
        missGuideProbability: Number(safeNumber(decisionState.missGuideProbability, 0).toFixed(3)),
        wrongTurnProbability: Number(safeNumber(decisionState.wrongTurnProbability, 0).toFixed(3)),
        recheckProbability: Number(safeNumber(decisionState.recheckProbability, 0).toFixed(3)),
        backtrackProbability: Number(safeNumber(decisionState.backtrackProbability, 0).toFixed(3)),
        recheckPauseTime: Number(safeNumber(decisionState.recheckPauseTime, 0).toFixed(3)),
        recheckSlowWalkDuration: Number(safeNumber(decisionState.recheckSlowWalkDuration, 0).toFixed(3)),
        recheckSlowWalkFactor: Number(safeNumber(decisionState.recheckSlowWalkFactor, 1).toFixed(3)),
        guideReviewPauseTime: Number(safeNumber(decisionState.guideReviewPauseTime, 0).toFixed(3)),
        missGuideExtraPause: Number(safeNumber(decisionState.missGuideExtraPause, 0).toFixed(3)),
        wrongTurnAdvanceDistance: Number(safeNumber(decisionState.wrongTurnAdvanceDistance, 0).toFixed(3)),
        backtrackDistance: Number(safeNumber(decisionState.backtrackDistance, 0).toFixed(3)),
        backtrackPauseTime: Number(safeNumber(decisionState.backtrackPauseTime, 0).toFixed(3)),
        branchCount: Math.max(1, Math.round(safeNumber(decisionInputs.branchCount, 1))),
        conflictingSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.conflictingSignCount, 0))),
        candidatePathCount: Math.max(1, Math.round(safeNumber(decisionInputs.candidatePathCount, 1))),
        levelChange: Boolean(decisionInputs.levelChange),
        queueDecision: Boolean(decisionInputs.queueDecision),
        flashingAdCount: Math.max(0, Math.round(safeNumber(decisionInputs.flashingAdCount, 0))),
        staticAdCount: Math.max(0, Math.round(safeNumber(decisionInputs.staticAdCount, 0))),
        irrelevantSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.irrelevantSignCount, 0))),
        broadcastInterference: Math.max(0, Math.round(safeNumber(decisionInputs.broadcastInterference, 0))),
        relevantGuideCount: Math.max(0, Math.round(safeNumber(decisionInputs.relevantGuideCount, 0))),
        problemSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.problemSignCount, 0))),
        effectiveGuideDetected: Boolean(decisionInputs.effectiveGuideDetected),
        decisionNodeId: decisionInputs.decisionNodeId || null,
        decisionNodeLabel: decisionInputs.decisionNodeLabel || null,
        consideredObjects: (decisionInputs.consideredObjects || []).slice(0, 12),
      },
      psychological: {
        score: Number(psychologicalScore.toFixed(2)),
        raw: Number(psychologicalRaw.toFixed(3)),
        labelZh: UNIFIED_RULES?.dimensions?.psychological?.burdenLabelZh || '心理负担',
        labelEn: UNIFIED_RULES?.dimensions?.psychological?.burdenLabelEn || 'Psychological Burden',
        vulnerability: Number(safeNumber(psychologicalState.vulnerability, vulnerabilities.psychological).toFixed(3)),
        noiseStress: Number(safeNumber(psychologicalState.noiseStress, 0).toFixed(3)),
        lightingStress: Number(safeNumber(psychologicalState.lightingStress, 0).toFixed(3)),
        crowdStress: Number(safeNumber(psychologicalState.crowdStress, 0).toFixed(3)),
        queueStress: Number(safeNumber(psychologicalState.queueStress, 0).toFixed(3)),
        eventStress: Number(safeNumber(psychologicalState.eventStress, 0).toFixed(3)),
        guidanceSupport: Number(safeNumber(psychologicalState.guidanceSupport, 0).toFixed(3)),
        environmentalStress: Number(safeNumber(psychologicalState.environmentalStress, 0).toFixed(3)),
        arousal: Number(safeNumber(psychologicalState.arousal, 0).toFixed(3)),
        control: Number(safeNumber(psychologicalState.control, 0).toFixed(3)),
        recoveryBase: Number(safeNumber(psychologicalState.recoveryBase, 0).toFixed(3)),
        recovery: Number(safeNumber(psychologicalState.recovery, 0).toFixed(3)),
        mechanismRaw: Number(safeNumber(psychologicalState.raw, 0).toFixed(3)),
        ambientNoiseStress: Number(safeNumber(pressureState.ambientNoiseStress, 0).toFixed(3)),
        ambientCrowdingStress: Number(safeNumber(pressureState.ambientCrowdingStress, 0).toFixed(3)),
        ambientLightingStress: Number(safeNumber(pressureState.ambientLightingStress, 0).toFixed(3)),
        ambientQueueStress: Number(safeNumber(pressureState.ambientQueueStress, 0).toFixed(3)),
        persistentStress: Number(safeNumber(pressureState.persistentStress, 0).toFixed(3)),
        localVisibleStress: Number(safeNumber(pressureState.localVisibleStress, 0).toFixed(3)),
      },
      vitality: {
        score: Number(vitalityScore.toFixed(2)),
        raw: Number(currentFatigue.toFixed(3)),
        labelZh: UNIFIED_RULES?.dimensions?.vitality?.burdenLabelZh || '疲劳负担',
        labelEn: UNIFIED_RULES?.dimensions?.vitality?.burdenLabelEn || 'Fatigue Burden',
        fatigueRatioPercent: Number(fatigueRatioPercent.toFixed(2)),
        fatigueThreshold: Number(fatigueThreshold.toFixed(3)),
        vulnerability: Number(vulnerabilities.vitality.toFixed(3)),
        baseFatigueRatePercentPerSecond: Number(baseFatigueRatePercentPerSecond.toFixed(3)),
        fatigueRateMultiplier: Number(fatigueRateMultiplier.toFixed(3)),
        sensoryFatigueMultiplier: Number(fatigueRateComponents.sensory.toFixed(3)),
        locomotorFatigueMultiplier: Number(fatigueRateComponents.locomotor.toFixed(3)),
        psychologicalFatigueMultiplier: Number(fatigueRateComponents.psychological.toFixed(3)),
        cognitiveFatigueMultiplier: Number(fatigueRateComponents.cognitive.toFixed(3)),
        seatSearchThresholdPercent: safeNumber(profile?.seatSearchThresholdPercent, REST_RULES.seatSearchThresholdPercent),
        shortRestThresholdsPercent: Array.isArray(profile?.shortRestThresholdsPercent)
          ? profile.shortRestThresholdsPercent.slice()
          : getVitalityShortRestThresholds(capacityScores?.vitality),
      },
    };

    const topBurdenId = FIVE_DIMENSION_ORDER.reduce((bestId, id) => (
      safeNumber(burdens[id]?.score, 0) > safeNumber(burdens[bestId]?.score, 0) ? id : bestId
    ), FIVE_DIMENSION_ORDER[0]);

    return {
      rulesVersion: UNIFIED_RULES?.version || 'unknown',
      capacityScores,
      vulnerabilities,
      burdens,
      burdenScores: extractBurdenScores({ burdens }),
      summary: {
        topBurdenId,
        topBurdenScore: safeNumber(burdens[topBurdenId]?.score, 0),
        topBurdenLabelZh: burdens[topBurdenId]?.labelZh || topBurdenId,
        topBurdenLabelEn: burdens[topBurdenId]?.labelEn || topBurdenId,
      },
      environment: {
        crowdDensityLocal: Number(getUnifiedCrowdDensity(environment, 0).toFixed(3)),
        crowdDensityPerception: Number(getUnifiedCrowdDensity(environment, 0).toFixed(3)),
        noiseLevel: Number(safeNumber(environment.noiseLevel, BASE_ENVIRONMENT_NOISE).toFixed(3)),
        lightingLevel: Number(safeNumber(environment.lightingLevel, BASE_ENVIRONMENT_LIGHTING).toFixed(3)),
      },
      context: {
        nearbyNodes: nearbyNodes
          .slice()
          .sort((left, right) => left.distance - right.distance)
          .slice(0, 6)
          .map(({ node, distance: currentDistance, semantic }) => ({
            id: node.id,
            name: node.displayLabelEn || node.displayLabel || node.id,
            semanticId: semantic.semanticId,
            distance: Number(currentDistance.toFixed(2)),
          })),
        nearbySeats: nearbySeats
          .slice()
          .sort((left, right) => left.distance - right.distance)
          .slice(0, 6)
          .map(({ seat, distance: currentDistance }) => ({
            id: seat.id,
            name: seat.label || seat.id,
            distance: Number(currentDistance.toFixed(2)),
          })),
        topStressSources: serializeTopPressureSources(pressureState.contributions, 5),
        decisionInputs: {
          branchCount: Math.max(1, Math.round(safeNumber(decisionInputs.branchCount, 1))),
          conflictingSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.conflictingSignCount, 0))),
          candidatePathCount: Math.max(1, Math.round(safeNumber(decisionInputs.candidatePathCount, 1))),
          levelChange: Boolean(decisionInputs.levelChange),
          queueDecision: Boolean(decisionInputs.queueDecision),
          flashingAdCount: Math.max(0, Math.round(safeNumber(decisionInputs.flashingAdCount, 0))),
          staticAdCount: Math.max(0, Math.round(safeNumber(decisionInputs.staticAdCount, 0))),
          irrelevantSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.irrelevantSignCount, 0))),
          broadcastInterference: Math.max(0, Math.round(safeNumber(decisionInputs.broadcastInterference, 0))),
          queueCount: safeNumber(decisionInputs.queueCount, queueCount),
          timeSinceLastEffectiveGuide: Number(safeNumber(decisionInputs.timeSinceLastEffectiveGuide, 0).toFixed(3)),
          distanceSinceLastEffectiveGuide: Number(safeNumber(decisionInputs.distanceSinceLastEffectiveGuide, 0).toFixed(3)),
          continuousGuideCoverage: Number(safeNumber(decisionInputs.continuousGuideCoverage, 0).toFixed(3)),
          mapSupport: Number(safeNumber(decisionInputs.mapSupport, 0).toFixed(3)),
          serviceSupport: Number(safeNumber(decisionInputs.serviceSupport, 0).toFixed(3)),
          guideReviewLoad: Number(safeNumber(decisionInputs.guideReviewLoad, 0).toFixed(3)),
          relevantGuideCount: Math.max(0, Math.round(safeNumber(decisionInputs.relevantGuideCount, 0))),
          problemSignCount: Math.max(0, Math.round(safeNumber(decisionInputs.problemSignCount, 0))),
          effectiveGuideDetected: Boolean(decisionInputs.effectiveGuideDetected),
          decisionNodeId: decisionInputs.decisionNodeId || null,
          decisionNodeLabel: decisionInputs.decisionNodeLabel || null,
          consideredObjects: (decisionInputs.consideredObjects || []).slice(0, 12),
        },
      },
    };
  }

  function buildLLMDecisionContext(prepared, scenario, point, options) {
    const state = deriveFiveDimensionStateAtPoint(prepared, scenario, point, options);
    return {
      rulesVersion: state.rulesVersion,
      capacityScores: { ...state.capacityScores },
      vulnerabilities: { ...state.vulnerabilities },
      burdens: { ...state.burdenScores },
      environment: { ...state.environment },
      topBurdenId: state.summary.topBurdenId,
      recognizedObjects: state.burdens.sensory.recognizedObjects.slice(),
      missedObjects: state.burdens.sensory.missedObjects.slice(),
      consideredDecisionObjects: state.burdens.cognitive.consideredObjects.slice(),
      nearbyNodes: state.context.nearbyNodes.slice(),
      nearbySeats: state.context.nearbySeats.slice(),
      topStressSources: state.context.topStressSources.slice(),
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function safeNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getUnifiedCrowdDensity(source, fallback = 0) {
    return Math.max(
      0,
      safeNumber(
        source?.crowdDensityLocal,
        safeNumber(source?.crowdDensityPerception, fallback)
      )
    );
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function interpolateTraceMetricAtPoint(traceSnapshots, point, getMetric, options) {
    if (!Array.isArray(traceSnapshots) || !traceSnapshots.length || typeof getMetric !== 'function') {
      return { metric: 0, traceDistance: Number.POSITIVE_INFINITY, weightSum: 0 };
    }

    const corridorRadius = Math.max(0.1, safeNumber(options?.corridorRadius, 3));
    const influenceRadius = Math.max(
      corridorRadius,
      safeNumber(options?.influenceRadius, corridorRadius * 1.8)
    );
    const sigma = Math.max(0.35, safeNumber(options?.sigma, corridorRadius * 0.55));

    if (traceSnapshots.length === 1) {
      return {
        metric: Math.max(0, safeNumber(getMetric(traceSnapshots[0]), 0)),
        traceDistance: distance(point, traceSnapshots[0]),
        weightSum: 1,
      };
    }

    let bestDistance = Number.POSITIVE_INFINITY;
    let bestMetric = Math.max(0, safeNumber(getMetric(traceSnapshots[0]), 0));
    let weightedMetric = 0;
    let weightSum = 0;

    for (let index = 1; index < traceSnapshots.length; index += 1) {
      const start = traceSnapshots[index - 1];
      const end = traceSnapshots[index];
      const dx = safeNumber(end?.x, 0) - safeNumber(start?.x, 0);
      const dy = safeNumber(end?.y, 0) - safeNumber(start?.y, 0);
      const lengthSquared = dx * dx + dy * dy;
      const startMetric = Math.max(0, safeNumber(getMetric(start), 0));
      const endMetric = Math.max(0, safeNumber(getMetric(end), startMetric));

      if (lengthSquared <= 1e-9) {
        const pointDistance = distance(point, start);
        if (pointDistance < bestDistance) {
          bestDistance = pointDistance;
          bestMetric = startMetric;
        }
        if (pointDistance <= influenceRadius) {
          const weight = Math.exp(-Math.pow(pointDistance / sigma, 2));
          weightedMetric += startMetric * weight;
          weightSum += weight;
        }
        continue;
      }

      const projection = clamp(
        ((safeNumber(point?.x, 0) - safeNumber(start?.x, 0)) * dx + (safeNumber(point?.y, 0) - safeNumber(start?.y, 0)) * dy) / lengthSquared,
        0,
        1
      );
      const closestPoint = {
        x: safeNumber(start?.x, 0) + dx * projection,
        y: safeNumber(start?.y, 0) + dy * projection,
      };
      const traceDistance = distance(point, closestPoint);
      const interpolatedMetric = lerp(startMetric, endMetric, projection);
      if (traceDistance < bestDistance) {
        bestDistance = traceDistance;
        bestMetric = interpolatedMetric;
      }
      if (traceDistance > influenceRadius) {
        continue;
      }
      const segmentLength = Math.sqrt(lengthSquared);
      const weight = Math.exp(-Math.pow(traceDistance / sigma, 2)) * Math.max(0.35, Math.min(2.5, segmentLength));
      weightedMetric += interpolatedMetric * weight;
      weightSum += weight;
    }

    return {
      metric: weightSum > 1e-9 ? weightedMetric / weightSum : bestMetric,
      traceDistance: bestDistance,
      weightSum,
    };
  }

  function normalizeVector(vector, fallback) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length <= 1e-6) {
      return fallback || { x: 1, y: 0 };
    }
    return { x: vector.x / length, y: vector.y / length };
  }

  function rotateVector(vector, radians) {
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    return {
      x: vector.x * cosine - vector.y * sine,
      y: vector.x * sine + vector.y * cosine,
    };
  }

  function stableHash(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function getStableUnitSample(key, fallback = 0.5) {
    const sample = (((stableHash(String(key)) % 1000000) + 0.5) / 1000000);
    return clamp(Number.isFinite(sample) ? sample : fallback, 0, 0.999999);
  }

  function smoothStep01(value) {
    const t = clamp(safeNumber(value, 0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function sampleBackgroundFlowCurve(points, progress) {
    if (!Array.isArray(points) || !points.length) {
      return 0;
    }
    if (points.length === 1) {
      return safeNumber(points[0], 0);
    }
    const clampedProgress = clamp(safeNumber(progress, 0), 0, 1);
    const scaledProgress = clampedProgress * (points.length - 1);
    const pointIndex = Math.min(points.length - 2, Math.floor(scaledProgress));
    const localProgress = smoothStep01(scaledProgress - pointIndex);
    return lerp(
      safeNumber(points[pointIndex], 0),
      safeNumber(points[pointIndex + 1], 0),
      localProgress
    );
  }

  function refreshBackgroundFlowProfile(agent, scenario) {
    if (!agent || agent.isFocusAgent) {
      return;
    }
    const lapSerial = Math.max(0, Math.floor(safeNumber(agent.backgroundFlowLapSerial, 0)));
    const baseKey = `${agent.id || 'background'}:${agent.routeId || agent.route?.id || 'route'}:${lapSerial}`;
    const sampleUnit = (suffix) => getStableUnitSample(`${baseKey}:${suffix}`);
    const sampleSigned = (suffix) => (sampleUnit(suffix) - 0.5) * 2;
    agent.backgroundFlowProfile = {
      lateralCurve: [
        0,
        sampleSigned('lateral-a') * 0.92,
        sampleSigned('lateral-b'),
        sampleSigned('lateral-c') * 0.92,
        0,
      ],
      tangentialCurve: [
        0,
        sampleSigned('tangent-a') * 0.58,
        sampleSigned('tangent-b') * 0.78,
        0,
      ],
      lateralAmplitude: lerp(0.9, 1.82, sampleUnit('lateral-amp')),
      primarySwayAmplitude: lerp(BACKGROUND_FLOW_SWAY_AMPLITUDE * 0.62, BACKGROUND_FLOW_SWAY_AMPLITUDE, sampleUnit('primary-sway-amp')),
      primarySwayFrequency: lerp(1.8, 5.6, sampleUnit('primary-sway-frequency')),
      primarySwayPhase: sampleUnit('primary-sway-phase') * Math.PI * 2,
      secondarySwayAmplitude: lerp(0.18, 0.42, sampleUnit('secondary-sway-amp')),
      secondarySwayFrequency: lerp(4.2, 8.8, sampleUnit('secondary-sway-frequency')),
      secondarySwayPhase: sampleUnit('secondary-sway-phase') * Math.PI * 2,
      tangentialAmplitude: lerp(0.16, 0.64, sampleUnit('tangent-amp')),
      tangentialSwayAmplitude: lerp(0.08, 0.26, sampleUnit('tangent-sway-amp')),
      tangentialSwayFrequency: lerp(2.4, 6.9, sampleUnit('tangent-sway-frequency')),
      tangentialSwayPhase: sampleUnit('tangent-sway-phase') * Math.PI * 2,
      paceBias: lerp(-0.24, 0.24, sampleUnit('pace-bias')),
      paceCurve: [
        sampleSigned('pace-a') * 0.5,
        sampleSigned('pace-b') * 0.7,
        sampleSigned('pace-c') * 0.7,
        sampleSigned('pace-d') * 0.5,
      ],
      paceCurveAmplitude: lerp(0.05, 0.16, sampleUnit('pace-curve-amp')),
      paceSwayAmplitude: lerp(0.05, 0.14, sampleUnit('pace-sway-amp')),
      paceSwayFrequency: lerp(0.55, 1.95, sampleUnit('pace-sway-frequency')),
      paceSwayPhase: sampleUnit('pace-sway-phase') * Math.PI * 2,
    };
  }

  function normalizeRuleToken(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function includesAny(text, candidates) {
    return candidates.some((candidate) => text.includes(candidate));
  }

  function getPhysicalFatigueCoefficient(profile) {
    return PHYSICAL_FATIGUE_FACTORS.default;
  }

  function getEffectiveBasalFatigueVelocity(profile) {
    const capacityScores = normalizeCapacityScores(profile?.capacityScores || profile?.capacities || profile?.intrinsicCapacities, profile || {});
    return safeNumber(
      profile?.baseFatigueRatePercentPerSecond,
      getBaseFatigueRatePercentPerSecond(capacityScores.vitality)
    );
  }

  function createRng(seed) {
    return {
      state: seed >>> 0 || 0x12345678,
      next() {
        this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
        return this.state / 4294967296;
      },
    };
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
      const xi = polygon[index][0];
      const yi = polygon[index][1];
      const xj = polygon[previous][0];
      const yj = polygon[previous][1];
      const intersects = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
      if (intersects) {
        inside = !inside;
      }
    }
    return inside;
  }

  function computeBounds(polygons, points) {
    const xs = [];
    const ys = [];
    polygons.forEach((polygon) => {
      polygon.forEach(([x, y]) => {
        xs.push(x);
        ys.push(y);
      });
    });
    points.forEach((point) => {
      xs.push(point.x);
      ys.push(point.y);
    });
    if (!xs.length || !ys.length) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }

  function formatNodeLabel(node) {
    const raw = node.label || node.id || '节点';
    return raw.replaceAll('_', ' ');
  }

  function extractTrainDoorNumber(nodeId) {
    const match = String(nodeId || '').match(/^train_door_?(\d+)$/);
    return match ? match[1] : null;
  }

  function isTrainDoorLikeId(value) {
    const normalized = String(value || '');
    return normalized === 'train_door' || Boolean(extractTrainDoorNumber(normalized));
  }

  function isElevatorLikeId(value) {
    return String(value || '') === 'elev_3';
  }

  function isTrainDoorRouteOrigin(route) {
    if (!route) {
      return false;
    }
    if (isTrainDoorLikeId(route.startGroupId)) {
      return true;
    }
    if (String(route.family || '').startsWith('train_door_to_')) {
      return true;
    }
    return Array.isArray(route.startNodeIds) && route.startNodeIds.some((nodeId) => isTrainDoorLikeId(nodeId));
  }

  function isElevatorRouteOrigin(route) {
    if (!route) {
      return false;
    }
    if (isElevatorLikeId(route.startGroupId)) {
      return true;
    }
    return Array.isArray(route.startNodeIds) && route.startNodeIds.some((nodeId) => isElevatorLikeId(nodeId));
  }

  function gateRegionIdForNode(nodeId) {
    switch (String(nodeId || '')) {
      case 'gate_in_1':
      case 'gate_out_1':
        return 'exit_a';
      case 'gate_in_2':
      case 'gate_out_2':
      case 'gate_out_3':
        return 'exit_b';
      case 'gate_in_3':
      case 'gate_out_4':
        return 'exit_c';
      case 'gate_in_4':
      case 'gate_out_5':
        return 'exit_d';
      default:
        return null;
    }
  }

  function classifyNodeMetadata(node) {
    const nodeId = String(node.id || '');
    const gateRegionId = gateRegionIdForNode(nodeId);
    const trainDoorNumber = extractTrainDoorNumber(nodeId);
    if (nodeId.startsWith('gate_in_') && gateRegionId) {
      const exitCode = gateRegionId.replace('exit_', '').toUpperCase();
      return {
        nodeGroup: 'gate_in',
        displayLabelZh: `${exitCode}出口入口闸机`,
        displayLabelEn: `Exit ${exitCode} Entry Gate`,
        targetRegionIds: [gateRegionId],
        displayColor: NODE_GROUP_COLORS.gate_in,
      };
    }
    if (nodeId.startsWith('gate_out_') && gateRegionId) {
      const exitCode = gateRegionId.replace('exit_', '').toUpperCase();
      return {
        nodeGroup: 'gate_out',
        displayLabelZh: `${exitCode}出口出口闸机`,
        displayLabelEn: `Exit ${exitCode} Exit Gate`,
        targetRegionIds: [gateRegionId],
        displayColor: NODE_GROUP_COLORS.gate_out,
      };
    }
    if (trainDoorNumber) {
      return {
        nodeGroup: 'chai_wan_train',
        displayLabelZh: `柴湾方向乘车点${trainDoorNumber}`,
        displayLabelEn: `Chai Wan Platform ${trainDoorNumber}`,
        targetRegionIds: ['chai_wan'],
        displayColor: NODE_GROUP_COLORS.chai_wan_train,
      };
    }

    const explicitMap = {
      es_up_1_top: { nodeGroup: 'kdt_up', displayLabelZh: '坚尼地城方向上行1', displayLabelEn: 'Kennedy Town Up 1', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.kdt_up },
      es_up_2_top: { nodeGroup: 'kdt_up', displayLabelZh: '坚尼地城方向上行2', displayLabelEn: 'Kennedy Town Up 2', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.kdt_up },
      es_up_4_top: { nodeGroup: 'kdt_up', displayLabelZh: '坚尼地城方向上行4', displayLabelEn: 'Kennedy Town Up 4', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.kdt_up },
      es_down_1_top: { nodeGroup: 'kdt_down', displayLabelZh: '坚尼地城方向下行1', displayLabelEn: 'Kennedy Town Down 1', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.kdt_down },
      es_down_4_top: { nodeGroup: 'kdt_down', displayLabelZh: '坚尼地城方向下行4', displayLabelEn: 'Kennedy Town Down 4', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.kdt_down },
      stair_2_top: { nodeGroup: 'stair', displayLabelZh: '坚尼地城方向楼梯2', displayLabelEn: 'Kennedy Town Stair 2', targetRegionIds: ['kdt'], displayColor: NODE_GROUP_COLORS.stair },
      elev_3: { nodeGroup: 'elevator', displayLabelZh: '直升电梯', displayLabelEn: 'Lift', targetRegionIds: ['twl', 'kdt'], displayColor: NODE_GROUP_COLORS.elevator },
      es_up_5_top: { nodeGroup: 'twl_up', displayLabelZh: '荃湾线上行5', displayLabelEn: 'Tsuen Wan Up 5', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_up },
      es_up_6_top: { nodeGroup: 'twl_up', displayLabelZh: '荃湾线上行6', displayLabelEn: 'Tsuen Wan Up 6', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_up },
      es_up_7_top: { nodeGroup: 'twl_up', displayLabelZh: '荃湾线上行7', displayLabelEn: 'Tsuen Wan Up 7', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_up },
      es_up_8_top: { nodeGroup: 'twl_up', displayLabelZh: '荃湾线上行8', displayLabelEn: 'Tsuen Wan Up 8', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_up },
      es_down_5_top: { nodeGroup: 'twl_down', displayLabelZh: '荃湾线下行5', displayLabelEn: 'Tsuen Wan Down 5', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_down },
      es_down_6_top: { nodeGroup: 'twl_down', displayLabelZh: '荃湾线下行6', displayLabelEn: 'Tsuen Wan Down 6', targetRegionIds: ['twl'], displayColor: NODE_GROUP_COLORS.twl_down },
    };
    if (explicitMap[nodeId]) {
      return explicitMap[nodeId];
    }

    return {
      nodeGroup: 'node',
      displayLabelZh: formatNodeLabel(node),
      displayLabelEn: formatNodeLabel(node),
      targetRegionIds: [],
      displayColor: NODE_GROUP_COLORS.node,
    };
  }

  function createTargetRegions(nodes) {
    const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const regionDefinitions = [
      { id: 'exit_a', labelZh: 'A出口', labelEn: 'Exit A', nodeIds: ['gate_in_1', 'gate_out_1'] },
      { id: 'exit_b', labelZh: 'B出口', labelEn: 'Exit B', nodeIds: ['gate_in_2', 'gate_out_2', 'gate_out_3'] },
      { id: 'exit_c', labelZh: 'C出口', labelEn: 'Exit C', nodeIds: ['gate_in_3', 'gate_out_4'] },
      { id: 'exit_d', labelZh: 'D出口', labelEn: 'Exit D', nodeIds: ['gate_in_4', 'gate_out_5'] },
      {
        id: 'chai_wan',
        labelZh: '港岛线柴湾方向',
        labelEn: 'Island Line · Chai Wan',
        nodeIds: nodes.filter((node) => extractTrainDoorNumber(node.id)).map((node) => node.id),
      },
      {
        id: 'twl',
        labelZh: '荃湾线',
        labelEn: 'Tsuen Wan Line',
        nodeIds: ['es_up_5_top', 'es_up_6_top', 'es_down_5_top', 'es_up_7_top', 'es_down_6_top', 'es_up_8_top', 'elev_3'],
      },
      {
        id: 'kdt',
        labelZh: '港岛线坚尼地城方向',
        labelEn: 'Island Line · Kennedy Town',
        nodeIds: ['es_up_1_top', 'es_down_1_top', 'es_up_4_top', 'es_down_4_top', 'es_up_2_top', 'stair_2_top', 'elev_3'],
      },
    ];

    const targetRegions = regionDefinitions
      .map((definition) => {
        const regionNodes = definition.nodeIds.map((id) => nodeById[id]).filter(Boolean);
        if (!regionNodes.length) {
          return null;
        }
        return {
          id: definition.id,
          labelZh: definition.labelZh,
          labelEn: definition.labelEn,
          nodeIds: regionNodes.map((node) => node.id),
          anchor: averagePoint(regionNodes),
          displayColor: TARGET_REGION_COLORS[definition.id] || '#94a3b8',
        };
      })
      .filter(Boolean);

    return {
      targetRegions,
      targetRegionById: Object.fromEntries(targetRegions.map((region) => [region.id, region])),
    };
  }

  function normalizePolygon(polygon) {
    return polygon.map((point) => [safeNumber(point[0], 0), safeNumber(point[1], 0)]);
  }

  function averagePoint(points) {
    if (!points.length) {
      return { x: 0, y: 0, z: 0 };
    }
    const total = points.reduce(
      (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + safeNumber(point.z, 0) }),
      { x: 0, y: 0, z: 0 }
    );
    return { x: total.x / points.length, y: total.y / points.length, z: total.z / points.length };
  }

  function ensureId(item, index, prefix) {
    if (item.id) {
      return String(item.id);
    }
    if (item.name) {
      return String(item.name);
    }
    return `${prefix}_${index}`;
  }

  function ensureUniqueIdentifier(baseId, seenIds) {
    let candidate = String(baseId || 'item');
    let suffix = 2;
    while (seenIds.has(candidate)) {
      candidate = `${baseId}__${suffix}`;
      suffix += 1;
    }
    seenIds.add(candidate);
    return candidate;
  }

  function resolveSimulationCrowdTotal(requestedTotal) {
    const safeRequested = Math.max(1, Math.round(safeNumber(requestedTotal, CROWD_INPUT_MARKERS[1].requested)));
    if (safeRequested <= CROWD_INPUT_MARKERS[0].requested) {
      return CROWD_INPUT_MARKERS[0].simulated;
    }
    if (safeRequested >= CROWD_INPUT_MARKERS[CROWD_INPUT_MARKERS.length - 1].requested) {
      return CROWD_INPUT_MARKERS[CROWD_INPUT_MARKERS.length - 1].simulated;
    }
    for (let index = 1; index < CROWD_INPUT_MARKERS.length; index += 1) {
      const left = CROWD_INPUT_MARKERS[index - 1];
      const right = CROWD_INPUT_MARKERS[index];
      if (safeRequested <= right.requested) {
        const span = right.requested - left.requested || 1;
        const amount = (safeRequested - left.requested) / span;
        return Math.max(2, Math.round(lerp(left.simulated, right.simulated, amount)));
      }
    }
    return CROWD_INPUT_MARKERS[CROWD_INPUT_MARKERS.length - 1].simulated;
  }

  function isWalkablePoint(prepared, point) {
    const inWalkable = prepared.walkableAreas.some((polygon) => pointInPolygon(point, polygon));
    if (!inWalkable) {
      return false;
    }
    const inObstacle = prepared.obstacles.some((polygon) => pointInPolygon(point, polygon));
    return !inObstacle;
  }

  function categoryWeight(category) {
    return PRESSURE_WEIGHTS[category] || PRESSURE_WEIGHTS.unknown;
  }

  function computeStaticPressure(prepared, point) {
    let total = 0;
    prepared.activePressureObjects.forEach((pressurePoint) => {
      const currentDistance = distance(point, pressurePoint);
      const effectiveRange = Math.max(1.2, pressurePoint.range || 0);
      const influence = pressurePoint.strength * categoryWeight(pressurePoint.category) * Math.exp(-Math.pow(currentDistance / effectiveRange, 2));
      total += influence;
    });
    return clamp(total * 42, 0, 100);
  }

  function createGrid(prepared, requestedCellSize) {
    const cellSize = requestedCellSize || GRID_CELL_SIZE;
    const margin = cellSize * 2;
    const width = prepared.bounds.width + margin * 2;
    const height = prepared.bounds.height + margin * 2;
    const cols = Math.max(1, Math.ceil(width / cellSize));
    const rows = Math.max(1, Math.ceil(height / cellSize));
    const originX = prepared.bounds.minX - margin + cellSize * 0.5;
    const originY = prepared.bounds.minY - margin + cellSize * 0.5;
    const cells = [];
    const walkableIndices = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const index = row * cols + col;
        const x = originX + col * cellSize;
        const y = originY + row * cellSize;
        const cell = {
          index,
          row,
          col,
          x,
          y,
          walkable: isWalkablePoint(prepared, { x, y }),
          neighbors: [],
          edgeFactor: 0,
          pressureCost: 0,
        };
        cells.push(cell);
        if (cell.walkable) {
          walkableIndices.push(index);
        }
      }
    }

    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    walkableIndices.forEach((index) => {
      const cell = cells[index];
      let blockedCount = 0;
      directions.forEach(([dx, dy]) => {
        const col = cell.col + dx;
        const row = cell.row + dy;
        if (col < 0 || col >= cols || row < 0 || row >= rows) {
          blockedCount += 1;
          return;
        }
        const neighbor = cells[row * cols + col];
        if (!neighbor.walkable) {
          blockedCount += 1;
          return;
        }
        cell.neighbors.push(neighbor.index);
      });
      cell.edgeFactor = blockedCount / directions.length;
      cell.pressureCost = computeStaticPressure(prepared, cell) / 100;
    });

    const wallSearchRadius = Math.ceil(3.6 / cellSize);
    walkableIndices.forEach((index) => {
      const cell = cells[index];
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let row = cell.row - wallSearchRadius; row <= cell.row + wallSearchRadius; row += 1) {
        for (let col = cell.col - wallSearchRadius; col <= cell.col + wallSearchRadius; col += 1) {
          const dx = col - cell.col;
          const dy = row - cell.row;
          const gridDistance = Math.sqrt(dx * dx + dy * dy) * cellSize;
          if (gridDistance >= bestDistance) {
            continue;
          }
          if (row < 0 || row >= rows || col < 0 || col >= cols) {
            bestDistance = Math.min(bestDistance, gridDistance);
            continue;
          }
          const neighbor = cells[row * cols + col];
          if (!neighbor.walkable) {
            bestDistance = Math.min(bestDistance, gridDistance);
          }
        }
      }
      cell.wallDistance = Number.isFinite(bestDistance) ? bestDistance : wallSearchRadius * cellSize;
    });

    return { cellSize, cols, rows, originX, originY, cells, walkableIndices };
  }

  function pointToGridCoord(grid, point) {
    return {
      col: Math.round((point.x - grid.originX) / grid.cellSize),
      row: Math.round((point.y - grid.originY) / grid.cellSize),
    };
  }

  function getCell(grid, row, col) {
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
      return null;
    }
    return grid.cells[row * grid.cols + col] || null;
  }

  function findNearestWalkableCell(grid, point) {
    let nearest = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    grid.walkableIndices.forEach((index) => {
      const cell = grid.cells[index];
      const currentDistance = distance(cell, point);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        nearest = cell;
      }
    });
    return nearest;
  }

  function projectPointToWalkable(prepared, point, options) {
    const minimumClearance = Math.max(0, safeNumber(options?.minimumClearance, 0));
    const grid = prepared.grid;
    if (!grid) {
      return { x: point.x, y: point.y };
    }
    const currentCell = findNearestWalkableCell(grid, point);
    if (currentCell && isWalkablePoint(prepared, point) && currentCell.wallDistance >= minimumClearance) {
      return { x: point.x, y: point.y };
    }
    let bestCell = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    grid.walkableIndices.forEach((index) => {
      const cell = grid.cells[index];
      if ((cell.wallDistance || 0) + 1e-6 < minimumClearance) {
        return;
      }
      const currentDistance = distance(cell, point);
      if (currentDistance < bestDistance) {
        bestDistance = currentDistance;
        bestCell = cell;
      }
    });
    if (!bestCell && minimumClearance > 0) {
      return projectPointToWalkable(prepared, point, { minimumClearance: 0 });
    }
    return bestCell ? { x: bestCell.x, y: bestCell.y } : { x: point.x, y: point.y };
  }

  function lineIsWalkable(start, end, prepared, options) {
    const grid = prepared.grid;
    const minimumClearance = Math.max(0, safeNumber(options?.minimumClearance, 1));
    const requiredClearance = Math.max(minimumClearance, WALL_CLEARANCE_TARGET * 0.72);
    const total = distance(start, end);
    if (total <= 1e-6) {
      const projected = projectPointToWalkable(prepared, start, { minimumClearance: requiredClearance });
      return distance(projected, start) <= grid.cellSize * 0.5;
    }
    const steps = Math.max(2, Math.ceil(total / (grid.cellSize * 0.5)));
    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps;
      const probe = { x: lerp(start.x, end.x, t), y: lerp(start.y, end.y, t) };
      const nearest = findNearestWalkableCell(grid, probe);
      const endpointRelief = t <= 0.08 || t >= 0.92;
      if (!nearest || !isWalkablePoint(prepared, probe) || distance(nearest, probe) > grid.cellSize * 0.9) {
        return false;
      }
      if (!endpointRelief && (nearest.wallDistance || 0) + 1e-6 < requiredClearance) {
        return false;
      }
    }
    return true;
  }

  function smoothPolyline(points, prepared) {
    if (points.length <= 2) {
      return points;
    }
    const smoothed = [points[0]];
    let anchorIndex = 0;
    while (anchorIndex < points.length - 1) {
      let targetIndex = points.length - 1;
      while (targetIndex > anchorIndex + 1 && !lineIsWalkable(points[anchorIndex], points[targetIndex], prepared)) {
        targetIndex -= 1;
      }
      smoothed.push(points[targetIndex]);
      anchorIndex = targetIndex;
    }
    return smoothed;
  }

  function buildPolyline(points) {
    const sanitized = [];
    points.forEach((point) => {
      if (!sanitized.length || distance(sanitized[sanitized.length - 1], point) > 1e-6) {
        sanitized.push({ x: point.x, y: point.y });
      }
    });

    const segments = [];
    let length = 0;
    for (let index = 0; index < sanitized.length - 1; index += 1) {
      const start = sanitized[index];
      const end = sanitized[index + 1];
      const segmentLength = distance(start, end);
      if (segmentLength <= 1e-6) {
        continue;
      }
      const tangent = normalizeVector({ x: end.x - start.x, y: end.y - start.y });
      segments.push({
        start,
        end,
        startLength: length,
        endLength: length + segmentLength,
        length: segmentLength,
        tangent,
        normal: { x: -tangent.y, y: tangent.x },
      });
      length += segmentLength;
    }

    return { points: sanitized, segments, length };
  }

  function samplePolyline(polyline, distanceAlong) {
    if (!polyline.length || !polyline.segments.length) {
      const fallback = polyline.points[0] || { x: 0, y: 0 };
      return { x: fallback.x, y: fallback.y, progress: 0, tangent: { x: 1, y: 0 }, normal: { x: 0, y: 1 } };
    }
    const target = clamp(distanceAlong, 0, polyline.length);
    const segment = polyline.segments.find((candidate) => target <= candidate.endLength) || polyline.segments[polyline.segments.length - 1];
    const localT = clamp((target - segment.startLength) / segment.length, 0, 1);
    return {
      x: lerp(segment.start.x, segment.end.x, localT),
      y: lerp(segment.start.y, segment.end.y, localT),
      progress: polyline.length <= 1e-6 ? 0 : target / polyline.length,
      tangent: segment.tangent,
      normal: segment.normal,
    };
  }

  function reconstructPath(cameFrom, currentIndex, prepared, startPoint, endPoint) {
    const grid = prepared.grid;
    const indices = [currentIndex];
    while (cameFrom[indices[indices.length - 1]] !== undefined) {
      indices.push(cameFrom[indices[indices.length - 1]]);
    }
    indices.reverse();
    const rawPoints = [startPoint, ...indices.map((index) => ({ x: grid.cells[index].x, y: grid.cells[index].y })), endPoint];
    const polyline = buildPolyline(smoothPolyline(rawPoints, prepared));
    return {
      indices,
      cells: indices.map((index) => grid.cells[index]),
      points: polyline.points,
      segments: polyline.segments,
      length: polyline.length,
      startPoint,
      endPoint,
    };
  }

  function findPath(prepared, startPoint, endPoint) {
    const grid = prepared.grid;
    const safeStartPoint = projectPointToWalkable(prepared, startPoint, { minimumClearance: 1 });
    const safeEndPoint = projectPointToWalkable(prepared, endPoint, { minimumClearance: 1 });
    const startCell = findNearestWalkableCell(grid, safeStartPoint);
    const endCell = findNearestWalkableCell(grid, safeEndPoint);
    if (!startCell || !endCell) {
      return null;
    }

    const open = new Set([startCell.index]);
    const closed = new Set();
    const cameFrom = {};
    const gScore = { [startCell.index]: 0 };
    const fScore = { [startCell.index]: distance(startCell, endCell) };

    while (open.size) {
      let currentIndex = null;
      let currentBest = Number.POSITIVE_INFINITY;
      open.forEach((candidate) => {
        const score = fScore[candidate] ?? Number.POSITIVE_INFINITY;
        if (score < currentBest) {
          currentBest = score;
          currentIndex = candidate;
        }
      });

      if (currentIndex === endCell.index) {
        return reconstructPath(cameFrom, currentIndex, prepared, safeStartPoint, safeEndPoint);
      }

      open.delete(currentIndex);
      closed.add(currentIndex);
      const currentCell = grid.cells[currentIndex];

      currentCell.neighbors.forEach((neighborIndex) => {
        if (closed.has(neighborIndex)) {
          return;
        }
        const neighbor = grid.cells[neighborIndex];
        const stepDistance = distance(currentCell, neighbor);
        const endpointRelief = distance(neighbor, safeStartPoint) <= ENDPOINT_RELIEF_RADIUS || distance(neighbor, safeEndPoint) <= ENDPOINT_RELIEF_RADIUS;
        const clearanceShortage = endpointRelief ? 0 : Math.max(0, WALL_CLEARANCE_TARGET - (neighbor.wallDistance || 0));
        const clearancePenalty = endpointRelief ? 0 : Math.pow(clearanceShortage / WALL_CLEARANCE_TARGET, 2) * 3.6;
        const wallPenalty = neighbor.edgeFactor * 1.85 + clearancePenalty;
        const pressurePenalty = neighbor.pressureCost * 0.28;
        let turnPenalty = 0;
        const previousIndex = cameFrom[currentIndex];
        if (previousIndex !== undefined) {
          const previous = grid.cells[previousIndex];
          const before = normalizeVector({ x: currentCell.x - previous.x, y: currentCell.y - previous.y });
          const after = normalizeVector({ x: neighbor.x - currentCell.x, y: neighbor.y - currentCell.y });
          const turnIntensity = 1 - clamp(before.x * after.x + before.y * after.y, -1, 1);
          turnPenalty = Math.pow(turnIntensity, 1.2) * 1.35;
        }

        const tentativeG = (gScore[currentIndex] ?? Number.POSITIVE_INFINITY) + stepDistance * (1 + wallPenalty + pressurePenalty + turnPenalty);
        if (tentativeG < (gScore[neighborIndex] ?? Number.POSITIVE_INFINITY)) {
          cameFrom[neighborIndex] = currentIndex;
          gScore[neighborIndex] = tentativeG;
          fScore[neighborIndex] = tentativeG + distance(neighbor, endCell);
          open.add(neighborIndex);
        }
      });
    }

    return null;
  }

  function getNearbyCells(grid, point, radius) {
    const coord = pointToGridCoord(grid, point);
    const cellRadius = Math.ceil(radius / grid.cellSize) + 1;
    const cells = [];
    for (let row = coord.row - cellRadius; row <= coord.row + cellRadius; row += 1) {
      for (let col = coord.col - cellRadius; col <= coord.col + cellRadius; col += 1) {
        const cell = getCell(grid, row, col);
        if (!cell || !cell.walkable) {
          continue;
        }
        if (distance(cell, point) <= radius + grid.cellSize) {
          cells.push(cell);
        }
      }
    }
    return cells;
  }

  function buildFocusProfile(params) {
    const profile = {
      agentId: 'focus-agent',
      ...(params || {}),
    };
    return attachCapacityScoresToProfile(profile);
  }

  function sampleWithoutReplacement(items, count, rng) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng.next() * (index + 1));
      const temp = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = temp;
    }
    return copy.slice(0, count);
  }

  function sampleProfilesForCount(items, count, rng) {
    if (!Array.isArray(items) || !items.length || count <= 0) {
      return [];
    }
    if (count <= items.length) {
      return sampleWithoutReplacement(items, count, rng);
    }
    const selected = sampleWithoutReplacement(items, items.length, rng);
    while (selected.length < count) {
      selected.push({ ...items[Math.floor(rng.next() * items.length)] });
    }
    return selected;
  }

  function chooseWeighted(items, rng) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const target = rng.next() * totalWeight;
    let cursor = 0;
    for (let index = 0; index < items.length; index += 1) {
      cursor += items[index].weight;
      if (target <= cursor) {
        return items[index];
      }
    }
    return items[items.length - 1];
  }

  function ensureBackgroundRouteSelectionState(scenario) {
    if (scenario.backgroundRouteSelectionState) {
      return scenario.backgroundRouteSelectionState;
    }
    const trainDoorRouteWeightById = {};
    const trainDoorIds = Array.from(new Set(
      (scenario.backgroundRoutePool || [])
        .map((route) => {
          const endGroupId = route?.endGroupId || null;
          if (endGroupId && extractTrainDoorNumber(endGroupId)) {
            trainDoorRouteWeightById[endGroupId] = safeNumber(trainDoorRouteWeightById[endGroupId], 0) + Math.max(0, safeNumber(route.weight, 0));
            return endGroupId;
          }
          return null;
        })
        .filter(Boolean)
    )).sort();
    const trainDoorMeanRouteWeight = trainDoorIds.length
      ? trainDoorIds.reduce((sum, id) => sum + safeNumber(trainDoorRouteWeightById[id], 0), 0) / trainDoorIds.length
      : 0;
    scenario.backgroundRouteSelectionState = {
      byEndGroup: {},
      trainDoorIds,
      trainDoorRouteWeightById,
      trainDoorMeanRouteWeight,
    };
    return scenario.backgroundRouteSelectionState;
  }

  function getBackgroundRouteSelectionWeight(scenario, route) {
    let weight = Math.max(1e-6, safeNumber(route?.weight, 0));
    if (shouldDeferBackgroundTrainDoorRespawn(scenario, route)) {
      return 0;
    }
    const endGroupId = route?.endGroupId || route?.endNodeIds?.[0] || null;
    if (!endGroupId) {
      return weight;
    }
    if (String(endGroupId) === 'elev_3') {
      weight *= BACKGROUND_ELEVATOR_ROUTE_WEIGHT_FACTOR;
    }
    if (extractTrainDoorNumber(endGroupId)) {
      const state = ensureBackgroundRouteSelectionState(scenario);
      const normalizedDoorWeight = safeNumber(state.trainDoorRouteWeightById?.[endGroupId], 0);
      const meanDoorWeight = safeNumber(state.trainDoorMeanRouteWeight, normalizedDoorWeight);
      if (normalizedDoorWeight > 1e-6 && meanDoorWeight > 1e-6) {
        weight *= clamp(meanDoorWeight / normalizedDoorWeight, 0.75, 1.8);
      }
      const totalAssigned = state.trainDoorIds.reduce((sum, id) => sum + safeNumber(state.byEndGroup[id], 0), 0);
      const meanAssigned = state.trainDoorIds.length ? totalAssigned / state.trainDoorIds.length : 0;
      const currentAssigned = safeNumber(state.byEndGroup[endGroupId], 0);
      const balanceFactor = clamp(
        1 + (meanAssigned - currentAssigned) * BACKGROUND_TRAIN_BALANCE_STRENGTH,
        BACKGROUND_TRAIN_BALANCE_MIN_FACTOR,
        BACKGROUND_TRAIN_BALANCE_MAX_FACTOR
      );
      weight *= balanceFactor;
    }
    return weight;
  }

  function recordBackgroundRouteSelection(scenario, route) {
    if (!route) {
      return;
    }
    const state = ensureBackgroundRouteSelectionState(scenario);
    const endGroupId = route.endGroupId || route.endNodeIds?.[0] || null;
    if (!endGroupId) {
      return;
    }
    state.byEndGroup[endGroupId] = Math.max(0, safeNumber(state.byEndGroup[endGroupId], 0)) + 1;
  }

  function chooseBackgroundRouteForScenario(scenario, rng) {
    const pool = Array.isArray(scenario?.backgroundRoutePool) ? scenario.backgroundRoutePool : [];
    if (!pool.length) {
      return null;
    }
    const weightedPool = pool.map((route) => ({
      route,
      weight: getBackgroundRouteSelectionWeight(scenario, route),
    }));
    const selected = chooseWeighted(weightedPool, rng);
    const route = selected?.route || pool[0];
    recordBackgroundRouteSelection(scenario, route);
    return route;
  }

  function getRouteAnchorDistance(route) {
    const startX = safeNumber(route?.startAnchor?.x, 0);
    const startY = safeNumber(route?.startAnchor?.y, 0);
    const endX = safeNumber(route?.endAnchor?.x, 0);
    const endY = safeNumber(route?.endAnchor?.y, 0);
    return Math.hypot(startX - endX, startY - endY);
  }

  function isEligibleBackgroundRoute(route) {
    return getRouteAnchorDistance(route) >= 8;
  }

  function suggestionForCategory(category) {
    switch (category) {
      case 'noise_congestion':
        return '该区域靠近扶梯口且存在汇流压力，建议增加缓冲区并重整交织流线。';
      case 'advert':
        return '建议降低高亮广告与地贴密度，减少视觉分心带来的停顿。';
      case 'signage':
      case 'decision':
        return '建议提前布置连续导向信息，降低换向和决策压力。';
      case 'noise':
        return '建议降低噪声干扰并增强播报或可辨识引导信息。';
      case 'facility':
        return '建议优化咨询设施的位置、识别度与停留组织，减少额外判断与停顿压力。';
      default:
        return '建议继续观察该区域的人流组织与设施布置方式。';
    }
  }

  function createEndpointCollections(nodeById) {
    const nodes = Object.values(nodeById);
    const targetRegionData = createTargetRegions(nodes);
    const targetRegionById = targetRegionData.targetRegionById;
    const createEndpoint = (id, label, role, direction, lineFamily, endpointNodes) => {
      const validNodes = (endpointNodes || []).filter(Boolean);
      if (!validNodes.length) {
        return null;
      }
      return {
        id,
        label,
        role,
        direction,
        lineFamily,
        nodeIds: validNodes.map((node) => node.id),
        anchor: averagePoint(validNodes),
        weight: 1,
      };
    };
    const normalizeWeights = (items) => {
      if (!items.length) {
        return items;
      }
      const weight = 1 / items.length;
      return items.map((item) => ({ ...item, weight }));
    };

    const collections = {
      gate_in: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'gate_in')
          .sort((left, right) => left.id.localeCompare(right.id))
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'gate_in', 'entry', 'gate', [node]))
          .filter(Boolean)
      ),
      gate_out: normalizeWeights(
        ['exit_a', 'exit_b', 'exit_c', 'exit_d']
          .map((regionId) => targetRegionById[regionId])
          .filter(Boolean)
          .map((region) => createEndpoint(region.id, region.labelEn || region.labelZh || region.id, 'gate_out', 'exit', 'gate', region.nodeIds.map((id) => nodeById[id]).filter(Boolean)))
          .filter(Boolean)
      ),
      train_door: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'chai_wan_train')
          .sort((left, right) => left.id.localeCompare(right.id))
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'platform', 'same_level', 'island_chai_wan', [node]))
          .filter(Boolean)
      ),
      twl_up: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'twl_up' || node.nodeGroup === 'elevator')
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'twl_up', 'arrival', 'twl', [node]))
          .filter(Boolean)
      ),
      twl_down: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'twl_down' || node.nodeGroup === 'elevator')
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'twl_down', 'departure', 'twl', [node]))
          .filter(Boolean)
      ),
      kdt_up: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'kdt_up' || node.nodeGroup === 'stair' || node.nodeGroup === 'elevator')
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'kdt_up', 'arrival', 'island_kdt', [node]))
          .filter(Boolean)
      ),
      kdt_down: normalizeWeights(
        nodes
          .filter((node) => node.nodeGroup === 'kdt_down' || node.nodeGroup === 'stair' || node.nodeGroup === 'elevator')
          .map((node) => createEndpoint(node.id, node.displayLabelEn || node.displayLabel || node.id, 'kdt_down', 'departure', 'island_kdt', [node]))
          .filter(Boolean)
      ),
    };

    const endpointGroups = Object.values(collections).flat();
    return {
      collections,
      endpointGroups,
      endpointGroupById: Object.fromEntries(endpointGroups.map((group) => [group.id, group])),
    };
  }

  function createODRoutes(collections) {
    const routes = [];
    ROUTE_FAMILY_RULES.forEach((rule) => {
      const startEndpoints = collections[rule.startCollection] || [];
      const endEndpoints = collections[rule.endCollection] || [];
      startEndpoints.forEach((start) => {
        endEndpoints.forEach((end) => {
          routes.push({
            id: `${rule.family}__${start.id}__${end.id}`,
            family: rule.family,
            startGroupId: start.id,
            endGroupId: end.id,
            startAnchor: start.anchor,
            endAnchor: end.anchor,
            startNodeIds: start.nodeIds,
            endNodeIds: end.nodeIds,
            weight: rule.weight * start.weight * end.weight,
            isFocusPreset: false,
            label: `${start.label} → ${end.label}`,
          });
        });
      });
    });
    return routes;
  }

  function facilityModeForNode(node) {
    if (!node) {
      return 'generic';
    }
    if (node.nodeGroup === 'elevator') {
      return 'elevator';
    }
    if (node.nodeGroup === 'stair') {
      return 'stair';
    }
    if (String(node.id || '').includes('down') || String(node.nodeGroup || '').endsWith('_down')) {
      return 'escalator_down';
    }
    if (String(node.id || '').includes('up') || String(node.nodeGroup || '').endsWith('_up')) {
      return 'escalator_up';
    }
    if (node.nodeGroup === 'gate_out') {
      return 'gate_out';
    }
    if (node.nodeGroup === 'gate_in') {
      return 'gate_in';
    }
    if (node.nodeGroup === 'chai_wan_train') {
      return 'platform';
    }
    return 'generic';
  }

  function getFacilitySwitchProbability(queueCount) {
    const normalizedQueue = Math.max(0, Math.floor(safeNumber(queueCount, 0)));
    if (normalizedQueue < 4) {
      return 0;
    }
    if (normalizedQueue <= 5) {
      return 0.225;
    }
    if (normalizedQueue <= 10) {
      return 0.55;
    }
    return 0.875;
  }

  function estimateFacilityWaitTime(node, queueCount) {
    const normalizedQueue = Math.max(0, safeNumber(queueCount, 0));
    const facilityMode = facilityModeForNode(node);
    switch (facilityMode) {
      case 'elevator':
        return normalizedQueue * 40;
      case 'escalator_up':
      case 'escalator_down':
        return normalizedQueue * ESCALATOR_BOARDING_SECONDS;
      case 'stair':
        return normalizedQueue;
      case 'platform':
        if (normalizedQueue <= 0) {
          return 0;
        }
        return Math.floor((normalizedQueue - 1) / PLATFORM_QUEUE_BATCH_SIZE) * PLATFORM_TRAIN_HEADWAY_SECONDS
          + ((normalizedQueue - 1) % PLATFORM_QUEUE_BATCH_SIZE)
          + PLATFORM_BOARDING_SECONDS;
      case 'gate_out':
      case 'gate_in':
      default:
        return 0;
    }
  }

  function estimateFacilityRideTime(node) {
    switch (facilityModeForNode(node)) {
      case 'elevator':
        return 4;
      case 'escalator_up':
      case 'escalator_down':
        return 15;
      case 'stair':
        return 20;
      default:
        return 0;
    }
  }

  function isExplicitBackgroundQueueMode(mode) {
    return (
      mode === 'elevator'
      || mode === 'platform'
    );
  }

  function isExplicitBackgroundQueueNode(node) {
    return isExplicitBackgroundQueueMode(facilityModeForNode(node));
  }

  function getRouteTerminalNode(prepared, route) {
    const nodeId = route?.endNodeIds?.[0] || route?.targetNodeId || null;
    return nodeId ? prepared.nodeById?.[nodeId] || null : null;
  }

  function chooseBackgroundRouteTerminalNodeId(route, agentId, preferredNodeId) {
    const endNodeIds = Array.isArray(route?.endNodeIds) ? route.endNodeIds.filter(Boolean) : [];
    if (!endNodeIds.length) {
      return preferredNodeId || route?.targetNodeId || null;
    }
    if (preferredNodeId && endNodeIds.includes(preferredNodeId)) {
      return preferredNodeId;
    }
    if (endNodeIds.length === 1) {
      return endNodeIds[0];
    }
    const stableIndex = Math.abs(stableHash(`${route?.id || 'route'}:${agentId || 'background'}`)) % endNodeIds.length;
    return endNodeIds[stableIndex];
  }

  function getAssignedRouteTerminalNode(prepared, route, agent) {
    const fallbackNode = getRouteTerminalNode(prepared, route);
    if (!route) {
      return fallbackNode;
    }
    const nodeId = chooseBackgroundRouteTerminalNodeId(route, agent?.id, agent?.selectedTargetNodeId);
    return nodeId ? prepared.nodeById?.[nodeId] || fallbackNode : fallbackNode;
  }

  function getRouteOriginNode(prepared, route) {
    const nodeId = route?.startNodeIds?.[0] || route?.startGroupId || null;
    return nodeId ? prepared.nodeById?.[nodeId] || null : null;
  }

  function resetBackgroundAgentSimulationState(agent) {
    agent.backgroundState = 'moving';
    agent.queueSlotIndex = 0;
    agent.rideRemaining = 0;
    agent.queueTargetNodeId = null;
    agent.queueJoinedAt = null;
  }

  function isBackgroundWaitingState(state) {
    return state === 'queueing' || state === 'terminal_waiting';
  }

  function isBackgroundServingState(state) {
    return state === 'riding' || state === 'terminal_serving';
  }

  function isBackgroundFacilityServiceState(state) {
    return isBackgroundWaitingState(state) || isBackgroundServingState(state);
  }

  function deriveBackgroundQueueDirection(agent, node) {
    const path = agent?.path;
    const totalLength = safeNumber(path?.length, agent?.pathLength);
    if (path && totalLength > 1e-6) {
      const sample = samplePolyline(path, Math.max(0, totalLength - BACKGROUND_QUEUE_JOIN_DISTANCE));
      const rawDirection = normalizeVector({
        x: sample.x - safeNumber(node?.x, sample.x),
        y: sample.y - safeNumber(node?.y, sample.y),
      }, null);
      if (rawDirection) {
        return rawDirection;
      }
      const lastSegment = path.segments?.[path.segments.length - 1];
      if (lastSegment?.tangent) {
        return normalizeVector({
          x: -safeNumber(lastSegment.tangent.x, 0),
          y: -safeNumber(lastSegment.tangent.y, -1),
        }, { x: 0, y: 1 });
      }
    }
    return { x: 0, y: 1 };
  }

  function ensureBackgroundFacilityQueueState(scenario, node, agent) {
    if (!node?.id) {
      return null;
    }
    scenario.backgroundFacilityQueues = scenario.backgroundFacilityQueues || {};
    const existing = scenario.backgroundFacilityQueues[node.id];
    if (existing) {
      if (!existing.queueDirection && agent) {
        existing.queueDirection = deriveBackgroundQueueDirection(agent, node);
      }
      return existing;
    }
    const created = {
      nodeId: node.id,
      queueDirection: agent ? deriveBackgroundQueueDirection(agent, node) : { x: 0, y: 1 },
      boardingsInCurrentBatch: 0,
      departureDeadline: 0,
      pendingArrivalCount: 0,
      nextBoardReadyTime: facilityModeForNode(node) === 'platform'
        ? Math.floor(Math.max(0, safeNumber(scenario?.time, 0)) / PLATFORM_TRAIN_HEADWAY_SECONDS + 1) * PLATFORM_TRAIN_HEADWAY_SECONDS
        : 0,
    };
    scenario.backgroundFacilityQueues[node.id] = created;
    return created;
  }

  function getBackgroundQueueParticipants(scenario, nodeId) {
    return (scenario.backgroundAgents || [])
      .filter((agent) => (
        agent.active
        && agent.queueTargetNodeId === nodeId
        && isBackgroundFacilityServiceState(agent.backgroundState)
      ))
      .sort((left, right) => {
        const joinedDelta = safeNumber(left.queueJoinedAt, 0) - safeNumber(right.queueJoinedAt, 0);
        if (Math.abs(joinedDelta) > 1e-6) {
          return joinedDelta;
        }
        if (isBackgroundServingState(left.backgroundState) && !isBackgroundServingState(right.backgroundState)) {
          return -1;
        }
        if (isBackgroundServingState(right.backgroundState) && !isBackgroundServingState(left.backgroundState)) {
          return 1;
        }
        return String(left.id).localeCompare(String(right.id));
      });
  }

  function hasVisibleBackgroundQueueAtNode(scenario, nodeId) {
    return (scenario?.backgroundAgents || []).some((agent) => (
      agent?.active
      && (agent.backgroundState === 'queueing' || agent.backgroundState === 'riding')
      && String(agent.queueTargetNodeId || '') === String(nodeId || '')
    ));
  }

  function hasVisiblePlatformWaitingQueue(scenario) {
    return (scenario?.backgroundAgents || []).some((agent) => (
      agent?.active
      && (agent.backgroundState === 'queueing' || agent.backgroundState === 'riding')
      && isTrainDoorLikeId(agent.queueTargetNodeId || '')
    ));
  }

  function hasElevatorServiceCooldown(scenario) {
    const queueState = scenario?.backgroundFacilityQueues?.elev_3;
    const currentTime = safeNumber(scenario?.time, 0);
    return (
      safeNumber(queueState?.nextBoardReadyTime, 0) > currentTime + 1e-6
      || safeNumber(queueState?.departureDeadline, 0) > currentTime + 1e-6
      || Math.max(0, safeNumber(queueState?.boardingsInCurrentBatch, 0)) > 0
    );
  }

  function startElevatorDepartureCycle(scenario, queueState, boardedCount) {
    const boarded = Math.max(0, Math.min(ELEVATOR_QUEUE_BATCH_SIZE, Math.floor(safeNumber(boardedCount, 0))));
    queueState.boardingsInCurrentBatch = 0;
    queueState.departureDeadline = 0;
    queueState.pendingArrivalCount = Math.max(0, safeNumber(queueState.pendingArrivalCount, 0)) + boarded;
    queueState.nextBoardReadyTime = safeNumber(scenario?.time, 0) + ELEVATOR_REOPEN_SECONDS;
  }

  function registerElevatorBoardingCompletion(scenario, queueState, waitingCount) {
    queueState.boardingsInCurrentBatch = Math.max(0, safeNumber(queueState.boardingsInCurrentBatch, 0)) + 1;
    if (queueState.boardingsInCurrentBatch >= ELEVATOR_QUEUE_BATCH_SIZE) {
      startElevatorDepartureCycle(scenario, queueState, queueState.boardingsInCurrentBatch);
      return;
    }
    if (Math.max(0, safeNumber(waitingCount, 0)) > 0) {
      queueState.departureDeadline = 0;
      return;
    }
    queueState.departureDeadline = safeNumber(scenario?.time, 0) + ELEVATOR_IDLE_DEPARTURE_SECONDS;
  }

  function releaseElevatorArrivalBatch(prepared, scenario) {
    const queueState = scenario?.backgroundFacilityQueues?.elev_3;
    const currentTime = safeNumber(scenario?.time, 0);
    let pendingArrivalCount = Math.max(0, Math.floor(safeNumber(queueState?.pendingArrivalCount, 0)));
    if (!queueState || pendingArrivalCount <= 0 || safeNumber(queueState?.nextBoardReadyTime, 0) > currentTime + 1e-6) {
      return;
    }
    const routePool = Array.isArray(scenario?.elevatorOriginRoutePool) ? scenario.elevatorOriginRoutePool : [];
    if (!routePool.length) {
      queueState.pendingArrivalCount = 0;
      return;
    }
    let releaseBudget = Math.min(ELEVATOR_QUEUE_BATCH_SIZE, pendingArrivalCount);
    while (releaseBudget > 0) {
      const replacement = (scenario.backgroundAgents || []).find((agent) => (
        agent
        && !agent.isFocusAgent
        && !agent.active
      ));
      if (!replacement) {
        break;
      }
      const selected = chooseWeighted(routePool.map((route) => ({
        route,
        weight: Math.max(1e-6, safeNumber(route?.weight, 0)),
      })), scenario.rng);
      const routeOverride = selected?.route || routePool[0];
      const activated = respawnAgent(prepared, scenario, replacement, {
        routeOverride,
        bypassDeferredOriginGate: true,
        forceOriginSpawn: true,
      });
      if (!activated) {
        break;
      }
      releaseBudget -= 1;
    }
    queueState.pendingArrivalCount = 0;
  }

  function advanceElevatorDepartureCycle(scenario) {
    const queueState = scenario?.backgroundFacilityQueues?.elev_3;
    if (!queueState) {
      return;
    }
    const currentTime = safeNumber(scenario?.time, 0);
    if (
      Math.max(0, safeNumber(queueState?.boardingsInCurrentBatch, 0)) <= 0
      || safeNumber(queueState?.departureDeadline, 0) <= 0
      || safeNumber(queueState?.departureDeadline, 0) > currentTime + 1e-6
      || hasVisibleBackgroundQueueAtNode(scenario, 'elev_3')
    ) {
      return;
    }
    startElevatorDepartureCycle(scenario, queueState, queueState.boardingsInCurrentBatch);
  }

  function shouldDeferBackgroundTrainDoorRespawn(scenario, route) {
    if (isTrainDoorRouteOrigin(route)) {
      return hasVisiblePlatformWaitingQueue(scenario);
    }
    if (isElevatorRouteOrigin(route)) {
      return true;
    }
    return false;
  }

  function getBackgroundMovingTargetCount(scenario) {
    return Math.max(
      0,
      Math.round(
        safeNumber(
          scenario?.backgroundMovingTargetCount,
          (scenario?.backgroundAgents || []).filter((agent) => !agent?.isFocusAgent).length
        )
      )
    );
  }

  function countActiveMovingBackgroundAgents(scenario) {
    return (scenario?.backgroundAgents || []).reduce((count, agent) => (
      count + (agent?.active && agent?.backgroundState === 'moving' ? 1 : 0)
    ), 0);
  }

  function countActiveBackgroundAgents(scenario) {
    return (scenario?.backgroundAgents || []).reduce((count, agent) => (
      count + (agent?.active ? 1 : 0)
    ), 0);
  }

  function getPlatformQueueNeighborReach(prepared, node) {
    if (!prepared || !node?.id) {
      return 8.5;
    }
    prepared.backgroundQueuePoseCache = prepared.backgroundQueuePoseCache || {};
    const cached = prepared.backgroundQueuePoseCache[node.id];
    if (cached) {
      return cached.platformNeighborReach;
    }
    const platformNodes = (prepared.nodes || [])
      .filter((candidate) => candidate?.nodeGroup === 'chai_wan_train')
      .sort((left, right) => safeNumber(left?.x, 0) - safeNumber(right?.x, 0));
    const currentIndex = platformNodes.findIndex((candidate) => candidate.id === node.id);
    const leftNeighbor = currentIndex > 0 ? platformNodes[currentIndex - 1] : null;
    const rightNeighbor = currentIndex >= 0 && currentIndex < platformNodes.length - 1
      ? platformNodes[currentIndex + 1]
      : null;
    const nearestNeighborDistance = Math.min(
      leftNeighbor ? distance(leftNeighbor, node) : Number.POSITIVE_INFINITY,
      rightNeighbor ? distance(rightNeighbor, node) : Number.POSITIVE_INFINITY
    );
    const platformNeighborReach = Number.isFinite(nearestNeighborDistance)
      ? Math.max(8.5, nearestNeighborDistance * BACKGROUND_PLATFORM_QUEUE_NEIGHBOR_REACH_FACTOR)
      : 8.5;
    prepared.backgroundQueuePoseCache[node.id] = { platformNeighborReach };
    return platformNeighborReach;
  }

  function getPlatformQueueLayout(prepared, node) {
    if (!prepared || !node?.id) {
      return {
        anchors: [{ x: safeNumber(node?.x, 0), y: safeNumber(node?.y, 0), kind: 'door', sourceNodeId: node?.id || null }],
        fillOrder: [0],
        primaryAnchorIndex: 0,
      };
    }
    prepared.backgroundQueuePoseCache = prepared.backgroundQueuePoseCache || {};
    const cached = prepared.backgroundQueuePoseCache[node.id];
    if (cached?.platformLayout) {
      return cached.platformLayout;
    }
    const platformNodes = (prepared.nodes || [])
      .filter((candidate) => candidate?.nodeGroup === 'chai_wan_train')
      .sort((left, right) => safeNumber(left?.x, 0) - safeNumber(right?.x, 0));
    const anchors = platformNodes.map((platformNode) => ({
      x: safeNumber(platformNode?.x, 0),
      y: safeNumber(platformNode?.y, 0),
      kind: 'door',
      sourceNodeId: platformNode?.id || null,
    }));
    let primaryAnchorIndex = anchors.findIndex((anchor) => anchor.kind === 'door' && anchor.sourceNodeId === node.id);
    if (primaryAnchorIndex < 0) {
      primaryAnchorIndex = 0;
    }
    const fillOrder = [primaryAnchorIndex];
    for (let offset = 1; offset < anchors.length; offset += 1) {
      const leftIndex = primaryAnchorIndex - offset;
      const rightIndex = primaryAnchorIndex + offset;
      if (leftIndex >= 0) {
        fillOrder.push(leftIndex);
      }
      if (rightIndex < anchors.length) {
        fillOrder.push(rightIndex);
      }
    }
    const platformLayout = {
      anchors,
      fillOrder,
      primaryAnchorIndex,
    };
    prepared.backgroundQueuePoseCache[node.id] = {
      ...(cached || {}),
      platformLayout,
    };
    return platformLayout;
  }

  function buildQueuePatchOffset(forwardDirection, lateralDirection, config) {
    const signedSeed = safeNumber(config?.signedSeed, 0);
    const depthUnit = safeNumber(config?.depthUnit, 0.5);
    const shellRatio = clamp(safeNumber(config?.shellRatio, 0), 0, 1);
    const minAngle = safeNumber(config?.minAngle, 0.22);
    const maxAngle = safeNumber(config?.maxAngle, Math.PI * 0.44);
    const forwardNear = Math.max(0, safeNumber(config?.forwardNear, BACKGROUND_QUEUE_JOIN_DISTANCE));
    const forwardFar = Math.max(forwardNear, safeNumber(config?.forwardFar, forwardNear + 2));
    const lateralNear = Math.max(0, safeNumber(config?.lateralNear, BACKGROUND_QUEUE_LATERAL_SPACING));
    const lateralFar = Math.max(lateralNear, safeNumber(config?.lateralFar, lateralNear + 2));
    const angleMagnitude = lerp(minAngle, maxAngle, shellRatio) * Math.pow(Math.abs(signedSeed), 0.84);
    const angle = signedSeed >= 0 ? angleMagnitude : -angleMagnitude;
    const forwardRadius = lerp(forwardNear, forwardFar, shellRatio) * (0.76 + depthUnit * 0.24);
    const lateralRadius = lerp(lateralNear, lateralFar, shellRatio) * (0.44 + depthUnit * 0.56);
    return {
      x: forwardDirection.x * (forwardRadius * Math.cos(angle)) + lateralDirection.x * (lateralRadius * Math.sin(angle)),
      y: forwardDirection.y * (forwardRadius * Math.cos(angle)) + lateralDirection.y * (lateralRadius * Math.sin(angle)),
    };
  }

  function setBackgroundAgentQueuePose(prepared, agent, node, queueDirection, slotIndex) {
    const facilityMode = facilityModeForNode(node);
    const normalizedQueueDirection = facilityMode === 'platform'
      ? { x: 0, y: 1 }
      : normalizeVector(queueDirection, { x: 0, y: 1 });
    const slotSeed = stableHash(`${agent?.id || 'background'}:${node?.id || 'node'}:${slotIndex}`);
    const depthJitterUnit = (((slotSeed >>> 8) % 1000) + 0.5) / 1000;
    const lateralJitterUnit = (((slotSeed >>> 20) % 1000) + 0.5) / 1000;
    const signedJitter = (lateralJitterUnit - 0.5) * 2;
    const queueDepthIndex = Math.max(0, slotIndex - 1);
    const lateralDirection = normalizeVector({
      x: -safeNumber(normalizedQueueDirection?.y, 0),
      y: safeNumber(normalizedQueueDirection?.x, 0),
    }, { x: 1, y: 0 });
    let queueDistFromNode = 0;
    let centerTarget = {
      x: safeNumber(node?.x, 0),
      y: safeNumber(node?.y, 0),
    };

    if (slotIndex > 0) {
      if (facilityMode === 'platform') {
        const platformLayout = getPlatformQueueLayout(prepared, node);
        const queueGroupIndex = Math.max(0, Math.floor((slotIndex - 1) / PLATFORM_QUEUE_GROUP_CAPACITY));
        const slotInGroup = Math.max(0, (slotIndex - 1) % PLATFORM_QUEUE_GROUP_CAPACITY);
        const anchorIndex = platformLayout.fillOrder[Math.min(queueGroupIndex, platformLayout.fillOrder.length - 1)];
        const anchor = platformLayout.anchors[anchorIndex] || {
          x: safeNumber(node?.x, 0),
          y: safeNumber(node?.y, 0),
        };
        if (slotInGroup < PLATFORM_QUEUE_CLUSTER_CAPACITY) {
          const clusterRatio = clamp(slotInGroup / Math.max(1, PLATFORM_QUEUE_CLUSTER_CAPACITY - 1), 0, 1);
          const clusterOffset = buildQueuePatchOffset(normalizedQueueDirection, lateralDirection, {
            signedSeed: signedJitter,
            depthUnit: depthJitterUnit,
            shellRatio: clusterRatio,
            minAngle: 0.1,
            maxAngle: Math.PI * 0.52,
            forwardNear: PLATFORM_QUEUE_CLUSTER_FORWARD_NEAR,
            forwardFar: PLATFORM_QUEUE_CLUSTER_FORWARD_FAR,
            lateralNear: PLATFORM_QUEUE_CLUSTER_LATERAL_NEAR,
            lateralFar: PLATFORM_QUEUE_CLUSTER_LATERAL_FAR,
          });
          centerTarget = {
            x: safeNumber(anchor?.x, 0) + clusterOffset.x,
            y: safeNumber(anchor?.y, safeNumber(node?.y, 0)) + clusterOffset.y,
          };
        } else {
          const wallOverflowIndex = slotInGroup - PLATFORM_QUEUE_CLUSTER_CAPACITY;
          const sideStep = Math.floor(wallOverflowIndex / 2);
          const sideSign = wallOverflowIndex % 2 === 0 ? -1 : 1;
          const lateralOffset = sideSign * (
            1.18
            + sideStep * PLATFORM_QUEUE_WALL_SPREAD_STEP
            + Math.abs(signedJitter) * 0.28
          );
          const forwardOffset = Math.max(
            1.05,
            1.18
              + Math.floor(sideStep / 2) * PLATFORM_QUEUE_WALL_FORWARD_STEP
              + depthJitterUnit * 0.2
          );
          centerTarget = {
            x: safeNumber(anchor?.x, 0) + lateralDirection.x * lateralOffset,
            y: safeNumber(anchor?.y, safeNumber(node?.y, 0)) + forwardOffset,
          };
        }
        queueDistFromNode = Math.max(0, Math.hypot(
          centerTarget.x - safeNumber(node?.x, 0),
          centerTarget.y - safeNumber(node?.y, 0)
        ));
      } else if (facilityMode === 'elevator') {
        const shellRatio = clamp(queueDepthIndex / 5, 0, 1);
        const offset = buildQueuePatchOffset(normalizedQueueDirection, lateralDirection, {
          signedSeed: signedJitter,
          depthUnit: depthJitterUnit,
          shellRatio,
          minAngle: 0.18,
          maxAngle: Math.PI * 0.45,
          forwardNear: BACKGROUND_QUEUE_JOIN_DISTANCE * 0.88,
          forwardFar: 3.15,
          lateralNear: 0.95,
          lateralFar: 3.05,
        });
        queueDistFromNode = Math.max(0, Math.hypot(offset.x, offset.y));
        centerTarget = {
          x: safeNumber(node?.x, 0) + offset.x,
          y: safeNumber(node?.y, 0) + offset.y,
        };
      } else {
        const fanRatio = clamp((queueDepthIndex - 1) / 4, 0, 1);
        queueDistFromNode = BACKGROUND_QUEUE_JOIN_DISTANCE
          + queueDepthIndex * (BACKGROUND_QUEUE_SPACING * 0.42)
          + depthJitterUnit * (BACKGROUND_QUEUE_PATCH_DEPTH_JITTER * 0.5);
        const lateralBaseSign = slotIndex % 2 === 0 ? 1 : -1;
        const lateralOffset = (
          lateralBaseSign * fanRatio * BACKGROUND_QUEUE_LATERAL_SPACING * 0.72
          + signedJitter * fanRatio * BACKGROUND_QUEUE_PATCH_LATERAL_JITTER * 0.35
        );
        centerTarget = {
          x: safeNumber(node?.x, 0)
            + safeNumber(normalizedQueueDirection?.x, 0) * queueDistFromNode
            + lateralDirection.x * lateralOffset,
          y: safeNumber(node?.y, 0)
            + safeNumber(normalizedQueueDirection?.y, 1) * queueDistFromNode
            + lateralDirection.y * lateralOffset,
        };
      }
    }
    const center = projectPointToWalkable(prepared, centerTarget, {
      minimumClearance: facilityMode === 'platform' ? 0.08 : BACKGROUND_QUEUE_MIN_CLEARANCE,
    });
    const facing = normalizeVector({
      x: -safeNumber(normalizedQueueDirection?.x, 0),
      y: -safeNumber(normalizedQueueDirection?.y, 1),
    }, { x: 1, y: 0 });
    const pathLength = safeNumber(agent.pathLength, agent.path?.length);
    agent.pathProgressDist = slotIndex <= 0
      ? pathLength
      : clamp(pathLength - queueDistFromNode, 0, pathLength);
    agent.progressDist = agent.pathProgressDist;
    agent.progress = pathLength <= 1e-6 ? 0 : agent.pathProgressDist / pathLength;
    agent.center = { x: center.x, y: center.y };
    agent.position = { x: center.x, y: center.y };
    agent.tangent = { x: facing.x, y: facing.y };
    agent.normal = { x: -facing.y, y: facing.x };
    agent.offset = 0;
  }

  function setBackgroundAgentFlowServicePose(prepared, scenario, agent, node, queueDirection, slotIndex, timeUntilService = 0) {
    const normalizedQueueDirection = normalizeVector(queueDirection, { x: 0, y: 1 });
    const lateralDirection = normalizeVector({
      x: -safeNumber(normalizedQueueDirection?.y, 0),
      y: safeNumber(normalizedQueueDirection?.x, 0),
    }, { x: 1, y: 0 });
    const poseSeed = stableHash(`${agent?.id || 'background'}:${node?.id || 'node'}:${slotIndex}`);
    const phase = (((poseSeed >>> 10) % 4096) / 4096) * Math.PI * 2;
    const depthUnit = (((poseSeed >>> 4) % 1000) + 0.5) / 1000;
    const lateralUnit = (((poseSeed >>> 18) % 1000) + 0.5) / 1000;
    const time = safeNumber(scenario?.time, 0);
    const waitingIndex = Math.max(0, slotIndex - 1);
    const pathLength = safeNumber(agent.pathLength, agent.path?.length);
    const flowApproachSpeed = clamp(getBackgroundAgentWalkingSpeed(scenario, agent) * 0.92, 0.38, 1.05);
    const desiredDistanceFromTerminal = clamp(
      Math.max(
        slotIndex <= 0 ? 0.02 : 0.22,
        safeNumber(timeUntilService, 0) * flowApproachSpeed + waitingIndex * 0.14 + depthUnit * 0.08
      ),
      0.02,
      Math.max(0.4, Math.min(18, pathLength * 0.35))
    );
    const sampleDistance = clamp(pathLength - desiredDistanceFromTerminal, 0, pathLength);
    const sample = samplePolyline(agent.path, sampleDistance);
    const lateralBase = (lateralUnit - 0.5) * (slotIndex <= 0 ? 0.18 : 0.4);
    const sway = Math.sin(time * 2.2 + phase) * (slotIndex <= 0 ? 0.05 : 0.12);
    const bob = Math.cos(time * 1.7 + phase) * (slotIndex <= 0 ? 0.02 : 0.05);
    const centerTarget = {
      x: safeNumber(sample?.x, 0)
        + safeNumber(sample?.tangent?.x, 0) * bob
        + lateralDirection.x * (lateralBase + sway),
      y: safeNumber(sample?.y, 0)
        + safeNumber(sample?.tangent?.y, 0) * bob
        + lateralDirection.y * (lateralBase + sway),
    };
    const center = projectPointToWalkable(prepared, centerTarget, {
      minimumClearance: Math.max(0.05, BACKGROUND_QUEUE_MIN_CLEARANCE * 0.7),
    });
    const facing = normalizeVector({
      x: safeNumber(sample?.tangent?.x, 0) + lateralDirection.x * Math.sin(time * 1.35 + phase) * 0.08,
      y: safeNumber(sample?.tangent?.y, 1) + lateralDirection.y * Math.sin(time * 1.35 + phase) * 0.08,
    }, { x: 1, y: 0 });
    agent.pathProgressDist = sampleDistance;
    agent.progressDist = agent.pathProgressDist;
    agent.progress = pathLength <= 1e-6 ? 0 : agent.pathProgressDist / pathLength;
    agent.center = { x: center.x, y: center.y };
    agent.position = { x: center.x, y: center.y };
    agent.tangent = { x: facing.x, y: facing.y };
    agent.normal = { x: -facing.y, y: facing.x };
    agent.offset = 0;
  }

  function getBackgroundFacilityBoardingSeconds(node) {
    const facilityMode = facilityModeForNode(node);
    switch (facilityMode) {
      case 'platform':
        return PLATFORM_BOARDING_SECONDS;
      case 'elevator':
        return ELEVATOR_BOARDING_SECONDS;
      case 'stair':
        return STAIR_BOARDING_SECONDS;
      case 'escalator_up':
      case 'escalator_down':
        return ESCALATOR_BOARDING_SECONDS;
      default:
        return 1;
    }
  }

  function updateBackgroundFacilityServiceWindow(scenario, queueState, node) {
    if (!queueState) {
      return;
    }
    const facilityMode = facilityModeForNode(node);
    if (facilityMode === 'platform') {
      queueState.boardingsInCurrentBatch = Math.max(0, safeNumber(queueState.boardingsInCurrentBatch, 0)) + 1;
      if (queueState.boardingsInCurrentBatch >= PLATFORM_QUEUE_BATCH_SIZE) {
        queueState.boardingsInCurrentBatch = 0;
        queueState.nextBoardReadyTime = Math.floor(
          Math.max(0, safeNumber(scenario?.time, 0)) / PLATFORM_TRAIN_HEADWAY_SECONDS + 1
        ) * PLATFORM_TRAIN_HEADWAY_SECONDS;
        return;
      }
    } else if (facilityMode === 'elevator') {
      queueState.boardingsInCurrentBatch = Math.max(0, safeNumber(queueState.boardingsInCurrentBatch, 0)) + 1;
      if (queueState.boardingsInCurrentBatch >= ELEVATOR_QUEUE_BATCH_SIZE) {
        queueState.boardingsInCurrentBatch = 0;
        queueState.departureDeadline = 0;
        queueState.nextBoardReadyTime = safeNumber(scenario?.time, 0) + ELEVATOR_REOPEN_SECONDS;
        return;
      }
    } else {
      queueState.boardingsInCurrentBatch = 0;
    }
    queueState.nextBoardReadyTime = safeNumber(scenario?.time, 0);
  }

  function getLongestWalkingTimeSeconds(value) {
    const direct = safeNumber(value, NaN);
    if (Number.isFinite(direct) && direct >= 1 && direct <= 5) {
      return safeNumber(LONGEST_WALKING_TIME_MINUTES[direct], LONGEST_WALKING_TIME_MINUTES.default) * 60;
    }
    return safeNumber(LONGEST_WALKING_TIME_MINUTES.default, 100 / (BASAL_FATIGUE_VELOCITY[3] * 60)) * 60;
  }

  function getEnvironmentAcceleration(environment, queueCount) {
    return (
      safeNumber(environment?.crowdFatigueCoefficient, 1)
      * safeNumber(environment?.noiseFatigueCoefficient, 1)
      * safeNumber(environment?.lightingFatigueCoefficient, 1)
      * getQueueFatigueCoefficient(queueCount)
    );
  }

  function getSeatOccupancy(scenario, seatId) {
    return safeNumber(scenario.seatOccupancy?.[seatId], 0);
  }

  function getSeatAvailability(scenario, seat) {
    return Math.max(0, safeNumber(seat?.seatCount, 0) - getSeatOccupancy(scenario, seat?.id));
  }

  function reserveSeat(scenario, seat) {
    if (!seat || getSeatAvailability(scenario, seat) <= 0) {
      return false;
    }
    scenario.seatOccupancy = scenario.seatOccupancy || {};
    scenario.seatOccupancy[seat.id] = getSeatOccupancy(scenario, seat.id) + 1;
    return true;
  }

  function releaseSeat(scenario, seatId) {
    if (!seatId || !scenario.seatOccupancy?.[seatId]) {
      return;
    }
    scenario.seatOccupancy[seatId] = Math.max(0, scenario.seatOccupancy[seatId] - 1);
  }

  function findNearbyAvailableSeat(prepared, scenario, point, profile) {
    const perceptionRadius = getPerceptionRadiusForProfile(profile);
    return prepared.seats
      .filter((seat) => distance(seat, point) <= perceptionRadius && getSeatAvailability(scenario, seat) > 0)
      .sort((left, right) => distance(left, point) - distance(right, point))[0] || null;
  }

  function findNearestAvailableSeat(prepared, scenario, point) {
    return (prepared?.seats || [])
      .filter((seat) => getSeatAvailability(scenario, seat) > 0)
      .sort((left, right) => distance(left, point) - distance(right, point))[0] || null;
  }

  function getAgentSelectedTargetNode(prepared, agent) {
    const selectedTargetNodeId = String(agent?.selectedTargetNodeId || '').trim();
    return selectedTargetNodeId ? prepared?.nodeById?.[selectedTargetNodeId] || null : null;
  }

  function isAgentTargetVisible(prepared, agent) {
    const targetNode = getAgentSelectedTargetNode(prepared, agent);
    if (!targetNode || !agent?.position) {
      return false;
    }
    const perceptionRadius = getPerceptionRadiusForProfile(agent?.profile);
    return distance(agent.position, targetNode) <= perceptionRadius;
  }

  function shouldEnterSeatSearch(prepared, scenario, agent) {
    if (!prepared || !scenario || !agent || agent.profile?.disableSeatRest) {
      return false;
    }
    if (isAgentTargetVisible(prepared, agent)) {
      return false;
    }
    return Boolean(findNearbyAvailableSeat(prepared, scenario, agent.position, agent?.profile));
  }

  function getRestSearchTargetSeat(prepared, scenario, agent) {
    const currentSeatId = agent?.restTargetSeatId || null;
    const currentSeat = currentSeatId ? prepared?.seats?.find((seat) => seat.id === currentSeatId) : null;
    if (currentSeat && getSeatAvailability(scenario, currentSeat) > 0) {
      return currentSeat;
    }
    const nearbySeat = findNearbyAvailableSeat(prepared, scenario, agent.position, agent?.profile);
    agent.restTargetSeatId = nearbySeat?.id || null;
    return nearbySeat;
  }

  function getBoundaryClearanceAtPoint(prepared, point) {
    const polygonBoundaryDistance = (polygon) => {
      if (!Array.isArray(polygon) || polygon.length < 2) {
        return Number.POSITIVE_INFINITY;
      }
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
        bestDistance = Math.min(
          bestDistance,
          distanceToSegment(
            point,
            { x: polygon[previous][0], y: polygon[previous][1] },
            { x: polygon[index][0], y: polygon[index][1] }
          )
        );
      }
      return bestDistance;
    };

    let bestDistance = Number.POSITIVE_INFINITY;
    (prepared?.walkableAreas || []).forEach((polygon) => {
      if (pointInPolygon(point, polygon)) {
        bestDistance = Math.min(bestDistance, polygonBoundaryDistance(polygon));
      }
    });
    (prepared?.obstacles || []).forEach((polygon) => {
      bestDistance = Math.min(bestDistance, polygonBoundaryDistance(polygon));
    });
    return bestDistance;
  }

  function getStandingRestLocationBand(prepared, scenario, agent, environment) {
    const nearestCell = findNearestWalkableCell(prepared.grid, agent.position);
    const density = getUnifiedCrowdDensity(environment, 0);
    const exactWallDistance = getBoundaryClearanceAtPoint(prepared, agent.position);
    const wallDistance = Number.isFinite(exactWallDistance) ? exactWallDistance : safeNumber(nearestCell?.wallDistance, 0);
    if (density < REST_RULES.openAreaDensityMax && wallDistance >= 1) {
      return wallDistance <= 1.8 ? 'open-wall' : 'open';
    }
    if (density <= REST_RULES.mediumAreaDensityMax) {
      return 'medium';
    }
    return null;
  }

  function shouldRestAtCurrentLocation(prepared, scenario, agent, environment) {
    return Boolean(getStandingRestLocationBand(prepared, scenario, agent, environment));
  }

  function getAgentShortRestThresholds(agent) {
    const thresholds = Array.isArray(agent?.profile?.shortRestThresholdsPercent)
      ? agent.profile.shortRestThresholdsPercent
      : getVitalityShortRestThresholds(agent?.profile?.capacityScores?.vitality);
    return thresholds
      .map((value) => clamp(safeNumber(value, 0), 0, 100))
      .sort((left, right) => left - right);
  }

  function syncShortRestThresholdState(agent) {
    const triggered = agent.shortRestTriggeredThresholds || {};
    const currentFatigue = safeNumber(agent?.fatigue, 0);
    getAgentShortRestThresholds(agent).forEach((threshold) => {
      if (currentFatigue < threshold - 1e-6) {
        delete triggered[threshold];
      }
    });
    agent.shortRestTriggeredThresholds = triggered;
  }

  function getPendingShortRestThreshold(agent) {
    syncShortRestThresholdState(agent);
    const currentFatigue = safeNumber(agent?.fatigue, 0);
    const triggered = agent.shortRestTriggeredThresholds || {};
    return getAgentShortRestThresholds(agent).find((threshold) => (
      threshold < safeNumber(agent?.profile?.seatSearchThresholdPercent, REST_RULES.seatSearchThresholdPercent)
      && threshold < 100
      && currentFatigue >= threshold
      && !triggered[threshold]
    )) || null;
  }

  function getShortRestMarkerRadiusMeters(fatiguePercent) {
    return Number(clamp(0.45 + safeNumber(fatiguePercent, 0) * 0.011, 0.45, 1.55).toFixed(3));
  }

  function startShortRest(agent, threshold, scenario) {
    if (agent.restState && agent.restState !== 'none') {
      return;
    }
    const fatiguePercent = clamp(
      safeNumber(agent.fatigueThreshold, 0) > 0
        ? (safeNumber(agent.fatigue, 0) / safeNumber(agent.fatigueThreshold, 1)) * 100
        : 0,
      0,
      100
    );
    agent.shortRestTriggeredThresholds = agent.shortRestTriggeredThresholds || {};
    agent.shortRestTriggeredThresholds[threshold] = true;
    agent.restState = 'short-rest';
    agent.restMode = 'short-rest';
    agent.shortRestRemaining = safeNumber(agent?.profile?.shortRestSeconds, REST_RULES.shortRestSeconds);
    agent.restSearchAbandoned = false;
    agent.restStartFatigue = safeNumber(agent.fatigue, 0);
    agent.restResumeThreshold = safeNumber(agent.fatigue, 0);
    agent.reservedSeatId = null;
    agent.restInterruptionOccurred = true;
    agent.pendingShortRestMarker = {
      x: safeNumber(agent.position?.x, 0),
      y: safeNumber(agent.position?.y, 0),
      time: safeNumber(scenario?.time, 0),
      thresholdPercent: clamp(safeNumber(threshold, 0), 0, 100),
      fatiguePercent: Number(fatiguePercent.toFixed(3)),
      radiusMeters: getShortRestMarkerRadiusMeters(fatiguePercent),
    };
  }

  function startRestSearch(agent) {
    if (agent.restState && agent.restState !== 'none') {
      return;
    }
    agent.restState = 'searching';
    agent.restMode = 'seat-search';
    agent.restSearchElapsed = 0;
    agent.restSearchAbandoned = false;
    agent.restStartFatigue = safeNumber(agent.fatigue, 0);
    agent.restResumeThreshold = safeNumber(agent?.profile?.resumeFatiguePercent, REST_RULES.resumeFatiguePercent);
    agent.reservedSeatId = null;
    agent.restTargetSeatId = null;
    agent.restSearchPath = null;
    agent.restSearchPathTargetSeatId = null;
    agent.restSearchPathProgressDist = 0;
    agent.restInterruptionOccurred = true;
  }

  function clearRestState(scenario, agent) {
    if (agent.reservedSeatId) {
      releaseSeat(scenario, agent.reservedSeatId);
    }
    agent.restState = 'none';
    agent.restMode = null;
    agent.restSearchElapsed = 0;
    agent.restSearchAbandoned = false;
    agent.restStartFatigue = 0;
    agent.restResumeThreshold = 0;
    agent.shortRestRemaining = 0;
    agent.reservedSeatId = null;
    agent.restTargetSeatId = null;
    agent.restSearchPath = null;
    agent.restSearchPathTargetSeatId = null;
    agent.restSearchPathProgressDist = 0;
  }

  function ensureRestSearchPath(prepared, agent, targetSeat) {
    if (!targetSeat) {
      agent.restSearchPath = null;
      agent.restSearchPathTargetSeatId = null;
      agent.restSearchPathProgressDist = 0;
      return null;
    }
    if (
      agent.restSearchPath
      && agent.restSearchPathTargetSeatId === targetSeat.id
      && safeNumber(agent.restSearchPath?.length, 0) > 1e-6
    ) {
      return agent.restSearchPath;
    }
    const path = findPath(prepared, agent.position, targetSeat);
    agent.restSearchPath = path || null;
    agent.restSearchPathTargetSeatId = targetSeat.id;
    agent.restSearchPathProgressDist = 0;
    return agent.restSearchPath;
  }

  function recoverDuringRest(environment, queueCount, agent, dt) {
    const recoveryRate = agent.restState === 'sitting'
      ? safeNumber(agent?.profile?.sittingRecoveryPercentPerSecond, REST_RULES.sittingRecoveryPercentPerSecond)
      : safeNumber(agent?.profile?.standingRecoveryPercentPerSecond, REST_RULES.standingRecoveryPercentPerSecond);
    const recoveryDelta = recoveryRate * dt;
    agent.fatigue = Math.max(0, safeNumber(agent.fatigue, 0) - recoveryDelta);
  }

  function advanceRestSearchState(prepared, scenario, agent, environment, dt) {
    agent.restSearchElapsed = Math.max(0, safeNumber(agent.restSearchElapsed, 0) + dt);
    const targetSeat = getRestSearchTargetSeat(prepared, scenario, agent);
    if (targetSeat && distance(targetSeat, agent.position) <= 0.45 && reserveSeat(scenario, targetSeat)) {
      agent.reservedSeatId = targetSeat.id;
      agent.restTargetSeatId = targetSeat.id;
      agent.restState = 'sitting';
      agent.restMode = 'sitting';
      return true;
    }
    agent.restMode = 'seat-search';
    return false;
  }

  function advanceRestSearchMotion(prepared, scenario, agent, speed, dt) {
    if (agent.restState !== 'searching') {
      return { handled: false, movedDistance: 0 };
    }
    if (isAgentTargetVisible(prepared, agent)) {
      clearRestState(scenario, agent);
      return { handled: false, movedDistance: 0 };
    }
    const targetSeat = getRestSearchTargetSeat(prepared, scenario, agent);
    if (!targetSeat) {
      return { handled: false, movedDistance: 0 };
    }
    const seatSearchPath = ensureRestSearchPath(prepared, agent, targetSeat);
    const hasSeatSearchPath = Boolean(seatSearchPath?.segments?.length && safeNumber(seatSearchPath?.length, 0) > 1e-6);
    const remainingDistance = hasSeatSearchPath
      ? Math.max(0, safeNumber(seatSearchPath.length, 0) - safeNumber(agent.restSearchPathProgressDist, 0))
      : distance(agent.position, targetSeat);
    if (remainingDistance <= 0.45) {
      if (reserveSeat(scenario, targetSeat)) {
        agent.reservedSeatId = targetSeat.id;
        agent.restTargetSeatId = targetSeat.id;
        agent.restState = 'sitting';
        agent.restMode = 'sitting';
        agent.restSearchPath = null;
        agent.restSearchPathTargetSeatId = null;
        agent.restSearchPathProgressDist = 0;
        return { handled: true, movedDistance: 0 };
      }
      agent.restTargetSeatId = null;
      agent.restSearchPath = null;
      agent.restSearchPathTargetSeatId = null;
      agent.restSearchPathProgressDist = 0;
      return { handled: false, movedDistance: 0 };
    }
    const travel = Math.min(Math.max(0, safeNumber(speed, 0) * safeNumber(dt, 0)), remainingDistance);
    let tangent = normalizeVector({
      x: targetSeat.x - agent.position.x,
      y: targetSeat.y - agent.position.y,
    }, agent.tangent || { x: 1, y: 0 });
    let nextPosition = {
      x: agent.position.x + tangent.x * travel,
      y: agent.position.y + tangent.y * travel,
    };
    if (hasSeatSearchPath) {
      agent.restSearchPathProgressDist = clamp(
        safeNumber(agent.restSearchPathProgressDist, 0) + travel,
        0,
        safeNumber(seatSearchPath.length, 0)
      );
      const sample = samplePolyline(seatSearchPath, agent.restSearchPathProgressDist);
      tangent = sample?.tangent || tangent;
      nextPosition = {
        x: safeNumber(sample?.x, nextPosition.x),
        y: safeNumber(sample?.y, nextPosition.y),
      };
    } else if (!isWalkablePoint(prepared, nextPosition)) {
      nextPosition = projectPointToWalkable(prepared, nextPosition, { minimumClearance: 0.45 });
    }
    agent.center = { x: nextPosition.x, y: nextPosition.y };
    agent.position = { x: nextPosition.x, y: nextPosition.y };
    agent.tangent = tangent;
    agent.normal = { x: -tangent.y, y: tangent.x };
    agent.offset = 0;
    agent.restMode = 'seat-search';
    return { handled: true, movedDistance: travel };
  }

  function handleRestState(prepared, scenario, agent, environment, queueCount, dt) {
    if (!agent.restState || agent.restState === 'none') {
      return false;
    }

    if (agent.restState === 'short-rest') {
      agent.shortRestRemaining = Math.max(0, safeNumber(agent.shortRestRemaining, REST_RULES.shortRestSeconds) - dt);
      if (safeNumber(agent.shortRestRemaining, 0) <= 1e-6) {
        clearRestState(scenario, agent);
      }
      return true;
    }

    if (agent.restState === 'searching') {
      return advanceRestSearchState(prepared, scenario, agent, environment, dt);
    }

    if (getUnifiedCrowdDensity(environment, 0) > REST_RULES.interruptionDensity && agent.restState === 'sitting') {
      if (agent.reservedSeatId) {
        releaseSeat(scenario, agent.reservedSeatId);
      }
      agent.reservedSeatId = null;
      agent.restState = 'standing';
      agent.restMode = 'standing';
    }

    recoverDuringRest(environment, queueCount, agent, dt);
    if (safeNumber(agent.fatigue, 0) <= safeNumber(agent.restResumeThreshold, 0)) {
      clearRestState(scenario, agent);
    }
    return true;
  }

  function syncAgentRestTriggersForCurrentFatigue(prepared, scenario, agent) {
    const seatSearchThreshold = safeNumber(agent?.profile?.seatSearchThresholdPercent, REST_RULES.seatSearchThresholdPercent);
    const fatigueThresholdSlowWalkActive = isFatigueThresholdSlowWalkActive(agent);
    if (fatigueThresholdSlowWalkActive) {
      if (!agent.profile?.disableSeatRest) {
        if (agent.restState === 'short-rest') {
          clearRestState(scenario, agent);
        }
        if ((!agent.restState || agent.restState === 'none') && shouldEnterSeatSearch(prepared, scenario, agent)) {
          startRestSearch(agent);
        }
      } else if (agent.profile?.disableSeatRest && agent.restState && agent.restState !== 'none') {
        clearRestState(scenario, agent);
      }
      return;
    }
    if (
      !agent.profile?.disableSeatRest
      && safeNumber(agent.fatigue, 0) >= seatSearchThreshold
      && shouldEnterSeatSearch(prepared, scenario, agent)
    ) {
      startRestSearch(agent);
      return;
    }
    const pendingShortRestThreshold = agent.profile?.disableShortRest
      ? null
      : getPendingShortRestThreshold(agent);
    if (pendingShortRestThreshold !== null) {
      startShortRest(agent, pendingShortRestThreshold, scenario);
    }
  }

  function getTargetCandidateNodes(prepared, regionId) {
    const region = prepared.targetRegionById?.[regionId];
    if (!region) {
      return [];
    }
    const regionNodes = region.nodeIds
      .map((nodeId) => prepared.nodeById[nodeId])
      .filter(Boolean);

    let filteredNodes = regionNodes;
    if (String(regionId).startsWith('exit_')) {
      filteredNodes = regionNodes.filter((node) => node.nodeGroup === 'gate_out');
    } else if (regionId === 'chai_wan') {
      filteredNodes = regionNodes.filter((node) => node.nodeGroup === 'chai_wan_train');
    } else if (regionId === 'twl') {
      filteredNodes = regionNodes.filter((node) => node.nodeGroup === 'twl_down' || node.nodeGroup === 'elevator');
    } else if (regionId === 'kdt') {
      filteredNodes = regionNodes.filter((node) => node.nodeGroup === 'kdt_down' || node.nodeGroup === 'stair' || node.nodeGroup === 'elevator');
    }

    const seen = new Set();
    return filteredNodes.filter((node) => {
      if (seen.has(node.id)) {
        return false;
      }
      seen.add(node.id);
      return true;
    });
  }

  function filterTargetCandidateNodesForAgent(regionId, agent, candidateNodes) {
    const nodes = Array.isArray(candidateNodes) ? candidateNodes.filter(Boolean) : [];
    const locomotorScore = clampCapacityScore(agent?.profile?.capacityScores?.locomotor, 3);
    if (locomotorScore <= 2 && (regionId === 'kdt' || regionId === 'twl')) {
      const elevatorNodes = nodes.filter((node) => facilityModeForNode(node) === 'elevator');
      if (elevatorNodes.length) {
        return elevatorNodes;
      }
    }
    return nodes;
  }

  function getFocusFacilityPriority(agent, modeOrNode) {
    const locomotorScore = clampCapacityScore(agent?.profile?.capacityScores?.locomotor, 3);
    const mode = normalizeLocomotorFacilityMode(modeOrNode);
    if (locomotorScore <= 2) {
      return mode === 'elevator' ? 0 : 99;
    }
    switch (mode) {
      case 'escalator':
        return 0;
      case 'elevator':
        return 1;
      case 'stair':
        return 2;
      default:
        return 3;
    }
  }

  function compareFocusCandidateChoice(left, right) {
    const priorityDelta = safeNumber(left?.facilityPriority, 99) - safeNumber(right?.facilityPriority, 99);
    if (priorityDelta) {
      return priorityDelta;
    }
    const lengthDelta = safeNumber(left?.path?.length, Infinity) - safeNumber(right?.path?.length, Infinity);
    if (Math.abs(lengthDelta) > 1e-6) {
      return lengthDelta;
    }
    const costDelta = safeNumber(left?.cost, Infinity) - safeNumber(right?.cost, Infinity);
    if (Math.abs(costDelta) > 1e-6) {
      return costDelta;
    }
    return String(left?.node?.id || '').localeCompare(String(right?.node?.id || ''));
  }

  function countAgentsNearNode(scenario, node, excludeAgentId) {
    if (!node || !isExplicitBackgroundQueueNode(node)) {
      return 0;
    }
    return scenario.agents.reduce((count, agent) => {
      if (!agent.active || agent.id === excludeAgentId) {
        return count;
      }
      return distance(agent.position, node) <= QUEUE_LOCK_RADIUS ? count + 1 : count;
    }, 0);
  }

  function countAgentsWithinNodeRadius(scenario, node, radius, excludeAgentId) {
    if (!node) {
      return 0;
    }
    const resolvedRadius = Math.max(0, safeNumber(radius, QUEUE_LOCK_RADIUS));
    return scenario.agents.reduce((count, agent) => {
      if (!agent.active || agent.id === excludeAgentId) {
        return count;
      }
      return distance(agent.position, node) <= resolvedRadius ? count + 1 : count;
    }, 0);
  }

  function getDecisionNode(prepared, point) {
    let nearestNode = null;
    let bestDistance = DECISION_NODE_RADIUS;
    prepared.nodes.forEach((node) => {
      const currentDistance = distance(point, node);
      if (currentDistance <= bestDistance) {
        bestDistance = currentDistance;
        nearestNode = node;
      }
    });
    return nearestNode;
  }

  function getVisibleTargetCandidates(prepared, point, regionId) {
    const candidates = getTargetCandidateNodes(prepared, regionId);
    return candidates.filter((node) => distance(point, node) <= VISION_RADIUS);
  }

  function createDynamicFocusRoute(startAnchor, targetRegion, targetNode) {
    const roundedStartX = safeNumber(startAnchor?.x, 0).toFixed(2);
    const roundedStartY = safeNumber(startAnchor?.y, 0).toFixed(2);
    return {
      id: `focus_dynamic__${targetRegion.id}__${targetNode.id}__${roundedStartX}__${roundedStartY}`,
      family: 'focus_dynamic',
      startGroupId: 'custom_start',
      endGroupId: targetNode.id,
      startAnchor: {
        x: safeNumber(startAnchor?.x, 0),
        y: safeNumber(startAnchor?.y, 0),
        z: safeNumber(startAnchor?.z, 0),
      },
      endAnchor: {
        x: safeNumber(targetNode.x, 0),
        y: safeNumber(targetNode.y, 0),
        z: safeNumber(targetNode.z, 0),
      },
      startNodeIds: [],
      endNodeIds: [targetNode.id],
      weight: 1,
      isFocusPreset: false,
      targetRegionId: targetRegion.id,
      targetNodeId: targetNode.id,
      label: `${targetRegion.labelEn || targetRegion.labelZh || targetRegion.id} → ${targetNode.displayLabelEn || targetNode.displayLabel || targetNode.id}`,
    };
  }

  function appendPathPoints(targetPoints, sourcePoints) {
    if (!Array.isArray(targetPoints) || !Array.isArray(sourcePoints) || !sourcePoints.length) {
      return;
    }
    sourcePoints.forEach((point, index) => {
      const normalizedPoint = {
        x: safeNumber(point?.x, 0),
        y: safeNumber(point?.y, 0),
      };
      if (
        index === 0
        && targetPoints.length
        && distance(targetPoints[targetPoints.length - 1], normalizedPoint) <= 1e-6
      ) {
        return;
      }
      targetPoints.push(normalizedPoint);
    });
  }

  function buildCompositePathFromPoints(points, startPoint, endPoint) {
    const polyline = buildPolyline(points);
    const normalizedStart = polyline.points?.[0] || {
      x: safeNumber(startPoint?.x, 0),
      y: safeNumber(startPoint?.y, 0),
    };
    const normalizedEnd = polyline.points?.[polyline.points.length - 1] || {
      x: safeNumber(endPoint?.x, 0),
      y: safeNumber(endPoint?.y, 0),
    };
    return {
      indices: [],
      cells: [],
      points: polyline.points,
      segments: polyline.segments,
      length: polyline.length,
      startPoint: normalizedStart,
      endPoint: normalizedEnd,
    };
  }

  function getValidatedFocusAnchorNodes(prepared, scenario, agent, startAnchor, targetNode) {
    const planAnchors = Array.isArray(scenario?.llmDecisionPlan?.anchors)
      ? scenario.llmDecisionPlan.anchors
      : [];
    if (!planAnchors.length || !targetNode) {
      return { anchorNodes: [], anchorCursor: 0 };
    }
    const seen = new Set();
    const anchorNodes = planAnchors
      .map((item) => prepared.nodeById?.[item?.nodeId] || null)
      .filter((node) => {
        if (!node?.id) {
          return false;
        }
        if (node.id === targetNode.id || seen.has(node.id)) {
          return false;
        }
        if (distance(startAnchor, node) <= 0.85) {
          return false;
        }
        seen.add(node.id);
        return true;
      });
    const anchorCursor = clamp(
      Math.round(safeNumber(agent?.focusAnchorCursor, 0)),
      0,
      anchorNodes.length
    );
    return { anchorNodes, anchorCursor };
  }

  function buildFocusAnchorAwarePath(prepared, startAnchor, targetNode, anchorNodes, anchorCursor = 0) {
    const remainingAnchorNodes = Array.isArray(anchorNodes)
      ? anchorNodes.slice(clamp(Math.round(safeNumber(anchorCursor, 0)), 0, anchorNodes.length))
      : [];
    if (!remainingAnchorNodes.length || !targetNode) {
      return null;
    }
    const pathPoints = [];
    let segmentStart = startAnchor;
    const usableAnchors = [];

    for (const anchorNode of remainingAnchorNodes) {
      const segmentPath = findPath(prepared, segmentStart, anchorNode);
      if (!segmentPath?.segments?.length) {
        continue;
      }
      appendPathPoints(pathPoints, segmentPath.points);
      usableAnchors.push(anchorNode);
      segmentStart = anchorNode;
    }

    if (!usableAnchors.length) {
      return null;
    }

    const finalSegmentPath = findPath(prepared, segmentStart, targetNode);
    if (!finalSegmentPath?.segments?.length) {
      return null;
    }
    appendPathPoints(pathPoints, finalSegmentPath.points);
    const compositePath = buildCompositePathFromPoints(pathPoints, startAnchor, targetNode);
    if (!compositePath?.segments?.length) {
      return null;
    }
    return {
      path: compositePath,
      remainingAnchorNodes: usableAnchors,
    };
  }

  function createAnchorAwareFocusRoute(startAnchor, targetRegion, targetNode, anchorNodes, anchorCursor = 0, precomputedPath = null) {
    const baseRoute = createDynamicFocusRoute(startAnchor, targetRegion, targetNode);
    const anchorIds = Array.isArray(anchorNodes) ? anchorNodes.map((node) => node.id).filter(Boolean) : [];
    return {
      ...baseRoute,
      id: `${baseRoute.id}__anchors__${anchorIds.join('__') || 'none'}__cursor__${clamp(Math.round(safeNumber(anchorCursor, 0)), 0, anchorIds.length)}`,
      family: 'focus_dynamic_anchor',
      anchorNodeIds: anchorIds,
      anchorCursor: clamp(Math.round(safeNumber(anchorCursor, 0)), 0, anchorIds.length),
      precomputedPath: precomputedPath?.segments?.length ? precomputedPath : null,
    };
  }

  function inferRouteTargetRegion(prepared, route, fallbackNode) {
    const directRegionId = route?.targetRegionId;
    if (directRegionId && prepared.targetRegionById?.[directRegionId]) {
      return prepared.targetRegionById[directRegionId];
    }
    const candidateRegionIds = new Set();
    const candidateNodeIds = [];
    if (fallbackNode?.id) {
      candidateNodeIds.push(fallbackNode.id);
    }
    (route?.endNodeIds || []).forEach((nodeId) => candidateNodeIds.push(nodeId));
    candidateNodeIds.forEach((nodeId) => {
      const node = prepared.nodeById?.[nodeId];
      (node?.targetRegionIds || []).forEach((regionId) => {
        if (prepared.targetRegionById?.[regionId]) {
          candidateRegionIds.add(regionId);
        }
      });
    });
    const inferredRegionId = candidateRegionIds.values().next().value || null;
    return inferredRegionId ? prepared.targetRegionById[inferredRegionId] || null : null;
  }

  function evaluateFocusCandidate(prepared, scenario, agent, fromPoint, node) {
    const path = findPath(prepared, fromPoint, node);
    if (!path) {
      return null;
    }
    const queueCount = countAgentsNearNode(scenario, node, agent?.id);
    const facilityMode = facilityModeForNode(node);
    const facilityEligibility = getLocomotorFacilityEligibility(agent?.profile?.capacityScores || {}, facilityMode, queueCount);
    if (!facilityEligibility.allowed) {
      return null;
    }
    const basalVelocity = getEffectiveBasalFatigueVelocity(agent?.profile || {});
    const facilityVelocity = basalVelocity * safeNumber(FACILITY_ROUTE_FATIGUE_MULTIPLIER[facilityMode], FACILITY_ROUTE_FATIGUE_MULTIPLIER.generic);
    const walkingSpeed = Math.max(0.45, safeNumber(agent?.profile?.walkingSpeed, 1));
    const environment = evaluateEnvironmentAtPoint(prepared, scenario, node, agent);
    const locomotorMechanics = computeLocomotorMechanicsAtPoint(prepared, scenario, node, {
      agent,
      profile: agent?.profile,
      environment,
      queueCount,
    });
    const walkTime = path.length / walkingSpeed;
    const waitTime = estimateFacilityWaitTime(node, queueCount);
    const rideTime = estimateFacilityRideTime(node);
    const walkCost = walkTime * basalVelocity * safeNumber(environment.crowdFatigueCoefficient, 1);
    const waitCost = waitTime * (0.5 * basalVelocity) * getQueueFatigueCoefficient(queueCount);
    const rideCost = rideTime * facilityVelocity;
    const locomotorCost = safeNumber(locomotorMechanics.raw, 0) * 18 + safeNumber(locomotorMechanics.microJam, 0) * 0.15;
    const totalCost = walkCost + waitCost + rideCost + locomotorCost;
    const threshold = safeNumber(agent?.profile?.fatigueThreshold, getFatigueThreshold(agent?.profile?.capacityScores?.vitality));
    return {
      node,
      path,
      queueCount,
      facilityMode,
      normalizedFacilityMode: normalizeLocomotorFacilityMode(facilityMode),
      facilityPriority: getFocusFacilityPriority(agent, facilityMode),
      walkTime,
      waitTime,
      rideTime,
      cost: totalCost,
      affordable: totalCost <= threshold,
      threshold,
      facilityEligibility,
      locomotorMechanics,
    };
  }

  function buildFocusRouteResolutionState(prepared, scenario, agent, startAnchor, targetRegionId, currentTargetNodeId) {
    const targetRegion = prepared.targetRegionById?.[targetRegionId] || null;
    if (!targetRegion) {
      return null;
    }

    const allCandidateNodes = filterTargetCandidateNodesForAgent(
      targetRegionId,
      agent,
      getTargetCandidateNodes(prepared, targetRegionId)
    );
    const visibleCandidateNodes = allCandidateNodes.filter((node) => distance(startAnchor, node) <= VISION_RADIUS);
    const candidateNodes = visibleCandidateNodes.length ? visibleCandidateNodes : allCandidateNodes;
    const evaluatedCandidates = candidateNodes
      .map((node) => evaluateFocusCandidate(prepared, scenario, agent, startAnchor, node))
      .filter(Boolean)
      .sort(compareFocusCandidateChoice);

    if (!evaluatedCandidates.length) {
      return {
        targetRegion,
        allCandidateNodes,
        visibleCandidateNodes,
        candidateNodes,
        evaluatedCandidates,
        selectedEvaluation: null,
        currentEvaluation: null,
        fallbackMode: 'anchor',
      };
    }

    const absolutePreferredCandidates = evaluatedCandidates.filter((candidate) => candidate.facilityEligibility?.absolutePreferred);
    const affordableCandidates = evaluatedCandidates.filter((candidate) => candidate.affordable).sort(compareFocusCandidateChoice);
    if (!affordableCandidates.length && visibleCandidateNodes.length && visibleCandidateNodes.length < allCandidateNodes.length) {
      return {
        targetRegion,
        allCandidateNodes,
        visibleCandidateNodes,
        candidateNodes,
        evaluatedCandidates,
        selectedEvaluation: null,
        currentEvaluation: null,
        fallbackMode: 'search',
      };
    }
    let selectedEvaluation = affordableCandidates[0] || evaluatedCandidates[0];
    const currentEvaluation = currentTargetNodeId
      ? (absolutePreferredCandidates.length
        ? absolutePreferredCandidates
        : affordableCandidates.length
          ? affordableCandidates
          : evaluatedCandidates).find((item) => item.node.id === currentTargetNodeId)
        || evaluateFocusCandidate(prepared, scenario, agent, startAnchor, prepared.nodeById?.[currentTargetNodeId])
      : null;

    if (currentEvaluation && selectedEvaluation.node.id !== currentEvaluation.node.id) {
      const switchProbability = getFacilitySwitchProbability(currentEvaluation.queueCount);
      if (
        currentEvaluation.facilityPriority === selectedEvaluation.facilityPriority
        && scenario.rng.next() > switchProbability
      ) {
        selectedEvaluation = currentEvaluation;
      }
    }

    return {
      targetRegion,
      allCandidateNodes,
      visibleCandidateNodes,
      candidateNodes,
      evaluatedCandidates,
      absolutePreferredCandidates,
      affordableCandidates,
      selectedEvaluation,
      currentEvaluation,
      fallbackMode: null,
    };
  }

  function createFocusRegionFallbackRoute(targetRegion, startAnchor, mode = 'anchor') {
    const suffix = mode === 'search' ? 'search' : 'anchor';
    return {
      id: `focus_dynamic__${targetRegion.id}__${suffix}__${safeNumber(startAnchor?.x, 0).toFixed(2)}__${safeNumber(startAnchor?.y, 0).toFixed(2)}`,
      family: mode === 'search' ? 'focus_dynamic_search' : 'focus_dynamic',
      startGroupId: 'custom_start',
      endGroupId: targetRegion.id,
      startAnchor: {
        x: safeNumber(startAnchor?.x, 0),
        y: safeNumber(startAnchor?.y, 0),
        z: safeNumber(startAnchor?.z, 0),
      },
      endAnchor: {
        x: safeNumber(targetRegion.anchor?.x, 0),
        y: safeNumber(targetRegion.anchor?.y, 0),
        z: safeNumber(targetRegion.anchor?.z, 0),
      },
      startNodeIds: [],
      endNodeIds: targetRegion.nodeIds || [],
      weight: 1,
      isFocusPreset: false,
      targetRegionId: targetRegion.id,
      targetNodeId: null,
      label: `${targetRegion.labelEn || targetRegion.labelZh || targetRegion.id}`,
    };
  }

  function getNearestPreparedNode(prepared, point, maxDistance = Number.POSITIVE_INFINITY) {
    if (!prepared?.nodes?.length || !point) {
      return null;
    }
    let nearestNode = null;
    let bestDistance = Math.max(0, safeNumber(maxDistance, Number.POSITIVE_INFINITY));
    prepared.nodes.forEach((node) => {
      const currentDistance = distance(point, node);
      if (currentDistance <= bestDistance) {
        bestDistance = currentDistance;
        nearestNode = node;
      }
    });
    return nearestNode;
  }

  function buildVirtualFocusPathSamples(prepared, scenario, agent, targetRegionId) {
    const startAnchor = scenario?.focusStartPoint || scenario?.focusRoute?.startAnchor || agent?.position || null;
    if (!startAnchor || !targetRegionId) {
      return [];
    }
    const resolutionState = buildFocusRouteResolutionState(
      prepared,
      scenario,
      agent,
      startAnchor,
      targetRegionId,
      null
    );
    const basePath = resolutionState?.selectedEvaluation?.path || null;
    if (!basePath?.segments?.length) {
      return [];
    }
    const sampleCount = Math.max(5, Math.min(7, Math.ceil(safeNumber(basePath.length, 0) / 24) + 2));
    return Array.from({ length: sampleCount }, (_, index) => {
      const distanceAlong = sampleCount <= 1
        ? 0
        : (safeNumber(basePath.length, 0) * index) / (sampleCount - 1);
      const point = samplePolyline(basePath, distanceAlong);
      return {
        order: index + 1,
        point: {
          x: safeNumber(point?.x, 0),
          y: safeNumber(point?.y, 0),
          z: safeNumber(startAnchor?.z, 0),
        },
      };
    });
  }

  function resolveVirtualFocusAnchorNode(prepared, scenario, agent, targetRegionId, anchorId) {
    const normalizedAnchorId = String(anchorId || '').trim();
    if (!normalizedAnchorId || normalizedAnchorId === 'custom_start') {
      return null;
    }
    const sampleMatch = normalizedAnchorId.match(/^path_sample_(\d+)$/i);
    if (!sampleMatch) {
      return null;
    }
    const targetOrder = Math.max(1, Math.round(safeNumber(sampleMatch[1], 0)));
    const sample = buildVirtualFocusPathSamples(prepared, scenario, agent, targetRegionId)
      .find((item) => item.order === targetOrder) || null;
    if (!sample?.point) {
      return null;
    }
    return getNearestPreparedNode(prepared, sample.point, 6.5);
  }

  function buildFocusPlanAnchorRuntime(prepared, scenario, targetRegionId) {
    const signature = `${targetRegionId || ''}::${JSON.stringify(Array.isArray(scenario?.llmDecisionPlan?.anchors) ? scenario.llmDecisionPlan.anchors : [])}`;
    const focusAgent = scenario?.focusAgent || null;
    const anchors = (Array.isArray(scenario?.llmDecisionPlan?.anchors) ? scenario.llmDecisionPlan.anchors : [])
      .map((item, index) => ({
        order: Math.max(1, Math.round(safeNumber(item?.order, index + 1))),
        nodeId: String(item?.nodeId || item?.node_id || '').trim(),
        anchorKind: String(item?.anchorKind || item?.anchor_kind || '').trim() || 'checkpoint',
        labelZh: String(item?.labelZh || item?.label_zh || '').trim(),
        labelEn: String(item?.labelEn || item?.label_en || '').trim(),
      }))
      .filter((item) => item.nodeId)
      .sort((left, right) => left.order - right.order);
    const seenNodeIds = new Set();
    const validAnchors = anchors
      .map((item) => {
        const node = prepared?.nodeById?.[item.nodeId]
          || resolveVirtualFocusAnchorNode(prepared, scenario, focusAgent, targetRegionId, item.nodeId)
          || null;
        if (!node || seenNodeIds.has(node.id)) {
          return null;
        }
        seenNodeIds.add(node.id);
        return {
          ...item,
          node,
        };
      })
      .filter(Boolean);
    return {
      signature,
      targetRegionId: targetRegionId || null,
      anchors: validAnchors,
      activeIndex: 0,
      completedNodeIds: {},
    };
  }

  function getFocusPlanAnchorRuntime(prepared, scenario, targetRegionId) {
    if (!scenario) {
      return null;
    }
    const nextSignature = `${targetRegionId || ''}::${JSON.stringify(Array.isArray(scenario?.llmDecisionPlan?.anchors) ? scenario.llmDecisionPlan.anchors : [])}`;
    if (!scenario.focusPlanAnchorRuntime || scenario.focusPlanAnchorRuntime.signature !== nextSignature) {
      scenario.focusPlanAnchorRuntime = buildFocusPlanAnchorRuntime(prepared, scenario, targetRegionId);
    }
    return scenario.focusPlanAnchorRuntime;
  }

  function resetFocusPlanAnchorRuntime(prepared, scenario, targetRegionId) {
    if (!scenario) {
      return null;
    }
    scenario.focusPlanAnchorRuntime = buildFocusPlanAnchorRuntime(prepared, scenario, targetRegionId);
    return scenario.focusPlanAnchorRuntime;
  }

  function getActiveFocusPlanAnchor(prepared, scenario, targetRegionId) {
    const runtime = getFocusPlanAnchorRuntime(prepared, scenario, targetRegionId);
    return runtime?.anchors?.[runtime.activeIndex] || null;
  }

  function resolveFocusPlanAnchorRoute(prepared, scenario, agent, startAnchor, targetRegionId, currentTargetNodeId) {
    const runtime = getFocusPlanAnchorRuntime(prepared, scenario, targetRegionId);
    const targetRegion = prepared?.targetRegionById?.[targetRegionId] || null;
    if (!runtime?.anchors?.length || !targetRegion) {
      return null;
    }
    const resolutionState = buildFocusRouteResolutionState(
      prepared,
      scenario,
      agent,
      startAnchor,
      targetRegionId,
      currentTargetNodeId
    );
    const selectedEvaluation = resolutionState?.currentEvaluation || resolutionState?.selectedEvaluation || null;
    const targetNode = selectedEvaluation?.node || null;
    if (!targetNode) {
      return null;
    }
    const remainingAnchorNodes = runtime.anchors
      .slice(runtime.activeIndex)
      .map((item) => item?.node || null)
      .filter((node) => (
        node
        && !runtime.completedNodeIds?.[node.id]
        && node.id !== targetNode.id
        && distance(startAnchor, node) > 0.85
      ));
    if (!remainingAnchorNodes.length) {
      return null;
    }
    const anchorAwarePath = buildFocusAnchorAwarePath(
      prepared,
      startAnchor,
      targetNode,
      remainingAnchorNodes,
      0
    );
    if (!anchorAwarePath?.path?.segments?.length) {
      return null;
    }
    const activeAnchor = runtime.anchors[runtime.activeIndex] || null;
    return {
      route: createAnchorAwareFocusRoute(
        startAnchor,
        targetRegion,
        targetNode,
        anchorAwarePath.remainingAnchorNodes,
        runtime.activeIndex,
        anchorAwarePath.path
      ),
      targetNode,
      evaluation: selectedEvaluation,
      appliedPlanAnchor: activeAnchor ? {
        order: activeAnchor.order,
        nodeId: activeAnchor.node.id,
        anchorKind: activeAnchor.anchorKind,
        labelZh: activeAnchor.labelZh,
        labelEn: activeAnchor.labelEn,
      } : null,
    };
  }

  function advanceFocusPlanAnchors(prepared, scenario, agent, targetRegionId) {
    const runtime = getFocusPlanAnchorRuntime(prepared, scenario, targetRegionId);
    const completedNodeIds = [];
    if (!runtime?.anchors?.length || !agent?.position) {
      return {
        runtime,
        advanced: false,
        completedNodeIds,
      };
    }
    while (runtime.activeIndex < runtime.anchors.length) {
      const activeAnchor = runtime.anchors[runtime.activeIndex];
      const node = activeAnchor?.node || null;
      if (!node) {
        runtime.activeIndex += 1;
        continue;
      }
      if (runtime.completedNodeIds?.[node.id]) {
        runtime.activeIndex += 1;
        continue;
      }
      if (distance(agent.position, node) > QUEUE_LOCK_RADIUS) {
        break;
      }
      runtime.completedNodeIds[node.id] = 'reached';
      runtime.activeIndex += 1;
      completedNodeIds.push(node.id);
    }
    return {
      runtime,
      advanced: completedNodeIds.length > 0,
      completedNodeIds,
    };
  }

  function resolveFocusRoute(prepared, scenario, agent, startAnchor, targetRegionId, currentTargetNodeId) {
    const anchorResolution = resolveFocusPlanAnchorRoute(
      prepared,
      scenario,
      agent,
      startAnchor,
      targetRegionId,
      currentTargetNodeId
    );
    if (anchorResolution?.route) {
      return anchorResolution;
    }
    const resolutionState = buildFocusRouteResolutionState(
      prepared,
      scenario,
      agent,
      startAnchor,
      targetRegionId,
      currentTargetNodeId
    );
    if (!resolutionState?.targetRegion) {
      return null;
    }
    if (!resolutionState.selectedEvaluation) {
      return {
        route: createFocusRegionFallbackRoute(resolutionState.targetRegion, startAnchor, resolutionState.fallbackMode),
        targetNode: null,
        evaluation: null,
      };
    }
    return {
      route: createDynamicFocusRoute(startAnchor, resolutionState.targetRegion, resolutionState.selectedEvaluation.node),
      targetNode: resolutionState.selectedEvaluation.node,
      evaluation: resolutionState.selectedEvaluation,
    };
  }

  function projectPointOntoPath(path, point) {
    if (!path?.segments?.length || !point) {
      return { alongDistance: 0, distance: Number.POSITIVE_INFINITY };
    }
    let best = { alongDistance: 0, distance: Number.POSITIVE_INFINITY };
    path.segments.forEach((segment) => {
      const dx = safeNumber(segment?.end?.x, 0) - safeNumber(segment?.start?.x, 0);
      const dy = safeNumber(segment?.end?.y, 0) - safeNumber(segment?.start?.y, 0);
      const lengthSquared = dx * dx + dy * dy;
      const projection = lengthSquared <= 1e-9
        ? 0
        : clamp(
            ((safeNumber(point?.x, 0) - safeNumber(segment?.start?.x, 0)) * dx + (safeNumber(point?.y, 0) - safeNumber(segment?.start?.y, 0)) * dy) / lengthSquared,
            0,
            1
          );
      const projectedPoint = {
        x: safeNumber(segment?.start?.x, 0) + dx * projection,
        y: safeNumber(segment?.start?.y, 0) + dy * projection,
      };
      const projectedDistance = distance(point, projectedPoint);
      if (projectedDistance < best.distance) {
        best = {
          alongDistance: safeNumber(segment?.startLength, 0) + safeNumber(segment?.length, 0) * projection,
          distance: projectedDistance,
        };
      }
    });
    return best;
  }

  function serializeFocusCandidateDecision(candidate) {
    return {
      nodeId: candidate?.node?.id || '',
      nodeLabel: candidate?.node?.displayLabelEn || candidate?.node?.displayLabel || candidate?.node?.id || '',
      nodeGroup: candidate?.node?.nodeGroup || '',
      queueCount: Math.max(0, Math.round(safeNumber(candidate?.queueCount, 0))),
      walkTime: Number(safeNumber(candidate?.walkTime, 0).toFixed(2)),
      waitTime: Number(safeNumber(candidate?.waitTime, 0).toFixed(2)),
      rideTime: Number(safeNumber(candidate?.rideTime, 0).toFixed(2)),
      totalCost: Number(safeNumber(candidate?.cost, 0).toFixed(2)),
      affordable: Boolean(candidate?.affordable),
      absolutePreferred: Boolean(candidate?.facilityEligibility?.absolutePreferred),
      facilityMode: facilityModeForNode(candidate?.node),
    };
  }

  function buildFocusDecisionNodeContext(prepared, scenario, agent, startAnchor, targetRegionId, currentTargetNodeId, decisionNode) {
    const resolutionState = buildFocusRouteResolutionState(
      prepared,
      scenario,
      agent,
      startAnchor,
      targetRegionId,
      currentTargetNodeId
    );
    if (!resolutionState?.targetRegion) {
      return null;
    }
    const selectedTargetNodeId = resolutionState.selectedEvaluation?.node?.id || currentTargetNodeId || null;
    const llmContext = buildLLMDecisionContext(prepared, scenario, startAnchor, {
      agent,
      targetRegionId,
      selectedTargetNodeId,
      selectedTargetNodeLabel: selectedTargetNodeId ? (prepared.nodeById?.[selectedTargetNodeId]?.displayLabelEn || prepared.nodeById?.[selectedTargetNodeId]?.displayLabel || selectedTargetNodeId) : null,
      queueCount: safeNumber(agent?.queueCount, 0),
    });
    return {
      decisionNodeId: decisionNode?.id || null,
      decisionNodeLabel: decisionNode?.displayLabelEn || decisionNode?.displayLabel || decisionNode?.id || null,
      targetRegionId,
      targetRegionLabel: resolutionState.targetRegion?.labelEn || resolutionState.targetRegion?.labelZh || resolutionState.targetRegion?.id || null,
      currentTargetNodeId: currentTargetNodeId || null,
      recommendedTargetNodeId: resolutionState.selectedEvaluation?.node?.id || null,
      recommendedTargetNodeLabel: resolutionState.selectedEvaluation?.node?.displayLabelEn || resolutionState.selectedEvaluation?.node?.displayLabel || resolutionState.selectedEvaluation?.node?.id || null,
      candidateNodes: resolutionState.evaluatedCandidates.map(serializeFocusCandidateDecision),
      llmContext,
      resolutionState,
    };
  }

  function buildFocusDecisionPlan(prepared, scenario, agent, options) {
    const startAnchor = options?.startAnchor || scenario?.focusStartPoint || agent?.position || null;
    const targetRegionId = options?.targetRegionId || scenario?.focusTargetRegion?.id || scenario?.focusTargetRegionId || null;
    if (!startAnchor || !targetRegionId) {
      return { routeStyle: null, decisions: [] };
    }
    const initialResolution = resolveFocusRoute(prepared, scenario, agent, startAnchor, targetRegionId, null);
    const basePath = initialResolution?.route ? getRoutePath(prepared, initialResolution.route) : null;
    if (!basePath?.segments?.length) {
      return { routeStyle: null, decisions: [] };
    }

    const decisionNodes = prepared.nodes
      .map((node) => {
        const projection = projectPointOntoPath(basePath, node);
        return {
          node,
          alongDistance: projection.alongDistance,
          pathDistance: projection.distance,
        };
      })
      .filter((item) => item.pathDistance <= DECISION_NODE_RADIUS * 0.95)
      .filter((item) => item.alongDistance >= 0.8 && item.alongDistance <= Math.max(0.8, safeNumber(basePath.length, 0) - 0.8))
      .sort((left, right) => left.alongDistance - right.alongDistance)
      .filter((item, index, items) => (
        index === 0 || Math.abs(item.alongDistance - items[index - 1].alongDistance) > DECISION_NODE_RADIUS * 0.6
      ))
      .slice(0, 8);

    let currentTargetNodeId = initialResolution?.targetNode?.id || null;
    const decisions = decisionNodes
      .map((entry, index) => {
        const sampledPoint = samplePolyline(basePath, entry.alongDistance);
        const context = buildFocusDecisionNodeContext(
          prepared,
          scenario,
          agent,
          sampledPoint,
          targetRegionId,
          currentTargetNodeId,
          entry.node
        );
        if (!context) {
          return null;
        }
        currentTargetNodeId = context.recommendedTargetNodeId || currentTargetNodeId;
        return {
          order: index + 1,
          decisionNodeId: context.decisionNodeId,
          decisionNodeLabel: context.decisionNodeLabel,
          targetRegionId: context.targetRegionId,
          targetRegionLabel: context.targetRegionLabel,
          currentTargetNodeId: context.currentTargetNodeId,
          recommendedTargetNodeId: context.recommendedTargetNodeId,
          recommendedTargetNodeLabel: context.recommendedTargetNodeLabel,
          candidateNodes: context.candidateNodes,
          llmContext: context.llmContext,
        };
      })
      .filter(Boolean);

    return {
      routeStyle: {
        crowdAvoidanceBias: Number(clamp(
          0.38
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.locomotor, 3) / 5) * 0.3
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.vitality, 3) / 5) * 0.18,
          0,
          1
        ).toFixed(3)),
        wallAvoidanceBias: Number(clamp(
          0.34
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.sensory, 3) / 5) * 0.2
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.locomotor, 3) / 5) * 0.18,
          0,
          1
        ).toFixed(3)),
        centerlineBias: Number(clamp(
          0.32
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.psychological, 3) / 5) * 0.15
          + (1 - clampCapacityScore(agent?.profile?.capacityScores?.cognitive, 3) / 5) * 0.14,
          0,
          1
        ).toFixed(3)),
      },
      decisions,
    };
  }

  function buildFocusHumanContext(prepared, scenario, agent, options) {
    const startAnchor = options?.startAnchor || scenario?.focusStartPoint || agent?.position || null;
    const targetRegionId = options?.targetRegionId || scenario?.focusTargetRegion?.id || scenario?.focusTargetRegionId || null;
    if (!startAnchor || !targetRegionId) {
      return {
        routeContext: {
          pathLengthMeters: 0,
          straightLineDistanceMeters: 0,
          directnessRatio: 0,
          decisionPointCount: 0,
          supportsAnchorGeneration: false,
          pathSamples: [],
        },
        environmentContext: {
          sampleSummaries: [],
          averageNoiseLevel: BASE_ENVIRONMENT_NOISE,
          maxCrowdDensity: 0,
          peakPressureScore: 0,
          narrowPassageCount: 0,
        },
      };
    }
    const initialResolution = resolveFocusRoute(prepared, scenario, agent, startAnchor, targetRegionId, null);
    const basePath = initialResolution?.route ? getRoutePath(prepared, initialResolution.route) : (agent?.path || null);
    if (!basePath?.segments?.length) {
      return {
        routeContext: {
          pathLengthMeters: 0,
          straightLineDistanceMeters: 0,
          directnessRatio: 0,
          decisionPointCount: 0,
          supportsAnchorGeneration: false,
          pathSamples: [],
        },
        environmentContext: {
          sampleSummaries: [],
          averageNoiseLevel: BASE_ENVIRONMENT_NOISE,
          maxCrowdDensity: 0,
          peakPressureScore: 0,
          narrowPassageCount: 0,
        },
      };
    }

    const decisionPlan = options?.decisionPlan || buildFocusDecisionPlan(prepared, scenario, agent, {
      startAnchor,
      targetRegionId,
    });
    const sampleCount = Math.max(5, Math.min(7, Math.ceil(safeNumber(basePath.length, 0) / 24) + 2));
    const sampleDistances = Array.from({ length: sampleCount }, (_, index) => (
      sampleCount <= 1
        ? 0
        : (safeNumber(basePath.length, 0) * index) / (sampleCount - 1)
    ));
    const routeSamples = sampleDistances.map((distanceAlong, index) => {
      const point = samplePolyline(basePath, distanceAlong);
      const environment = evaluateEnvironmentAtPoint(prepared, scenario, point, agent);
      const wallDistance = Number.isFinite(getBoundaryClearanceAtPoint(prepared, point))
        ? getBoundaryClearanceAtPoint(prepared, point)
        : safeNumber(findNearestWalkableCell(prepared.grid, point)?.wallDistance, 0);
      const pressureState = extractPressureAtPoint(prepared, scenario, point, {
        agent: agent ? {
          id: agent.id,
          profile: agent.profile,
          selectedTargetNodeId: agent.selectedTargetNodeId,
          pressureEventStates: {},
          accumulatedStress: safeNumber(agent.accumulatedStress, 0),
        } : null,
        environment,
        applyTriggers: false,
      });
      const crowdDensity = getScenarioCrowdDensityAtPoint(prepared, scenario, point, agent, 'local');
      const spatialBand = wallDistance >= 2.4
        ? 'open'
        : wallDistance >= 1.35
          ? 'transitional'
          : 'narrow';
      const topPressureSources = serializeTopPressureSources(pressureState?.contributions, 3);
      return {
        order: index + 1,
        progress: Number(clamp(safeNumber(distanceAlong, 0) / Math.max(1e-6, safeNumber(basePath.length, 0)), 0, 1).toFixed(3)),
        x: Number(safeNumber(point?.x, 0).toFixed(3)),
        y: Number(safeNumber(point?.y, 0).toFixed(3)),
        wallDistance: Number(safeNumber(wallDistance, 0).toFixed(3)),
        spatialBand,
        crowdDensity: Number(safeNumber(crowdDensity, 0).toFixed(3)),
        noiseLevel: Number(safeNumber(environment?.noiseLevel, BASE_ENVIRONMENT_NOISE).toFixed(3)),
        lightingLevel: Number(safeNumber(environment?.lightingLevel, BASE_ENVIRONMENT_LIGHTING).toFixed(3)),
        pressureScore: Number(safeNumber(pressureState?.pressureScore, 0).toFixed(3)),
        topPressureSources,
      };
    });
    const straightLineDistance = distance(basePath.startPoint, basePath.endPoint);
    const averageNoiseLevel = routeSamples.length
      ? routeSamples.reduce((total, item) => total + safeNumber(item.noiseLevel, BASE_ENVIRONMENT_NOISE), 0) / routeSamples.length
      : BASE_ENVIRONMENT_NOISE;
    const maxCrowdDensity = routeSamples.length
      ? Math.max(...routeSamples.map((item) => safeNumber(item.crowdDensity, 0)))
      : 0;
    const peakPressureScore = routeSamples.length
      ? Math.max(...routeSamples.map((item) => safeNumber(item.pressureScore, 0)))
      : 0;
    const narrowPassageCount = routeSamples.filter((item) => item.spatialBand === 'narrow').length;
    const decisionPointCount = Array.isArray(decisionPlan?.decisions) ? decisionPlan.decisions.length : 0;
    const supportsAnchorGeneration = safeNumber(basePath.length, 0) >= 12 && (
      decisionPointCount > 0
      || narrowPassageCount >= 2
      || peakPressureScore >= 18
      || averageNoiseLevel >= 78
      || maxCrowdDensity >= 1.1
    );

    return {
      routeContext: {
        pathLengthMeters: Number(safeNumber(basePath.length, 0).toFixed(3)),
        straightLineDistanceMeters: Number(safeNumber(straightLineDistance, 0).toFixed(3)),
        directnessRatio: Number(clamp(
          safeNumber(straightLineDistance, 0) / Math.max(1e-6, safeNumber(basePath.length, 0)),
          0,
          1
        ).toFixed(3)),
        decisionPointCount,
        supportsAnchorGeneration,
        pathSamples: routeSamples.map((item) => ({
          order: item.order,
          progress: item.progress,
          x: item.x,
          y: item.y,
          spatialBand: item.spatialBand,
          wallDistance: item.wallDistance,
        })),
      },
      environmentContext: {
        sampleSummaries: routeSamples,
        averageNoiseLevel: Number(averageNoiseLevel.toFixed(3)),
        maxCrowdDensity: Number(maxCrowdDensity.toFixed(3)),
        peakPressureScore: Number(peakPressureScore.toFixed(3)),
        narrowPassageCount,
      },
    };
  }

  function applyFocusDecisionPlanAtNode(prepared, scenario, agent, decisionNode, targetRegionId) {
    const plannedDecision = Array.isArray(scenario?.llmDecisionPlan?.decisions)
      ? scenario.llmDecisionPlan.decisions.find((item) => item?.decisionNodeId === decisionNode?.id)
      : null;
    if (!plannedDecision?.chosenTargetNodeId) {
      const resolution = resolveFocusRoute(
        prepared,
        scenario,
        agent,
        agent?.position,
        targetRegionId,
        agent?.selectedTargetNodeId
      );
      return resolution
        ? {
            ...resolution,
            appliedPlanDecision: null,
          }
        : null;
    }
    const resolutionState = buildFocusRouteResolutionState(
      prepared,
      scenario,
      agent,
      agent?.position,
      targetRegionId,
      agent?.selectedTargetNodeId
    );
    if (!resolutionState?.targetRegion) {
      return null;
    }
    if (!resolutionState.selectedEvaluation) {
      return {
        route: createFocusRegionFallbackRoute(resolutionState.targetRegion, agent?.position, resolutionState.fallbackMode),
        targetNode: null,
        evaluation: null,
        appliedPlanDecision: null,
      };
    }
    const plannedEvaluation = resolutionState.evaluatedCandidates.find((candidate) => candidate?.node?.id === plannedDecision.chosenTargetNodeId) || null;
    if (!plannedEvaluation) {
      const resolution = resolveFocusRoute(
        prepared,
        scenario,
        agent,
        agent?.position,
        targetRegionId,
        agent?.selectedTargetNodeId
      );
      return resolution
        ? {
            ...resolution,
            appliedPlanDecision: null,
          }
        : {
            route: createDynamicFocusRoute(agent.position, resolutionState.targetRegion, resolutionState.selectedEvaluation.node),
            targetNode: resolutionState.selectedEvaluation.node,
            evaluation: resolutionState.selectedEvaluation,
            appliedPlanDecision: null,
          };
    }
    const selectedEvaluation = plannedEvaluation || resolutionState.selectedEvaluation;
    return {
      route: createDynamicFocusRoute(agent.position, resolutionState.targetRegion, selectedEvaluation.node),
      targetNode: selectedEvaluation.node,
      evaluation: selectedEvaluation,
      appliedPlanDecision: plannedEvaluation ? plannedDecision : null,
    };
  }

  function createHeatState(grid) {
    const raw = new Float64Array(grid.cells.length);
    const pressureAcc = new Float64Array(grid.cells.length);
    const fatigueAcc = new Float64Array(grid.cells.length);
    const progressAcc = new Float64Array(grid.cells.length);
    const cells = grid.walkableIndices.map((index) => ({
      index,
      x: grid.cells[index].x,
      y: grid.cells[index].y,
      heat: 0,
      pressure: 0,
      fatigue: 0,
      progress: 0,
      usage: 0,
    }));
    return {
      raw,
      pressureAcc,
      fatigueAcc,
      progressAcc,
      cells,
      cellByIndex: Object.fromEntries(cells.map((cell) => [cell.index, cell])),
      maxHeat: 0,
      totalDeposits: 0,
    };
  }

  function refreshHeatState(heat, grid, mode = 'decay-live') {
    let maxDisplayHeat = 0;

    grid.walkableIndices.forEach((index) => {
      const cell = heat.cellByIndex[index];
      const raw = heat.raw[index];
      const displayHeat = Math.max(0, raw);
      cell.heat = mode === CUMULATIVE_HEAT_MODE ? Math.max(cell.heat || 0, displayHeat) : displayHeat;
      cell.usage = cell.heat;
      cell.pressure = raw > 1e-9 ? heat.pressureAcc[index] : 0;
      cell.fatigue = raw > 1e-9 ? heat.fatigueAcc[index] : 0;
      cell.progress = raw > 1e-9 ? heat.progressAcc[index] : 0;
      maxDisplayHeat = Math.max(maxDisplayHeat, cell.heat);
    });
    heat.maxHeat = maxDisplayHeat;
  }

  function buildScenarioSummary(prepared, scenario) {
    const lapTimes = scenario.focusMetrics?.lapTimes || [];
    const lapFatigues = scenario.focusMetrics?.lapFatigues || [];
    const averageTravelTime = lapTimes.length ? lapTimes.reduce((sum, value) => sum + value, 0) / lapTimes.length : scenario.focusAgent.path.length / Math.max(0.6, scenario.focusAgent.profile.walkingSpeed);
    const averageFatigue = lapFatigues.length ? lapFatigues.reduce((sum, value) => sum + value, 0) / lapFatigues.length : scenario.focusAgent.fatigue;
    const warmCells = scenario.heat.cells.filter((cell) => cell.heat > 0.5);
    const averageHeat = warmCells.length ? warmCells.reduce((sum, cell) => sum + cell.heat, 0) / warmCells.length : 0;
    const burdenSnapshots = (scenario.focusTraceSnapshots || [])
      .map((snapshot) => snapshot.burdenScores)
      .filter(Boolean);
    const averageBurdens = {};
    FIVE_DIMENSION_ORDER.forEach((id) => {
      averageBurdens[id] = burdenSnapshots.length
        ? burdenSnapshots.reduce((sum, item) => sum + safeNumber(item[id], 0), 0) / burdenSnapshots.length
        : 0;
    });
    const peakBurdenId = FIVE_DIMENSION_ORDER.reduce((bestId, id) => (
      safeNumber(averageBurdens[id], 0) > safeNumber(averageBurdens[bestId], 0) ? id : bestId
    ), FIVE_DIMENSION_ORDER[0]);
    return {
      simultaneousCount: safeNumber(scenario.requestedCrowdCount, scenario.agents.length),
      activePressureCount: prepared.activePressureObjects.length,
      averageTravelTime,
      averageFatigue,
      averageHeat,
      averageBurdens,
      peakBurdenId,
      peakBurdenScore: safeNumber(averageBurdens[peakBurdenId], 0),
    };
  }

  function distanceToSegment(point, start, end) {
    const abx = end.x - start.x;
    const aby = end.y - start.y;
    const ab2 = abx * abx + aby * aby;
    if (ab2 <= 1e-9) {
      return distance(point, start);
    }
    const apx = point.x - start.x;
    const apy = point.y - start.y;
    const t = clamp((apx * abx + apy * aby) / ab2, 0, 1);
    return distance(point, { x: start.x + abx * t, y: start.y + aby * t });
  }

  function distanceToPath(path, point) {
    if (!path?.segments?.length) {
      return Number.POSITIVE_INFINITY;
    }
    return path.segments.reduce((best, segment) => Math.min(best, distanceToSegment(point, segment.start, segment.end)), Number.POSITIVE_INFINITY);
  }

  function updateHotspots(prepared, scenario) {
    const primary = Object.entries(scenario.pressureImpactMap)
      .map(([id, score]) => {
        const pressurePoint = prepared.pressureById[id];
        if (!pressurePoint) {
          return null;
        }
        return {
          id: pressurePoint.id,
          name: pressurePoint.name || pressurePoint.id,
          category: pressurePoint.category,
          x: pressurePoint.x,
          y: pressurePoint.y,
          feature: pressurePoint.feature,
          score,
          pressure: score,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    const hotspotIds = new Set(primary.map((item) => item.id));
    if (primary.length < 3 && scenario.focusRoute) {
      prepared.activePressureObjects
        .filter((item) => !hotspotIds.has(item.id))
        .map((item) => {
          const descriptor = resolveStressRuleDescriptor(item);
          const distanceWeight = Math.max(0, 1 - distanceToPath(getRoutePath(prepared, scenario.focusRoute), item) / 15);
          const positivePotential = descriptor
            ? descriptor.ambientOnly
              ? getNoiseContributionAtPoint(item, item) * AMBIENT_NOISE_STRESS_SCALE
              : getExpectedPositiveStress(descriptor, { crowdDensityPerception: 0, noiseLevel: BASE_ENVIRONMENT_NOISE })
            : Math.max(0, safeNumber(item.strength, 0) * 100);
          return {
            id: item.id,
            name: item.name || item.id,
            category: item.category,
            x: item.x,
            y: item.y,
            feature: item.feature,
            score: descriptor ? positivePotential * distanceWeight : Math.max(0, 100 - distanceToPath(getRoutePath(prepared, scenario.focusRoute), item) * 12),
            pressure: positivePotential,
          };
        })
        .filter((item) => item.score > 0.01)
        .sort((left, right) => right.score - left.score)
        .slice(0, 3 - primary.length)
        .forEach((item) => primary.push(item));
    }

    if (primary.length < 3 && scenario.focusRoute) {
      const fallbackIds = new Set(primary.map((item) => item.id));
      prepared.activePressureObjects
        .filter((item) => !fallbackIds.has(item.id))
        .map((item) => ({
          id: item.id,
          name: item.name || item.id,
          category: item.category,
          x: item.x,
          y: item.y,
          feature: item.feature,
          score: Math.max(0, 100 - distanceToPath(getRoutePath(prepared, scenario.focusRoute), item) * 12),
          pressure: Math.max(0, safeNumber(item.strength, 0) * 100),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 3 - primary.length)
        .forEach((item) => primary.push(item));
    }

    scenario.hotspots = primary;
    scenario.suggestions = scenario.hotspots.map((item) => suggestionForCategory(item.category));
    scenario.summary = buildScenarioSummary(prepared, scenario);
  }

  function finalizeScenarioPostProcess(prepared, scenario) {
    refreshHeatState(scenario.heat, prepared.grid, scenario.heatMode);
    updateHotspots(prepared, scenario);
    refreshScenarioAgentCollections(scenario);
    return scenario;
  }

  function refreshScenarioAgentCollections(scenario) {
    scenario.focusAgent = scenario.agents.find((agent) => agent.id === scenario.focusAgentId) || null;
    scenario.backgroundAgents = scenario.agents.filter((agent) => !agent.isFocusAgent);
    scenario.backgroundAgentById = Object.fromEntries(
      scenario.backgroundAgents.map((agent) => [agent.id, agent])
    );
    return scenario;
  }

  function getRoutePath(prepared, route) {
    if (route?.precomputedPath?.segments?.length) {
      return route.precomputedPath;
    }
    prepared.routePathCache = prepared.routePathCache || {};
    if (!prepared.routePathCache[route.id]) {
      prepared.routePathCache[route.id] = findPath(prepared, route.startAnchor, route.endAnchor);
    }
    return prepared.routePathCache[route.id];
  }

  function getRoutePathForTerminalNode(prepared, route, terminalNodeId) {
    if (!prepared || !route) {
      return null;
    }
    const terminalNode = terminalNodeId ? prepared.nodeById?.[terminalNodeId] || null : null;
    const useTerminalNode = Boolean(
      terminalNode
      && Array.isArray(route?.endNodeIds)
      && route.endNodeIds.includes(terminalNodeId)
    );
    const cacheKey = useTerminalNode ? `${route.id}::${terminalNodeId}` : route.id;
    prepared.routePathCache = prepared.routePathCache || {};
    if (!prepared.routePathCache[cacheKey]) {
      prepared.routePathCache[cacheKey] = findPath(
        prepared,
        route.startAnchor,
        useTerminalNode ? terminalNode : route.endAnchor
      );
    }
    return prepared.routePathCache[cacheKey];
  }

  function computeCrowdDensity(scenario, point, selfAgent) {
    return getScenarioCrowdDensityAtPoint(scenario?.prepared || null, scenario, point, selfAgent, 'local');
  }

  function computePerceptionCrowdDensity(scenario, point, selfAgent) {
    return getScenarioCrowdDensityAtPoint(scenario?.prepared || null, scenario, point, selfAgent, 'local');
  }

  function getQueueFatigueCoefficient(queueCount) {
    if (queueCount < 3) return 1;
    if (queueCount <= 5) return 1.2;
    return 1.5;
  }

  function getCrowdingFatigueCoefficient(crowdDensity) {
    if (crowdDensity < 1) return 1;
    if (crowdDensity < 3) return 1.2;
    if (crowdDensity <= 5) return 1.4;
    return 1.6;
  }

  function getNoiseFatigueCoefficient(noiseLevel) {
    if (noiseLevel <= 60) return 1;
    if (noiseLevel <= 70) return 1.1;
    if (noiseLevel <= 80) return 1.3;
    return 1.5;
  }

  function getLightingFatigueCoefficient(lightingLevel) {
    if (lightingLevel > 1000) return 1.3;
    if (lightingLevel >= 500) return 1.1;
    if (lightingLevel >= 200) return 1;
    return 1.1;
  }

  function getCrowdingStressCoefficients(crowdDensity) {
    const density = Math.max(0, safeNumber(crowdDensity, 0));
    if (density < 1) return { positive: 1, negative: 1 };
    if (density <= 3) return { positive: 1.2, negative: 0.8 };
    if (density <= 5) return { positive: 1.4, negative: 0.7 };
    return { positive: 1.6, negative: 0.6 };
  }

  function getNoiseStressCoefficients(noiseLevel) {
    const noise = Math.max(0, safeNumber(noiseLevel, BASE_ENVIRONMENT_NOISE));
    if (noise < 60) return { positive: 1, negative: 1 };
    if (noise <= 70) return { positive: 1.1, negative: 0.9 };
    if (noise <= 80) return { positive: 1.3, negative: 0.8 };
    return { positive: 1.5, negative: 0.7 };
  }

  function getLightingStressCoefficients(lightingLevel) {
    const lighting = Math.max(0, safeNumber(lightingLevel, BASE_ENVIRONMENT_LIGHTING));
    if (lighting > 1000) return { positive: 1.3, negative: 1 };
    if (lighting >= 500) return { positive: 1.1, negative: 1 };
    if (lighting >= 200) return { positive: 1, negative: 1 };
    return { positive: 1.1, negative: 1 };
  }

  function getStressEnvironmentMultiplier(environment, stressDelta) {
    if (!stressDelta) {
      return 1;
    }
    const crowding = getCrowdingStressCoefficients(getUnifiedCrowdDensity(environment, 0));
    const noise = getNoiseStressCoefficients(environment?.noiseLevel);
    const lighting = getLightingStressCoefficients(environment?.lightingLevel);
    if (stressDelta >= 0) {
      return crowding.positive * noise.positive * lighting.positive;
    }
    return crowding.negative * noise.negative * lighting.negative;
  }

  function getAmbientCrowdingStressContribution(crowdDensity) {
    const coefficients = getCrowdingStressCoefficients(crowdDensity);
    return Math.max(0, (coefficients.positive - 1) * AMBIENT_CROWD_STRESS_SCALE);
  }

  function getAmbientLightingStressContribution(lightingLevel) {
    const coefficients = getLightingStressCoefficients(lightingLevel);
    return Math.max(0, (coefficients.positive - 1) * 100);
  }

  function getQueueStressContribution(queueCount) {
    const normalizedQueue = Math.max(0, Math.floor(safeNumber(queueCount, 0)));
    if (normalizedQueue < 3) return 0;
    if (normalizedQueue <= 5) return 10;
    if (normalizedQueue <= 10) return 25;
    return 40;
  }

  function isQueueRelevantNode(node) {
    return isExplicitBackgroundQueueNode(node);
  }

  function getNoiseContributionAtPoint(pressurePoint, point) {
    const decibel = safeNumber(pressurePoint?.decibel, 0);
    if (decibel <= 0) {
      return 0;
    }
    const effectiveRange = Math.max(1.5, safeNumber(pressurePoint?.range, 0), 6);
    const currentDistance = distance(point, pressurePoint);
    if (currentDistance > effectiveRange * 2) {
      return 0;
    }
    const decay = Math.exp(-Math.pow(currentDistance / effectiveRange, 2));
    return decibel * decay;
  }

  function collectQueueStressSources(prepared, scenario, point, options) {
    const explicitQueueCount = Number(options?.queueCount);
    if (Number.isFinite(explicitQueueCount)) {
      const stress = getQueueStressContribution(explicitQueueCount);
      if (stress <= 0) {
        return [];
      }
      return [{
        pressurePoint: {
          id: 'queue-area',
          name: 'Queue area',
          category: 'queue',
          feature: 'queue',
          x: safeNumber(point?.x, 0),
          y: safeNumber(point?.y, 0),
        },
        queueCount: explicitQueueCount,
        stress,
      }];
    }

    return (prepared?.nodes || [])
      .filter((node) => isQueueRelevantNode(node))
      .map((node) => {
        if (distance(point, node) > QUEUE_LOCK_RADIUS) {
          return null;
        }
        const queueCount = countAgentsNearNode(scenario, node, options?.agent?.id);
        const stress = getQueueStressContribution(queueCount);
        if (stress <= 0) {
          return null;
        }
        return {
          pressurePoint: {
            id: `queue-${node.id}`,
            name: node.displayLabelEn || node.displayLabel || node.id,
            category: 'queue',
            feature: 'queue',
            x: safeNumber(node.x, 0),
            y: safeNumber(node.y, 0),
          },
          queueCount,
          stress,
        };
      })
      .filter(Boolean);
  }

  function buildStressOutcomes(outcomes) {
    return (outcomes || []).map((item) => ({
      state: item.state,
      probability: safeNumber(item.probability, 0),
      stressDelta: safeNumber(item.stressDelta, 0),
    }));
  }

  function resolveStressRuleDescriptor(item) {
    const normalizedName = normalizeRuleToken(item?.name);
    const normalizedFeature = normalizeRuleToken(item?.feature);
    const normalizedCategory = normalizeRuleToken(item?.category);
    const combined = `${normalizedName} ${normalizedFeature}`.trim();

    if (
      normalizedName.includes('customer service centre')
      || normalizedName.includes('customer service center')
      || normalizedName.includes('help line')
    ) {
      return { ...STRESS_RULE_LIBRARY.customer_service_centre, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.customer_service_centre.outcomes) };
    }
    if (normalizedName.includes('ai virtual service ambassador')) {
      return { ...STRESS_RULE_LIBRARY.ai_virtual_service_ambassador, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.ai_virtual_service_ambassador.outcomes) };
    }
    if (combined.includes('emergency') || combined.includes('alarm broadcast')) {
      return { ...STRESS_RULE_LIBRARY.broadcast_alarm, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.broadcast_alarm.outcomes) };
    }
    if (combined.includes('broadcast') && includesAny(combined, ['blur', 'blurry', 'unclear'])) {
      return { ...STRESS_RULE_LIBRARY.broadcast_blurry, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.broadcast_blurry.outcomes) };
    }
    if (combined.includes('broadcast')) {
      return { ...STRESS_RULE_LIBRARY.broadcast_clear, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.broadcast_clear.outcomes) };
    }
    if (normalizedName === 'lcd' || normalizedName.includes(' lcd') || normalizedName.startsWith('lcd ')) {
      return { ...STRESS_RULE_LIBRARY.lcd_brief, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.lcd_brief.outcomes) };
    }
    if (
      normalizedName.includes('common direction signs')
      || normalizedName.includes('ground atm signage')
      || normalizedName.includes('atm signage')
    ) {
      if (includesAny(combined, ['confuse', 'confusion', 'improper', 'wrong place'])) {
        return { ...STRESS_RULE_LIBRARY.signage_confusing, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.signage_confusing.outcomes) };
      }
      return { ...STRESS_RULE_LIBRARY.common_direction_signs_brief, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.common_direction_signs_brief.outcomes) };
    }
    if (normalizedName.includes('panoramic guide map')) {
      return { ...STRESS_RULE_LIBRARY.panoramic_guide_map_detailed, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.panoramic_guide_map_detailed.outcomes) };
    }
    if (normalizedName.includes('hanging signs')) {
      if (includesAny(combined, ['small font', 'font is too small', 'too small'])) {
        return { ...STRESS_RULE_LIBRARY.signage_small_font, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.signage_small_font.outcomes) };
      }
      return { ...STRESS_RULE_LIBRARY.hanging_signs_brief, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.hanging_signs_brief.outcomes) };
    }
    if (
      normalizedName.includes('advertisement')
      || normalizedName.includes('advertising')
      || normalizedCategory === 'advert'
    ) {
      if (normalizedFeature.includes('psa') || normalizedFeature.includes('artwork')) {
        return { ...STRESS_RULE_LIBRARY.advertisement_psa, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.advertisement_psa.outcomes) };
      }
      if (
        normalizedFeature.includes('dynamic flashing ads')
        || safeNumber(item?.lux, 0) >= 1000
        || safeNumber(item?.decibel, 0) >= 80
      ) {
        return { ...STRESS_RULE_LIBRARY.advertisement_dynamic, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.advertisement_dynamic.outcomes) };
      }
      return { ...STRESS_RULE_LIBRARY.advertisement_static, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.advertisement_static.outcomes) };
    }
    if (
      normalizedName.includes('tactile paving')
      || normalizedCategory === 'decision'
      || includesAny(combined, ['decision', 'blind elderly people may be confused'])
    ) {
      return { ...STRESS_RULE_LIBRARY.decision_conflict, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.decision_conflict.outcomes) };
    }
    if (
      normalizedName.includes('noise')
      || safeNumber(item?.decibel, 0) > 0
      || normalizedCategory === 'noise'
      || normalizedCategory === 'noise congestion'
      || normalizedCategory === 'noise_congestion'
    ) {
      return { ...STRESS_RULE_LIBRARY.ambient_noise, triggerRadius: Math.max(6, safeNumber(item?.range, 0), 6), outcomes: [] };
    }
    if (normalizedCategory === 'signage' || includesAny(combined, ['sign', 'guide', 'guidance', 'direction'])) {
      if (includesAny(combined, ['confuse', 'confusion', 'improper'])) {
        return { ...STRESS_RULE_LIBRARY.signage_confusing, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.signage_confusing.outcomes) };
      }
      if (includesAny(combined, ['small font', 'too small'])) {
        return { ...STRESS_RULE_LIBRARY.signage_small_font, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.signage_small_font.outcomes) };
      }
      return { ...STRESS_RULE_LIBRARY.common_direction_signs_brief, outcomes: buildStressOutcomes(STRESS_RULE_LIBRARY.common_direction_signs_brief.outcomes) };
    }
    return null;
  }

  function sampleStressOutcome(ruleDescriptor, rng) {
    const outcomes = buildStressOutcomes(ruleDescriptor?.outcomes);
    if (!outcomes.length) {
      return { state: 'No effect', stressDelta: 0 };
    }
    const randomValue = rng.next();
    let cumulativeProbability = 0;
    for (let index = 0; index < outcomes.length; index += 1) {
      cumulativeProbability += outcomes[index].probability;
      if (randomValue <= cumulativeProbability + 1e-9) {
        return { state: outcomes[index].state, stressDelta: outcomes[index].stressDelta };
      }
    }
    const fallback = outcomes[outcomes.length - 1];
    return { state: fallback.state, stressDelta: fallback.stressDelta };
  }

  function ensureStressMemory(agent) {
    if (!agent.pressureEventStates) {
      agent.pressureEventStates = {};
    }
    if (!Number.isFinite(agent.accumulatedStress)) {
      agent.accumulatedStress = 0;
    }
    return agent.pressureEventStates;
  }

  function getExpectedPositiveStress(ruleDescriptor, environment) {
    return buildStressOutcomes(ruleDescriptor?.outcomes).reduce((total, outcome) => {
      if (outcome.stressDelta <= 0) {
        return total;
      }
      return total + outcome.probability * outcome.stressDelta * getStressEnvironmentMultiplier(environment, outcome.stressDelta);
    }, 0);
  }

  function getExpectedNetStress(ruleDescriptor, environment) {
    return buildStressOutcomes(ruleDescriptor?.outcomes).reduce((total, outcome) => (
      total + outcome.probability * outcome.stressDelta * getStressEnvironmentMultiplier(environment, outcome.stressDelta)
    ), 0);
  }

  function getFatigueThreshold(value) {
    const numeric = safeNumber(value, NaN);
    if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 5) {
      return safeNumber(FATIGUE_THRESHOLDS[Math.round(numeric)], FATIGUE_THRESHOLDS.default);
    }
    return safeNumber(FATIGUE_THRESHOLDS.default, 100);
  }

  function isFatigueThresholdSlowWalkActive(agent) {
    const threshold = safeNumber(agent?.fatigueThreshold, getFatigueThreshold(agent?.profile?.capacityScores?.vitality));
    return threshold > 0 && safeNumber(agent?.fatigue, 0) >= threshold - 1e-6;
  }

  function evaluateEnvironmentAtPoint(prepared, scenario, point, selfAgent) {
    let noiseLevel = BASE_ENVIRONMENT_NOISE;
    let lightingLevel = BASE_ENVIRONMENT_LIGHTING;
    prepared.pressureObjects.forEach((item) => {
      const currentDistance = distance(point, item);
      const effectiveRange = Math.max(1.5, item.range || 0, item.decibel ? 6 : 0, item.lux ? 6 : 0);
      if (currentDistance > effectiveRange * 2) {
        return;
      }
      const decay = Math.exp(-Math.pow(currentDistance / effectiveRange, 2));
      if (item.decibel) {
        noiseLevel += item.decibel * decay;
      }
      if (item.lux) {
        lightingLevel += item.lux * decay;
      }
    });
    const crowdDensityLocal = computeCrowdDensity(scenario, point, selfAgent);
    const crowdDensityPerception = crowdDensityLocal;
    return {
      crowdDensityLocal,
      crowdDensityPerception,
      crowdFatigueCoefficient: getCrowdingFatigueCoefficient(crowdDensityLocal),
      noiseLevel,
      noiseFatigueCoefficient: getNoiseFatigueCoefficient(noiseLevel),
      lightingLevel,
      lightingFatigueCoefficient: getLightingFatigueCoefficient(lightingLevel),
    };
  }

  function computeQueuePopulation(scenario, nodeId, options) {
    if (!nodeId) {
      return 0;
    }
    const node = scenario.prepared?.nodeById?.[nodeId];
    if (!node) {
      return 0;
    }
    if (isExplicitBackgroundQueueNode(node)) {
      return countAgentsNearNode(scenario, node);
    }
    if (!options?.includeOrdinaryTargetNode) {
      return 0;
    }
    return countAgentsWithinNodeRadius(scenario, node, safeNumber(options?.ordinaryRadius, QUEUE_LOCK_RADIUS));
  }

  function computeAvoidanceVector(scenario, selfAgent) {
    if (!scenario || !selfAgent?.position) {
      return { vector: { x: 0, y: 0 }, nearestDistance: Number.POSITIVE_INFINITY };
    }
    const selfPosition = selfAgent.position;
    const selfTangent = normalizeVector(selfAgent?.tangent || { x: 1, y: 0 }, { x: 1, y: 0 });
    const influenceRadius = AVOIDANCE_TARGET_DISTANCE * (selfAgent?.isFocusAgent ? 1.25 : 1);
    const accumulated = { x: 0, y: 0 };
    let nearestDistance = Number.POSITIVE_INFINITY;
    scenario.agents.forEach((agent) => {
      if (!agent?.active || agent.id === selfAgent.id || !agent.position) {
        return;
      }
      const separation = distance(selfPosition, agent.position);
      if (!Number.isFinite(separation) || separation <= 1e-6 || separation > influenceRadius) {
        return;
      }
      nearestDistance = Math.min(nearestDistance, separation);
      const away = normalizeVector({
        x: selfPosition.x - agent.position.x,
        y: selfPosition.y - agent.position.y,
      }, { x: 0, y: 0 });
      const forwardOffset = (
        (agent.position.x - selfPosition.x) * selfTangent.x
        + (agent.position.y - selfPosition.y) * selfTangent.y
      );
      const aheadWeight = forwardOffset >= -0.35 ? 1.2 : 0.72;
      const proximityWeight = 1 - separation / influenceRadius;
      const weight = proximityWeight * proximityWeight * aheadWeight;
      accumulated.x += away.x * weight;
      accumulated.y += away.y * weight;
    });
    const vector = (Math.abs(accumulated.x) > 1e-6 || Math.abs(accumulated.y) > 1e-6)
      ? normalizeVector(accumulated, { x: 0, y: 0 })
      : { x: 0, y: 0 };
    return {
      vector,
      nearestDistance,
    };
  }

  function nearestAgentDistance(scenario, point, selfId) {
    let best = Number.POSITIVE_INFINITY;
    scenario.agents.forEach((agent) => {
      if (!agent.active || agent.id === selfId) {
        return;
      }
      best = Math.min(best, distance(agent.position, point));
    });
    return best;
  }

  function minimumAgentProgress(agent) {
    if (agent.isFocusAgent) {
      return 0;
    }
    const pathLength = agent.pathLength || agent.path?.length || 0;
    return clamp(4.6 + safeNumber(agent.startProgressJitter, 0.7), 4.6, Math.max(4.6, Math.min(10.5, pathLength * 0.34 || 10.5)));
  }

  function getBackgroundSpawnProgressDist(agent) {
    if (agent.isFocusAgent) {
      return 0;
    }
    const pathLength = Math.max(1e-6, safeNumber(agent.pathLength, agent.path?.length, 0));
    const startProgressJitter = safeNumber(agent.startProgressJitter, 0.7);
    const jitterUnit = clamp((startProgressJitter - 0.45) / 1.65, 0, 1);
    if (pathLength <= 8) {
      const shortRouteMax = Math.max(1.4, Math.min(pathLength * 0.42, pathLength - 1.2));
      const shortRouteMin = Math.min(shortRouteMax, Math.max(1.1, pathLength * 0.22));
      return lerp(shortRouteMin, shortRouteMax, jitterUnit);
    }
    return minimumAgentProgress(agent);
  }

  function getBackgroundInitialProgressDist(prepared, agent, requestedProgressDist) {
    if (agent.isFocusAgent) {
      return Math.max(0, requestedProgressDist);
    }
    const pathLength = Math.max(1e-6, safeNumber(agent.pathLength, agent.path?.length, 0));
    const minimumProgressDist = getBackgroundSpawnProgressDist(agent);
    const initialStartClearance = clamp(
      pathLength * 0.34,
      minimumProgressDist,
      Math.max(minimumProgressDist, Math.min(15, pathLength * 0.5 || 15))
    );
    const minimumInitialProgressDist = Math.max(minimumProgressDist, initialStartClearance);
    const terminalNode = agent.selectedTargetNodeId ? prepared.nodeById?.[agent.selectedTargetNodeId] || null : null;
    let maximumProgressDist = pathLength;
    if (terminalNode) {
      const terminalClearance = isExplicitBackgroundQueueNode(terminalNode)
        ? clamp(pathLength * 0.08, 1.4, 3.2)
        : clamp(pathLength * 0.3, 4.8, 11.5);
      maximumProgressDist = Math.max(minimumInitialProgressDist, pathLength - terminalClearance);
    }
    if (maximumProgressDist <= minimumInitialProgressDist + 1e-6) {
      return minimumInitialProgressDist;
    }
    const requestedUnit = clamp(
      safeNumber(requestedProgressDist, minimumInitialProgressDist) / pathLength,
      0,
      1
    );
    return lerp(minimumInitialProgressDist, maximumProgressDist, requestedUnit);
  }

  function getBackgroundAgentWalkingSpeed(scenario, agent) {
    const baseSpeed = clamp(safeNumber(agent?.profile?.walkingSpeed, 0.9), BACKGROUND_AGENT_MIN_SPEED, 1.45);
    const flowProfile = agent?.backgroundFlowProfile || null;
    const pathLength = Math.max(1e-6, safeNumber(agent?.pathLength, agent?.path?.length, 0));
    const progressDist = clamp(safeNumber(agent?.pathProgressDist, agent?.progressDist, 0), 0, pathLength);
    const progress = clamp(progressDist / pathLength, 0, 1);
    const paceCurve = sampleBackgroundFlowCurve(flowProfile?.paceCurve, progress) * safeNumber(flowProfile?.paceCurveAmplitude, 0);
    const paceSway = Math.sin(
      safeNumber(scenario?.time, 0) * safeNumber(flowProfile?.paceSwayFrequency, 1)
      + safeNumber(flowProfile?.paceSwayPhase, 0)
    ) * safeNumber(flowProfile?.paceSwayAmplitude, 0);
    let walkingSpeed = baseSpeed * clamp(
      1 + safeNumber(flowProfile?.paceBias, 0) + paceCurve + paceSway,
      0.72,
      1.32
    );
    const endpointDistance = Math.min(progressDist, Math.max(0, pathLength - progressDist));
    const endpointBoostWeight = 1 - clamp(endpointDistance / 1.4, 0, 1);
    walkingSpeed *= lerp(1, 1.35, endpointBoostWeight);
    const endpointFlowWeight = 1 - clamp(endpointDistance / 3.6, 0, 1);
    const endpointMinimumSpeed = lerp(baseSpeed, 1.6, endpointFlowWeight);
    walkingSpeed = Math.max(walkingSpeed, endpointMinimumSpeed);
    return clamp(walkingSpeed, BACKGROUND_AGENT_MIN_SPEED * 0.45, 1.6);
  }

  function extractPressureAtPoint(prepared, scenario, point, options) {
    const agent = options?.agent || null;
    const applyTriggers = options?.applyTriggers !== false;
    const environment = options?.environment || evaluateEnvironmentAtPoint(prepared, scenario, point, agent);
    const contributions = [];
    let ambientNoiseStress = 0;
    let ambientLightingStress = getAmbientLightingStressContribution(environment?.lightingLevel);
    let ambientQueueStress = 0;
    let localVisibleStress = 0;
    let nonAgentExpectedStress = 0;

    if (agent) {
      ensureStressMemory(agent);
    }

    const queueStressSources = collectQueueStressSources(prepared, scenario, point, options);
    queueStressSources.forEach(({ pressurePoint, queueCount, stress }) => {
      ambientQueueStress += stress;
      contributions.push({
        pressurePoint,
        influence: stress,
        pressureDelta: stress,
        score: stress,
        sourceKind: 'queue',
        state: `queue-${Math.max(0, Math.floor(queueCount))}`,
      });
    });
    if (ambientLightingStress > 0.01) {
      contributions.push({
        pressurePoint: {
          id: 'ambient-lighting',
          name: 'Lighting',
          category: 'environment',
          feature: 'lighting',
          x: safeNumber(point?.x, 0),
          y: safeNumber(point?.y, 0),
        },
        influence: ambientLightingStress,
        pressureDelta: ambientLightingStress,
        score: ambientLightingStress,
        sourceKind: 'ambient-lighting',
      });
    }

    prepared.activePressureObjects.forEach((pressurePoint) => {
      const ruleDescriptor = resolveStressRuleDescriptor(pressurePoint);
      if (!ruleDescriptor) {
        return;
      }
      const currentDistance = distance(point, pressurePoint);
      const noiseContribution = getNoiseContributionAtPoint(pressurePoint, point);
      if (!ruleDescriptor.ambientOnly && noiseContribution > 0.01) {
        const stressContribution = noiseContribution * AMBIENT_NOISE_STRESS_SCALE;
        ambientNoiseStress += stressContribution;
        contributions.push({
          pressurePoint,
          influence: stressContribution,
          score: stressContribution,
          sourceKind: 'embedded-noise',
        });
      }
      if (ruleDescriptor.ambientOnly) {
        if (noiseContribution <= 0.01) {
          return;
        }
        const stressContribution = noiseContribution * AMBIENT_NOISE_STRESS_SCALE;
        ambientNoiseStress += stressContribution;
        contributions.push({
          pressurePoint,
          influence: stressContribution,
          score: stressContribution,
          sourceKind: 'ambient-noise',
        });
        return;
      }

      const isVisible = currentDistance <= safeNumber(ruleDescriptor.triggerRadius, VISION_RADIUS);
      if (!isVisible && !agent) {
        return;
      }

      const expectedPositiveStress = getExpectedPositiveStress(ruleDescriptor, environment);
      const expectedNetStress = getExpectedNetStress(ruleDescriptor, environment);
      const isPersistentEvent = ruleDescriptor.effectMode === 'persistent-event';
      const isVisibleExpected = ruleDescriptor.effectMode === 'visible-expected';

      if (agent) {
        const stressMemory = ensureStressMemory(agent);
        const eventState = stressMemory[pressurePoint.id] || {
          inView: false,
          hasTriggered: false,
          lastState: 'No effect',
          lastRawDelta: 0,
          lastAdjustedDelta: 0,
        };
        if (isPersistentEvent && isVisible && applyTriggers && !eventState.hasTriggered) {
          const sampledOutcome = sampleStressOutcome(ruleDescriptor, scenario.rng);
          const adjustedDelta = sampledOutcome.stressDelta * getStressEnvironmentMultiplier(environment, sampledOutcome.stressDelta);
          agent.accumulatedStress = Math.max(0, safeNumber(agent.accumulatedStress, 0) + adjustedDelta);
          eventState.hasTriggered = true;
          eventState.lastState = sampledOutcome.state;
          eventState.lastRawDelta = sampledOutcome.stressDelta;
          eventState.lastAdjustedDelta = adjustedDelta;
        }
        eventState.inView = isVisible;
        stressMemory[pressurePoint.id] = eventState;
        if (isVisibleExpected && isVisible && Math.abs(expectedNetStress) > 0.01) {
          localVisibleStress += expectedNetStress;
          if (expectedPositiveStress > 0.01) {
            contributions.push({
              pressurePoint,
              influence: expectedNetStress,
              pressureDelta: expectedNetStress,
              score: expectedPositiveStress,
              sourceKind: 'vision-expected',
            });
          }
          return;
        }
        if (isPersistentEvent && isVisible && eventState.lastAdjustedDelta > 0) {
          contributions.push({
            pressurePoint,
            influence: eventState.lastAdjustedDelta,
            pressureDelta: eventState.lastAdjustedDelta,
            score: eventState.lastAdjustedDelta,
            sourceKind: 'persistent-event',
            state: eventState.lastState,
          });
        }
        return;
      }

      if (isVisibleExpected && Math.abs(expectedNetStress) > 0.01) {
        nonAgentExpectedStress += expectedNetStress;
      } else if (isPersistentEvent && expectedPositiveStress > 0.01) {
        nonAgentExpectedStress += expectedPositiveStress;
      }

      if (expectedPositiveStress > 0.01) {
        contributions.push({
          pressurePoint,
          influence: isVisibleExpected ? expectedNetStress : expectedPositiveStress,
          pressureDelta: isVisibleExpected ? expectedNetStress : expectedPositiveStress,
          score: expectedPositiveStress,
          sourceKind: isVisibleExpected ? 'vision-expected' : 'persistent-risk',
        });
      }
    });

    const ambientCrowdingStress = getAmbientCrowdingStressContribution(getUnifiedCrowdDensity(environment, 0));
    const cumulativeStress = agent ? Math.max(0, safeNumber(agent.accumulatedStress, 0)) : 0;
    const pointPressure = agent
      ? Math.max(0, cumulativeStress + localVisibleStress + ambientCrowdingStress + ambientNoiseStress + ambientLightingStress + ambientQueueStress)
      : Math.max(
        0,
        ambientCrowdingStress + ambientNoiseStress + ambientLightingStress + ambientQueueStress + nonAgentExpectedStress
      );

    contributions.sort((left, right) => right.score - left.score);
    return {
      pressureScore: pointPressure,
      normalizedPressure: clamp(pointPressure / PRESSURE_NORMALIZATION_MAX, 0, 1),
      crowdDensity: getUnifiedCrowdDensity(environment, 0),
      contributions,
      ambientCrowdingStress,
      ambientNoiseStress,
      ambientLightingStress,
      ambientQueueStress,
      cumulativeStress,
      persistentStress: cumulativeStress,
      localVisibleStress,
      expectedPointStress: nonAgentExpectedStress,
    };
  }

  function evaluatePressureStateAtPoint(prepared, scenario, point, options) {
    return extractPressureAtPoint(prepared, scenario, point, options);
  }

  function getTopPressureSourcesAtPoint(prepared, scenario, point, limit, options) {
    const resolvedLimit = Math.max(1, Math.round(safeNumber(limit, 3)));
    const pressureState = extractPressureAtPoint(prepared, scenario, point, options);
    return pressureState.contributions
      .slice()
      .sort((left, right) => right.score - left.score)
      .slice(0, resolvedLimit)
      .map(({ pressurePoint, influence, score, state, sourceKind }) => ({
        id: pressurePoint.id,
        name: pressurePoint.name || pressurePoint.id,
        category: pressurePoint.category,
        feature: pressurePoint.feature,
        x: pressurePoint.x,
        y: pressurePoint.y,
        influence,
        score,
        pressure: score,
        state: state || null,
        sourceKind: sourceKind || null,
      }));
  }

  function materializeAgentPosition(prepared, scenario, agent, options) {
    const sample = samplePolyline(agent.path, safeNumber(agent.pathProgressDist, agent.progressDist));
    const avoidance = computeAvoidanceVector(scenario, agent);
    const desiredOffset = clamp(agent.laneBias + agent.personalBias, -0.42, 0.42);
    const decisionOffset = safeNumber(agent.decisionLateralOffset, 0);
    const locomotorOffset = safeNumber(agent.locomotorLateralOffset, 0);
    const smoothOffset = options?.smoothOffset !== false;
    const nearEndpoint = distance(sample, agent.path.startPoint) <= ENDPOINT_RELIEF_RADIUS || distance(sample, agent.path.endPoint) <= ENDPOINT_RELIEF_RADIUS;
    const clearanceTarget = nearEndpoint ? 0.9 : WALL_CLEARANCE_TARGET;
    const maxOffsetShift = smoothOffset ? 0.16 : 1.4;
    const baseOffset = safeNumber(agent.offset, 0);
    let offset = clamp(desiredOffset + decisionOffset + locomotorOffset, baseOffset - maxOffsetShift, baseOffset + maxOffsetShift);
    const centerClearance = Math.max(0.6, clearanceTarget * 0.6);
    let center = { x: sample.x, y: sample.y };
    const crowdAvoidanceStrength = clamp(
      safeNumber(agent.crowdAvoidanceStrength, agent?.isFocusAgent ? 0.18 : 0),
      0,
      1
    );
    const avoidanceDistanceWeight = Number.isFinite(avoidance.nearestDistance)
      ? 1 - clamp(avoidance.nearestDistance / (AVOIDANCE_TARGET_DISTANCE * 1.25), 0, 1)
      : 0;
    const avoidanceShiftScale = lerp(0.08, 0.52, crowdAvoidanceStrength) * avoidanceDistanceWeight;
    const avoidanceShift = {
      x: safeNumber(avoidance.vector?.x, 0) * avoidanceShiftScale,
      y: safeNumber(avoidance.vector?.y, 0) * avoidanceShiftScale,
    };
    if (Math.abs(avoidanceShift.x) > 1e-6 || Math.abs(avoidanceShift.y) > 1e-6) {
      center = {
        x: center.x + avoidanceShift.x,
        y: center.y + avoidanceShift.y,
      };
    }
    const centerCell = findNearestWalkableCell(prepared.grid, center);
    if (!centerCell || !isWalkablePoint(prepared, center) || (centerCell.wallDistance || 0) + 1e-6 < centerClearance) {
      center = projectPointToWalkable(prepared, center, { minimumClearance: centerClearance });
    }
    if (smoothOffset && agent.center) {
      const centerShift = distance(center, agent.center);
      if (centerShift > 0.95) {
        const centerDirection = normalizeVector({ x: center.x - agent.center.x, y: center.y - agent.center.y }, { x: 1, y: 0 });
        center = {
          x: agent.center.x + centerDirection.x * 0.95,
          y: agent.center.y + centerDirection.y * 0.95,
        };
      }
    }
    let position = { x: center.x + sample.normal.x * offset, y: center.y + sample.normal.y * offset };
    while (Math.abs(offset) > 0.05) {
      const nearestCell = findNearestWalkableCell(prepared.grid, position);
      const violatesClearance = nearestCell && nearestCell.wallDistance < clearanceTarget;
      if (isWalkablePoint(prepared, position) && !violatesClearance) {
        break;
      }
      offset *= 0.6;
      position = { x: center.x + sample.normal.x * offset, y: center.y + sample.normal.y * offset };
    }
    if (!isWalkablePoint(prepared, position)) {
      position = projectPointToWalkable(prepared, position, { minimumClearance: Math.max(0.5, clearanceTarget * 0.5) });
      center = projectPointToWalkable(prepared, center, { minimumClearance: Math.max(0.5, clearanceTarget * 0.5) });
      offset = 0;
    }
    agent.center = { x: center.x, y: center.y };
    agent.position = position;
    agent.tangent = sample.tangent;
    agent.normal = sample.normal;
    agent.progress = sample.progress;
    agent.offset = offset;
    agent.nearestNeighborDistance = avoidance.nearestDistance;
  }

  function materializeBackgroundAgentPosition(prepared, agent) {
    const sample = samplePolyline(agent.path, safeNumber(agent.pathProgressDist, agent.progressDist));
    let center = isWalkablePoint(prepared, sample)
      ? { x: sample.x, y: sample.y }
      : projectPointToWalkable(prepared, sample, { minimumClearance: BACKGROUND_FLOW_MIN_CLEARANCE });
    const progress = safeNumber(sample.progress, 0);
    const flowProfile = agent.backgroundFlowProfile || null;
    const originNode = getRouteOriginNode(prepared, agent.route);
    const terminalNode = getAssignedRouteTerminalNode(prepared, agent.route, agent);
    const originSpread = isExplicitBackgroundQueueNode(originNode)
      ? clamp(distance(sample, agent.path.startPoint) / BACKGROUND_FLOW_ENDPOINT_RELIEF_RADIUS, 0, 1)
      : lerp(0.44, 1, clamp(distance(sample, agent.path.startPoint) / BACKGROUND_FLOW_ENDPOINT_RELIEF_RADIUS, 0, 1));
    const terminalSpread = isExplicitBackgroundQueueNode(terminalNode)
      ? clamp(distance(sample, agent.path.endPoint) / BACKGROUND_FLOW_ENDPOINT_RELIEF_RADIUS, 0, 1)
      : lerp(0.44, 1, clamp(distance(sample, agent.path.endPoint) / BACKGROUND_FLOW_ENDPOINT_RELIEF_RADIUS, 0, 1));
    const endpointRelief = Math.min(originSpread, terminalSpread);
    const routeEnvelope = endpointRelief * (0.22 + smoothStep01(Math.sin(progress * Math.PI) || 0) * 0.78);
    const lateralCurveOffset = sampleBackgroundFlowCurve(flowProfile?.lateralCurve, progress) * safeNumber(flowProfile?.lateralAmplitude, 0);
    const primarySway = Math.sin(
      progress * Math.PI * safeNumber(flowProfile?.primarySwayFrequency, 3)
      + safeNumber(flowProfile?.primarySwayPhase, 0)
    ) * safeNumber(flowProfile?.primarySwayAmplitude, BACKGROUND_FLOW_SWAY_AMPLITUDE);
    const secondarySway = Math.sin(
      progress * Math.PI * safeNumber(flowProfile?.secondarySwayFrequency, 6)
      + safeNumber(flowProfile?.secondarySwayPhase, 0)
    ) * safeNumber(flowProfile?.secondarySwayAmplitude, 0.14);
    let lateralOffset = clamp(
      (safeNumber(agent.laneBias, 0) * 0.34)
      + (safeNumber(agent.personalBias, 0) * 0.14)
      + lateralCurveOffset
      + primarySway
      + secondarySway,
      -BACKGROUND_FLOW_MAX_OFFSET,
      BACKGROUND_FLOW_MAX_OFFSET
    ) * routeEnvelope;
    let tangentialOffset = (
      sampleBackgroundFlowCurve(flowProfile?.tangentialCurve, progress) * safeNumber(flowProfile?.tangentialAmplitude, 0)
      + Math.sin(
        progress * Math.PI * safeNumber(flowProfile?.tangentialSwayFrequency, 4.2)
        + safeNumber(flowProfile?.tangentialSwayPhase, 0)
      ) * safeNumber(flowProfile?.tangentialSwayAmplitude, 0.08)
    ) * routeEnvelope;
    let position = {
      x: center.x + sample.normal.x * lateralOffset + sample.tangent.x * tangentialOffset,
      y: center.y + sample.normal.y * lateralOffset + sample.tangent.y * tangentialOffset,
    };
    while (Math.abs(lateralOffset) > 0.02 || Math.abs(tangentialOffset) > 0.02) {
      const nearestCell = findNearestWalkableCell(prepared.grid, position);
      const violatesClearance = nearestCell && safeNumber(nearestCell.wallDistance, 0) + 1e-6 < BACKGROUND_FLOW_MIN_CLEARANCE;
      if (isWalkablePoint(prepared, position) && !violatesClearance) {
        break;
      }
      lateralOffset *= 0.58;
      tangentialOffset *= 0.64;
      position = {
        x: center.x + sample.normal.x * lateralOffset + sample.tangent.x * tangentialOffset,
        y: center.y + sample.normal.y * lateralOffset + sample.tangent.y * tangentialOffset,
      };
    }
    if (!isWalkablePoint(prepared, position)) {
      position = projectPointToWalkable(prepared, position, { minimumClearance: BACKGROUND_FLOW_MIN_CLEARANCE });
      lateralOffset = 0;
      tangentialOffset = 0;
    }
    agent.center = { x: center.x, y: center.y };
    agent.position = { x: position.x, y: position.y };
    agent.tangent = { ...sample.tangent };
    agent.normal = { ...sample.normal };
    agent.progress = sample.progress;
    agent.offset = lateralOffset;
    agent.tangentialOffset = tangentialOffset;
    agent.nearestNeighborDistance = Number.POSITIVE_INFINITY;
  }

  function depositHeat(prepared, scenario, point, metrics) {
    const nearbyCells = getNearbyCells(prepared.grid, point, HEAT_RADIUS);
    const agent = metrics?.agent || null;
    nearbyCells.forEach((cell) => {
      const currentDistance = distance(cell, point);
      if (currentDistance > HEAT_RADIUS) {
        return;
      }
      const cellPressureState = agent
        ? evaluatePressureStateAtPoint(prepared, scenario, cell, {
            agent: {
              id: agent.id,
              active: true,
              accumulatedStress: safeNumber(agent.accumulatedStress, 0),
              pressureEventStates: {},
            },
            applyTriggers: false,
          })
        : { pressureScore: Math.max(0, safeNumber(metrics.cognitiveLoad, metrics.pressure)) };
      const actualPressure = Math.max(0, safeNumber(cellPressureState?.pressureScore, safeNumber(metrics.cognitiveLoad, metrics.pressure)));
      const intensity = Math.max(HEAT_TRACE_FLOOR, actualPressure);
      const previousRaw = scenario.heat.raw[cell.index];
      const nextRaw = Math.max(previousRaw, intensity);
      if (nextRaw <= previousRaw + 1e-9) {
        return;
      }
      scenario.heat.raw[cell.index] = nextRaw;
      scenario.heat.pressureAcc[cell.index] = actualPressure;
      scenario.heat.fatigueAcc[cell.index] = safeNumber(metrics.fatigue, 0);
      scenario.heat.progressAcc[cell.index] = safeNumber(metrics.progress, 0);
      scenario.heat.totalDeposits += nextRaw - previousRaw;
    });
  }

  function serializeTopPressureSources(contributions, limit = 3) {
    return (contributions || [])
      .slice()
      .sort((left, right) => safeNumber(right.score, 0) - safeNumber(left.score, 0))
      .slice(0, Math.max(1, Math.round(safeNumber(limit, 3))))
      .map(({ pressurePoint, influence, score, state, sourceKind }) => ({
        id: pressurePoint.id,
        name: pressurePoint.name || pressurePoint.id,
        category: pressurePoint.category,
        feature: pressurePoint.feature,
        x: pressurePoint.x,
        y: pressurePoint.y,
        influence,
        score,
        pressure: score,
        state: state || null,
        sourceKind: sourceKind || null,
      }));
  }

  function decayHeat(prepared, scenario, dt) {
    if (!scenario.heatActive || scenario.heatMode === CUMULATIVE_HEAT_MODE) {
      return;
    }
    const factor = Math.exp(-dt / HEAT_DECAY_SECONDS);
    prepared.grid.walkableIndices.forEach((index) => {
      scenario.heat.raw[index] *= factor;
      scenario.heat.pressureAcc[index] *= factor;
      scenario.heat.fatigueAcc[index] *= factor;
      scenario.heat.progressAcc[index] *= factor;
    });
    scenario.heat.totalDeposits *= factor;
  }

  function refreshFocusProgressReference(scenario, agent) {
    if (!scenario || !agent?.isFocusAgent) {
      return Math.max(1, safeNumber(agent?.pathLength, 1));
    }
    const nextReference = Math.max(
      1,
      safeNumber(scenario.focusProgressReferenceDistance, 0),
      safeNumber(agent.pathLength, 0),
      safeNumber(agent.progressDist, 0),
      safeNumber(agent.pathProgressDist, 0)
    );
    scenario.focusProgressReferenceDistance = nextReference;
    return nextReference;
  }

  function getDisplayedAgentProgress(scenario, agent) {
    if (!agent) {
      return 0;
    }
    if (!agent.isFocusAgent) {
      return clamp(safeNumber(agent.progress, 0), 0, 1);
    }
    const referenceDistance = refreshFocusProgressReference(scenario, agent);
    const progressDistance = safeNumber(agent.progressDist, agent.pathProgressDist);
    if (referenceDistance <= 1e-6) {
      return clamp(safeNumber(agent.progress, 0), 0, 1);
    }
    return clamp(progressDistance / referenceDistance, 0, 1);
  }

  function updateFocusMetrics(prepared, scenario, agent, localPressure) {
    if (!scenario.heatActive || scenario.loopPlaybackActive) {
      return;
    }
    const progressReferenceDistance = refreshFocusProgressReference(scenario, agent);
    const fatigueThreshold = safeNumber(agent.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    const seatInfo = inspectNearbySeats(prepared, agent.position, agent.fatigue, fatigueThreshold, agent.profile);
    const topPressureSources = serializeTopPressureSources(localPressure?.contributions, 3);
    const dimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, agent.position, {
      agent,
      fatigue: agent.fatigue,
      fatigueThreshold,
      pressureState: localPressure,
    });
    scenario.focusTrace.push({ x: agent.position.x, y: agent.position.y });
    trimTraceSeriesPreservingStart(scenario.focusTrace, MAX_TRACE_POINTS);
    const shortRestMarker = agent.pendingShortRestMarker ? { ...agent.pendingShortRestMarker } : null;
    scenario.focusTraceSnapshots.push({
      x: agent.position.x,
      y: agent.position.y,
      time: scenario.time,
      progress: getDisplayedAgentProgress(scenario, agent),
      progressDist: safeNumber(agent.progressDist, agent.pathProgressDist),
      pathProgressDist: safeNumber(agent.pathProgressDist, agent.progressDist),
      progressReferenceDistance,
      heat: safeNumber(agent.cognitiveLoad, agent.currentPressure),
      pressure: agent.currentPressure,
      cognitiveLoad: safeNumber(agent.cognitiveLoad, agent.currentPressure),
      fatigue: agent.fatigue,
      crowdDensity: safeNumber(agent.crowdDensity, 0),
      environmentNoise: safeNumber(agent.environmentNoise, BASE_ENVIRONMENT_NOISE),
      environmentLighting: safeNumber(agent.environmentLighting, BASE_ENVIRONMENT_LIGHTING),
      queueCount: safeNumber(agent.queueCount, 0),
      persistentStress: safeNumber(localPressure?.persistentStress, agent.accumulatedStress),
      localVisibleStress: safeNumber(localPressure?.localVisibleStress, 0),
      ambientNoiseStress: safeNumber(localPressure?.ambientNoiseStress, 0),
      ambientCrowdingStress: safeNumber(localPressure?.ambientCrowdingStress, 0),
      ambientLightingStress: safeNumber(localPressure?.ambientLightingStress, 0),
      ambientQueueStress: safeNumber(localPressure?.ambientQueueStress, 0),
      fatigueThreshold,
      currentWalkingSpeed: safeNumber(agent.currentWalkingSpeed, agent.profile?.walkingSpeed),
      restState: agent.restState || 'none',
      restMode: agent.restMode || null,
      restTargetSeatId: agent.restTargetSeatId || null,
      reservedSeatId: agent.reservedSeatId || null,
      decisionReactionTime: safeNumber(dimensionState?.burdens?.cognitive?.decisionReactionTime, agent.profile?.decisionDelay),
      visionRadius: seatInfo.visionRadius,
      needsRest: seatInfo.needsRest,
      nearbySeats: seatInfo.nearbySeats.map((seat) => ({
        id: seat.id,
        label: seat.label || seat.name || seat.id,
        x: seat.x,
        y: seat.y,
        seatCount: seat.seatCount,
        distance: seat.distance,
      })),
      advice: seatInfo.advice,
      topPressureSources,
      capacityScores: { ...dimensionState.capacityScores },
      burdenScores: { ...dimensionState.burdenScores },
      decisionDiagnostics: { ...dimensionState.burdens.cognitive },
      topBurdenId: dimensionState.summary.topBurdenId,
      selectedTargetNodeId: agent.selectedTargetNodeId || null,
      selectedTargetNodeLabel: agent.selectedTargetNodeLabel || null,
      shortRestMarker,
    });
    trimTraceSeriesPreservingStart(scenario.focusTraceSnapshots, MAX_TRACE_POINTS);
    agent.pendingShortRestMarker = null;
    localPressure.contributions.forEach(({ pressurePoint, influence }) => {
      scenario.pressureImpactMap[pressurePoint.id] = (scenario.pressureImpactMap[pressurePoint.id] || 0) + influence;
    });
  }

  function trimTraceSeriesPreservingStart(series, maxPoints) {
    if (!Array.isArray(series)) {
      return;
    }
    const limit = Math.max(2, Math.floor(safeNumber(maxPoints, MAX_TRACE_POINTS)));
    if (series.length <= limit) {
      return;
    }
    series.splice(1, series.length - limit);
  }

  function snapshotScenarioForReplay(scenario) {
    return {
      rngState: scenario.rng.state,
      time: scenario.time,
      focusRouteId: scenario.focusRoute?.id || null,
      focusTargetRegionId: scenario.focusTargetRegionId || scenario.focusTargetRegion?.id || null,
      focusStartPoint: scenario.focusStartPoint ? { ...scenario.focusStartPoint } : null,
      focusProgressReferenceDistance: safeNumber(scenario.focusProgressReferenceDistance, 0),
      seatOccupancy: { ...(scenario.seatOccupancy || {}) },
      agents: scenario.agents.map((agent) => ({
        ...agent,
        profile: { ...agent.profile },
        sensoryRecognitionSamples: { ...(agent.sensoryRecognitionSamples || {}) },
        position: { ...agent.position },
        center: { ...agent.center },
        tangent: { ...agent.tangent },
        normal: { ...agent.normal },
      })),
    };
  }

  function restoreScenarioReplayState(prepared, scenario) {
    const baseline = scenario.replayBaseline;
    if (!baseline) {
      return;
    }
    scenario.rng = createRng(baseline.rngState);
    scenario.time = baseline.time;
    scenario.focusRoute = baseline.focusRouteId ? prepared.routeById[baseline.focusRouteId] || scenario.focusRoute : scenario.focusRoute;
    scenario.focusTargetRegionId = baseline.focusTargetRegionId || scenario.focusTargetRegionId;
    scenario.focusTargetRegion = baseline.focusTargetRegionId ? prepared.targetRegionById[baseline.focusTargetRegionId] || scenario.focusTargetRegion : scenario.focusTargetRegion;
    scenario.focusStartPoint = baseline.focusStartPoint ? { ...baseline.focusStartPoint } : scenario.focusStartPoint;
    scenario.focusProgressReferenceDistance = Math.max(
      1,
      safeNumber(baseline.focusProgressReferenceDistance, scenario.focusProgressReferenceDistance)
    );
    scenario.seatOccupancy = { ...(baseline.seatOccupancy || {}) };
    scenario.agents = baseline.agents.map((snapshot) => {
      const route = prepared.routeById[snapshot.routeId] || scenario.focusRoute;
      const path = snapshot?.isFocusAgent
        ? getRoutePath(prepared, route)
        : getRoutePathForTerminalNode(prepared, route, snapshot?.selectedTargetNodeId || null);
      return {
        ...snapshot,
        profile: { ...snapshot.profile },
        sensoryRecognitionSamples: { ...(snapshot.sensoryRecognitionSamples || {}) },
        route,
        path,
        position: { ...snapshot.position },
        center: { ...snapshot.center },
        tangent: { ...snapshot.tangent },
        normal: { ...snapshot.normal },
      };
    });
    scenario.backgroundFieldCursor = 0;
    refreshScenarioAgentCollections(scenario);
    syncScenarioBackgroundField(prepared, scenario, scenario.time);
    scenario.loopPlaybackActive = true;
    scenario.pendingReplayReset = false;
  }

  function resetScenarioToReplayBaseline(prepared, scenario) {
    restoreScenarioReplayState(prepared, scenario);
    return scenario;
  }

  function applyFocusRoute(prepared, scenario, agent, resolution, options) {
    if (!resolution?.route) {
      return;
    }
    const nextRoute = resolution.route;
    const nextPath = getRoutePath(prepared, nextRoute);
    if (!nextPath) {
      return;
    }
    const preservePosition = options?.preservePosition !== false;
    agent.route = nextRoute;
    agent.routeId = nextRoute.id;
    agent.routeLabel = nextRoute.label;
    agent.path = nextPath;
    agent.pathLength = nextPath.length;
    agent.selectedTargetNodeId = resolution.targetNode?.id || null;
    agent.selectedTargetNodeLabel = resolution.targetNode?.displayLabelEn || resolution.targetNode?.displayLabel || resolution.targetNode?.id || null;
    scenario.focusProgressReferenceDistance = Math.max(
      1,
      safeNumber(scenario.focusProgressReferenceDistance, 0),
      safeNumber(agent.progressDist, 0),
      safeNumber(nextPath.length, 0)
    );
    if (preservePosition) {
      agent.pathProgressDist = 0;
      materializeAgentPosition(prepared, scenario, agent, { smoothOffset: false });
    } else {
      agent.pathProgressDist = clamp(safeNumber(agent.pathProgressDist, 0), 0, nextPath.length);
    }
    scenario.focusRoute = nextRoute;
  }

  function initializeFocusRoute(prepared, scenario, agent) {
    resetFocusPlanAnchorRuntime(prepared, scenario, scenario.focusTargetRegion?.id || scenario.focusTargetRegionId);
    const resolution = resolveFocusRoute(
      prepared,
      scenario,
      agent,
      scenario.focusStartPoint || scenario.focusRoute?.startAnchor,
      scenario.focusTargetRegion?.id || scenario.focusTargetRegionId,
      null
    );
    if (!resolution?.route) {
      throw new Error('未能解析重点代理人的动态路线。');
    }
    applyFocusRoute(prepared, scenario, agent, resolution, { preservePosition: false });
    agent.queueLocked = false;
    agent.lastDecisionNodeId = null;
    agent.activeDecisionNodeId = null;
    agent.lastEffectiveGuideTime = null;
    agent.lastEffectiveGuideDistance = null;
    agent.decisionPauseRemaining = 0;
    agent.decisionSlowWalkRemaining = 0;
    agent.decisionSlowWalkFactor = 1;
    agent.movementBehavior = 'normal_walk';
    agent.movementMainCause = 'speed';
    agent.movementSpeedFactor = 1;
    agent.wallFollowStrength = 0;
    agent.locomotorLateralOffset = 0;
    agent.decisionLateralOffset = 0;
    agent.decisionWrongTurnRemaining = 0;
    agent.decisionBacktrackRemaining = 0;
    clearDecisionInteraction(agent);
    agent.lastDecisionInteractionSourceId = null;
    agent.lastDecisionInteractionSourcePoint = null;
    agent.lastDecisionDiagnostics = null;
  }

  function updateFocusRouteDecision(prepared, scenario, agent) {
    const targetRegionId = scenario.focusTargetRegion?.id || scenario.focusTargetRegionId;
    if (!targetRegionId) {
      return;
    }
    const currentAnchor = getActiveFocusPlanAnchor(prepared, scenario, targetRegionId);
    const currentTargetNode = agent.selectedTargetNodeId ? prepared.nodeById?.[agent.selectedTargetNodeId] : null;
    const anchorReached = Boolean(currentAnchor?.node && distance(agent.position, currentAnchor.node) <= QUEUE_LOCK_RADIUS);
    const anchorProgress = anchorReached
      ? advanceFocusPlanAnchors(prepared, scenario, agent, targetRegionId)
      : { advanced: false, completedNodeIds: [] };
    if (anchorProgress.advanced) {
      const anchorResolution = resolveFocusRoute(
        prepared,
        scenario,
        agent,
        agent.position,
        targetRegionId,
        agent.selectedTargetNodeId
      );
      if (
        anchorResolution?.route
        && (
          anchorResolution.targetNode?.id !== agent.selectedTargetNodeId
          || anchorResolution.route.id !== agent.routeId
        )
      ) {
        agent.lastDecisionDiagnostics = {
          ...(agent.lastDecisionDiagnostics || {}),
          behavior: 'llm-anchor',
          completedAnchorNodeId: anchorProgress.completedNodeIds[anchorProgress.completedNodeIds.length - 1] || null,
          chosenTargetNodeId: anchorResolution.targetNode?.id || null,
        };
        applyFocusRoute(prepared, scenario, agent, anchorResolution, { preservePosition: true });
        return;
      }
    }
    if (currentTargetNode && distance(agent.position, currentTargetNode) <= QUEUE_LOCK_RADIUS && !anchorReached) {
      agent.queueLocked = true;
    }

    const activeDecisionNode = agent.activeDecisionNodeId ? prepared.nodeById?.[agent.activeDecisionNodeId] : null;
    if (activeDecisionNode && distance(agent.position, activeDecisionNode) > DECISION_NODE_RADIUS * 1.35) {
      agent.activeDecisionNodeId = null;
    }
    const lastDecisionNode = agent.lastDecisionNodeId ? prepared.nodeById?.[agent.lastDecisionNodeId] : null;
    if (lastDecisionNode && distance(agent.position, lastDecisionNode) > DECISION_NODE_RADIUS * 1.6) {
      agent.lastDecisionNodeId = null;
    }
    if (
      agent.lastDecisionInteractionSourcePoint
      && distance(agent.position, agent.lastDecisionInteractionSourcePoint) > VISION_RADIUS * 1.1
    ) {
      agent.lastDecisionInteractionSourceId = null;
      agent.lastDecisionInteractionSourcePoint = null;
    }

    if (agent.queueLocked) {
      return;
    }

    const decisionNode = getDecisionNode(prepared, agent.position);
    if (!decisionNode || agent.activeDecisionNodeId === decisionNode.id || agent.lastDecisionNodeId === decisionNode.id) {
      return;
    }

    agent.activeDecisionNodeId = decisionNode.id;
    agent.lastDecisionNodeId = decisionNode.id;
    const localEnvironment = evaluateEnvironmentAtPoint(prepared, scenario, agent.position, agent);
    const localPressureObjects = collectPressureObjectsWithinRadius(prepared, agent.position, VISION_RADIUS);
    const localPressure = extractPressureAtPoint(prepared, scenario, agent.position, {
      agent,
      environment: localEnvironment,
      applyTriggers: false,
    });
    const fatigueThreshold = safeNumber(agent.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    const dimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, agent.position, {
      agent,
      pressureObjects: localPressureObjects,
      environment: localEnvironment,
      pressureState: localPressure,
      fatigue: safeNumber(agent.fatigue, 0),
      fatigueThreshold,
      queueCount: safeNumber(
        agent.queueCount,
        computeQueuePopulation(scenario, agent.selectedTargetNodeId, { includeOrdinaryTargetNode: true })
      ),
      targetRegionId,
      selectedTargetNodeId: agent.selectedTargetNodeId,
      selectedTargetNodeLabel: agent.selectedTargetNodeLabel,
    });
    updateDecisionGuideMemory(agent, scenario, dimensionState?.context?.decisionInputs);
    applyDecisionBehaviorOutcome(
      prepared,
      scenario,
      agent,
      decisionNode,
      dimensionState?.context?.decisionInputs,
      localPressureObjects,
      dimensionState?.burdens?.cognitive
    );
    if (hasActiveDecisionInteraction(agent)) {
      return;
    }

    const resolution = applyFocusDecisionPlanAtNode(
      prepared,
      scenario,
      agent,
      decisionNode,
      targetRegionId
    ) || resolveFocusRoute(
      prepared,
      scenario,
      agent,
      agent.position,
      targetRegionId,
      agent.selectedTargetNodeId
    );
    if (!resolution?.route) {
      return;
    }
    if (resolution.targetNode?.id === agent.selectedTargetNodeId) {
      return;
    }
    if (resolution.appliedPlanDecision) {
      agent.lastDecisionDiagnostics = {
        ...(agent.lastDecisionDiagnostics || {}),
        behavior: 'llm-guided',
        decisionNodeId: resolution.appliedPlanDecision.decisionNodeId,
        chosenTargetNodeId: resolution.appliedPlanDecision.chosenTargetNodeId,
      };
    }
    applyFocusRoute(prepared, scenario, agent, resolution, { preservePosition: true });
  }

  function createAgent(prepared, scenario, profile, route, options) {
    const terminalNode = options.isFocusAgent
      ? getRouteTerminalNode(prepared, route)
      : getAssignedRouteTerminalNode(prepared, route, { id: options.id, selectedTargetNodeId: options.selectedTargetNodeId });
    const path = options.isFocusAgent
      ? getRoutePath(prepared, route)
      : getRoutePathForTerminalNode(prepared, route, terminalNode?.id || options.selectedTargetNodeId || null);
    if (!path) {
      return null;
    }
    const personalBias = options.isFocusAgent
      ? 0
      : safeNumber(options.personalBias, (((stableHash(options.id) % 1000) / 1000) - 0.5) * 0.9);
    const agent = {
      id: options.id,
      isFocusAgent: Boolean(options.isFocusAgent),
      role: options.isFocusAgent ? 'focus' : 'background',
      profile,
      routeId: route.id,
      routeLabel: route.label,
      route,
      path,
      progressDist: path.length * options.initialProgress,
      pathProgressDist: path.length * options.initialProgress,
      progress: options.initialProgress,
      pathLength: path.length,
      laneBias: options.laneBias,
      personalBias,
      backgroundFlowLapSerial: Math.max(0, Math.floor(safeNumber(options.backgroundFlowLapSerial, 0))),
      backgroundFlowProfile: null,
      startProgressJitter: safeNumber(options.startProgressJitter, 0.25 + Math.abs(personalBias) * 0.8),
      active: true,
      respawnTimer: 0,
      position: { x: path.startPoint.x, y: path.startPoint.y },
      center: { x: path.startPoint.x, y: path.startPoint.y },
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
      currentPressure: 0,
      cognitiveLoad: 0,
      crowdDensity: 0,
      environmentNoise: BASE_ENVIRONMENT_NOISE,
      environmentLighting: BASE_ENVIRONMENT_LIGHTING,
      queueCount: 0,
      fatigue: safeNumber(options.initialFatigue, 0),
      fatigueThreshold: safeNumber(profile?.fatigueThreshold, getFatigueThreshold(profile?.capacityScores?.vitality)),
      accumulatedStress: 0,
      pressureEventStates: {},
      currentLapTime: 0,
      lapFatiguePeak: 0,
      lastTravelTime: 0,
      offset: 0,
      nearestNeighborDistance: Number.POSITIVE_INFINITY,
      queueLocked: Boolean(options.queueLocked),
      selectedTargetNodeId: options.selectedTargetNodeId || route.targetNodeId || terminalNode?.id || null,
      selectedTargetNodeLabel: options.selectedTargetNodeLabel || terminalNode?.displayLabelEn || terminalNode?.displayLabel || terminalNode?.id || null,
      lastDecisionNodeId: null,
      activeDecisionNodeId: null,
      lastEffectiveGuideTime: null,
      lastEffectiveGuideDistance: null,
      decisionPauseRemaining: 0,
      decisionSlowWalkRemaining: 0,
      decisionSlowWalkFactor: 1,
      movementBehavior: 'normal_walk',
      movementMainCause: 'speed',
      movementSpeedFactor: 1,
      wallFollowStrength: 0,
      locomotorLateralOffset: 0,
      decisionLateralOffset: 0,
      decisionWrongTurnRemaining: 0,
      decisionBacktrackRemaining: 0,
      decisionInteractionState: null,
      decisionInteractionMode: null,
      decisionInteractionSourceId: null,
      decisionInteractionTarget: null,
      decisionInteractionPath: null,
      decisionInteractionReturnPath: null,
      decisionInteractionProgress: 0,
      decisionInteractionPauseRemaining: 0,
      decisionInteractionQueuedOutcome: null,
      lastDecisionInteractionSourceId: null,
      lastDecisionInteractionSourcePoint: null,
      lastDecisionDiagnostics: null,
      restState: 'none',
      restMode: null,
      restSearchElapsed: 0,
      restSearchAbandoned: false,
      restStartFatigue: 0,
      restResumeThreshold: 0,
      shortRestRemaining: 0,
      shortRestTriggeredThresholds: {},
      pendingShortRestMarker: null,
      reservedSeatId: null,
      restInterruptionOccurred: false,
      restTargetSeatId: null,
      restSearchPath: null,
      restSearchPathTargetSeatId: null,
      restSearchPathProgressDist: 0,
      backgroundState: 'moving',
      queueSlotIndex: 0,
      rideRemaining: 0,
      queueTargetNodeId: null,
      queueJoinedAt: null,
      backgroundReplacementIssued: false,
      backgroundReserve: false,
      backgroundReserveReadyTime: 0,
    };
    const initialProgressDist = agent.isFocusAgent
      ? path.length * options.initialProgress
      : getBackgroundInitialProgressDist(prepared, agent, path.length * options.initialProgress);
    agent.progressDist = initialProgressDist;
    agent.pathProgressDist = initialProgressDist;
    agent.progress = path.length <= 1e-6 ? 0 : clamp(initialProgressDist / path.length, 0, 1);
    refreshBackgroundFlowProfile(agent, scenario);
    if (agent.isFocusAgent) {
      materializeAgentPosition(prepared, scenario, agent, { smoothOffset: false });
    } else {
      materializeBackgroundAgentPosition(prepared, agent);
    }
    return agent;
  }

  function finishAgentTraversal(scenario, agent) {
    if (agent.reservedSeatId) {
      releaseSeat(scenario, agent.reservedSeatId);
    }
    agent.reservedSeatId = null;
    resetBackgroundAgentSimulationState(agent);
    agent.active = false;
    agent.lastTravelTime = agent.currentLapTime;
    if (!agent.isFocusAgent && agent.backgroundReplacementIssued) {
      agent.backgroundReplacementIssued = false;
      agent.backgroundReserve = true;
      agent.backgroundReserveReadyTime = safeNumber(scenario?.time, 0) + 0.001;
      agent.respawnTimer = Number.POSITIVE_INFINITY;
      return;
    }
    agent.respawnTimer = agent.isFocusAgent ? lerp(0.6, 1.5, scenario.rng.next()) : 0;
  }

  function respawnAgent(prepared, scenario, agent, options) {
    const rng = scenario.rng;
    if (agent.isFocusAgent) {
      agent.route = scenario.focusRoute;
    } else {
      const routeOverride = options?.routeOverride || null;
      const bypassDeferredOriginGate = Boolean(options?.bypassDeferredOriginGate);
      const persistedRoute = agent.routeId
        ? prepared.routeById?.[agent.routeId] || agent.route || null
        : agent.route || null;
      if (!routeOverride && persistedRoute && !bypassDeferredOriginGate && shouldDeferBackgroundTrainDoorRespawn(scenario, persistedRoute)) {
        agent.active = false;
        agent.respawnTimer = 1;
        return false;
      }
      const nextRoute = routeOverride || persistedRoute || chooseBackgroundRouteForScenario(scenario, rng);
      agent.route = nextRoute;
      if (!bypassDeferredOriginGate && shouldDeferBackgroundTrainDoorRespawn(scenario, agent.route)) {
        agent.active = false;
        agent.respawnTimer = 1;
        return false;
      }
      agent.routeId = agent.route.id;
      agent.routeLabel = agent.route.label;
    }
    const terminalNode = agent.isFocusAgent
      ? getRouteTerminalNode(prepared, agent.route)
      : getAssignedRouteTerminalNode(prepared, agent.route, agent);
    agent.selectedTargetNodeId = agent.isFocusAgent
      ? agent.selectedTargetNodeId
      : terminalNode?.id || agent.route?.targetNodeId || null;
    agent.selectedTargetNodeLabel = agent.isFocusAgent
      ? agent.selectedTargetNodeLabel
      : terminalNode?.displayLabelEn || terminalNode?.displayLabel || terminalNode?.id || null;
    agent.path = agent.isFocusAgent
      ? getRoutePath(prepared, agent.route)
      : getRoutePathForTerminalNode(prepared, agent.route, agent.selectedTargetNodeId || null);
    agent.pathLength = agent.path.length;
    const spawnProgressDist = agent.isFocusAgent
      ? 0
      : (options?.forceOriginSpawn ? 0 : getBackgroundSpawnProgressDist(agent));
    agent.pathProgressDist = spawnProgressDist;
    agent.progressDist = agent.pathProgressDist;
    agent.progress = agent.pathLength <= 1e-6 ? 0 : agent.pathProgressDist / agent.pathLength;
    agent.currentLapTime = 0;
    agent.lastTravelTime = 0;
    agent.currentPressure = 0;
    agent.cognitiveLoad = 0;
    agent.crowdDensity = 0;
    agent.environmentNoise = BASE_ENVIRONMENT_NOISE;
    agent.environmentLighting = BASE_ENVIRONMENT_LIGHTING;
    agent.queueCount = 0;
    agent.fatigue = 0;
    agent.fatigueThreshold = safeNumber(agent.profile?.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    agent.accumulatedStress = 0;
    agent.pressureEventStates = {};
    agent.lapFatiguePeak = agent.fatigue;
    agent.restState = 'none';
    agent.restMode = null;
    agent.restSearchElapsed = 0;
    agent.restSearchAbandoned = false;
    agent.restStartFatigue = 0;
    agent.restResumeThreshold = 0;
    agent.shortRestRemaining = 0;
    agent.shortRestTriggeredThresholds = {};
    agent.pendingShortRestMarker = null;
    agent.reservedSeatId = null;
    agent.restInterruptionOccurred = false;
    agent.restTargetSeatId = null;
    agent.restSearchPath = null;
    agent.restSearchPathTargetSeatId = null;
    agent.restSearchPathProgressDist = 0;
    resetBackgroundAgentSimulationState(agent);
    agent.backgroundReplacementIssued = false;
    agent.backgroundReserve = false;
    agent.backgroundReserveReadyTime = 0;
    agent.lastDecisionNodeId = null;
    agent.activeDecisionNodeId = null;
    agent.lastEffectiveGuideTime = null;
    agent.lastEffectiveGuideDistance = null;
    agent.decisionPauseRemaining = 0;
    agent.decisionSlowWalkRemaining = 0;
    agent.decisionSlowWalkFactor = 1;
    agent.movementBehavior = 'normal_walk';
    agent.movementMainCause = 'speed';
    agent.movementSpeedFactor = 1;
    agent.wallFollowStrength = 0;
    agent.locomotorLateralOffset = 0;
    agent.decisionLateralOffset = 0;
    agent.decisionWrongTurnRemaining = 0;
    agent.decisionBacktrackRemaining = 0;
    clearDecisionInteraction(agent);
    agent.lastDecisionInteractionSourceId = null;
    agent.lastDecisionInteractionSourcePoint = null;
    agent.lastDecisionDiagnostics = null;
    agent.laneBias = agent.isFocusAgent
      ? 0
      : clamp((rng.next() - 0.5) * 1.18 + agent.personalBias * 0.18, -0.62, 0.62);
    agent.startProgressJitter = agent.isFocusAgent
      ? 0
      : (0.45 + rng.next() * 1.65 + Math.abs(agent.personalBias || 0) * 0.45);
    agent.backgroundFlowLapSerial = agent.isFocusAgent
      ? 0
      : Math.max(0, Math.floor(safeNumber(agent.backgroundFlowLapSerial, 0))) + 1;
    refreshBackgroundFlowProfile(agent, scenario);
    agent.active = true;
    agent.justRespawned = true;
    agent.respawnTimer = 0;
    if (agent.isFocusAgent) {
      initializeFocusRoute(prepared, scenario, agent);
      agent.path = getRoutePath(prepared, agent.route);
      agent.pathLength = agent.path.length;
      agent.pathProgressDist = 0;
      agent.progressDist = 0;
      agent.progress = 0;
      agent.position = { x: scenario.focusStartPoint.x, y: scenario.focusStartPoint.y };
      agent.center = { x: scenario.focusStartPoint.x, y: scenario.focusStartPoint.y };
    }
    if (agent.isFocusAgent) {
      materializeAgentPosition(prepared, scenario, agent, { smoothOffset: false });
    } else {
      materializeBackgroundAgentPosition(prepared, agent);
    }
    return true;
  }

  function replenishBackgroundFlowFromQueue(prepared, scenario, sourceAgent) {
    if (!sourceAgent || sourceAgent.isFocusAgent || sourceAgent.backgroundReplacementIssued) {
      return null;
    }
    if (countActiveMovingBackgroundAgents(scenario) >= getBackgroundMovingTargetCount(scenario)) {
      return null;
    }
    let replacement = (scenario.backgroundAgents || []).find((agent) => (
      !agent.active
      && agent.backgroundReserve
      && safeNumber(agent.backgroundReserveReadyTime, Number.POSITIVE_INFINITY) <= safeNumber(scenario?.time, 0)
    ));
    if (replacement) {
      const activated = respawnAgent(prepared, scenario, replacement, { routeOverride: sourceAgent.route });
      if (!activated) {
        return null;
      }
    } else {
      const serial = Math.max(0, Math.floor(safeNumber(scenario.backgroundAgentSerial, (scenario.backgroundAgents || []).length)));
      replacement = createAgent(prepared, scenario, sourceAgent.profile, sourceAgent.route, {
        id: `bg-flow-${serial}`,
        isFocusAgent: false,
        initialProgress: 0,
        initialFatigue: 0,
        laneBias: clamp((scenario.rng.next() - 0.5) * 1.24, -0.62, 0.62),
        startProgressJitter: 0.35 + scenario.rng.next() * 1.15,
      });
      scenario.backgroundAgentSerial = serial + 1;
      if (!replacement) {
        return null;
      }
      replacement.justRespawned = true;
      scenario.agents.push(replacement);
      refreshScenarioAgentCollections(scenario);
    }
    sourceAgent.backgroundReplacementIssued = true;
    return replacement;
  }

  function restoreFinishedBackgroundAgent(prepared, scenario, agent, options) {
    if (!agent || agent.isFocusAgent || agent.active) {
      return false;
    }
    return Boolean(respawnAgent(prepared, scenario, agent, options));
  }

  function advanceBackgroundQueueNode(prepared, scenario, nodeId, dt) {
    const node = prepared.nodeById?.[nodeId];
    if (!node) {
      return;
    }
    const participants = getBackgroundQueueParticipants(scenario, nodeId);
    if (!participants.length) {
      return;
    }
    const usesExplicitQueuePose = isExplicitBackgroundQueueNode(node);
    const facilityMode = facilityModeForNode(node);
    const queueState = ensureBackgroundFacilityQueueState(scenario, node, participants[0]);
    const currentTime = safeNumber(scenario?.time, 0);
    const serviceDelay = Math.max(0, safeNumber(queueState?.nextBoardReadyTime, 0) - safeNumber(scenario?.time, 0));
    const boardingSeconds = getBackgroundFacilityBoardingSeconds(node);
    participants.forEach((participant) => {
      participant.currentLapTime += dt;
      participant.currentPressure = 0;
      participant.cognitiveLoad = 0;
      participant.crowdDensity = 0;
      participant.environmentNoise = BASE_ENVIRONMENT_NOISE;
      participant.environmentLighting = BASE_ENVIRONMENT_LIGHTING;
      participant.queueCount = participants.length;
      participant.fatigueThreshold = safeNumber(participant.profile?.fatigueThreshold, getFatigueThreshold(participant.profile?.capacityScores?.vitality));
    });

    let ridingAgent = participants.find((participant) => isBackgroundServingState(participant.backgroundState)) || null;
    let queueingAgents = getBackgroundQueueParticipants(scenario, nodeId)
      .filter((participant) => isBackgroundWaitingState(participant.backgroundState));
    if (
      facilityMode === 'elevator'
      && !ridingAgent
      && !queueingAgents.length
      && Math.max(0, safeNumber(queueState?.boardingsInCurrentBatch, 0)) > 0
      && safeNumber(queueState?.departureDeadline, 0) > 0
      && safeNumber(queueState?.departureDeadline, 0) <= currentTime + 1e-6
    ) {
      startElevatorDepartureCycle(scenario, queueState, queueState.boardingsInCurrentBatch);
      return;
    }
    if (ridingAgent) {
      ridingAgent.queueSlotIndex = 0;
      ridingAgent.rideRemaining = Math.max(0, safeNumber(ridingAgent.rideRemaining, 0) - dt);
      if (usesExplicitQueuePose) {
        setBackgroundAgentQueuePose(prepared, ridingAgent, node, queueState?.queueDirection, 0);
      } else {
        setBackgroundAgentFlowServicePose(
          prepared,
          scenario,
          ridingAgent,
          node,
          queueState?.queueDirection,
          0,
          safeNumber(ridingAgent.rideRemaining, 0)
        );
      }
      if (ridingAgent.rideRemaining <= 1e-6) {
        finishAgentTraversal(scenario, ridingAgent);
        restoreFinishedBackgroundAgent(prepared, scenario, ridingAgent);
        queueingAgents = getBackgroundQueueParticipants(scenario, nodeId)
          .filter((participant) => isBackgroundWaitingState(participant.backgroundState));
        if (facilityMode === 'elevator') {
          registerElevatorBoardingCompletion(scenario, queueState, queueingAgents.length);
        } else {
          updateBackgroundFacilityServiceWindow(scenario, queueState, node);
        }
        ridingAgent = null;
      }
    }

    queueingAgents = getBackgroundQueueParticipants(scenario, nodeId)
      .filter((participant) => isBackgroundWaitingState(participant.backgroundState));
    if (facilityMode === 'elevator' && queueingAgents.length) {
      queueState.departureDeadline = 0;
    }
    if (!ridingAgent && queueingAgents.length && safeNumber(queueState?.nextBoardReadyTime, 0) <= safeNumber(scenario?.time, 0) + 1e-6) {
      ridingAgent = queueingAgents[0];
      ridingAgent.backgroundState = usesExplicitQueuePose ? 'riding' : 'terminal_serving';
      ridingAgent.queueSlotIndex = 0;
      ridingAgent.rideRemaining = getBackgroundFacilityBoardingSeconds(node);
      if (usesExplicitQueuePose) {
        setBackgroundAgentQueuePose(prepared, ridingAgent, node, queueState?.queueDirection, 0);
      } else {
        setBackgroundAgentFlowServicePose(
          prepared,
          scenario,
          ridingAgent,
          node,
          queueState?.queueDirection,
          0,
          safeNumber(ridingAgent.rideRemaining, 0)
        );
      }
      queueingAgents = queueingAgents.slice(1);
    }

    queueingAgents.forEach((participant, index) => {
      participant.backgroundState = usesExplicitQueuePose ? 'queueing' : 'terminal_waiting';
      participant.queueSlotIndex = index + 1;
      participant.rideRemaining = 0;
      if (usesExplicitQueuePose) {
        setBackgroundAgentQueuePose(prepared, participant, node, queueState?.queueDirection, index + 1);
      } else {
        const timeUntilService = (
          (ridingAgent ? safeNumber(ridingAgent.rideRemaining, 0) : serviceDelay)
          + index * boardingSeconds
        );
        setBackgroundAgentFlowServicePose(
          prepared,
          scenario,
          participant,
          node,
          queueState?.queueDirection,
          index + 1,
          timeUntilService
        );
      }
    });
  }

  function processBackgroundQueueNode(prepared, scenario, nodeId, dt, options) {
    scenario.backgroundQueueProcessedNodes = scenario.backgroundQueueProcessedNodes || {};
    const force = Boolean(options?.force);
    if (!force && scenario.backgroundQueueProcessedNodes[nodeId]) {
      return;
    }
    if (!force) {
      scenario.backgroundQueueProcessedNodes[nodeId] = true;
    }
    advanceBackgroundQueueNode(prepared, scenario, nodeId, dt);
  }

  function stepBackgroundAgent(prepared, scenario, agent, dt) {
    if (!agent.active) {
      agent.respawnTimer -= dt;
      if (agent.respawnTimer > 0) {
        return;
      }
      const carryoverDt = Math.max(0, -safeNumber(agent.respawnTimer, 0));
      const respawned = respawnAgent(prepared, scenario, agent);
      if (!respawned || !agent.active) {
        return;
      }
      dt = carryoverDt > 1e-6 ? carryoverDt : dt;
    }

    if (agent.justRespawned) {
      agent.justRespawned = false;
    }

    const queuedNodeId = agent.queueTargetNodeId;
    if (isBackgroundFacilityServiceState(agent.backgroundState) && queuedNodeId) {
      const queuedNode = prepared.nodeById?.[queuedNodeId] || null;
      if (!isExplicitBackgroundQueueNode(queuedNode)) {
        finishAgentTraversal(scenario, agent);
        restoreFinishedBackgroundAgent(prepared, scenario, agent);
        return;
      }
      if (
        isBackgroundWaitingState(agent.backgroundState)
        && !agent.backgroundReplacementIssued
        && isExplicitBackgroundQueueNode(queuedNode)
      ) {
        replenishBackgroundFlowFromQueue(prepared, scenario, agent);
      }
      processBackgroundQueueNode(prepared, scenario, queuedNodeId, dt);
      return;
    }

    const walkingSpeed = getBackgroundAgentWalkingSpeed(scenario, agent);
    agent.pathProgressDist = clamp(safeNumber(agent.pathProgressDist, 0) + walkingSpeed * dt, 0, agent.path.length);
    agent.progressDist = agent.pathProgressDist;
    agent.currentLapTime += dt;
    agent.currentPressure = 0;
    agent.cognitiveLoad = 0;
    agent.crowdDensity = 0;
    agent.environmentNoise = BASE_ENVIRONMENT_NOISE;
    agent.environmentLighting = BASE_ENVIRONMENT_LIGHTING;
    agent.queueCount = 0;
    materializeBackgroundAgentPosition(prepared, agent);

    const terminalNode = agent.isFocusAgent
      ? getRouteTerminalNode(prepared, agent.route)
      : getAssignedRouteTerminalNode(prepared, agent.route, agent);
    if (terminalNode && !isExplicitBackgroundQueueNode(terminalNode)) {
      const shouldFinishAtTerminalBuffer = (
        distance(agent.position, terminalNode) <= BACKGROUND_NONQUEUE_TERMINAL_FINISH_DISTANCE + 1e-6
        || agent.pathProgressDist >= agent.path.length - BACKGROUND_NONQUEUE_TERMINAL_FINISH_DISTANCE
      );
      if (shouldFinishAtTerminalBuffer) {
        finishAgentTraversal(scenario, agent);
        restoreFinishedBackgroundAgent(prepared, scenario, agent);
        return;
      }
    }
    if (terminalNode && isExplicitBackgroundQueueNode(terminalNode)) {
      const nearJoinPoint = (
        distance(agent.position, terminalNode) <= BACKGROUND_QUEUE_JOIN_DISTANCE + 1e-6
        || agent.pathProgressDist >= agent.path.length - BACKGROUND_QUEUE_JOIN_DISTANCE
      );
      if (nearJoinPoint) {
        const queueState = ensureBackgroundFacilityQueueState(scenario, terminalNode, agent);
        agent.backgroundState = 'queueing';
        agent.queueTargetNodeId = terminalNode.id;
        if (!Number.isFinite(agent.queueJoinedAt)) {
          agent.queueJoinedAt = safeNumber(scenario?.time, 0);
        }
        agent.queueSlotIndex = 1;
        agent.rideRemaining = 0;
        setBackgroundAgentQueuePose(prepared, agent, terminalNode, queueState?.queueDirection, 1);
        replenishBackgroundFlowFromQueue(prepared, scenario, agent);
        processBackgroundQueueNode(prepared, scenario, terminalNode.id, 0, { force: true });
        return;
      }
    }

    if (agent.pathProgressDist >= agent.path.length - 1e-6) {
      finishAgentTraversal(scenario, agent);
      restoreFinishedBackgroundAgent(prepared, scenario, agent);
    }
  }

  function applyLocomotorAgentState(agent, locomotorState) {
    const state = locomotorState || {};
    agent.movementBehavior = state.movementBehavior || state.behavior || 'normal_walk';
    agent.movementMainCause = state.movementMainCause || 'speed';
    agent.movementSpeedFactor = safeNumber(state.movementSpeedFactor, safeNumber(state.speedFactor, 1));
    const routeStyle = agent?.isFocusAgent ? (agent.llmRouteStyle || null) : null;
    const crowdAvoidanceBias = routeStyle ? clamp(safeNumber(routeStyle.crowdAvoidanceBias, 0), 0, 1) : 0;
    const wallAvoidanceBias = routeStyle ? clamp(safeNumber(routeStyle.wallAvoidanceBias, 0), 0, 1) : 0;
    const centerlineBias = routeStyle ? clamp(safeNumber(routeStyle.centerlineBias, 0), 0, 1) : 0;
    agent.crowdAvoidanceStrength = agent.isFocusAgent
      ? Number(clamp(0.14 + crowdAvoidanceBias * 0.82, 0, 1).toFixed(3))
      : 0;
    agent.wallFollowStrength = safeNumber(state.wallFollowStrength, 0) * (1 - wallAvoidanceBias * 0.72) * (1 - centerlineBias * 0.24);
    const preferredSide = safeNumber(agent.personalBias, 0) >= 0 ? 1 : -1;
    agent.locomotorLateralOffset = agent.wallFollowStrength > 0.01
      ? Number((preferredSide * clamp(agent.wallFollowStrength * 0.26, 0.08, 0.22)).toFixed(3))
      : 0;
    if (agent.isFocusAgent && routeStyle && centerlineBias > 0.01) {
      agent.locomotorLateralOffset = Number((agent.locomotorLateralOffset * (1 - centerlineBias * 0.82)).toFixed(3));
    }
  }

  function stepAgent(prepared, scenario, agent, dt) {
    if (!agent.active) {
      agent.respawnTimer -= dt;
      if (agent.respawnTimer <= 0) {
        respawnAgent(prepared, scenario, agent);
      }
      return;
    }

    if (!agent.isFocusAgent) {
      stepBackgroundAgent(prepared, scenario, agent, dt);
      return;
    }

    if (agent.isFocusAgent) {
      updateFocusRouteDecision(prepared, scenario, agent);
    }

    const localEnvironment = evaluateEnvironmentAtPoint(prepared, scenario, agent.position, agent);
    const localPressure = extractPressureAtPoint(prepared, scenario, agent.position, { agent, environment: localEnvironment, applyTriggers: true });
    const fatigueThreshold = safeNumber(agent.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    syncAgentRestTriggersForCurrentFatigue(prepared, scenario, agent);
    const fatigueThresholdSlowWalkActive = isFatigueThresholdSlowWalkActive(agent);

    const queueCountAtCurrentTarget = computeQueuePopulation(scenario, agent.selectedTargetNodeId, {
      includeOrdinaryTargetNode: true,
    });
    const localDimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, agent.position, {
      agent,
      environment: localEnvironment,
      pressureState: localPressure,
      fatigue: safeNumber(agent.fatigue, 0),
      fatigueThreshold,
      queueCount: queueCountAtCurrentTarget,
    });
    applyLocomotorAgentState(agent, localDimensionState?.burdens?.locomotor);
    updateDecisionGuideMemory(agent, scenario, localDimensionState?.context?.decisionInputs);
    if (handleRestState(prepared, scenario, agent, localEnvironment, queueCountAtCurrentTarget, dt)) {
      agent.currentWalkingSpeed = 0;
      agent.currentPressure = localPressure.pressureScore;
      agent.cognitiveLoad = safeNumber(localDimensionState?.burdens?.cognitive?.score, localPressure.pressureScore);
      agent.crowdDensity = localEnvironment.crowdDensityLocal;
      agent.environmentNoise = localEnvironment.noiseLevel;
      agent.environmentLighting = localEnvironment.lightingLevel;
      agent.queueCount = queueCountAtCurrentTarget;
      agent.fatigueThreshold = safeNumber(agent.profile?.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
      agent.lastDecisionDiagnostics = agent.isFocusAgent
        ? {
            ...(agent.lastDecisionDiagnostics || {}),
            ...localDimensionState?.burdens?.cognitive,
            time: safeNumber(scenario?.time, 0),
            behavior: agent.lastDecisionDiagnostics?.behavior || null,
          }
        : agent.lastDecisionDiagnostics;
      updateDecisionVisualOffset(agent, dt);
      if (hasActiveDecisionInteraction(agent)) {
        materializeDecisionInteractionPosition(agent);
      } else {
        materializeAgentPosition(prepared, scenario, agent, { smoothOffset: true });
      }
      agent.currentLapTime += dt;
      agent.lapFatiguePeak = Math.max(agent.lapFatiguePeak, agent.fatigue);

      if (agent.isFocusAgent && scenario.heatActive && !scenario.loopPlaybackActive && !scenario.usePrecomputedHeatPlayback) {
        depositHeat(prepared, scenario, agent.position, { agent, pressure: agent.currentPressure, fatigue: agent.fatigue, progress: agent.progress });
        updateFocusMetrics(prepared, scenario, agent, localPressure);
      }
      return;
    }

    if (safeNumber(agent.decisionPauseRemaining, 0) > 1e-6) {
      agent.decisionPauseRemaining = Math.max(0, safeNumber(agent.decisionPauseRemaining, 0) - dt);
      agent.currentWalkingSpeed = 0;
      agent.currentPressure = localPressure.pressureScore;
      agent.cognitiveLoad = safeNumber(localDimensionState?.burdens?.cognitive?.score, localPressure.pressureScore);
      agent.crowdDensity = localEnvironment.crowdDensityLocal;
      agent.environmentNoise = localEnvironment.noiseLevel;
      agent.environmentLighting = localEnvironment.lightingLevel;
      agent.queueCount = queueCountAtCurrentTarget;
      agent.fatigueThreshold = safeNumber(agent.profile?.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
      const fatigueDelta = computeRealtimeFatigueDelta(agent.profile, localEnvironment, dt);
      agent.fatigue = clamp(safeNumber(agent.fatigue, 0) + fatigueDelta, 0, agent.fatigueThreshold);
      agent.lastDecisionDiagnostics = agent.isFocusAgent
        ? {
            ...(agent.lastDecisionDiagnostics || {}),
            ...localDimensionState?.burdens?.cognitive,
            time: safeNumber(scenario?.time, 0),
            behavior: agent.lastDecisionDiagnostics?.behavior || null,
          }
        : agent.lastDecisionDiagnostics;
      updateDecisionVisualOffset(agent, dt);
      if (hasActiveDecisionInteraction(agent)) {
        materializeDecisionInteractionPosition(agent);
      } else {
        materializeAgentPosition(prepared, scenario, agent, { smoothOffset: true });
      }
      agent.currentLapTime += dt;
      agent.lapFatiguePeak = Math.max(agent.lapFatiguePeak, agent.fatigue);

      if (agent.isFocusAgent && scenario.heatActive && !scenario.loopPlaybackActive && !scenario.usePrecomputedHeatPlayback) {
        depositHeat(prepared, scenario, agent.position, { agent, pressure: agent.currentPressure, fatigue: agent.fatigue, progress: agent.progress });
        updateFocusMetrics(prepared, scenario, agent, localPressure);
      }
      return;
    }

    const locomotorSpeedFactor = clamp(safeNumber(localDimensionState?.burdens?.locomotor?.movementSpeedFactor, agent.movementSpeedFactor || 1), 0.15, 1);
    const pressureSpeedPenalty = clamp(localPressure.normalizedPressure * 0.08 + agent.profile.decisionDelay * 0.03, 0, 0.3);
    const restSpeedFactor = agent.restState === 'searching' ? REST_RULES.slowWalkSpeedFactor : 1;
    const fatigueThresholdSpeedFactor = fatigueThresholdSlowWalkActive && agent.restState !== 'searching'
      ? FATIGUE_THRESHOLD_SLOW_WALK_FACTOR
      : 1;
    const decisionSlowWalkFactor = safeNumber(agent.decisionSlowWalkRemaining, 0) > 1e-6
      ? clamp(safeNumber(agent.decisionSlowWalkFactor, 0.5), 0.2, 1)
      : 1;
    const minimumMovingSpeed = clampCapacityScore(agent.profile?.capacityScores?.locomotor, 3) === 1
      ? WHEELCHAIR_MIN_MOVING_SPEED
      : 0.15;
    const adjustedMinimumMovingSpeed = minimumMovingSpeed * fatigueThresholdSpeedFactor;
    const speed = clamp(
      agent.profile.walkingSpeed
        * locomotorSpeedFactor
        * (1 - pressureSpeedPenalty)
        * restSpeedFactor
        * fatigueThresholdSpeedFactor
        * decisionSlowWalkFactor,
      adjustedMinimumMovingSpeed,
      1.45
    );
    agent.currentWalkingSpeed = speed;
    const restSearchMotion = advanceRestSearchMotion(prepared, scenario, agent, speed, dt);
    const decisionMotion = restSearchMotion.handled
      ? { handled: true, movedDistance: restSearchMotion.movedDistance }
      : consumeDecisionMotion(prepared, scenario, agent, speed, dt);
    if (!decisionMotion.handled) {
      agent.pathProgressDist = clamp(safeNumber(agent.pathProgressDist, 0) + speed * dt, 0, agent.path.length);
      agent.progressDist = safeNumber(agent.progressDist, 0) + speed * dt;
    }
    if (safeNumber(agent.decisionSlowWalkRemaining, 0) > 1e-6) {
      agent.decisionSlowWalkRemaining = Math.max(0, safeNumber(agent.decisionSlowWalkRemaining, 0) - dt);
      if (agent.decisionSlowWalkRemaining <= 1e-6) {
        agent.decisionSlowWalkFactor = 1;
      }
    }
    agent.currentLapTime += dt;
    updateDecisionVisualOffset(agent, dt);
    if (hasActiveDecisionInteraction(agent)) {
      materializeDecisionInteractionPosition(agent);
    } else if (!restSearchMotion.handled) {
      materializeAgentPosition(prepared, scenario, agent, { smoothOffset: true });
    }

    const postMoveEnvironment = evaluateEnvironmentAtPoint(prepared, scenario, agent.position, agent);
    const postMovePressure = extractPressureAtPoint(prepared, scenario, agent.position, { agent, environment: postMoveEnvironment, applyTriggers: true });
    const queueCount = computeQueuePopulation(scenario, agent.selectedTargetNodeId, {
      includeOrdinaryTargetNode: true,
    });
    const postMoveDimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, agent.position, {
      agent,
      environment: postMoveEnvironment,
      pressureState: postMovePressure,
      fatigue: safeNumber(agent.fatigue, 0),
      fatigueThreshold: safeNumber(agent.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality)),
      queueCount,
    });
    applyLocomotorAgentState(agent, postMoveDimensionState?.burdens?.locomotor);
    updateDecisionGuideMemory(agent, scenario, postMoveDimensionState?.context?.decisionInputs);
    const fatigueDelta = computeRealtimeFatigueDelta(agent.profile, postMoveEnvironment, dt);
    agent.crowdDensity = postMoveEnvironment.crowdDensityLocal;
    agent.currentPressure = postMovePressure.pressureScore;
    agent.cognitiveLoad = safeNumber(postMoveDimensionState?.burdens?.cognitive?.score, postMovePressure.pressureScore);
    agent.environmentNoise = postMoveEnvironment.noiseLevel;
    agent.environmentLighting = postMoveEnvironment.lightingLevel;
    agent.queueCount = queueCount;
    agent.fatigueThreshold = safeNumber(agent.profile?.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    agent.fatigue = clamp(safeNumber(agent.fatigue, 0) + fatigueDelta, 0, agent.fatigueThreshold);
    agent.lapFatiguePeak = Math.max(agent.lapFatiguePeak, agent.fatigue);
    agent.lastDecisionDiagnostics = agent.isFocusAgent
      ? {
          ...(agent.lastDecisionDiagnostics || {}),
          ...postMoveDimensionState?.burdens?.cognitive,
          time: safeNumber(scenario?.time, 0),
          behavior: agent.lastDecisionDiagnostics?.behavior || null,
        }
      : agent.lastDecisionDiagnostics;

    syncAgentRestTriggersForCurrentFatigue(prepared, scenario, agent);

    if (agent.isFocusAgent && scenario.heatActive && !scenario.loopPlaybackActive && !scenario.usePrecomputedHeatPlayback) {
      depositHeat(prepared, scenario, agent.position, { agent, pressure: agent.currentPressure, fatigue: agent.fatigue, progress: agent.progress });
      updateFocusMetrics(prepared, scenario, agent, postMovePressure);
    }

    if (agent.isFocusAgent) {
      const currentTargetNode = agent.selectedTargetNodeId ? prepared.nodeById?.[agent.selectedTargetNodeId] : null;
      if (currentTargetNode && distance(agent.position, currentTargetNode) <= QUEUE_LOCK_RADIUS) {
        agent.queueLocked = true;
      }
    }

    const shouldDeferTraversalFinishForRest = Boolean(
      agent.isFocusAgent
      && agent.restState
      && agent.restState !== 'none'
    );
    if (!shouldDeferTraversalFinishForRest && agent.pathProgressDist >= agent.path.length - 1e-6) {
      if (agent.isFocusAgent) {
        if (scenario.heatActive && !scenario.firstPassComplete) {
          scenario.focusMetrics.lapTimes.push(agent.currentLapTime);
          scenario.focusMetrics.lapFatigues.push(agent.lapFatiguePeak);
          scenario.focusMetrics.lapTimes = scenario.focusMetrics.lapTimes.slice(-6);
          scenario.focusMetrics.lapFatigues = scenario.focusMetrics.lapFatigues.slice(-6);
          scenario.firstPassComplete = true;
          scenario.pendingReplayReset = true;
        } else if (scenario.loopPlaybackActive) {
          scenario.pendingReplayReset = true;
        }
      }
      finishAgentTraversal(scenario, agent);
    }
  }

  function enforceScenarioSpacing(prepared, scenario) {
    return scenario;
  }

  function stepScenario(prepared, scenario, dt, options) {
    const skipFocusAgent = Boolean(options?.skipFocusAgent);
    const deferPostProcess = Boolean(options?.deferPostProcess);
    const skipBackgroundPlaybackAgents = Boolean(scenario.backgroundFieldActive);
    const maxSubstepSeconds = Math.max(0.06, safeNumber(options?.maxSubstepSeconds, 0.18));
    let remaining = Math.max(0, safeNumber(dt, 0));
    while (remaining > 1e-6) {
      const stepDt = Math.min(maxSubstepSeconds, remaining);
      scenario.backgroundQueueProcessedNodes = {};
      decayHeat(prepared, scenario, stepDt);
      if (skipBackgroundPlaybackAgents) {
        syncScenarioBackgroundField(prepared, scenario, scenario.time);
      }
      if (!skipBackgroundPlaybackAgents) {
        advanceElevatorDepartureCycle(scenario);
        releaseElevatorArrivalBatch(prepared, scenario);
      }
      scenario.agents.forEach((agent) => {
        if (skipFocusAgent && agent.isFocusAgent) {
          return;
        }
        if (skipBackgroundPlaybackAgents && !agent.isFocusAgent) {
          return;
        }
        stepAgent(prepared, scenario, agent, stepDt);
      });
      if (scenario.pendingReplayReset) {
        restoreScenarioReplayState(prepared, scenario);
        remaining = 0;
        break;
      }
      enforceScenarioSpacing(prepared, scenario);
      remaining -= stepDt;
      scenario.time += stepDt;
    }
    if (!deferPostProcess) {
      finalizeScenarioPostProcess(prepared, scenario);
    }
    return scenario;
  }

  function cloneScenario(prepared, scenario) {
    const clone = {
      ...scenario,
      rng: createRng(scenario.rng.state),
      heat: createHeatState(prepared.grid),
      heatMode: scenario.heatMode,
      focusTrace: [],
      hotspots: [],
      suggestions: [],
      pressureImpactMap: {},
      focusMetrics: { lapTimes: [], lapFatigues: [], averageTravelTime: 0, averageFatigue: 0, averageHeat: 0 },
      seatOccupancy: { ...(scenario.seatOccupancy || {}) },
      backgroundFacilityQueues: Object.fromEntries(
        Object.entries(scenario.backgroundFacilityQueues || {}).map(([nodeId, state]) => [nodeId, {
          ...state,
          queueDirection: state?.queueDirection ? { ...state.queueDirection } : null,
        }])
      ),
    };
    clone.agents = scenario.agents.map((agent) => ({ ...agent, position: { ...agent.position }, center: { ...agent.center }, tangent: { ...agent.tangent }, normal: { ...agent.normal }, route: agent.route, path: agent.path }));
    clone.focusAgentId = scenario.focusAgentId;
    clone.backgroundFieldCursor = safeNumber(scenario.backgroundFieldCursor, 0);
    clone.backgroundQueueProcessedNodes = {};
    refreshScenarioAgentCollections(clone);
    return clone;
  }

  function activateHeatmap(prepared, scenario, options) {
    scenario.heat = createHeatState(prepared.grid);
    scenario.heatMode = CUMULATIVE_HEAT_MODE;
    scenario.firstPassComplete = false;
    scenario.loopPlaybackActive = false;
    scenario.pendingReplayReset = false;
    scenario.focusTrace = [];
    scenario.focusTraceSnapshots = [];
    scenario.hotspots = [];
    scenario.suggestions = [];
    scenario.pressureImpactMap = {};
    scenario.focusMetrics = { lapTimes: [], lapFatigues: [], averageTravelTime: 0, averageFatigue: 0, averageHeat: 0 };
    scenario.heatActive = true;
    scenario.replayBaseline = snapshotScenarioForReplay(scenario);
    scenario.summary = buildScenarioSummary(prepared, scenario);
    if (scenario.focusAgent) {
      const initialEnvironment = evaluateEnvironmentAtPoint(prepared, scenario, scenario.focusAgent.position, scenario.focusAgent);
      const initialPressure = extractPressureAtPoint(prepared, scenario, scenario.focusAgent.position, {
        agent: scenario.focusAgent,
        environment: initialEnvironment,
        applyTriggers: false,
      });
      updateFocusMetrics(prepared, scenario, scenario.focusAgent, initialPressure);
    }
    return scenario;
  }

  function cloneHeatState(heat) {
    return {
      raw: new Float64Array(heat.raw),
      pressureAcc: new Float64Array(heat.pressureAcc),
      fatigueAcc: new Float64Array(heat.fatigueAcc),
      progressAcc: new Float64Array(heat.progressAcc),
      cells: heat.cells.map((cell) => ({ ...cell })),
      cellByIndex: Object.fromEntries(heat.cells.map((cell) => [cell.index, { ...cell }])),
      maxHeat: safeNumber(heat.maxHeat, 0),
      totalDeposits: safeNumber(heat.totalDeposits, 0),
    };
  }

  function getPlaybackHeatBurdenDistanceLimit(prepared) {
    const gridPadding = Math.min(0.32, Math.max(0.12, Number(prepared?.grid?.cellSize || 1.15) * 0.25));
    const vitalityRevealRadius = 6 * 0.5 + 0.75;
    return Math.max(3, vitalityRevealRadius) + gridPadding;
  }

  function getTraceDistanceToPoint(traceSnapshots, point) {
    if (!Array.isArray(traceSnapshots) || !traceSnapshots.length || !point) {
      return Number.POSITIVE_INFINITY;
    }
    if (traceSnapshots.length === 1) {
      return distance(traceSnapshots[0], point);
    }
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 1; index < traceSnapshots.length; index += 1) {
      const segmentDistance = distanceToSegment(point, traceSnapshots[index - 1], traceSnapshots[index]);
      if (segmentDistance < bestDistance) {
        bestDistance = segmentDistance;
      }
      if (bestDistance <= 0.05) {
        break;
      }
    }
    return bestDistance;
  }

  function annotatePlaybackHeatBurdenScores(prepared, workingScenario) {
    const heatCells = Array.isArray(workingScenario?.heat?.cells) ? workingScenario.heat.cells : [];
    const traceSnapshots = Array.isArray(workingScenario?.focusTraceSnapshots) ? workingScenario.focusTraceSnapshots : [];
    if (!heatCells.length || !traceSnapshots.length) {
      return;
    }
    const focusProfile = workingScenario?.focusAgent?.profile || {};
    const fatigueThreshold = safeNumber(
      workingScenario?.focusAgent?.fatigueThreshold,
      getFatigueThreshold(focusProfile?.capacityScores?.vitality)
    );
    const distanceLimit = getPlaybackHeatBurdenDistanceLimit(prepared);
    heatCells.forEach((cell) => {
      if (safeNumber(cell?.usage, 0) <= 0 && safeNumber(cell?.heat, 0) <= 1e-9) {
        delete cell.burdenScores;
        return;
      }
      const traceDistance = getTraceDistanceToPoint(traceSnapshots, cell);
      if (traceDistance > distanceLimit) {
        delete cell.burdenScores;
        return;
      }
      const dimensionState = deriveFiveDimensionStateAtPoint(prepared, workingScenario, cell, {
        profile: focusProfile,
        fatigue: safeNumber(cell?.fatigue, 0),
        fatigueThreshold,
      });
      cell.burdenScores = extractBurdenScores(dimensionState);
    });
  }

  function buildPrecomputedPlaybackResult(prepared, workingScenario) {
    annotatePlaybackHeatBurdenScores(prepared, workingScenario);
    const traceSnapshots = Array.isArray(workingScenario.focusTraceSnapshots)
      ? workingScenario.focusTraceSnapshots.map((snapshot) => ({ ...snapshot }))
      : [];
    const pressureValues = traceSnapshots
      .map((snapshot) => safeNumber(snapshot.cognitiveLoad, snapshot.pressure))
      .filter((value) => Number.isFinite(value));
    const startTime = traceSnapshots.length ? safeNumber(traceSnapshots[0].time, 0) : 0;
    const endTime = traceSnapshots.length ? safeNumber(traceSnapshots[traceSnapshots.length - 1].time, 0) : 0;
    return {
      traceSnapshots,
      pressureRange: {
        min: pressureValues.length ? Math.min(...pressureValues) : 0,
        max: pressureValues.length ? Math.max(...pressureValues) : 0,
      },
      duration: Math.max(0, endTime - startTime),
      startTime,
      endTime,
      heat: cloneHeatState(workingScenario.heat),
      hotspots: (workingScenario.hotspots || []).map((item) => ({ ...item })),
      suggestions: (workingScenario.suggestions || []).slice(),
      summary: workingScenario.summary ? { ...workingScenario.summary } : null,
      llmDecisionPlan: workingScenario.llmDecisionPlan ? JSON.parse(JSON.stringify(workingScenario.llmDecisionPlan)) : null,
    };
  }

  function cloneAgentPoint(point, fallback = { x: 0, y: 0 }) {
    return {
      x: safeNumber(point?.x, fallback.x),
      y: safeNumber(point?.y, fallback.y),
    };
  }

  function snapshotBackgroundAgentState(agent, options) {
    const includeProfile = Boolean(options?.includeProfile);
    const prepared = options?.prepared || null;
    const routeStartPoint = !agent?.isFocusAgent && agent?.path?.startPoint
      ? agent.path.startPoint
      : null;
    const terminalNode = !agent?.isFocusAgent
      ? getAssignedRouteTerminalNode(prepared, agent?.route, agent)
      : null;
    const shouldCullNearOriginForPlayback = Boolean(
      prepared
      && agent?.active
      && routeStartPoint
      && distance(agent.position, routeStartPoint) <= BACKGROUND_PLAYBACK_ORIGIN_CULL_DISTANCE + 1e-6
      && safeNumber(agent.pathProgressDist, agent.progressDist) <= BACKGROUND_PLAYBACK_ORIGIN_CULL_DISTANCE + 1e-6
    );
    const shouldCullForPlayback = Boolean(
      prepared
      && agent?.active
      && terminalNode
      && !isExplicitBackgroundQueueNode(terminalNode)
      && (
        distance(agent.position, terminalNode) <= BACKGROUND_PLAYBACK_NONQUEUE_TERMINAL_CULL_DISTANCE + 1e-6
        || safeNumber(agent.pathProgressDist, agent.progressDist) >= Math.max(
          0,
          safeNumber(agent.pathLength, agent.path?.length) - BACKGROUND_PLAYBACK_NONQUEUE_TERMINAL_CULL_DISTANCE
        )
      )
    );
    let playbackPosition = cloneAgentPoint(agent.position);
    let playbackCenter = cloneAgentPoint(agent.center, agent.position);
    if (prepared && agent?.active && !shouldCullNearOriginForPlayback && !shouldCullForPlayback) {
      const nearestPlaybackNode = (prepared.nodes || []).reduce((best, node) => {
        if (!node || isExplicitBackgroundQueueNode(node)) {
          return best;
        }
        const nextDistance = distance(playbackPosition, node);
        if (nextDistance > BACKGROUND_PLAYBACK_NODE_CLEARANCE_RADIUS) {
          return best;
        }
        if (!best || nextDistance < best.distance) {
          return { node, distance: nextDistance };
        }
        return best;
      }, null);
      if (nearestPlaybackNode?.node) {
        const node = nearestPlaybackNode.node;
        const distanceToNode = Math.max(1e-6, nearestPlaybackNode.distance);
        const stableSeed = stableHash(`${agent.id || 'bg'}:${node.id || 'node'}:playback-repulse`);
        const jitterUnit = (((stableSeed >>> 8) % 1000) + 0.5) / 1000;
        const clearanceTarget = clamp(
          BACKGROUND_PLAYBACK_NODE_CLEARANCE_RADIUS + (jitterUnit - 0.5) * BACKGROUND_PLAYBACK_NODE_CLEARANCE_JITTER,
          BACKGROUND_PLAYBACK_NODE_CLEARANCE_RADIUS - BACKGROUND_PLAYBACK_NODE_CLEARANCE_JITTER,
          BACKGROUND_PLAYBACK_NODE_CLEARANCE_RADIUS + BACKGROUND_PLAYBACK_NODE_CLEARANCE_JITTER
        );
        if (distanceToNode < clearanceTarget - 1e-6) {
          const repelDirection = normalizeVector({
            x: playbackPosition.x - safeNumber(node.x, playbackPosition.x),
            y: playbackPosition.y - safeNumber(node.y, playbackPosition.y),
          }, agent.normal || { x: 0, y: 1 });
          const lateralDirection = normalizeVector({
            x: -safeNumber(repelDirection.y, 0),
            y: safeNumber(repelDirection.x, 1),
          }, { x: 1, y: 0 });
          const repelDistance = Math.max(0, clearanceTarget - distanceToNode);
          const adjustedPoint = projectPointToWalkable(prepared, {
            x: playbackPosition.x
              + repelDirection.x * repelDistance
              + lateralDirection.x * ((jitterUnit - 0.5) * 0.16),
            y: playbackPosition.y
              + repelDirection.y * repelDistance
              + lateralDirection.y * ((jitterUnit - 0.5) * 0.16),
          }, {
            minimumClearance: 0.05,
          });
          playbackPosition = { x: adjustedPoint.x, y: adjustedPoint.y };
          playbackCenter = { x: adjustedPoint.x, y: adjustedPoint.y };
        }
      }
    }
    return {
      id: agent.id,
      routeId: agent.routeId || null,
      routeLabel: agent.routeLabel || null,
      active: shouldCullNearOriginForPlayback || shouldCullForPlayback ? false : Boolean(agent.active),
      ...(includeProfile ? { profile: agent.profile ? { ...agent.profile } : null } : {}),
      pathProgressDist: safeNumber(agent.pathProgressDist, agent.progressDist),
      progressDist: safeNumber(agent.progressDist, agent.pathProgressDist),
      progress: safeNumber(agent.progress, 0),
      pathLength: safeNumber(agent.pathLength, agent.path?.length),
      selectedTargetNodeId: agent.selectedTargetNodeId || null,
      selectedTargetNodeLabel: agent.selectedTargetNodeLabel || null,
      queueLocked: Boolean(agent.queueLocked),
      backgroundState: agent.backgroundState || 'moving',
      queueSlotIndex: Math.max(0, Math.floor(safeNumber(agent.queueSlotIndex, 0))),
      rideRemaining: Math.max(0, safeNumber(agent.rideRemaining, 0)),
      queueTargetNodeId: agent.queueTargetNodeId || null,
      queueJoinedAt: Number.isFinite(agent.queueJoinedAt) ? safeNumber(agent.queueJoinedAt, 0) : null,
      restState: agent.restState || 'none',
      restMode: agent.restMode || null,
      reservedSeatId: agent.reservedSeatId || null,
      position: playbackPosition,
      center: playbackCenter,
      tangent: cloneAgentPoint(agent.tangent, { x: 1, y: 0 }),
      normal: cloneAgentPoint(agent.normal, { x: 0, y: 1 }),
    };
  }

  function captureBackgroundFieldFrame(scenario, options) {
    return {
      time: safeNumber(scenario.time, 0),
      seatOccupancy: { ...(scenario.seatOccupancy || {}) },
      agents: (scenario.backgroundAgents || []).map((agent) => snapshotBackgroundAgentState(agent, {
        ...options,
        prepared: options?.prepared || scenario?.prepared || null,
      })),
    };
  }

  function buildBackgroundQueueCounts(frame) {
    const counts = {};
    (frame?.agents || []).forEach((agent) => {
      if (!agent?.active) {
        return;
      }
      if ((agent.backgroundState === 'queueing' || agent.backgroundState === 'riding') && agent.queueTargetNodeId) {
        counts[agent.queueTargetNodeId] = Math.max(0, safeNumber(counts[agent.queueTargetNodeId], 0)) + 1;
      }
    });
    return counts;
  }

  function buildBackgroundDensityFrame(prepared, frame) {
    const occupancy = new Map();
    (frame?.agents || []).forEach((agent) => {
      if (!agent?.active) {
        return;
      }
      const nearestCell = findNearestWalkableCell(prepared.grid, agent.position || agent.center);
      if (!nearestCell) {
        return;
      }
      occupancy.set(nearestCell.index, safeNumber(occupancy.get(nearestCell.index), 0) + 1);
    });
    const entries = Array.from(occupancy.entries()).sort((left, right) => left[0] - right[0]);
    return {
      time: safeNumber(frame?.time, 0),
      occupiedCellIndices: entries.map(([index]) => index),
      occupiedCellCounts: entries.map(([, count]) => safeNumber(count, 0)),
    };
  }

  function buildBackgroundQueueFrame(frame) {
    return {
      time: safeNumber(frame?.time, 0),
      nodes: Object.entries(buildBackgroundQueueCounts(frame))
        .sort((left, right) => String(left[0]).localeCompare(String(right[0])))
        .map(([nodeId, count]) => ({
          nodeId,
          count: Math.max(0, Math.round(safeNumber(count, 0))),
        })),
    };
  }

  function createBackgroundPlaybackAgent(prepared, snapshot, index) {
    const route = snapshot?.routeId ? prepared.routeById?.[snapshot.routeId] || null : null;
    const path = route ? getRoutePathForTerminalNode(prepared, route, snapshot?.selectedTargetNodeId || null) : null;
    return {
      id: snapshot?.id || `bg-playback-${index}`,
      isFocusAgent: false,
      role: 'background',
      profile: snapshot?.profile ? { ...snapshot.profile } : null,
      routeId: snapshot?.routeId || null,
      routeLabel: snapshot?.routeLabel || null,
      route,
      path,
      pathLength: safeNumber(snapshot?.pathLength, path?.length),
      progressDist: safeNumber(snapshot?.progressDist, snapshot?.pathProgressDist),
      pathProgressDist: safeNumber(snapshot?.pathProgressDist, snapshot?.progressDist),
      progress: safeNumber(snapshot?.progress, 0),
      laneBias: 0,
      personalBias: 0,
      startProgressJitter: 0,
      active: Boolean(snapshot?.active),
      respawnTimer: 0,
      position: cloneAgentPoint(snapshot?.position),
      center: cloneAgentPoint(snapshot?.center, snapshot?.position),
      tangent: cloneAgentPoint(snapshot?.tangent, { x: 1, y: 0 }),
      normal: cloneAgentPoint(snapshot?.normal, { x: 0, y: 1 }),
      currentPressure: 0,
      cognitiveLoad: 0,
      crowdDensity: 0,
      environmentNoise: BASE_ENVIRONMENT_NOISE,
      environmentLighting: BASE_ENVIRONMENT_LIGHTING,
      queueCount: 0,
      fatigue: 0,
      fatigueThreshold: safeNumber(snapshot?.profile?.fatigueThreshold, getFatigueThreshold(snapshot?.profile?.capacityScores?.vitality)),
      accumulatedStress: 0,
      pressureEventStates: {},
      currentLapTime: 0,
      lapFatiguePeak: 0,
      lastTravelTime: 0,
      offset: 0,
      nearestNeighborDistance: Number.POSITIVE_INFINITY,
      queueLocked: Boolean(snapshot?.queueLocked),
      backgroundState: snapshot?.backgroundState || 'moving',
      queueSlotIndex: Math.max(0, Math.floor(safeNumber(snapshot?.queueSlotIndex, 0))),
      rideRemaining: Math.max(0, safeNumber(snapshot?.rideRemaining, 0)),
      queueTargetNodeId: snapshot?.queueTargetNodeId || null,
      queueJoinedAt: Number.isFinite(snapshot?.queueJoinedAt) ? safeNumber(snapshot?.queueJoinedAt, 0) : null,
      selectedTargetNodeId: snapshot?.selectedTargetNodeId || null,
      selectedTargetNodeLabel: snapshot?.selectedTargetNodeLabel || null,
      lastDecisionNodeId: null,
      activeDecisionNodeId: null,
      lastEffectiveGuideTime: null,
      lastEffectiveGuideDistance: null,
      decisionPauseRemaining: 0,
      decisionSlowWalkRemaining: 0,
      decisionSlowWalkFactor: 1,
      decisionLateralOffset: 0,
      decisionWrongTurnRemaining: 0,
      decisionBacktrackRemaining: 0,
      decisionInteractionState: null,
      decisionInteractionMode: null,
      decisionInteractionSourceId: null,
      decisionInteractionTarget: null,
      decisionInteractionPath: null,
      decisionInteractionReturnPath: null,
      decisionInteractionProgress: 0,
      decisionInteractionPauseRemaining: 0,
      decisionInteractionQueuedOutcome: null,
      lastDecisionDiagnostics: null,
      restState: snapshot?.restState || 'none',
      restMode: snapshot?.restMode || null,
      restSearchElapsed: 0,
      restSearchAbandoned: false,
      restStartFatigue: 0,
      restResumeThreshold: 0,
      shortRestRemaining: 0,
      shortRestTriggeredThresholds: {},
      reservedSeatId: snapshot?.reservedSeatId || null,
    };
  }

  function applyBackgroundAgentSnapshot(prepared, agent, snapshot) {
    const route = snapshot?.routeId ? prepared.routeById?.[snapshot.routeId] || agent.route || null : agent.route || null;
    agent.routeId = snapshot?.routeId || agent.routeId || null;
    agent.routeLabel = snapshot?.routeLabel || agent.routeLabel || null;
    agent.route = route;
    agent.path = route ? getRoutePathForTerminalNode(prepared, route, snapshot?.selectedTargetNodeId || null) : agent.path || null;
    agent.pathLength = safeNumber(snapshot?.pathLength, agent.path?.length || agent.pathLength);
    agent.active = Boolean(snapshot?.active);
    agent.pathProgressDist = safeNumber(snapshot?.pathProgressDist, snapshot?.progressDist);
    agent.progressDist = safeNumber(snapshot?.progressDist, snapshot?.pathProgressDist);
    agent.progress = safeNumber(snapshot?.progress, agent.progress);
    agent.selectedTargetNodeId = snapshot?.selectedTargetNodeId || null;
    agent.selectedTargetNodeLabel = snapshot?.selectedTargetNodeLabel || null;
    agent.queueLocked = Boolean(snapshot?.queueLocked);
    agent.backgroundState = snapshot?.backgroundState || 'moving';
    agent.queueSlotIndex = Math.max(0, Math.floor(safeNumber(snapshot?.queueSlotIndex, 0)));
    agent.rideRemaining = Math.max(0, safeNumber(snapshot?.rideRemaining, 0));
    agent.queueTargetNodeId = snapshot?.queueTargetNodeId || null;
    agent.queueJoinedAt = Number.isFinite(snapshot?.queueJoinedAt) ? safeNumber(snapshot?.queueJoinedAt, 0) : null;
    agent.restState = snapshot?.restState || 'none';
    agent.restMode = snapshot?.restMode || null;
    agent.reservedSeatId = snapshot?.reservedSeatId || null;
    agent.position = cloneAgentPoint(snapshot?.position, agent.position);
    agent.center = cloneAgentPoint(snapshot?.center, agent.position);
    agent.tangent = cloneAgentPoint(snapshot?.tangent, { x: 1, y: 0 });
    agent.normal = cloneAgentPoint(snapshot?.normal, { x: 0, y: 1 });
  }

  function getTimedFrameIndex(frames, targetTime, previousIndex) {
    if (!frames.length) {
      return -1;
    }
    let index = clamp(Math.round(safeNumber(previousIndex, 0)), 0, frames.length - 1);
    while (index + 1 < frames.length && safeNumber(frames[index + 1]?.time, 0) <= targetTime + 1e-6) {
      index += 1;
    }
    while (index > 0 && safeNumber(frames[index]?.time, 0) > targetTime + 1e-6) {
      index -= 1;
    }
    return index;
  }

  function ensureBackgroundDensityRuntimeFrame(backgroundField, frameIndex) {
    if (!backgroundField || !Array.isArray(backgroundField.densityFrames) || frameIndex < 0) {
      return null;
    }
    backgroundField._densityRuntimeFrames = backgroundField._densityRuntimeFrames || [];
    if (backgroundField._densityRuntimeFrames[frameIndex]) {
      return backgroundField._densityRuntimeFrames[frameIndex];
    }
    const frame = backgroundField.densityFrames[frameIndex];
    if (!frame) {
      return null;
    }
    const occupancyByIndex = new Map();
    const indices = Array.isArray(frame.occupiedCellIndices) ? frame.occupiedCellIndices : [];
    const counts = Array.isArray(frame.occupiedCellCounts) ? frame.occupiedCellCounts : [];
    indices.forEach((index, valueIndex) => {
      occupancyByIndex.set(Math.max(0, Math.floor(safeNumber(index, 0))), Math.max(0, safeNumber(counts[valueIndex], 0)));
    });
    const runtime = { occupancyByIndex };
    backgroundField._densityRuntimeFrames[frameIndex] = runtime;
    return runtime;
  }

  function sampleBackgroundDensityField(prepared, backgroundField, point, targetTime, mode = 'local', previousIndex = 0) {
    if (!prepared?.grid || !backgroundField || !Array.isArray(backgroundField.densityFrames) || !backgroundField.densityFrames.length) {
      return 0;
    }
    const frameIndex = getTimedFrameIndex(backgroundField.densityFrames, safeNumber(targetTime, 0), previousIndex);
    if (frameIndex < 0) {
      return 0;
    }
    const runtime = ensureBackgroundDensityRuntimeFrame(backgroundField, frameIndex);
    if (!runtime) {
      return 0;
    }
    let density = 0;
    getNearbyCells(prepared.grid, point, BACKGROUND_LOCAL_DENSITY_RADIUS).forEach((cell) => {
      const occupancy = Math.max(0, safeNumber(runtime.occupancyByIndex.get(cell.index), 0));
      if (occupancy <= 1e-6) {
        return;
      }
      const currentDistance = distance(cell, point);
      if (currentDistance > BACKGROUND_LOCAL_DENSITY_RADIUS) {
        return;
      }
      density += occupancy * ((BACKGROUND_LOCAL_DENSITY_RADIUS - currentDistance) / BACKGROUND_LOCAL_DENSITY_RADIUS);
    });
    return density;
  }

  function getScenarioCrowdDensityAtPoint(prepared, scenario, point, selfAgent, mode = 'local') {
    if (scenario?.backgroundField && Array.isArray(scenario.backgroundField.densityFrames) && scenario.backgroundField.densityFrames.length) {
      return sampleBackgroundDensityField(
        prepared || scenario?.prepared || null,
        scenario.backgroundField,
        point,
        safeNumber(scenario?.time, 0),
        mode,
        safeNumber(scenario?.backgroundFieldCursor, 0)
      );
    }
    let density = 0;
    (scenario?.agents || []).forEach((agent) => {
      if (!agent.active || agent.id === selfAgent?.id) {
        return;
      }
      const currentDistance = distance(agent.position, point);
      if (currentDistance > BACKGROUND_LOCAL_DENSITY_RADIUS || currentDistance <= 1e-6) {
        return;
      }
      density += (BACKGROUND_LOCAL_DENSITY_RADIUS - currentDistance) / BACKGROUND_LOCAL_DENSITY_RADIUS;
    });
    return density;
  }

  function getBackgroundFieldFrameIndex(backgroundField, targetTime, previousIndex) {
    const frames = Array.isArray(backgroundField?.frames) ? backgroundField.frames : [];
    return getTimedFrameIndex(frames, targetTime, previousIndex);
  }

  function syncScenarioBackgroundField(prepared, scenario, targetTime) {
    if (!scenario?.backgroundFieldActive || !Array.isArray(scenario?.backgroundField?.frames) || !scenario.backgroundField.frames.length) {
      return;
    }
    const frameIndex = getBackgroundFieldFrameIndex(scenario.backgroundField, safeNumber(targetTime, scenario.time), scenario.backgroundFieldCursor);
    if (frameIndex < 0) {
      return;
    }
    const frame = scenario.backgroundField.frames[frameIndex];
    scenario.backgroundFieldCursor = frameIndex;
    scenario.seatOccupancy = { ...(frame.seatOccupancy || {}) };
    const seenIds = {};
    (frame.agents || []).forEach((snapshot, index) => {
      const existingAgent = scenario.backgroundAgentById?.[snapshot.id];
      const agent = existingAgent || createBackgroundPlaybackAgent(prepared, snapshot, index);
      applyBackgroundAgentSnapshot(prepared, agent, snapshot);
      seenIds[agent.id] = true;
      if (!existingAgent) {
        scenario.agents.push(agent);
      }
    });
    refreshScenarioAgentCollections(scenario);
    scenario.backgroundAgents.forEach((agent) => {
      if (!seenIds[agent.id]) {
        agent.active = false;
      }
    });
  }

  function stripFocusAgentForBackgroundField(scenario) {
    scenario.agents = scenario.agents.filter((agent) => !agent.isFocusAgent);
    scenario.focusAgentId = null;
    scenario.focusAgent = null;
    scenario.focusTrace = [];
    scenario.focusTraceSnapshots = [];
    scenario.hotspots = [];
    scenario.suggestions = [];
    scenario.pressureImpactMap = {};
    scenario.firstPassComplete = false;
    scenario.loopPlaybackActive = false;
    scenario.pendingReplayReset = false;
    scenario.replayBaseline = null;
    scenario.precomputedPlayback = null;
    scenario.usePrecomputedHeatPlayback = false;
    refreshScenarioAgentCollections(scenario);
  }

  function buildBackgroundFieldResult(workingScenario, frames, options) {
    const initialFrame = frames[0] || { time: 0, seatOccupancy: {}, agents: [] };
    const finalFrame = frames[frames.length - 1] || initialFrame;
    const prepared = workingScenario?.prepared || options?.prepared || null;
    const densityFrames = prepared?.grid ? frames.map((frame) => buildBackgroundDensityFrame(prepared, frame)) : [];
    const queueFrames = frames.map((frame) => buildBackgroundQueueFrame(frame));
    return {
      version: 'background-field-v4',
      duration: Math.max(0, safeNumber(finalFrame.time, 0) - safeNumber(initialFrame.time, 0)),
      maxSimulationSeconds: Math.max(0, safeNumber(options?.maxSimulationSeconds, 0)),
      frameStepSeconds: Math.max(0.08, safeNumber(options?.frameStepSeconds, 0.08)),
      initialTime: safeNumber(initialFrame.time, 0),
      initialSeatOccupancy: { ...(initialFrame.seatOccupancy || {}) },
      initialAgents: (initialFrame.agents || []).map((agent) => ({
        ...agent,
        profile: agent.profile ? { ...agent.profile } : null,
        position: cloneAgentPoint(agent.position),
        center: cloneAgentPoint(agent.center, agent.position),
        tangent: cloneAgentPoint(agent.tangent, { x: 1, y: 0 }),
        normal: cloneAgentPoint(agent.normal, { x: 0, y: 1 }),
      })),
      frames: frames.map((frame) => ({
        time: safeNumber(frame.time, 0),
        seatOccupancy: { ...(frame.seatOccupancy || {}) },
        agents: (frame.agents || []).map((agent) => ({
          ...agent,
          position: cloneAgentPoint(agent.position),
          center: cloneAgentPoint(agent.center, agent.position),
          tangent: cloneAgentPoint(agent.tangent, { x: 1, y: 0 }),
          normal: cloneAgentPoint(agent.normal, { x: 0, y: 1 }),
        })),
      })),
      densityFrames,
      queueFrames,
      summary: {
        simultaneousCount: safeNumber(workingScenario.requestedCrowdCount, workingScenario.agents.length),
        backgroundAgentCount: (workingScenario.backgroundAgents || []).length,
        duration: Math.max(0, safeNumber(finalFrame.time, 0) - safeNumber(initialFrame.time, 0)),
        densityFrameCount: densityFrames.length,
      },
    };
  }

  function precomputeBackgroundField(prepared, scenario, options) {
    const workingScenario = cloneScenario(prepared, scenario);
    stripFocusAgentForBackgroundField(workingScenario);
    const maxSimulationSeconds = Math.max(30, safeNumber(options?.maxSimulationSeconds, 480));
    const frameStepSeconds = Math.max(0.08, safeNumber(options?.frameStepSeconds, 0.08));
    const frames = [captureBackgroundFieldFrame(workingScenario, { includeProfile: true })];
    let simulatedSeconds = 0;
    let guard = 0;
    while (simulatedSeconds < maxSimulationSeconds && guard < 40000) {
      const stepSeconds = Math.min(frameStepSeconds, maxSimulationSeconds - simulatedSeconds);
      stepScenario(prepared, workingScenario, stepSeconds, { deferPostProcess: true, maxSubstepSeconds: frameStepSeconds });
      simulatedSeconds += stepSeconds;
      guard += 1;
      frames.push(captureBackgroundFieldFrame(workingScenario));
    }
    return buildBackgroundFieldResult(workingScenario, frames, {
      ...options,
      maxSimulationSeconds,
      frameStepSeconds,
    });
  }

  function waitForAsyncTurn() {
    return new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => resolve());
        return;
      }
      if (typeof setImmediate === 'function') {
        setImmediate(resolve);
        return;
      }
      setTimeout(resolve, 0);
    });
  }

  function getCurrentTimestamp() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  function shouldExtendFocusPlaybackBudget(scenario) {
    const focusAgent = scenario?.focusAgent || null;
    if (!focusAgent?.active) {
      return false;
    }
    if (focusAgent.restInterruptionOccurred && safeNumber(focusAgent.progress, 0) < 0.995) {
      return true;
    }
    if (focusAgent.restState && focusAgent.restState !== 'none') {
      return true;
    }
    if (safeNumber(focusAgent.restSearchElapsed, 0) > 1e-6) {
      return true;
    }
    if (focusAgent.restTargetSeatId || focusAgent.reservedSeatId) {
      return true;
    }
    return false;
  }

  function getActiveFocusPlaybackSimulationLimit(scenario, baseMaxSimulationSeconds, extendedMaxSimulationSeconds, simulatedSeconds) {
    const baseLimit = Math.max(30, safeNumber(baseMaxSimulationSeconds, 480));
    const extendedLimit = Math.max(baseLimit, safeNumber(extendedMaxSimulationSeconds, baseLimit));
    if (simulatedSeconds + 1e-6 < baseLimit) {
      return baseLimit;
    }
    return shouldExtendFocusPlaybackBudget(scenario) ? extendedLimit : baseLimit;
  }

  function precomputeHeatPlayback(prepared, scenario, options) {
    const workingScenario = cloneScenario(prepared, scenario);
    activateHeatmap(prepared, workingScenario, options);
    const maxSimulationSeconds = Math.max(30, safeNumber(options?.maxSimulationSeconds, 480));
    const maxExtendedSimulationSeconds = Math.max(
      maxSimulationSeconds,
      safeNumber(options?.maxExtendedSimulationSeconds, maxSimulationSeconds)
    );
    const precomputeStepSeconds = Math.max(0.12, safeNumber(options?.precomputeStepSeconds, 0.72));
    let simulatedSeconds = 0;
    let guard = 0;
    while (!workingScenario.firstPassComplete && guard < 20000) {
      const activeSimulationLimit = getActiveFocusPlaybackSimulationLimit(
        workingScenario,
        maxSimulationSeconds,
        maxExtendedSimulationSeconds,
        simulatedSeconds
      );
      if (simulatedSeconds >= activeSimulationLimit - 1e-6) {
        break;
      }
      const stepSeconds = Math.min(precomputeStepSeconds, activeSimulationLimit - simulatedSeconds);
      stepScenario(prepared, workingScenario, stepSeconds, { deferPostProcess: true });
      simulatedSeconds += stepSeconds;
      guard += 1;
    }
    finalizeScenarioPostProcess(prepared, workingScenario);
    return buildPrecomputedPlaybackResult(prepared, workingScenario);
  }

  async function precomputeHeatPlaybackAsync(prepared, scenario, options) {
    const workingScenario = cloneScenario(prepared, scenario);
    activateHeatmap(prepared, workingScenario, options);
    const maxSimulationSeconds = Math.max(30, safeNumber(options?.maxSimulationSeconds, 480));
    const maxExtendedSimulationSeconds = Math.max(
      maxSimulationSeconds,
      safeNumber(options?.maxExtendedSimulationSeconds, maxSimulationSeconds)
    );
    const frameBudgetMs = Math.max(4, safeNumber(options?.frameBudgetMs, 12));
    const precomputeStepSeconds = Math.max(0.12, safeNumber(options?.precomputeStepSeconds, 0.72));
    let simulatedSeconds = 0;
    let guard = 0;
    while (!workingScenario.firstPassComplete && guard < 20000) {
      const frameStart = getCurrentTimestamp();
      let activeSimulationLimit = getActiveFocusPlaybackSimulationLimit(
        workingScenario,
        maxSimulationSeconds,
        maxExtendedSimulationSeconds,
        simulatedSeconds
      );
      if (simulatedSeconds >= activeSimulationLimit - 1e-6) {
        break;
      }
      while (
        !workingScenario.firstPassComplete
        && guard < 20000
        && getCurrentTimestamp() - frameStart < frameBudgetMs
      ) {
        activeSimulationLimit = getActiveFocusPlaybackSimulationLimit(
          workingScenario,
          maxSimulationSeconds,
          maxExtendedSimulationSeconds,
          simulatedSeconds
        );
        if (simulatedSeconds >= activeSimulationLimit - 1e-6) {
          break;
        }
        const stepSeconds = Math.min(precomputeStepSeconds, activeSimulationLimit - simulatedSeconds);
        stepScenario(prepared, workingScenario, stepSeconds, { deferPostProcess: true });
        simulatedSeconds += stepSeconds;
        guard += 1;
      }
      if (typeof options?.onProgress === 'function') {
        options.onProgress({
          simulatedSeconds,
          maxSimulationSeconds: activeSimulationLimit,
          guard,
          firstPassComplete: workingScenario.firstPassComplete,
        });
      }
      const nextActiveSimulationLimit = getActiveFocusPlaybackSimulationLimit(
        workingScenario,
        maxSimulationSeconds,
        maxExtendedSimulationSeconds,
        simulatedSeconds
      );
      if (!workingScenario.firstPassComplete && simulatedSeconds < nextActiveSimulationLimit && guard < 20000) {
        await waitForAsyncTurn();
      }
    }
    finalizeScenarioPostProcess(prepared, workingScenario);
    if (typeof options?.onProgress === 'function') {
      options.onProgress({
        simulatedSeconds,
        maxSimulationSeconds,
        guard,
        firstPassComplete: true,
      });
    }
    const playback = buildPrecomputedPlaybackResult(prepared, workingScenario);

    // Also precompute background field for proper playback (keeps agent count stable and avoids per-frame stepping)
    // Use workingScenario so both simulations run on the same timeline
    const existingBackgroundField = workingScenario.backgroundFieldActive && workingScenario.backgroundField
      ? workingScenario.backgroundField
      : null;
    const backgroundField = existingBackgroundField || await precomputeBackgroundFieldAsyncWithWorkingScenario(prepared, workingScenario, {
      maxSimulationSeconds,
      frameBudgetMs,
      frameStepSeconds: 0.08,
      prepared,
    });
    playback.backgroundField = backgroundField;

    return playback;
  }

  async function precomputeBackgroundFieldAsync(prepared, scenario, options) {
    const workingScenario = cloneScenario(prepared, scenario);
    stripFocusAgentForBackgroundField(workingScenario);
    const maxSimulationSeconds = Math.max(30, safeNumber(options?.maxSimulationSeconds, 480));
    const frameBudgetMs = Math.max(4, safeNumber(options?.frameBudgetMs, 12));
    const frameStepSeconds = Math.max(0.08, safeNumber(options?.frameStepSeconds, 0.08));
    const frames = [captureBackgroundFieldFrame(workingScenario, { includeProfile: true })];
    let simulatedSeconds = 0;
    let guard = 0;
    while (simulatedSeconds < maxSimulationSeconds && guard < 40000) {
      const frameStart = getCurrentTimestamp();
      while (
        simulatedSeconds < maxSimulationSeconds
        && guard < 40000
        && getCurrentTimestamp() - frameStart < frameBudgetMs
      ) {
        const stepSeconds = Math.min(frameStepSeconds, maxSimulationSeconds - simulatedSeconds);
        stepScenario(prepared, workingScenario, stepSeconds, { deferPostProcess: true, maxSubstepSeconds: frameStepSeconds });
        simulatedSeconds += stepSeconds;
        guard += 1;
        frames.push(captureBackgroundFieldFrame(workingScenario));
      }
      if (typeof options?.onProgress === 'function') {
        options.onProgress({
          simulatedSeconds,
          maxSimulationSeconds,
          guard,
          stage: 'background',
          completed: simulatedSeconds >= maxSimulationSeconds || guard >= 40000,
        });
      }
      if (simulatedSeconds < maxSimulationSeconds && guard < 40000) {
        await waitForAsyncTurn();
      }
    }
    return buildBackgroundFieldResult(workingScenario, frames, {
      ...options,
      maxSimulationSeconds,
      frameStepSeconds,
    });
  }

  // Same as precomputeBackgroundFieldAsync but uses a pre-provided workingScenario
  // so both background field and heat playback run on identical timelines
  async function precomputeBackgroundFieldAsyncWithWorkingScenario(prepared, workingScenario, options) {
    stripFocusAgentForBackgroundField(workingScenario);
    const maxSimulationSeconds = Math.max(30, safeNumber(options?.maxSimulationSeconds, 480));
    const frameBudgetMs = Math.max(4, safeNumber(options?.frameBudgetMs, 12));
    const frameStepSeconds = Math.max(0.08, safeNumber(options?.frameStepSeconds, 0.08));
    const frames = [captureBackgroundFieldFrame(workingScenario, { includeProfile: true })];
    let simulatedSeconds = 0;
    let guard = 0;
    while (simulatedSeconds < maxSimulationSeconds && guard < 40000) {
      const frameStart = getCurrentTimestamp();
      while (
        simulatedSeconds < maxSimulationSeconds
        && guard < 40000
        && getCurrentTimestamp() - frameStart < frameBudgetMs
      ) {
        const stepSeconds = Math.min(frameStepSeconds, maxSimulationSeconds - simulatedSeconds);
        stepScenario(prepared, workingScenario, stepSeconds, { deferPostProcess: true });
        simulatedSeconds += stepSeconds;
        guard += 1;
        frames.push(captureBackgroundFieldFrame(workingScenario));
      }
      if (typeof options?.onProgress === 'function') {
        options.onProgress({
          simulatedSeconds,
          maxSimulationSeconds,
          guard,
          stage: 'background',
          completed: simulatedSeconds >= maxSimulationSeconds || guard >= 40000,
        });
      }
      if (simulatedSeconds < maxSimulationSeconds && guard < 40000) {
        await waitForAsyncTurn();
      }
    }
    return buildBackgroundFieldResult(workingScenario, frames, {
      ...options,
      maxSimulationSeconds,
      frameStepSeconds,
    });
  }

  function inspectNearbySeats(prepared, point, fatigue, fatigueThreshold, profile) {
    const visionRadius = getPerceptionRadiusForProfile(profile);
    const nearbySeats = prepared.seats
      .map((seat) => ({ ...seat, distance: distance(seat, point) }))
      .filter((seat) => seat.distance <= visionRadius)
      .sort((left, right) => left.distance - right.distance);
    const threshold = safeNumber(fatigueThreshold, FATIGUE_THRESHOLDS['70-74']);
    const needsRest = fatigue >= threshold;
    return {
      needsRest,
      fatigueThreshold: threshold,
      visionRadius,
      nearbySeats,
      advice: needsRest
        ? nearbySeats.length
          ? '当前疲劳值已超过阈值，建议优先寻找视野范围内的座位休息。'
          : '当前疲劳值已超过阈值，但视野范围内没有座位，建议在附近补充休息设施。'
        : '当前点位压力可控，可继续通行。',
    };
  }

  function inspectHeatPoint(prepared, scenario, point) {
    if (!isWalkablePoint(prepared, point)) {
      return null;
    }
    const nearest = findNearestWalkableCell(prepared.grid, point);
    if (!nearest) {
      return null;
    }
    const heatCell = scenario.heat.cellByIndex[nearest.index] || { heat: 0, pressure: 0, fatigue: 0, progress: 0, usage: 0 };
    const focusThreshold = safeNumber(scenario.focusAgent?.fatigueThreshold, getFatigueThreshold(scenario.focusAgent?.profile?.capacityScores?.vitality));
    const seatInfo = inspectNearbySeats(prepared, point, heatCell.fatigue, focusThreshold, scenario.focusAgent?.profile);
    const environment = evaluateEnvironmentAtPoint(prepared, scenario, point, null);
    const topPressureSources = getTopPressureSourcesAtPoint(prepared, scenario, point, 3);
    const dimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, point, {
      profile: scenario.focusAgent?.profile,
      fatigue: heatCell.fatigue,
      fatigueThreshold: focusThreshold,
    });
    return {
      type: 'point',
      x: point.x,
      y: point.y,
      pressure: heatCell.pressure,
      cognitiveLoad: heatCell.pressure,
      fatigue: heatCell.fatigue,
      heat: heatCell.heat,
      usage: heatCell.usage,
      progress: heatCell.progress,
      crowdDensity: Number(getUnifiedCrowdDensity(environment, 0).toFixed(3)),
      visionRadius: seatInfo.visionRadius,
      fatigueThreshold: seatInfo.fatigueThreshold,
      environmentNoise: environment.noiseLevel,
      environmentLighting: environment.lightingLevel,
      persistentStress: 0,
      localVisibleStress: 0,
      ambientLightingStress: Number(safeNumber(dimensionState?.burdens?.psychological?.ambientLightingStress, 0).toFixed(3)),
      ambientQueueStress: Number(safeNumber(dimensionState?.burdens?.psychological?.ambientQueueStress, 0).toFixed(3)),
      topPressureSources,
      capacityScores: { ...dimensionState.capacityScores },
      burdenScores: { ...dimensionState.burdenScores },
      fiveDimensions: dimensionState,
      decisionDiagnostics: { ...dimensionState.burdens.cognitive },
      needsRest: seatInfo.needsRest,
      nearbySeats: seatInfo.nearbySeats,
      advice: seatInfo.advice,
    };
  }

  function inspectAgent(prepared, scenario, agentId) {
    const agent = scenario.agents.find((item) => item.id === agentId);
    if (!agent) {
      return null;
    }
    const fatigueThreshold = safeNumber(agent.fatigueThreshold, getFatigueThreshold(agent.profile?.capacityScores?.vitality));
    const seatInfo = inspectNearbySeats(prepared, agent.position, agent.fatigue, fatigueThreshold, agent.profile);
    const heatPoint = inspectHeatPoint(prepared, scenario, agent.position);
    const pressureState = extractPressureAtPoint(prepared, scenario, agent.position, { agent, applyTriggers: false });
    const dimensionState = deriveFiveDimensionStateAtPoint(prepared, scenario, agent.position, {
      agent,
      fatigue: agent.fatigue,
      fatigueThreshold,
      pressureState,
    });
    const topPressureSources = pressureState.contributions
      .slice()
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map(({ pressurePoint, influence, score, state, sourceKind, pressureDelta }) => ({
        id: pressurePoint.id,
        name: pressurePoint.name || pressurePoint.id,
        category: pressurePoint.category,
        feature: pressurePoint.feature,
        x: pressurePoint.x,
        y: pressurePoint.y,
        influence,
        score,
        pressure: score,
        pressureDelta: safeNumber(pressureDelta, influence),
        state: state || null,
        sourceKind: sourceKind || null,
      }));
    return {
      type: 'agent',
      id: agent.id,
      routeId: agent.routeId,
      routeLabel: agent.routeLabel,
      isFocusAgent: agent.isFocusAgent,
      queueLocked: Boolean(agent.queueLocked),
      restState: agent.restState || 'none',
      restMode: agent.restMode || null,
      selectedTargetNodeId: agent.selectedTargetNodeId || null,
      selectedTargetNodeLabel: agent.selectedTargetNodeLabel || null,
      x: agent.position.x,
      y: agent.position.y,
      pressure: agent.currentPressure,
      cognitiveLoad: safeNumber(agent.cognitiveLoad, agent.currentPressure),
      fatigue: agent.fatigue,
      heat: heatPoint?.heat || 0,
      progress: getDisplayedAgentProgress(scenario, agent),
      crowdDensity: agent.crowdDensity,
      walkingSpeed: safeNumber(agent.currentWalkingSpeed, agent.profile.walkingSpeed),
      decisionDelay: safeNumber(
        dimensionState?.burdens?.cognitive?.decisionReactionTime,
        safeNumber(agent.lastDecisionDiagnostics?.decisionReactionTime, agent.profile.decisionDelay)
      ),
      movementBehavior: agent.movementBehavior || dimensionState?.burdens?.locomotor?.movementBehavior || 'normal_walk',
      movementMainCause: agent.movementMainCause || dimensionState?.burdens?.locomotor?.movementMainCause || 'speed',
      movementSpeedFactor: safeNumber(
        agent.movementSpeedFactor,
        safeNumber(dimensionState?.burdens?.locomotor?.movementSpeedFactor, 1)
      ),
      visionRadius: seatInfo.visionRadius,
      fatigueThreshold,
      restSearchElapsed: safeNumber(agent.restSearchElapsed, 0),
      restSearchAbandoned: Boolean(agent.restSearchAbandoned),
      environmentNoise: safeNumber(agent.environmentNoise, BASE_ENVIRONMENT_NOISE),
      environmentLighting: safeNumber(agent.environmentLighting, BASE_ENVIRONMENT_LIGHTING),
      queueCount: safeNumber(agent.queueCount, 0),
      persistentStress: safeNumber(pressureState.persistentStress, agent.accumulatedStress),
      localVisibleStress: safeNumber(pressureState.localVisibleStress, 0),
      ambientLightingStress: Number(safeNumber(pressureState.ambientLightingStress, 0).toFixed(3)),
      ambientQueueStress: Number(safeNumber(pressureState.ambientQueueStress, 0).toFixed(3)),
      topPressureSources,
      capacityScores: { ...dimensionState.capacityScores },
      burdenScores: { ...dimensionState.burdenScores },
      fiveDimensions: dimensionState,
      decisionDiagnostics: { ...dimensionState.burdens.cognitive },
      needsRest: seatInfo.needsRest,
      nearbySeats: seatInfo.nearbySeats,
      advice: seatInfo.advice,
    };
  }

  function createScenario(prepared, options) {
    const backgroundField = options.backgroundField || null;
    const baseCrowdPreset = prepared.crowdPresetById[options.crowdPresetId] || prepared.crowdPresets[0];
    const requestedCrowdCount = Number.isFinite(Number(options?.backgroundCrowdCount))
      ? Math.max(1, Math.round(Number(options.backgroundCrowdCount)))
      : null;
    const simulatedCrowdCount = requestedCrowdCount || baseCrowdPreset.simultaneousCount;
    const crowdPreset = requestedCrowdCount
      ? {
          ...baseCrowdPreset,
          id: 'custom',
          label: 'Custom',
          simultaneousCount: requestedCrowdCount,
          backgroundCount: Math.max(0, simulatedCrowdCount - 1),
          focusCount: 1,
          simulatedCount: simulatedCrowdCount,
        }
      : baseCrowdPreset;
    const hasCustomFocus = options.startPoint && options.targetRegionId;
    const requestedFocusRouteId = !hasCustomFocus && typeof options?.focusRouteId === 'string'
      ? options.focusRouteId
      : null;
    const focusRoutePreset = hasCustomFocus
      ? null
      : requestedFocusRouteId
        ? prepared.focusRoutePresetById[requestedFocusRouteId] || null
        : prepared.focusRoutePresets[0];
    if (!hasCustomFocus && requestedFocusRouteId && !focusRoutePreset) {
      throw new Error(`Unknown focus route preset: ${requestedFocusRouteId}`);
    }
    const focusRoute = hasCustomFocus ? null : prepared.routeById[focusRoutePreset?.routeId];
    const targetRegion = hasCustomFocus
      ? prepared.targetRegionById[options.targetRegionId] || null
      : inferRouteTargetRegion(prepared, focusRoute, focusRoutePreset?.endNode);
    if (hasCustomFocus && !targetRegion) {
      throw new Error(`当前模型缺少有效的目标区域：${options.targetRegionId}`);
    }
    if (!hasCustomFocus && !focusRoute?.endAnchor) {
      throw new Error('未能解析有效的目标区域。');
    }
    const focusSeedKey = hasCustomFocus
      ? `${options.targetRegionId}:${safeNumber(options.startPoint?.x, 0).toFixed(2)}:${safeNumber(options.startPoint?.y, 0).toFixed(2)}`
      : focusRoute.id;
    const seed = options.seed || stableHash(`${crowdPreset.id}:${focusSeedKey}:${JSON.stringify(options.focusProfile || {})}`);
    const rng = createRng(seed);
    const backgroundProfiles = backgroundField
      ? []
      : sampleProfilesForCount(prepared.healthyAgentPool, crowdPreset.backgroundCount, rng);
    const backgroundRoutePool = prepared.odRoutes.filter((route) => (
      route.id !== focusRoute?.id
      && !isTrainDoorRouteOrigin(route)
      && !isElevatorRouteOrigin(route)
      && isEligibleBackgroundRoute(route)
    ));
    const elevatorOriginRoutePool = prepared.odRoutes.filter((route) => (
      isElevatorRouteOrigin(route)
      && isEligibleBackgroundRoute(route)
    ));
    const focusStartPoint = hasCustomFocus
      ? {
          x: safeNumber(options.startPoint.x, 0),
          y: safeNumber(options.startPoint.y, 0),
          z: safeNumber(options.startPoint.z, 0),
        }
      : {
          x: safeNumber(focusRoute?.startAnchor?.x, 0),
          y: safeNumber(focusRoute?.startAnchor?.y, 0),
          z: safeNumber(focusRoute?.startAnchor?.z, 0),
        };

    const scenario = {
      id: `scenario_${seed}`,
      seed,
      prepared,
      rng,
      time: 0,
      crowdPreset,
      requestedCrowdCount: requestedCrowdCount || crowdPreset.simultaneousCount,
      simulatedCrowdCount,
      focusRoutePreset,
      focusRoute,
      focusTargetRegion: targetRegion,
      focusTargetRegionId: targetRegion?.id || null,
      focusStartPoint,
      backgroundRoutePool,
      elevatorOriginRoutePool,
      focusAgentId: 'focus-0',
      heatActive: false,
      heatMode: 'decay-live',
      paused: false,
      heat: createHeatState(prepared.grid),
      pressureImpactMap: {},
      focusTrace: [],
      focusTraceSnapshots: [],
      hotspots: [],
      suggestions: [],
      focusMetrics: { lapTimes: [], lapFatigues: [], averageTravelTime: 0, averageFatigue: 0, averageHeat: 0 },
      firstPassComplete: false,
      loopPlaybackActive: false,
      pendingReplayReset: false,
      replayBaseline: null,
      precomputedPlayback: null,
      usePrecomputedHeatPlayback: false,
      playbackRevealTime: 0,
      llmDecisionPlan: options.llmDecisionPlan ? JSON.parse(JSON.stringify(options.llmDecisionPlan)) : null,
      focusPlanAnchorRuntime: null,
      focusProgressReferenceDistance: Math.max(
        1,
        safeNumber(focusRoute?.pathLength, 0),
        safeNumber(focusRoute?.distance, 0)
      ),
      summary: null,
      seatOccupancy: { ...(backgroundField?.initialSeatOccupancy || {}) },
      backgroundField,
      backgroundFieldActive: Boolean(backgroundField),
      backgroundFieldCursor: 0,
      backgroundFacilityQueues: {},
      backgroundQueueProcessedNodes: {},
      backgroundMovingTargetCount: backgroundField
        ? (
          Array.isArray(backgroundField?.initialAgents)
            ? backgroundField.initialAgents.length
            : (Array.isArray(backgroundField?.frames?.[0]?.agents) ? backgroundField.frames[0].agents.length : 0)
        )
        : backgroundProfiles.length,
      backgroundAgentSerial: backgroundField
        ? (
          Array.isArray(backgroundField?.initialAgents)
            ? backgroundField.initialAgents.length
            : (Array.isArray(backgroundField?.frames?.[0]?.agents) ? backgroundField.frames[0].agents.length : 0)
        )
        : backgroundProfiles.length,
      agents: [],
      backgroundAgents: [],
      backgroundAgentById: {},
    };

    const agents = [];
    scenario.agents = agents;
    if (backgroundField) {
      const initialBackgroundAgents = Array.isArray(backgroundField?.initialAgents)
        ? backgroundField.initialAgents
        : Array.isArray(backgroundField?.frames?.[0]?.agents)
          ? backgroundField.frames[0].agents
          : [];
      initialBackgroundAgents.forEach((snapshot, index) => {
        agents.push(createBackgroundPlaybackAgent(prepared, snapshot, index));
      });
    } else {
      backgroundProfiles.forEach((profile, index) => {
        const route = chooseBackgroundRouteForScenario(scenario, rng);
        const agent = createAgent(prepared, scenario, profile, route, {
          id: `bg-${index}`,
          isFocusAgent: false,
          initialProgress: rng.next(),
          initialFatigue: 0,
        laneBias: clamp((rng.next() - 0.5) * 1.24, -0.62, 0.62),
        startProgressJitter: 0.35 + rng.next() * 1.15,
        });
        if (agent) {
          agents.push(agent);
        }
      });
    }

    const focusProfile = buildFocusProfile(options.focusProfile || {});
    const initialResolution = hasCustomFocus
      ? resolveFocusRoute(prepared, scenario, { id: scenario.focusAgentId, profile: focusProfile }, focusStartPoint, targetRegion.id, null)
      : {
          route: focusRoute,
          targetNode: focusRoute?.endNodeIds?.[0] ? prepared.nodeById[focusRoute.endNodeIds[0]] || null : null,
        };
    const focusAgent = createAgent(prepared, scenario, focusProfile, initialResolution?.route || focusRoute, {
      id: scenario.focusAgentId,
      isFocusAgent: true,
      initialProgress: 0,
      initialFatigue: 0,
      laneBias: 0,
      queueLocked: false,
      selectedTargetNodeId: initialResolution?.targetNode?.id || null,
      selectedTargetNodeLabel: initialResolution?.targetNode?.displayLabelEn || initialResolution?.targetNode?.displayLabel || initialResolution?.targetNode?.id || null,
    });
    if (!focusAgent) {
      throw new Error('重点代理人路径生成失败。');
    }
    focusAgent.llmRouteStyle = scenario.llmDecisionPlan?.routeStyle
      ? { ...scenario.llmDecisionPlan.routeStyle }
      : null;
    agents.push(focusAgent);
    scenario.agents = agents;
    scenario.focusAgent = focusAgent;
    if (initialResolution?.route) {
      scenario.focusRoute = initialResolution.route;
    }
    refreshScenarioAgentCollections(scenario);
    if (backgroundField) {
      syncScenarioBackgroundField(prepared, scenario, safeNumber(backgroundField.initialTime, 0));
    }
    enforceScenarioSpacing(prepared, scenario);
    scenario.summary = buildScenarioSummary(prepared, scenario);
    return scenario;
  }

  function colorForHeat(value) {
    const normalized = clamp(value / 100, 0, 1);
    const hue = 120 - normalized * 120;
    const saturation = 82;
    const lightness = 44 + (1 - normalized) * 8;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  function prepareSimData(rawData, options) {
    const walkableAreas = (rawData.walkableAreas || []).map(normalizePolygon);
    const obstacles = (rawData.obstacles || []).map(normalizePolygon);
    const nodes = (rawData.nodes || []).map((node, index) => {
      const normalizedNode = { ...node, id: ensureId(node, index, 'node'), x: safeNumber(node.x, 0), y: safeNumber(node.y, 0), z: safeNumber(node.z, 0) };
      const metadata = classifyNodeMetadata(normalizedNode);
      return {
        ...normalizedNode,
        displayLabel: metadata.displayLabelZh || formatNodeLabel(normalizedNode),
        displayLabelEn: metadata.displayLabelEn || formatNodeLabel(normalizedNode),
        nodeGroup: metadata.nodeGroup,
        targetRegionIds: metadata.targetRegionIds || [],
        displayColor: metadata.displayColor || NODE_GROUP_COLORS.node,
      };
    });
    const seenPressureIds = new Set();
    const pressureObjects = (rawData.pressureObjects || []).map((item, index) => ({
      ...item,
      id: ensureUniqueIdentifier(ensureId(item, index, 'pressure'), seenPressureIds),
      sourceIndex: index,
      x: safeNumber(item.x, 0),
      y: safeNumber(item.y, 0),
      z: safeNumber(item.z, 0),
      strength: safeNumber(item.strength, 0),
      range: safeNumber(item.range, 0),
      lux: safeNumber(item.lux, 0),
      decibel: safeNumber(item.decibel, 0),
      displayColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.unknown,
    }));
    const seenSeatIds = new Set();
    const seats = (rawData.seats || []).map((seat, index) => ({
      ...seat,
      id: ensureUniqueIdentifier(ensureId(seat, index, 'seat'), seenSeatIds),
      sourceIndex: index,
      x: safeNumber(seat.x, 0),
      y: safeNumber(seat.y, 0),
      z: safeNumber(seat.z, 0),
      seatCount: safeNumber(seat.seatCount, 2),
      reliefStrength: safeNumber(seat.reliefStrength, 0.6),
      reliefRange: safeNumber(seat.reliefRange, 2.5),
      label: seat.label || seat.name || `Seat ${index + 1}`,
    }));
    const activePressureObjects = pressureObjects.filter((item) => item.activeForSimulation);
    const bounds = computeBounds(walkableAreas, [...nodes, ...pressureObjects, ...seats]);
    const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const pressureById = Object.fromEntries(pressureObjects.map((item) => [item.id, item]));
    const healthyAgentPool = Array.isArray(options?.healthyAgents)
      ? options.healthyAgents.map((agent) => buildFocusProfile(agent))
      : [];

    const prepared = {
      rawData,
      walkableAreas,
      obstacles,
      nodes,
      pressureObjects,
      activePressureObjects,
      passivePressureObjects: pressureObjects.filter((item) => !item.activeForSimulation),
      seats,
      bounds: { ...bounds, width: bounds.maxX - bounds.minX, height: bounds.maxY - bounds.minY },
      nodeById,
      pressureById,
      healthyAgentPool,
      crowdPresets: CROWD_PRESETS.map((preset) => ({ ...preset })),
      crowdPresetById: Object.fromEntries(CROWD_PRESETS.map((preset) => [preset.id, { ...preset }])),
      routePathCache: {},
    };

    prepared.grid = createGrid(prepared, GRID_CELL_SIZE);
    const targetRegionData = createTargetRegions(nodes);
    prepared.targetRegions = targetRegionData.targetRegions;
    prepared.targetRegionById = targetRegionData.targetRegionById;
    const endpointData = createEndpointCollections(nodeById);
    prepared.endpointCollections = endpointData.collections;
    prepared.endpointGroups = endpointData.endpointGroups;
    prepared.endpointGroupById = endpointData.endpointGroupById;
    prepared.odRoutes = createODRoutes(prepared.endpointCollections);
    prepared.routeById = Object.fromEntries(prepared.odRoutes.map((route) => [route.id, route]));
    prepared.focusRoutePresets = FOCUS_ROUTE_PRESETS.map((preset) => {
      const route = prepared.odRoutes.find((item) => (
        item.startGroupId === preset.startNodeId
        && (
          item.endGroupId === preset.endNodeId
          || (item.endNodeIds || []).includes(preset.endNodeId)
        )
      ));
      return route
        ? {
            ...preset,
            routeId: route.id,
            startNode: prepared.nodeById[preset.startNodeId],
            endNode: prepared.nodeById[preset.endNodeId] || null,
          }
        : null;
    }).filter(Boolean);
    prepared.focusRoutePresetById = Object.fromEntries(prepared.focusRoutePresets.map((preset) => [preset.id, preset]));
    return prepared;
  }

  return {
    CATEGORY_COLORS,
    NODE_GROUP_COLORS,
    TARGET_REGION_COLORS,
    CROWD_PRESETS,
    FOCUS_ROUTE_PRESETS,
    clamp,
    safeNumber,
      distance,
      lerp,
      interpolateTraceMetricAtPoint,
      normalizeVector,
    stableHash,
    createRng,
    pointInPolygon,
    computeBounds,
    formatNodeLabel,
    normalizePolygon,
    averagePoint,
    ensureId,
    isWalkablePoint,
    createGrid,
    buildFocusProfile,
    prepareSimData,
    createScenario,
    stepScenario,
    activateHeatmap,
    inspectHeatPoint,
    inspectAgent,
    getFacilitySwitchProbability,
    estimateFacilityWaitTime,
    estimateFacilityRideTime,
    getTargetCandidateNodes,
    getTopPressureSourcesAtPoint,
    sampleBackgroundDensityField,
    getScenarioCrowdDensityAtPoint,
    evaluatePressureStateAtPoint,
    precomputeBackgroundField,
    precomputeBackgroundFieldAsync,
    precomputeHeatPlayback,
    precomputeHeatPlaybackAsync,
    finalizeScenarioPostProcess,
    resolveStressRuleDescriptor,
    getCrowdingFatigueCoefficient,
    getNoiseFatigueCoefficient,
    getLightingFatigueCoefficient,
    getQueueFatigueCoefficient,
    getPhysicalFatigueCoefficient,
    getCrowdingStressCoefficients,
    getNoiseStressCoefficients,
    colorForHeat,
    resetScenarioToReplayBaseline,
    LONGEST_WALKING_TIME_MINUTES,
    REST_RULES,
    FATIGUE_THRESHOLDS,
    BASE_ENVIRONMENT_NOISE,
    BASE_ENVIRONMENT_LIGHTING,
    getUnifiedRules: () => UNIFIED_RULES,
    normalizeCapacityScores,
    getPerceptionRadiusForScores,
    inspectNearbySeats,
    advanceRestSearchState,
    getStandingRestLocationBand,
    computeRealtimeFatigueDelta,
    computeSensoryBurdenState,
    resolveSensoryRelevantObjectWeight,
    computePsychologicalBurdenState,
    computePsychologicalBurdenScore,
    classifyDecisionGuideFeature,
    evaluateDecisionGuideMatch,
    computeDecisionBurdenState,
    buildFocusHumanContext,
    rollDecisionBehaviorOutcome,
    getLocomotorFacilityEligibility,
    computeLocomotorMechanicsAtPoint,
    deriveFiveDimensionStateAtPoint,
    buildLLMDecisionContext,
    buildFocusDecisionPlan,
    applyFocusDecisionPlanAtNode,
  };
});
