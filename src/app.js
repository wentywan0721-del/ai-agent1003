(() => {
  const Sim = window.PlanarSim;
  const InspectorUtils = window.InspectorUtils || {};
  const HEALTHY_AGENTS = Array.isArray(window.__HEALTHY_AGENTS__) ? window.__HEALTHY_AGENTS__ : [];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MAP_PADDING_RATIO = 0.07;
  const DEFAULT_HEAT_OPTIONS = { warmupSeconds: 48, warmupDt: 0.25 };
  const LOCAL_SIM_SERVER_ORIGIN = 'http://127.0.0.1:8891';
  const LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS = 15000;
  const LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS = 120000;
  const LOCAL_SIM_SERVER_JOB_POLL_INTERVAL_MS = 180;
  const LOCAL_SIM_SERVER_JOB_RETRY_LIMIT = 8;
  const LOCAL_SIM_SERVER_HEALTHCHECK_TIMEOUT_MS = 2500;
  const LOCAL_SIM_SERVER_HEALTHCHECK_INTERVAL_MS = 4000;
  const LOCAL_HEATMAP_PLAYBACK_SESSION_CACHE_LIMIT = 4;
  const PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND = 30;
  const HEAT_RASTER_SUPERSAMPLE = 4;
  const BACKGROUND_AGENT_INTERPOLATION_MAX_JUMP_METERS = 4.5;
  const DEFAULT_FILE_NAME = 'untitled';
  const DEFAULT_BACKGROUND_CROWD = 1595;
  const DEFAULT_BACKGROUND_RENDERER_MODE = 'webgl';
  const BACKGROUND_WEBGL_TRAJECTORY_CACHE_VERSION = 'packed-v1';
  const HEAT_TRACE_RADIUS_METERS = 3;
  const HEAT_NON_VITALITY_CORRIDOR_RADIUS_METERS = 3;
  const HEAT_SINGLE_BURDEN_SOFT_PEAK_POWER = 4;
  const HEAT_SINGLE_BURDEN_SOFT_PEAK_BLEND = 0.82;
  const HEAT_SINGLE_BURDEN_RELATIVE_LOW_QUANTILE = 0.08;
  const HEAT_SINGLE_BURDEN_RELATIVE_HIGH_QUANTILE = 0.92;
  const HEAT_SINGLE_BURDEN_ROUTE_BIN_METERS = 2.5;
  const HEAT_SINGLE_BURDEN_ROUTE_SMOOTH_BINS = 2;
  const HEAT_SINGLE_BURDEN_ROUTE_BLEND = 0.78;
  const HEAT_SINGLE_BURDEN_LOCAL_BASELINE_BINS = 8;
  const HEAT_SINGLE_BURDEN_LOCAL_BASELINE_RADIUS_METERS = 7.5;
  const HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR = 0.38;
  const HEAT_COMPOSITE_RELATIVE_LOW_QUANTILE = 0.06;
  const HEAT_COMPOSITE_RELATIVE_HIGH_QUANTILE = 0.94;
  const HEAT_TRACE_MIN_SEGMENT_DISTANCE = 0.08;
  const HEAT_VALUE_STOPS = [0, 10, 20, 35, 55, 80, 130];
  const REPORT_HIGH_HEAT_TOP_PERCENT = 0.2;
  const REPORT_DETAIL_HIGH_REGION_LIMIT = 3;
  const REPORT_BURDEN_LEVEL_STOPS = Object.freeze([
    { max: 20, color: '#264f87', zh: '低负担', en: 'Low burden' },
    { max: 40, color: '#4f9bb8', zh: '中低负担', en: 'Medium-low burden' },
    { max: 60, color: '#d8b74a', zh: '中等负担', en: 'Medium burden' },
    { max: 80, color: '#d76a52', zh: '中高负担', en: 'Medium-high burden' },
    { max: Number.POSITIVE_INFINITY, color: '#c84949', zh: '高负担', en: 'High burden' },
  ]);
  const VITALITY_RIBBON_MIN_WIDTH_METERS = 2;
  const VITALITY_RIBBON_MAX_WIDTH_METERS = 6;
  const LAYER_CATEGORY_DEFINITIONS = [
    { id: 'flashing-ads', label: 'flashing ads', color: '#256fbe', editable: true },
    { id: 'static-ads', label: 'Static ads', color: '#1faea5', editable: true },
    { id: 'ai-virtual-service-ambassador', label: 'AI virtual service ambassador', color: '#e6d87b', editable: false },
    { id: 'common-direction-signs', label: 'Common direction Signs', color: '#6f9f4c', editable: false },
    { id: 'customer-service-centre', label: 'Customer Service Centre', color: '#d1a14a', editable: false },
    { id: 'noise', label: 'Noise', color: '#d35367', editable: true },
    { id: 'hanging-signs', label: 'Hanging Signs', color: '#836cd4', editable: false },
    { id: 'lcd', label: 'LCD', color: '#5ea2cd', editable: false },
    { id: 'panoramic-guide-map', label: 'Panoramic guide map', color: '#6fb96b', editable: false },
    { id: 'seat', label: 'Seat', color: '#f39a27', editable: false },
  ];
  const DEFAULT_HEAT_COLOR_STOPS = [
    { stop: 0, rgb: [128, 0, 255] },
    { stop: 0.1667, rgb: [28, 104, 255] },
    { stop: 0.3333, rgb: [0, 196, 255] },
    { stop: 0.5, rgb: [54, 202, 91] },
    { stop: 0.6667, rgb: [255, 210, 0] },
    { stop: 0.8333, rgb: [255, 126, 0] },
    { stop: 1, rgb: [255, 0, 0] },
  ];
  const HEATMAP_VIEW_STYLES = Object.freeze({
    default: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: DEFAULT_HEAT_COLOR_STOPS,
      whiteMix: 0.08,
      blurScale: 0.28,
      legend: Object.freeze({
        titleZh: '热力图例',
        titleEn: 'Heatmap Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '颜色越热表示当前位置负担越高。',
        noteEn: 'Warmer color means a higher local burden.',
      }),
    }),
    locomotor: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [223, 231, 243] },
        { stop: 0.2, rgb: [181, 199, 234] },
        { stop: 0.4, rgb: [136, 168, 224] },
        { stop: 0.6, rgb: [90, 131, 213] },
        { stop: 0.8, rgb: [43, 92, 201] },
        { stop: 1, rgb: [0, 69, 188] },
      ],
      whiteMix: 0.01,
      blurScale: 0.26,
      legend: Object.freeze({
        titleZh: '行动负担图例',
        titleEn: 'Mobility Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '低热为浅灰蓝，高热为深蓝，颜色差距更清楚地表示行动阻力变化。',
        noteEn: 'Muted pale blue to deep blue separates low and high mobility resistance clearly.',
      }),
    }),
    sensory: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [245, 241, 214] },
        { stop: 0.18, rgb: [236, 225, 167] },
        { stop: 0.4, rgb: [227, 210, 121] },
        { stop: 0.62, rgb: [219, 194, 74] },
        { stop: 0.82, rgb: [214, 180, 32] },
        { stop: 1, rgb: [209, 167, 0] },
      ],
      whiteMix: 0.02,
      blurScale: 0.24,
      legend: Object.freeze({
        titleZh: '感知负担图例',
        titleEn: 'Sensory Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '低热为浅米黄，高热为深黄褐，明度差异更明显地表示感知负担。',
        noteEn: 'Muted pale yellow to deep ochre separates low and high sensory burden clearly.',
      }),
    }),
    cognitive: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [220, 232, 238] },
        { stop: 0.2, rgb: [176, 212, 224] },
        { stop: 0.4, rgb: [129, 191, 211] },
        { stop: 0.6, rgb: [83, 170, 199] },
        { stop: 0.8, rgb: [38, 149, 187] },
        { stop: 1, rgb: [3, 129, 175] },
      ],
      whiteMix: 0.015,
      blurScale: 0.24,
      legend: Object.freeze({
        titleZh: '决策负担图例',
        titleEn: 'Decision Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '低热为浅灰蓝，高热为深蓝，颜色差距更清楚地表示决策负担。',
        noteEn: 'Muted pale blue to deep blue separates low and high decision burden clearly.',
      }),
    }),
    psychological: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [242, 228, 214] },
        { stop: 0.2, rgb: [241, 204, 167] },
        { stop: 0.4, rgb: [240, 180, 120] },
        { stop: 0.6, rgb: [239, 155, 74] },
        { stop: 0.8, rgb: [238, 135, 32] },
        { stop: 1, rgb: [237, 119, 0] },
      ],
      whiteMix: 0.02,
      blurScale: 0.36,
      legend: Object.freeze({
        titleZh: '心理负担图例',
        titleEn: 'Psychological Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '低热为浅米橙，高热为深橙褐，明度差异更明显地表示心理负担。',
        noteEn: 'Muted pale orange to deep burnt orange separates low and high psychological burden clearly.',
      }),
    }),
    vitality: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [236, 220, 220] },
        { stop: 0.2, rgb: [228, 176, 176] },
        { stop: 0.4, rgb: [221, 132, 132] },
        { stop: 0.6, rgb: [213, 88, 88] },
        { stop: 0.8, rgb: [205, 44, 44] },
        { stop: 1, rgb: [197, 0, 0] },
      ],
      whiteMix: 0.015,
      blurScale: 0.22,
      legend: Object.freeze({
        titleZh: '疲劳负担图例',
        titleEn: 'Fatigue Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '低热为浅灰红，高热为深红，颜色差距更清楚地表示累积疲劳。',
        noteEn: 'Muted pale red to deep red separates low and high cumulative fatigue clearly.',
        widthTitleZh: '宽度变化',
        widthTitleEn: 'Width Cue',
        widthLowZh: '增长缓',
        widthLowEn: 'Slow Growth',
        widthHighZh: '增长快',
        widthHighEn: 'Fast Growth',
        widthNoteZh: '线越宽，表示该段疲劳增长越快。',
        widthNoteEn: 'Wider ribbon means faster local fatigue growth.',
      }),
    }),
    composite: Object.freeze({
      valueStops: HEAT_VALUE_STOPS,
      colorStops: [
        { stop: 0, rgb: [49, 54, 149] },
        { stop: 0.22, rgb: [69, 117, 180] },
        { stop: 0.42, rgb: [145, 191, 219] },
        { stop: 0.58, rgb: [254, 224, 144] },
        { stop: 0.78, rgb: [252, 141, 89] },
        { stop: 1, rgb: [215, 48, 39] },
      ],
      whiteMix: 0.01,
      blurScale: 0.28,
      legend: Object.freeze({
        titleZh: '综合负担图例',
        titleEn: 'Composite Burden Legend',
        lowZh: '低热',
        lowEn: 'Low',
        highZh: '高热',
        highEn: 'High',
        noteZh: '标准红到蓝渐变表示五项等权综合负担总览。',
        noteEn: 'A classic red-to-blue gradient marks the equal-weight composite burden overview.',
      }),
    }),
  });
  const FIVE_DIMENSION_ORDER = ['locomotor', 'sensory', 'cognitive', 'psychological', 'vitality'];
  const BURDEN_VIEW_ORDER = ['composite', ...FIVE_DIMENSION_ORDER];
  const COMPOSITE_BURDEN_VIEW = 'composite';

  if (!Sim) {
    throw new Error('PlanarSim is not available.');
  }

  const DEFAULT_CAPACITY_SCORES = {
    locomotor: 3,
    sensory: 3,
    cognitive: 3,
    psychological: 3,
    vitality: 3,
    ...(Sim.getUnifiedRules?.()?.scale?.defaultCapacityScores || {}),
  };

  function getEditableCapacityScores(rawScores) {
    return FIVE_DIMENSION_ORDER.reduce((scores, id) => {
      const value = Number(rawScores?.[id]);
      scores[id] = clamp(Math.round(Number.isFinite(value) ? value : DEFAULT_CAPACITY_SCORES[id]), 1, 5);
      return scores;
    }, {});
  }

  function getNormalizedCapacityScores(rawScores, profile = {}) {
    if (typeof Sim.normalizeCapacityScores === 'function') {
      return Sim.normalizeCapacityScores(rawScores, profile);
    }
    return getEditableCapacityScores(rawScores);
  }

  function createAgentDraft(profile = {}) {
    return {
      capacityScores: getEditableCapacityScores(profile.capacityScores, profile),
    };
  }

  function createFocusProfile(profile = {}) {
    return createAgentDraft(profile);
  }

  const AGENT_PREVIEW_DIMENSION_ORDER = ['cognitive', 'sensory', 'psychological', 'vitality', 'locomotor'];
  const AGENT_PREVIEW_SCORE_COLORS = Object.freeze({
    1: '#ea0027',
    2: '#ea8100',
    3: '#eadb00',
    4: '#00cfea',
    5: '#0062ea',
  });
  const AGENT_PREVIEW_POSE_SOURCES = Object.freeze({
    1: './assets/agent-poses/score-1-sheet.png',
    2: './assets/agent-poses/score-2-sheet.png',
    3: './assets/agent-poses/score-3-sheet.png',
    4: './assets/agent-poses/score-4-sheet.png',
    5: './assets/agent-poses/score-5-sheet.png',
  });
  const AGENT_PREVIEW_DISPLAY_SCALE_BY_SCORE = Object.freeze({
    1: 0.48,
    2: 0.86,
    3: 0.98,
    4: 1.02,
    5: 1.06,
  });
  const AGENT_PREVIEW_REFERENCE_DISPLAY_SCORE = 4;
  const AGENT_PREVIEW_REFERENCE_OPAQUE_HEIGHT = 63;
  const AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_X = 48;
  const AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_Y = 50;
  const AGENT_PREVIEW_DISPLAY_SHIFT_BY_SCORE = Object.freeze({
    1: Object.freeze({ x: 0, y: 0 }),
    2: Object.freeze({ x: 0, y: 0 }),
    3: Object.freeze({ x: 0, y: 0 }),
    4: Object.freeze({ x: 0, y: 0 }),
    5: Object.freeze({ x: 0, y: 0 }),
  });
  const AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES = Object.freeze({
    1: Object.freeze({ x: 1140, y: 720, width: 660, height: 690 }),
    2: Object.freeze({ x: 560, y: 708, width: 500, height: 700 }),
    3: Object.freeze({ x: 1260, y: 34, width: 370, height: 700 }),
    4: Object.freeze({ x: 870, y: 34, width: 340, height: 700 }),
    5: Object.freeze({ x: 410, y: 34, width: 430, height: 700 }),
  });
  const AGENT_PREVIEW_POSE_CROP_FRAMES = Object.freeze({
    1: Object.freeze({ x: 1140, y: 720, width: 660, height: 690 }),
    2: Object.freeze({ x: 560, y: 708, width: 500, height: 700 }),
    3: Object.freeze({ x: 1260, y: 34, width: 370, height: 700 }),
    4: Object.freeze({ x: 870, y: 34, width: 340, height: 700 }),
    5: Object.freeze({ x: 410, y: 34, width: 430, height: 700 }),
  });
  const AGENT_PREVIEW_CONNECTOR_OFFSET_OVERRIDES = Object.freeze({
    cognitive: Object.freeze({ x: 0, y: 0 }),
    sensory: Object.freeze({ x: 0, y: 0 }),
    psychological: Object.freeze({ x: 8, y: 0 }),
    vitality: Object.freeze({ x: 10, y: 0 }),
    locomotor: Object.freeze({ x: 12, y: 0 }),
  });
  const AGENT_PREVIEW_CONNECTOR_GLOBAL_SHIFT = Object.freeze({ x: 0, y: 0 });
  const AGENT_PREVIEW_CONNECTOR_END_SHIFT_PX = 0;
  const AGENT_PREVIEW_CONNECTOR_START_SHIFT_BY_SCORE_AND_DIMENSION = Object.freeze({
    3: Object.freeze({ locomotor: 24, }),
    4: Object.freeze({ locomotor: 28, }),
    5: Object.freeze({ locomotor: 32, }),
  });
  const AGENT_PREVIEW_CONNECTOR_CARD_OVERLAP_PX = 44;
  const AGENT_PREVIEW_CONNECTOR_CANVAS_SHIFT_PX = 20;
  const AGENT_PREVIEW_CONNECTOR_START_X_OFFSETS_PX = Object.freeze({
    cognitive: 15,
    sensory: 15,
    psychological: 0,
    vitality: 0,
    locomotor: 15,
  });
  const AGENT_PREVIEW_CONNECTOR_START_X_SCORE_OFFSETS_PX = Object.freeze({
    1: Object.freeze({ locomotor: 12, }),
    2: Object.freeze({ locomotor: 16, }),
    3: Object.freeze({ locomotor: 18, }),
    4: Object.freeze({ locomotor: 18, }),
    5: Object.freeze({ locomotor: 20, }),
  });
  const AGENT_PREVIEW_CONNECTOR_START_Y_OFFSETS_PX = Object.freeze({
    cognitive: 15,
    sensory: 15,
    psychological: 0,
    vitality: 0,
    locomotor: 0,
  });

  function createAgentPreviewEllipse(cx, cy, rx, ry) {
    return Object.freeze({ type: 'ellipse', cx, cy, rx, ry });
  }

  function createAgentPreviewRect(x, y, width, height, radius = 0) {
    return Object.freeze({ type: 'rect', x, y, width, height, radius });
  }

  function createAgentPreviewPoint(x, y) {
    return Object.freeze({ x, y });
  }

  function createAgentPreviewRegionSeedGroup(seeds) {
    return Object.freeze({
      seeds: Object.freeze(seeds.map(([x, y]) => createAgentPreviewPoint(x, y))),
    });
  }

  const AGENT_PREVIEW_POSE_METADATA = Object.freeze({
    1: Object.freeze({
      score: 1,
      sourceSearchBox: AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES[1],
      cropFrame: AGENT_PREVIEW_POSE_CROP_FRAMES[1],
      connectorAnchors: Object.freeze({
        cognitive: Object.freeze({ x: 56, y: 18 }),
        sensory: Object.freeze({ x: 62, y: 22 }),
        psychological: Object.freeze({ x: 58, y: 41 }),
        vitality: Object.freeze({ x: 52, y: 56 }),
        locomotor: Object.freeze({ x: 72, y: 82 }),
      }),
      regionComponents: Object.freeze({
        cognitive: createAgentPreviewRegionSeedGroup([[195, 74]]),
        sensory: createAgentPreviewRegionSeedGroup([[239, 99]]),
        psychological: createAgentPreviewRegionSeedGroup([[237, 195], [274, 166], [270, 199]]),
        vitality: createAgentPreviewRegionSeedGroup([[197, 296], [160, 312], [265, 324], [164, 276]]),
        locomotor: createAgentPreviewRegionSeedGroup([[247, 482], [450, 371], [463, 498], [546, 521], [534, 527]]),
      }),
      regionFragmentSeeds: Object.freeze({
        vitality: createAgentPreviewRegionSeedGroup([[313, 278]]),
      }),
      regionTargets: Object.freeze({
        cognitive: Object.freeze({ x: 29.5, y: 10.7 }),
        sensory: Object.freeze({ x: 36.2, y: 14.3 }),
        psychological: Object.freeze({ x: 38.7, y: 26.2 }),
        vitality: Object.freeze({ x: 38.4, y: 39.5 }),
        locomotor: Object.freeze({
          points: Object.freeze([
            Object.freeze({ x: 67.5, y: 68.5 }),
            Object.freeze({ x: 74.5, y: 76.5 }),
          ]),
          maxComponents: 2,
        }),
      }),
      regionMasks: Object.freeze({
        cognitive: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(56, 16, 10, 8),
            createAgentPreviewEllipse(50, 16, 7, 5),
          ]),
        }),
        sensory: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(62, 22, 7, 6),
            createAgentPreviewEllipse(67, 25, 5, 4),
          ]),
        }),
        psychological: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(256, 195, 42, 40),
            createAgentPreviewEllipse(274, 168, 25, 22),
          ]),
        }),
        vitality: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(142, 254, 200, 86, 12),
            createAgentPreviewRect(145, 256, 42, 56, 8),
            createAgentPreviewRect(300, 256, 30, 40, 6),
          ]),
        }),
        locomotor: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(58, 58, 34, 30, 8),
            createAgentPreviewEllipse(78, 86, 14, 8),
          ]),
        }),
      }),
    }),
    2: Object.freeze({
      score: 2,
      sourceSearchBox: AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES[2],
      cropFrame: AGENT_PREVIEW_POSE_CROP_FRAMES[2],
      connectorAnchors: Object.freeze({
        cognitive: Object.freeze({ x: 53, y: 12 }),
        sensory: Object.freeze({ x: 59, y: 17 }),
        psychological: Object.freeze({ x: 55, y: 34 }),
        vitality: Object.freeze({ x: 48, y: 54 }),
        locomotor: Object.freeze({ x: 46, y: 86 }),
      }),
      regionComponents: Object.freeze({
        cognitive: createAgentPreviewRegionSeedGroup([[313, 68]]),
        sensory: createAgentPreviewRegionSeedGroup([[312, 114]]),
        psychological: createAgentPreviewRegionSeedGroup([[245, 199], [302, 197], [277, 199], [268, 203]]),
        vitality: createAgentPreviewRegionSeedGroup([[168, 294], [215, 316], [252, 356]]),
        locomotor: createAgentPreviewRegionSeedGroup([[155, 508], [206, 520], [160, 630], [217, 619], [237, 631], [120, 620]]),
      }),
      regionFragmentSeeds: Object.freeze({
        psychological: createAgentPreviewRegionSeedGroup([[287, 197]]),
        vitality: createAgentPreviewRegionSeedGroup([[274, 304], [263, 342]]),
        locomotor: createAgentPreviewRegionSeedGroup([[224, 632], [196, 608]]),
      }),
      regionTargets: Object.freeze({
        cognitive: Object.freeze({ x: 62.6, y: 9.7 }),
        sensory: Object.freeze({ x: 62.4, y: 16.3 }),
        psychological: Object.freeze({ x: 49.1, y: 28.4 }),
        vitality: Object.freeze({ x: 33.7, y: 42.0 }),
        locomotor: Object.freeze({
          points: Object.freeze([
            Object.freeze({ x: 31.0, y: 72.6 }),
            Object.freeze({ x: 41.2, y: 74.3 }),
          ]),
          maxComponents: 2,
        }),
      }),
      regionMasks: Object.freeze({
        cognitive: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(53, 12, 10, 8),
            createAgentPreviewEllipse(47, 12, 6, 5),
          ]),
        }),
        sensory: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(59, 17, 7, 6),
            createAgentPreviewEllipse(63, 21, 5, 4),
          ]),
        }),
        psychological: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(275, 199, 43, 42),
            createAgentPreviewEllipse(247, 198, 24, 34),
          ]),
        }),
        vitality: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(87, 190, 178, 194, 12),
            createAgentPreviewRect(258, 286, 28, 78, 6),
          ]),
        }),
        locomotor: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(34, 74, 24, 24, 8),
            createAgentPreviewRect(54, 44, 26, 32, 8),
          ]),
        }),
      }),
    }),
    3: Object.freeze({
      score: 3,
      sourceSearchBox: AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES[3],
      cropFrame: AGENT_PREVIEW_POSE_CROP_FRAMES[3],
      connectorAnchors: Object.freeze({
        cognitive: Object.freeze({ x: 56, y: 10 }),
        sensory: Object.freeze({ x: 61, y: 16 }),
        psychological: Object.freeze({ x: 58, y: 31 }),
        vitality: Object.freeze({ x: 47, y: 47 }),
        locomotor: Object.freeze({ x: 49, y: 79 }),
      }),
      regionComponents: Object.freeze({
        cognitive: createAgentPreviewRegionSeedGroup([[244, 63]]),
        sensory: createAgentPreviewRegionSeedGroup([[274, 91]]),
        psychological: createAgentPreviewRegionSeedGroup([[231, 196], [257, 229], [285, 191], [251, 244]]),
        vitality: createAgentPreviewRegionSeedGroup([[182, 318], [162, 222], [212, 378], [161, 371]]),
        locomotor: createAgentPreviewRegionSeedGroup([[162, 506], [235, 535], [112, 616], [83, 593], [280, 627], [100, 580]]),
      }),
      regionFragmentSeeds: Object.freeze({
        vitality: createAgentPreviewRegionSeedGroup([[133, 361], [143, 359], [222, 330], [274, 300]]),
        locomotor: createAgentPreviewRegionSeedGroup([[250, 641], [249, 632]]),
      }),
      regionTargets: Object.freeze({
        cognitive: Object.freeze({ x: 65.9, y: 9.1 }),
        sensory: Object.freeze({ x: 74.0, y: 13.0 }),
        psychological: Object.freeze({ x: 62.5, y: 28.1 }),
        vitality: Object.freeze({ x: 49.2, y: 45.4 }),
        locomotor: Object.freeze({
          points: Object.freeze([
            Object.freeze({ x: 43.9, y: 72.2 }),
            Object.freeze({ x: 63.6, y: 76.4 }),
          ]),
          maxComponents: 2,
        }),
      }),
      regionMasks: Object.freeze({
        cognitive: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(56, 10, 10, 8),
            createAgentPreviewEllipse(50, 10, 6, 5),
          ]),
        }),
        sensory: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(61, 16, 7, 6),
            createAgentPreviewEllipse(65, 20, 5, 4),
          ]),
        }),
        psychological: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(258, 203, 47, 48),
            createAgentPreviewEllipse(284, 192, 22, 26),
          ]),
        }),
        vitality: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(124, 230, 151, 154, 12),
            createAgentPreviewRect(252, 230, 30, 94, 6),
            createAgentPreviewRect(214, 321, 18, 20, 4),
          ]),
        }),
        locomotor: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(38, 56, 18, 34, 8),
            createAgentPreviewRect(53, 52, 16, 38, 8),
          ]),
        }),
      }),
    }),
    4: Object.freeze({
      score: 4,
      sourceSearchBox: AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES[4],
      cropFrame: AGENT_PREVIEW_POSE_CROP_FRAMES[4],
      connectorAnchors: Object.freeze({
        cognitive: Object.freeze({ x: 56, y: 10 }),
        sensory: Object.freeze({ x: 61, y: 17 }),
        psychological: Object.freeze({ x: 57, y: 31 }),
        vitality: Object.freeze({ x: 47, y: 44 }),
        locomotor: Object.freeze({ x: 46, y: 76 }),
      }),
      regionComponents: Object.freeze({
        cognitive: createAgentPreviewRegionSeedGroup([[224, 63]]),
        sensory: createAgentPreviewRegionSeedGroup([[254, 91]]),
        psychological: createAgentPreviewRegionSeedGroup([[211, 199], [237, 229], [264, 195], [251, 244]]),
        vitality: createAgentPreviewRegionSeedGroup([[162, 317], [142, 222], [192, 377], [142, 370]]),
        locomotor: createAgentPreviewRegionSeedGroup([[142, 505], [215, 534], [92, 615], [63, 592], [260, 626], [229, 631]]),
      }),
      regionFragmentSeeds: Object.freeze({
        vitality: createAgentPreviewRegionSeedGroup([[113, 358], [123, 360], [201, 329], [255, 300]]),
        locomotor: createAgentPreviewRegionSeedGroup([[81, 579], [230, 640]]),
      }),
      regionTargets: Object.freeze({
        cognitive: Object.freeze({ x: 65.9, y: 9.0 }),
        sensory: Object.freeze({ x: 74.6, y: 13.0 }),
        psychological: Object.freeze({ x: 62.1, y: 28.4 }),
        vitality: Object.freeze({ x: 47.7, y: 45.3 }),
        locomotor: Object.freeze({
          points: Object.freeze([
            Object.freeze({ x: 41.8, y: 72.1 }),
            Object.freeze({ x: 63.3, y: 76.3 }),
          ]),
          maxComponents: 2,
        }),
      }),
      regionMasks: Object.freeze({
        cognitive: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(56, 10, 10, 8),
            createAgentPreviewEllipse(50, 10, 6, 5),
          ]),
        }),
        sensory: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(61, 17, 7, 6),
            createAgentPreviewEllipse(65, 21, 5, 4),
          ]),
        }),
        psychological: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(239, 201, 47, 48),
            createAgentPreviewEllipse(264, 195, 22, 26),
          ]),
        }),
        vitality: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(104, 229, 152, 156, 12),
            createAgentPreviewRect(252, 228, 18, 92, 6),
            createAgentPreviewRect(194, 321, 18, 20, 4),
          ]),
        }),
        locomotor: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(37, 54, 18, 34, 8),
            createAgentPreviewRect(53, 51, 15, 38, 8),
          ]),
        }),
      }),
    }),
    5: Object.freeze({
      score: 5,
      sourceSearchBox: AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES[5],
      cropFrame: AGENT_PREVIEW_POSE_CROP_FRAMES[5],
      connectorAnchors: Object.freeze({
        cognitive: Object.freeze({ x: 56, y: 11 }),
        sensory: Object.freeze({ x: 61, y: 17 }),
        psychological: Object.freeze({ x: 57, y: 32 }),
        vitality: Object.freeze({ x: 44, y: 44 }),
        locomotor: Object.freeze({ x: 39, y: 77 }),
      }),
      regionComponents: Object.freeze({
        cognitive: createAgentPreviewRegionSeedGroup([[257, 62]]),
        sensory: createAgentPreviewRegionSeedGroup([[286, 93]]),
        psychological: createAgentPreviewRegionSeedGroup([[255, 202], [304, 192], [284, 227]]),
        vitality: createAgentPreviewRegionSeedGroup([[184, 316], [185, 224], [190, 375], [236, 380]]),
        locomotor: createAgentPreviewRegionSeedGroup([[158, 505], [283, 526], [79, 610], [338, 633], [59, 568], [314, 632]]),
      }),
      regionFragmentSeeds: Object.freeze({
        psychological: createAgentPreviewRegionSeedGroup([[294, 244], [211, 248]]),
        vitality: createAgentPreviewRegionSeedGroup([[166, 362], [249, 313], [309, 295]]),
        locomotor: createAgentPreviewRegionSeedGroup([[308, 637], [336, 628], [56, 588]]),
      }),
      regionTargets: Object.freeze({
        cognitive: Object.freeze({ x: 59.7, y: 8.8 }),
        sensory: Object.freeze({ x: 66.5, y: 13.2 }),
        psychological: Object.freeze({ x: 59.2, y: 28.8 }),
        vitality: Object.freeze({ x: 47.3, y: 45.2 }),
        locomotor: Object.freeze({
          points: Object.freeze([
            Object.freeze({ x: 36.8, y: 72.1 }),
            Object.freeze({ x: 65.8, y: 75.2 }),
          ]),
          maxComponents: 2,
        }),
      }),
      regionMasks: Object.freeze({
        cognitive: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(56, 11, 10, 8),
            createAgentPreviewEllipse(50, 11, 6, 5),
          ]),
        }),
        sensory: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(61, 17, 7, 6),
            createAgentPreviewEllipse(65, 20, 5, 4),
          ]),
        }),
        psychological: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewEllipse(279, 203, 48, 48),
            createAgentPreviewRect(204, 220, 22, 52, 6),
          ]),
        }),
        vitality: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(142, 231, 156, 156, 12),
            createAgentPreviewRect(225, 274, 58, 68, 8),
            createAgentPreviewRect(305, 252, 12, 74, 4),
          ]),
        }),
        locomotor: Object.freeze({
          shapes: Object.freeze([
            createAgentPreviewRect(22, 54, 22, 34, 8),
            createAgentPreviewRect(43, 50, 16, 41, 8),
          ]),
        }),
      }),
    }),
  });
  const agentPreviewImageCache = new Map();
  const agentPreviewPoseGeometryAnchorCache = new Map();
  const agentPreviewChromaticComponentCache = new Map();

  function getSafeViewMode(viewMode) {
    return BURDEN_VIEW_ORDER.includes(viewMode) ? viewMode : 'cognitive';
  }

  function createDefaultReportModalState() {
    return {
      open: false,
      exporting: false,
      status: '',
      error: '',
      data: null,
      documentHtml: '',
      fileName: 'route-report.html',
      exportFormat: 'html',
      languageMenuOpen: false,
      formatMenuOpen: false,
      llmAnalysis: null,
      llmAnalysisPending: false,
      llmAnalysisPromise: null,
      llmAnalysisKey: '',
      llmAnalysisRequestKey: '',
      suppressNextReportLanguageTriggerClick: false,
      suppressNextReportLanguageMenuClick: false,
      suppressNextReportFormatTriggerClick: false,
      suppressNextReportFormatMenuClick: false,
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function smoothstep(minimum, maximum, value) {
    if (Math.abs(maximum - minimum) <= 1e-9) {
      return value >= maximum ? 1 : 0;
    }
    const amount = clamp((value - minimum) / (maximum - minimum), 0, 1);
    return amount * amount * (3 - 2 * amount);
  }

  function applySingleBurdenRelativeDisplayCurve(normalized) {
    const amount = clamp(Number(normalized) || 0, 0, 1);
    const steepness = 7.2;
    const logistic = 1 / (1 + Math.exp(-steepness * (amount - 0.5)));
    const low = 1 / (1 + Math.exp(steepness * 0.5));
    const high = 1 / (1 + Math.exp(-steepness * 0.5));
    return clamp((logistic - low) / Math.max(1e-6, high - low), 0, 1);
  }

  function applyCompositeRelativeDisplayCurve(normalized) {
    const amount = clamp(Number(normalized) || 0, 0, 1);
    return amount;
  }

  function buildSingleBurdenRouteSequenceProfile(cells) {
    const routeCells = Array.isArray(cells)
      ? cells.filter((cell) => Number.isFinite(Number(cell?.traceProgressMeters)) && Number.isFinite(Number(cell?.metric)))
      : [];
    if (routeCells.length < 4) {
      return null;
    }
    const binSize = HEAT_SINGLE_BURDEN_ROUTE_BIN_METERS;
    const maxProgress = routeCells.reduce((maximum, cell) => Math.max(maximum, Number(cell.traceProgressMeters || 0)), 0);
    const binCount = Math.max(1, Math.ceil(maxProgress / binSize) + 1);
    const sums = new Float64Array(binCount);
    const weights = new Float64Array(binCount);
    routeCells.forEach((cell) => {
      const binIndex = clamp(Math.round(Number(cell.traceProgressMeters || 0) / binSize), 0, binCount - 1);
      const weight = Math.max(0.001, Number(cell.revealWeight || 1));
      sums[binIndex] += Number(cell.metric || 0) * weight;
      weights[binIndex] += weight;
    });
    const rawBins = Array.from({ length: binCount }, (_, index) => (
      weights[index] > 1e-6 ? sums[index] / weights[index] : Number.NaN
    ));
    let lastKnown = Number.NaN;
    for (let index = 0; index < rawBins.length; index += 1) {
      if (Number.isFinite(rawBins[index])) {
        lastKnown = rawBins[index];
      } else if (Number.isFinite(lastKnown)) {
        rawBins[index] = lastKnown;
      }
    }
    let nextKnown = Number.NaN;
    for (let index = rawBins.length - 1; index >= 0; index -= 1) {
      if (Number.isFinite(rawBins[index])) {
        nextKnown = rawBins[index];
      } else if (Number.isFinite(nextKnown)) {
        rawBins[index] = nextKnown;
      }
    }
    const smoothedBins = rawBins.map((value, index) => {
      let weightedSum = 0;
      let weightSum = 0;
      for (
        let neighbor = Math.max(0, index - HEAT_SINGLE_BURDEN_ROUTE_SMOOTH_BINS);
        neighbor <= Math.min(rawBins.length - 1, index + HEAT_SINGLE_BURDEN_ROUTE_SMOOTH_BINS);
        neighbor += 1
      ) {
        const neighborValue = rawBins[neighbor];
        if (!Number.isFinite(neighborValue)) {
          continue;
        }
        const distance = Math.abs(neighbor - index);
        const weight = 1 / (1 + distance);
        weightedSum += neighborValue * weight;
        weightSum += weight;
      }
      return weightSum > 1e-6 ? weightedSum / weightSum : value;
    });
    const baselineBins = smoothedBins.map((value, index) => {
      let weightedSum = 0;
      let weightSum = 0;
      for (
        let neighbor = Math.max(0, index - HEAT_SINGLE_BURDEN_LOCAL_BASELINE_BINS);
        neighbor <= Math.min(smoothedBins.length - 1, index + HEAT_SINGLE_BURDEN_LOCAL_BASELINE_BINS);
        neighbor += 1
      ) {
        const neighborValue = smoothedBins[neighbor];
        if (!Number.isFinite(neighborValue)) {
          continue;
        }
        const distance = Math.abs(neighbor - index);
        const weight = 1 / (1 + distance * 0.45);
        weightedSum += neighborValue * weight;
        weightSum += weight;
      }
      return weightSum > 1e-6 ? weightedSum / weightSum : value;
    });
    const localDeltas = smoothedBins.map((value, index) => Math.max(0, value - baselineBins[index]));
    const sortedDeltas = getSortedNumericValues(localDeltas);
    const deltaHigh = sortedDeltas.length ? sampleQuantile(sortedDeltas, 0.9) : 0;
    const prominenceBins = localDeltas.map((delta) => {
      if (deltaHigh <= 1e-6) {
        return 0;
      }
      return smoothstep(0, deltaHigh, delta);
    });
    const sortedValues = getSortedNumericValues(smoothedBins);
    if (sortedValues.length < 2) {
      return null;
    }
    const minimum = sampleQuantile(sortedValues, HEAT_SINGLE_BURDEN_RELATIVE_LOW_QUANTILE);
    const maximum = sampleQuantile(sortedValues, HEAT_SINGLE_BURDEN_RELATIVE_HIGH_QUANTILE);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum + 1e-6) {
      return null;
    }
    return {
      binSize,
      smoothedBins,
      baselineBins,
      prominenceBins,
      minimum,
      maximum,
    };
  }

  function getSingleBurdenRouteDisplayNormalized(metric, routeSequenceProfile, fallbackNormalized, traceProgressMeters) {
    const fallback = clamp(Number(fallbackNormalized) || 0, 0, 1);
    if (!routeSequenceProfile || !Number.isFinite(Number(traceProgressMeters))) {
      return applySingleBurdenRelativeDisplayCurve(fallback);
    }
    const bins = routeSequenceProfile.smoothedBins || [];
    if (!bins.length) {
      return applySingleBurdenRelativeDisplayCurve(fallback);
    }
    const position = clamp(Number(traceProgressMeters || 0) / Math.max(1e-6, routeSequenceProfile.binSize), 0, bins.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(bins.length - 1, leftIndex + 1);
    const ratio = position - leftIndex;
    const leftValue = Number.isFinite(Number(bins[leftIndex])) ? Number(bins[leftIndex]) : Number(metric || 0);
    const rightValue = Number.isFinite(Number(bins[rightIndex])) ? Number(bins[rightIndex]) : leftValue;
    const routeValue = leftValue + (rightValue - leftValue) * ratio;
    const routeNormalized = clamp(
      (routeValue - routeSequenceProfile.minimum) / Math.max(1e-6, routeSequenceProfile.maximum - routeSequenceProfile.minimum),
      0,
      1
    );
    const blended = fallback * (1 - HEAT_SINGLE_BURDEN_ROUTE_BLEND) + routeNormalized * HEAT_SINGLE_BURDEN_ROUTE_BLEND;
    return applySingleBurdenRelativeDisplayCurve(blended);
  }

  function getSingleBurdenLocalProminence(routeSequenceProfile, traceProgressMeters) {
    if (!routeSequenceProfile || !Number.isFinite(Number(traceProgressMeters))) {
      return 1;
    }
    const bins = routeSequenceProfile.prominenceBins || [];
    if (!bins.length) {
      return 1;
    }
    const position = clamp(Number(traceProgressMeters || 0) / Math.max(1e-6, routeSequenceProfile.binSize), 0, bins.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(bins.length - 1, leftIndex + 1);
    const ratio = position - leftIndex;
    const leftValue = Number.isFinite(Number(bins[leftIndex])) ? Number(bins[leftIndex]) : 0;
    const rightValue = Number.isFinite(Number(bins[rightIndex])) ? Number(bins[rightIndex]) : leftValue;
    return clamp(leftValue + (rightValue - leftValue) * ratio, 0, 1);
  }

  function annotateSingleBurdenCellProminence(cells) {
    const sourceCells = Array.isArray(cells) ? cells : [];
    if (sourceCells.length < 4) {
      return sourceCells.map((cell) => ({ ...cell, localProminence: 1 }));
    }
    const radius = HEAT_SINGLE_BURDEN_LOCAL_BASELINE_RADIUS_METERS;
    const radiusSquared = radius * radius;
    const sigma = Math.max(1, radius * 0.52);
    const annotated = sourceCells.map((cell, cellIndex) => {
      const metric = Number(cell.metric ?? cell.pressure ?? 0) || 0;
      let weightedSum = 0;
      let weightSum = 0;
      sourceCells.forEach((neighbor, neighborIndex) => {
        if (neighborIndex === cellIndex) {
          return;
        }
        const dx = Number(neighbor.x || 0) - Number(cell.x || 0);
        const dy = Number(neighbor.y || 0) - Number(cell.y || 0);
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > radiusSquared) {
          return;
        }
        const weight = Math.exp(-distanceSquared / Math.max(1e-6, 2 * sigma * sigma));
        weightedSum += (Number(neighbor.metric ?? neighbor.pressure ?? 0) || 0) * weight;
        weightSum += weight;
      });
      const localBaseline = weightSum > 1e-6 ? weightedSum / weightSum : metric;
      return {
        ...cell,
        localDelta: Math.max(0, metric - localBaseline),
      };
    });
    const sortedDeltas = getSortedNumericValues(annotated.map((cell) => Number(cell.localDelta || 0)));
    const highDelta = sortedDeltas.length ? sampleQuantile(sortedDeltas, 0.88) : 0;
    return annotated.map((cell) => ({
      ...cell,
      localProminence: highDelta > 1e-6
        ? smoothstep(0, highDelta, Number(cell.localDelta || 0))
        : 0,
    }));
  }

  const TEXT = {
    'zh-CN': {
      app: { title: '中环站空间评估器', productName: '认知负荷模拟器' },
      landing: {
        tag: '智能城市出行分析',
        titleLine1: '老人出行负担',
        titleLine2: '智能分析平台',
        description: '基于五维属性模型，结合热力图可视化与链式分析，对老年人在地铁站内的多维出行负担进行量化评估。',
        start: '开始分析',
      },
      settings: {
        backHome: '返回首页',
        section: 'Section 01',
        title: '路线设置',
        uploadTitle: '数据导入与路线设置',
        uploadHint: '点击导入 sim.json 模型文件',
        uploadFormats: '支持 .json / .sim.json',
        routeSettingsTitle: '路线设置',
        originLabel: '起点',
        destinationLabel: '终点',
        crowdLabel: '背景人流（人/小时）',
        nextBtn: '设置代理人属性',
        analyzeBtn: '开始分析',
        radarTitle: '五维雷达图',
        radarHint: '拖动顶点即可调整五维分值',
      },
      spatialEditor: {
        entryTitle: '编辑空间模型',
        entryHint: '调整边界、节点与压力点参数',
        eyebrow: '空间模型',
        title: '空间模型编辑',
        back: '返回路线设置',
        modeTitle: '编辑模式',
        toolSelect: '选择',
        toolBoundary: '边界编辑',
        toolNode: 'Node 编辑',
        toolPressure: '压力点编辑',
        objectTitle: '对象属性',
        objectName: '选中对象名称',
        objectCoord: '坐标',
        objectType: '类型',
        paramNoise: '噪音',
        paramLight: '光照',
        paramAds: '广告干扰',
        paramSignage: '标识影响',
        versionTitle: '版本与结果',
        saveCurrent: '保存当前方案',
        saveAs: '另存为新方案',
        viewHistory: '查看历史模拟结果',
        libraryTitle: '方案结果库',
        libraryItemA: '方案 A · 闸机至乘车点',
        libraryMetaA: '500 人流 · 均衡画像 · 02:18',
        libraryItemB: '方案 B · 出口 C 换乘',
        libraryMetaB: '1000 人流 · 低行动能力 · 06:42',
        libraryItemC: '方案 C · 标识优化',
        libraryMetaC: '1500 人流 · 感知敏感 · 04:10',
        openHeatmap: '直接打开历史热力图',
        copyScheme: '复制为新方案',
        toolbarSelect: '选择',
        toolbarMove: '移动',
        toolbarAddPressure: '新增压力点',
        toolbarDelete: '删除',
        toolbarUndo: '撤销',
        toolbarReset: '重置',
        returnSettings: '返回路线设置',
        saveChanges: '保存修改',
        simulateCurrent: '基于当前方案开始模拟',
        statusIdle: '概念展示模式：修改仅在当前页面预览，不写入后台模型。',
        statusSave: '当前方案已在前端预览中标记为已保存。',
        statusSaveAs: '已创建一个新的前端方案副本。',
        statusHistory: '已切换到方案结果库，可打开或复制历史热力图方案。',
        statusOpenHeatmap: '已选择历史热力图预览入口，后台接入后可直接打开。',
        statusCopyScheme: '已复制历史方案为新的编辑草案。',
        statusSimulate: '已选择基于当前方案开始模拟，当前阶段不提交后台计算。',
        statusUndo: '已撤销最近一次前端演示操作。',
        statusReset: '地图对象已重置为演示初始状态。',
      },
      loading: {
        section: 'Section 02',
        title: '正在准备可视化分析',
        description: '系统正在为当前路线生成背景人流并计算六张热力图。',
        preparing: '准备分析中',
        statusReady: '背景人流已生成，正在请求热力图计算。',
        statusComputing: '正在计算热力图，请稍候。',
        statusDone: '热力图计算完成，正在进入可视化页面。',
        stage: {
          bootstrap: '正在初始化本地仿真任务。',
          backgroundPrepare: '正在准备可复用背景人流场。',
          background: '正在生成或读取背景人流场。',
          focusPrepare: '正在准备重点代理人路线。',
          focusReady: '背景场已就绪，正在计算重点代理人。',
          focus: '正在计算重点代理人路径与热力图。',
          llmDecision: '正在生成代理人决策链。',
        },
      },
      agentSettings: {
        section: 'Section 02',
        title: '代理人属性设置',
        back: '返回路线设置',
      },
      visualization: {
        section: 'Section 03',
        title: '可视化总览',
        detailSection: 'Section 04',
        detailTitle: '路径详细诊断',
        back: '返回上一级',
        description: '六个视角同时展示老人站内出行负担的空间分布。',
        compositeTag: '综合',
        compositeTitle: '综合负担热力图',
        compositeCopy: '综合展示五维负担在整条路线上的空间叠加结果，用于快速总览主要压力带。',
        locomotorTag: '行动',
        locomotorTitle: '行动负担热力图',
        locomotorCopy: '展示步行距离、竖向转换与排队造成的行动阻力分布。',
        sensoryTag: '感知',
        sensoryTitle: '感知负担热力图',
        sensoryCopy: '展示光照、噪音、可见距离与标识辨识条件带来的感知压力分布。',
        cognitiveTag: '认知',
        cognitiveTitle: '决策负担热力图',
        cognitiveCopy: '展示寻路、标识连续性与换乘决策造成的认知压力分布。',
        psychologicalTag: '心理',
        psychologicalTitle: '心理负担热力图',
        psychologicalCopy: '展示不确定性、拥挤压力与安全感下降导致的心理负担热点。',
        vitalityTag: '活力',
        vitalityTitle: '疲劳负担热力图',
        vitalityCopy: '展示沿路径累积疲劳增长最快的区段，以及恢复需求升高的位置。',
        environmentEyebrow: '环境参数',
        environmentTitle: '实时环境参数',
        statusEyebrow: '状态监测',
        statusTitle: '老人状态监测',
        radarEyebrow: '能力雷达',
        radarTitle: '老人能力雷达',
        feedbackEyebrow: '负担反馈',
        feedbackTitle: '实时负担反馈',
        detailRadarTitle: '代理人属性',
        detailStatusTitle: '代理人状态',
        detailFeedbackTitle: '实时负担',
        exportReport: '导出分析报告',
        min: '最小值',
        max: '最大值',
        minBurden: '最小负担',
        maxBurden: '最大负担',
        currentBurden: '当前负担',
        congestion: '拥堵情况',
        motionState: '行动状态',
        mainResistance: '主要阻力',
        speedFactor: '速度倍率',
        detailLayerFilter: '压力点图层',
        detailLayerAll: '全部压力点图层',
        detailCotTitle: '代理人决策链',
        detailIssuesTitle: '关键问题与优化建议',
        detailHotspotsTitle: '关键问题点',
        detailRecommendationsTitle: '优化建议',
        detailActiveView: '当前视图',
        detailPeakDimension: '峰值维度',
        detailRiskLevel: '风险等级',
        detailNoIssues: '当前暂无突出的关键问题点。',
      },
      section: { import: '模型导入', route: '评估路线', agent: '代理人设置' },
      button: {
        importLocal: '导入本地文件',
        pickRoute: '选择路线',
        agentSettings: '设置代理人',
        generateCrowd: '生成人流',
        crowdGenerated: '人流已生成',
        runHeatmap: '运行热力图',
        heatmapComputing: '热力图计算中',
        rerunHeatmap: '刷新热力图',
        showFinalHeatmap: '显示最终热力图',
        showPlaybackHeatmap: '返回动态热力图',
        exportReport: '导出报告',
        exportHtml: '导出 HTML',
        close: '关闭',
        clear: '清除',
        confirm: '确定',
        reset: '复原',
      },
      label: {
        route: '路线模式',
        start: '起点',
        end: '终点',
        targetRegion: '目标区域',
        crowdPreset: '人流设置',
        backgroundCrowd: '背景人流',
        routeSelected: '当前目标',
        modelSource: '文件来源',
        simultaneousCount: '同时在场人数',
        crowdDensity: '拥挤密度',
        travelTime: '通行时间',
        minimumHeat: '最低热度',
        maximumHeat: '最高热度',
        activePressureCount: '环境压力源',
        averageTravelTime: '平均通行时间',
        averageFatigue: '平均疲劳',
        averageHeat: '平均热度',
        category: '类别',
        type: '对象类型',
        kind: '节点类型',
        feature: '特征说明',
        strength: '强度',
        range: '影响范围',
        seatCount: '座位数',
        reliefStrength: '缓解强度',
        cognitiveLoad: '认知负荷',
        x: 'X',
        y: 'Y',
        z: 'Z',
        pressure: '压力',
        fatigue: '疲劳',
        fatigueThreshold: '疲劳阈值',
        heat: '热度',
        crowdDensity: '局部拥挤',
        queueCount: '排队人数',
        environmentNoise: '环境噪音',
        environmentLighting: '环境照度',
          progress: '路径进度',
          walkingSpeed: '步行速度',
          decisionDelay: '决策迟滞',
          restMargin: '休息余量',
          currentState: '当前状态',
          decisionFocus: '决策焦点',
          movementBehavior: '行动状态',
          movementMainCause: '主要阻力',
          movementSpeedFactor: '行动速度倍率',
        advice: '建议',
        nearbySeats: '可见座位',
        visionRadius: '视野范围',
        role: '模拟角色',
        agentBehavior: '行为说明',
        heatmapSource: '热力图来源',
      },
      option: { normal: '平时', peak: '高峰期', female: '女性', male: '男性' },
      layer: {
        title: '显示图层',
        environmental: '环境压力',
        facility: '设施节点',
        seating: '座位资源',
      },
      panel: {
        summary: '场景摘要',
        agentProfile: '代理人属性',
        object: '对象属性',
        dynamic: '动态状态',
        hotspots: '问题点与建议',
      },
      map: {
        title: '空间评估视图',
        empty: '请先导入模型',
        loaded: '模型已就绪',
        heatComputing: '热力图计算中',
        heatActive: '热力图已更新',
        heatFinal: '最终热力图已显示',
      },
      mapSource: {
        none: '未计算',
        localService: '本地服务',
        localCache: '本地服务缓存',
        browserFallback: '浏览器回退',
      },
      status: {
        notLoaded: '未加载',
        loading: '加载中',
        loaded: '已加载',
        ready: '已就绪',
        running: '运行中',
        paused: '已暂停',
        error: '读取失败',
      },
      hint: {
        chooseFile: '未选择文件',
        importFirst: '请先导入模型',
        modelReady: '模型已就绪，可设置参数并生成人流。',
        paramsChanged: '参数已变化，请重新生成人流。',
        crowdReady: '人流已就绪，可运行热力图。',
        heatReady: '热力图已更新，可点击平面区域查看局部状态。',
        clickFocus: '点击重点代理人可暂停并查看即时状态。',
        pausedResume: '点击空白区域继续动画。',
        importFailed: '模型读取失败，请检查 JSON 结构。',
        noRoute: '当前模型缺少可用的预设路线。',
        objectEmpty: '点击节点、环境压力点或座位资源后，这里会显示对象属性。',
        dynamicEmpty: '点击重点代理人可暂停并查看即时状态；运行热力图后也可点击平面区域查看局部压力与疲劳。',
        agentProfilePrompt: '点击代理人之后可显示属性。',
        summaryEmpty: '导入模型并生成人流后显示摘要。',
        hotspotsPrompt: '点击代理人、平面位置或压力点后，这里会显示当前问题与建议。',
        hotspotsEmpty: '运行热力图后生成 Top 3 问题点。',
        suggestionsEmpty: '运行热力图后生成设计建议。',
        noHotspots: '尚未生成热点结果。',
        noSuggestions: '尚未生成建议。',
        restWithSeats: '当前疲劳已超过阈值，重点代理人想寻找座位，建议优先前往视野范围内的座位休息。',
        restWithoutSeats: '当前疲劳已超过阈值，重点代理人想寻找座位，但视野范围内没有座位，建议补充休息设施。',
        keepMoving: '当前位置压力可控，可继续通行。',
        imported: '已导入本地模型',
        agentRadar: '拖动雷达图上的顶点，即可修改 1-5 分。',
        routePickIdle: '导入模型后点击按钮，选择起点与终点区域。',
        routePickStart: '请先选择起点节点。',
        routePickTarget: '请选择终点区域。',
        routePickReady: '路线已设定，可生成人流并开始模拟。',
      },
      marker: { start: '起点', end: '终点', startShort: 'S', endShort: 'E' },
      routeNames: {
        route1: '路线 1 · gate_in_2 → train_door4',
        route2: '路线 2 · es_up_1_top → gate_out_1',
        route3: '路线 3 · train_door1 → es_down_5_top',
      },
      categories: {
        noise_congestion: '噪声与拥挤',
        advert: '广告干扰',
        noise: '噪声',
        signage: '标识',
        decision: '决策压力',
        facility: '设施',
        unknown: '未分类',
      },
      kinds: {
        gate: '闸机',
        escalator: '扶梯',
        elevator: '电梯',
        stair: '楼梯',
        platform: '站台乘车点',
        unknown: '未知',
      },
      roles: {
        pressure: '模拟压力源',
        facility: '设施节点',
        neutral: '中性对象',
        point: '平面点位',
        focusAgent: '重点代理人',
      },
      units: {
        seconds: '秒',
        meters: '米',
        seats: '个',
        percent: '%',
        agents: '人',
        perSecond: 'm/s',
        lux: 'lux',
        decibel: 'dB',
      },
    },
    en: {
      app: { title: 'Central Station Spatial Evaluator', productName: 'Cognitive Load Simulator' },
      landing: {
        tag: 'Smart Urban Mobility Analysis',
        titleLine1: 'Elderly Travel Burden',
        titleLine2: 'Intelligent Analysis Platform',
        description: 'Based on a five-dimension attribute model, using heatmap visualization and chain-of-thought analysis to quantitatively assess multi-dimensional travel burden for the elderly.',
        start: 'Get Started',
      },
      settings: {
        backHome: 'Back to Home',
        section: 'Section 01',
        title: 'Route Settings',
        uploadTitle: 'Data Upload & Route Settings',
        uploadHint: 'Click to upload sim.json',
        uploadFormats: 'Supports .json / .sim.json',
        routeSettingsTitle: 'Route Settings',
        originLabel: 'Origin',
        destinationLabel: 'Destination',
        crowdLabel: 'Crowd Density (ppl/h)',
        nextBtn: 'Set Agent Attribute',
        analyzeBtn: 'Start Analysis',
        radarTitle: 'Five-Dimension Radar Chart',
        radarHint: 'Drag points to adjust dimension scores',
      },
      spatialEditor: {
        entryTitle: 'Edit Spatial Model',
        entryHint: 'Adjust boundaries, nodes, and pressure point parameters',
        eyebrow: 'Spatial Model',
        title: 'Edit Spatial Model',
        back: 'Back to Route Settings',
        modeTitle: 'Edit Mode',
        toolSelect: 'Select',
        toolBoundary: 'Boundary',
        toolNode: 'Node',
        toolPressure: 'Pressure Point',
        objectTitle: 'Object Properties',
        objectName: 'Selected Object',
        objectCoord: 'Coordinates',
        objectType: 'Type',
        paramNoise: 'Noise',
        paramLight: 'Lighting',
        paramAds: 'Ad Interference',
        paramSignage: 'Signage Impact',
        versionTitle: 'Version & Results',
        saveCurrent: 'Save Current Scheme',
        saveAs: 'Save as New Scheme',
        viewHistory: 'View Simulation History',
        libraryTitle: 'Scheme Result Library',
        libraryItemA: 'Scheme A · Gate to Platform',
        libraryMetaA: '500 ppl · balanced profile · 02:18',
        libraryItemB: 'Scheme B · Exit C Transfer',
        libraryMetaB: '1000 ppl · low mobility · 06:42',
        libraryItemC: 'Scheme C · Signage Revision',
        libraryMetaC: '1500 ppl · sensory focus · 04:10',
        openHeatmap: 'Open Historical Heatmap',
        copyScheme: 'Copy as New Scheme',
        toolbarSelect: 'Select',
        toolbarMove: 'Move',
        toolbarAddPressure: 'Add Pressure Point',
        toolbarDelete: 'Delete',
        toolbarUndo: 'Undo',
        toolbarReset: 'Reset',
        returnSettings: 'Return to Route Settings',
        saveChanges: 'Save Changes',
        simulateCurrent: 'Start Simulation from Current Scheme',
        statusIdle: 'Prototype mode: changes are local preview only and are not written to the backend model.',
        statusSave: 'Current scheme is marked as saved in the frontend preview.',
        statusSaveAs: 'A new frontend scheme copy has been created.',
        statusHistory: 'Scheme result library is active; historical heatmap entries can be opened or copied later.',
        statusOpenHeatmap: 'Historical heatmap preview entry selected. Backend opening can be connected later.',
        statusCopyScheme: 'Historical scheme copied as a new editing draft.',
        statusSimulate: 'Simulation from the current scheme selected. This prototype does not submit backend computation.',
        statusUndo: 'Latest frontend demo operation has been undone.',
        statusReset: 'Map objects have been reset to the demo layout.',
      },
      loading: {
        section: 'Section 02',
        title: 'Preparing Visualization Analysis',
        description: 'The platform is generating the crowd field and computing six heatmap views for the selected route.',
        preparing: 'Preparing Analysis',
        statusReady: 'Crowd field is ready and heatmap computation is starting.',
        statusComputing: 'Computing heatmaps for the selected route.',
        statusDone: 'Heatmap computation finished. Opening the visualization workspace.',
        stage: {
          bootstrap: 'Initializing the local simulation job.',
          backgroundPrepare: 'Preparing the reusable background crowd field.',
          background: 'Generating or loading the background crowd field.',
          focusPrepare: 'Preparing the focus agent route.',
          focusReady: 'Background field is ready. Computing the focus agent.',
          focus: 'Computing the focus agent path and heatmaps.',
          llmDecision: 'Generating the agent decision chain.',
        },
      },
      agentSettings: {
        section: 'Section 02',
        title: 'Attribute Settings',
        back: 'Back to Route Settings',
      },
      visualization: {
        section: 'Section 03',
        title: 'Visualization Overview',
        detailSection: 'Section 04',
        detailTitle: 'Detailed Route Diagnosis',
        back: 'Back',
        description: 'Six coordinated views showing the spatial distribution of elderly travel burden in the station.',
        compositeTag: 'Composite',
        compositeTitle: 'Composite Burden Heatmap',
        compositeCopy: 'Integrated spatial burden field combining all five dimensions for route-level overview.',
        locomotorTag: 'Locomotor',
        locomotorTitle: 'Locomotor Burden Heatmap',
        locomotorCopy: 'Physical movement resistance caused by walking distance, vertical transfer, and queue.',
        sensoryTag: 'Sensory',
        sensoryTitle: 'Sensory Burden Heatmap',
        sensoryCopy: 'Perception burden from lighting, noise, visibility range, and sign recognition conditions.',
        cognitiveTag: 'Cognitive',
        cognitiveTitle: 'Decision Burden Heatmap',
        cognitiveCopy: 'Decision pressure from route choice, signage continuity, and hesitation at transfer nodes.',
        psychologicalTag: 'Psychological',
        psychologicalTitle: 'Psychological Burden Heatmap',
        psychologicalCopy: 'Stress hotspots caused by uncertainty, crowd pressure, and reduced comfort or safety.',
        vitalityTag: 'Vitality',
        vitalityTitle: 'Fatigue Burden Heatmap',
        vitalityCopy: 'Accumulated fatigue growth along the route, showing where recovery demand rises fastest.',
        environmentEyebrow: 'Environment Parameters',
        environmentTitle: 'Live Environment Metrics',
        statusEyebrow: 'Monitor',
        statusTitle: 'Elderly Status Monitor',
        radarEyebrow: 'Radar',
        radarTitle: 'Elderly Capability Radar',
        feedbackEyebrow: 'Feedback',
        feedbackTitle: 'Real-time Burden Feedback',
        detailRadarTitle: 'Agent Attribute',
        detailStatusTitle: 'Agent Status',
        detailFeedbackTitle: 'Real-time Burden',
        exportReport: 'Export Analysis Report',
        min: 'Min',
        max: 'Max',
        minBurden: 'Min Burden',
        maxBurden: 'Max Burden',
        currentBurden: 'Current Burden',
        congestion: 'Congestion',
        motionState: 'Motion State',
        mainResistance: 'Main Resistance',
        speedFactor: 'Speed Multiplier',
        detailLayerFilter: 'Pressure Layer',
        detailLayerAll: 'All Stress Layers',
        detailCotTitle: 'Agent Decision Chain',
        detailIssuesTitle: 'Key Issues & Improvement Suggestions',
        detailHotspotsTitle: 'Key Stress Points',
        detailRecommendationsTitle: 'Recommendations',
        detailActiveView: 'Active View',
        detailPeakDimension: 'Peak Dimension',
        detailRiskLevel: 'Risk Level',
        detailNoIssues: 'No significant issues are highlighted yet.',
      },
      section: { import: 'Model Import', route: 'Evaluation Route', agent: 'Agent Settings' },
      button: {
        importLocal: 'Import Local File',
        pickRoute: 'Pick Route',
        agentSettings: 'Agent Setup',
        generateCrowd: 'Generate Crowd',
        crowdGenerated: 'Crowd Generated',
        runHeatmap: 'Run Heatmap',
        heatmapComputing: 'Computing Heatmap',
        rerunHeatmap: 'Refresh Heatmap',
        showFinalHeatmap: 'Show Final Heatmap',
        showPlaybackHeatmap: 'Back To Playback',
        exportReport: 'Export Report',
        exportHtml: 'Export HTML',
        close: 'Close',
        clear: 'Clear',
        confirm: 'Confirm',
        reset: 'Reset',
      },
      label: {
        route: 'Route Mode',
        start: 'Start',
        end: 'End',
        targetRegion: 'Target Region',
        crowdPreset: 'Crowd Preset',
        backgroundCrowd: 'Background Crowd',
        routeSelected: 'Current Target',
        modelSource: 'Source',
        simultaneousCount: 'Occupancy',
        travelTime: 'Travel Time',
        minimumHeat: 'Minimum Heat',
        maximumHeat: 'Maximum Heat',
        activePressureCount: 'Stressors',
        averageTravelTime: 'Avg Travel Time',
        averageFatigue: 'Avg Fatigue',
        averageHeat: 'Avg Heat',
        category: 'Category',
        type: 'Object Type',
        kind: 'Node Kind',
        feature: 'Feature',
        strength: 'Strength',
        range: 'Range',
        seatCount: 'Seat Count',
        reliefStrength: 'Relief Strength',
        cognitiveLoad: 'Cognitive Load',
        x: 'X',
        y: 'Y',
        z: 'Z',
        pressure: 'Pressure',
        fatigue: 'Fatigue',
        fatigueThreshold: 'Fatigue Threshold',
        heat: 'Heat',
        crowdDensity: 'Crowd Density',
        queueCount: 'Queue Count',
        environmentNoise: 'Ambient Noise',
        environmentLighting: 'Ambient Lighting',
          progress: 'Route Progress',
          walkingSpeed: 'Walking Speed',
          decisionDelay: 'Decision Delay',
          restMargin: 'Rest Margin',
          currentState: 'Current State',
          decisionFocus: 'Decision Focus',
          movementBehavior: 'Movement State',
          movementMainCause: 'Main Resistance',
          movementSpeedFactor: 'Speed Factor',
        advice: 'Advice',
        nearbySeats: 'Visible Seats',
        visionRadius: 'Vision Radius',
        role: 'Simulation Role',
        agentBehavior: 'Behavior Notes',
        heatmapSource: 'Heatmap Source',
      },
      option: { normal: 'Normal', peak: 'Peak', female: 'Female', male: 'Male' },
      layer: {
        title: 'Display Layers',
        environmental: 'Environmental Stressors',
        facility: 'Facility Nodes',
        seating: 'Seating Resources',
      },
      panel: {
        summary: 'Scenario Summary',
        agentProfile: 'Agent Profile',
        object: 'Object Inspector',
        dynamic: 'Dynamic State',
        hotspots: 'Hotspots & Guidance',
      },
      map: {
        title: 'Spatial Evaluation View',
        empty: 'Import a model to begin',
        loaded: 'Model ready',
        heatComputing: 'Computing heatmap',
        heatActive: 'Heatmap updated',
        heatFinal: 'Final heatmap shown',
      },
      mapSource: {
        none: 'Not computed',
        localService: 'Local service',
        localCache: 'Local cache',
        browserFallback: 'Browser fallback',
      },
      status: {
        notLoaded: 'Not Loaded',
        loading: 'Loading',
        loaded: 'Loaded',
        ready: 'Ready',
        running: 'Running',
        paused: 'Paused',
        error: 'Load Failed',
      },
      hint: {
        chooseFile: 'No file selected',
        importFirst: 'Import a model first',
        modelReady: 'Model is ready. Adjust parameters and generate the crowd.',
        paramsChanged: 'Parameters changed. Generate the crowd again.',
        crowdReady: 'Crowd is ready. Run the heatmap next.',
        heatReady: 'Heatmap updated. Click the floor area to inspect local conditions.',
        clickFocus: 'Click the focus agent to pause and inspect its current state.',
        pausedResume: 'Click blank space to resume the animation.',
        importFailed: 'Failed to load the model. Check the JSON structure.',
        noRoute: 'This model does not contain the required preset route anchors.',
        objectEmpty: 'Click a node, environmental stressor, or seat to inspect its properties.',
        dynamicEmpty: 'Click the focus agent to pause and inspect it. After running the heatmap, you can also click the floor area to inspect local pressure and fatigue.',
        agentProfilePrompt: 'Click the focus agent to show its properties.',
        summaryEmpty: 'Import a model and generate the crowd to see the summary.',
        hotspotsPrompt: 'Click the focus agent, a floor position, or a stress point to inspect the current issues and recommendations.',
        hotspotsEmpty: 'Run the heatmap to generate the top 3 hotspots.',
        suggestionsEmpty: 'Run the heatmap to generate recommendations.',
        noHotspots: 'No hotspots yet.',
        noSuggestions: 'No recommendations yet.',
        restWithSeats: 'Fatigue is above the threshold. The focus agent wants to find a seat, so prioritize visible seats for a short rest.',
        restWithoutSeats: 'Fatigue is above the threshold. The focus agent wants to find a seat, but no visible seats are available nearby.',
        keepMoving: 'Pressure is manageable at this location. Movement can continue.',
        imported: 'Local model imported',
        agentRadar: 'Drag the radar vertices to adjust scores from 1 to 5.',
        routePickIdle: 'After importing the model, choose a start node and target region.',
        routePickStart: 'Choose a start node first.',
        routePickTarget: 'Choose the target region.',
        routePickReady: 'Route selection is ready. Generate the crowd to simulate it.',
      },
      marker: { start: 'START', end: 'END', startShort: 'S', endShort: 'E' },
      routeNames: {
        route1: 'Route 1 · gate_in_2 → train_door4',
        route2: 'Route 2 · es_up_1_top → gate_out_1',
        route3: 'Route 3 · train_door1 → es_down_5_top',
      },
      categories: {
        noise_congestion: 'Noise & Congestion',
        advert: 'Advertising',
        noise: 'Noise',
        signage: 'Signage',
        decision: 'Decision Load',
        facility: 'Facility',
        unknown: 'Unclassified',
      },
      kinds: {
        gate: 'Gate',
        escalator: 'Escalator',
        elevator: 'Elevator',
        stair: 'Stair',
        platform: 'Platform Door',
        unknown: 'Unknown',
      },
      roles: {
        pressure: 'Stress Source',
        facility: 'Facility Node',
        neutral: 'Neutral Object',
        point: 'Floor Point',
        focusAgent: 'Focus Agent',
      },
      units: {
        seconds: 's',
        meters: 'm',
        seats: 'seats',
        percent: '%',
        agents: 'agents',
        perSecond: 'm/s',
        lux: 'lux',
        decibel: 'dB',
      },
    },
  };

  const REPORT_TEXT = {
    'zh-CN': {
      title: '单路线诊断报告',
      previewTitle: '预览报告',
      close: '关闭',
      cancelExport: '取消',
      confirmExport: '确认',
      reportLanguage: '导出语言',
      reportFormat: '导出格式',
      reportLanguageZh: '中文',
      reportLanguageEn: '英文',
      reportFormatHtml: '网页 HTML',
      reportFormatPdf: 'PDF',
      exportHtml: '导出 HTML',
      emptyPreview: '请先运行热力图，再生成当前路线的报告预览。',
      readyPreview: '已生成当前路线的报告预览，可选择格式并导出。',
      readyPreviewPicker: '已生成当前路线报告预览，可选择格式并导出。',
      readyPreviewDownload: '已生成当前路线报告预览，可选择格式并导出。',
      errorPreview: '报告生成失败，请检查当前模拟状态。',
      exporting: '导出中...',
      exported: '已导出 HTML：{fileName}',
      downloaded: '当前环境不支持直接选择保存路径，已使用浏览器下载 HTML。',
      cancelled: '已取消导出。',
      exportFailed: '报告导出失败。',
      pdfPrintReady: '已导出 PDF：{fileName}',
      localModel: '本地模型',
      conclusion: '诊断结论',
      snapshot: '运行快照',
      start: '起点',
      target: '终点区域',
      averageTravelTime: '平均通行时间',
      backgroundCrowd: '背景人流',
      routeAgentSnapshot: '路线与代理人快照',
      projectFile: '项目文件',
      exportedAt: '导出时间',
      simultaneousCount: '同时在场人数',
      activePressureCount: '活跃压力源',
      averageFatigue: '平均疲劳',
      averageHeat: '平均热度',
      dimensionSnapshot: '五维负担快照',
      capacityScores: '能力设定',
      averageBurden: '平均负担',
      peakBurden: '最高负担',
      noDimensionData: '当前运行尚未生成五维负担统计。',
      modelSource: '模型来源',
      findings: '主要问题',
      hotspots: '热点清单',
      recommendations: '建议动作',
      hotspotLocation: '热点位置',
      category: '类别',
      cognitiveLoad: '认知负荷',
      improvement: '改善建议',
      noHotspots: '当前路线未形成明显热点。',
      footer: '本报告基于当前单路线模拟结果自动生成，用于快速识别问题点、辅助后续空间优化讨论。若需要面向不同客户角色的正式版报告，可在此基础上继续扩展模板。',
      riskHigh: '高风险',
      riskHighSummary: '该路线存在明显的高压集中段，建议优先处理排名靠前的热点与连续决策点。',
      riskMedium: '中风险',
      riskMediumSummary: '该路线存在可感知的认知负荷波动，建议优先优化热点附近的导向与通行组织。',
      riskLow: '低风险',
      riskLowSummary: '当前路线整体负荷相对可控，可将本次结果作为后续方案比对的基线。',
      findingHotspot: '最高风险点为“{name}”，主要属于{category}，认知负荷值约为{value}。',
      findingTravelTime: '平均通行时间约为 {value}，说明该路线存在停滞、等待或路径判断成本偏高的区段。',
      findingFatigue: '重点代理人的平均疲劳已接近阈值 {value}，建议关注路线中后段的恢复机会与节奏控制。',
      recommendationWayfinding: '建议复核该路线关键转折点前的连续导向信息，并减少交汇口的犹豫与停滞。',
      recommendationRecovery: '建议在路线中后段补充可短暂停留或恢复的设施，降低持续疲劳累积。',
      recommendationBaseline: '建议保持当前空间组织方案，并继续观察不同人流强度下的热点变化。',
      llmAnalysisTitle: '报告分析摘要',
      llmAnalysisPlaceholder: '当前报告基于本地模拟结果生成，后续可接入 LLM 输出更完整的路线诊断文本。',
      llmAnalysisPlaceholderSub: '占位分析不改变模拟结果，仅用于报告结构预留。',
      secondsUnit: '秒',
      peopleUnit: '人',
    },
    en: {
      title: 'Single Route Diagnostic Report',
      previewTitle: 'Report Preview',
      close: 'Close',
      cancelExport: 'Cancel',
      confirmExport: 'Confirm',
      reportLanguage: 'Export Language',
      reportFormat: 'Export Format',
      reportLanguageZh: 'Chinese',
      reportLanguageEn: 'English',
      reportFormatHtml: 'HTML Page',
      reportFormatPdf: 'PDF',
      exportHtml: 'Export HTML',
      emptyPreview: 'Run the heatmap first to generate the current route report preview.',
      readyPreview: 'The current route report preview is ready. Choose a format to export.',
      readyPreviewPicker: 'The current route report preview is ready. Choose a format to export.',
      readyPreviewDownload: 'The current route report preview is ready. Choose a format to export.',
      errorPreview: 'Report generation failed. Check the current simulation state.',
      exporting: 'Exporting...',
      exported: 'HTML exported: {fileName}',
      downloaded: 'This environment cannot choose a save location directly, so the HTML file was downloaded through the browser.',
      cancelled: 'Export cancelled.',
      exportFailed: 'Report export failed.',
      pdfPrintReady: 'PDF exported: {fileName}',
      localModel: 'Local model',
      conclusion: 'Diagnosis',
      snapshot: 'Run Snapshot',
      start: 'Start',
      target: 'Target Region',
      averageTravelTime: 'Average Travel Time',
      backgroundCrowd: 'Background Crowd',
      routeAgentSnapshot: 'Route And Agent Snapshot',
      projectFile: 'Project File',
      exportedAt: 'Exported At',
      simultaneousCount: 'Occupancy',
      activePressureCount: 'Active Stressors',
      averageFatigue: 'Average Fatigue',
      averageHeat: 'Average Heat',
      dimensionSnapshot: 'Five-Dimension Burden Snapshot',
      capacityScores: 'Capacity Profile',
      averageBurden: 'Average Burden',
      peakBurden: 'Highest Burden',
      noDimensionData: 'No five-dimension burden statistics are available for this run yet.',
      modelSource: 'Model Source',
      findings: 'Key Findings',
      hotspots: 'Hotspot List',
      recommendations: 'Recommended Actions',
      hotspotLocation: 'Hotspot',
      category: 'Category',
      cognitiveLoad: 'Cognitive Load',
      improvement: 'Recommendation',
      noHotspots: 'No obvious hotspots were found on the current route.',
      footer: 'This report is generated automatically from the current single-route simulation to quickly surface problem areas and support later design discussions. It can be extended into client-specific report templates later.',
      riskHigh: 'High Risk',
      riskHighSummary: 'This route contains clearly concentrated high-pressure segments. Prioritize the highest-ranked hotspots and continuous decision points.',
      riskMedium: 'Medium Risk',
      riskMediumSummary: 'This route shows noticeable cognitive-load fluctuation. Prioritize wayfinding and movement organization near the main hotspots.',
      riskLow: 'Low Risk',
      riskLowSummary: 'Overall route load is relatively controlled and can serve as a baseline for later scheme comparisons.',
      findingHotspot: 'The highest-risk point is "{name}", mainly classified as {category}, with a cognitive-load value around {value}.',
      findingTravelTime: 'Average travel time is about {value}, indicating segments with elevated stopping, waiting, or path-finding cost.',
      findingFatigue: 'The focus agent’s average fatigue is approaching the threshold of {value}, so recovery opportunities in the later route stages should be reviewed.',
      recommendationWayfinding: 'Review continuous wayfinding before key turning points and reduce hesitation at merging or crossing areas.',
      recommendationRecovery: 'Add short-stay or recovery opportunities in the later route stages to reduce cumulative fatigue.',
      recommendationBaseline: 'Keep the current spatial organization as a baseline and continue comparing hotspot changes under different crowd levels.',
      llmAnalysisTitle: 'Report Analysis Summary',
      llmAnalysisPlaceholder: 'This report is generated from local simulation results. A fuller route diagnosis can be connected to LLM output later.',
      llmAnalysisPlaceholderSub: 'The placeholder analysis only reserves report structure and does not change simulation results.',
      secondsUnit: 's',
      peopleUnit: 'people',
    },
  };

  const state = {
    locale: 'zh-CN',
    reportLocale: 'zh-CN',
    uiScreen: 'landing',
    landingTransitioning: false,
    landingTransitionTimer: null,
    analysisTransitioning: false,
    settingsRadarPointerId: null,
    rawModel: null,
    prepared: null,
    scenario: null,
    crowdGenerated: false,
    heatmapComputing: false,
    heatmapComputeProgress: 0,
    heatmapComputeStage: '',
    heatmapComputeToken: 0,
    heatmapRunError: '',
    heatmapSourceInfo: createHeatmapSourceInfo(),
    localSimServerStatus: 'unknown',
    localSimServerCheckedAt: 0,
    localSimServerProbePromise: null,
    heatmapDisplayMode: 'playback',
    heatmapRevealLocked: false,
    heatmapRevealFrozenTime: null,
    animationPaused: false,
    needsRender: true,
    needsPlaybackRender: false,
    selectedObject: null,
    selectedDynamic: null,
    selectedTracePoint: null,
    selectedHotspotId: null,
    selectedHotspotOverlaySnapshot: null,
    routePickMode: 'idle',
    viewMode: getSafeViewMode('cognitive'),
    routeSelection: { startPoint: null, startNodeId: null, targetRegionId: null },
    routeModal: { open: false, startNodeId: null, targetRegionId: null },
    settingsDestinationMenuOpen: false,
    visualizationDetailLayerMenuOpen: false,
    visualizationDetailActiveLayerCategories: [],
    visualizationDetailLayerHoveredValue: null,
    visualizationDetailHoverTarget: null,
    visualizationDetailHoverPointer: null,
    visualizationDetailSelectedIssue: null,
    visualizationDetailCotMarkupCache: '',
    visualizationDetailIssuesMarkupCache: '',
    visualizationDetailCotRenderedAt: 0,
    visualizationDetailIssuesRenderedAt: 0,
    visualizationDetailStageDeferredView: null,
    visualizationDetailStageRenderScheduled: false,
    suppressNextDetailIssueClick: false,
    suppressNextDetailLayerTriggerClick: false,
    suppressNextDetailLayerMenuClick: false,
    agentModal: {
      open: false,
      draft: createAgentDraft(),
      activeDimensionId: FIVE_DIMENSION_ORDER[0],
      pointerId: null,
      previewPoseCacheKey: '',
      previewPoseDataUrl: '',
      previewPoseBaseDataUrl: '',
      previewPoseOverlayDataUrl: '',
      previewPoseMetadata: null,
      previewPosePendingKey: '',
    },
    reportModal: createDefaultReportModalState(),
    focusProfile: createFocusProfile({}),
    backgroundCrowd: DEFAULT_BACKGROUND_CROWD,
    backgroundRendererMode: DEFAULT_BACKGROUND_RENDERER_MODE,
    activeLayerCategory: null,
    vitalitySeatLayerRestoreCategory: null,
    vitalitySeatLayerForced: false,
    pointPopover: { visible: false, type: null, id: null, draft: null, anchor: null, overlayTarget: null, readOnly: true },
    editedPressureOverrides: {},
    firstPassComplete: false,
    loopPlaybackActive: false,
    focusTraceSnapshots: [],
    suppressNextOverlayClick: false,
    importError: '',
    modelSourceName: '',
    fileName: DEFAULT_FILE_NAME,
    fileNameDraft: DEFAULT_FILE_NAME,
    isEditingFileName: false,
    lastFrameTime: 0,
    transform: null,
    heatCellMetricCache: new Map(),
    viewMetricRangeCache: new Map(),
    revealedHeatCellsCache: new Map(),
    heatRasterCache: new Map(),
    visibleTraceSnapshotCache: null,
    playbackSnapshotCache: null,
    playbackFocusInspectionCache: null,
    backgroundPlaybackRenderState: null,
    dynamicCrowdWebglRuntime: null,
    heatmapRenderCache: null,
    heatRevealMaskCache: new Map(),
    lastPlaybackOverlayRenderAt: 0,
    lastPlaybackUiPanelRenderAt: 0,
    localHeatmapPlaybackCache: new Map(),
    visualizationDetailView: null,
    spatialEditor: {
      activeTool: 'select',
      selectedObjectName: 'Boundary Control P1',
      selectedObjectType: 'Boundary',
      selectedX: 126,
      selectedY: 154,
      statusKey: 'spatialEditor.statusIdle',
      drag: null,
    },
  };

  const backgroundPlaybackTrajectoryCache = new WeakMap();

  const elements = {
    screenLocaleToggle: document.getElementById('screen-locale-toggle'),
    landingScreen: document.getElementById('landing-screen'),
    landingTag: document.getElementById('landing-tag'),
    landingTitleLine1: document.getElementById('landing-title-line-1'),
    landingTitleLine2: document.getElementById('landing-title-line-2'),
    landingDescription: document.getElementById('landing-description'),
    landingStartBtn: document.getElementById('landing-start-btn'),
    settingsScreen: document.getElementById('settings-screen'),
    analysisLoadingScreen: document.getElementById('analysis-loading-screen'),
    analysisLoadingDescription: document.getElementById('analysis-loading-description'),
    analysisLoadingProgressBtn: document.getElementById('analysis-loading-progress-btn'),
    analysisLoadingStatus: document.getElementById('analysis-loading-status'),
    settingsBackBtn: document.getElementById('settings-back-btn'),
    settingsUploadTrigger: document.getElementById('settings-upload-trigger'),
    settingsUploadFile: document.getElementById('settings-upload-file'),
    settingsSpatialEditorBtn: document.getElementById('settings-spatial-editor-btn'),
    settingsModelStatus: document.getElementById('settings-model-status'),
    settingsRoutePickBtn: document.getElementById('settings-route-pick-btn'),
    settingsRoutePickHint: document.getElementById('settings-route-pick-hint'),
    settingsOriginValue: document.getElementById('settings-origin-value'),
    settingsDestinationTrigger: document.getElementById('settings-destination-trigger'),
    settingsDestinationValue: document.getElementById('settings-destination-value'),
    settingsDestinationMenu: document.getElementById('settings-destination-menu'),
    settingsRouteClearBtn: document.getElementById('settings-route-clear-btn'),
    settingsRouteConfirmBtn: document.getElementById('settings-route-confirm-btn'),
    settingsBackgroundCrowdSlider: document.getElementById('settings-background-crowd-slider'),
    settingsBackgroundCrowdValue: document.getElementById('settings-background-crowd-value'),
    settingsBackgroundCrowdInput: document.getElementById('settings-background-crowd-input'),
    settingsNextBtn: document.getElementById('settings-next-btn'),
    spatialEditorScreen: document.getElementById('spatial-editor-screen'),
    spatialEditorBackBtn: document.getElementById('spatial-editor-back-btn'),
    spatialEditorReturnSettingsBtn: document.getElementById('spatial-editor-return-settings-btn'),
    spatialEditorRouteMapStage: document.getElementById('spatial-editor-route-map-stage'),
    spatialEditorMap: document.getElementById('spatial-editor-route-map'),
    spatialEditorStatus: document.getElementById('spatial-editor-status'),
    spatialEditorObjectName: document.getElementById('spatial-editor-object-name'),
    spatialEditorObjectCoord: document.getElementById('spatial-editor-object-coord'),
    spatialEditorObjectType: document.getElementById('spatial-editor-object-type'),
    spatialEditorToolButtons: Array.from(document.querySelectorAll('[data-spatial-editor-tool]')),
    spatialEditorActionButtons: Array.from(document.querySelectorAll('[data-spatial-editor-action]')),
    spatialEditorResultButtons: Array.from(document.querySelectorAll('.spatial-editor-result')),
    agentSettingsScreen: document.getElementById('agent-settings-screen'),
    agentSettingsBackBtn: document.getElementById('agent-settings-back-btn'),
    settingsStartAnalysisBtn: document.getElementById('settings-start-analysis-btn'),
    settingsRouteMapStage: document.getElementById('settings-route-map-stage'),
    settingsRouteMap: document.getElementById('settings-route-map'),
    settingsCapacityRadar: document.getElementById('settings-capacity-radar'),
    settingsAgentVisualPanel: document.getElementById('settings-agent-visual-panel'),
    settingsAgentFigureStage: document.getElementById('settings-agent-figure-stage'),
    settingsAgentConnectorLayer: document.getElementById('settings-agent-connector-layer'),
    settingsDimensionList: document.getElementById('settings-dimension-list'),
    legacyAppShell: document.getElementById('legacy-app-shell'),
    appTitle: document.getElementById('app-title'),
    appProductName: document.getElementById('app-product-name'),
    appFileName: document.getElementById('app-file-name'),
    appFileNameInput: document.getElementById('app-file-name-input'),
    localeZh: document.getElementById('locale-zh'),
    localeEn: document.getElementById('locale-en'),
    modelFileInput: document.getElementById('model-file-input'),
    modelSource: document.getElementById('model-source'),
    routePickBtn: document.getElementById('route-pick-btn'),
    routePickHint: document.getElementById('route-pick-hint'),
    selectedStart: document.getElementById('selected-start'),
    selectedEnd: document.getElementById('selected-end'),
    routeModal: document.getElementById('route-modal'),
    routeModalMapStage: document.querySelector('#route-modal .route-modal-map-stage'),
    routeModalInstruction: document.getElementById('route-modal-instruction'),
    routeModalStartDisplay: document.getElementById('route-modal-start-display'),
    routeModalMap: document.getElementById('route-modal-map'),
    routeRegionList: document.getElementById('route-region-list'),
    routeModalConfirmBtn: document.getElementById('route-modal-confirm-btn'),
    routeModalClearBtn: document.getElementById('route-modal-clear-btn'),
    agentSettingsBtn: document.getElementById('agent-settings-btn'),
    agentProfileSummary: document.getElementById('agent-profile-summary'),
    agentModal: document.getElementById('agent-modal'),
    agentCapacityRadar: document.getElementById('agent-capacity-radar'),
    agentRadarHint: document.getElementById('agent-radar-hint'),
    agentBehaviorTitle: document.getElementById('agent-behavior-title'),
    agentBehaviorPanel: document.getElementById('agent-behavior-panel'),
    agentModalConfirmBtn: document.getElementById('agent-modal-confirm-btn'),
    agentModalClearBtn: document.getElementById('agent-modal-clear-btn'),
    backgroundCrowdSlider: document.getElementById('background-crowd-slider'),
    backgroundCrowdValue: document.getElementById('background-crowd-value'),
    generateCrowdBtn: document.getElementById('generate-crowd-btn'),
    runHeatmapBtn: document.getElementById('run-heatmap-btn'),
    showFinalHeatmapBtn: document.getElementById('show-final-heatmap-btn'),
    mapTitle: document.getElementById('map-title'),
    mapStatus: document.getElementById('map-status'),
    viewModeLabel: document.querySelector('.viewport-select-label'),
    viewModeSelect: document.getElementById('view-mode-select'),
    viewHeatLegend: document.getElementById('view-heat-legend'),
    viewModelStatus: document.getElementById('view-model-status'),
    mapWrapper: document.getElementById('map-wrapper'),
    baseLayer: document.getElementById('base-layer'),
    backgroundCrowdCanvas: document.getElementById('background-crowd-canvas'),
    dynamicCrowdWebglCanvas: document.getElementById('dynamic-crowd-webgl-canvas'),
    heatmapLayer: document.getElementById('heatmap-layer'),
    overlayLayer: document.getElementById('overlay-layer'),
    pointPopover: document.getElementById('point-popover'),
    pointPopoverHeader: document.getElementById('point-popover-header'),
    pointPopoverContent: document.getElementById('point-popover-content'),
    pointPopoverConfirmBtn: document.getElementById('point-popover-confirm-btn'),
    pointPopoverResetBtn: document.getElementById('point-popover-reset-btn'),
    runSummary: document.getElementById('run-summary'),
    inspectorAgentSummary: document.getElementById('inspector-agent-summary'),
    objectInspector: document.getElementById('object-inspector'),
    hotspotsList: document.getElementById('hotspots-list'),
    exportReportBtn: document.getElementById('export-report-btn'),
    reportModal: document.getElementById('report-modal'),
    reportModalTitle: document.getElementById('report-modal-title'),
    reportModalSummary: document.getElementById('report-modal-summary'),
    reportModalStatus: document.getElementById('report-modal-status'),
    reportModalCancelBtn: document.getElementById('report-modal-cancel-btn'),
    reportModalExportBtn: document.getElementById('report-modal-export-btn'),
    reportLanguageLabel: document.getElementById('report-language-label'),
    reportLanguageTrigger: document.getElementById('report-language-trigger'),
    reportLanguageMenu: document.getElementById('report-language-menu'),
    reportFormatLabel: document.getElementById('report-format-label'),
    reportFormatTrigger: document.getElementById('report-format-trigger'),
    reportFormatMenu: document.getElementById('report-format-menu'),
    reportLocaleZh: document.getElementById('report-locale-zh'),
    reportLocaleEn: document.getElementById('report-locale-en'),
    reportPreviewFrame: document.getElementById('report-preview-frame'),
    visualizationShell: document.getElementById('visualization-shell'),
    visualizationShellEyebrow: document.getElementById('visualization-shell-eyebrow'),
    visualizationShellTitle: document.getElementById('visualization-shell-title'),
    visualizationBackBtn: document.getElementById('visualization-back-btn'),
    visualizationEnvironmentPanel: document.getElementById('visualization-environment-panel'),
    visualizationStatusMonitor: document.getElementById('visualization-status-monitor'),
    visualizationCapabilityRadar: document.getElementById('visualization-capability-radar'),
    visualizationBurdenFeedback: document.getElementById('visualization-burden-feedback'),
    visualizationExportReportBtn: document.getElementById('visualization-export-report-btn'),
    visualizationCards: Array.from(document.querySelectorAll('[data-viz-card]')).map((card) => ({
      id: card.dataset.vizCard,
      card,
      base: card.querySelector('[data-viz-base]'),
      background: card.querySelector('[data-viz-background]'),
      heat: card.querySelector('[data-viz-heat]'),
      overlay: card.querySelector('[data-viz-overlay]'),
      min: card.querySelector('[data-viz-min]'),
      max: card.querySelector('[data-viz-max]'),
    })),
    visualizationOverview: document.getElementById('visualization-overview'),
    visualizationDetail: document.getElementById('visualization-detail'),
    visualizationDetailEnvironment: document.getElementById('visualization-detail-environment'),
    visualizationDetailStatus: document.getElementById('visualization-detail-status'),
    visualizationDetailRadar: document.getElementById('visualization-detail-radar'),
    visualizationDetailFeedback: document.getElementById('visualization-detail-feedback'),
    visualizationDetailCot: document.getElementById('visualization-detail-cot'),
    visualizationDetailIssues: document.getElementById('visualization-detail-issues'),
    visualizationDetailExportReportBtn: document.getElementById('visualization-detail-export-report-btn'),
    visualizationDetailStageTitle: document.getElementById('visualization-detail-stage-title'),
    visualizationDetailStageDescription: document.getElementById('visualization-detail-stage-description'),
    visualizationDetailLayerSelect: document.getElementById('visualization-detail-layer-select'),
    visualizationDetailLayerMenu: document.getElementById('visualization-detail-layer-menu'),
    visualizationDetailViewSelect: document.getElementById('visualization-detail-view-select'),
    visualizationDetailStageMetrics: document.getElementById('visualization-detail-stage-metrics'),
    visualizationDetailStageLegend: document.getElementById('visualization-detail-stage-legend'),
    visualizationDetailBase: document.getElementById('visualization-detail-base'),
    visualizationDetailBackground: document.getElementById('visualization-detail-background'),
    visualizationDetailHeat: document.getElementById('visualization-detail-heat'),
    visualizationDetailOverlay: document.getElementById('visualization-detail-overlay'),
    capacityGroupTitle: document.querySelector('.capacity-group-title'),
    capacityInputs: {
      locomotor: document.getElementById('capacity-locomotor'),
      sensory: document.getElementById('capacity-sensory'),
      cognitive: document.getElementById('capacity-cognitive'),
      psychological: document.getElementById('capacity-psychological'),
      vitality: document.getElementById('capacity-vitality'),
    },
    capacityLabels: {
      locomotor: document.getElementById('capacity-locomotor-label'),
      sensory: document.getElementById('capacity-sensory-label'),
      cognitive: document.getElementById('capacity-cognitive-label'),
      psychological: document.getElementById('capacity-psychological-label'),
      vitality: document.getElementById('capacity-vitality-label'),
    },
    capacityValues: {
      locomotor: document.getElementById('capacity-locomotor-value'),
      sensory: document.getElementById('capacity-sensory-value'),
      cognitive: document.getElementById('capacity-cognitive-value'),
      psychological: document.getElementById('capacity-psychological-value'),
      vitality: document.getElementById('capacity-vitality-value'),
    },
    layerCategoryButtons: Array.from(document.querySelectorAll('.layer-category-btn')),
  };

  elements.heatmapLayer.style.pointerEvents = 'none';
  if (elements.backgroundCrowdCanvas) {
    elements.backgroundCrowdCanvas.style.pointerEvents = 'none';
  }

  const VISUALIZATION_CARD_ORDER = [
    COMPOSITE_BURDEN_VIEW,
    'locomotor',
    'sensory',
    'cognitive',
    'psychological',
    'vitality',
  ];

  function getTextForLocale(locale, path) {
    const source = TEXT[locale] || TEXT['zh-CN'];
    return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), source);
  }

  function getText(path) {
    return getTextForLocale(state.locale, path);
  }

  function t(path, replacements) {
    let template = getText(path);
    if (template === undefined) {
      template = path;
    }
    if (!replacements) {
      return template;
    }
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (replacements[key] !== undefined ? replacements[key] : ''));
  }

  function tForLocale(locale, path, replacements) {
    let template = getTextForLocale(locale, path);
    if (template === undefined) {
      template = path;
    }
    if (!replacements) {
      return template;
    }
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (replacements[key] !== undefined ? replacements[key] : ''));
  }

  function getReportLocale() {
    return state.reportLocale === 'en' ? 'en' : 'zh-CN';
  }

  function getReportCopy(locale = getReportLocale()) {
    return REPORT_TEXT[locale] || REPORT_TEXT['zh-CN'];
  }

  function getReportLanguageLabel(locale = getReportLocale(), displayLocale = getReportLocale()) {
    const copy = getReportCopy(displayLocale);
    return locale === 'en' ? copy.reportLanguageEn : copy.reportLanguageZh;
  }

  function getReportFormatLabel(format = state.reportModal?.exportFormat, locale = getReportLocale()) {
    const copy = getReportCopy(locale);
    return format === 'pdf' ? copy.reportFormatPdf : copy.reportFormatHtml;
  }

  function getReportExportFormat() {
    return state.reportModal?.exportFormat === 'pdf' ? 'pdf' : 'html';
  }

  function reportT(key, replacements, locale = getReportLocale()) {
    let template = getReportCopy(locale)?.[key];
    if (template === undefined) {
      template = key;
    }
    if (!replacements) {
      return template;
    }
    return String(template).replace(/\{(\w+)\}/g, (_, name) => (replacements[name] !== undefined ? replacements[name] : ''));
  }

  function getUnifiedRules() {
    return Sim.getUnifiedRules ? Sim.getUnifiedRules() : window.__UNIFIED_RULES__ || null;
  }

  function getDimensionRule(id) {
    return getUnifiedRules()?.dimensions?.[id] || null;
  }

  function getDimensionBurdenLabel(id, locale = state.locale) {
    if (id === COMPOSITE_BURDEN_VIEW) {
      return locale === 'en' ? 'Composite Burden' : '综合负担';
    }
    if (locale === 'en' && id === 'locomotor') {
      return 'Mobility Burden';
    }
    const rule = getDimensionRule(id);
    return locale === 'en'
      ? (rule?.burdenLabelEn || id)
      : (rule?.burdenLabelZh || id);
  }

  function getDimensionCapacityLabel(id, locale = state.locale) {
    if (locale === 'en' && id === 'locomotor') {
      return 'Locomotor Capacity';
    }
    const rule = getDimensionRule(id);
    return locale === 'en'
      ? (rule?.labelEn || id)
      : (rule?.labelZh || id);
  }

  function getDimensionDisplayName(id, locale = state.locale) {
    const localized = locale === 'en'
      ? {
          locomotor: 'Locomotor',
          sensory: 'Sensory',
          cognitive: 'Cognitive',
          psychological: 'Psychological',
          vitality: 'Vitality',
        }
      : {
          locomotor: '行动',
          sensory: '感知',
          cognitive: '认知',
          psychological: '心理',
          vitality: '活力',
        };
    return localized[id] || getDimensionCapacityLabel(id, locale);
  }

  function getDimensionOverviewDescription(id, locale = state.locale) {
    const localized = locale === 'en'
      ? {
          locomotor: 'Walking distance, number of stairs, slope changes, and other physical exertion indicators.',
          sensory: 'Visual and auditory ability to capture and process environmental information.',
          cognitive: 'Route complexity, signage clarity, and transfer decision-making burden.',
          psychological: 'Sense of safety, anxiety level, and environmental comfort evaluation.',
          vitality: 'Overall energy state, fatigue recovery, and willingness to continue traveling.',
        }
      : {
          locomotor: '步行距离、楼梯数量、坡度变化等对行动负担的影响。',
          sensory: '视觉与听觉获取环境信息的能力，以及对提示信息的捕捉效率。',
          cognitive: '路线复杂度、标识清晰度与换乘决策所带来的理解负担。',
          psychological: '安全感、焦虑水平与环境舒适度对主观心理负担的影响。',
          vitality: '整体体力状态、疲劳恢复速度与继续通行意愿。',
        };
    return localized[id] || '';
  }

  function formatCapacityScoreLabel(id, score, locale = state.locale) {
    const safeScore = Number(score || 0);
    if (id === 'locomotor' && safeScore === 1) {
      return locale === 'en' ? '1 (wheelchair speed)' : '1（轮椅速度）';
    }
    return String(safeScore);
  }

  function buildDimensionSummaryEntries(capacityScores, burdenScores, locale = state.locale) {
    return FIVE_DIMENSION_ORDER.map((id) => ({
      id,
      capacityLabel: getDimensionCapacityLabel(id, locale),
      burdenLabel: getDimensionBurdenLabel(id, locale),
      capacityScore: Number(capacityScores?.[id] || 0),
      capacityScoreLabel: formatCapacityScoreLabel(id, capacityScores?.[id], locale),
      burdenScore: Number(burdenScores?.[id] || 0),
    }));
  }

  function getDimensionAgentSettingDescription(id, score, locale = state.locale) {
    const safeScore = clamp(Math.round(Number(score || 0)), 1, 5);
    const rule = getDimensionRule(id);
    const localizedDescriptions = locale === 'en'
      ? rule?.agentSettingDescriptionsEn
      : rule?.agentSettingDescriptionsZh;
    return localizedDescriptions?.[safeScore]
      || rule?.agentSettingDescriptionsZh?.[safeScore]
      || '';
  }

  function getTopBurdenIdFromScores(burdenScores) {
    return FIVE_DIMENSION_ORDER.reduce((bestId, id) => (
      Number(burdenScores?.[id] || 0) > Number(burdenScores?.[bestId] || 0) ? id : bestId
    ), FIVE_DIMENSION_ORDER[0]);
  }

  function computeCompositeBurdenScore(burdenScores = {}) {
    const values = FIVE_DIMENSION_ORDER
      .map((id) => Number(burdenScores?.[id]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function cloneDimensionScoreMap(scores = {}) {
    const map = FIVE_DIMENSION_ORDER.reduce((map, id) => {
      map[id] = Number(scores?.[id] || 0);
      return map;
    }, {});
    map[COMPOSITE_BURDEN_VIEW] = computeCompositeBurdenScore(map);
    return map;
  }

  function cloneCapacityScoreMap(scores = {}) {
    return FIVE_DIMENSION_ORDER.reduce((map, id) => {
      map[id] = Number(scores?.[id] || 0);
      return map;
    }, {});
  }

  function interpolateDimensionScoreMap(previous, current, key, ratio, fallback = {}) {
    const map = FIVE_DIMENSION_ORDER.reduce((map, id) => {
      const leftValue = Number(previous?.[key]?.[id]);
      const rightValue = Number(current?.[key]?.[id]);
      const fallbackValue = Number(fallback?.[id] || 0);
      const from = Number.isFinite(leftValue)
        ? leftValue
        : (Number.isFinite(rightValue) ? rightValue : fallbackValue);
      const to = Number.isFinite(rightValue) ? rightValue : from;
      map[id] = from + (to - from) * ratio;
      return map;
    }, {});
    map[COMPOSITE_BURDEN_VIEW] = computeCompositeBurdenScore(map);
    return map;
  }

  function getBurdenMetricFromScores(scores = {}, viewMode = getSafeViewMode(state.viewMode)) {
    if (viewMode === COMPOSITE_BURDEN_VIEW) {
      return computeCompositeBurdenScore(scores);
    }
    return Number(scores?.[viewMode] || 0);
  }

  function getViewModeOptions(locale = state.locale) {
    return BURDEN_VIEW_ORDER.map((id) => ({
      id,
      label: getDimensionBurdenLabel(id, locale),
    }));
  }

  function getCompositeIssueSummary(locale = state.locale) {
    return locale === 'en'
      ? 'Composite burden is the equal-weight average of the five burdens. Use it for overview, then jump to a single burden view for diagnosis.'
      : '综合负担是五项负担的等权平均，用于总览，再点击跳转到单项视图做诊断。';
  }

  function renderCapacityControls(draft = state.agentModal.draft, locale = state.locale) {
    if (elements.capacityGroupTitle) {
      elements.capacityGroupTitle.textContent = locale === 'en' ? 'Five Capacities' : '五维能力';
    }
    const capacityScores = getEditableCapacityScores(draft?.capacityScores);
    FIVE_DIMENSION_ORDER.forEach((id) => {
      const label = elements.capacityLabels[id];
      const input = elements.capacityInputs[id];
      const value = elements.capacityValues[id];
      const score = Number(capacityScores?.[id] || DEFAULT_CAPACITY_SCORES[id]);
      if (label) {
        label.textContent = getDimensionCapacityLabel(id, locale);
      }
      if (input) {
        input.value = String(score);
      }
      if (value) {
        value.textContent = formatCapacityScoreLabel(id, score, locale);
      }
    });
  }

  function renderViewModeOptions(locale = state.locale) {
    if (!elements.viewModeSelect) {
      return;
    }
    if (elements.viewModeLabel) {
      elements.viewModeLabel.textContent = locale === 'en' ? 'Burden View' : '负担视图';
    }
    const currentValue = getSafeViewMode(state.viewMode);
    elements.viewModeSelect.innerHTML = getViewModeOptions(locale).map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>
    `).join('');
    elements.viewModeSelect.value = currentValue;
  }

  function getHeatmapViewStyle(viewMode = getSafeViewMode(state.viewMode)) {
    return HEATMAP_VIEW_STYLES[viewMode] || HEATMAP_VIEW_STYLES.default;
  }

  function rgbToCss(rgb) {
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  function buildHeatLegendGradient(style) {
    const colorStops = style?.colorStops || DEFAULT_HEAT_COLOR_STOPS;
    return `linear-gradient(90deg, ${colorStops.map((item) => `${rgbToCss(item.rgb)} ${item.stop * 100}%`).join(', ')})`;
  }

  function getSortedNumericValues(values) {
    return values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);
  }

  function sampleQuantile(sortedValues, quantile) {
    if (!Array.isArray(sortedValues) || !sortedValues.length) {
      return 0;
    }
    const normalized = clamp(Number(quantile) || 0, 0, 1);
    const position = normalized * (sortedValues.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) {
      return Number(sortedValues[lowerIndex] || 0);
    }
    const amount = position - lowerIndex;
    const lowerValue = Number(sortedValues[lowerIndex] || 0);
    const upperValue = Number(sortedValues[upperIndex] || lowerValue);
    return lowerValue + (upperValue - lowerValue) * amount;
  }

  function renderViewHeatLegend(locale = state.locale) {
    if (!elements.viewHeatLegend) {
      return;
    }
    const style = getHeatmapViewStyle();
    const legend = style.legend || HEATMAP_VIEW_STYLES.default.legend;
    const low = locale === 'en' ? legend.lowEn : legend.lowZh;
    const high = locale === 'en' ? legend.highEn : legend.highZh;
    const widthNote = locale === 'en' ? legend.widthNoteEn : legend.widthNoteZh;
    const widthMarkup = state.viewMode === 'vitality'
      ? `
        <div class="view-heat-width-note">${escapeHtml(widthNote)}</div>
      `
      : '';
    elements.viewHeatLegend.innerHTML = `
      <div class="view-heat-legend-card" data-view-mode="${escapeHtml(state.viewMode)}">
        <div class="view-heat-legend-scale">
          <div class="view-heat-gradient" style="background:${buildHeatLegendGradient(style)}"></div>
          <div class="view-heat-legend-labels">
            <span>${escapeHtml(low)}</span>
            <span>${escapeHtml(high)}</span>
          </div>
        </div>
        ${widthMarkup}
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(value, maximumFractionDigits = 1) {
    return formatNumberForLocale(state.locale === 'zh-CN' ? 'zh-CN' : 'en-US', value, maximumFractionDigits);
  }

  function formatNumberForLocale(locale, value, maximumFractionDigits = 1) {
    const number = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 0,
    }).format(number);
  }

  function formatDuration(seconds) {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    return `${formatNumber(safe, 1)} ${t('units.seconds')}`;
  }

  function formatMeters(value) {
    return `${formatNumber(value, 1)} ${t('units.meters')}`;
  }

  function formatPercent(value) {
    return `${formatNumber(value, 1)}${t('units.percent')}`;
  }

  function formatMetricValue(value, maximumFractionDigits) {
    const digits = maximumFractionDigits ?? (Math.abs(Number(value) || 0) >= 100 ? 0 : 1);
    return formatNumber(value, digits);
  }

  function getFatigueThreshold() {
    const table = window.PlanarSim?.FATIGUE_THRESHOLDS || {};
    return table.default || 100;
  }

  function setChip(element, tone, text) {
    element.className = `status-chip ${tone}`;
    element.textContent = text;
  }

  function requestRender() {
    state.needsRender = true;
  }

  function requestPlaybackRender() {
    state.needsPlaybackRender = true;
  }

  function createHeatmapSourceInfo(source = 'none', options = {}) {
    return {
      source,
      phase: options.phase || 'idle',
      cacheHit: Boolean(options.cacheHit),
    };
  }

  function resetHeatmapSourceInfo() {
    state.heatmapSourceInfo = createHeatmapSourceInfo();
  }

  function setHeatmapSourceInfo(source, options = {}) {
    state.heatmapSourceInfo = createHeatmapSourceInfo(source, options);
    requestRender();
  }

  function getHeatmapSourceLabel(sourceInfo = state.heatmapSourceInfo) {
    if (sourceInfo?.source === 'localServiceUnavailable') {
      return state.locale === 'en' ? 'Local sim offline' : '本地仿真服务未连接';
    }
    return t(`mapSource.${sourceInfo?.source || 'none'}`);
  }

  function attachHeatmapSourceMeta(playback, sourceInfo = state.heatmapSourceInfo) {
    if (!playback) {
      return playback;
    }
    return {
      ...playback,
      meta: {
        ...(playback.meta || {}),
        source: sourceInfo?.source || 'none',
        cacheHit: Boolean(sourceInfo?.cacheHit),
      },
    };
  }

  function resetHeatmapComputationState() {
    state.heatmapComputeToken += 1;
    state.heatmapComputing = false;
    state.heatmapComputeProgress = 0;
    state.heatmapComputeStage = '';
    clearHeatCellMetricCache();
  }

  function normalizeHeatmapComputeStage(stage) {
    return String(stage || '').trim().replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  function setHeatmapComputeStage(stage) {
    const normalized = normalizeHeatmapComputeStage(stage);
    if (normalized) {
      state.heatmapComputeStage = normalized;
    }
  }

  function getHeatmapComputeStatusText() {
    const stage = normalizeHeatmapComputeStage(state.heatmapComputeStage);
    if (stage) {
      const text = getText(`loading.stage.${stage}`);
      if (text !== undefined) {
        return text;
      }
    }
    return t('loading.statusComputing');
  }

  function advanceHeatmapComputeProgress(nextProgress, options = {}) {
    const maximum = options.completed ? 1 : 0.99;
    const clamped = clamp(Number(nextProgress || 0), 0, maximum);
    state.heatmapComputeProgress = Math.max(
      clamp(Number(state.heatmapComputeProgress || 0), 0, 1),
      clamped
    );
  }

  function clearHeatCellMetricCache() {
    state.heatCellMetricCache = new Map();
    state.viewMetricRangeCache = new Map();
    state.revealedHeatCellsCache = new Map();
    state.heatRasterCache = new Map();
    state.visibleTraceSnapshotCache = null;
    state.playbackSnapshotCache = null;
    state.playbackFocusInspectionCache = null;
    state.backgroundPlaybackRenderState = null;
    state.heatmapRenderCache = null;
    state.heatRevealMaskCache = new Map();
    state.lastPlaybackOverlayRenderAt = 0;
    state.lastPlaybackUiPanelRenderAt = 0;
  }

  function resetHeatmapPlaybackDisplayState() {
    state.heatmapDisplayMode = 'playback';
    state.heatmapRevealLocked = false;
    state.heatmapRevealFrozenTime = null;
  }

  function lockHeatmapRevealAt(time) {
    const playback = getActivePlayback() || state.scenario?.precomputedPlayback || null;
    const fallbackTime = Number(state.scenario?.playbackRevealTime ?? playback?.startTime ?? state.scenario?.time ?? 0);
    const nextTime = Number.isFinite(Number(time)) ? Number(time) : fallbackTime;
    state.heatmapRevealFrozenTime = nextTime;
    state.heatmapDisplayMode = 'final';
    state.heatmapRevealLocked = true;
    clearHeatCellMetricCache();
  }

  function getProductName() {
    return t('app.productName');
  }

  function getDisplayFileName() {
    return (state.fileName || DEFAULT_FILE_NAME).trim() || DEFAULT_FILE_NAME;
  }

  function startFileNameEdit() {
    state.fileNameDraft = getDisplayFileName();
    state.isEditingFileName = true;
    requestRender();
    window.requestAnimationFrame(() => {
      if (!elements.appFileNameInput) {
        return;
      }
      elements.appFileNameInput.focus();
      elements.appFileNameInput.select();
    });
  }

  function stopFileNameEdit(options = {}) {
    const shouldSave = options.save !== false;
    if (shouldSave) {
      const nextName = String(state.fileNameDraft || '').trim();
      state.fileName = nextName || DEFAULT_FILE_NAME;
    } else {
      state.fileNameDraft = getDisplayFileName();
    }
    state.isEditingFileName = false;
    requestRender();
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  function buildLocalHeatmapPlaybackCacheKey(payload) {
    return stableStringify(payload);
  }

  function isUsableLocalHeatmapPlaybackCacheEntry(playback) {
    return Boolean(
      playback
      && playback.heat
      && Array.isArray(playback.traceSnapshots)
      && playback.traceSnapshots.length
    );
  }

  function readLocalHeatmapPlaybackCache(cacheKey) {
    const cached = state.localHeatmapPlaybackCache.get(cacheKey);
    return isUsableLocalHeatmapPlaybackCacheEntry(cached) ? cloneJson(cached) : null;
  }

  function isStableLocalHeatmapPlaybackCacheEntry(playback) {
    return Boolean(
      isUsableLocalHeatmapPlaybackCacheEntry(playback)
      && playback?.meta?.source
      && !playback?.meta?.llmDeferred
    );
  }

  function writePersistentLocalHeatmapPlaybackCache(cacheKey, playback) {
    if (!cacheKey || !isStableLocalHeatmapPlaybackCacheEntry(playback)) {
      return;
    }
    // Persistent storage is intentionally avoided for large playback payloads; the server cache covers reloads.
  }

  function writeLocalHeatmapPlaybackCache(cacheKey, playback) {
    if (!cacheKey || !isUsableLocalHeatmapPlaybackCacheEntry(playback)) {
      return;
    }
    state.localHeatmapPlaybackCache.delete(cacheKey);
    state.localHeatmapPlaybackCache.set(cacheKey, cloneJson(playback));
    while (state.localHeatmapPlaybackCache.size > LOCAL_HEATMAP_PLAYBACK_SESSION_CACHE_LIMIT) {
      const oldestKey = state.localHeatmapPlaybackCache.keys().next().value;
      state.localHeatmapPlaybackCache.delete(oldestKey);
    }
    writePersistentLocalHeatmapPlaybackCache(cacheKey, playback);
  }

  function delay(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, Math.max(0, Number(ms) || 0));
    });
  }

  function buildMergedRawModel(rawModel = state.rawModel || state.prepared?.rawData || null) {
    const merged = cloneJson(rawModel);
    if (Array.isArray(merged?.pressureObjects)) {
      merged.pressureObjects = merged.pressureObjects.map((item, index) => applyPressureOverrideToRawItem(item, state.editedPressureOverrides[index]));
    }
    return merged;
  }

  function getLocalSimServerUrl(pathname) {
    return `${LOCAL_SIM_SERVER_ORIGIN}${pathname}`;
  }

  function clearLocalServiceUnavailableState() {
    if (state.heatmapSourceInfo?.source === 'localServiceUnavailable') {
      resetHeatmapSourceInfo();
    }
    if (typeof state.heatmapRunError === 'string' && state.heatmapRunError.includes('8891 未连接')) {
      state.heatmapRunError = '';
    }
  }

  function isLocalSimConnectionError(error) {
    if (!error) {
      return false;
    }
    const message = String(error?.message || error || '');
    if (error?.name === 'AbortError') {
      return true;
    }
    return /Failed to fetch|NetworkError|Load failed|ERR_CONNECTION_REFUSED|fetch failed/i.test(message);
  }

  async function fetchJson(url, options = {}, timeoutMs = LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timerId = controller
      ? window.setTimeout(() => controller.abort(), Math.max(1, Number(timeoutMs) || LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS))
      : null;
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller?.signal,
      });
      const text = await response.text();
      return {
        response,
        body: text ? JSON.parse(text) : null,
      };
    } finally {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    }
  }

  async function probeLocalSimServerHealth(options = {}) {
    const force = options.force === true;
    const clearError = options.clearError !== false;
    const timeoutMs = Math.max(300, Number(options.timeoutMs) || LOCAL_SIM_SERVER_HEALTHCHECK_TIMEOUT_MS);
    const now = Date.now();
    const cacheAge = now - Number(state.localSimServerCheckedAt || 0);
    if (!force && state.localSimServerProbePromise) {
      return state.localSimServerProbePromise;
    }
    if (!force && state.localSimServerStatus === 'online' && cacheAge < LOCAL_SIM_SERVER_HEALTHCHECK_INTERVAL_MS) {
      return true;
    }
    state.localSimServerProbePromise = (async () => {
      try {
        const { response, body } = await fetchJson(getLocalSimServerUrl('/api/health'), {}, timeoutMs);
        const healthy = response.ok && Boolean(body?.ok);
        state.localSimServerStatus = healthy ? 'online' : 'offline';
        state.localSimServerCheckedAt = Date.now();
        if (healthy && clearError) {
          clearLocalServiceUnavailableState();
          requestRender();
        }
        return healthy;
      } catch (error) {
        state.localSimServerStatus = 'offline';
        state.localSimServerCheckedAt = Date.now();
        return false;
      } finally {
        state.localSimServerProbePromise = null;
      }
    })();
    return state.localSimServerProbePromise;
  }

  function startLocalSimHealthMonitor() {
    const probeVisiblePage = (force = false) => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      void probeLocalSimServerHealth({ force, clearError: true });
    };
    window.setInterval(() => {
      if (!state.heatmapRunError && state.heatmapSourceInfo?.source !== 'localServiceUnavailable') {
        return;
      }
      probeVisiblePage(false);
    }, LOCAL_SIM_SERVER_HEALTHCHECK_INTERVAL_MS);
    window.addEventListener('focus', () => probeVisiblePage(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        probeVisiblePage(true);
      }
    });
    probeVisiblePage(true);
  }

  function clonePlaybackPoint(point, fallback = null) {
    const source = point || fallback;
    if (!source) {
      return null;
    }
    return {
      x: Number(source.x || 0),
      y: Number(source.y || 0),
    };
  }

  function cloneBackgroundPlaybackAgent(agent) {
    return {
      id: agent?.id || null,
      active: Boolean(agent?.active),
      backgroundState: agent?.backgroundState || 'moving',
      position: clonePlaybackPoint(agent?.position),
    };
  }

  function cloneBackgroundPlaybackField(backgroundField) {
    if (!backgroundField) {
      return null;
    }
    return {
      version: backgroundField.version || 'background-field-playback',
      duration: Number(backgroundField.duration || 0),
      maxSimulationSeconds: Number(backgroundField.maxSimulationSeconds || 0),
      frameStepSeconds: Number(backgroundField.frameStepSeconds || 0),
      visualFrameStepSeconds: Number(backgroundField.visualFrameStepSeconds || backgroundField.frameStepSeconds || 0),
      initialTime: Number(backgroundField.initialTime || 0),
      initialAgents: Array.isArray(backgroundField.initialAgents)
        ? backgroundField.initialAgents.map((agent) => cloneBackgroundPlaybackAgent(agent))
        : [],
      frames: Array.isArray(backgroundField.frames)
        ? backgroundField.frames.map((frame) => ({
            time: Number(frame?.time || 0),
            agents: Array.isArray(frame?.agents)
              ? frame.agents.map((agent) => cloneBackgroundPlaybackAgent(agent))
              : [],
          }))
        : [],
      summary: backgroundField.summary ? { ...backgroundField.summary } : null,
    };
  }

  function getBackgroundPlaybackAgentTransitionDistance(leftAgent, rightAgent) {
    const left = leftAgent?.position || leftAgent || null;
    const right = rightAgent?.position || rightAgent || null;
    const lx = Number(left?.x);
    const ly = Number(left?.y);
    const rx = Number(right?.x);
    const ry = Number(right?.y);
    if (!Number.isFinite(lx) || !Number.isFinite(ly) || !Number.isFinite(rx) || !Number.isFinite(ry)) {
      return 0;
    }
    return Math.hypot(rx - lx, ry - ly);
  }

  function interpolateBackgroundPlaybackAgents(previousAgents, nextAgents, ratio) {
    const prevList = Array.isArray(previousAgents) ? previousAgents : [];
    const nextList = Array.isArray(nextAgents) ? nextAgents : [];
    if (!prevList.length && !nextList.length) {
      return [];
    }
    const prevById = new Map(prevList.map((agent, index) => [agent?.id || `prev-${index}`, agent]));
    const nextById = new Map(nextList.map((agent, index) => [agent?.id || `next-${index}`, agent]));
    const orderedIds = [];
    prevList.forEach((agent, index) => {
      orderedIds.push(agent?.id || `prev-${index}`);
    });
    nextList.forEach((agent, index) => {
      const id = agent?.id || `next-${index}`;
      if (!prevById.has(id)) {
        orderedIds.push(id);
      }
    });
    return orderedIds.map((id) => {
      const previous = prevById.get(id) || null;
      const current = nextById.get(id) || null;
      const anchor = ratio < 0.5 ? (previous || current) : (current || previous);
      if (!anchor) {
        return null;
      }
      const previousPosition = clonePlaybackPoint(previous?.position, current?.position || { x: 0, y: 0 });
      const currentPosition = clonePlaybackPoint(current?.position, previous?.position || { x: 0, y: 0 });
      const jumpDistance = getBackgroundPlaybackAgentTransitionDistance(previousPosition, currentPosition);
      const canInterpolate = previous && current && jumpDistance <= BACKGROUND_AGENT_INTERPOLATION_MAX_JUMP_METERS;
      const position = canInterpolate
        ? {
            x: previousPosition.x + (currentPosition.x - previousPosition.x) * ratio,
            y: previousPosition.y + (currentPosition.y - previousPosition.y) * ratio,
          }
        : (ratio < 0.5 ? previousPosition : currentPosition);
      return {
        ...anchor,
        id: anchor.id || id,
        position,
        active: current?.active !== undefined ? current.active : (previous?.active !== undefined ? previous.active : anchor.active),
        backgroundState: current?.backgroundState || previous?.backgroundState || anchor.backgroundState || 'moving',
      };
    }).filter(Boolean);
  }

  function getInterpolatedBackgroundPlaybackAgents() {
    const playbackState = state.backgroundPlaybackRenderState;
    if (!playbackState) {
      return getRenderableBackgroundAgents(state.scenario?.backgroundAgents || []);
    }
    const prevFrameAgents = Array.isArray(playbackState.prevFrame?.agents) ? playbackState.prevFrame.agents : [];
    const nextFrameAgents = Array.isArray(playbackState.nextFrame?.agents) ? playbackState.nextFrame.agents : [];
    return interpolateBackgroundPlaybackAgents(prevFrameAgents, nextFrameAgents, Number(playbackState.ratio || 0));
  }

  function samplePackedBackgroundTrajectoryPoint(trajectory, sampleTime) {
    const times = trajectory?.times;
    if (!Array.isArray(times) || !times.length) {
      return null;
    }
    if (!Number.isFinite(sampleTime) || sampleTime <= Number(times[0] || 0)) {
      return trajectory.samples?.[0] || null;
    }
    const lastIndex = times.length - 1;
    if (sampleTime >= Number(times[lastIndex] || 0)) {
      return trajectory.samples?.[lastIndex] || null;
    }
    let low = 0;
    let high = lastIndex;
    while (low < high) {
      const mid = Math.floor((low + high + 1) * 0.5);
      if (Number(times[mid] || 0) <= sampleTime) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    const previousIndex = Math.max(0, low);
    const nextIndex = Math.min(lastIndex, previousIndex + 1);
    const previousTime = Number(times[previousIndex] || 0);
    const nextTime = Number(times[nextIndex] || previousTime);
    const previous = trajectory.samples?.[previousIndex] || null;
    const next = trajectory.samples?.[nextIndex] || previous;
    if (!previous || !next) {
      return previous || next || null;
    }
    const span = Math.max(1e-6, nextTime - previousTime);
    const ratio = clamp((sampleTime - previousTime) / span, 0, 1);
    const jumpDistance = getBackgroundPlaybackAgentTransitionDistance(previous.position, next.position);
    const canInterpolate = jumpDistance <= BACKGROUND_AGENT_INTERPOLATION_MAX_JUMP_METERS;
    const position = canInterpolate
      ? {
          x: Number(previous.position?.x || 0) + (Number(next.position?.x || 0) - Number(previous.position?.x || 0)) * ratio,
          y: Number(previous.position?.y || 0) + (Number(next.position?.y || 0) - Number(previous.position?.y || 0)) * ratio,
        }
      : (ratio < 0.5 ? clonePlaybackPoint(previous.position) : clonePlaybackPoint(next.position));
    return {
      ...((ratio < 0.5 ? previous : next) || previous || next),
      position,
      active: ratio < 0.5 ? Boolean(previous.active) : Boolean(next.active),
      backgroundState: (ratio < 0.5 ? previous.backgroundState : next.backgroundState) || previous.backgroundState || next.backgroundState || 'moving',
    };
  }

  function ensureBackgroundPlaybackTrajectoryCache(backgroundField) {
    if (!backgroundField || !Array.isArray(backgroundField.frames) || !backgroundField.frames.length) {
      return null;
    }
    const cached = backgroundPlaybackTrajectoryCache.get(backgroundField);
    if (cached) {
      return cached;
    }
    const trajectories = new Map();
    backgroundField.frames.forEach((frame, frameIndex) => {
      const frameTime = Number(frame?.time || 0);
      const agents = Array.isArray(frame?.agents) ? frame.agents : [];
      agents.forEach((agent, agentIndex) => {
        const agentId = agent?.id || `background-agent-${frameIndex}-${agentIndex}`;
        if (!trajectories.has(agentId)) {
          trajectories.set(agentId, {
            id: agentId,
            times: [],
            samples: [],
          });
        }
        const trajectory = trajectories.get(agentId);
        trajectory.times.push(frameTime);
        trajectory.samples.push({
          id: agentId,
          active: agent?.active !== false,
          backgroundState: agent?.backgroundState || 'moving',
          position: clonePlaybackPoint(agent?.position),
        });
      });
    });
    const packed = {
      version: BACKGROUND_WEBGL_TRAJECTORY_CACHE_VERSION,
      trajectories,
      orderedIds: Array.from(trajectories.keys()),
      firstFrameTime: Number(backgroundField.frames[0]?.time || 0),
      lastFrameTime: Number(backgroundField.frames[backgroundField.frames.length - 1]?.time || 0),
    };
    backgroundPlaybackTrajectoryCache.set(backgroundField, packed);
    return packed;
  }

  function resolveLoopedBackgroundPlaybackFramePair(backgroundField, targetTime, options = {}) {
    const frames = Array.isArray(backgroundField?.frames) ? backgroundField.frames.filter(Boolean) : [];
    if (!frames.length) {
      return {
        sampleTime: 0,
        previousFrame: null,
        nextFrame: null,
        ratio: 0,
      };
    }

    const firstFrameTime = Number.isFinite(Number(frames[0]?.time)) ? Number(frames[0].time) : 0;
    const lastFrameTime = Number.isFinite(Number(frames[frames.length - 1]?.time))
      ? Number(frames[frames.length - 1].time)
      : firstFrameTime;
    const playbackDuration = Math.max(0, lastFrameTime - firstFrameTime);
    const loopStartTime = Number.isFinite(Number(options?.loopStartTime))
      ? Number(options.loopStartTime)
      : firstFrameTime;
    const loopEndTime = Number.isFinite(Number(options?.loopEndTime))
      ? Number(options.loopEndTime)
      : null;

    let sampleTime = Number.isFinite(Number(targetTime)) ? Number(targetTime) : firstFrameTime;
    if (Number.isFinite(loopEndTime) && sampleTime > lastFrameTime + 1e-9) {
      sampleTime = Math.min(sampleTime, lastFrameTime);
    } else if (playbackDuration > 1e-9 && sampleTime > lastFrameTime + 1e-9) {
      const loopOffset = Math.max(0, sampleTime - loopStartTime);
      sampleTime = firstFrameTime + (loopOffset % playbackDuration);
    }

    let prevIndex = frames.length - 1;
    let nextIndex = frames.length - 1;
    if (sampleTime <= firstFrameTime + 1e-9) {
      prevIndex = 0;
      nextIndex = Math.min(frames.length - 1, 1);
    } else {
      for (let index = 0; index < frames.length - 1; index += 1) {
        const leftTime = Number(frames[index]?.time || 0);
        const rightTime = Number(frames[index + 1]?.time || leftTime);
        if (sampleTime >= leftTime - 1e-9 && sampleTime <= rightTime + 1e-9) {
          prevIndex = index;
          nextIndex = index + 1;
          break;
        }
      }
    }

    const previousFrame = frames[prevIndex] || frames[0] || null;
    const nextFrame = frames[nextIndex] || previousFrame;
    const previousTime = Number(previousFrame?.time || firstFrameTime);
    const nextTime = Number(nextFrame?.time || previousTime);
    const span = nextTime - previousTime;
    const clampRatio = (value) => Math.min(1, Math.max(0, value));
    const ratio = span > 1e-6
      ? clampRatio((sampleTime - previousTime) / span)
      : 0;

    return {
      sampleTime,
      previousFrame,
      nextFrame,
      ratio,
    };
  }

  function getFocusCycleBackgroundSampleTime(playback, backgroundField, targetTime) {
    const frames = Array.isArray(backgroundField?.frames) ? backgroundField.frames.filter(Boolean) : [];
    const backgroundStartTime = Number.isFinite(Number(frames[0]?.time))
      ? Number(frames[0].time)
      : Number(backgroundField?.initialTime || 0);
    const playbackStartTime = Number.isFinite(Number(playback?.startTime)) ? Number(playback.startTime) : 0;
    const playbackEndTime = Number.isFinite(Number(playback?.endTime)) ? Number(playback.endTime) : playbackStartTime;
    const focusCycleDuration = Math.max(0, playbackEndTime - playbackStartTime);
    if (focusCycleDuration <= 1e-9) {
      return backgroundStartTime;
    }
    const elapsedInFocusCycle = Math.max(0, Number(targetTime || playbackStartTime) - playbackStartTime) % focusCycleDuration;
    return backgroundStartTime + elapsedInFocusCycle;
  }

  function normalizeLocalHeatmapPlayback(result) {
    const playback = result?.heat || result;
    if (!playback?.heat || !Array.isArray(playback?.traceSnapshots)) {
      throw new Error('本地仿真服务返回的热力图结果无效。');
    }
    const normalizedHeatCells = Array.isArray(playback.heat.cells) ? playback.heat.cells.map((cell) => ({ ...cell })) : [];
    const fallbackRaw = normalizedHeatCells.map((cell) => Number(cell.heat || 0));
    const fallbackPressureAcc = normalizedHeatCells.map((cell) => Number(cell.pressure || 0));
    const fallbackFatigueAcc = normalizedHeatCells.map((cell) => Number(cell.fatigue || 0));
    const fallbackProgressAcc = normalizedHeatCells.map((cell) => Number(cell.progress || 0));
    const pressureContributionLog = Array.isArray(playback.pressureContributionLog)
      ? playback.pressureContributionLog.map((item) => ({ ...item }))
      : (Array.isArray(playback.heat?.pressureContributionLog)
        ? playback.heat.pressureContributionLog.map((item) => ({ ...item }))
        : []);
    const normalizedHeat = playback.heat
      ? {
          ...playback.heat,
          cells: normalizedHeatCells,
          raw: Array.isArray(playback.heat.raw) ? playback.heat.raw.map((value) => Number(value || 0)) : fallbackRaw,
          pressureAcc: Array.isArray(playback.heat.pressureAcc) ? playback.heat.pressureAcc.map((value) => Number(value || 0)) : fallbackPressureAcc,
          fatigueAcc: Array.isArray(playback.heat.fatigueAcc) ? playback.heat.fatigueAcc.map((value) => Number(value || 0)) : fallbackFatigueAcc,
          progressAcc: Array.isArray(playback.heat.progressAcc) ? playback.heat.progressAcc.map((value) => Number(value || 0)) : fallbackProgressAcc,
          cellByIndex: Object.fromEntries(normalizedHeatCells.map((cell) => [cell.index, cell])),
        }
      : null;
    return {
      traceSnapshots: playback.traceSnapshots.map((item) => ({ ...item })),
      pressureContributionLog,
      pressureRange: playback.pressureRange ? { ...playback.pressureRange } : { min: 0, max: 0 },
      duration: Number(playback.duration || 0),
      startTime: Number(playback.startTime || 0),
      endTime: Number(playback.endTime || 0),
      heat: normalizedHeat,
      hotspots: Array.isArray(playback.hotspots) ? playback.hotspots.map((item) => ({ ...item })) : [],
      suggestions: Array.isArray(playback.suggestions) ? playback.suggestions.slice() : [],
      summary: playback.summary ? { ...playback.summary } : (result?.summary ? { ...result.summary } : null),
      backgroundField: cloneBackgroundPlaybackField(playback.backgroundField),
      llmDecisionPlan: playback.llmDecisionPlan ? JSON.parse(JSON.stringify(playback.llmDecisionPlan)) : null,
      meta: {
        ...(result?.meta ? { ...result.meta } : {}),
        cacheHit: Boolean(result?.cacheHit || result?.meta?.cacheHit),
        source: result?.meta?.source || null,
        llmDecisionPlan: result?.meta?.llmDecisionPlan ? JSON.parse(JSON.stringify(result.meta.llmDecisionPlan)) : null,
      },
    };
  }

  async function fetchHeatmapJobResult(jobId, computeToken) {
    let transientFailureCount = 0;
    while (state.heatmapComputeToken === computeToken) {
      await delay(LOCAL_SIM_SERVER_JOB_POLL_INTERVAL_MS);
      let response;
      let body;
      try {
        ({ response, body } = await fetchJson(getLocalSimServerUrl(`/api/heatmap/jobs/${encodeURIComponent(jobId)}`), {}, LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS));
        transientFailureCount = 0;
      } catch (error) {
        if (state.heatmapComputeToken !== computeToken) {
          return null;
        }
        if (isLocalSimConnectionError(error) && transientFailureCount < LOCAL_SIM_SERVER_JOB_RETRY_LIMIT) {
          transientFailureCount += 1;
          continue;
        }
        throw error;
      }
      if (state.heatmapComputeToken !== computeToken) {
        return null;
      }
      if (!response.ok) {
        throw new Error(body?.error || `本地仿真服务任务查询失败（${response.status}）`);
      }
      setHeatmapComputeStage(body?.stage);
      advanceHeatmapComputeProgress(Number(body?.progress || 0), {
        completed: body?.status === 'completed',
      });
      requestRender();
      if (body?.status === 'completed') {
        return normalizeLocalHeatmapPlayback(body.result);
      }
      if (body?.status === 'failed') {
        throw new Error(body?.error || '本地仿真服务任务执行失败。');
      }
    }
    return null;
  }

  async function fetchLocalHeatmapPlayback(computeToken) {
    const payload = {
      simData: buildMergedRawModel(),
      healthyAgents: HEALTHY_AGENTS,
      scenarioOptions: buildScenarioOptions(),
      heatOptions: {
        ...DEFAULT_HEAT_OPTIONS,
      },
    };
    const cacheKey = buildLocalHeatmapPlaybackCacheKey(payload);
    const cached = readLocalHeatmapPlaybackCache(cacheKey);
    if (cached) {
      state.heatmapComputeStage = '';
      advanceHeatmapComputeProgress(1, { completed: true });
      setHeatmapSourceInfo('localCache', { phase: 'ready', cacheHit: true });
      requestRender();
      return attachHeatmapSourceMeta(cached, state.heatmapSourceInfo);
    }
    const { response, body } = await fetchJson(getLocalSimServerUrl('/api/heatmap/jobs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }, LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS);
    if (state.heatmapComputeToken !== computeToken) {
      return null;
    }
    if (response.status === 200) {
      state.heatmapComputeStage = '';
      advanceHeatmapComputeProgress(1, { completed: true });
      setHeatmapSourceInfo('localCache', { phase: 'ready', cacheHit: true });
      requestRender();
      const normalizedPlayback = attachHeatmapSourceMeta(normalizeLocalHeatmapPlayback(body?.result || body), state.heatmapSourceInfo);
      writeLocalHeatmapPlaybackCache(cacheKey, normalizedPlayback);
      return normalizedPlayback;
    }
    if (response.status === 202 && body?.jobId) {
      setHeatmapComputeStage(body?.stage);
      advanceHeatmapComputeProgress(Math.max(0.02, Number(body?.progress || 0)));
      requestRender();
      const playback = await fetchHeatmapJobResult(body.jobId, computeToken);
      if (playback && state.heatmapComputeToken === computeToken) {
        setHeatmapSourceInfo('localService', { phase: 'ready', cacheHit: false });
      }
      const resolvedPlayback = attachHeatmapSourceMeta(playback, state.heatmapSourceInfo);
      writeLocalHeatmapPlaybackCache(cacheKey, resolvedPlayback);
      return resolvedPlayback;
    }
    throw new Error(body?.error || `本地仿真服务请求失败（${response.status}）`);
  }

  async function requestBackgroundFieldPrewarmForModel(rawData) {
    if (!rawData) {
      return;
    }
    try {
      await fetchJson(getLocalSimServerUrl('/api/background-field/prewarm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simData: rawData,
          healthyAgents: HEALTHY_AGENTS,
          scenarioOptions: {
            crowdPresetId: 'normal',
            focusProfile: {},
          },
          heatOptions: {
            maxSimulationSeconds: 480,
          },
        }),
      });
    } catch (error) {
      // Prewarm is opportunistic; analysis still works through the normal job path.
    }
  }

  async function precomputeHeatmapPlaybackInBrowser(computeToken) {
    const playback = await Sim.precomputeHeatPlaybackAsync(
      state.prepared,
      state.scenario,
      {
        ...DEFAULT_HEAT_OPTIONS,
        frameBudgetMs: 12,
        onProgress: ({ simulatedSeconds, maxSimulationSeconds, firstPassComplete }) => {
          if (state.heatmapComputeToken !== computeToken) {
            return;
          }
          const rawProgress = maxSimulationSeconds > 1e-6
            ? simulatedSeconds / maxSimulationSeconds
            : 0;
          if (firstPassComplete) {
            advanceHeatmapComputeProgress(1, { completed: true });
          } else {
            advanceHeatmapComputeProgress(rawProgress);
          }
          requestRender();
        },
      }
    );
    return attachHeatmapSourceMeta(playback, state.heatmapSourceInfo);
  }

  function syncAgentDraftFromInputs() {
    const nextDraft = {
      capacityScores: FIVE_DIMENSION_ORDER.reduce((scores, id) => {
        scores[id] = Number(elements.capacityInputs[id]?.value || DEFAULT_CAPACITY_SCORES[id]);
        return scores;
      }, {}),
    };
    state.agentModal.draft = createAgentDraft(nextDraft);
  }

  function applyAgentDraftToInputs(draft = state.agentModal.draft) {
    const normalizedDraft = createAgentDraft(draft);
    renderCapacityControls(normalizedDraft);
  }

  function getCurrentAgentSummary() {
    const profile = createFocusProfile(state.focusProfile || {});
    const capacitySummary = buildDimensionSummaryEntries(profile.capacityScores, {}, state.locale)
      .map((item) => `${item.capacityLabel}${item.capacityScoreLabel}`)
      .join(' · ');
    return `
      <div class="summary-line"><strong>${escapeHtml(t('label.agentProfile'))}</strong></div>
      <div class="summary-line">${escapeHtml(capacitySummary)}</div>
    `;
  }

  function getCurrentFocusInspection() {
    if (!state.prepared || !state.scenario) {
      return null;
    }
    return augmentInspectionWithComposite(
      getPlaybackFocusInspection() || Sim.inspectAgent(state.prepared, state.scenario, state.scenario.focusAgentId)
    );
  }

  function augmentInspectionWithComposite(inspection) {
    if (!inspection) {
      return null;
    }
    const burdenScores = cloneDimensionScoreMap(inspection.burdenScores || {});
    return {
      ...inspection,
      burdenScores,
    };
  }

  function getViewMetricValues(viewMode = getSafeViewMode(state.viewMode), options = {}) {
    if (!state.prepared || !state.scenario?.heatActive) {
      return [];
    }
    const playback = getActivePlayback();
    const heatState = playback?.heat || state.scenario?.heat || null;
    const metricId = getSafeViewMode(viewMode);
    const traceRevealRadiusMeters = getTraceRevealRadiusMeters(metricId);
    const metricCells = options.fullReveal || isHeatmapFullyRevealed(playback)
      ? getFinalHeatCells(heatState, getPlaybackTraceSnapshots(playback), metricId, traceRevealRadiusMeters)
      : getRevealedHeatCells(heatState, getHeatmapRevealTraceSnapshots(playback), metricId, traceRevealRadiusMeters);
    return metricCells
      .map((cell) => Number(cell.metric || 0))
      .filter((value) => Number.isFinite(value));
  }

  function getCurrentViewMetricValues() {
    return getViewMetricValues(getSafeViewMode(state.viewMode));
  }

  function getViewMetricRange(viewMode = getSafeViewMode(state.viewMode)) {
    if (!state.prepared || !state.scenario?.heatActive) {
      return { min: 0, max: 0, minMetric: 0, maxMetric: 0 };
    }
    const playback = getActivePlayback();
    const heatState = playback?.heat || state.scenario?.heat || null;
    const metricId = getSafeViewMode(viewMode);
    const traceSnapshots = getPlaybackTraceSnapshots(playback);
    const cacheKey = `${metricId}:final`;
    const cached = state.viewMetricRangeCache?.get(cacheKey);
    if (cached && cached.heatState === heatState && cached.traceSnapshots === traceSnapshots) {
      return cached.range;
    };
    const traceRevealRadiusMeters = getTraceRevealRadiusMeters(metricId);
    const metricCells = getFinalHeatCells(heatState, traceSnapshots, metricId, traceRevealRadiusMeters);
    let minMetric = Number.POSITIVE_INFINITY;
    let maxMetric = 0;
    metricCells.forEach((cell) => {
      const value = Number(cell.metric || 0);
      if (!Number.isFinite(value)) {
        return;
      }
      minMetric = Math.min(minMetric, value);
      maxMetric = Math.max(maxMetric, value);
    });
    if (!Number.isFinite(minMetric)) {
      minMetric = 0;
    }
    const range = {
      min: minMetric,
      max: maxMetric,
      minMetric,
      maxMetric,
    };
    if (!(state.viewMetricRangeCache instanceof Map)) {
      state.viewMetricRangeCache = new Map();
    }
    state.viewMetricRangeCache.set(cacheKey, { heatState, traceSnapshots, range });
    return range;
  }

  function syncRangeSliderProgress(element) {
    if (!element) {
      return;
    }
    const min = Number(element.min || 0);
    const max = Number(element.max || 100);
    const value = Number(element.value || min);
    const ratio = max > min ? (value - min) / (max - min) : 0;
    const percent = Math.min(1, Math.max(0, ratio)) * 100;
    element.style.setProperty('--crowd-progress', `${percent}%`);
  }

  function formatMovementBehaviorLabel(value, locale = state.locale) {
    const zh = {
      normal_walk: '正常通行',
      slow_walk: '减速通行',
      crowd_blocked: '拥挤受阻',
      wall_follow: '贴边通行',
      queue_blocked: '排队受阻',
      vertical_transfer_decision: '垂直换乘迟滞',
      severely_blocked: '严重受阻',
    };
    const en = {
      normal_walk: 'Walking',
      slow_walk: 'Slow Walk',
      crowd_blocked: 'Crowd Blocked',
      wall_follow: 'Wall Follow',
      queue_blocked: 'Queue Blocked',
      vertical_transfer_decision: 'Transfer Delay',
      severely_blocked: 'Severely Blocked',
    };
    const mapping = locale === 'en' ? en : zh;
    return mapping[value] || String(value || '--');
  }

  function formatMovementCauseLabel(value, locale = state.locale) {
    const zh = {
      speed: '基础行动受限',
      crowd: '拥挤阻力',
      vertical: '垂直换乘',
      queue: '排队阻塞',
      narrow: '狭窄通道',
      assistive: '辅助依赖',
      obstacle: '避障成本',
    };
    const en = {
      speed: 'Base Mobility Limit',
      crowd: 'Crowding',
      vertical: 'Vertical Transfer',
      queue: 'Queueing',
      narrow: 'Narrow Passage',
      assistive: 'Assistive Dependence',
      obstacle: 'Obstacle Avoidance',
    };
    const mapping = locale === 'en' ? en : zh;
    return mapping[value] || String(value || '--');
  }

  function getSeatLabelById(seatId) {
    const normalizedSeatId = String(seatId || '').trim();
    if (!normalizedSeatId || !Array.isArray(state.prepared?.seats)) {
      return null;
    }
    const seat = state.prepared.seats.find((item) => item?.id === normalizedSeatId);
    return seat ? (seat.label || seat.name || seat.id || null) : null;
  }

  function formatCurrentStatusLabel(inspection, locale = state.locale) {
    if (!inspection) {
      return '--';
    }
    const restState = String(inspection.restState || '').trim() || 'none';
    const movementBehavior = inspection.movementBehavior
      || inspection.fiveDimensions?.burdens?.locomotor?.movementBehavior
      || inspection.fiveDimensions?.burdens?.locomotor?.behavior
      || null;
    const decisionDiagnostics = inspection.decisionDiagnostics || inspection.fiveDimensions?.burdens?.cognitive || null;
    const problemSignCount = Number(decisionDiagnostics?.problemSignCount || 0);
    const branchCount = Number(decisionDiagnostics?.branchCount || 0);
    const recheckProbability = Number(decisionDiagnostics?.recheckProbability || 0);
    const guideReviewPauseTime = Number(decisionDiagnostics?.guideReviewPauseTime || 0);

    if (restState === 'searching') {
      return locale === 'en' ? 'Searching for Seat' : '找座位';
    }
    if (restState === 'short-rest') {
      return locale === 'en' ? 'Short Rest' : '短暂休息';
    }
    if (restState === 'sitting') {
      return locale === 'en' ? 'Seated Rest' : '座位休息';
    }
    if (restState === 'standing') {
      return locale === 'en' ? 'Standing Rest' : '站立休息';
    }
    if (inspection.queueLocked || movementBehavior === 'queue_blocked') {
      return locale === 'en' ? 'Queueing' : '排队等待';
    }
    if (
      decisionDiagnostics?.decisionNodeId
      && (problemSignCount > 0 || branchCount > 1 || recheckProbability >= 0.12 || guideReviewPauseTime >= 0.12)
    ) {
      return locale === 'en' ? 'Confirming Direction' : '确认方向';
    }
    if (movementBehavior) {
      return formatMovementBehaviorLabel(movementBehavior, locale);
    }
    return '--';
  }

  function formatRestMarginLabel(inspection) {
    if (!inspection) {
      return '--';
    }
    const fatigue = Number(inspection.fatigue || 0);
    const fatigueThreshold = Number(inspection.fatigueThreshold || 0);
    if (!Number.isFinite(fatigueThreshold) || fatigueThreshold <= 1e-6) {
      return '--';
    }
    const restMarginPercent = clamp(((fatigueThreshold - fatigue) / fatigueThreshold) * 100, 0, 100);
    return `${formatNumber(restMarginPercent, 0)}%`;
  }

  function inferDecisionFocusFromTarget(inspection, locale = state.locale) {
    if (!inspection) {
      return null;
    }
    const selectedTargetNode = inspection.selectedTargetNodeId
      ? state.prepared?.nodeById?.[inspection.selectedTargetNodeId] || null
      : null;
    const selectedTargetNodeLabel = normalizeCategoryText(String(
      (locale === 'en'
        ? (selectedTargetNode?.displayLabelEn || selectedTargetNode?.displayLabel || selectedTargetNode?.id)
        : (selectedTargetNode?.displayLabel || selectedTargetNode?.displayLabelEn || selectedTargetNode?.id))
      || inspection.selectedTargetNodeLabel || ''
    ));
    if (!selectedTargetNodeLabel) {
      return null;
    }
    if (selectedTargetNodeLabel.includes('lift') || selectedTargetNodeLabel.includes('elevator')) {
      return locale === 'en' ? 'Elevator' : '电梯';
    }
    if (selectedTargetNodeLabel.includes('exit') || selectedTargetNodeLabel.includes('gate')) {
      return locale === 'en' ? 'Exit' : '出口';
    }
    if (
      selectedTargetNodeLabel.includes('line')
      || selectedTargetNodeLabel.includes('platform')
      || selectedTargetNodeLabel.includes('tsuen wan')
      || selectedTargetNodeLabel.includes('chai wan')
      || selectedTargetNodeLabel.includes('kennedy')
    ) {
      return locale === 'en' ? 'Platform' : '站台';
    }
    return locale === 'en' ? 'Route' : '路径';
  }

  function formatDecisionFocusFromSource(source, locale = state.locale) {
    if (!source) {
      return null;
    }
    const categoryId = getPressureLayerCategory(source);
    const combined = normalizeCategoryText([
      source.name,
      source.feature,
      source.category,
      source.sourceKind,
    ].filter(Boolean).join(' '));
    if (categoryId === 'noise' || combined.includes('noise') || combined.includes('decibel')) {
      return locale === 'en' ? 'Noise' : '噪音';
    }
    if (categoryId === 'flashing-ads' || categoryId === 'static-ads' || combined.includes('advert')) {
      return locale === 'en' ? 'Ads' : '广告';
    }
    if (
      categoryId === 'common-direction-signs'
      || categoryId === 'ai-virtual-service-ambassador'
      || categoryId === 'customer-service-centre'
      || combined.includes('sign')
      || combined.includes('guide')
      || combined.includes('service')
    ) {
      return locale === 'en' ? 'Signage' : '标识';
    }
    if (combined.includes('lift') || combined.includes('elevator')) {
      return locale === 'en' ? 'Elevator' : '电梯';
    }
    if (isLightingPressureLike(source, categoryId) || combined.includes('light') || combined.includes('lux')) {
      return locale === 'en' ? 'Lighting' : '光照';
    }
    if (combined.includes('seat')) {
      return locale === 'en' ? 'Seat' : '座位';
    }
    if (combined.includes('queue')) {
      return locale === 'en' ? 'Queue' : '排队';
    }
    return null;
  }

  function formatDecisionFocusLabel(inspection, locale = state.locale) {
    if (!inspection) {
      return '--';
    }
    const restState = String(inspection.restState || '').trim() || 'none';
    const topPressureSource = Array.isArray(inspection.topPressureSources) ? inspection.topPressureSources[0] || null : null;
    const decisionDiagnostics = inspection.decisionDiagnostics || inspection.fiveDimensions?.burdens?.cognitive || null;
    const movementMainCause = inspection.movementMainCause
      || inspection.fiveDimensions?.burdens?.locomotor?.movementMainCause
      || null;

    if (restState === 'searching' || restState === 'sitting' || restState === 'standing') {
      return locale === 'en' ? 'Seat' : '座位';
    }
    if (inspection.queueLocked || movementMainCause === 'queue') {
      return locale === 'en' ? 'Queue' : '排队';
    }
    if (Number(decisionDiagnostics?.problemSignCount || 0) > 0) {
      return locale === 'en' ? 'Signage' : '标识';
    }
    if (topPressureSource) {
      const focusFromSource = formatDecisionFocusFromSource(topPressureSource, locale);
      if (focusFromSource) {
        return focusFromSource;
      }
    }
    if (Number(decisionDiagnostics?.branchCount || 0) > 1) {
      return locale === 'en' ? 'Route' : '路径';
    }
    if (movementMainCause === 'crowd') {
      return locale === 'en' ? 'Crowd' : '人群';
    }
    if (movementMainCause === 'obstacle' || movementMainCause === 'narrow') {
      return locale === 'en' ? 'Passage' : '通道';
    }
    return inferDecisionFocusFromTarget(inspection, locale) || '--';
  }

  function buildVisualizationStatusLabelMarkup(item, locale = state.locale) {
    const label = escapeHtml(item.label || '--');
    const classNames = [
      'visualization-status-card__label',
      item.multilineLabel ? 'is-multiline' : null,
      item.nowrapLabel ? 'is-nowrap' : null,
    ].filter(Boolean).join(' ');
    if (item.multilineLabel && locale === 'en' && Array.isArray(item.labelLines) && item.labelLines.length) {
      return `<div class="${classNames}">${item.labelLines.map((line) => escapeHtml(line)).join('<br>')}</div>`;
    }
    return `<div class="${classNames}">${label}</div>`;
  }

  function buildVisualizationStatusValueMarkup(item, locale = state.locale) {
    const rawValue = String(item?.value ?? '--');
    const shouldSplitCurrentStateValue = (
      item?.id === 'currentState'
      && locale === 'en'
    );
    if (shouldSplitCurrentStateValue) {
      const words = rawValue.trim().split(/\s+/).filter(Boolean);
      if (words.length === 2 && words.every((word) => /^[A-Za-z][A-Za-z-]*$/.test(word))) {
        return `<div class="visualization-status-card__value is-multiline">${words.map((word) => escapeHtml(word)).join('<br>')}</div>`;
      }
    }
    return `<div class="visualization-status-card__value">${escapeHtml(rawValue)}</div>`;
  }

  function getCongestionLabel(value = 0, locale = state.locale) {
    const density = Math.max(0, Number(value) || 0);
    if (locale === 'en') {
      if (density >= 3.5) return `High · ${formatNumber(density, 2)}`;
      if (density >= 1.8) return `Medium · ${formatNumber(density, 2)}`;
      return `Low · ${formatNumber(density, 2)}`;
    }
    if (density >= 3.5) return `高 · ${formatNumber(density, 2)}`;
    if (density >= 1.8) return `中 · ${formatNumber(density, 2)}`;
    return `低 · ${formatNumber(density, 2)}`;
  }

  function getDynamicSummaryState() {
    const inspection = getCurrentFocusInspection();
    const metricRange = getViewMetricRange(getSafeViewMode(state.viewMode));
    const fallbackMax = Number(
      inspection?.burdenScores?.[getSafeViewMode(state.viewMode)]
      || state.scenario?.heat?.maxHeat
      || 0
    );
    const renderableBackgroundCount = getRenderableBackgroundAgents(state.scenario?.backgroundAgents || []).length;
    const simultaneousCount = renderableBackgroundCount;
    const travelTime = typeof InspectorUtils.getCurrentTravelTimeSeconds === 'function'
      ? InspectorUtils.getCurrentTravelTimeSeconds({
        inspectionTime: inspection?.time,
        playbackTime: state.scenario?.playbackRevealTime,
        scenarioTime: state.scenario?.time,
      })
      : Math.max(0, Number(inspection?.time ?? state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0) || 0);
    const normalizedMetricRange = typeof InspectorUtils.getMetricRange === 'function'
      ? InspectorUtils.getMetricRange(
        [metricRange.minMetric, metricRange.maxMetric].filter((value) => Number.isFinite(Number(value))),
        fallbackMax
      )
      : {
        minMetric: Number(metricRange.minMetric || 0),
        maxMetric: Math.max(Number(metricRange.maxMetric || 0), Math.max(0, fallbackMax)),
      };
    return {
      simultaneousCount,
      travelTime,
      progress: Number(inspection?.progress || 0),
      minHeat: Number(normalizedMetricRange.minMetric || 0),
      maxHeat: Number(normalizedMetricRange.maxMetric || 0),
    };
  }

  function getInspectorAgentSummaryMarkup() {
    const profile = createFocusProfile(state.focusProfile || {});
    if (state.selectedDynamic?.kind !== 'focus-agent') {
      return `<div class="support-text">${escapeHtml(t('hint.agentProfilePrompt'))}</div>`;
    }
    const inspection = getCurrentFocusInspection();
    const panelState = typeof InspectorUtils.buildAgentProfilePanelState === 'function'
      ? InspectorUtils.buildAgentProfilePanelState({
        selectedDynamicKind: state.selectedDynamic?.kind || null,
        profile,
        inspection,
      })
      : {
        mode: state.selectedDynamic?.kind === 'focus-agent' ? 'details' : 'hint',
        fieldState: typeof InspectorUtils.buildAgentProfileFieldState === 'function'
          ? InspectorUtils.buildAgentProfileFieldState({ profile, inspection })
          : null,
      };
    if (panelState.mode !== 'details' || !inspection || !panelState.fieldState) {
      return `<div class="support-text">${escapeHtml(t('hint.agentProfilePrompt'))}</div>`;
    }
    const fieldState = panelState.fieldState;
    const staticEntries = `<strong>${escapeHtml(t('label.agentProfile'))}</strong>`;
    const capacityEntries = buildDimensionSummaryEntries(profile.capacityScores, {}, state.locale)
      .map((item) => `<div>${escapeHtml(item.capacityLabel)}: ${escapeHtml(item.capacityScoreLabel || String(item.capacityScore || 0))}</div>`)
      .join('');
    const dynamicEntries = (fieldState?.dynamicFields || []).map((item) => {
      if (item.id === 'progress') {
        return `<div>${escapeHtml(t('label.progress'))}: ${escapeHtml(formatPercent((item.value || 0) * 100))}</div>`;
      }
      if (item.id === 'visionRadius') {
        return `<div>${escapeHtml(t('label.visionRadius'))}: ${escapeHtml(formatMeters(item.value || 0))}</div>`;
      }
      if (item.id === 'environmentNoise') {
        return `<div>${escapeHtml(t('label.environmentNoise'))}: ${escapeHtml(formatMetricValue(item.value || 0))} ${escapeHtml(t('units.decibel'))}</div>`;
      }
      if (item.id === 'environmentLighting') {
        return `<div>${escapeHtml(t('label.environmentLighting'))}: ${escapeHtml(formatMetricValue(item.value || 0))} ${escapeHtml(t('units.lux'))}</div>`;
      }
      if (item.id === 'queueCount') {
        return `<div>${escapeHtml(t('label.queueCount'))}: ${escapeHtml(formatMetricValue(item.value || 0, 0))}</div>`;
      }
      if (item.id === 'walkingSpeed') {
        return `<div>${escapeHtml(t('label.walkingSpeed'))}: ${escapeHtml(formatNumber(item.value || 0, 2))} ${escapeHtml(t('units.perSecond'))}</div>`;
      }
      if (item.id === 'decisionDelay') {
        return `<div>${escapeHtml(t('label.decisionDelay'))}: ${escapeHtml(formatNumber(item.value || 0, 2))} ${escapeHtml(t('units.seconds'))}</div>`;
      }
      if (item.id === 'movementBehavior') {
        return `<div>${escapeHtml(t('label.movementBehavior'))}: ${escapeHtml(formatMovementBehaviorLabel(item.value))}</div>`;
      }
      if (item.id === 'movementMainCause') {
        return `<div>${escapeHtml(t('label.movementMainCause'))}: ${escapeHtml(formatMovementCauseLabel(item.value))}</div>`;
      }
      if (item.id === 'movementSpeedFactor') {
        return `<div>${escapeHtml(t('label.movementSpeedFactor'))}: ${escapeHtml(formatNumber((item.value || 0) * 100, 0))}%</div>`;
      }
      return `<div>${escapeHtml(t(`label.${item.id}`))}: ${escapeHtml(formatMetricValue(item.value || 0))}</div>`;
    }).join('');
    const burdenEntries = fieldState
      ? buildDimensionSummaryEntries(profile.capacityScores, Object.fromEntries(fieldState.burdenFields.map((item) => [item.id, item.value])), state.locale)
        .map((item) => `<div>${escapeHtml(item.burdenLabel)}: ${escapeHtml(formatMetricValue(item.burdenScore || 0))}</div>`)
        .join('')
      : '';
    return `
      ${staticEntries}
      ${capacityEntries}
      ${dynamicEntries}
      ${burdenEntries}
    `;
  }

  function getSelectedIssueSource() {
    if (!state.prepared) {
      return null;
    }
    const hotspot = getHotspotById(state.selectedHotspotId);
    if (hotspot) {
      return hotspot;
    }
    if (state.selectedObject?.type === 'pressure') {
      const item = getObjectBySelection(state.selectedObject);
      if (!item) {
        return null;
      }
      return {
        id: item.id,
        name: item.name || item.id,
        category: item.category,
        feature: item.feature,
        pressure: Number(item.strength || 0),
      };
    }
    return null;
  }

  function getInspectionIssueItems(inspection = getDynamicInspection()) {
    if (!inspection || typeof InspectorUtils.buildInspectionIssueItems !== 'function') {
      return [];
    }
    return InspectorUtils.buildInspectionIssueItems({
      inspection,
      topPressureSources: inspection?.topPressureSources || [],
      viewMode: state.viewMode,
      locale: state.locale,
    });
  }

  function resolveHotspotTargets(hotspot) {
    if (!state.prepared || !hotspot) {
      return [];
    }
    const targetIds = Array.from(new Set([
      ...(Array.isArray(hotspot.mapTargetIds) ? hotspot.mapTargetIds : []),
      hotspot.mapTargetId,
      hotspot.mapTargetId === undefined ? hotspot.id : null,
    ].filter(Boolean)));
    return targetIds
      .map((targetId) => {
        const pressureItem = state.prepared.pressureById?.[targetId]
          || state.prepared.pressureObjects?.find((item) => item.id === targetId);
        if (pressureItem) {
          return { type: 'pressure', item: pressureItem };
        }
        const node = state.prepared.nodeById?.[targetId];
        if (node) {
          return { type: 'node', item: node };
        }
        const seat = state.prepared.seats?.find((item) => item.id === targetId) || null;
        if (seat) {
          return { type: 'seat', item: seat };
        }
        return null;
      })
      .filter(Boolean);
  }

  function resolveHotspotTarget(hotspot) {
    return resolveHotspotTargets(hotspot)[0] || null;
  }

  function getIssuePanelState() {
    if (!state.selectedDynamic) {
      return {
        mode: 'hint',
        items: [],
        summary: '',
      };
    }
    const inspection = getDynamicInspection();
    const topPressureSources = inspection?.topPressureSources || [];
    const selectedIssue = getSelectedIssueSource();
    if (typeof InspectorUtils.buildIssuePanelState === 'function') {
      return InspectorUtils.buildIssuePanelState({
        inspection,
        topPressureSources,
        selectedIssue,
        viewMode: state.viewMode,
        locale: state.locale,
      });
    }
    const items = (topPressureSources.length ? topPressureSources : (selectedIssue ? [selectedIssue] : []))
      .slice(0, 3)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    return {
      mode: items.length ? 'issues' : 'hint',
      items,
    };
  }

  function getVisualizationDetailIssuePanelState(activeView = getSafeViewMode(state.visualizationDetailView || state.viewMode)) {
    const inspection = state.scenario ? getCurrentFocusInspection() : null;
    if (!inspection) {
      return {
        mode: 'hint',
        items: [],
        summary: '',
      };
    }
    const topPressureSources = inspection?.topPressureSources || [];
    const selectedIssue = getSelectedIssueSource();
    if (typeof InspectorUtils.buildIssuePanelState === 'function') {
      return InspectorUtils.buildIssuePanelState({
        inspection,
        topPressureSources,
        selectedIssue,
        viewMode: activeView,
        locale: state.locale,
      });
    }
    const items = (topPressureSources.length ? topPressureSources : (selectedIssue ? [selectedIssue] : []))
      .slice(0, activeView === COMPOSITE_BURDEN_VIEW ? 5 : 3)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    return {
      mode: items.length ? 'issues' : 'hint',
      items,
      summary: '',
    };
  }

  function itemMatchesHotspotSelection(item, selectedId = state.selectedHotspotId) {
    if (!item || !selectedId) {
      return false;
    }
    return item.id === selectedId
      || item.mapTargetId === selectedId
      || (Array.isArray(item.mapTargetIds) && item.mapTargetIds.includes(selectedId));
  }

  function getVisualizationDetailDisplayedHotspots(activeView = getSafeViewMode(state.visualizationDetailView || state.viewMode)) {
    const panelState = getVisualizationDetailIssuePanelState(activeView);
    if (panelState.mode !== 'issues') {
      return [];
    }
    return panelState.items.filter((item) => resolveHotspotTargets(item)
      .some((target) => target.type === 'pressure' || target.type === 'seat'));
  }

  function getBackgroundCrowdCount() {
    return Math.max(100, Math.min(3190, Math.round(Number(state.backgroundCrowd) || DEFAULT_BACKGROUND_CROWD)));
  }

  function getCategoryDefinition(categoryId) {
    return LAYER_CATEGORY_DEFINITIONS.find((item) => item.id === categoryId) || null;
  }

  function normalizeCategoryText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function getPressureLayerCategory(item) {
    const loweredName = normalizeCategoryText(item?.name);
    const loweredFeature = normalizeCategoryText(item?.feature);
    const combined = `${loweredName} ${loweredFeature}`;
    if (loweredName.includes('ai virtual service ambassador')) return 'ai-virtual-service-ambassador';
    if (loweredName.includes('customer service centre') || loweredName.includes('customer service center')) return 'customer-service-centre';
    if (loweredName.includes('common direction signs') || loweredName.includes('ground atm signage') || loweredName.includes('help line')) return 'common-direction-signs';
    if (loweredName.includes('hanging signs')) return 'hanging-signs';
    if (loweredName.includes('panoramic guide map')) return 'panoramic-guide-map';
    if (loweredName === 'lcd' || loweredName.includes('lcd ')) return 'lcd';
    if (loweredName.includes('noise') || loweredFeature.includes('decibel') || loweredFeature.includes('noisy')) return 'noise';
    if (loweredName.includes('advertisement') || loweredName.includes('advertising') || item?.category === 'advert') {
      if (combined.includes('dynamic') || combined.includes('flashing') || Number(item?.lux) >= 1000 || Number(item?.decibel) >= 80) {
        return 'flashing-ads';
      }
      return 'static-ads';
    }
    return null;
  }

  function getLayerCategoryForObject(objectType, item) {
    if (!item) {
      return null;
    }
    if (objectType === 'seat') {
      return 'seat';
    }
    return getPressureLayerCategory(item);
  }

  function getCategoryColor(categoryId) {
    return getCategoryDefinition(categoryId)?.color || '#7ea4c1';
  }

  function getNodeDisplayClass(node) {
    const id = String(node?.id || '');
    if (id.startsWith('gate_in_1') || id.startsWith('gate_out_1')) return 'exit-a';
    if (id.startsWith('gate_in_2') || id.startsWith('gate_out_2') || id.startsWith('gate_out_3')) return 'exit-b';
    if (id.startsWith('gate_in_3') || id.startsWith('gate_out_4')) return 'exit-c';
    if (id.startsWith('gate_in_4') || id.startsWith('gate_out_5')) return 'exit-d';
    if (id.startsWith('train_door')) return 'chai-wan';
    if (id.startsWith('elev_')) return 'elevator-node';
    if (id.startsWith('es_up_') || id.startsWith('es_down_') || id.startsWith('stair_')) {
      return node.targetRegionIds?.includes('twl') ? 'tsuen-wan' : 'kennedy-town';
    }
    return 'kennedy-town';
  }

  function getSettingsRouteLabelPlacement(node) {
    const id = String(node?.id || '');
    if (id.startsWith('train_door_')) {
      return 'bottom-right';
    }
    if (id === 'gate_in_1' || id === 'gate_out_1' || id === 'gate_in_2' || id === 'gate_in_3' || id === 'gate_in_4') {
      return 'top-left';
    }
    if (id === 'gate_out_2' || id === 'gate_out_3' || id === 'es_up_5_top' || id === 'es_up_6_top' || id === 'es_up_7_top' || id === 'es_down_5_top' || id === 'es_down_6_top' || id === 'es_down_4_top') {
      return 'bottom-right';
    }
    if (id === 'gate_out_4' || id === 'gate_out_5' || id === 'es_up_8_top') {
      return 'top-right';
    }
    if (id === 'es_up_1_top' || id === 'es_up_2_top') {
      return 'top-left';
    }
    if (id === 'es_down_1_top' || id === 'stair_2_top') {
      return 'bottom-left';
    }
    return 'top-right';
  }

  function getRouteSelectionLabelPlacement(node) {
    return getSettingsRouteLabelPlacement(node);
  }

  function getSettingsRouteLabelLayout(node, displayNode, transform) {
    const gap = worldRadiusForPixels(4, transform);
    const placement = getSettingsRouteLabelPlacement(node);
    if (placement === 'top-left') {
      return {
        x: displayNode.x - gap,
        y: displayNode.y - gap,
        textAnchor: 'end',
        dominantBaseline: 'alphabetic',
      };
    }
    if (placement === 'bottom-right') {
      return {
        x: displayNode.x + gap,
        y: displayNode.y + gap,
        textAnchor: 'start',
        dominantBaseline: 'hanging',
      };
    }
    if (placement === 'bottom-left') {
      return {
        x: displayNode.x - gap,
        y: displayNode.y + gap,
        textAnchor: 'end',
        dominantBaseline: 'hanging',
      };
    }
    return {
      x: displayNode.x + gap,
      y: displayNode.y - gap,
      textAnchor: 'start',
      dominantBaseline: 'alphabetic',
    };
  }

  function createUpdatedPointFeature(basePoint, override) {
    const name = basePoint.name || '';
    if (!override) {
      return basePoint.feature || '';
    }
    if (override.kind === 'ad') {
      const adLabel = override.adMode === 'flashing-ads' ? 'Dynamic/flashing ads' : 'Static ads';
      const parts = [adLabel];
      if (Number.isFinite(override.lux)) parts.push(`${override.lux} lux`);
      if (Number.isFinite(override.decibel) && override.decibel > 0) parts.push(`${override.decibel} decibels`);
      return parts.join(', ');
    }
    if (override.kind === 'noise') {
      const decibel = Number.isFinite(override.decibel) ? override.decibel : Number(basePoint.decibel || 74);
      return `${name || 'Noise'} ${decibel} decibels`;
    }
    return basePoint.feature || '';
  }

  function createUpdatedPointMetrics(basePoint, override, nextCategory, nextLux, nextDecibel) {
    const metrics = { ...(basePoint.metrics || {}) };
    metrics.advert = nextCategory === 'advert' ? 1 : 0;
    metrics.lighting = nextLux ? clamp(nextLux / 700, 0, 1.5) : 0;
    metrics.noise = nextCategory === 'noise' ? clamp((nextDecibel - 65) / 15, 0, 1.2) : nextDecibel ? clamp((nextDecibel - 60) / 20, 0, 1.2) : 0;
    metrics.signage = nextCategory === 'signage' ? 1 : 0;
    metrics.amenity = nextCategory === 'facility' ? 1 : 0;
    return metrics;
  }

  function applyPressureOverrideToRawItem(item, override) {
    if (!override) {
      return item;
    }
    const next = { ...item };
    if (override.kind === 'ad') {
      const nextLux = Number.isFinite(override.lux) ? override.lux : Number(item.lux || 0);
      const nextDecibel = Number.isFinite(override.decibel) ? override.decibel : Number(item.decibel || 0);
      const isDynamic = override.adMode === 'flashing-ads';
      next.feature = createUpdatedPointFeature(item, { ...override, lux: nextLux, decibel: nextDecibel });
      next.category = 'advert';
      next.activeForSimulation = true;
      next.simRole = 'pressure';
      next.lux = nextLux;
      next.decibel = nextDecibel;
      next.range = Number((isDynamic ? 3.2 : 2.5).toFixed(2));
      next.strength = Number(clamp((isDynamic ? 0.78 : 0.62) + nextLux / 2600 + nextDecibel / 500, 0.3, 1.3).toFixed(3));
      next.metrics = createUpdatedPointMetrics(item, override, 'advert', nextLux, nextDecibel);
      return next;
    }
    if (override.kind === 'noise') {
      const nextDecibel = Number.isFinite(override.decibel) ? override.decibel : Number(item.decibel || 74);
      next.feature = createUpdatedPointFeature(item, { ...override, decibel: nextDecibel });
      next.category = 'noise';
      next.activeForSimulation = true;
      next.simRole = 'pressure';
      next.decibel = nextDecibel;
      next.range = 6;
      next.strength = Number(clamp((nextDecibel - 65) / 15, 0, 1.1).toFixed(3));
      next.metrics = createUpdatedPointMetrics(item, override, 'noise', Number(item.lux || 0), nextDecibel);
      return next;
    }
    return next;
  }

  function buildPreparedFromRawModel(rawModel) {
    return Sim.prepareSimData(buildMergedRawModel(rawModel), { healthyAgents: HEALTHY_AGENTS });
  }

  function rebuildBackgroundCrowdPreview() {
    requestRender();
  }

  function getRenderableBackgroundAgents(backgroundAgents = state.scenario?.backgroundAgents || []) {
    return backgroundAgents.filter((agent) => agent.active);
  }

  const BACKGROUND_CROWD_DOT_RGB = Object.freeze([68, 72, 78]);

  function getBackgroundCrowdRenderStyle(activeCount, transform = state.transform) {
    const count = Math.max(0, Math.round(Number(activeCount) || 0));
    const scale = Math.max(0.01, Number(transform?.scale || 0));
    const densityFactor = clamp((count - 220) / 1500, 0, 1);
    const personDiameterMeters = 0.4;
    return {
      radius: Math.max(0.24, personDiameterMeters * 0.5 * scale),
      alpha: Number(clamp(0.44 - densityFactor * 0.22, 0.12, 0.44).toFixed(3)),
      fill: `rgba(${BACKGROUND_CROWD_DOT_RGB[0]}, ${BACKGROUND_CROWD_DOT_RGB[1]}, ${BACKGROUND_CROWD_DOT_RGB[2]}, 1)`,
    };
  }

  function getTargetRegionById(regionId = state.routeSelection.targetRegionId) {
    if (!regionId || !state.prepared?.targetRegionById) {
      return null;
    }
    return state.prepared.targetRegionById[regionId] || null;
  }

  function getTargetRegionLabel(region = getTargetRegionById()) {
    if (!region) {
      return '--';
    }
    return state.locale === 'zh-CN' ? region.labelZh || region.id : region.labelEn || region.labelZh || region.id;
  }

  function getPreferredTargetRegionIdForNode(node) {
    if (!node) {
      return null;
    }
    const regionIds = Array.isArray(node.targetRegionIds) ? node.targetRegionIds.filter(Boolean) : [];
    return regionIds[0] || null;
  }

  function formatStartSelection(point = state.routeSelection.startPoint) {
    if (state.routeSelection.startNodeId && state.prepared?.nodeById?.[state.routeSelection.startNodeId]) {
      const node = state.prepared.nodeById[state.routeSelection.startNodeId];
      return getNodeDisplayLabel(node);
    }
    if (!point) {
      return '--';
    }
    return `${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)}`;
  }

  function getNodeDisplayLabel(node, locale = state.locale) {
    if (!node) {
      return '--';
    }
    return locale === 'zh-CN'
      ? node.displayLabel || node.displayLabelEn || node.id
      : node.displayLabelEn || node.displayLabel || node.id;
  }

  function getVisualizationNodeBadgeLabel(node, locale = state.locale) {
    if (!node) {
      return '--';
    }
    return getNodeDisplayLabel(node, locale) || getNodeKindLabel(node.kind) || '--';
  }

  function isNoisePressureLike(item) {
    const text = `${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`.toLowerCase();
    return text.includes('noise') || text.includes('noisy') || text.includes('decibel');
  }

  function isLightingPressureLike(item, categoryId = getLayerCategoryForObject('pressure', item)) {
    const text = `${item?.name || ''} ${item?.feature || ''} ${item?.category || ''}`.toLowerCase();
    return categoryId === 'flashing-ads'
      || categoryId === 'static-ads'
      || categoryId === 'lcd'
      || text.includes('light')
      || text.includes('lighting')
      || text.includes('lux');
  }

  function getVisualizationPressureBadgeLabel(item) {
    if (!item) {
      return '--';
    }
    const categoryId = getLayerCategoryForObject('pressure', item);
    const categoryLabel = getCategoryDefinition(categoryId)?.label || '';
    if (categoryId === 'flashing-ads' || categoryId === 'static-ads') {
      const label = categoryId === 'flashing-ads' ? 'Flashing Ads' : 'Static Ads';
      if (Number.isFinite(Number(item?.lux))) {
        return `${label} · ${formatMetricValue(Number(item.lux), 0)} lux`;
      }
      return label;
    }
    const metricSuffix = isNoisePressureLike(item)
      ? (Number.isFinite(Number(item?.decibel)) ? ` · ${formatMetricValue(Number(item.decibel), 0)} dB` : '')
      : (isLightingPressureLike(item, categoryId) && Number.isFinite(Number(item?.lux))
        ? ` · ${formatMetricValue(Number(item.lux), 0)} lux`
        : '');
    if (categoryLabel && item.name && categoryLabel !== item.name) {
      return `${categoryLabel} · ${item.name}${metricSuffix}`;
    }
    return `${item.name || categoryLabel || item.label || item.feature || item.id || '--'}${metricSuffix}`;
  }

  function estimateTooltipTextUnits(text) {
    return Array.from(String(text || '')).reduce((total, char) => {
      return total + (/[\u3400-\u9fff\uf900-\ufaff]/.test(char) ? 1.9 : 1);
    }, 0);
  }

  function parseHexColorToRgb(color) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(color || '').trim());
    if (!match) {
      return [120, 128, 138];
    }
    const value = match[1];
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }

  function getCategoryStrokeColor(categoryId) {
    const rgb = parseHexColorToRgb(getCategoryColor(categoryId));
    return rgbToCss(rgb.map((value) => Math.max(0, Math.round(value * 0.58))));
  }

  function findNearestPreparedNode(point) {
    if (!state.prepared?.nodes?.length || !point) {
      return null;
    }
    let nearestNode = null;
    let nearestDistanceSquared = Number.POSITIVE_INFINITY;
    state.prepared.nodes.forEach((node) => {
      const dx = Number(node.x || 0) - Number(point.x || 0);
      const dy = Number(node.y || 0) - Number(point.y || 0);
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < nearestDistanceSquared) {
        nearestDistanceSquared = distanceSquared;
        nearestNode = node;
      }
    });
    return nearestNode;
  }

  function getVisualizationDetailActiveLayerCategories() {
    return Array.isArray(state.visualizationDetailActiveLayerCategories)
      ? state.visualizationDetailActiveLayerCategories.filter(Boolean)
      : [];
  }

  function applyVisualizationDetailSeatLayerPolicy(nextViewMode, previousViewMode = getSafeViewMode(state.visualizationDetailView || state.viewMode)) {
    const nextSafeViewMode = getSafeViewMode(nextViewMode);
    const previousSafeViewMode = getSafeViewMode(previousViewMode);
    const activeCategories = new Set(getVisualizationDetailActiveLayerCategories());
    if (nextSafeViewMode === 'vitality' && previousSafeViewMode !== 'vitality') {
      activeCategories.add('seat');
    } else if (previousSafeViewMode === 'vitality' && nextSafeViewMode !== 'vitality') {
      activeCategories.delete('seat');
    }
    state.visualizationDetailActiveLayerCategories = LAYER_CATEGORY_DEFINITIONS
      .map((item) => item.id)
      .filter((id) => activeCategories.has(id));
  }

  function findVisualizationDetailHoverTarget(clientX, clientY, overlayElement = elements.visualizationDetailOverlay) {
    if (!state.prepared || !overlayElement) {
      return null;
    }
    const transform = computeTransformForViewportSize(overlayElement.clientWidth, overlayElement.clientHeight);
    const pointerWorld = screenToWorld(clientX, clientY, transform, overlayElement);
    const hitRadius = worldRadiusForPixels(24, transform);
    const hitRadiusSquared = hitRadius * hitRadius;
    let bestCandidate = null;
    let bestDistanceSquared = Number.POSITIVE_INFINITY;
    const selectedHotspotOverlays = getSelectedHotspotOverlayItems();

    selectedHotspotOverlays.forEach(({ hotspotTarget }) => {
      if (!hotspotTarget?.item) {
        return;
      }
      const dx = Number(hotspotTarget.item.x || 0) - Number(pointerWorld.x || 0);
      const dy = Number(hotspotTarget.item.y || 0) - Number(pointerWorld.y || 0);
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= hitRadiusSquared && distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestCandidate = { type: hotspotTarget.type, id: hotspotTarget.item.id };
      }
    });

    state.prepared.nodes.forEach((node) => {
      const dx = Number(node.x || 0) - Number(pointerWorld.x || 0);
      const dy = Number(node.y || 0) - Number(pointerWorld.y || 0);
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= hitRadiusSquared && distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestCandidate = { type: 'node', id: node.id };
      }
    });

    const activePressureItems = getLayerItemsForCategories(getVisualizationDetailActiveLayerCategories())
      .filter((entry) => entry.type === 'pressure')
      .map((entry) => entry.item);
    activePressureItems.forEach((item) => {
      const dx = Number(item.x || 0) - Number(pointerWorld.x || 0);
      const dy = Number(item.y || 0) - Number(pointerWorld.y || 0);
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= hitRadiusSquared && distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestCandidate = { type: 'pressure', id: item.id };
      }
    });

    return bestCandidate;
  }

  function syncVisualizationDetailHoverTargetFromPointer() {
    if (!state.visualizationDetailView || !elements.visualizationDetailOverlay) {
      return;
    }
    const hoverPointer = state.visualizationDetailHoverPointer;
    if (!hoverPointer) {
      return;
    }
    const nextHoverTarget = findVisualizationDetailHoverTarget(
      hoverPointer.clientX,
      hoverPointer.clientY,
      elements.visualizationDetailOverlay
    );
    if (
      state.visualizationDetailHoverTarget?.type === nextHoverTarget?.type
      && state.visualizationDetailHoverTarget?.id === nextHoverTarget?.id
    ) {
      return;
    }
    state.visualizationDetailHoverTarget = nextHoverTarget;
  }

  function getModelBounds() {
    if (!state.prepared) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    const bounds = state.prepared.bounds;
    const baseSize = Math.max(bounds.width || 1, bounds.height || 1, 1);
    const padding = baseSize * MAP_PADDING_RATIO;
    return {
      x: bounds.minX - padding,
      y: bounds.minY - padding,
      width: (bounds.width || 1) + padding * 2,
      height: (bounds.height || 1) + padding * 2,
    };
  }

  function computeTransformForViewportSize(width, height) {
    const viewBox = getModelBounds();
    const safeWidth = Math.max(1, Number(width || 0) || 1);
    const safeHeight = Math.max(1, Number(height || 0) || 1);
    const scale = Math.min(safeWidth / viewBox.width, safeHeight / viewBox.height);
    const offsetX = (safeWidth - viewBox.width * scale) * 0.5;
    const offsetY = (safeHeight - viewBox.height * scale) * 0.5;
    return { width: safeWidth, height: safeHeight, viewBox, scale, offsetX, offsetY };
  }

  function computeTransformForContainer(container) {
    return computeTransformForViewportSize(container?.clientWidth, container?.clientHeight);
  }

  function computeTransform() {
    return computeTransformForContainer(elements.mapWrapper);
  }

  function worldToDisplayPoint(point, transform = state.transform) {
    return {
      x: point.x,
      y: transform.viewBox.y + transform.viewBox.height - (point.y - transform.viewBox.y),
    };
  }

  function displayToWorldPoint(point, transform = state.transform) {
    return {
      x: point.x,
      y: transform.viewBox.y + transform.viewBox.height - (point.y - transform.viewBox.y),
    };
  }

  function worldToScreen(point, transform = state.transform) {
    const displayPoint = worldToDisplayPoint(point, transform);
    return {
      x: transform.offsetX + (displayPoint.x - transform.viewBox.x) * transform.scale,
      y: transform.offsetY + (displayPoint.y - transform.viewBox.y) * transform.scale,
    };
  }

  function screenToWorld(clientX, clientY, transform = state.transform, referenceElement = elements.overlayLayer) {
    const rect = referenceElement.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const displayPoint = {
      x: transform.viewBox.x + (localX - transform.offsetX) / transform.scale,
      y: transform.viewBox.y + (localY - transform.offsetY) / transform.scale,
    };
    return displayToWorldPoint(displayPoint, transform);
  }

  function worldRadiusForPixels(pixelRadius, transform = state.transform) {
    return pixelRadius / Math.max(transform.scale, 1e-6);
  }

  function getDisplayModelBounds(transform = state.transform) {
    if (!state.prepared?.bounds) {
      return {
        left: transform.viewBox.x,
        right: transform.viewBox.x + transform.viewBox.width,
        top: transform.viewBox.y,
        bottom: transform.viewBox.y + transform.viewBox.height,
      };
    }
    const bounds = state.prepared.bounds;
    const topPoint = worldToDisplayPoint({ x: bounds.minX, y: bounds.maxY }, transform);
    const bottomPoint = worldToDisplayPoint({ x: bounds.minX, y: bounds.minY }, transform);
    return {
      left: bounds.minX,
      right: bounds.maxX,
      top: topPoint.y,
      bottom: bottomPoint.y,
    };
  }

  function getMarkerBadgePlacement(displayPoint, placedBadges = [], transform = state.transform) {
    const modelBounds = getDisplayModelBounds(transform);
    const badgeOffset = worldRadiusForPixels(24, transform);
    const edgeInset = worldRadiusForPixels(20, transform);
    const badgeGap = worldRadiusForPixels(24, transform);
    const candidates = [
      {
        edge: 'left',
        distance: Math.abs(displayPoint.x - modelBounds.left),
        x: modelBounds.left - badgeOffset,
        y: clamp(displayPoint.y, modelBounds.top + edgeInset, modelBounds.bottom - edgeInset),
      },
      {
        edge: 'right',
        distance: Math.abs(modelBounds.right - displayPoint.x),
        x: modelBounds.right + badgeOffset,
        y: clamp(displayPoint.y, modelBounds.top + edgeInset, modelBounds.bottom - edgeInset),
      },
      {
        edge: 'top',
        distance: Math.abs(displayPoint.y - modelBounds.top),
        x: clamp(displayPoint.x, modelBounds.left + edgeInset, modelBounds.right - edgeInset),
        y: modelBounds.top - badgeOffset,
      },
      {
        edge: 'bottom',
        distance: Math.abs(modelBounds.bottom - displayPoint.y),
        x: clamp(displayPoint.x, modelBounds.left + edgeInset, modelBounds.right - edgeInset),
        y: modelBounds.bottom + badgeOffset,
      },
    ].sort((left, right) => left.distance - right.distance);
    const badge = { ...candidates[0] };
    placedBadges.forEach((item) => {
      const dx = item.x - badge.x;
      const dy = item.y - badge.y;
      if (Math.sqrt(dx * dx + dy * dy) >= badgeGap * 1.4) {
        return;
      }
      if (badge.edge === 'left' || badge.edge === 'right') {
        badge.y = clamp(badge.y + (item.y <= badge.y ? badgeGap : -badgeGap), modelBounds.top + edgeInset, modelBounds.bottom - edgeInset);
      } else {
        badge.x = clamp(badge.x + (item.x <= badge.x ? badgeGap : -badgeGap), modelBounds.left + edgeInset, modelBounds.right - edgeInset);
      }
    });
    placedBadges.push({ x: badge.x, y: badge.y });
    return badge;
  }

  function polygonToPoints(polygon, transform = state.transform) {
    return polygon
      .map((point) => {
        const displayPoint = worldToDisplayPoint({ x: point[0], y: point[1] }, transform);
        return `${displayPoint.x},${displayPoint.y}`;
      })
      .join(' ');
  }

  function mixRgb(left, right, amount) {
    return left.map((channel, index) => Math.round(channel + (right[index] - channel) * amount));
  }

  function mixTowardWhite(rgb, amount) {
    return mixRgb(rgb, [255, 255, 255], clamp(amount, 0, 1));
  }

  function mixTowardBlack(rgb, amount) {
    return mixRgb(rgb, [20, 26, 34], clamp(amount, 0, 1));
  }

  function samplePaletteRgb(normalized, colorStops) {
    for (let index = 1; index < colorStops.length; index += 1) {
      const previous = colorStops[index - 1];
      const current = colorStops[index];
      if (normalized <= current.stop) {
        const span = current.stop - previous.stop || 1;
        return mixRgb(previous.rgb, current.rgb, (normalized - previous.stop) / span);
      }
    }
    return colorStops[colorStops.length - 1].rgb;
  }

  function heatAbsoluteNormalized(value, style = getHeatmapViewStyle()) {
    const safeValue = Math.max(0, Number(value) || 0);
    const valueStops = style?.valueStops || HEAT_VALUE_STOPS;
    const maximum = valueStops[valueStops.length - 1] || 130;
    return clamp(safeValue / Math.max(1e-6, maximum), 0, 1);
  }

  function heatRgb(value, style = getHeatmapViewStyle()) {
    const safeValue = Math.max(0, Number(value) || 0);
    const valueStops = style?.valueStops || HEAT_VALUE_STOPS;
    const colorStops = style?.colorStops || DEFAULT_HEAT_COLOR_STOPS;
    let normalized = heatAbsoluteNormalized(safeValue, style);
    for (let index = 1; index < Math.min(valueStops.length, colorStops.length); index += 1) {
      const previousValue = valueStops[index - 1];
      const currentValue = valueStops[index];
      if (safeValue <= currentValue) {
        const amount = clamp((safeValue - previousValue) / Math.max(1e-6, currentValue - previousValue), 0, 1);
        const previousStop = colorStops[index - 1];
        const currentStop = colorStops[index];
        normalized = previousStop.stop + (currentStop.stop - previousStop.stop) * amount;
        break;
      }
    }
    return samplePaletteRgb(normalized, colorStops);
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function getHeatDisplayRgb(pressure, localPressureMin, localPressureMax, style = getHeatmapViewStyle()) {
    const safePressure = Math.max(0, Number(pressure) || 0);
    const colorStops = style?.colorStops || DEFAULT_HEAT_COLOR_STOPS;
    let normalized = heatAbsoluteNormalized(safePressure, style);
    if (Number.isFinite(localPressureMin) && Number.isFinite(localPressureMax) && localPressureMax > localPressureMin + 1e-6) {
      normalized = clamp((safePressure - localPressureMin) / (localPressureMax - localPressureMin), 0, 1);
    }
    const baseRgb = samplePaletteRgb(normalized, colorStops);
    return baseRgb;
  }

  function buildHeatDisplayProfile(metricValues, style = getHeatmapViewStyle()) {
    const sortedValues = getSortedNumericValues(metricValues);
    const valueStops = style?.valueStops || HEAT_VALUE_STOPS;
    if (!sortedValues.length) {
      return {
        anchors: [0, 0.16, 0.34, 0.52, 0.7, 0.86, 1].map((normalized, index) => ({
          value: Number(valueStops[Math.min(index, valueStops.length - 1)] || 0),
          normalized,
        })),
        signature: 'default',
      };
    }
    const anchorValues = [
      sampleQuantile(sortedValues, 0),
      sampleQuantile(sortedValues, 0.12),
      sampleQuantile(sortedValues, 0.32),
      sampleQuantile(sortedValues, 0.55),
      sampleQuantile(sortedValues, 0.78),
      sampleQuantile(sortedValues, 0.92),
      sampleQuantile(sortedValues, 1),
    ];
    for (let index = 1; index < anchorValues.length; index += 1) {
      if (anchorValues[index] <= anchorValues[index - 1]) {
        anchorValues[index] = anchorValues[index - 1] + 1e-6;
      }
    }
    const normalizedAnchors = [0, 0.14, 0.32, 0.5, 0.7, 0.88, 1];
    return {
      anchors: anchorValues.map((value, index) => ({
        value,
        normalized: normalizedAnchors[index],
      })),
      signature: anchorValues.map((value) => Number(value || 0).toFixed(4)).join(':'),
    };
  }

  function mapHeatMetricToDisplayNormalized(metric, displayProfile, style = getHeatmapViewStyle()) {
    const safeMetric = Math.max(0, Number(metric) || 0);
    const anchors = Array.isArray(displayProfile?.anchors) ? displayProfile.anchors : null;
    if (!anchors?.length) {
      return heatAbsoluteNormalized(safeMetric, style);
    }
    if (safeMetric <= anchors[0].value) {
      return anchors[0].normalized;
    }
    for (let index = 1; index < anchors.length; index += 1) {
      const previous = anchors[index - 1];
      const current = anchors[index];
      if (safeMetric <= current.value) {
        const amount = clamp(
          (safeMetric - previous.value) / Math.max(1e-6, current.value - previous.value),
          0,
          1
        );
        return previous.normalized + (current.normalized - previous.normalized) * amount;
      }
    }
    return anchors[anchors.length - 1].normalized;
  }

  function getSingleBurdenHeatColors(baseRgb, normalized, style = getHeatmapViewStyle()) {
    const safeNormalized = clamp(Number(normalized) || 0, 0, 1);
    const paletteStops = style?.colorStops || DEFAULT_HEAT_COLOR_STOPS;
    const fieldColor = safeNormalized <= 0.42
      ? mixTowardWhite(baseRgb, smoothstep(0.42, 0, safeNormalized) * 0.18)
      : baseRgb;
    const coreTarget = samplePaletteRgb(
      clamp(0.04 + Math.pow(safeNormalized, 0.96), 0, 1),
      paletteStops
    );
    const coreColor = mixRgb(baseRgb, coreTarget, 0.42);
    return { fieldColor, coreColor };
  }

  function getActivePlayback() {
    return state.scenario?.usePrecomputedHeatPlayback ? state.scenario?.precomputedPlayback || null : null;
  }

  function interpolateValue(left, right, key, ratio, fallback = 0) {
    const leftValue = Number(left?.[key]);
    const rightValue = Number(right?.[key]);
    const from = Number.isFinite(leftValue) ? leftValue : fallback;
    const to = Number.isFinite(rightValue) ? rightValue : from;
    return from + (to - from) * ratio;
  }

  function clonePlaybackArray(items) {
    return Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  }

  function getPlaybackSnapshotAtTime(time = Number(state.scenario?.playbackRevealTime || 0), playback = getActivePlayback()) {
    const snapshots = playback?.traceSnapshots;
    if (!Array.isArray(snapshots) || !snapshots.length) {
      return null;
    }
    const bucket = getPlaybackFocusSnapshotBucket(time);
    const cached = state.playbackSnapshotCache;
    if (cached && cached.playback === playback && cached.bucket === bucket) {
      return cached.snapshot;
    }
    if (!Number.isFinite(time) || time <= Number(snapshots[0].time || 0)) {
      const first = snapshots[0];
      const snapshot = {
        ...first,
        actualWalkingSpeed: getPlaybackActualWalkingSpeed(Number(first.time || 0), playback),
        capacityScores: cloneCapacityScoreMap(first.capacityScores),
        burdenScores: cloneDimensionScoreMap(first.burdenScores),
        decisionDiagnostics: first.decisionDiagnostics ? { ...first.decisionDiagnostics } : null,
        topBurdenId: first.topBurdenId || getTopBurdenIdFromScores(first.burdenScores),
        nearbySeats: clonePlaybackArray(first.nearbySeats),
        topPressureSources: clonePlaybackArray(first.topPressureSources),
      };
      state.playbackSnapshotCache = { playback, bucket, snapshot };
      return snapshot;
    }
    const last = snapshots[snapshots.length - 1];
    if (time >= Number(last.time || 0)) {
      const snapshot = {
        ...last,
        actualWalkingSpeed: getPlaybackActualWalkingSpeed(time, playback),
        capacityScores: cloneCapacityScoreMap(last.capacityScores),
        burdenScores: cloneDimensionScoreMap(last.burdenScores),
        decisionDiagnostics: last.decisionDiagnostics ? { ...last.decisionDiagnostics } : null,
        topBurdenId: last.topBurdenId || getTopBurdenIdFromScores(last.burdenScores),
        nearbySeats: clonePlaybackArray(last.nearbySeats),
        topPressureSources: clonePlaybackArray(last.topPressureSources),
      };
      state.playbackSnapshotCache = { playback, bucket, snapshot };
      return snapshot;
    }

    const previousIndex = findPlaybackTraceUpperBound(snapshots, time);
    const previous = snapshots[previousIndex];
    const current = snapshots[Math.min(snapshots.length - 1, previousIndex + 1)];
    const previousTime = Number(previous.time || 0);
    const currentTime = Number(current.time || 0);
    const segmentSpan = Math.max(1e-6, currentTime - previousTime);
    const ratio = clamp((time - previousTime) / segmentSpan, 0, 1);
    const anchor = previous;
    const fatigueThreshold = Number(anchor.fatigueThreshold || previous.fatigueThreshold || current.fatigueThreshold || getFatigueThreshold());
    const fatigue = interpolateValue(previous, current, 'fatigue', ratio, 0);
    const capacityScores = cloneCapacityScoreMap(anchor.capacityScores || state.focusProfile?.capacityScores);
    const burdenScores = interpolateDimensionScoreMap(previous, current, 'burdenScores', ratio, anchor.burdenScores || current.burdenScores || {});
    const nearbySeats = clonePlaybackArray(anchor.nearbySeats);
    const needsRest = fatigue >= fatigueThreshold;
    const actualWalkingSpeed = getPlaybackActualWalkingSpeed(time, playback);
    const snapshot = {
      ...anchor,
      x: interpolateValue(previous, current, 'x', ratio, Number(anchor.x || 0)),
      y: interpolateValue(previous, current, 'y', ratio, Number(anchor.y || 0)),
      time,
      progress: interpolateValue(previous, current, 'progress', ratio, Number(anchor.progress || 0)),
      heat: interpolateValue(previous, current, 'heat', ratio, Number(anchor.heat || 0)),
      pressure: interpolateValue(previous, current, 'pressure', ratio, Number(anchor.pressure || 0)),
      cognitiveLoad: interpolateValue(previous, current, 'cognitiveLoad', ratio, Number(anchor.cognitiveLoad || anchor.pressure || 0)),
      fatigue,
      crowdDensity: interpolateValue(previous, current, 'crowdDensity', ratio, Number(anchor.crowdDensity || 0)),
      environmentNoise: interpolateValue(previous, current, 'environmentNoise', ratio, Number(anchor.environmentNoise || 0)),
      environmentLighting: interpolateValue(previous, current, 'environmentLighting', ratio, Number(anchor.environmentLighting || 0)),
      queueCount: interpolateValue(previous, current, 'queueCount', ratio, Number(anchor.queueCount || 0)),
      actualWalkingSpeed,
      persistentStress: interpolateValue(previous, current, 'persistentStress', ratio, Number(anchor.persistentStress || 0)),
      localVisibleStress: interpolateValue(previous, current, 'localVisibleStress', ratio, Number(anchor.localVisibleStress || 0)),
      ambientNoiseStress: interpolateValue(previous, current, 'ambientNoiseStress', ratio, Number(anchor.ambientNoiseStress || 0)),
      ambientCrowdingStress: interpolateValue(previous, current, 'ambientCrowdingStress', ratio, Number(anchor.ambientCrowdingStress || 0)),
      ambientLightingStress: interpolateValue(previous, current, 'ambientLightingStress', ratio, Number(anchor.ambientLightingStress || 0)),
      ambientQueueStress: interpolateValue(previous, current, 'ambientQueueStress', ratio, Number(anchor.ambientQueueStress || 0)),
      fatigueThreshold,
      capacityScores,
      burdenScores,
      decisionDiagnostics: anchor.decisionDiagnostics ? { ...anchor.decisionDiagnostics } : null,
      topBurdenId: getTopBurdenIdFromScores(burdenScores),
      nearbySeats,
      needsRest,
      advice: anchor.advice || (needsRest ? (nearbySeats.length ? t('hint.restWithSeats') : t('hint.restWithoutSeats')) : t('hint.keepMoving')),
      topPressureSources: clonePlaybackArray(anchor.topPressureSources),
    };
    state.playbackSnapshotCache = { playback, bucket, snapshot };
    return snapshot;
  }

  function getPlaybackRevealTimeBucket(time) {
    return Math.round((Number(time) || 0) * 4) / 4;
  }

  function getPlaybackFocusSnapshotBucket(time) {
    return Math.round((Number(time) || 0) * PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND) / PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND;
  }

  function getPlaybackActualWalkingSpeed(time = Number(state.scenario?.playbackRevealTime || 0), playback = getActivePlayback()) {
    const snapshots = playback?.traceSnapshots;
    if (!Array.isArray(snapshots) || snapshots.length < 2) {
      return Number.NaN;
    }
    const numericTime = Number(time);
    const upperBound = findPlaybackTraceUpperBound(snapshots, Number.isFinite(numericTime) ? numericTime : Number(snapshots[0].time || 0));
    const currentIndex = clamp(upperBound + 1, 1, snapshots.length - 1);
    const previous = snapshots[currentIndex - 1];
    const current = snapshots[currentIndex];
    if (current?.playbackComplete && numericTime >= Number(current.time || 0) - 1e-6) {
      return 0;
    }
    const elapsedSeconds = Math.max(1e-6, Number(current.time || 0) - Number(previous.time || 0));
    const movedMeters = Math.hypot(
      Number(current.x || 0) - Number(previous.x || 0),
      Number(current.y || 0) - Number(previous.y || 0)
    );
    return movedMeters / elapsedSeconds;
  }

  function getCurrentHeatmapRevealTime(playback = getActivePlayback()) {
    if (state.heatmapRevealFrozenTime !== null && state.heatmapRevealFrozenTime !== undefined) {
      const frozenTime = Number(state.heatmapRevealFrozenTime);
      if (Number.isFinite(frozenTime)) {
        return frozenTime;
      }
    }
    const currentTime = Number(state.scenario?.playbackRevealTime);
    if (Number.isFinite(currentTime)) {
      return currentTime;
    }
    const startTime = Number(playback?.startTime);
    return Number.isFinite(startTime) ? startTime : Number(state.scenario?.time || 0);
  }

  function isHeatmapFullyRevealed(playback = getActivePlayback()) {
    const endTime = Number(playback?.endTime);
    if (!Number.isFinite(endTime)) {
      return true;
    }
    return getCurrentHeatmapRevealTime(playback) >= endTime - 1e-6;
  }

  function shouldRenderHeatmapDuringPlaybackFrame() {
    const playback = getActivePlayback();
    if (!playback) {
      return true;
    }
    return !isHeatmapFullyRevealed(playback);
  }

  function getPlaybackRenderClock() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }

  function shouldRenderPlaybackOverlayFrame() {
    const now = getPlaybackRenderClock();
    const minIntervalMs = state.pointPopover?.visible || state.visualizationDetailHoverTarget ? 48 : 80;
    if (!state.lastPlaybackOverlayRenderAt || now - state.lastPlaybackOverlayRenderAt >= minIntervalMs) {
      state.lastPlaybackOverlayRenderAt = now;
      return true;
    }
    return false;
  }

  function shouldRenderPlaybackUiPanels() {
    const now = getPlaybackRenderClock();
    const minIntervalMs = 160;
    if (!state.lastPlaybackUiPanelRenderAt || now - state.lastPlaybackUiPanelRenderAt >= minIntervalMs) {
      state.lastPlaybackUiPanelRenderAt = now;
      return true;
    }
    return false;
  }

  function getHeatmapRevealTraceSnapshots(playback = getActivePlayback()) {
    const snapshots = playback?.traceSnapshots;
    if (!Array.isArray(snapshots) || !snapshots.length) {
      return [];
    }
    const revealTime = getCurrentHeatmapRevealTime(playback);
    const upperBound = findPlaybackTraceUpperBound(snapshots, revealTime);
    const visibleSnapshots = upperBound >= 0 ? snapshots.slice(0, upperBound + 1) : [];
    const interpolated = getPlaybackSnapshotAtTime(revealTime, playback);
    if (interpolated && (!visibleSnapshots.length || Number(visibleSnapshots[visibleSnapshots.length - 1].time) < revealTime - 1e-9)) {
      visibleSnapshots.push(interpolated);
    }
    return visibleSnapshots;
  }

  function findPlaybackTraceUpperBound(snapshots, revealTime) {
    let low = 0;
    let high = snapshots.length - 1;
    let best = -1;
    while (low <= high) {
      const middle = Math.floor((low + high) * 0.5);
      const middleTime = Number(snapshots[middle]?.time || 0);
      if (middleTime <= revealTime + 1e-9) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return best;
  }

  function getPlaybackFocusInspection() {
    const playback = getActivePlayback();
    const revealTime = Number(state.scenario?.playbackRevealTime || 0);
    const bucket = getPlaybackFocusSnapshotBucket(revealTime);
    const cached = state.playbackFocusInspectionCache;
    if (cached && cached.playback === playback && cached.bucket === bucket) {
      return cached.inspection;
    }
    const snapshot = getPlaybackSnapshotAtTime();
    const focusAgent = state.scenario?.focusAgent;
    if (!snapshot || !focusAgent) {
      state.playbackFocusInspectionCache = { playback, bucket, inspection: null };
      return null;
    }
    const point = {
      x: Number(snapshot.x || 0),
      y: Number(snapshot.y || 0),
    };
    const useSnapshotPressure = Boolean(
      state.scenario?.usePrecomputedHeatPlayback
      && (Number.isFinite(Number(snapshot.cognitiveLoad)) || Number.isFinite(Number(snapshot.pressure)))
    );
    const playbackPressureState = useSnapshotPressure
      ? null
      : Sim.evaluatePressureStateAtPoint(
        state.prepared,
        state.scenario,
        point,
        {
          agent: {
            id: focusAgent.id,
            active: true,
            accumulatedStress: Number(snapshot.persistentStress || 0),
            pressureEventStates: {},
          },
          applyTriggers: false,
        }
      );
    const fatigueThreshold = Number(snapshot.fatigueThreshold || focusAgent.fatigueThreshold || getFatigueThreshold());
    const fatigue = Number(snapshot.fatigue || 0);
    const nearbySeats = clonePlaybackArray(snapshot.nearbySeats);
    const dimensionState = typeof Sim.deriveFiveDimensionStateAtPoint === 'function'
      ? Sim.deriveFiveDimensionStateAtPoint(state.prepared, state.scenario, point, {
          agent: {
            ...focusAgent,
            position: point,
            fatigue,
            accumulatedStress: Number(snapshot.persistentStress || 0),
            pressureEventStates: {},
          },
          fatigue,
          fatigueThreshold,
          pressureState: playbackPressureState,
        })
      : (snapshot.burdenScores
        ? {
            capacityScores: cloneCapacityScoreMap(snapshot.capacityScores || focusAgent.profile?.capacityScores),
            burdenScores: cloneDimensionScoreMap(snapshot.burdenScores),
            summary: {
              topBurdenId: snapshot.topBurdenId || getTopBurdenIdFromScores(snapshot.burdenScores),
            },
            burdens: {
              cognitive: snapshot.decisionDiagnostics ? { ...snapshot.decisionDiagnostics } : null,
            },
          }
        : null);
    const needsRest = fatigue >= fatigueThreshold;
      const topPressureSources = !useSnapshotPressure && Array.isArray(playbackPressureState?.contributions)
        ? playbackPressureState.contributions
          .slice()
        .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
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
          pressureDelta: Number.isFinite(Number(pressureDelta)) ? Number(pressureDelta) : Number(influence || 0),
          state: state || null,
            sourceKind: sourceKind || null,
          }))
        : clonePlaybackArray(snapshot.topPressureSources);
      const realtimePlaybackFields = {
        walkingSpeed: Number(snapshot.currentWalkingSpeed),
        decisionDelay: Number(snapshot.decisionReactionTime),
      };
      const actualWalkingSpeed = Number(snapshot.actualWalkingSpeed);
      const realtimeWalkingSpeed = Number(snapshot.currentWalkingSpeed);
      const fallbackWalkingSpeed = Number(focusAgent.currentWalkingSpeed ?? focusAgent.profile?.walkingSpeed ?? 0);
      const realtimeDecisionDelay = Number(snapshot.decisionReactionTime);
      const derivedDecisionDelay = Number(
        dimensionState?.burdens?.cognitive?.decisionReactionTime
        ?? snapshot.decisionDiagnostics?.decisionReactionTime
        ?? focusAgent.lastDecisionDiagnostics?.decisionReactionTime
        ?? focusAgent.profile?.decisionDelay
        ?? 0
      );
      const inspection = {
        type: 'agent',
        id: focusAgent.id,
        routeId: focusAgent.routeId,
        routeLabel: focusAgent.routeLabel,
        isFocusAgent: true,
        queueLocked: Boolean(snapshot.queueLocked ?? focusAgent.queueLocked),
        restState: snapshot.restState ?? focusAgent.restState ?? 'none',
        restMode: snapshot.restMode ?? focusAgent.restMode ?? null,
        restTargetSeatId: snapshot.restTargetSeatId ?? focusAgent.restTargetSeatId ?? null,
        reservedSeatId: snapshot.reservedSeatId ?? focusAgent.reservedSeatId ?? null,
        selectedTargetNodeId: snapshot.selectedTargetNodeId ?? focusAgent.selectedTargetNodeId ?? null,
        selectedTargetNodeLabel: snapshot.selectedTargetNodeLabel ?? focusAgent.selectedTargetNodeLabel ?? null,
        time: Number(snapshot.time ?? state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0),
      x: point.x,
      y: point.y,
      pressure: Number(useSnapshotPressure ? (snapshot.pressure ?? snapshot.cognitiveLoad ?? 0) : (playbackPressureState?.pressureScore ?? snapshot.pressure ?? snapshot.cognitiveLoad ?? 0)),
      cognitiveLoad: Number(useSnapshotPressure ? (snapshot.cognitiveLoad ?? snapshot.pressure ?? 0) : (playbackPressureState?.pressureScore ?? snapshot.cognitiveLoad ?? snapshot.pressure ?? 0)),
        fatigue,
        heat: Number(snapshot.heat ?? snapshot.cognitiveLoad ?? snapshot.pressure ?? 0),
        progress: Number(snapshot.progress || 0),
        crowdDensity: Number(useSnapshotPressure ? (snapshot.crowdDensity || 0) : (playbackPressureState?.crowdDensity ?? (snapshot.crowdDensity || 0))),
        walkingSpeed: Number.isFinite(actualWalkingSpeed) ? actualWalkingSpeed : (Number.isFinite(realtimeWalkingSpeed) ? realtimeWalkingSpeed : (Number.isFinite(fallbackWalkingSpeed) ? fallbackWalkingSpeed : 0)),
        decisionDelay: Number.isFinite(realtimeDecisionDelay) ? realtimeDecisionDelay : (Number.isFinite(derivedDecisionDelay) ? derivedDecisionDelay : 0),
        movementBehavior: dimensionState?.burdens?.locomotor?.movementBehavior
          || dimensionState?.burdens?.locomotor?.behavior
          || focusAgent.movementBehavior
          || 'normal_walk',
        movementMainCause: dimensionState?.burdens?.locomotor?.movementMainCause
          || focusAgent.movementMainCause
          || 'speed',
        visionRadius: Number(snapshot.visionRadius || 15),
        fatigueThreshold,
        environmentNoise: Number(snapshot.environmentNoise || 0),
      environmentLighting: Number(snapshot.environmentLighting || 0),
      queueCount: Number(snapshot.queueCount || 0),
      persistentStress: Number(snapshot.persistentStress || 0),
      localVisibleStress: Number(useSnapshotPressure ? (snapshot.localVisibleStress || 0) : (playbackPressureState?.localVisibleStress ?? (snapshot.localVisibleStress || 0))),
      ambientNoiseStress: Number(useSnapshotPressure ? (snapshot.ambientNoiseStress || 0) : (playbackPressureState?.ambientNoiseStress ?? (snapshot.ambientNoiseStress || 0))),
      ambientCrowdingStress: Number(useSnapshotPressure ? (snapshot.ambientCrowdingStress || 0) : (playbackPressureState?.ambientCrowdingStress ?? (snapshot.ambientCrowdingStress || 0))),
      ambientLightingStress: Number(useSnapshotPressure ? (snapshot.ambientLightingStress || 0) : (playbackPressureState?.ambientLightingStress ?? (snapshot.ambientLightingStress || 0))),
      ambientQueueStress: Number(useSnapshotPressure ? (snapshot.ambientQueueStress || 0) : (playbackPressureState?.ambientQueueStress ?? (snapshot.ambientQueueStress || 0))),
      capacityScores: cloneCapacityScoreMap(dimensionState?.capacityScores || snapshot.capacityScores || focusAgent.profile?.capacityScores),
      burdenScores: cloneDimensionScoreMap(dimensionState?.burdenScores || snapshot.burdenScores),
      topBurdenId: dimensionState?.summary?.topBurdenId || snapshot.topBurdenId || getTopBurdenIdFromScores(dimensionState?.burdenScores || snapshot.burdenScores),
      fiveDimensions: dimensionState || null,
      decisionDiagnostics: dimensionState?.burdens?.cognitive || (snapshot.decisionDiagnostics ? { ...snapshot.decisionDiagnostics } : null),
      topPressureSources,
      needsRest,
      nearbySeats,
      advice: snapshot.advice || (needsRest ? (nearbySeats.length ? t('hint.restWithSeats') : t('hint.restWithoutSeats')) : t('hint.keepMoving')),
    };
    state.playbackFocusInspectionCache = { playback, bucket, inspection };
    return inspection;
  }

  function getVisibleTraceSnapshots(playback = getActivePlayback()) {
    if (!playback?.traceSnapshots?.length) {
      return Array.isArray(state.focusTraceSnapshots) ? state.focusTraceSnapshots : [];
    }
    if (state.loopPlaybackActive || state.firstPassComplete) {
      return playback.traceSnapshots;
    }
    const revealTime = Number.isFinite(Number(state.scenario?.playbackRevealTime)) ? Number(state.scenario.playbackRevealTime) : Number(playback.startTime || 0);
    const revealBucket = getPlaybackRevealTimeBucket(revealTime);
    const cached = state.visibleTraceSnapshotCache;
    if (cached && cached.playback === playback && cached.bucket === revealBucket) {
      return cached.snapshots;
    }
    const upperBound = findPlaybackTraceUpperBound(playback.traceSnapshots, revealTime);
    const visibleSnapshots = upperBound >= 0 ? playback.traceSnapshots.slice(0, upperBound + 1) : [];
    const interpolated = getPlaybackSnapshotAtTime(revealTime, playback);
    if (interpolated && (!visibleSnapshots.length || Number(visibleSnapshots[visibleSnapshots.length - 1].time) < revealTime - 1e-9)) {
      visibleSnapshots.push(interpolated);
    }
    state.visibleTraceSnapshotCache = {
      playback,
      bucket: revealBucket,
      snapshots: visibleSnapshots,
    };
    return visibleSnapshots;
  }

  function getPlaybackTraceSnapshots(playback = getActivePlayback()) {
    if (Array.isArray(playback?.traceSnapshots) && playback.traceSnapshots.length) {
      return playback.traceSnapshots;
    }
    return Array.isArray(state.focusTraceSnapshots) ? state.focusTraceSnapshots : [];
  }

  function distancePointToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared <= 1e-9) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }
    const projection = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
    const closestX = start.x + dx * projection;
    const closestY = start.y + dy * projection;
    return Math.hypot(point.x - closestX, point.y - closestY);
  }

  function getSnapshotMetricValue(snapshot, viewMode, fallback = 0) {
    if (viewMode === 'psychological' && typeof Sim.computePsychologicalBurdenScore === 'function') {
      const profile = state.scenario?.focusAgent?.profile || state.focusProfile || {};
      const pressure = Math.max(0, Number(fallback ?? snapshot?.pressure ?? 0) || 0);
      return Math.max(0, Number(Sim.computePsychologicalBurdenScore(pressure, {
        profile,
        capacityScores: snapshot?.capacityScores || profile.capacityScores || state.focusProfile?.capacityScores || null,
      }) || 0));
    }
    const burdenMetric = Number(getBurdenMetricFromScores(snapshot?.burdenScores || {}, viewMode));
    if (Number.isFinite(burdenMetric)) {
      return Math.max(0, burdenMetric);
    }
    if (viewMode === 'cognitive') {
      return Math.max(0, Number(snapshot?.cognitiveLoad ?? snapshot?.pressure ?? fallback) || 0);
    }
    if (viewMode === 'vitality') {
      return Math.max(0, Number(snapshot?.fatigue ?? fallback) || 0);
    }
    return Math.max(0, Number(fallback) || 0);
  }

  function getHeatCellMetricCacheKey(metricId, cellIndex, revealTime) {
    const timeBucket = Math.round((Number(revealTime) || 0) * 4) / 4;
    return `${metricId}:${timeBucket}:${cellIndex}`;
  }

  function getLocalHeatCellMetric(cell, metricId, fallback = 0) {
    if (!state.prepared || !state.scenario || !cell) {
      return Math.max(0, Number(fallback) || 0);
    }
    if (metricId === 'vitality') {
      return Math.max(0, Number(cell.fatigue ?? fallback) || 0);
    }
    if (metricId !== COMPOSITE_BURDEN_VIEW && metricId !== 'sensory' && metricId !== 'cognitive' && metricId !== 'locomotor' && metricId !== 'psychological') {
      return Math.max(0, Number(fallback) || 0);
    }
    const precomputedMetric = Number(getBurdenMetricFromScores(cell?.burdenScores || {}, metricId));
    if (Number.isFinite(precomputedMetric)) {
      return Math.max(0, precomputedMetric);
    }
    const revealTime = Number(state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0);
    const cacheKey = getHeatCellMetricCacheKey(metricId, cell.index, revealTime);
    const cached = state.heatCellMetricCache?.get(cacheKey);
    if (Number.isFinite(cached)) {
      return Math.max(0, cached);
    }
    const inspection = typeof Sim.inspectHeatPoint === 'function'
      ? Sim.inspectHeatPoint(state.prepared, state.scenario, cell)
      : null;
    const burdenMetric = Number(getBurdenMetricFromScores(inspection?.burdenScores || {}, metricId));
    const nextValue = Number.isFinite(burdenMetric)
      ? burdenMetric
      : getSnapshotMetricValue(inspection, metricId, fallback);
    if (!(state.heatCellMetricCache instanceof Map)) {
      state.heatCellMetricCache = new Map();
    }
    if (state.heatCellMetricCache.size > 40000) {
      state.heatCellMetricCache.clear();
    }
    state.heatCellMetricCache.set(cacheKey, Math.max(0, Number(nextValue) || 0));
    return Math.max(0, Number(nextValue) || 0);
  }

  function getTraceRevealRadiusMeters(viewMode = getSafeViewMode(state.viewMode)) {
    if (viewMode === 'vitality') {
      return Math.max(HEAT_TRACE_RADIUS_METERS, VITALITY_RIBBON_MAX_WIDTH_METERS * 0.5);
    }
    return HEAT_NON_VITALITY_CORRIDOR_RADIUS_METERS;
  }

  function getHeatSurfaceRasterScale() {
    return Math.max(2, Number(window.devicePixelRatio || 1));
  }

  function buildTraceScopedHeatCells(heatState, traceSnapshots, metricId, revealRadiusMeters, cacheKey, options = {}) {
    if (!heatState?.cells?.length || !Array.isArray(traceSnapshots) || !traceSnapshots.length) {
      return [];
    }
    const cached = state.revealedHeatCellsCache?.get(cacheKey);
    if (cached && cached.heatState === heatState && cached.traceSnapshots === traceSnapshots) {
      return cached.cells;
    }
    const traceProgressDistances = traceSnapshots.reduce((distances, snapshot, index) => {
      if (index === 0) {
        distances.push(0);
        return distances;
      }
      const previous = traceSnapshots[index - 1];
      const segmentLength = Math.hypot(
        Number(snapshot?.x || 0) - Number(previous?.x || 0),
        Number(snapshot?.y || 0) - Number(previous?.y || 0)
      );
      distances.push((distances[index - 1] || 0) + segmentLength);
      return distances;
    }, []);
    const gridPadding = Math.min(0.32, Math.max(0.12, Number(state.prepared?.grid?.cellSize || 1.15) * 0.25));
    const revealDistance = revealRadiusMeters + gridPadding;
    const revealedCells = heatState.cells
      .map((cell) => {
        const pressure = Math.max(0, Number(cell.pressure || 0));
        const heat = Math.max(0, Number(cell.heat || 0));
        let traceDistance = Number.POSITIVE_INFINITY;
        let traceProgressMeters = 0;
        if (traceSnapshots.length === 1) {
          traceDistance = Math.hypot(cell.x - traceSnapshots[0].x, cell.y - traceSnapshots[0].y);
        } else {
          for (let index = 1; index < traceSnapshots.length; index += 1) {
            const previous = traceSnapshots[index - 1];
            const current = traceSnapshots[index];
            const dx = Number(current?.x || 0) - Number(previous?.x || 0);
            const dy = Number(current?.y || 0) - Number(previous?.y || 0);
            const lengthSquared = dx * dx + dy * dy;
            const projection = lengthSquared <= 1e-9
              ? 0
              : clamp(((cell.x - previous.x) * dx + (cell.y - previous.y) * dy) / lengthSquared, 0, 1);
            const closestX = Number(previous?.x || 0) + dx * projection;
            const closestY = Number(previous?.y || 0) + dy * projection;
            const segmentDistance = Math.hypot(cell.x - closestX, cell.y - closestY);
            if (segmentDistance < traceDistance) {
              traceDistance = segmentDistance;
              traceProgressMeters = Number(traceProgressDistances[index - 1] || 0) + Math.sqrt(lengthSquared) * projection;
            }
            if (traceDistance <= 0.05) {
              break;
            }
          }
        }
        if (traceDistance > revealDistance) {
          return null;
        }
        const metric = getLocalHeatCellMetric(
          cell,
          metricId,
          (metricId === 'cognitive' || metricId === 'psychological') ? pressure : 0
        );
        const revealWeight = smoothstep(0, revealDistance, Math.max(0, revealDistance - traceDistance));
        return {
          ...cell,
          pressure,
          heat,
          metric,
          traceDistance,
          traceProgressMeters,
          revealWeight,
        };
      })
      .filter(Boolean);
    if (!(state.revealedHeatCellsCache instanceof Map)) {
      state.revealedHeatCellsCache = new Map();
    }
    if (state.revealedHeatCellsCache.size > 24) {
      const oldestKey = state.revealedHeatCellsCache.keys().next().value;
      state.revealedHeatCellsCache.delete(oldestKey);
    }
    state.revealedHeatCellsCache.set(cacheKey, {
      heatState,
      traceSnapshots,
      cells: revealedCells,
    });
    return revealedCells;
  }

  function getFinalHeatCells(
    heatState,
    traceSnapshots,
    metricId = getSafeViewMode(state.viewMode),
    revealRadiusMeters = getTraceRevealRadiusMeters(metricId)
  ) {
    return buildTraceScopedHeatCells(
      heatState,
      traceSnapshots,
      metricId,
      revealRadiusMeters,
      `final-route:${metricId}`,
      { fullReveal: true }
    );
  }

  function getRevealedHeatCells(heatState, traceSnapshots, metricId = getSafeViewMode(state.viewMode), revealRadiusMeters = getTraceRevealRadiusMeters(metricId)) {
    const revealTime = Number(state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0);
    const revealBucket = getPlaybackRevealTimeBucket(revealTime);
    return buildTraceScopedHeatCells(
      heatState,
      traceSnapshots,
      metricId,
      revealRadiusMeters,
      `${metricId}:${revealBucket}`
    );
  }

  function getHeatCellAlpha(pressure, revealWeight = 1) {
    const safePressure = Math.max(0, Number(pressure) || 0);
    const safeRevealWeight = Number.isFinite(Number(revealWeight))
      ? clamp(Number(revealWeight), 0, 1)
      : 1;
    const pressureNormalized = heatAbsoluteNormalized(safePressure);
    const featheredAlpha = Math.pow(safeRevealWeight, 0.72);
    return clamp(featheredAlpha * (0.78 + pressureNormalized * 0.22), 0, 1);
  }

  function createHeatFieldRasterLegacy(
    revealedHeatCells,
    localPressureMin,
    localPressureMax,
    style = getHeatmapViewStyle(),
    transform = state.transform,
    viewMode = getSafeViewMode(state.viewMode)
  ) {
    if (!transform || !revealedHeatCells.length) {
      return null;
    }
    const rasterScale = getHeatSurfaceRasterScale();
    const width = Math.max(1, Math.round(transform.width || 0));
    const height = Math.max(1, Math.round(transform.height || 0));
    const raster = document.createElement('canvas');
    raster.width = Math.max(1, Math.round(width * rasterScale));
    raster.height = Math.max(1, Math.round(height * rasterScale));
    const rasterCtx = raster.getContext('2d');
    rasterCtx.imageSmoothingEnabled = true;
    rasterCtx.imageSmoothingQuality = 'high';
    const pixelWidth = raster.width;
    const pixelHeight = raster.height;
    const coverageBuffer = new Float32Array(pixelWidth * pixelHeight);
    const metricWeightBuffer = new Float32Array(pixelWidth * pixelHeight);
    const metricBuffer = new Float32Array(pixelWidth * pixelHeight);
    const metricPowerBuffer = new Float32Array(pixelWidth * pixelHeight);
    const routeProgressBuffer = new Float32Array(pixelWidth * pixelHeight);
    const prominenceBuffer = new Float32Array(pixelWidth * pixelHeight);
    let maxWeight = 0;
    const isSingleBurdenView = viewMode !== 'composite' && viewMode !== 'vitality';
    const isCompositeRelativeView = viewMode === 'composite';
    const rasterHeatCells = isSingleBurdenView
      ? annotateSingleBurdenCellProminence(revealedHeatCells)
      : revealedHeatCells;
    rasterHeatCells.forEach((cell) => {
      const point = worldToScreen(cell, transform);
      const rasterX = point.x * rasterScale;
      const rasterY = point.y * rasterScale;
      const pressure = Math.max(0, Number(cell.metric ?? cell.pressure ?? 0));
      const revealWeight = clamp(Number(cell.revealWeight ?? 1), 0, 1);
      const cellSizePixels = Math.max(2.2, Number(state.prepared?.grid?.cellSize || 1.15) * Number(transform.scale || 1));
      const fieldRadius = Math.max(
        cellSizePixels * (1.04 + revealWeight * 0.12),
        3.2
      );
      const radiusPixels = Math.max(3, Math.round(fieldRadius * rasterScale));
      const radiusSquared = radiusPixels * radiusPixels;
      const minX = Math.max(0, Math.floor(rasterX - radiusPixels));
      const maxX = Math.min(pixelWidth - 1, Math.ceil(rasterX + radiusPixels));
      const minY = Math.max(0, Math.floor(rasterY - radiusPixels));
      const maxY = Math.min(pixelHeight - 1, Math.ceil(rasterY + radiusPixels));
      for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
        const dy = (pixelY + 0.5) - rasterY;
        for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
          const dx = (pixelX + 0.5) - rasterX;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > radiusSquared) {
            continue;
          }
          const normalized = 1 - distanceSquared / Math.max(1, radiusSquared);
          const kernel = normalized * normalized;
          const coverageWeight = kernel * (0.35 + revealWeight * 0.65);
          const metricWeight = kernel * (0.35 + revealWeight * 0.65);
          const index = pixelY * pixelWidth + pixelX;
          coverageBuffer[index] += coverageWeight;
          metricWeightBuffer[index] += metricWeight;
          metricBuffer[index] += metricWeight * pressure;
          metricPowerBuffer[index] += metricWeight * Math.pow(pressure, HEAT_SINGLE_BURDEN_SOFT_PEAK_POWER);
          routeProgressBuffer[index] += metricWeight * Number(cell.traceProgressMeters || 0);
          prominenceBuffer[index] += metricWeight * Number(cell.localProminence || 0);
          if (coverageBuffer[index] > maxWeight) {
            maxWeight = coverageBuffer[index];
          }
        }
      }
    });
    const image = rasterCtx.createImageData(pixelWidth, pixelHeight);
    const peakImage = rasterCtx.createImageData(pixelWidth, pixelHeight);
    const densityThreshold = maxWeight > 0 ? maxWeight * 0.18 : 0;
    const displayMetricValues = [];
    for (let index = 0; index < coverageBuffer.length; index += 1) {
      const coverage = coverageBuffer[index];
      const metricWeight = metricWeightBuffer[index];
      if (coverage <= densityThreshold || metricWeight <= 1e-6) {
        continue;
      }
      const meanMetric = metricBuffer[index] / Math.max(metricWeight, 1e-6);
      const softPeakMetric = Math.pow(
        Math.max(0, metricPowerBuffer[index] / Math.max(metricWeight, 1e-6)),
        1 / HEAT_SINGLE_BURDEN_SOFT_PEAK_POWER
      );
      displayMetricValues.push(isSingleBurdenView
        ? meanMetric + (softPeakMetric - meanMetric) * HEAT_SINGLE_BURDEN_SOFT_PEAK_BLEND
        : meanMetric);
    }
    const sortedDisplayMetrics = getSortedNumericValues(displayMetricValues);
    const displayMetricMin = sortedDisplayMetrics.length
      ? sampleQuantile(
        sortedDisplayMetrics,
        isSingleBurdenView
          ? HEAT_SINGLE_BURDEN_RELATIVE_LOW_QUANTILE
          : isCompositeRelativeView ? HEAT_COMPOSITE_RELATIVE_LOW_QUANTILE : 0.02
      )
      : localPressureMin;
    const displayMetricMax = sortedDisplayMetrics.length
      ? sampleQuantile(
        sortedDisplayMetrics,
        isSingleBurdenView
          ? HEAT_SINGLE_BURDEN_RELATIVE_HIGH_QUANTILE
          : isCompositeRelativeView ? HEAT_COMPOSITE_RELATIVE_HIGH_QUANTILE : 0.98
      )
      : localPressureMax;
    const displayMetricSpan = Math.max(1e-6, displayMetricMax - displayMetricMin);
    const shouldDrawLegendPeakLayer = isSingleBurdenView;
    const peakRgb = samplePaletteRgb(1, style?.colorStops || DEFAULT_HEAT_COLOR_STOPS);
    for (let index = 0; index < coverageBuffer.length; index += 1) {
      const coverage = coverageBuffer[index];
      const metricWeight = metricWeightBuffer[index];
      if (coverage <= densityThreshold || metricWeight <= 1e-6) {
        continue;
      }
      const meanMetric = metricBuffer[index] / Math.max(metricWeight, 1e-6);
      const softPeakMetric = Math.pow(
        Math.max(0, metricPowerBuffer[index] / Math.max(metricWeight, 1e-6)),
        1 / HEAT_SINGLE_BURDEN_SOFT_PEAK_POWER
      );
      const metric = shouldDrawLegendPeakLayer
        ? meanMetric + (softPeakMetric - meanMetric) * HEAT_SINGLE_BURDEN_SOFT_PEAK_BLEND
        : meanMetric;
      const densityNormalized = maxWeight > 1e-6 ? clamp(coverage / maxWeight, 0, 1) : 0;
      const displayNormalized = clamp((metric - displayMetricMin) / displayMetricSpan, 0, 1);
      const paletteNormalized = isSingleBurdenView
        ? applySingleBurdenRelativeDisplayCurve(displayNormalized)
        : isCompositeRelativeView
          ? applyCompositeRelativeDisplayCurve(displayNormalized)
          : displayNormalized;
      const localProminence = isSingleBurdenView ? clamp(prominenceBuffer[index] / Math.max(metricWeight, 1e-6), 0, 1) : 1;
      const rgb = samplePaletteRgb(paletteNormalized, style?.colorStops || DEFAULT_HEAT_COLOR_STOPS);
      const edgeAlpha = smoothstep(0.18, 0.22, densityNormalized);
      const prominenceAlpha = isSingleBurdenView
        ? (HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR + (1 - HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR) * localProminence)
        : 1;
      const offset = index * 4;
      image.data[offset] = rgb[0];
      image.data[offset + 1] = rgb[1];
      image.data[offset + 2] = rgb[2];
      image.data[offset + 3] = Math.round(clamp(edgeAlpha * prominenceAlpha, 0, 1) * 255);
      if (shouldDrawLegendPeakLayer) {
        const peakAlpha = smoothstep(0.58, 0.94, localProminence) * smoothstep(0.18, 0.38, densityNormalized) * 0.42;
        if (peakAlpha > 0) {
          peakImage.data[offset] = peakRgb[0];
          peakImage.data[offset + 1] = peakRgb[1];
          peakImage.data[offset + 2] = peakRgb[2];
          peakImage.data[offset + 3] = Math.round(peakAlpha * 255);
        }
      }
    }
    rasterCtx.putImageData(image, 0, 0);
    if (shouldDrawLegendPeakLayer) {
      const peakCanvas = document.createElement('canvas');
      peakCanvas.width = pixelWidth;
      peakCanvas.height = pixelHeight;
      const peakCtx = peakCanvas.getContext('2d');
      peakCtx.putImageData(peakImage, 0, 0);
      rasterCtx.globalCompositeOperation = 'source-over';
      rasterCtx.drawImage(peakCanvas, 0, 0);
    }
    return raster;
  }

  function createHeatFieldRaster(
    revealedHeatCells,
    localPressureMin,
    localPressureMax,
    style = getHeatmapViewStyle(),
    transform = state.transform,
    displayProfile = null,
    viewMode = getSafeViewMode(state.viewMode)
  ) {
    if (!transform || !revealedHeatCells.length) {
      return null;
    }
    const rasterScale = getHeatSurfaceRasterScale();
    const width = Math.max(1, Math.round(transform.width || 0));
    const height = Math.max(1, Math.round(transform.height || 0));
    const raster = document.createElement('canvas');
    raster.width = Math.max(1, Math.round(width * rasterScale));
    raster.height = Math.max(1, Math.round(height * rasterScale));
    const rasterCtx = raster.getContext('2d');
    rasterCtx.imageSmoothingEnabled = true;
    rasterCtx.imageSmoothingQuality = 'high';
    rasterCtx.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
    rasterCtx.clearRect(0, 0, width, height);
    rasterCtx.globalCompositeOperation = 'source-over';
    const pixelWidth = raster.width;
    const pixelHeight = raster.height;
    const weightBuffer = new Float32Array(pixelWidth * pixelHeight);
    const metricBuffer = new Float32Array(pixelWidth * pixelHeight);
    let maxWeight = 0;
    const cellSizePixels = Math.max(2.4, Number(state.prepared?.grid?.cellSize || 1.15) * Number(transform.scale || 1));

    revealedHeatCells.forEach((cell) => {
      const point = worldToScreen(cell, transform);
      const rasterX = point.x * rasterScale;
      const rasterY = point.y * rasterScale;
      const pressure = Math.max(0, Number(cell.metric ?? cell.pressure ?? 0));
      const revealWeight = clamp(Number(cell.revealWeight ?? 1), 0, 1);
      const absoluteNormalized = heatAbsoluteNormalized(pressure, style);
      const localNormalized = localPressureMax > localPressureMin + 1e-6
        ? clamp((pressure - localPressureMin) / (localPressureMax - localPressureMin), 0, 1)
        : absoluteNormalized;
      const fieldIntensity = clamp(Math.max(Math.pow(localNormalized, 1.18), absoluteNormalized * 0.62), 0, 1);
      const fieldRadius = Math.max(
        cellSizePixels * (1.34 + fieldIntensity * 0.42 + revealWeight * 0.12),
        5.4
      );
      const radiusPixels = Math.max(4, Math.round(fieldRadius * rasterScale));
      const radiusSquared = radiusPixels * radiusPixels;
      const minX = Math.max(0, Math.floor(rasterX - radiusPixels));
      const maxX = Math.min(pixelWidth - 1, Math.ceil(rasterX + radiusPixels));
      const minY = Math.max(0, Math.floor(rasterY - radiusPixels));
      const maxY = Math.min(pixelHeight - 1, Math.ceil(rasterY + radiusPixels));
      const weightGain = 0.22 + fieldIntensity * 0.78;
      for (let pixelY = minY; pixelY <= maxY; pixelY += 1) {
        const dy = (pixelY + 0.5) - rasterY;
        for (let pixelX = minX; pixelX <= maxX; pixelX += 1) {
          const dx = (pixelX + 0.5) - rasterX;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > radiusSquared) {
            continue;
          }
          const normalized = 1 - distanceSquared / Math.max(1, radiusSquared);
          const kernel = normalized * normalized * normalized;
          const weight = kernel * weightGain;
          const index = pixelY * pixelWidth + pixelX;
          weightBuffer[index] += weight;
          metricBuffer[index] += weight * pressure;
          if (weightBuffer[index] > maxWeight) {
            maxWeight = weightBuffer[index];
          }
        }
      }
    });

    const fieldCanvas = document.createElement('canvas');
    fieldCanvas.width = pixelWidth;
    fieldCanvas.height = pixelHeight;
    const fieldCtx = fieldCanvas.getContext('2d');
    const fieldImage = fieldCtx.createImageData(pixelWidth, pixelHeight);

    const coreCanvas = document.createElement('canvas');
    coreCanvas.width = pixelWidth;
    coreCanvas.height = pixelHeight;
    const coreCtx = coreCanvas.getContext('2d');
    const coreImage = coreCtx.createImageData(pixelWidth, pixelHeight);

    const densityThreshold = maxWeight > 0
      ? maxWeight * (viewMode === 'composite' ? 0.0009 : 0.0018)
      : 0;
    for (let index = 0; index < weightBuffer.length; index += 1) {
      const weight = weightBuffer[index];
      if (weight <= densityThreshold) {
        continue;
      }
      const metric = metricBuffer[index] / Math.max(weight, 1e-6);
      const displayNormalized = mapHeatMetricToDisplayNormalized(metric, displayProfile, style);
      const fogNormalized = clamp(Math.pow(displayNormalized, 1.04), 0, 1);
      const coreNormalized = clamp(Math.pow(displayNormalized, 0.82), 0, 1);
      const baseColor = samplePaletteRgb(displayNormalized, style?.colorStops || DEFAULT_HEAT_COLOR_STOPS);
      const isCompositeView = viewMode === 'composite';
        const { fieldColor, coreColor: singleCoreColor } = getSingleBurdenHeatColors(baseColor, displayNormalized, style);
        const color = isCompositeView ? baseColor : fieldColor;
        const coreColor = isCompositeView ? baseColor : singleCoreColor;
        const densityNormalized = maxWeight > 1e-6 ? clamp(weight / maxWeight, 0, 1) : 0;
        const fieldAlpha = clamp(
          isCompositeView
            ? (0.12 + fogNormalized * 0.34) * (0.68 + densityNormalized * 0.32)
            : (0.11 + fogNormalized * 0.24) * (0.76 + densityNormalized * 0.24),
          isCompositeView ? 0.1 : 0.1,
          isCompositeView ? 0.54 : 0.44
        );
        const coreAlpha = isCompositeView
          ? 0
          : smoothstep(0.8, 0.98, coreNormalized) * 0.5;
        const offset = index * 4;
        fieldImage.data[offset] = color[0];
        fieldImage.data[offset + 1] = color[1];
        fieldImage.data[offset + 2] = color[2];
      fieldImage.data[offset + 3] = Math.round(fieldAlpha * 255);
      if (coreAlpha > 0) {
        coreImage.data[offset] = coreColor[0];
        coreImage.data[offset + 1] = coreColor[1];
        coreImage.data[offset + 2] = coreColor[2];
        coreImage.data[offset + 3] = Math.round(coreAlpha * 255);
      }
    }

    fieldCtx.putImageData(fieldImage, 0, 0);
    coreCtx.putImageData(coreImage, 0, 0);

    rasterCtx.filter = viewMode === 'composite'
      ? `blur(${Math.max(0.45, rasterScale * 0.18)}px)`
      : `blur(${Math.max(1.2, rasterScale * 0.6)}px)`;
    rasterCtx.globalAlpha = 1;
    rasterCtx.drawImage(fieldCanvas, 0, 0, width, height);
    rasterCtx.filter = 'none';
    rasterCtx.drawImage(coreCanvas, 0, 0, width, height);

    return raster;
  }

  function getCachedHeatRaster(
    cacheKey,
    heatState,
    revealedHeatCells,
    localMetricMin,
    localMetricMax,
    style,
    transformSignature,
    transform,
    displayProfile = null,
    viewMode = getSafeViewMode(state.viewMode)
  ) {
    if (!(state.heatRasterCache instanceof Map)) {
      state.heatRasterCache = new Map();
    }
    const cached = state.heatRasterCache.get(cacheKey);
    if (
      cached
      && cached.heatState === heatState
      && cached.revealedHeatCells === revealedHeatCells
      && cached.localMetricMin === localMetricMin
      && cached.localMetricMax === localMetricMax
      && cached.displayProfileSignature === (displayProfile?.signature || '')
      && cached.viewMode === viewMode
      && cached.style === style
      && cached.transformSignature === transformSignature
    ) {
      return cached.raster;
    }
    const raster = createHeatFieldRasterLegacy(revealedHeatCells, localMetricMin, localMetricMax, style, transform, viewMode);
    if (state.heatRasterCache.size > 24) {
      const oldestKey = state.heatRasterCache.keys().next().value;
      state.heatRasterCache.delete(oldestKey);
    }
    state.heatRasterCache.set(cacheKey, {
      heatState,
      revealedHeatCells,
      localMetricMin,
      localMetricMax,
      displayProfileSignature: displayProfile?.signature || '',
      viewMode,
      style,
      transformSignature,
      raster,
    });
    return raster;
  }

  function createHeatRevealMaskRaster(traceSnapshots, transform, revealRadiusMeters, rasterScale = getHeatSurfaceRasterScale()) {
    const width = Math.max(1, Math.round(transform.width || 0));
    const height = Math.max(1, Math.round(transform.height || 0));
    const mask = document.createElement('canvas');
    mask.width = Math.max(1, Math.round(width * rasterScale));
    mask.height = Math.max(1, Math.round(height * rasterScale));
    const ctx = mask.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!Array.isArray(traceSnapshots) || !traceSnapshots.length) {
      return mask;
    }
    const lineWidth = Math.max(2, revealRadiusMeters * 2 * Number(transform.scale || 1));
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (traceSnapshots.length === 1) {
      const point = worldToScreen(traceSnapshots[0], transform);
      ctx.beginPath();
      ctx.arc(point.x, point.y, lineWidth * 0.5, 0, Math.PI * 2);
      ctx.fill();
      return mask;
    }
    ctx.beginPath();
    traceSnapshots.forEach((snapshot, index) => {
      const point = worldToScreen(snapshot, transform);
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    const firstPoint = worldToScreen(traceSnapshots[0], transform);
    const lastPoint = worldToScreen(traceSnapshots[traceSnapshots.length - 1], transform);
    ctx.beginPath();
    ctx.arc(firstPoint.x, firstPoint.y, lineWidth * 0.5, 0, Math.PI * 2);
    ctx.arc(lastPoint.x, lastPoint.y, lineWidth * 0.5, 0, Math.PI * 2);
    ctx.fill();
    return mask;
  }

  function createVitalityRibbonRaster(traceSnapshots, transform, localMetricMin, localMetricMax, rasterScale = getHeatSurfaceRasterScale()) {
    if (!transform || !Array.isArray(traceSnapshots) || traceSnapshots.length < 2) {
      return null;
    }
    const width = Math.max(1, Math.round(transform.width || 0));
    const height = Math.max(1, Math.round(transform.height || 0));
    const raster = document.createElement('canvas');
    raster.width = Math.max(1, Math.round(width * rasterScale));
    raster.height = Math.max(1, Math.round(height * rasterScale));
    const rasterCtx = raster.getContext('2d');
    rasterCtx.imageSmoothingEnabled = true;
    rasterCtx.imageSmoothingQuality = 'high';
    rasterCtx.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
    rasterCtx.clearRect(0, 0, width, height);
    paintVitalityRateRibbon(rasterCtx, traceSnapshots, transform, localMetricMin, localMetricMax);
    return raster;
  }

  function getCachedVitalityRibbonRaster(cacheKey, traceSnapshots, transformSignature, transform, localMetricMin, localMetricMax) {
    if (!(state.vitalityRibbonRasterCache instanceof Map)) {
      state.vitalityRibbonRasterCache = new Map();
    }
    const cached = state.vitalityRibbonRasterCache.get(cacheKey);
    if (
      cached
      && cached.traceSnapshots === traceSnapshots
      && cached.transformSignature === transformSignature
      && cached.localMetricMin === localMetricMin
      && cached.localMetricMax === localMetricMax
    ) {
      return cached.raster;
    }
    const raster = createVitalityRibbonRaster(traceSnapshots, transform, localMetricMin, localMetricMax);
    if (state.vitalityRibbonRasterCache.size > 24) {
      const oldestKey = state.vitalityRibbonRasterCache.keys().next().value;
      state.vitalityRibbonRasterCache.delete(oldestKey);
    }
    state.vitalityRibbonRasterCache.set(cacheKey, {
      traceSnapshots,
      transformSignature,
      localMetricMin,
      localMetricMax,
      raster,
    });
    return raster;
  }

  function paintHeatSurface(ctx, surface, width, height, revealMask = null) {
    if (!surface) {
      return;
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.drawImage(surface, 0, 0, width, height);
    if (revealMask) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(revealMask, 0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function getCachedHeatRevealMask(cacheKey, transformSignature, traceSnapshots, transform, revealRadiusMeters) {
    if (!(state.heatRevealMaskCache instanceof Map)) {
      state.heatRevealMaskCache = new Map();
    }
    const cached = state.heatRevealMaskCache.get(cacheKey);
    if (
      cached
      && cached.transformSignature === transformSignature
      && cached.traceSnapshots === traceSnapshots
      && cached.revealRadiusMeters === revealRadiusMeters
    ) {
      return cached.mask;
    }
    const mask = createHeatRevealMaskRaster(traceSnapshots, transform, revealRadiusMeters);
    if (state.heatRevealMaskCache.size > 24) {
      const oldestKey = state.heatRevealMaskCache.keys().next().value;
      state.heatRevealMaskCache.delete(oldestKey);
    }
    state.heatRevealMaskCache.set(cacheKey, {
      transformSignature,
      traceSnapshots,
      revealRadiusMeters,
      mask,
    });
    return mask;
  }

  function buildVitalityRibbonSegments(traceSnapshots) {
    if (!Array.isArray(traceSnapshots) || traceSnapshots.length < 2) {
      return [];
    }
    const rawSegments = [];
    for (let index = 1; index < traceSnapshots.length; index += 1) {
      const previous = traceSnapshots[index - 1];
      const current = traceSnapshots[index];
      const dx = Number(current?.x || 0) - Number(previous?.x || 0);
      const dy = Number(current?.y || 0) - Number(previous?.y || 0);
      const distanceMeters = Math.hypot(dx, dy);
      const previousTime = Number(previous?.time || 0);
      const currentTime = Number(current?.time || previousTime);
      const elapsedSeconds = Math.max(0, currentTime - previousTime);
      if (distanceMeters < HEAT_TRACE_MIN_SEGMENT_DISTANCE && elapsedSeconds < 0.05) {
        continue;
      }
      const previousMetric = getSnapshotMetricValue(previous, 'vitality', Number(previous?.fatigue || 0));
      const currentMetric = getSnapshotMetricValue(current, 'vitality', Number(current?.fatigue || previousMetric));
      const growth = Math.max(0, currentMetric - previousMetric);
      rawSegments.push({
        previous,
        current,
        previousMetric,
        currentMetric,
        averageMetric: (previousMetric + currentMetric) * 0.5,
        rawRate: growth / Math.max(distanceMeters, 0.25),
      });
    }
    if (!rawSegments.length) {
      return [];
    }
    const smoothedRates = rawSegments.map((segment, index, items) => {
      const previousRate = Number(items[index - 1]?.rawRate ?? segment.rawRate);
      const currentRate = Number(segment.rawRate || 0);
      const nextRate = Number(items[index + 1]?.rawRate ?? segment.rawRate);
      return (previousRate + currentRate * 1.8 + nextRate) / 3.8;
    });
    const positiveRates = getSortedNumericValues(smoothedRates.filter((value) => value > 1e-6));
    const peakRate = positiveRates.length ? positiveRates[positiveRates.length - 1] : 0;
    const baselineRate = sampleQuantile(positiveRates, 0.2);
    const emphasisRate = sampleQuantile(positiveRates, 0.85);
    const emphasisSpan = Math.max(1e-6, emphasisRate - baselineRate);
    return rawSegments.map((segment, index) => {
      const smoothedRate = Number(smoothedRates[index] || 0);
      const peakNormalized = peakRate > 1e-6 ? clamp(smoothedRate / peakRate, 0, 1) : 0;
      const contrastNormalized = peakRate > 1e-6
        ? clamp((smoothedRate - baselineRate) / emphasisSpan, 0, 1)
        : 0;
      let growthRateNormalized = Math.max(contrastNormalized, peakNormalized * 0.38);
      if (smoothedRate > 1e-6) {
        growthRateNormalized = Math.pow(clamp(growthRateNormalized, 0, 1), 0.6);
        growthRateNormalized = Math.max(growthRateNormalized, 0.12);
      } else {
        growthRateNormalized = 0;
      }
      return {
        ...segment,
        smoothedRate,
        growthRateNormalized,
      };
    });
  }

  function getVitalityRibbonWidth(growthRateNormalized, transform) {
    const widthRatio = Math.pow(clamp(Number(growthRateNormalized || 0), 0, 1), 1.65);
    const widthMeters = VITALITY_RIBBON_MIN_WIDTH_METERS
      + (VITALITY_RIBBON_MAX_WIDTH_METERS - VITALITY_RIBBON_MIN_WIDTH_METERS) * widthRatio;
    return Math.max(1.25, widthMeters * Math.max(Number(transform?.scale || 0), 0));
  }

  function paintVitalityRateRibbon(ctx, traceSnapshots, transform, localPressureMin, localPressureMax) {
    const segments = buildVitalityRibbonSegments(traceSnapshots);
    if (!segments.length) {
      return;
    }
    const style = getHeatmapViewStyle('vitality');
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    segments.forEach((segment) => {
      const start = worldToScreen(segment.previous, transform);
      const end = worldToScreen(segment.current, transform);
      const startRgb = getHeatDisplayRgb(segment.previousMetric, localPressureMin, localPressureMax, style);
      const endRgb = getHeatDisplayRgb(segment.currentMetric, localPressureMin, localPressureMax, style);
      const width = getVitalityRibbonWidth(segment.growthRateNormalized, transform);
      const haloWidth = width + Math.max(transform.scale * 0.9, 2);
      const outlineGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      outlineGradient.addColorStop(0, rgba(startRgb, 0.22 + segment.growthRateNormalized * 0.12));
      outlineGradient.addColorStop(1, rgba(endRgb, 0.28 + segment.growthRateNormalized * 0.16));
      ctx.strokeStyle = outlineGradient;
      ctx.lineWidth = haloWidth;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const glowGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      glowGradient.addColorStop(0, rgba(startRgb, 0.2 + segment.growthRateNormalized * 0.16));
      glowGradient.addColorStop(1, rgba(endRgb, 0.24 + segment.growthRateNormalized * 0.18));
      ctx.strokeStyle = glowGradient;
      ctx.lineWidth = width + Math.max(transform.scale * 0.36, 1.2);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const coreGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
      coreGradient.addColorStop(0, rgba(startRgb, 0.68 + segment.growthRateNormalized * 0.14));
      coreGradient.addColorStop(1, rgba(endRgb, 0.74 + segment.growthRateNormalized * 0.16));
      ctx.strokeStyle = coreGradient;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function paintHeatFieldKernels(ctx, revealedHeatCells, transform, localMetricMin, localMetricMax) {
    if (!revealedHeatCells.length) {
      return;
    }
    const cellSizePixels = Math.max(2, Number(state.prepared?.grid?.cellSize || 1.15) * transform.scale);
    revealedHeatCells.forEach((cell) => {
      const metric = Math.max(0, Number(cell.metric ?? cell.pressure ?? 0));
      const absoluteNormalized = heatAbsoluteNormalized(metric);
      const localNormalized = localMetricMax > localMetricMin + 1e-6
        ? clamp((metric - localMetricMin) / (localMetricMax - localMetricMin), 0, 1)
        : absoluteNormalized;
      const revealWeight = clamp(Number(cell.revealWeight || 0), 0, 1);
      const rgb = heatRgb(metric);
      const point = worldToScreen(cell, transform);
      const radius = Math.max(cellSizePixels * (1.08 + revealWeight * 0.34), 5.6);
      const coreAlpha = clamp(0.06 + absoluteNormalized * 0.16 + localNormalized * 0.12 + revealWeight * 0.1, 0.07, 0.42);
      const midAlpha = clamp(coreAlpha * 0.55, 0.04, 0.24);
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, rgba(rgb, coreAlpha));
      gradient.addColorStop(0.45, rgba(rgb, midAlpha));
      gradient.addColorStop(1, rgba(rgb, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    });
  }

  function clipHeatmapToWalkableArea(ctx, transform = state.transform) {
    if (!state.prepared?.walkableAreas?.length) {
      return;
    }
    ctx.beginPath();
    state.prepared.walkableAreas.forEach((polygon) => {
      polygon.forEach(([x, y], index) => {
        const screenPoint = worldToScreen({ x, y }, transform);
        if (index === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      });
      ctx.closePath();
    });
    ctx.clip();
  }

  function clipHeatmapToTraceCorridor(ctx, traceSnapshots, revealRadiusMeters = HEAT_TRACE_RADIUS_METERS, transform = state.transform) {
    if (!Array.isArray(traceSnapshots) || !traceSnapshots.length) {
      return;
    }
    const screenRadius = Math.max(2, revealRadiusMeters * transform.scale);
    const stepDistance = Math.max(0.6, revealRadiusMeters * 0.34);
    ctx.beginPath();
    if (traceSnapshots.length === 1) {
      const point = worldToScreen(traceSnapshots[0], transform);
      ctx.arc(point.x, point.y, screenRadius, 0, Math.PI * 2);
      ctx.clip();
      return;
    }
    for (let index = 1; index < traceSnapshots.length; index += 1) {
      const previous = traceSnapshots[index - 1];
      const current = traceSnapshots[index];
      const segmentLength = Math.hypot(current.x - previous.x, current.y - previous.y);
      const steps = Math.max(1, Math.ceil(segmentLength / stepDistance));
      for (let stepIndex = 0; stepIndex <= steps; stepIndex += 1) {
        const ratio = stepIndex / steps;
        const samplePoint = {
          x: previous.x + (current.x - previous.x) * ratio,
          y: previous.y + (current.y - previous.y) * ratio,
        };
        const screenPoint = worldToScreen(samplePoint, transform);
        ctx.moveTo(screenPoint.x + screenRadius, screenPoint.y);
        ctx.arc(screenPoint.x, screenPoint.y, screenRadius, 0, Math.PI * 2);
      }
    }
    ctx.clip();
  }

  function clearHeatmapObstacles(ctx, transform = state.transform) {
    if (!state.prepared?.obstacles?.length) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    state.prepared.obstacles.forEach((polygon) => {
      polygon.forEach(([x, y], index) => {
        const screenPoint = worldToScreen({ x, y }, transform);
        if (index === 0) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      });
      ctx.closePath();
    });
    ctx.fill();
    ctx.restore();
  }

  function syncScenarioToPlaybackArtifacts(playback = getActivePlayback()) {
    if (!state.scenario || !playback) {
      return;
    }
    state.scenario.precomputedPlayback = playback;
    state.scenario.usePrecomputedHeatPlayback = true;
    state.scenario.heatActive = true;
    state.scenario.heat = playback.heat || state.scenario.heat;
    state.scenario.hotspots = Array.isArray(playback.hotspots) ? playback.hotspots.map((item) => ({ ...item })) : state.scenario.hotspots;
    state.scenario.suggestions = Array.isArray(playback.suggestions) ? playback.suggestions.slice() : state.scenario.suggestions;
    state.scenario.summary = playback.summary ? { ...playback.summary } : state.scenario.summary;
    state.scenario.llmDecisionPlan = playback.llmDecisionPlan || playback.meta?.llmDecisionPlan || state.scenario.llmDecisionPlan || null;
  }

  function ensurePlaybackScenarioState() {
    if (!state.scenario?.precomputedPlayback) {
      return;
    }
    if (!state.scenario.heatActive || !state.scenario.usePrecomputedHeatPlayback) {
      syncScenarioToPlaybackArtifacts(state.scenario.precomputedPlayback);
    }
  }

  function applyHeatmapDisplayMode(mode) {
    const nextMode = mode === 'final' ? 'final' : 'playback';
    state.heatmapDisplayMode = nextMode;
    clearHeatCellMetricCache();
  }

  function handleHeatmapDisplayModeToggle() {
    if (!state.scenario?.heatActive || state.heatmapRevealLocked) {
      requestRender();
      return;
    }
    const playback = getActivePlayback();
    const endTime = Number(playback?.endTime);
    lockHeatmapRevealAt(Number.isFinite(endTime) ? endTime : getCurrentHeatmapRevealTime(playback));
    requestRender();
  }

  function advancePrecomputedPlayback(deltaSeconds) {
    const playback = getActivePlayback();
    if (!state.prepared || !state.scenario || !playback) {
      return;
    }
    const startTime = Number.isFinite(Number(playback.startTime)) ? Number(playback.startTime) : 0;
    const endTime = Number.isFinite(Number(playback.endTime)) ? Number(playback.endTime) : startTime;
    const currentTime = Number.isFinite(Number(state.scenario.playbackRevealTime)) ? Number(state.scenario.playbackRevealTime) : startTime;
    const stepSeconds = Math.max(0, Number(deltaSeconds || 0));
    const available = Math.max(0, endTime - currentTime);
    const stepAmount = Math.min(stepSeconds, available);
    const backgroundField = playback.backgroundField;
    const frames = backgroundField?.frames;

    if (stepAmount > 1e-6 && !(frames?.length || backgroundField?.initialAgents?.length)) {
      Sim.stepScenario(state.prepared, state.scenario, stepAmount, { skipFocusAgent: true });
    }

    let nextTime = currentTime + stepAmount;
    if (nextTime >= endTime - 1e-9) {
      state.scenario.firstPassComplete = true;
      if (!state.heatmapRevealLocked) {
        lockHeatmapRevealAt(endTime);
      }
      Sim.resetScenarioToReplayBaseline(state.prepared, state.scenario);
      nextTime = startTime;
    }
    state.scenario.playbackRevealTime = nextTime;

    // Inject background agents from precomputed background field (avoids per-frame simulation + keeps agent count stable)
    if (frames?.length) {
      const backgroundSampleTime = getFocusCycleBackgroundSampleTime(playback, backgroundField, nextTime);
      const backgroundPlaybackState = resolveLoopedBackgroundPlaybackFramePair(backgroundField, backgroundSampleTime, {
        loopStartTime: Number(backgroundField?.initialTime || frames[0]?.time || 0),
      });
      const prevFrame = backgroundPlaybackState.previousFrame || frames[0];
      const nextFrame = backgroundPlaybackState.nextFrame || prevFrame;
      const ratio = backgroundPlaybackState.ratio;
      const backgroundFrameTimeSpan = Math.max(0, Number(nextFrame?.time || 0) - Number(prevFrame?.time || 0));
      state.backgroundPlaybackRenderState = backgroundPlaybackState ? {
        prevFrame,
        nextFrame,
        ratio,
        backgroundFrameTimeSpan,
        sampleTime: Number(backgroundPlaybackState.sampleTime || backgroundSampleTime),
      } : null;
      state.scenario.backgroundAgents = ratio < 0.5
        ? (Array.isArray(prevFrame?.agents) ? prevFrame.agents : [])
        : (Array.isArray(nextFrame?.agents) ? nextFrame.agents : []);
    } else if (backgroundField?.initialAgents?.length) {
      // Fallback: use initial agents if frames not yet available
      state.scenario.backgroundAgents = backgroundField.initialAgents.map((a) => ({ ...a }));
      state.backgroundPlaybackRenderState = null;
    } else {
      state.backgroundPlaybackRenderState = null;
    }

    syncScenarioToPlaybackArtifacts(playback);
  }

  function findInteractiveTarget(target, root = elements.overlayLayer) {
    let current = target;
    while (current && current !== root) {
      if (current.dataset && current.dataset.type) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function getOverlayInteractionTransform(overlayElement = elements.overlayLayer) {
    if (!overlayElement || overlayElement === elements.overlayLayer) {
      return state.transform;
    }
    return computeTransformForViewportSize(overlayElement.clientWidth, overlayElement.clientHeight);
  }

  function getFocusProfile() {
    return {
      capacityScores: getNormalizedCapacityScores(state.focusProfile.capacityScores, state.focusProfile),
    };
  }

  function suggestionForInspection(inspection) {
    if (!inspection) {
      return '';
    }
    if (inspection.needsRest) {
      return inspection.nearbySeats && inspection.nearbySeats.length ? t('hint.restWithSeats') : t('hint.restWithoutSeats');
    }
    return t('hint.keepMoving');
  }

  function renderPrimaryMetrics(sourceInspection = null) {
    if (!elements.fatiguePrimaryValue || !elements.cognitiveLoadPrimaryValue) {
      return;
    }
    const inspection =
      sourceInspection
      || getPlaybackFocusInspection()
      || (state.prepared && state.scenario ? Sim.inspectAgent(state.prepared, state.scenario, state.scenario.focusAgentId) : null);
    const fatigue = inspection?.fatigue || 0;
    const fatigueThreshold = inspection?.fatigueThreshold || getFatigueThreshold();
    const cognitiveLoad = inspection?.cognitiveLoad ?? inspection?.pressure ?? 0;
    elements.fatiguePrimaryValue.textContent = formatMetricValue(fatigue);
    elements.cognitiveLoadPrimaryValue.textContent = formatMetricValue(cognitiveLoad);
    elements.fatiguePrimaryValue.classList.toggle('threshold-alert', fatigue >= fatigueThreshold);
    elements.cognitiveLoadPrimaryValue.classList.remove('threshold-alert');
  }

  function syncScenarioRuntimeState() {
    state.firstPassComplete = Boolean(state.scenario?.firstPassComplete);
    state.loopPlaybackActive = Boolean(state.scenario?.loopPlaybackActive);
    if (state.scenario?.usePrecomputedHeatPlayback && Array.isArray(state.scenario?.precomputedPlayback?.traceSnapshots)) {
      state.focusTraceSnapshots = state.scenario.precomputedPlayback.traceSnapshots;
      return;
    }
    state.focusTraceSnapshots = Array.isArray(state.scenario?.focusTraceSnapshots) ? state.scenario.focusTraceSnapshots : [];
  }

  function getCategoryLabel(category) {
    return t(`categories.${category || 'unknown'}`);
  }

  function getNodeKindLabel(kind) {
    return t(`kinds.${kind || 'unknown'}`);
  }

  function getRoleLabel(role) {
    return t(`roles.${role || 'neutral'}`);
  }

  function getObjectBySelection(selection) {
    if (!selection || !state.prepared) {
      return null;
    }
    if (selection.type === 'node') {
      return state.prepared.nodeById[selection.id] || null;
    }
    if (selection.type === 'pressure') {
      return state.prepared.pressureById[selection.id] || null;
    }
    if (selection.type === 'seat') {
      return state.prepared.seats.find((seat) => seat.id === selection.id) || null;
    }
    return null;
  }

  function updateLocaleStaticText() {
    document.documentElement.lang = state.locale === 'zh-CN' ? 'zh-CN' : 'en';
    document.title = `${getProductName()} / ${getDisplayFileName()}`;
    if (elements.screenLocaleToggle) {
      elements.screenLocaleToggle.textContent = getShellLocaleToggleLabel();
    }
    if (elements.landingTag) {
      elements.landingTag.textContent = t('landing.tag');
    }
    if (elements.landingTitleLine1) {
      elements.landingTitleLine1.textContent = t('landing.titleLine1');
    }
    if (elements.landingTitleLine2) {
      elements.landingTitleLine2.textContent = t('landing.titleLine2');
    }
    if (elements.landingDescription) {
      elements.landingDescription.textContent = t('landing.description');
    }
    elements.appProductName.textContent = getProductName();
    elements.appFileName.textContent = getDisplayFileName();
    elements.appFileName.classList.toggle('hidden', state.isEditingFileName);
    elements.appFileNameInput.classList.toggle('hidden', !state.isEditingFileName);
    elements.appFileNameInput.value = state.fileNameDraft;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      element.textContent = t(key);
    });
    renderViewModeOptions(state.locale);
    renderCapacityControls(state.agentModal.draft, state.locale);
    if (elements.agentRadarHint) {
      elements.agentRadarHint.textContent = t('hint.agentRadar');
    }
    if (elements.agentBehaviorTitle) {
      elements.agentBehaviorTitle.textContent = t('label.agentBehavior');
    }
    elements.localeZh.classList.toggle('active', state.locale === 'zh-CN');
    elements.localeEn.classList.toggle('active', state.locale === 'en');
  }

  function updateRouteSummary() {
    const startLabel = formatStartSelection();
    const targetLabel = getTargetRegionLabel();
    const hintKey = state.routePickMode === 'pick-start' ? 'hint.routePickStart' : state.routePickMode === 'pick-target' ? 'hint.routePickTarget' : state.routeSelection.startPoint && state.routeSelection.targetRegionId ? 'hint.routePickReady' : 'hint.routePickIdle';
    elements.selectedStart.textContent = startLabel;
    elements.selectedEnd.textContent = targetLabel;
    if (elements.settingsOriginValue) {
      elements.settingsOriginValue.value = startLabel;
    }
    if (elements.settingsDestinationValue) {
      if ('value' in elements.settingsDestinationValue) {
        elements.settingsDestinationValue.value = targetLabel;
      } else {
        elements.settingsDestinationValue.textContent = targetLabel;
      }
    }
    if (elements.routePickHint) {
      elements.routePickHint.textContent = t(hintKey);
    }
    if (elements.settingsRoutePickHint) {
      elements.settingsRoutePickHint.textContent = t(hintKey);
    }
    if (elements.routePickBtn) {
      elements.routePickBtn.textContent = t('button.pickRoute');
      elements.routePickBtn.classList.toggle('active', state.routeModal.open);
    }
  }

  function renderSettingsDestinationMenu() {
    if (!elements.settingsDestinationMenu || !elements.settingsDestinationTrigger) {
      return;
    }
    const hasPreparedModel = Boolean(state.prepared?.targetRegions?.length);
    elements.settingsDestinationMenu.classList.toggle('hidden', !hasPreparedModel || state.uiScreen !== 'settings' || !state.settingsDestinationMenuOpen);
    elements.settingsDestinationTrigger.disabled = !hasPreparedModel;
    elements.settingsDestinationTrigger.setAttribute('aria-expanded', state.settingsDestinationMenuOpen ? 'true' : 'false');
    if (!hasPreparedModel) {
      elements.settingsDestinationMenu.innerHTML = '';
      return;
    }
    elements.settingsDestinationMenu.innerHTML = state.prepared.targetRegions
      .map((region) => {
        const isActive = region.id === state.routeSelection.targetRegionId;
        const label = state.locale === 'zh-CN' ? region.labelZh : region.labelEn || region.labelZh;
        return `<button class="route-region-btn${isActive ? ' active' : ''}" type="button" data-settings-region-id="${escapeHtml(region.id)}">${escapeHtml(label)}</button>`;
      })
      .join('');
  }

  function setModelStatus() {
    if (elements.settingsUploadTrigger) {
      elements.settingsUploadTrigger.dataset.hasFile = state.prepared ? 'true' : 'false';
    }
    if (state.importError) {
      setChip(elements.viewModelStatus, 'paused', t('status.error'));
      elements.modelSource.textContent = state.importError;
      if (elements.settingsUploadFile) {
        elements.settingsUploadFile.textContent = state.modelSourceName || t('hint.chooseFile');
      }
      if (elements.settingsModelStatus) {
        elements.settingsModelStatus.textContent = state.importError;
      }
      return;
    }
    if (!state.prepared) {
      setChip(elements.viewModelStatus, 'muted', t('status.notLoaded'));
      elements.modelSource.textContent = t('hint.chooseFile');
      if (elements.settingsUploadFile) {
        elements.settingsUploadFile.textContent = state.modelSourceName || t('hint.chooseFile');
      }
      if (elements.settingsModelStatus) {
        elements.settingsModelStatus.textContent = t('hint.chooseFile');
      }
      return;
    }
    setChip(elements.viewModelStatus, 'loaded', t('status.loaded'));
    elements.modelSource.textContent = state.modelSourceName || t('hint.imported');
    if (elements.settingsUploadFile) {
      elements.settingsUploadFile.textContent = state.modelSourceName || t('hint.chooseFile');
    }
    if (elements.settingsModelStatus) {
      elements.settingsModelStatus.textContent = state.modelSourceName || t('hint.imported');
    }
  }

  function renderSettingsRoutePlanner() {
    renderSettingsDestinationMenu();
    renderSettingsRouteMap();
  }

  function updateControls() {
    const routeReady = Boolean(state.routeSelection.startPoint && state.routeSelection.targetRegionId);
    const reportReady = Boolean(state.prepared && state.scenario?.heatActive && routeReady);
    const controlsLocked = state.heatmapComputing || state.analysisTransitioning;
    elements.modelFileInput.disabled = controlsLocked;
    elements.routePickBtn.disabled = !state.prepared || controlsLocked;
    if (elements.settingsRoutePickBtn) {
      elements.settingsRoutePickBtn.disabled = !state.prepared || controlsLocked;
    }
    if (elements.settingsUploadTrigger) {
      elements.settingsUploadTrigger.disabled = controlsLocked;
    }
    if (elements.settingsDestinationTrigger) {
      elements.settingsDestinationTrigger.disabled = !state.prepared || controlsLocked;
    }
    if (elements.settingsRouteClearBtn) {
      elements.settingsRouteClearBtn.disabled = !state.prepared || controlsLocked;
    }
    if (elements.settingsRouteConfirmBtn) {
      elements.settingsRouteConfirmBtn.disabled = !state.prepared || controlsLocked;
    }
    if (elements.settingsNextBtn) {
      elements.settingsNextBtn.disabled = !routeReady || controlsLocked;
    }
    if (elements.agentSettingsBackBtn) {
      elements.agentSettingsBackBtn.disabled = controlsLocked;
    }
    elements.agentSettingsBtn.disabled = !state.prepared || controlsLocked;
    elements.backgroundCrowdSlider.disabled = controlsLocked;
    if (elements.settingsBackgroundCrowdSlider) {
      elements.settingsBackgroundCrowdSlider.disabled = controlsLocked;
    }
    if (elements.settingsBackgroundCrowdInput) {
      elements.settingsBackgroundCrowdInput.disabled = controlsLocked;
    }
    elements.generateCrowdBtn.disabled = !state.prepared || !routeReady || controlsLocked;
    elements.runHeatmapBtn.disabled = !state.scenario || !state.crowdGenerated || controlsLocked;
    elements.showFinalHeatmapBtn.disabled = !state.scenario?.heatActive || controlsLocked || state.heatmapRevealLocked;
    elements.exportReportBtn.disabled = !reportReady;
    if (elements.settingsStartAnalysisBtn) {
      elements.settingsStartAnalysisBtn.disabled = !state.prepared || !routeReady || controlsLocked;
      elements.settingsStartAnalysisBtn.textContent = state.heatmapComputing
        ? `${t('button.heatmapComputing')} ${formatPercent(state.heatmapComputeProgress * 100)}`
        : (state.analysisTransitioning ? t('loading.preparing') : t('settings.analyzeBtn'));
    }
    if (elements.viewModeSelect) {
      elements.viewModeSelect.disabled = !state.scenario?.heatActive || controlsLocked;
      elements.viewModeSelect.value = getSafeViewMode(state.viewMode);
    }
    elements.routeModalConfirmBtn.disabled = !state.routeModal.startNodeId || !state.routeModal.targetRegionId || controlsLocked;
    elements.agentModalConfirmBtn.disabled = controlsLocked;
    elements.reportModalExportBtn.disabled = !state.reportModal.documentHtml || state.reportModal.exporting;
    elements.generateCrowdBtn.textContent = state.crowdGenerated ? t('button.crowdGenerated') : t('button.generateCrowd');
    elements.runHeatmapBtn.textContent = state.heatmapComputing
      ? `${t('button.heatmapComputing')} ${formatPercent(state.heatmapComputeProgress * 100)}`
      : (state.scenario?.heatActive ? t('button.rerunHeatmap') : t('button.runHeatmap'));
    elements.showFinalHeatmapBtn.textContent = t('button.showFinalHeatmap');
    if (elements.analysisLoadingProgressBtn) {
      elements.analysisLoadingProgressBtn.textContent = (state.heatmapComputing || state.analysisTransitioning)
        ? formatPercent(state.heatmapComputeProgress * 100)
        : t('settings.analyzeBtn');
    }
    if (elements.analysisLoadingStatus) {
      elements.analysisLoadingStatus.textContent = state.heatmapComputing
        ? getHeatmapComputeStatusText()
        : (state.analysisTransitioning ? t('loading.statusReady') : t('loading.statusDone'));
    }
    if (elements.visualizationExportReportBtn) {
      elements.visualizationExportReportBtn.disabled = !reportReady;
      elements.visualizationExportReportBtn.textContent = t('visualization.exportReport');
    }
    if (elements.visualizationDetailExportReportBtn) {
      elements.visualizationDetailExportReportBtn.disabled = !reportReady;
      elements.visualizationDetailExportReportBtn.textContent = t('visualization.exportReport');
    }
    elements.backgroundCrowdSlider.value = String(getBackgroundCrowdCount());
    syncRangeSliderProgress(elements.backgroundCrowdSlider);
    elements.backgroundCrowdValue.textContent = formatNumber(getBackgroundCrowdCount(), 0);
    if (elements.settingsBackgroundCrowdSlider) {
      elements.settingsBackgroundCrowdSlider.value = String(getBackgroundCrowdCount());
      syncRangeSliderProgress(elements.settingsBackgroundCrowdSlider);
    }
    if (elements.settingsBackgroundCrowdValue) {
      elements.settingsBackgroundCrowdValue.textContent = formatNumber(getBackgroundCrowdCount(), 0);
    }
    if (
      elements.settingsBackgroundCrowdInput
      && document.activeElement !== elements.settingsBackgroundCrowdInput
    ) {
      elements.settingsBackgroundCrowdInput.value = String(getBackgroundCrowdCount());
    }
    elements.agentProfileSummary.innerHTML = getCurrentAgentSummary();
    elements.layerCategoryButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.category === state.activeLayerCategory);
    });
  }

  function invalidateScenario() {
    resetHeatmapComputationState();
    resetHeatmapSourceInfo();
    resetHeatmapPlaybackDisplayState();
    if (state.crowdGenerated || state.scenario) {
      state.crowdGenerated = false;
      state.scenario = null;
      state.reportModal = createDefaultReportModalState();
      state.animationPaused = false;
      state.selectedDynamic = null;
      state.selectedHotspotId = null;
      state.vitalitySeatLayerRestoreCategory = null;
      state.vitalitySeatLayerForced = false;
      requestRender();
    }
  }

  function renderBaseLayer(
    target = elements.baseLayer,
    overlayTarget = elements.overlayLayer,
    transform = computeTransform(),
    options = {}
  ) {
    if (!target) {
      return;
    }
    if (!state.prepared) {
      target.innerHTML = '';
      if (overlayTarget) {
        overlayTarget.innerHTML = '';
      }
      return;
    }
    const activeTransform = transform || computeTransform();
    if (options.syncState !== false && target === elements.baseLayer) {
      state.transform = activeTransform;
    }
    const viewBox = `${activeTransform.viewBox.x} ${activeTransform.viewBox.y} ${activeTransform.viewBox.width} ${activeTransform.viewBox.height}`;
    target.setAttribute('viewBox', viewBox);
    if (overlayTarget) {
      overlayTarget.setAttribute('viewBox', viewBox);
    }
    const walkable = state.prepared.walkableAreas
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, activeTransform)}"></polygon>`)
      .join('');
    const obstacles = state.prepared.obstacles
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, activeTransform)}"></polygon>`)
      .join('');
    target.innerHTML = `${walkable}${obstacles}`;
  }

  function getDynamicInspection() {
    if (!state.prepared || !state.scenario || !state.selectedDynamic) {
      return null;
    }
    if (state.selectedDynamic.kind === 'focus-agent') {
      const playbackInspection = getPlaybackFocusInspection();
      if (playbackInspection) {
        return augmentInspectionWithComposite(playbackInspection);
      }
      return augmentInspectionWithComposite(
        Sim.inspectAgent(state.prepared, state.scenario, state.scenario.focusAgentId)
      );
    }
    if (state.selectedDynamic.kind === 'point') {
      return augmentInspectionWithComposite(
        Sim.inspectHeatPoint(state.prepared, state.scenario, state.selectedDynamic.point)
      );
    }
    return null;
  }

  function getDisplayedHotspots() {
    if (!state.scenario?.heatActive) {
      return [];
    }
    if (!state.selectedDynamic) {
      return [];
    }
    const inspection = getDynamicInspection();
    const inspectionIssues = getInspectionIssueItems(inspection)
      .filter((item) => resolveHotspotTargets(item).length);
    return inspectionIssues.slice(0, 3);
  }

  function getHotspotById(id = state.selectedHotspotId) {
    const hotspots = getDisplayedHotspots();
    if (!id) {
      return null;
    }
    const match = hotspots.find((item) => item.id === id || item.mapTargetId === id || item.mapTargetIds?.includes(id));
    if (match) {
      return match;
    }
    if (state.visualizationDetailView) {
      const detailHotspots = getVisualizationDetailDisplayedHotspots();
      const detailMatch = detailHotspots.find((item) => item.id === id || item.mapTargetId === id || item.mapTargetIds?.includes(id));
      if (detailMatch) {
        return detailMatch;
      }
      const selectedIssue = state.visualizationDetailSelectedIssue;
      if (selectedIssue && (selectedIssue.id === id || selectedIssue.mapTargetId === id || selectedIssue.mapTargetIds?.includes(id))) {
        return selectedIssue;
      }
      return null;
    }
    return null;
  }

  function buildSelectedHotspotOverlayEntries(hotspot) {
    if (!hotspot) {
      return [];
    }
    const displayedHotspots = state.visualizationDetailView
      ? getVisualizationDetailDisplayedHotspots()
      : getDisplayedHotspots();
    const rankIndex = displayedHotspots.findIndex((item) => item.id === hotspot.id);
    const resolvedTargets = resolveHotspotTargets(hotspot);
    const pressureTargets = resolvedTargets.filter((target) => target.type === 'pressure');
    const hotspotTargets = pressureTargets.length
      ? pressureTargets
      : resolvedTargets.filter((target) => target.type === 'seat');
    return hotspotTargets.map((hotspotTarget) => ({
      hotspot,
      hotspotTarget,
      item: hotspotTarget.item,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
    }));
  }

  function getSelectedHotspotOverlayItems() {
    if (!state.prepared || !state.selectedHotspotId) {
      return [];
    }
    const snapshot = state.selectedHotspotOverlaySnapshot;
    const displayedHotspots = state.visualizationDetailView
      ? getVisualizationDetailDisplayedHotspots()
      : getDisplayedHotspots();
    const hotspot = displayedHotspots.find((item) => (
      item.id === state.selectedHotspotId || item.mapTargetId === state.selectedHotspotId || item.mapTargetIds?.includes(state.selectedHotspotId)
    ))
      || (state.visualizationDetailView ? state.visualizationDetailSelectedIssue : null)
      || getHotspotById(state.selectedHotspotId);
    if (!hotspot) {
      if (snapshot?.selectionId === state.selectedHotspotId && Array.isArray(snapshot.items) && snapshot.items.length) {
        return snapshot.items;
      }
      return [];
    }
    const overlayItems = buildSelectedHotspotOverlayEntries(hotspot);
    if (overlayItems.length) {
      return overlayItems;
    }
    if (snapshot?.selectionId === state.selectedHotspotId && Array.isArray(snapshot.items) && snapshot.items.length) {
      return snapshot.items;
    }
    return [];
  }

  function getSelectedHotspotOverlayItem() {
    return getSelectedHotspotOverlayItems()[0] || null;
  }

  function getLayerItemsForCategory(categoryId = state.activeLayerCategory) {
    if (!state.prepared || !categoryId) {
      return [];
    }
    if (categoryId === 'seat') {
      return state.prepared.seats.map((seat) => ({ type: 'seat', item: seat }));
    }
    return state.prepared.pressureObjects
      .filter((item) => getLayerCategoryForObject('pressure', item) === categoryId)
      .map((item) => ({ type: 'pressure', item }));
  }

  function getLayerItemsForCategories(categoryIds = []) {
    if (!state.prepared || !Array.isArray(categoryIds) || !categoryIds.length) {
      return [];
    }
    return categoryIds.flatMap((categoryId) => getLayerItemsForCategory(categoryId));
  }

  function getPointPopoverSelection() {
    if (!state.pointPopover.visible || !state.prepared) {
      return null;
    }
    if (state.pointPopover.type === 'seat') {
      return state.prepared.seats.find((seat) => seat.id === state.pointPopover.id) || null;
    }
    return state.prepared.pressureObjects.find((item) => item.id === state.pointPopover.id) || null;
  }

  function closePointPopover() {
    state.pointPopover = { visible: false, type: null, id: null, draft: null, anchor: null, overlayTarget: null, readOnly: true };
  }

  function createPointPopoverDraft(type, item) {
    const categoryId = getLayerCategoryForObject(type, item);
    if (categoryId === 'flashing-ads' || categoryId === 'static-ads') {
      return {
        kind: 'ad',
        adMode: categoryId,
        lux: Number(item.lux || 0),
        decibel: Number(item.decibel || 0),
      };
    }
    if (categoryId === 'noise') {
      return {
        kind: 'noise',
        decibel: Number(item.decibel || 74),
      };
    }
    return null;
  }

  function openPointPopover(type, item, options = {}) {
    const categoryId = getLayerCategoryForObject(type, item);
    const definition = getCategoryDefinition(categoryId);
    state.selectedObject = { type, id: item.id };
    state.pointPopover = {
      visible: true,
      type,
      id: item.id,
      draft: createPointPopoverDraft(type, item),
      anchor: { x: item.x, y: item.y },
      overlayTarget: options.overlayTarget || null,
      readOnly: !(definition && definition.editable),
    };
  }

  function normalizeHeatmapRenderOptions(
    targetCanvas = elements.heatmapLayer,
    transform = state.transform || computeTransform(),
    options = {}
  ) {
    if (
      targetCanvas
      && typeof targetCanvas === 'object'
      && !('getContext' in targetCanvas)
      && (targetCanvas.targetCanvas || targetCanvas.transform || targetCanvas.useSharedCache !== undefined)
    ) {
      return {
        targetCanvas: targetCanvas.targetCanvas || elements.heatmapLayer,
        transform: targetCanvas.transform || state.transform || computeTransform(),
        useSharedCache: targetCanvas.useSharedCache,
      };
    }
    return {
      targetCanvas: targetCanvas || elements.heatmapLayer,
      transform: transform || state.transform || computeTransform(),
      useSharedCache: options.useSharedCache,
    };
  }

  function renderHeatmap(
    targetCanvas = elements.heatmapLayer,
    transform = state.transform || computeTransform(),
    options = {}
  ) {
    const normalized = normalizeHeatmapRenderOptions(targetCanvas, transform, options);
    const canvas = normalized.targetCanvas;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const activeTransform = normalized.transform || state.transform || computeTransform();
    const heatmapStyle = getHeatmapViewStyle();
    const useSharedCache = normalized.useSharedCache !== false && canvas === elements.heatmapLayer;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(activeTransform.width));
    const height = Math.max(1, Math.round(activeTransform.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    if (!state.scenario?.heatActive || !state.prepared) {
      if (useSharedCache) {
        state.heatmapRenderCache = null;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const precomputedPlayback = getActivePlayback();
    const fullTraceSnapshots = getPlaybackTraceSnapshots(precomputedPlayback);
    const revealTraceSnapshots = getHeatmapRevealTraceSnapshots(precomputedPlayback);
    const heatState = precomputedPlayback?.heat || state.scenario?.heat || null;
    const activeViewMode = getSafeViewMode(state.viewMode);
    const heatFullyRevealed = isHeatmapFullyRevealed(precomputedPlayback);
    const transformSignature = [
      width,
      height,
      dpr,
      Number(activeTransform.scale || 0).toFixed(5),
      Number(activeTransform.offsetX || 0).toFixed(2),
      Number(activeTransform.offsetY || 0).toFixed(2),
      Number(activeTransform.viewBox?.x || 0).toFixed(2),
      Number(activeTransform.viewBox?.y || 0).toFixed(2),
      Number(activeTransform.viewBox?.width || 0).toFixed(2),
      Number(activeTransform.viewBox?.height || 0).toFixed(2),
    ].join(':');
    if (
      useSharedCache
      && heatFullyRevealed
      && state.heatmapRenderCache
      && state.heatmapRenderCache.heatState === heatState
      && state.heatmapRenderCache.viewMode === activeViewMode
      && state.heatmapRenderCache.transformSignature === transformSignature
      && state.heatmapRenderCache.traceSnapshots === fullTraceSnapshots
      && state.heatmapRenderCache.style === heatmapStyle
    ) {
      return;
    }
    if (useSharedCache) {
      state.heatmapRenderCache = null;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.globalCompositeOperation = 'source-over';
    const traceRevealRadiusMeters = getTraceRevealRadiusMeters(activeViewMode);
    const finalHeatCells = getFinalHeatCells(heatState, fullTraceSnapshots, activeViewMode, traceRevealRadiusMeters);
    const shouldDrawRasterField = activeViewMode !== 'vitality';
    const renderedHeatCells = shouldDrawRasterField && !heatFullyRevealed
      ? getRevealedHeatCells(heatState, revealTraceSnapshots, activeViewMode, traceRevealRadiusMeters)
      : finalHeatCells;
      const localMetricValues = finalHeatCells
        .map((cell) => Number(cell.metric || 0))
        .filter((value) => Number.isFinite(value));
      const localMetricMin = localMetricValues.length ? Math.min(...localMetricValues) : 0;
      const localMetricMax = localMetricValues.length ? Math.max(...localMetricValues) : 0;
      const heatDisplayProfile = shouldDrawRasterField
        ? buildHeatDisplayProfile(localMetricValues, heatmapStyle)
        : null;
      const rasterCacheKey = `final-route:${activeViewMode}`;
      const revealTime = getCurrentHeatmapRevealTime(precomputedPlayback);
      const revealBucket = getPlaybackRevealTimeBucket(revealTime);
      const activeTraceSnapshots = heatFullyRevealed ? fullTraceSnapshots : revealTraceSnapshots;
      const heatRaster = shouldDrawRasterField
      ? getCachedHeatRaster(
        heatFullyRevealed ? rasterCacheKey : `${activeViewMode}:${revealBucket}`,
        heatState,
        renderedHeatCells,
        localMetricMin,
          localMetricMax,
          heatmapStyle,
          transformSignature,
          activeTransform,
          heatDisplayProfile,
          activeViewMode
        )
        : null;
    const vitalityRaster = !shouldDrawRasterField
      ? getCachedVitalityRibbonRaster(
        `vitality:${heatFullyRevealed ? 'final' : revealBucket}`,
        activeTraceSnapshots,
        transformSignature,
        activeTransform,
        localMetricMin,
        localMetricMax
      )
      : null;
      const heatSurface = shouldDrawRasterField ? heatRaster : vitalityRaster;
      const corridorMask = shouldDrawRasterField
        ? getCachedHeatRevealMask(
          `corridor:${activeViewMode}:${heatFullyRevealed ? 'final' : revealBucket}`,
          transformSignature,
          activeTraceSnapshots,
          activeTransform,
          traceRevealRadiusMeters
        )
        : null;

      if (finalHeatCells.length && heatSurface) {
        ctx.save();
        clipHeatmapToWalkableArea(ctx, activeTransform);
        paintHeatSurface(ctx, heatSurface, width, height, corridorMask);
        clearHeatmapObstacles(ctx, activeTransform);
        ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (useSharedCache && heatFullyRevealed) {
        state.heatmapRenderCache = {
          heatState,
          traceSnapshots: fullTraceSnapshots,
          viewMode: activeViewMode,
          transformSignature,
          style: heatmapStyle,
        };
      }
      return;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function normalizeBackgroundCrowdRenderOptions(
    targetCanvas = elements.backgroundCrowdCanvas,
    transform = state.transform || computeTransform(),
    extraOptions = {}
  ) {
    if (
      targetCanvas
      && typeof targetCanvas === 'object'
      && !('getContext' in targetCanvas)
      && (targetCanvas.targetCanvas || targetCanvas.transform || targetCanvas.clearOnly !== undefined)
    ) {
      return {
        targetCanvas: targetCanvas.targetCanvas || elements.backgroundCrowdCanvas,
        transform: targetCanvas.transform || state.transform || computeTransform(),
        clearOnly: targetCanvas.clearOnly === true,
      };
    }
    return {
      targetCanvas: targetCanvas || elements.backgroundCrowdCanvas,
      transform: transform || state.transform || computeTransform(),
      clearOnly: extraOptions.clearOnly === true,
    };
  }

  function createBackgroundWebglRuntime(canvas, gl) {
    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader) || 'Unknown shader compile error';
        gl.deleteShader(shader);
        throw new Error(error);
      }
      return shader;
    };
    const vertexShader = compileShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute float a_size;
      attribute vec4 a_color;
      attribute float a_ringInner;
      uniform vec2 u_resolution;
      varying vec4 v_color;
      varying float v_ringInner;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 clipSpace = zeroToOne * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
        v_ringInner = a_ringInner;
      }
    `);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec4 v_color;
      varying float v_ringInner;
      void main() {
        vec2 centered = gl_PointCoord * 2.0 - 1.0;
        float dist = length(centered);
        if (dist > 1.0) {
          discard;
        }
        if (v_ringInner > 0.0 && dist < v_ringInner) {
          discard;
        }
        float outerAlpha = 1.0 - smoothstep(0.88, 1.0, dist);
        gl_FragColor = vec4(v_color.rgb, v_color.a * outerAlpha);
      }
    `);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Unknown WebGL link error');
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return {
      canvas,
      gl,
      program,
      positionBuffer: gl.createBuffer(),
      sizeBuffer: gl.createBuffer(),
      colorBuffer: gl.createBuffer(),
      ringInnerBuffer: gl.createBuffer(),
      positions: new Float32Array(0),
      sizes: new Float32Array(0),
      colors: new Float32Array(0),
      ringInners: new Float32Array(0),
      capacity: 0,
      attributes: {
        position: gl.getAttribLocation(program, 'a_position'),
        size: gl.getAttribLocation(program, 'a_size'),
        color: gl.getAttribLocation(program, 'a_color'),
        ringInner: gl.getAttribLocation(program, 'a_ringInner'),
      },
      uniforms: {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
      },
    };
  }

  function ensureBackgroundCrowdWebglCapacity(runtime, projectedCount) {
    const nextCapacity = Math.max(0, Math.ceil(Number(projectedCount) || 0));
    if (!runtime || nextCapacity <= runtime.capacity) {
      return;
    }
    const gl = runtime.gl;
    runtime.capacity = Math.max(nextCapacity, runtime.capacity ? runtime.capacity * 2 : 256);
    runtime.positions = new Float32Array(runtime.capacity * 2);
    runtime.sizes = new Float32Array(runtime.capacity);
    runtime.colors = new Float32Array(runtime.capacity * 4);
    runtime.ringInners = new Float32Array(runtime.capacity);
    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, runtime.positions.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, runtime.sizes.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, runtime.colors.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.ringInnerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, runtime.ringInners.byteLength, gl.DYNAMIC_DRAW);
  }

  function shouldRenderDynamicCrowdWithWebgl(options = {}) {
    const targetCanvas = options.targetCanvas || elements.backgroundCrowdCanvas;
    return Boolean(
      state.backgroundRendererMode === 'webgl'
      && state.scenario
      && targetCanvas === elements.backgroundCrowdCanvas
      && elements.dynamicCrowdWebglCanvas
    );
  }

  function ensureBackgroundCrowdWebgl() {
    if (state.dynamicCrowdWebglRuntime) {
      return state.dynamicCrowdWebglRuntime;
    }
    const canvas = elements.dynamicCrowdWebglCanvas;
    if (!canvas) {
      return null;
    }
    try {
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      }) || canvas.getContext('experimental-webgl');
      if (!gl) {
        state.backgroundRendererMode = 'canvas';
        return null;
      }
      const runtime = createBackgroundWebglRuntime(canvas, gl);
      state.dynamicCrowdWebglRuntime = runtime;
      return runtime;
    } catch (error) {
      console.warn('Dynamic crowd WebGL initialization failed:', error);
      state.backgroundRendererMode = 'canvas';
      state.dynamicCrowdWebglRuntime = null;
      return null;
    }
  }

  function fillBackgroundCrowdWebglFromTrajectoryCache(runtime, trajectoryCache, sampleTime, transform, renderStyle, dpr) {
    if (!runtime || !trajectoryCache) {
      return 0;
    }
    const playbackState = state.backgroundPlaybackRenderState;
    const candidateIds = new Set();
    if (playbackState?.prevFrame?.agents?.length) {
      playbackState.prevFrame.agents.forEach((agent, index) => candidateIds.add(agent?.id || `prev-${index}`));
    }
    if (playbackState?.nextFrame?.agents?.length) {
      playbackState.nextFrame.agents.forEach((agent, index) => candidateIds.add(agent?.id || `next-${index}`));
    }
    if (!candidateIds.size) {
      trajectoryCache.orderedIds.forEach((id) => candidateIds.add(id));
    }
    const pointSize = Math.max(1, renderStyle.radius * 2 * dpr);
    let writeIndex = 0;
    candidateIds.forEach((id) => {
      const trajectory = trajectoryCache.trajectories.get(id);
      const sample = samplePackedBackgroundTrajectoryPoint(trajectory, sampleTime);
      if (!sample?.active || !sample?.position) {
        return;
      }
      const point = worldToScreen(sample.position, transform);
      runtime.positions[writeIndex * 2] = point.x * dpr;
      runtime.positions[writeIndex * 2 + 1] = point.y * dpr;
      runtime.sizes[writeIndex] = pointSize;
      runtime.colors[writeIndex * 4] = BACKGROUND_CROWD_DOT_RGB[0] / 255;
      runtime.colors[writeIndex * 4 + 1] = BACKGROUND_CROWD_DOT_RGB[1] / 255;
      runtime.colors[writeIndex * 4 + 2] = BACKGROUND_CROWD_DOT_RGB[2] / 255;
      runtime.colors[writeIndex * 4 + 3] = 1;
      runtime.ringInners[writeIndex] = 0;
      writeIndex += 1;
    });
    return writeIndex;
  }

  function getDynamicCrowdRenderSourceCanvas() {
    return shouldRenderDynamicCrowdWithWebgl()
      ? elements.dynamicCrowdWebglCanvas
      : elements.backgroundCrowdCanvas;
  }

  function renderBackgroundCrowdCanvasLegacy(options = {}) {
    const canvas = options.targetCanvas || elements.backgroundCrowdCanvas;
    if (!canvas) {
      return;
    }
    if (canvas === elements.backgroundCrowdCanvas && state.dynamicCrowdWebglRuntime?.gl) {
      const dynamicGl = state.dynamicCrowdWebglRuntime.gl;
      dynamicGl.viewport(0, 0, state.dynamicCrowdWebglRuntime.canvas.width, state.dynamicCrowdWebglRuntime.canvas.height);
      dynamicGl.clearColor(0, 0, 0, 0);
      dynamicGl.clear(dynamicGl.COLOR_BUFFER_BIT);
    }
    const ctx = canvas.getContext('2d');
    const activeTransform = options.transform || state.transform || computeTransform();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(activeTransform.width));
    const height = Math.max(1, Math.round(activeTransform.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isPrimaryDynamicCanvas = canvas === elements.backgroundCrowdCanvas;
    if (options.clearOnly || !state.scenario || (isPrimaryDynamicCanvas && state.backgroundRendererMode !== 'canvas')) {
      return;
    }
    ctx.scale(dpr, dpr);
    const interpolatedPlaybackAgents = getInterpolatedBackgroundPlaybackAgents();
    const renderableAgents = interpolatedPlaybackAgents.length
      ? interpolatedPlaybackAgents
      : getRenderableBackgroundAgents(state.scenario.backgroundAgents);
    if (!renderableAgents.length) {
      return;
    }
    const renderStyle = getBackgroundCrowdRenderStyle(renderableAgents.length, activeTransform);
    const radius = renderStyle.radius;
    ctx.fillStyle = renderStyle.fill;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    renderableAgents.forEach((agent) => {
      const point = worldToScreen(agent.position, activeTransform);
      ctx.moveTo(point.x + radius, point.y);
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    });
    ctx.fill();
    const focusSource = getPlaybackSnapshotAtTime() || getPlaybackFocusInspection() || state.scenario?.focusAgent?.position || null;
    if (focusSource) {
      const point = worldToScreen(focusSource, activeTransform);
      ctx.fillStyle = 'rgba(13, 15, 20, 1)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(13, 15, 20, 1)';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function renderBackgroundCrowdWebgl(options = {}) {
    const runtime = ensureBackgroundCrowdWebgl();
    if (!runtime || !state.scenario) {
      return false;
    }
    const canvas = runtime.canvas;
    const gl = runtime.gl;
    const transform = options.transform || state.transform || computeTransform();
    const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(transform.width));
    const height = Math.max(1, Math.round(transform.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const trajectoryCache = ensureBackgroundPlaybackTrajectoryCache(getActivePlayback()?.backgroundField);
    const sampleTime = Number(state.backgroundPlaybackRenderState?.sampleTime ?? state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0);
    const representativeCount = Math.max(
      0,
      Number(state.scenario?.backgroundAgents?.length || 0)
    );
    const renderStyle = getBackgroundCrowdRenderStyle(representativeCount, transform);
    const playbackState = state.backgroundPlaybackRenderState;
    const projectedCount = Math.max(
      2,
      representativeCount + 2,
      (Array.isArray(playbackState?.prevFrame?.agents) ? playbackState.prevFrame.agents.length : 0)
        + (Array.isArray(playbackState?.nextFrame?.agents) ? playbackState.nextFrame.agents.length : 0)
        + 2,
      trajectoryCache?.orderedIds?.length ? trajectoryCache.orderedIds.length + 2 : 0
    );
    ensureBackgroundCrowdWebglCapacity(runtime, projectedCount);
    let visibleCount = trajectoryCache
      ? fillBackgroundCrowdWebglFromTrajectoryCache(runtime, trajectoryCache, sampleTime, transform, renderStyle, dpr)
      : 0;
    if (!trajectoryCache) {
      const fallbackAgents = getInterpolatedBackgroundPlaybackAgents();
      fallbackAgents.forEach((agent) => {
        if (!agent?.active || !agent?.position) {
          return;
        }
        const point = worldToScreen(agent.position, transform);
        runtime.positions[visibleCount * 2] = point.x * dpr;
        runtime.positions[visibleCount * 2 + 1] = point.y * dpr;
        runtime.sizes[visibleCount] = Math.max(1, renderStyle.radius * 2 * dpr);
        runtime.colors[visibleCount * 4] = BACKGROUND_CROWD_DOT_RGB[0] / 255;
        runtime.colors[visibleCount * 4 + 1] = BACKGROUND_CROWD_DOT_RGB[1] / 255;
        runtime.colors[visibleCount * 4 + 2] = BACKGROUND_CROWD_DOT_RGB[2] / 255;
        runtime.colors[visibleCount * 4 + 3] = 1;
        runtime.ringInners[visibleCount] = 0;
        visibleCount += 1;
      });
    }
    const focusSource = getPlaybackSnapshotAtTime() || getPlaybackFocusInspection() || state.scenario?.focusAgent?.position || null;
    if (focusSource) {
      const point = worldToScreen(focusSource, transform);
      runtime.positions[visibleCount * 2] = point.x * dpr;
      runtime.positions[visibleCount * 2 + 1] = point.y * dpr;
      runtime.sizes[visibleCount] = Math.max(1, 16.4 * dpr);
      runtime.colors[visibleCount * 4] = 0.05;
      runtime.colors[visibleCount * 4 + 1] = 0.06;
      runtime.colors[visibleCount * 4 + 2] = 0.08;
      runtime.colors[visibleCount * 4 + 3] = 1;
      runtime.ringInners[visibleCount] = 0.72;
      visibleCount += 1;

      runtime.positions[visibleCount * 2] = point.x * dpr;
      runtime.positions[visibleCount * 2 + 1] = point.y * dpr;
      runtime.sizes[visibleCount] = Math.max(1, 9.6 * dpr);
      runtime.colors[visibleCount * 4] = 0.05;
      runtime.colors[visibleCount * 4 + 1] = 0.06;
      runtime.colors[visibleCount * 4 + 2] = 0.08;
      runtime.colors[visibleCount * 4 + 3] = 1;
      runtime.ringInners[visibleCount] = 0;
      visibleCount += 1;
    }

    gl.useProgram(runtime.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform2f(runtime.uniforms.resolution, canvas.width, canvas.height);

    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.positionBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, runtime.positions.subarray(0, visibleCount * 2));
    gl.enableVertexAttribArray(runtime.attributes.position);
    gl.vertexAttribPointer(runtime.attributes.position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.sizeBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, runtime.sizes.subarray(0, visibleCount));
    gl.enableVertexAttribArray(runtime.attributes.size);
    gl.vertexAttribPointer(runtime.attributes.size, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.colorBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, runtime.colors.subarray(0, visibleCount * 4));
    gl.enableVertexAttribArray(runtime.attributes.color);
    gl.vertexAttribPointer(runtime.attributes.color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, runtime.ringInnerBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, runtime.ringInners.subarray(0, visibleCount));
    gl.enableVertexAttribArray(runtime.attributes.ringInner);
    gl.vertexAttribPointer(runtime.attributes.ringInner, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, visibleCount);
    return true;
  }

  function renderBackgroundCrowdCanvas(
    targetCanvas = elements.backgroundCrowdCanvas,
    transform = null,
    extraOptions = {}
  ) {
    const options = normalizeBackgroundCrowdRenderOptions(targetCanvas, transform, extraOptions);
    if (shouldRenderDynamicCrowdWithWebgl(options)) {
      if (renderBackgroundCrowdWebgl(options)) {
        renderBackgroundCrowdCanvasLegacy({ ...options, clearOnly: true });
      } else {
        renderBackgroundCrowdCanvasLegacy(options);
      }
      return;
    }
    renderBackgroundCrowdCanvasLegacy(options);
  }

  function renderBackgroundCrowdSvgFallback() {
    return state.backgroundRendererMode === 'svg';
  }

  function normalizeOverlayRenderOptions(target = elements.overlayLayer, options = {}) {
    if (
      target
      && typeof target === 'object'
      && !('setAttribute' in target)
      && (
        target.target
        || target.transform
        || target.isVisualizationDetail !== undefined
        || target.showAllNodes !== undefined
        || target.activeLayerCategories !== undefined
      )
    ) {
      return {
        target: target.target || elements.overlayLayer,
        transform: target.transform,
        isVisualizationDetail: target.isVisualizationDetail,
        showAllNodes: target.showAllNodes,
        activeLayerCategories: target.activeLayerCategories,
      };
    }
    return {
      target: target || elements.overlayLayer,
      ...options,
    };
  }

  function renderOverlayLayer(target = elements.overlayLayer, options = {}) {
    const normalized = normalizeOverlayRenderOptions(target, options);
    const overlayTarget = normalized.target;
    if (!overlayTarget) {
      return;
    }
    if (!state.prepared) {
      overlayTarget.innerHTML = '';
      return;
    }
    const transform = normalized.transform
      || (overlayTarget === elements.overlayLayer ? (state.transform || computeTransform()) : computeTransformForViewportSize(overlayTarget.clientWidth, overlayTarget.clientHeight));
    const isVisualizationDetail = Boolean(normalized.isVisualizationDetail);
    const detailFocusInspectionActive = isVisualizationDetail || state.selectedDynamic?.kind === 'focus-agent';
    const showAllNodes = Boolean(normalized.showAllNodes);
    overlayTarget.setAttribute('viewBox', `${transform.viewBox.x} ${transform.viewBox.y} ${transform.viewBox.width} ${transform.viewBox.height}`);

    const selectedObject = state.selectedObject;
    const dynamicInspection = getDynamicInspection();
    const playbackFocusSnapshot = getActivePlayback() ? getPlaybackSnapshotAtTime() : null;
    const playbackFocusInspection = detailFocusInspectionActive ? getPlaybackFocusInspection() : null;
    const activeLayerCategories = Array.isArray(normalized.activeLayerCategories)
      ? normalized.activeLayerCategories.filter(Boolean)
      : null;
    const activeTargetRegion =
      getTargetRegionById() ||
      state.scenario?.focusTargetRegion ||
      (state.scenario?.focusRoute?.targetRegionId ? state.prepared.targetRegionById[state.scenario.focusRoute.targetRegionId] : null);
    const inspection = getCurrentFocusInspection();
    const effectiveInspection = detailFocusInspectionActive ? (inspection || dynamicInspection) : dynamicInspection;
    const rawStartPoint = state.routeSelection.startPoint || state.scenario?.focusStartPoint || state.scenario?.focusRoute?.startAnchor || null;
    const rawEndPoint = state.scenario?.focusRoute?.endAnchor || activeTargetRegion?.anchor || null;
    const startNode = state.routeSelection.startNodeId
      ? state.prepared.nodeById?.[state.routeSelection.startNodeId] || null
      : findNearestPreparedNode(rawStartPoint);
    const endNode = effectiveInspection?.selectedTargetNodeId
      ? state.prepared.nodeById?.[effectiveInspection.selectedTargetNodeId] || null
      : findNearestPreparedNode(rawEndPoint);
    const startPoint = startNode || rawStartPoint;
    const endPoint = endNode || rawEndPoint;
    const activeLayerItems = activeLayerCategories
      ? getLayerItemsForCategories(activeLayerCategories)
      : getLayerItemsForCategory();
    const selectedHotspotOverlay = getSelectedHotspotOverlayItem();
    const selectedHotspotOverlays = selectedHotspotOverlay ? getSelectedHotspotOverlayItems() : [];
    const traceSnapshots = state.viewMode === 'vitality'
      ? getVisibleTraceSnapshots(getActivePlayback())
      : [];
    const renderDynamicAgentsInWebgl = shouldRenderDynamicCrowdWithWebgl();
    const highlightedSeatIds = new Set();
    if (detailFocusInspectionActive && effectiveInspection?.needsRest) {
      (effectiveInspection.nearbySeats || []).forEach((seat) => highlightedSeatIds.add(seat.id));
    }

    const badgeRadius = worldRadiusForPixels(7.6, transform);
    const pressureRadius = worldRadiusForPixels(4.8, transform);
    const seatRadius = worldRadiusForPixels(4, transform);
    const bgRadius = 0.25;
    const focusRadius = worldRadiusForPixels(4.8, transform);
    const focusRingRadius = worldRadiusForPixels(8.2, transform);
    const hitRadius = worldRadiusForPixels(18, transform);
    const markerLabelGap = worldRadiusForPixels(14, transform);
    const markerLabelFill = 'rgba(255, 255, 255, 0.98)';

    const parts = [];
    const detailHotspotHighlightParts = [];
    const placedBadges = [];
    const renderedPressureIds = new Set();
    const renderedHotspotTargetKeys = new Set();
    const backgroundAgentParts = [];
    const focusAgentParts = [];
    const renderableBackgroundAgentIds = renderBackgroundCrowdSvgFallback()
      ? new Set(getRenderableBackgroundAgents(state.scenario?.backgroundAgents || []).map((agent) => agent.id))
      : null;

    [
      { point: startPoint, markerType: 'start', nodeId: startNode?.id || null },
      { point: endPoint, markerType: 'end', nodeId: endNode?.id || null },
    ]
      .filter((item) => item.point)
      .forEach(({ point, markerType, nodeId }) => {
        const displayPoint = worldToDisplayPoint(point, transform);
        const badgeLabel = t(`marker.${markerType}Short`);
        const labelX = displayPoint.x;
        const labelY = displayPoint.y - badgeRadius - markerLabelGap;
        parts.push(
          `<g class="map-marker-badge ${markerType}"><circle cx="${displayPoint.x}" cy="${displayPoint.y}" r="${badgeRadius}" data-type="${nodeId ? 'node' : ''}" data-id="${escapeHtml(nodeId || '')}"></circle><text x="${labelX}" y="${labelY}" fill="${markerLabelFill}" text-anchor="middle">${escapeHtml(badgeLabel)}</text></g>`
        );
      });

    if (state.viewMode === 'vitality' && traceSnapshots.length) {
      traceSnapshots
        .filter((snapshot) => snapshot.shortRestMarker)
        .forEach((snapshot) => {
          const marker = snapshot.shortRestMarker;
          const displayPoint = worldToDisplayPoint(marker, transform);
          parts.push(
            `<circle class="short-rest-marker" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${Math.max(0.35, Number(marker.radiusMeters) || 0.35)}"></circle>`
          );
        });
    }

    activeLayerItems.forEach(({ type, item }) => {
      const displayPoint = worldToDisplayPoint(item, transform);
      const categoryId = getLayerCategoryForObject(type, item);
      const isSelected = selectedObject?.type === type && selectedObject.id === item.id;
      const className = type === 'seat' ? `seat-dot${isSelected || highlightedSeatIds.has(item.id) ? ' highlighted' : ''}` : `pressure-dot${isSelected ? ' highlighted' : ''}`;
      const strokeColor = type === 'seat' ? getCategoryStrokeColor('seat') : getCategoryStrokeColor(categoryId);
      if (type === 'pressure') {
        renderedPressureIds.add(item.id);
      }
      parts.push(
        `<circle class="${className}" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${type === 'seat' ? seatRadius : pressureRadius}" fill="${escapeHtml(type === 'seat' ? getCategoryColor('seat') : getCategoryColor(categoryId))}" stroke="${escapeHtml(strokeColor)}" stroke-width="0.2" data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}"></circle>`
      );
      if (!isVisualizationDetail && isSelected && !(type === 'pressure' && state.selectedHotspotId === item.id)) {
        parts.push(`<circle class="hotspot-highlight-ring" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${worldRadiusForPixels(9, transform)}"></circle>`);
      }
    });

    if (showAllNodes) {
      const nodeRadius = worldRadiusForPixels(4.8, transform);
      const nodeHitRadius = worldRadiusForPixels(11.5, transform);
      state.prepared.nodes.forEach((node) => {
        const displayNode = worldToDisplayPoint(node, transform);
        parts.push(`<circle class="visualization-node-dot" cx="${displayNode.x}" cy="${displayNode.y}" r="${nodeRadius}"></circle>`);
        parts.push(`<circle class="agent-hit-area visualization-node-hit" cx="${displayNode.x}" cy="${displayNode.y}" r="${nodeHitRadius}" data-type="node" data-id="${escapeHtml(node.id)}"></circle>`);
      });
    }

    selectedHotspotOverlays.forEach(({ item: hotspotItem, hotspotTarget, rank }) => {
      const hotspotTargetKey = hotspotTarget ? `${hotspotTarget.type}:${hotspotTarget.item.id}` : null;
      if (!hotspotTargetKey || renderedHotspotTargetKeys.has(hotspotTargetKey)) {
        return;
      }
      const showInlineHotspotRank = !isVisualizationDetail && state.viewMode === 'psychological' && rank;
      const showHotspotRankBadge = !isVisualizationDetail && state.viewMode !== 'cognitive' && state.viewMode !== 'psychological' && rank;
      const hotspotPoint = worldToDisplayPoint(hotspotItem, transform);
      const hotspotCategory = hotspotTarget?.type === 'pressure' ? getLayerCategoryForObject('pressure', hotspotItem) : null;
      if (hotspotTarget?.type === 'pressure' && !renderedPressureIds.has(hotspotItem.id) && !isVisualizationDetail) {
        parts.push(
          `<circle class="pressure-dot highlighted hotspot-highlight-dot" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${pressureRadius}" fill="${escapeHtml(getCategoryColor(hotspotCategory))}" stroke="${escapeHtml(getCategoryStrokeColor(hotspotCategory))}" stroke-width="0.2" data-type="pressure" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      } else if (hotspotTarget?.type === 'seat' && !(activeLayerCategories || []).includes('seat') && state.activeLayerCategory !== 'seat' && !isVisualizationDetail) {
        parts.push(
          `<circle class="seat-dot highlighted" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${seatRadius}" fill="${escapeHtml(getCategoryColor('seat'))}" stroke="${escapeHtml(getCategoryStrokeColor('seat'))}" stroke-width="0.2" data-type="seat" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      } else if (hotspotTarget?.type === 'node') {
        parts.push(
          `<circle class="${isVisualizationDetail ? 'visualization-node-dot' : `node-dot ${getNodeDisplayClass(hotspotItem)}`} highlighted" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${worldRadiusForPixels(6.1, transform)}" data-type="node" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      }
      if (isVisualizationDetail && (hotspotTarget?.type === 'pressure' || hotspotTarget?.type === 'seat')) {
        detailHotspotHighlightParts.push(`<circle class="visualization-detail-hotspot-ring" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${worldRadiusForPixels(7, transform)}"></circle>`);
      } else if (!isVisualizationDetail) {
        parts.push(`<circle class="hotspot-highlight-ring" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${worldRadiusForPixels(9, transform)}"></circle>`);
      }
      if (showInlineHotspotRank) {
        parts.push(`<text class="hotspot-inline-rank" x="${hotspotPoint.x}" y="${hotspotPoint.y}">${escapeHtml(String(rank))}</text>`);
      }
      if (showHotspotRankBadge) {
        const badge = getMarkerBadgePlacement(hotspotPoint, placedBadges, transform);
        parts.push(`<line class="map-marker-line" x1="${hotspotPoint.x}" y1="${hotspotPoint.y}" x2="${badge.x}" y2="${badge.y}"></line>`);
        parts.push(
          `<g class="hotspot-highlight-badge"><circle cx="${badge.x}" cy="${badge.y}" r="${badgeRadius}"></circle><text x="${badge.x}" y="${badge.y}">${escapeHtml(String(rank))}</text></g>`
        );
      }
      renderedHotspotTargetKeys.add(hotspotTargetKey);
    });

    if (selectedObject?.type === 'node') {
      const node = state.prepared.nodeById?.[selectedObject.id];
      if (node) {
        const displayNode = worldToDisplayPoint(node, transform);
        parts.push(
          `<circle class="${isVisualizationDetail ? 'visualization-node-dot' : `node-dot ${getNodeDisplayClass(node)}`} highlighted" cx="${displayNode.x}" cy="${displayNode.y}" r="${worldRadiusForPixels(6.1, transform)}" data-type="node" data-id="${escapeHtml(node.id)}"></circle>`
        );
        if (!isVisualizationDetail) {
          parts.push(
            `<text class="route-node-label" x="${displayNode.x + worldRadiusForPixels(4, transform)}" y="${displayNode.y - worldRadiusForPixels(4, transform)}">${escapeHtml(getNodeDisplayLabel(node))}</text>`
          );
        }
      }
    }

    if (highlightedSeatIds.size && !(activeLayerCategories || []).includes('seat') && state.activeLayerCategory !== 'seat') {
      state.prepared.seats.forEach((seat) => {
        if (!highlightedSeatIds.has(seat.id)) {
          return;
        }
        const displaySeat = worldToDisplayPoint(seat, transform);
        parts.push(`<circle class="seat-dot highlighted" cx="${displaySeat.x}" cy="${displaySeat.y}" r="${seatRadius}" fill="${escapeHtml(getCategoryColor('seat'))}" stroke="${escapeHtml(getCategoryStrokeColor('seat'))}" stroke-width="0.2" data-type="seat" data-id="${escapeHtml(seat.id)}"></circle>`);
      });
    }

    if (detailFocusInspectionActive && effectiveInspection && (state.viewMode === 'sensory' || state.viewMode === 'vitality')) {
      const displayPoint = worldToDisplayPoint(effectiveInspection, transform);
      parts.push(`<circle class="vision-ring" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${effectiveInspection.visionRadius}"></circle>`);
    }

    if (state.selectedDynamic?.kind === 'point' && dynamicInspection) {
      const displayPoint = worldToDisplayPoint(dynamicInspection, transform);
      const arm = worldRadiusForPixels(9, transform);
      parts.push(`<line class="inspect-cross" x1="${displayPoint.x - arm}" y1="${displayPoint.y}" x2="${displayPoint.x + arm}" y2="${displayPoint.y}"></line>`);
      parts.push(`<line class="inspect-cross" x1="${displayPoint.x}" y1="${displayPoint.y - arm}" x2="${displayPoint.x}" y2="${displayPoint.y + arm}"></line>`);
    }

    if (state.scenario) {
      state.scenario.agents.forEach((agent) => {
        if (!agent.active) {
          return;
        }
        if (agent.isFocusAgent) {
          const focusSource = playbackFocusSnapshot || playbackFocusInspection || agent.position || agent;
          const displayAgent = worldToDisplayPoint(focusSource, transform);
          const pausedClass = state.animationPaused && state.selectedDynamic?.kind === 'focus-agent' ? ' paused' : '';
          if (!renderDynamicAgentsInWebgl) {
            focusAgentParts.push(`<circle class="agent-dot focus-ring${pausedClass}" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${focusRingRadius}"></circle>`);
            focusAgentParts.push(`<circle class="agent-dot focus${pausedClass}" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${focusRadius}"></circle>`);
          }
          focusAgentParts.push(`<circle class="agent-hit-area" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${hitRadius}" data-type="focus-agent" data-id="${escapeHtml(agent.id)}"></circle>`);
        } else if (renderBackgroundCrowdSvgFallback() && renderableBackgroundAgentIds?.has(agent.id)) {
          const displayAgent = worldToDisplayPoint(agent.position, transform);
          backgroundAgentParts.push(`<circle class="agent-dot background" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${bgRadius}"></circle>`);
        }
      });
    }

    const overlayParts = [...backgroundAgentParts, ...parts, ...detailHotspotHighlightParts, ...focusAgentParts];

    if (isVisualizationDetail && state.visualizationDetailHoverTarget?.id) {
      const hoveredType = state.visualizationDetailHoverTarget?.type || null;
      const hoveredId = state.visualizationDetailHoverTarget?.id || null;
      let hoveredItem = null;
      let badgeText = '--';
      let hoveredPoint = null;
      if (hoveredType === 'node' && hoveredId) {
        hoveredItem = state.prepared.nodeById?.[hoveredId] || null;
        badgeText = getVisualizationNodeBadgeLabel(hoveredItem);
        hoveredPoint = hoveredItem ? worldToDisplayPoint(hoveredItem, transform) : null;
      } else if (hoveredType === 'pressure' && hoveredId) {
        hoveredItem = state.prepared.pressureObjects.find((item) => item.id === hoveredId) || null;
        badgeText = getVisualizationPressureBadgeLabel(hoveredItem);
        hoveredPoint = hoveredItem ? worldToDisplayPoint(hoveredItem, transform) : null;
      } else if (hoveredType === 'seat' && hoveredId) {
        hoveredItem = state.prepared.seats?.find((item) => item.id === hoveredId) || null;
        badgeText = hoveredItem?.name || hoveredItem?.label || hoveredItem?.id || '--';
        hoveredPoint = hoveredItem ? worldToDisplayPoint(hoveredItem, transform) : null;
      }
      if (hoveredItem && hoveredPoint) {
        const badgePaddingX = worldRadiusForPixels(10, transform);
        const badgePaddingY = worldRadiusForPixels(7, transform);
        const badgeFontSize = worldRadiusForPixels(11, transform);
        const badgeHeight = badgePaddingY * 2 + badgeFontSize;
        const badgeWidth = Math.max(
          worldRadiusForPixels(96, transform),
          badgePaddingX * 2 + estimateTooltipTextUnits(badgeText) * worldRadiusForPixels(6.8, transform)
        );
        const badgeX = clamp(
          hoveredPoint.x + worldRadiusForPixels(8, transform),
          transform.viewBox.x + worldRadiusForPixels(8, transform),
          transform.viewBox.x + transform.viewBox.width - badgeWidth - worldRadiusForPixels(8, transform)
        );
        const badgeY = clamp(
          hoveredPoint.y + worldRadiusForPixels(8, transform),
          transform.viewBox.y + worldRadiusForPixels(8, transform),
          transform.viewBox.y + transform.viewBox.height - badgeHeight - worldRadiusForPixels(8, transform)
        );
        overlayParts.push(`
          <g class="visualization-hover-tooltip">
            <rect class="visualization-hover-tooltip__backplate" x="${badgeX}" y="${badgeY}" width="${badgeWidth}" height="${badgeHeight}" rx="${worldRadiusForPixels(6, transform)}" ry="${worldRadiusForPixels(6, transform)}"></rect>
            <text class="visualization-hover-tooltip__text" x="${badgeX + badgePaddingX}" y="${badgeY + badgeHeight * 0.5}" style="font-size:${badgeFontSize}px;">${escapeHtml(badgeText)}</text>
          </g>
        `);
      }
    }

    overlayTarget.innerHTML = overlayParts.join('');
  }

  function renderRouteModal() {
    elements.routeModal.classList.toggle('hidden', !state.routeModal.open);
    if (!state.routeModal.open || !state.prepared) {
      elements.routeModalMap.innerHTML = '';
      elements.routeRegionList.innerHTML = '';
      return;
    }
    elements.routeModalInstruction.textContent = t(state.routePickMode === 'pick-target' ? 'hint.routePickTarget' : 'hint.routePickStart');
    const selectedStartNode = state.routeModal.startNodeId ? state.prepared.nodeById?.[state.routeModal.startNodeId] : null;
    elements.routeModalStartDisplay.innerHTML = selectedStartNode
      ? `<div><strong>${escapeHtml(state.locale === 'zh-CN' ? selectedStartNode.displayLabel || selectedStartNode.id : selectedStartNode.displayLabelEn || selectedStartNode.displayLabel || selectedStartNode.id)}</strong></div>`
      : `<div>${escapeHtml(t('hint.routePickStart'))}</div>`;
    elements.routeRegionList.innerHTML = state.prepared.targetRegions
      .map((region) => {
        const isActive = region.id === state.routeModal.targetRegionId;
        const label = state.locale === 'zh-CN' ? region.labelZh : region.labelEn || region.labelZh;
        return `<button class="route-region-btn${isActive ? ' active' : ''}" type="button" data-type="target-region" data-region-id="${escapeHtml(region.id)}">${escapeHtml(label)}</button>`;
      })
      .join('');

    const viewBox = getModelBounds();
    const transformForModal = computeTransformForContainer(elements.routeModalMapStage);
    elements.routeModalMap.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    const walkable = state.prepared.walkableAreas
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, transformForModal)}"></polygon>`)
      .join('');
    const obstacles = state.prepared.obstacles
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, transformForModal)}"></polygon>`)
      .join('');
    const nodes = state.prepared.nodes
      .map((node) => {
        const displayNode = worldToDisplayPoint(node, transformForModal);
        const nodeClass = getNodeDisplayClass(node);
        const isActive = state.routeModal.startNodeId === node.id;
        const label = state.locale === 'zh-CN' ? node.displayLabel || node.id : node.displayLabelEn || node.displayLabel || node.id;
        const radius = isActive ? worldRadiusForPixels(6.8, transformForModal) : worldRadiusForPixels(5.2, transformForModal);
        const hitRadius = worldRadiusForPixels(10.4, transformForModal);
        return `
          <circle class="route-modal-node-hit" cx="${displayNode.x}" cy="${displayNode.y}" r="${hitRadius}" data-route-node-id="${escapeHtml(node.id)}"></circle>
          <circle class="route-modal-node node-dot ${nodeClass}${isActive ? ' active' : ''}" cx="${displayNode.x}" cy="${displayNode.y}" r="${radius}" data-route-node-id="${escapeHtml(node.id)}"></circle>
          <text class="route-modal-node-label" x="${displayNode.x + worldRadiusForPixels(4, transformForModal)}" y="${displayNode.y - worldRadiusForPixels(4, transformForModal)}">${escapeHtml(label)}</text>
        `;
      })
      .join('');
    elements.routeModalMap.innerHTML = `${walkable}${obstacles}${nodes}`;
  }

  function renderSettingsRouteMap() {
    if (!elements.settingsRouteMap) {
      return;
    }
    if (!state.prepared || !elements.settingsRouteMapStage) {
      elements.settingsRouteMap.innerHTML = '';
      return;
    }
    const viewBox = getModelBounds();
    const transformForSettings = computeTransformForContainer(elements.settingsRouteMapStage);
    elements.settingsRouteMap.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    const walkable = state.prepared.walkableAreas
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, transformForSettings)}"></polygon>`)
      .join('');
    const obstacles = state.prepared.obstacles
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, transformForSettings)}"></polygon>`)
      .join('');
    const nodes = state.prepared.nodes
      .map((node) => {
        const displayNode = worldToDisplayPoint(node, transformForSettings);
        const nodeClass = getNodeDisplayClass(node);
        const isActive = state.routeSelection.startNodeId === node.id;
        const label = state.locale === 'zh-CN' ? node.displayLabel || node.id : node.displayLabelEn || node.displayLabel || node.id;
        const labelLayout = getSettingsRouteLabelLayout(node, displayNode, transformForSettings);
        const radius = isActive ? worldRadiusForPixels(6.2, transformForSettings) : worldRadiusForPixels(5.2, transformForSettings);
        const hitRadius = worldRadiusForPixels(10.4, transformForSettings);
        const ringRadius = worldRadiusForPixels(9.8, transformForSettings);
        return `
          <circle class="route-modal-node-hit" cx="${displayNode.x}" cy="${displayNode.y}" r="${hitRadius}" data-route-node-id="${escapeHtml(node.id)}"></circle>
          ${isActive ? `<circle class="route-modal-node-ring ${nodeClass} active" cx="${displayNode.x}" cy="${displayNode.y}" r="${ringRadius}"></circle>` : ''}
          <circle class="route-modal-node node-dot ${nodeClass}${isActive ? ' active' : ''}" cx="${displayNode.x}" cy="${displayNode.y}" r="${radius}" data-route-node-id="${escapeHtml(node.id)}"></circle>
          <text class="route-modal-node-label settings-route-node-label" x="${labelLayout.x}" y="${labelLayout.y}" text-anchor="${labelLayout.textAnchor}" dominant-baseline="${labelLayout.dominantBaseline}">${escapeHtml(label)}</text>
        `;
      })
      .join('');
    elements.settingsRouteMap.innerHTML = `${walkable}${obstacles}${nodes}`;
  }

  function renderSpatialEditorRouteMap() {
    if (!elements.spatialEditorMap) {
      return;
    }
    if (!state.prepared || !elements.spatialEditorRouteMapStage) {
      elements.spatialEditorMap.innerHTML = '';
      return;
    }
    const viewBox = getModelBounds();
    const transformForEditor = computeTransformForContainer(elements.spatialEditorRouteMapStage);
    elements.spatialEditorMap.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    const walkable = state.prepared.walkableAreas
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, transformForEditor)}"></polygon>`)
      .join('');
    const obstacles = state.prepared.obstacles
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, transformForEditor)}"></polygon>`)
      .join('');
    const nodes = state.prepared.nodes
      .map((node) => {
        const displayNode = worldToDisplayPoint(node, transformForEditor);
        const nodeClass = getNodeDisplayClass(node);
        const label = state.locale === 'zh-CN' ? node.displayLabel || node.id : node.displayLabelEn || node.displayLabel || node.id;
        const labelLayout = getSettingsRouteLabelLayout(node, displayNode, transformForEditor);
        return `
          <g class="spatial-editor-object spatial-editor-object--node" data-spatial-editor-object="${escapeHtml(label)}" data-object-type="Node" data-x="${displayNode.x}" data-y="${displayNode.y}">
            <circle class="route-modal-node node-dot ${nodeClass}" data-editor-shape cx="${displayNode.x}" cy="${displayNode.y}" r="${worldRadiusForPixels(5.2, transformForEditor)}"></circle>
            <text class="route-modal-node-label settings-route-node-label" data-editor-label x="${labelLayout.x}" y="${labelLayout.y}" text-anchor="${labelLayout.textAnchor}" dominant-baseline="${labelLayout.dominantBaseline}">${escapeHtml(label)}</text>
          </g>
        `;
      })
      .join('');
    const pressureObjects = [
      ...(state.prepared.pressureObjects || []).map((item) => ({ type: 'pressure', item })),
      ...(state.prepared.seats || []).map((item) => ({ type: 'seat', item })),
    ]
      .map(({ type, item }) => {
        const displayPoint = worldToDisplayPoint(item, transformForEditor);
        const categoryId = getLayerCategoryForObject(type, item);
        const label = item.name || item.feature || item.id || categoryId;
        const color = getCategoryColor(categoryId);
        const radius = worldRadiusForPixels(5.2, transformForEditor);
        const labelOffset = worldRadiusForPixels(6.5, transformForEditor);
        return `
          <g class="spatial-editor-object spatial-editor-object--pressure" data-spatial-editor-object="${escapeHtml(label)}" data-object-type="${type === 'seat' ? 'Seat' : 'Pressure Point'}" data-x="${displayPoint.x}" data-y="${displayPoint.y}">
            <circle class="spatial-editor-pressure-point" data-editor-shape cx="${displayPoint.x}" cy="${displayPoint.y}" r="${radius}" fill="${escapeHtml(color)}"></circle>
            <text class="spatial-editor-pressure-label" data-editor-label x="${displayPoint.x + labelOffset}" y="${displayPoint.y - labelOffset}">${escapeHtml(label)}</text>
          </g>
        `;
      })
      .join('');
    elements.spatialEditorMap.innerHTML = `${walkable}${obstacles}${nodes}${pressureObjects}`;
  }

  function getAgentRadarLayout() {
    return {
      viewBoxWidth: 480,
      viewBoxHeight: 460,
      centerX: 240,
      centerY: 230,
      radius: 126,
      labelRadius: 186,
      scoreRadius: 158,
      minScoreRatio: 0.2,
    };
  }

  function getAgentRadarActiveDimensionId() {
    return FIVE_DIMENSION_ORDER.includes(state.agentModal?.activeDimensionId)
      ? state.agentModal.activeDimensionId
      : FIVE_DIMENSION_ORDER[0];
  }

  function getAgentRadarAngle(index) {
    return ((-90 + (360 / FIVE_DIMENSION_ORDER.length) * index) * Math.PI) / 180;
  }

  function getAgentRadarPoint(index, distance, layout = getAgentRadarLayout()) {
    const angle = getAgentRadarAngle(index);
    return {
      x: layout.centerX + Math.cos(angle) * distance,
      y: layout.centerY + Math.sin(angle) * distance,
    };
  }

  function getAgentRadarTextPoint(index, distance, layout = getAgentRadarLayout(), inwardOffset = 0, lateralOffset = 0) {
    const angle = getAgentRadarAngle(index);
    const radialDistance = distance - inwardOffset;
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const tangentX = -Math.sin(angle);
    const tangentY = Math.cos(angle);
    return {
      x: layout.centerX + radialX * radialDistance + tangentX * lateralOffset,
      y: layout.centerY + radialY * radialDistance + tangentY * lateralOffset,
    };
  }

  function getAgentRadarTextPlacement(id, locale = state.locale) {
    const isEnglish = locale === 'en';
    const shared = {
      locomotor: { inwardOffset: 0, lateralOffset: 0, x: 0, labelY: -4, scoreY: 20 },
      sensory: { inwardOffset: 4, lateralOffset: 0, x: 0, labelY: -14, scoreY: 8 },
      cognitive: { inwardOffset: 8, lateralOffset: 0, x: isEnglish ? 22 : 14, labelY: 8, scoreY: 28 },
      psychological: { inwardOffset: 8, lateralOffset: 0, x: isEnglish ? -22 : -14, labelY: 8, scoreY: 28 },
      vitality: { inwardOffset: 4, lateralOffset: 0, x: 0, labelY: -14, scoreY: 8 },
    };
    return shared[id] || shared.locomotor;
  }

  function formatAgentRadarScore(score, locale = state.locale) {
    return `${score}`;
  }

  function getAgentPreviewScoreColor(score) {
    const safeScore = clamp(Math.round(Number(score || 0)), 1, 5);
    return AGENT_PREVIEW_SCORE_COLORS[safeScore] || AGENT_PREVIEW_SCORE_COLORS[3];
  }

  function getSettingsAgentPreviewCacheKey(dimensionScores) {
    const safeScores = getEditableCapacityScores(dimensionScores);
    return AGENT_PREVIEW_DIMENSION_ORDER
      .map((id) => `${id}:${safeScores[id]}`)
      .join('|');
  }

  function loadAgentPreviewSourceImage(score) {
    const safeScore = clamp(Math.round(Number(score || 0)), 1, 5);
    if (agentPreviewImageCache.has(safeScore)) {
      return agentPreviewImageCache.get(safeScore);
    }
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load agent pose sheet: ${safeScore}`));
      image.src = AGENT_PREVIEW_POSE_SOURCES[safeScore];
    });
    agentPreviewImageCache.set(safeScore, promise);
    return promise;
  }

  function createAgentPreviewCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
  }

  function cropAgentPreviewPoseCanvas(sourceImage, score) {
    const cropFrame = AGENT_PREVIEW_POSE_CROP_FRAMES[score] || AGENT_PREVIEW_POSE_CROP_FRAMES[3];
    const canvas = createAgentPreviewCanvas(cropFrame.width, cropFrame.height);
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      sourceImage,
      cropFrame.x,
      cropFrame.y,
      cropFrame.width,
      cropFrame.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }

  function normalizeAgentPreviewShapeMetric(value, total) {
    return Number(value || 0) <= 1 ? Number(value || 0) * total : Number(value || 0);
  }

  function traceAgentPreviewMaskShape(context, shape, width, height) {
    if (!shape) {
      return;
    }
    if (shape.type === 'rect') {
      const x = normalizeAgentPreviewShapeMetric(shape.x, width);
      const y = normalizeAgentPreviewShapeMetric(shape.y, height);
      const rectWidth = normalizeAgentPreviewShapeMetric(shape.width, width);
      const rectHeight = normalizeAgentPreviewShapeMetric(shape.height, height);
      const radius = Math.max(0, normalizeAgentPreviewShapeMetric(shape.radius || 0, Math.min(width, height)));
      if (radius > 0) {
        context.roundRect(x, y, rectWidth, rectHeight, radius);
      } else {
        context.rect(x, y, rectWidth, rectHeight);
      }
      return;
    }
    const cx = normalizeAgentPreviewShapeMetric(shape.cx, width);
    const cy = normalizeAgentPreviewShapeMetric(shape.cy, height);
    const rx = normalizeAgentPreviewShapeMetric(shape.rx, width);
    const ry = normalizeAgentPreviewShapeMetric(shape.ry, height);
    context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }

  function shouldApplyAgentPreviewSemanticMask(dimensionId) {
    return dimensionId === 'psychological' || dimensionId === 'vitality';
  }

  function isAgentPreviewPointInsideMaskShape(x, y, shape, width, height) {
    if (!shape) {
      return false;
    }
    if (shape.type === 'rect') {
      const rectX = normalizeAgentPreviewShapeMetric(shape.x, width);
      const rectY = normalizeAgentPreviewShapeMetric(shape.y, height);
      const rectWidth = normalizeAgentPreviewShapeMetric(shape.width, width);
      const rectHeight = normalizeAgentPreviewShapeMetric(shape.height, height);
      return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
    }
    const cx = normalizeAgentPreviewShapeMetric(shape.cx, width);
    const cy = normalizeAgentPreviewShapeMetric(shape.cy, height);
    const rx = Math.max(1, normalizeAgentPreviewShapeMetric(shape.rx, width));
    const ry = Math.max(1, normalizeAgentPreviewShapeMetric(shape.ry, height));
    const deltaX = (x - cx) / rx;
    const deltaY = (y - cy) / ry;
    return deltaX * deltaX + deltaY * deltaY <= 1;
  }

  function getAgentPreviewMaskedPixelsFromComponents(components, regionMask = null, sourceSearchBox = null) {
    if (!Array.isArray(components) || !components.length) {
      return [];
    }
    const width = Math.max(1, Number(sourceSearchBox?.width || 1));
    const height = Math.max(1, Number(sourceSearchBox?.height || 1));
    const shapes = Array.isArray(regionMask?.shapes) ? regionMask.shapes : [];
    if (!shapes.length) {
      return components.flatMap((component) => Array.isArray(component?.pixels) ? component.pixels : []);
    }
    const maskedPixels = [];
    components.forEach((component) => {
      component.pixels.forEach(([x, y]) => {
        if (shapes.some((shape) => isAgentPreviewPointInsideMaskShape(x, y, shape, width, height))) {
          maskedPixels.push([x, y]);
        }
      });
    });
    return maskedPixels;
  }

  function isAgentPreviewChromaticPixel(red, green, blue, alpha) {
    if (alpha <= 0) {
      return false;
    }
    const brightness = (red + green + blue) / 3;
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    return chroma >= 28 && brightness > 12 && !(red > 220 && green > 220 && blue > 220);
  }

  function extractAgentPreviewChromaticComponents(sourceCanvas, cacheKey = '') {
    if (cacheKey && agentPreviewChromaticComponentCache.has(cacheKey)) {
      return agentPreviewChromaticComponentCache.get(cacheKey);
    }
    const context = sourceCanvas.getContext('2d');
    const { width, height } = sourceCanvas;
    const { data } = context.getImageData(0, 0, width, height);
    const visited = new Uint8Array(width * height);
    const components = [];
    for (let startY = 0; startY < height; startY += 1) {
      for (let startX = 0; startX < width; startX += 1) {
        const startIndex = startY * width + startX;
        if (visited[startIndex]) {
          continue;
        }
        visited[startIndex] = 1;
        const colorIndex = startIndex * 4;
        if (!isAgentPreviewChromaticPixel(
          data[colorIndex],
          data[colorIndex + 1],
          data[colorIndex + 2],
          data[colorIndex + 3]
        )) {
          continue;
        }
        const queue = [[startX, startY]];
        const pixels = [];
        let minX = startX;
        let minY = startY;
        let maxX = startX;
        let maxY = startY;
        let sumX = 0;
        let sumY = 0;
        while (queue.length) {
          const [x, y] = queue.pop();
          const pixelIndex = y * width + x;
          const pixelColorIndex = pixelIndex * 4;
          if (!isAgentPreviewChromaticPixel(
            data[pixelColorIndex],
            data[pixelColorIndex + 1],
            data[pixelColorIndex + 2],
            data[pixelColorIndex + 3]
          )) {
            continue;
          }
          pixels.push([x, y]);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          sumX += x;
          sumY += y;
          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
          ];
          neighbors.forEach(([nextX, nextY]) => {
            if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) {
              return;
            }
            const nextIndex = nextY * width + nextX;
            if (visited[nextIndex]) {
              return;
            }
            visited[nextIndex] = 1;
            const nextColorIndex = nextIndex * 4;
            if (isAgentPreviewChromaticPixel(
              data[nextColorIndex],
              data[nextColorIndex + 1],
              data[nextColorIndex + 2],
              data[nextColorIndex + 3]
            )) {
              queue.push([nextX, nextY]);
            }
          });
        }
        if (pixels.length < 32) {
          continue;
        }
        components.push({
          pixels,
          area: pixels.length,
          bounds: {
            x: minX,
            y: minY,
            width: Math.max(1, maxX - minX + 1),
            height: Math.max(1, maxY - minY + 1),
          },
          centroid: {
            x: sumX / pixels.length,
            y: sumY / pixels.length,
          },
        });
      }
    }
    components.sort((left, right) => right.area - left.area);
    if (cacheKey) {
      agentPreviewChromaticComponentCache.set(cacheKey, components);
    }
    return components;
  }

  function getAgentPreviewBoundsOverlapArea(leftBounds, rightBounds) {
    const overlapLeft = Math.max(leftBounds.x, rightBounds.x);
    const overlapTop = Math.max(leftBounds.y, rightBounds.y);
    const overlapRight = Math.min(leftBounds.x + leftBounds.width, rightBounds.x + rightBounds.width);
    const overlapBottom = Math.min(leftBounds.y + leftBounds.height, rightBounds.y + rightBounds.height);
    if (overlapRight <= overlapLeft || overlapBottom <= overlapTop) {
      return 0;
    }
    return (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
  }

  function normalizeAgentPreviewPoint(point, sourceSearchBox) {
    const searchWidth = Math.max(1, Number(sourceSearchBox?.width || 0));
    const searchHeight = Math.max(1, Number(sourceSearchBox?.height || 0));
    return {
      x: normalizeAgentPreviewShapeMetric(point?.x, searchWidth),
      y: normalizeAgentPreviewShapeMetric(point?.y, searchHeight),
    };
  }

  function getAgentPreviewBoundsPointDistance(bounds, point) {
    const pointX = Number(point?.x || 0);
    const pointY = Number(point?.y || 0);
    const minX = Number(bounds?.x || 0);
    const minY = Number(bounds?.y || 0);
    const maxX = minX + Number(bounds?.width || 0);
    const maxY = minY + Number(bounds?.height || 0);
    const deltaX = pointX < minX ? (minX - pointX) : (pointX > maxX ? pointX - maxX : 0);
    const deltaY = pointY < minY ? (minY - pointY) : (pointY > maxY ? pointY - maxY : 0);
    return Math.hypot(deltaX, deltaY);
  }

  function getAgentPreviewBoundsDistance(leftBounds, rightBounds) {
    const leftMinX = Number(leftBounds?.x || 0);
    const leftMinY = Number(leftBounds?.y || 0);
    const leftMaxX = leftMinX + Number(leftBounds?.width || 0);
    const leftMaxY = leftMinY + Number(leftBounds?.height || 0);
    const rightMinX = Number(rightBounds?.x || 0);
    const rightMinY = Number(rightBounds?.y || 0);
    const rightMaxX = rightMinX + Number(rightBounds?.width || 0);
    const rightMaxY = rightMinY + Number(rightBounds?.height || 0);
    const deltaX = leftMaxX < rightMinX
      ? rightMinX - leftMaxX
      : (rightMaxX < leftMinX ? leftMinX - rightMaxX : 0);
    const deltaY = leftMaxY < rightMinY
      ? rightMinY - leftMaxY
      : (rightMaxY < leftMinY ? leftMinY - rightMaxY : 0);
    return Math.hypot(deltaX, deltaY);
  }

  function getAgentPreviewComponentForSeed(chromaticComponents, seed, usedComponents = new Set()) {
    if (!Array.isArray(chromaticComponents) || !chromaticComponents.length || !seed) {
      return null;
    }
    const scoredComponents = chromaticComponents
      .filter((component) => !usedComponents.has(component))
      .map((component) => {
        const bounds = component.bounds || {};
        const pointDistance = getAgentPreviewBoundsPointDistance(bounds, seed);
        const centroidDistance = getAgentPreviewComponentTargetDistance(component, seed);
        const containsSeed = pointDistance <= 0.5;
        return {
          component,
          pointDistance,
          centroidDistance,
          containsSeed,
        };
      })
      .filter((entry) => entry.containsSeed || entry.pointDistance <= 18 || entry.centroidDistance <= 34)
      .sort((left, right) => (
        Number(right.containsSeed) - Number(left.containsSeed)
        || left.pointDistance - right.pointDistance
        || left.centroidDistance - right.centroidDistance
        || right.component.area - left.component.area
      ));
    return scoredComponents[0]?.component || null;
  }

  function expandAgentPreviewRegionComponentsWithFragmentSeeds(selectedComponents, chromaticComponents, sourceSearchBox, fragmentSeeds = []) {
    if (!Array.isArray(selectedComponents) || !selectedComponents.length || !Array.isArray(chromaticComponents) || !chromaticComponents.length) {
      return selectedComponents;
    }
    const expandedComponents = [...selectedComponents];
    const usedComponents = new Set(selectedComponents);
    fragmentSeeds.forEach((seed) => {
      const normalizedSeed = normalizeAgentPreviewPoint(seed, sourceSearchBox);
      const fragmentComponent = getAgentPreviewComponentForSeed(chromaticComponents, normalizedSeed, usedComponents);
      if (!fragmentComponent) {
        return;
      }
      expandedComponents.push(fragmentComponent);
      usedComponents.add(fragmentComponent);
    });
    return expandedComponents;
  }

  function expandAgentPreviewLocomotorComponents(selectedComponents, chromaticComponents, sourceSearchBox, fragmentSeeds = []) {
    return expandAgentPreviewRegionComponentsWithFragmentSeeds(
      selectedComponents,
      chromaticComponents,
      sourceSearchBox,
      fragmentSeeds
    );
  }

  function getAgentPreviewRegionComponents(metadata, dimensionId) {
    if (!metadata || !dimensionId) {
      return [];
    }
    if (metadata.regionComponentSelectionCache?.[dimensionId]) {
      return metadata.regionComponentSelectionCache[dimensionId];
    }
    if (!metadata.regionComponentSelectionCache) {
      metadata.regionComponentSelectionCache = {};
    }
    const chromaticComponents = Array.isArray(metadata.chromaticComponents) ? metadata.chromaticComponents : [];
    const sourceSearchBox = metadata.sourceSearchBox || {};
    const fixedRegionSpec = metadata.regionComponents?.[dimensionId];
    const fixedSeeds = Array.isArray(fixedRegionSpec?.seeds)
      ? fixedRegionSpec.seeds.map((seed) => normalizeAgentPreviewPoint(seed, sourceSearchBox))
      : [];
    if (fixedSeeds.length) {
      const usedComponents = new Set();
      const selectedComponents = [];
      fixedSeeds.forEach((seed) => {
        const component = getAgentPreviewComponentForSeed(chromaticComponents, seed, usedComponents);
        if (!component) {
          return;
        }
        selectedComponents.push(component);
        usedComponents.add(component);
      });
      if (selectedComponents.length) {
        const fragmentSeeds = Array.isArray(metadata?.regionFragmentSeeds?.[dimensionId]?.seeds)
          ? metadata.regionFragmentSeeds[dimensionId].seeds
          : [];
        if (fragmentSeeds.length) {
          const expandedComponents = dimensionId === 'locomotor'
            ? expandAgentPreviewLocomotorComponents(
              selectedComponents,
              chromaticComponents,
              sourceSearchBox,
              fragmentSeeds
            )
            : expandAgentPreviewRegionComponentsWithFragmentSeeds(
              selectedComponents,
              chromaticComponents,
              sourceSearchBox,
              fragmentSeeds
            );
          metadata.regionComponentSelectionCache[dimensionId] = expandedComponents;
          return expandedComponents;
        }
        if (dimensionId === 'locomotor' && Number(metadata?.score || 0) >= 2) {
          const expandedLocomotorComponents = expandAgentPreviewLocomotorComponents(
            selectedComponents,
            chromaticComponents,
            sourceSearchBox,
            []
          );
          metadata.regionComponentSelectionCache[dimensionId] = expandedLocomotorComponents;
          return expandedLocomotorComponents;
        }
        metadata.regionComponentSelectionCache[dimensionId] = selectedComponents;
        return selectedComponents;
      }
    }
    const fallbackComponents = getAgentPreviewSelectedComponentsForDimensionFallback(metadata, dimensionId);
    metadata.regionComponentSelectionCache[dimensionId] = fallbackComponents;
    return fallbackComponents;
  }

  function getAgentPreviewDimensionTarget(metadata, dimensionId) {
    const sourceSearchBox = metadata?.sourceSearchBox || {};
    const searchWidth = Math.max(1, Number(sourceSearchBox.width || 0));
    const searchHeight = Math.max(1, Number(sourceSearchBox.height || 0));
    const rawTarget = metadata?.regionTargets?.[dimensionId];
    const rawPoints = Array.isArray(rawTarget?.points) && rawTarget.points.length
      ? rawTarget.points
      : (rawTarget ? [rawTarget] : []);
    const points = rawPoints
      .map((point) => {
        if (!point) {
          return null;
        }
        return {
          x: normalizeAgentPreviewShapeMetric(point.x, searchWidth),
          y: normalizeAgentPreviewShapeMetric(point.y, searchHeight),
        };
      })
      .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
    if (points.length) {
      return {
        points,
        maxComponents: Math.max(1, Number(rawTarget?.maxComponents || points.length || 1)),
      };
    }
    const connectorAnchor = metadata?.connectorAnchors?.[dimensionId];
    if (connectorAnchor) {
      return {
        points: [{
          x: normalizeAgentPreviewShapeMetric(connectorAnchor.x, searchWidth),
          y: normalizeAgentPreviewShapeMetric(connectorAnchor.y, searchHeight),
        }],
        maxComponents: dimensionId === 'locomotor' ? 2 : 1,
      };
    }
    const regionMask = metadata?.regionMasks?.[dimensionId];
    const overlap = getAgentPreviewComponentMaskOverlap(regionMask, sourceSearchBox);
    if (!overlap) {
      return null;
    }
    return {
      points: [{
        x: overlap.x + overlap.width / 2,
        y: overlap.y + overlap.height / 2,
      }],
      maxComponents: dimensionId === 'locomotor' ? 2 : 1,
    };
  }

  function getAgentPreviewComponentTargetDistance(component, point) {
    const deltaX = Number(component?.centroid?.x || 0) - Number(point?.x || 0);
    const deltaY = Number(component?.centroid?.y || 0) - Number(point?.y || 0);
    return Math.hypot(deltaX, deltaY);
  }

  function getAgentPreviewSelectedComponents(regionMask, chromaticComponents, sourceSearchBox, dimensionId) {
    const overlap = getAgentPreviewComponentMaskOverlap(regionMask, sourceSearchBox);
    if (!overlap || !Array.isArray(chromaticComponents) || !chromaticComponents.length) {
      return [];
    }
    const overlapArea = Math.max(1, overlap.width * overlap.height);
    const scoredComponents = chromaticComponents
      .map((component) => {
        const bounds = component.bounds || {};
        const componentArea = Math.max(1, bounds.width * bounds.height);
        const boundsOverlapArea = getAgentPreviewBoundsOverlapArea(bounds, overlap);
        const centroidInside = component.centroid.x >= overlap.x
          && component.centroid.x <= overlap.x + overlap.width
          && component.centroid.y >= overlap.y
          && component.centroid.y <= overlap.y + overlap.height;
        return {
          component,
          boundsOverlapArea,
          overlapShare: boundsOverlapArea / componentArea,
          regionShare: boundsOverlapArea / overlapArea,
          centroidInside,
        };
      })
      .filter((entry) => entry.centroidInside || entry.overlapShare >= 0.18 || entry.regionShare >= 0.08)
      .sort((left, right) => (
        Number(right.centroidInside) - Number(left.centroidInside)
        || right.boundsOverlapArea - left.boundsOverlapArea
        || right.component.area - left.component.area
      ));
    if (!scoredComponents.length) {
      return [];
    }
    const shouldKeepAllMatches = dimensionId === 'vitality' || dimensionId === 'locomotor';
    return shouldKeepAllMatches
      ? scoredComponents.map((entry) => entry.component)
      : [scoredComponents[0].component];
  }

  function getAgentPreviewSelectedComponentsForDimensionFallback(metadata, dimensionId) {
    const regionMask = metadata?.regionMasks?.[dimensionId];
    const sourceSearchBox = metadata?.sourceSearchBox || {};
    const chromaticComponents = Array.isArray(metadata?.chromaticComponents) ? metadata.chromaticComponents : [];
    if (!chromaticComponents.length) {
      return [];
    }
    const overlap = getAgentPreviewComponentMaskOverlap(regionMask, sourceSearchBox);
    const overlapArea = overlap ? Math.max(1, overlap.width * overlap.height) : 1;
    const dimensionTarget = getAgentPreviewDimensionTarget(metadata, dimensionId);
    const targetPoints = Array.isArray(dimensionTarget?.points) ? dimensionTarget.points : [];
    if (!targetPoints.length) {
      return getAgentPreviewSelectedComponents(regionMask, chromaticComponents, sourceSearchBox, dimensionId);
    }
    const targetReach = Math.max(
      12,
      (overlap ? Math.max(overlap.width, overlap.height) : 0) * (dimensionId === 'locomotor' ? 0.9 : 0.72)
    );
    const scoredComponents = chromaticComponents
      .map((component) => {
        const bounds = component.bounds || {};
        const componentArea = Math.max(1, bounds.width * bounds.height);
        const boundsOverlapArea = overlap ? getAgentPreviewBoundsOverlapArea(bounds, overlap) : 0;
        const centroidInside = overlap
          ? (
            component.centroid.x >= overlap.x
            && component.centroid.x <= overlap.x + overlap.width
            && component.centroid.y >= overlap.y
            && component.centroid.y <= overlap.y + overlap.height
          )
          : false;
        const distances = targetPoints.map((point) => getAgentPreviewComponentTargetDistance(component, point));
        const minTargetDistance = distances.length ? Math.min(...distances) : Number.POSITIVE_INFINITY;
        return {
          component,
          boundsOverlapArea,
          overlapShare: boundsOverlapArea / componentArea,
          regionShare: boundsOverlapArea / overlapArea,
          centroidInside,
          minTargetDistance,
          distances,
        };
      })
      .filter((entry) => (
        entry.centroidInside
        || entry.overlapShare >= 0.18
        || entry.regionShare >= 0.08
        || entry.minTargetDistance <= targetReach
      ))
      .sort((left, right) => (
        left.minTargetDistance - right.minTargetDistance
        || Number(right.centroidInside) - Number(left.centroidInside)
        || right.boundsOverlapArea - left.boundsOverlapArea
        || right.component.area - left.component.area
      ));
    if (!scoredComponents.length) {
      return [];
    }
    const maxComponents = Math.max(1, Number(dimensionTarget?.maxComponents || 1));
    if (maxComponents === 1) {
      return [scoredComponents[0].component];
    }
    const selected = [];
    const usedComponents = new Set();
    targetPoints.forEach((point, pointIndex) => {
      const bestMatch = scoredComponents
        .filter((entry) => !usedComponents.has(entry.component))
        .sort((left, right) => (
          left.distances[pointIndex] - right.distances[pointIndex]
          || Number(right.centroidInside) - Number(left.centroidInside)
          || right.boundsOverlapArea - left.boundsOverlapArea
          || right.component.area - left.component.area
        ))[0];
      if (!bestMatch) {
        return;
      }
      selected.push(bestMatch.component);
      usedComponents.add(bestMatch.component);
    });
    scoredComponents.forEach((entry) => {
      if (selected.length >= maxComponents || usedComponents.has(entry.component)) {
        return;
      }
      selected.push(entry.component);
      usedComponents.add(entry.component);
    });
    return selected.slice(0, maxComponents);
  }

  function getAgentPreviewSelectedComponentsForDimension(metadata, dimensionId) {
    return getAgentPreviewRegionComponents(metadata, dimensionId);
  }

  function getAgentPreviewComponentsBounds(components, fallbackBounds) {
    if (!Array.isArray(components) || !components.length) {
      return fallbackBounds || null;
    }
    return components.reduce((combined, component) => {
      const bounds = component.bounds || {};
      if (!combined) {
        return {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
      }
      const minX = Math.min(combined.x, bounds.x);
      const minY = Math.min(combined.y, bounds.y);
      const maxX = Math.max(combined.x + combined.width, bounds.x + bounds.width);
      const maxY = Math.max(combined.y + combined.height, bounds.y + bounds.height);
      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }, null);
  }

  function buildAgentPreviewRegionMaskCanvas(sourceCanvas, components, regionMask = null, sourceSearchBox = null) {
    const maskCanvas = createAgentPreviewCanvas(sourceCanvas.width, sourceCanvas.height);
    const maskContext = maskCanvas.getContext('2d');
    const maskImageData = maskContext.createImageData(maskCanvas.width, maskCanvas.height);
    const pixels = getAgentPreviewMaskedPixelsFromComponents(
      components,
      regionMask,
      sourceSearchBox || { width: maskCanvas.width, height: maskCanvas.height }
    );
    pixels.forEach(([x, y]) => {
      const index = (y * maskCanvas.width + x) * 4;
      maskImageData.data[index] = 255;
      maskImageData.data[index + 1] = 255;
      maskImageData.data[index + 2] = 255;
      maskImageData.data[index + 3] = 255;
    });
    maskContext.putImageData(maskImageData, 0, 0);
    return maskCanvas;
  }

  function getAgentPreviewRegionCenterFromComponents(components, fallbackBounds, width, height, regionMask = null, sourceSearchBox = null) {
    const maskedPixels = getAgentPreviewMaskedPixelsFromComponents(
      components,
      regionMask,
      sourceSearchBox || { width, height }
    );
    const bounds = maskedPixels.length
      ? maskedPixels.reduce((combined, [x, y]) => {
        if (!combined) {
          return { minX: x, minY: y, maxX: x, maxY: y, sumX: x, sumY: y, count: 1 };
        }
        return {
          minX: Math.min(combined.minX, x),
          minY: Math.min(combined.minY, y),
          maxX: Math.max(combined.maxX, x),
          maxY: Math.max(combined.maxY, y),
          sumX: combined.sumX + x,
          sumY: combined.sumY + y,
          count: combined.count + 1,
        };
      }, null)
      : null;
    const regionBounds = bounds
      ? {
        x: bounds.minX,
        y: bounds.minY,
        width: Math.max(1, bounds.maxX - bounds.minX + 1),
        height: Math.max(1, bounds.maxY - bounds.minY + 1),
      }
      : getAgentPreviewComponentsBounds(components, fallbackBounds);
    const centroidX = bounds
      ? bounds.sumX / Math.max(1, bounds.count)
      : null;
    const centroidY = bounds
      ? bounds.sumY / Math.max(1, bounds.count)
      : null;
    const finalBounds = regionBounds;
    if (!finalBounds) {
      return { x: 50, y: 50, rx: 10, ry: 10 };
    }
    const totalArea = components.reduce((sum, component) => sum + Math.max(1, Number(component.area || 0)), 0);
    const resolvedCentroidX = Number.isFinite(centroidX)
      ? centroidX
      : (
        totalArea > 0
          ? components.reduce((sum, component) => sum + component.centroid.x * Math.max(1, Number(component.area || 0)), 0) / totalArea
          : (finalBounds.x + finalBounds.width / 2)
      );
    const resolvedCentroidY = Number.isFinite(centroidY)
      ? centroidY
      : (
        totalArea > 0
          ? components.reduce((sum, component) => sum + component.centroid.y * Math.max(1, Number(component.area || 0)), 0) / totalArea
          : (finalBounds.y + finalBounds.height / 2)
      );
    return {
      x: (resolvedCentroidX / Math.max(1, width)) * 100,
      y: (resolvedCentroidY / Math.max(1, height)) * 100,
      rx: Math.max(5, (finalBounds.width / Math.max(1, width)) * 50),
      ry: Math.max(5, (finalBounds.height / Math.max(1, height)) * 50),
    };
  }

  function getAgentPreviewComponentMaskOverlap(regionMask, sourceSearchBox) {
    const maskShapes = Array.isArray(regionMask?.shapes) ? regionMask.shapes : [];
    if (!maskShapes.length) {
      return sourceSearchBox || null;
    }
    const searchWidth = Number(sourceSearchBox?.width || 0);
    const searchHeight = Number(sourceSearchBox?.height || 0);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    maskShapes.forEach((shape) => {
      if (!shape) {
        return;
      }
      if (shape.type === 'rect') {
        const x = normalizeAgentPreviewShapeMetric(shape.x, searchWidth);
        const y = normalizeAgentPreviewShapeMetric(shape.y, searchHeight);
        const width = normalizeAgentPreviewShapeMetric(shape.width, searchWidth);
        const height = normalizeAgentPreviewShapeMetric(shape.height, searchHeight);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
        return;
      }
      const cx = normalizeAgentPreviewShapeMetric(shape.cx, searchWidth);
      const cy = normalizeAgentPreviewShapeMetric(shape.cy, searchHeight);
      const rx = normalizeAgentPreviewShapeMetric(shape.rx, searchWidth);
      const ry = normalizeAgentPreviewShapeMetric(shape.ry, searchHeight);
      minX = Math.min(minX, cx - rx);
      minY = Math.min(minY, cy - ry);
      maxX = Math.max(maxX, cx + rx);
      maxY = Math.max(maxY, cy + ry);
    });
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return sourceSearchBox || null;
    }
    return {
      x: Math.max(0, Math.floor(minX)),
      y: Math.max(0, Math.floor(minY)),
      width: Math.max(1, Math.ceil(maxX - minX)),
      height: Math.max(1, Math.ceil(maxY - minY)),
    };
  }

  function getAgentPreviewRegionCenter(regionMask, width, height) {
    const overlap = getAgentPreviewComponentMaskOverlap(regionMask, { width, height });
    if (!overlap) {
      return { x: 50, y: 50, rx: 10, ry: 10 };
    }
    return {
      x: ((overlap.x + overlap.width / 2) / Math.max(1, width)) * 100,
      y: ((overlap.y + overlap.height / 2) / Math.max(1, height)) * 100,
      rx: Math.max(5, (overlap.width / Math.max(1, width)) * 50),
      ry: Math.max(5, (overlap.height / Math.max(1, height)) * 50),
    };
  }

  function computeAgentPreviewOpaqueBounds(sourceCanvas) {
    const context = sourceCanvas.getContext('2d');
    const { width, height } = sourceCanvas;
    const { data } = context.getImageData(0, 0, width, height);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4 + 3;
        if (data[index] <= 0) {
          continue;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) {
      return { x: 0, y: 0, width, height };
    }
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX + 1),
      height: Math.max(1, maxY - minY + 1),
    };
  }

  function drawAgentPreviewNeutralBase(destinationContext, neutralSourceCanvas) {
    const baseCanvas = createAgentPreviewCanvas(neutralSourceCanvas.width, neutralSourceCanvas.height);
    const baseContext = baseCanvas.getContext('2d');
    baseContext.drawImage(neutralSourceCanvas, 0, 0);
    baseContext.globalCompositeOperation = 'source-in';
    baseContext.fillStyle = 'rgba(12, 18, 27, 0.96)';
    baseContext.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
    baseContext.globalCompositeOperation = 'source-over';

    const lineCanvas = createAgentPreviewCanvas(neutralSourceCanvas.width, neutralSourceCanvas.height);
    const lineContext = lineCanvas.getContext('2d');
    lineContext.drawImage(neutralSourceCanvas, 0, 0);
    const imageData = lineContext.getImageData(0, 0, lineCanvas.width, lineCanvas.height);
    const { data } = imageData;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index + 3] === 0) {
        continue;
      }
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      const chroma = Math.max(data[index], data[index + 1], data[index + 2]) - Math.min(data[index], data[index + 1], data[index + 2]);
      if (chroma >= 28 && brightness > 12) {
        data[index + 3] = 0;
        continue;
      }
      const neutral = brightness > 150 ? 242 : (brightness > 70 ? 188 : 112);
      data[index] = neutral;
      data[index + 1] = neutral;
      data[index + 2] = neutral;
      data[index + 3] = brightness > 150 ? 255 : Math.max(data[index + 3], 140);
    }
    lineContext.putImageData(imageData, 0, 0);

    destinationContext.drawImage(baseCanvas, 0, 0);
    destinationContext.drawImage(lineCanvas, 0, 0);
  }

  function drawAgentPreviewRegionFromSource(destinationContext, sourceCanvas, metadata, dimensionId) {
    const selectedComponents = getAgentPreviewSelectedComponentsForDimension(metadata, dimensionId);
    if (selectedComponents.length) {
      const regionMask = shouldApplyAgentPreviewSemanticMask(dimensionId)
        ? metadata.regionMasks?.[dimensionId]
        : null;
      const exactMaskCanvas = buildAgentPreviewRegionMaskCanvas(sourceCanvas, selectedComponents, regionMask, metadata.sourceSearchBox);
      const exactRegionCanvas = createAgentPreviewCanvas(sourceCanvas.width, sourceCanvas.height);
      const exactRegionContext = exactRegionCanvas.getContext('2d');
      exactRegionContext.drawImage(sourceCanvas, 0, 0);
      exactRegionContext.globalCompositeOperation = 'destination-in';
      exactRegionContext.drawImage(exactMaskCanvas, 0, 0);
      exactRegionContext.globalCompositeOperation = 'source-over';
      sourceCanvas = exactRegionCanvas;
      destinationContext.drawImage(sourceCanvas, 0, 0);
      return;
    }
    const regionMask = metadata.regionMasks?.[dimensionId];
    const overlap = getAgentPreviewComponentMaskOverlap(regionMask, metadata.sourceSearchBox);
    if (!regionMask || !overlap) {
      return;
    }
    destinationContext.save();
    destinationContext.beginPath();
    destinationContext.rect(overlap.x, overlap.y, overlap.width, overlap.height);
    destinationContext.clip();
    destinationContext.drawImage(sourceCanvas, 0, 0);
    destinationContext.restore();
  }

  function computeAgentPreviewPoseGeometryAnchorsFromCanvas(sourceCanvas, metadata) {
    return AGENT_PREVIEW_DIMENSION_ORDER.reduce((anchors, dimensionId) => {
      const regionMask = metadata?.regionMasks?.[dimensionId];
      const fallbackBounds = getAgentPreviewComponentMaskOverlap(regionMask, metadata?.sourceSearchBox || {
        width: sourceCanvas.width,
        height: sourceCanvas.height,
      });
      const selectedComponents = getAgentPreviewSelectedComponentsForDimension(metadata, dimensionId);
      anchors[dimensionId] = getAgentPreviewRegionCenterFromComponents(
        selectedComponents,
        fallbackBounds,
        sourceCanvas.width,
        sourceCanvas.height,
        shouldApplyAgentPreviewSemanticMask(dimensionId) ? regionMask : null,
        metadata?.sourceSearchBox || { width: sourceCanvas.width, height: sourceCanvas.height }
      );
      return anchors;
    }, {});
  }

  function getAgentPreviewPoseGeometryAnchors(safeScore) {
    if (agentPreviewPoseGeometryAnchorCache.has(safeScore)) {
      return agentPreviewPoseGeometryAnchorCache.get(safeScore);
    }
    if (state.agentModal.previewPoseMetadata?.score === safeScore && state.agentModal.previewPoseMetadata?.geometryAnchors) {
      agentPreviewPoseGeometryAnchorCache.set(safeScore, state.agentModal.previewPoseMetadata.geometryAnchors);
      return state.agentModal.previewPoseMetadata.geometryAnchors;
    }
    return AGENT_PREVIEW_POSE_METADATA[safeScore]?.connectorAnchors || {};
  }

  function getAgentPreviewDisplayFrame(opaqueBounds, score) {
    const safeScore = clamp(Math.round(Number(score || 0)), 1, 5);
    const safeReferenceScore = AGENT_PREVIEW_REFERENCE_DISPLAY_SCORE;
    const referenceFrame = AGENT_PREVIEW_POSE_CROP_FRAMES[safeReferenceScore] || AGENT_PREVIEW_POSE_CROP_FRAMES[4];
    const displayScale = Number(AGENT_PREVIEW_DISPLAY_SCALE_BY_SCORE[safeScore] || 1);
    const shift = AGENT_PREVIEW_DISPLAY_SHIFT_BY_SCORE[safeScore] || AGENT_PREVIEW_DISPLAY_SHIFT_BY_SCORE[3];
    const cropFrame = AGENT_PREVIEW_POSE_CROP_FRAMES[safeScore] || AGENT_PREVIEW_POSE_CROP_FRAMES[3];
    const opaqueHeight = Math.max(1, Number(opaqueBounds?.height || referenceFrame.height || 1));
    const baseScale = AGENT_PREVIEW_REFERENCE_OPAQUE_HEIGHT / opaqueHeight;
    const width = cropFrame.width * baseScale;
    const height = cropFrame.height * baseScale;
    const opaqueCenterX = Number(opaqueBounds?.x || 0) + Number(opaqueBounds?.width || 0) / 2;
    const opaqueCenterY = Number(opaqueBounds?.y || 0) + Number(opaqueBounds?.height || 0) / 2;
    const targetCenterX = AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_X + Number(shift.x || 0) * displayScale;
    const targetCenterY = AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_Y + Number(shift.y || 0);
    return {
      x: targetCenterX - opaqueCenterX * baseScale,
      y: targetCenterY - opaqueCenterY * baseScale,
      width,
      height,
    };
  }

  function computeAgentPreviewDisplayedOpaqueBounds(displayFrame, opaqueBounds, sourceCanvas) {
    const sourceWidth = Math.max(1, Number(sourceCanvas?.width || 1));
    const sourceHeight = Math.max(1, Number(sourceCanvas?.height || 1));
    const scaleX = Number(displayFrame?.width || 0) / sourceWidth;
    const scaleY = Number(displayFrame?.height || 0) / sourceHeight;
    return {
      x: Number(displayFrame?.x || 0) + Number(opaqueBounds?.x || 0) * scaleX,
      y: Number(displayFrame?.y || 0) + Number(opaqueBounds?.y || 0) * scaleY,
      width: Math.max(0, Number(opaqueBounds?.width || 0) * scaleX),
      height: Math.max(0, Number(opaqueBounds?.height || 0) * scaleY),
    };
  }

  async function composeAgentPreviewPoseImage(dimensionScores) {
    const safeScores = getEditableCapacityScores(dimensionScores);
    const safeScore = clamp(Math.round(Number(safeScores.locomotor || DEFAULT_CAPACITY_SCORES.locomotor)), 1, 5);
    const poseMetadata = AGENT_PREVIEW_POSE_METADATA[safeScore] || AGENT_PREVIEW_POSE_METADATA[3];
    const neutralSourceImage = await loadAgentPreviewSourceImage(safeScore);
    const neutralSourceCanvas = cropAgentPreviewPoseCanvas(neutralSourceImage, safeScore);
    const referenceSourceImage = await loadAgentPreviewSourceImage(AGENT_PREVIEW_REFERENCE_DISPLAY_SCORE);
    const referenceSourceCanvas = cropAgentPreviewPoseCanvas(referenceSourceImage, safeScore);
    const chromaticComponents = extractAgentPreviewChromaticComponents(referenceSourceCanvas, `pose:${safeScore}`);
    const geometryAnchors = getAgentPreviewPoseGeometryAnchors(safeScore);
    const metadata = {
      ...poseMetadata,
      score: safeScore,
      sourceSearchBox: {
        x: 0,
        y: 0,
        width: neutralSourceCanvas.width,
        height: neutralSourceCanvas.height,
      },
      chromaticComponents,
      geometryAnchors,
    };
    const opaqueBounds = computeAgentPreviewOpaqueBounds(neutralSourceCanvas);
    const baseCanvas = createAgentPreviewCanvas(neutralSourceCanvas.width, neutralSourceCanvas.height);
    const baseContext = baseCanvas.getContext('2d');
    drawAgentPreviewNeutralBase(baseContext, neutralSourceCanvas);

    const overlayCanvas = createAgentPreviewCanvas(neutralSourceCanvas.width, neutralSourceCanvas.height);
    const overlayContext = overlayCanvas.getContext('2d');
    for (const dimensionId of AGENT_PREVIEW_DIMENSION_ORDER) {
      const sourceScore = safeScores[dimensionId];
      const sourceImage = await loadAgentPreviewSourceImage(sourceScore);
      const sourceCanvas = cropAgentPreviewPoseCanvas(sourceImage, safeScore);
      drawAgentPreviewRegionFromSource(overlayContext, sourceCanvas, metadata, dimensionId);
    }

    const composedCanvas = createAgentPreviewCanvas(neutralSourceCanvas.width, neutralSourceCanvas.height);
    const composedContext = composedCanvas.getContext('2d');
    drawAgentPreviewNeutralBase(composedContext, neutralSourceCanvas);
    composedContext.drawImage(overlayCanvas, 0, 0);

    const computedGeometryAnchors = computeAgentPreviewPoseGeometryAnchorsFromCanvas(referenceSourceCanvas, metadata);
    agentPreviewPoseGeometryAnchorCache.set(safeScore, computedGeometryAnchors);
    const displayFrame = getAgentPreviewDisplayFrame(opaqueBounds, safeScore);
    const displayedOpaqueBounds = computeAgentPreviewDisplayedOpaqueBounds(
      displayFrame,
      opaqueBounds,
      neutralSourceCanvas
    );
    const connectorAnchors = AGENT_PREVIEW_DIMENSION_ORDER.reduce((anchors, dimensionId) => {
      const manualAnchor = poseMetadata.connectorAnchors?.[dimensionId];
      const derivedAnchor = computedGeometryAnchors?.[dimensionId];
      const rawAnchorX = Number(manualAnchor?.x ?? derivedAnchor?.x ?? 50);
      const rawAnchorY = Number(manualAnchor?.y ?? derivedAnchor?.y ?? 50);
      anchors[dimensionId] = {
        x: displayFrame.x + (rawAnchorX / 100) * displayFrame.width,
        y: displayFrame.y + (rawAnchorY / 100) * displayFrame.height,
      };
      return anchors;
    }, {});
    const displayRegions = AGENT_PREVIEW_DIMENSION_ORDER.reduce((regions, dimensionId) => {
      const region = computedGeometryAnchors?.[dimensionId] || { x: 50, y: 50, rx: 10, ry: 10 };
      regions[dimensionId] = {
        x: displayFrame.x + (Number(region.x || 50) / 100) * displayFrame.width,
        y: displayFrame.y + (Number(region.y || 50) / 100) * displayFrame.height,
        rx: Math.max(2.8, (Number(region.rx || 10) / 100) * displayFrame.width * 0.72),
        ry: Math.max(2.8, (Number(region.ry || 10) / 100) * displayFrame.height * 0.72),
      };
      return regions;
    }, {});
    return {
      score: safeScore,
      cacheKey: getSettingsAgentPreviewCacheKey(safeScores),
      baseDataUrl: baseCanvas.toDataURL('image/png'),
      overlayDataUrl: overlayCanvas.toDataURL('image/png'),
      dataUrl: composedCanvas.toDataURL('image/png'),
      displayFrame,
      displayedOpaqueBounds,
      opaqueBounds,
      connectorAnchors,
      geometryAnchors: computedGeometryAnchors,
      displayRegions,
      chromaticComponents,
      regionMasks: metadata.regionMasks,
      sourceSearchBox: metadata.sourceSearchBox,
      dimensionScores: safeScores,
    };
  }

  function queueSettingsAgentPreviewComposition(dimensionScores) {
    const cacheKey = getSettingsAgentPreviewCacheKey(dimensionScores);
    if (state.agentModal.previewPosePendingKey === cacheKey) {
      return;
    }
    state.agentModal.previewPosePendingKey = cacheKey;
    composeAgentPreviewPoseImage(dimensionScores)
      .then((previewData) => {
        if (state.agentModal.previewPosePendingKey !== cacheKey) {
          return;
        }
        state.agentModal.previewPoseCacheKey = cacheKey;
        state.agentModal.previewPoseDataUrl = previewData.dataUrl;
        state.agentModal.previewPoseBaseDataUrl = previewData.baseDataUrl;
        state.agentModal.previewPoseOverlayDataUrl = previewData.overlayDataUrl;
        state.agentModal.previewPoseMetadata = previewData;
        state.agentModal.previewPosePendingKey = '';
        requestRender();
      })
      .catch(() => {
        if (state.agentModal.previewPosePendingKey === cacheKey) {
          state.agentModal.previewPosePendingKey = '';
        }
      });
  }

  function getSettingsAgentPreviewFigureImageUrl(dimensionScores) {
    const cacheKey = getSettingsAgentPreviewCacheKey(dimensionScores);
    if (state.agentModal.previewPoseDataUrl && state.agentModal.previewPoseCacheKey === cacheKey) {
      return state.agentModal.previewPoseDataUrl;
    }
    queueSettingsAgentPreviewComposition(dimensionScores);
    return '';
  }

  function getSettingsAgentPreviewPoseData(dimensionScores) {
    const cacheKey = getSettingsAgentPreviewCacheKey(dimensionScores);
    if (state.agentModal.previewPoseMetadata && state.agentModal.previewPoseCacheKey === cacheKey) {
      return state.agentModal.previewPoseMetadata;
    }
    getSettingsAgentPreviewFigureImageUrl(dimensionScores);
    return null;
  }

  function buildSettingsAgentPreviewFigureMarkup(previewData, activeDimensionId) {
    if (!previewData?.baseDataUrl || !previewData?.overlayDataUrl) {
      return '';
    }
    const imageX = Number(previewData.displayFrame?.x || 0).toFixed(2);
    const imageY = Number(previewData.displayFrame?.y || 0).toFixed(2);
    const imageWidth = Number(previewData.displayFrame?.width || 0).toFixed(2);
    const imageHeight = Number(previewData.displayFrame?.height || 0).toFixed(2);
    return `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <image class="settings-agent-preview__figure-image" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" href="${previewData.baseDataUrl}" preserveAspectRatio="xMidYMid meet"></image>
        <image class="settings-agent-preview__region-fill is-active" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" href="${previewData.overlayDataUrl}" preserveAspectRatio="xMidYMid meet"></image>
      </svg>
    `;
  }

  function projectAgentPreviewSvgPointToPanel(svgElement, panelRect, x, y) {
    if (!svgElement || !panelRect || typeof svgElement.getScreenCTM !== 'function') {
      return null;
    }
    const matrix = svgElement.getScreenCTM();
    if (!matrix) {
      return null;
    }
    if (typeof DOMPoint === 'function') {
      const point = new DOMPoint(x, y).matrixTransform(matrix);
      return {
        x: point.x - panelRect.left,
        y: point.y - panelRect.top,
      };
    }
    if (typeof svgElement.createSVGPoint === 'function') {
      const point = svgElement.createSVGPoint();
      point.x = x;
      point.y = y;
      const projectedPoint = point.matrixTransform(matrix);
      return {
        x: projectedPoint.x - panelRect.left,
        y: projectedPoint.y - panelRect.top,
      };
    }
    return null;
  }

  function renderSettingsAgentPreviewConnectors(previewData, activeDimensionId) {
    if (!elements.settingsAgentConnectorLayer || !elements.settingsAgentVisualPanel || !elements.settingsAgentFigureStage) {
      return;
    }
    if (!previewData) {
      elements.settingsAgentConnectorLayer.innerHTML = '';
      return;
    }
    const figureRect = elements.settingsAgentFigureStage.getBoundingClientRect();
    const connectorLayerRect = elements.settingsAgentConnectorLayer.getBoundingClientRect();
    const figureSvg = elements.settingsAgentFigureStage.querySelector('svg');
    if (!connectorLayerRect.width || !connectorLayerRect.height || !figureRect.width || !figureRect.height) {
      elements.settingsAgentConnectorLayer.innerHTML = '';
      return;
    }
    elements.settingsAgentConnectorLayer.setAttribute('viewBox', `0 0 ${connectorLayerRect.width.toFixed(2)} ${connectorLayerRect.height.toFixed(2)}`);
    elements.settingsAgentConnectorLayer.setAttribute('preserveAspectRatio', 'none');
    const scoreStartShift = AGENT_PREVIEW_CONNECTOR_START_SHIFT_BY_SCORE_AND_DIMENSION[previewData.score] || {};
    const connectorMarkup = AGENT_PREVIEW_DIMENSION_ORDER.map((dimensionId) => {
      const card = elements.settingsDimensionList?.querySelector(`[data-radar-dimension="${dimensionId}"]`);
      if (!card) {
        return '';
      }
      const cardRect = card.getBoundingClientRect();
      const anchor = previewData.displayRegions?.[dimensionId] || previewData.connectorAnchors?.[dimensionId] || previewData.geometryAnchors?.[dimensionId] || { x: 50, y: 50 };
      const startAnchorX = Number(anchor?.x || 50);
      const startAnchorY = Number(anchor?.y || 50);
      const projectedStart = projectAgentPreviewSvgPointToPanel(figureSvg, connectorLayerRect, startAnchorX, startAnchorY);
      const fallbackStartX = figureRect.left - connectorLayerRect.left + (startAnchorX / 100) * figureRect.width;
      const fallbackStartY = figureRect.top - connectorLayerRect.top + (startAnchorY / 100) * figureRect.height;
      const startOffsetX = Number(scoreStartShift[dimensionId] || 0);
      const startX = (Number.isFinite(projectedStart?.x) ? projectedStart.x : fallbackStartX) + startOffsetX;
      const startY = Number.isFinite(projectedStart?.y) ? projectedStart.y : fallbackStartY;
      const endX = cardRect.left - connectorLayerRect.left + AGENT_PREVIEW_CONNECTOR_END_SHIFT_PX;
      const endY = cardRect.top - connectorLayerRect.top + cardRect.height / 2;
      const midX = startX + (endX - startX) * 0.56;
      const controlEndX = startX + (endX - startX) * 0.88;
      const path = `M ${startX.toFixed(2)} ${startY.toFixed(2)} C ${midX.toFixed(2)} ${startY.toFixed(2)}, ${controlEndX.toFixed(2)} ${endY.toFixed(2)}, ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      const activeClass = dimensionId === activeDimensionId ? ' is-active' : '';
      const color = getAgentPreviewScoreColor(previewData.dimensionScores?.[dimensionId]);
      return `
        <path class="settings-agent-preview__connector-line${activeClass}" style="--connector-accent:${color}" d="${path}"></path>
        <circle class="settings-agent-preview__connector-dot${activeClass}" style="--connector-accent:${color}" cx="${startX.toFixed(2)}" cy="${startY.toFixed(2)}" r="3.2"></circle>
      `;
    }).join('');
    elements.settingsAgentConnectorLayer.innerHTML = connectorMarkup;
  }

  function renderSettingsAgentVisualPreview(dimensionScores, locale = state.locale) {
    if (!elements.settingsAgentFigureStage || !elements.settingsDimensionList) {
      return;
    }
    const activeDimensionId = getAgentRadarActiveDimensionId();
    const figureImageUrl = getSettingsAgentPreviewFigureImageUrl(dimensionScores);
    const previewData = getSettingsAgentPreviewPoseData(dimensionScores);
    if (figureImageUrl && previewData) {
      elements.settingsAgentFigureStage.innerHTML = buildSettingsAgentPreviewFigureMarkup(previewData, activeDimensionId);
    } else {
      elements.settingsAgentFigureStage.innerHTML = '';
    }
    elements.settingsDimensionList.innerHTML = AGENT_PREVIEW_DIMENSION_ORDER.map((id) => {
      const color = getAgentPreviewScoreColor(dimensionScores[id]);
      return `
        <article class="settings-agent-preview__card${id === activeDimensionId ? ' is-active' : ''}" data-radar-dimension="${escapeHtml(id)}" style="--preview-accent:${color}">
          <div class="settings-agent-preview__card-head">
            <div class="settings-agent-preview__card-title">${escapeHtml(getDimensionCapacityLabel(id, locale))}</div>
            <div class="settings-agent-preview__card-score">${escapeHtml(formatAgentRadarScore(dimensionScores[id], locale))}</div>
          </div>
          <p class="settings-agent-preview__card-description">${escapeHtml(getDimensionAgentSettingDescription(id, dimensionScores[id], state.locale) || getDimensionOverviewDescription(id, state.locale))}</p>
        </article>
      `;
    }).join('');
    renderSettingsAgentPreviewConnectors(previewData, activeDimensionId);
  }

  function buildAgentRadarSvg(draft = state.agentModal.draft, locale = state.locale, options = {}) {
    const scores = getEditableCapacityScores(draft?.capacityScores);
    const layout = {
      ...getAgentRadarLayout(),
      ...(options.layout || {}),
    };
    const activeDimensionId = getAgentRadarActiveDimensionId();
    const getLabel = typeof options.getLabel === 'function' ? options.getLabel : getDimensionCapacityLabel;
    const getTextPlacement = typeof options.getTextPlacement === 'function'
      ? options.getTextPlacement
      : (id, nextLocale) => getAgentRadarTextPlacement(id, nextLocale);
    const currentPoints = FIVE_DIMENSION_ORDER.map((id, index) => {
      const score = clamp(Math.round(Number(scores?.[id] || DEFAULT_CAPACITY_SCORES[id])), 1, 5);
      const textPlacement = getTextPlacement(id, locale);
      const textBasePoint = getAgentRadarTextPoint(
        index,
        layout.labelRadius,
        layout,
        textPlacement.inwardOffset,
        textPlacement.lateralOffset
      );
      const lineAnchorPoint = getAgentRadarTextPoint(
        index,
        layout.labelRadius,
        layout,
        Number.isFinite(Number(textPlacement.lineInwardOffset))
          ? Number(textPlacement.lineInwardOffset)
          : textPlacement.inwardOffset,
        Number.isFinite(Number(textPlacement.lineLateralOffset))
          ? Number(textPlacement.lineLateralOffset)
          : 0
      );
      return {
        id,
        index,
        score,
        point: getAgentRadarPoint(index, layout.radius * (score / 5), layout),
        labelTextPoint: {
          x: textBasePoint.x + textPlacement.x,
          y: textBasePoint.y + textPlacement.labelY,
        },
        scoreTextPoint: {
          x: textBasePoint.x + textPlacement.x,
          y: textBasePoint.y + textPlacement.scoreY,
        },
        lineEndPoint: {
          x: lineAnchorPoint.x,
          y: lineAnchorPoint.y,
        },
      };
    });
    const gridMarkup = Array.from({ length: 5 }, (_, levelIndex) => {
      const level = levelIndex + 1;
      const points = FIVE_DIMENSION_ORDER.map((id, index) => {
        const point = getAgentRadarPoint(index, layout.radius * (level / 5), layout);
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      }).join(' ');
      return `<polygon class="agent-radar-grid" points="${points}"></polygon>`;
    }).join('');
    const ringLabels = Array.from({ length: 5 }, (_, levelIndex) => {
      const level = levelIndex + 1;
      const point = getAgentRadarPoint(0, layout.radius * (level / 5), layout);
      return `
        <text class="agent-radar-ring-label" x="${(point.x + 10).toFixed(2)}" y="${(point.y + 4).toFixed(2)}">${level}</text>
      `;
    }).join('');
    const polygonPoints = currentPoints
      .map(({ point }) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');
    const showHitTargets = options.showHitTargets !== false;
    const hitRadius = Math.max(0, Number(options.hitRadius ?? 17));
    const activeHitRadius = Math.max(hitRadius, Number(options.activeHitRadius ?? 19));
    const handleRadius = Math.max(0.1, Number(options.handleRadius ?? 8));
    const activeHandleRadius = Math.max(0.1, Number(options.activeHandleRadius ?? 9));
    const axisMarkup = currentPoints.map(({ id, score, point, labelTextPoint, scoreTextPoint, lineEndPoint }) => {
      const activeClass = id === activeDimensionId ? ' is-active' : '';
      const handleColor = getAgentPreviewScoreColor(score);
      const hitMarkup = showHitTargets
        ? `<circle class="agent-radar-hit" data-radar-dimension="${escapeHtml(id)}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${id === activeDimensionId ? activeHitRadius : hitRadius}"></circle>`
        : '';
      return `
        <line class="agent-radar-axis" x1="${layout.centerX}" y1="${layout.centerY}" x2="${lineEndPoint.x.toFixed(2)}" y2="${lineEndPoint.y.toFixed(2)}"></line>
        <text class="agent-radar-label" x="${labelTextPoint.x.toFixed(2)}" y="${labelTextPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(getLabel(id, locale))}</text>
        <text class="agent-radar-score" x="${scoreTextPoint.x.toFixed(2)}" y="${scoreTextPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(formatAgentRadarScore(score, locale))}</text>
        ${hitMarkup}
        <circle class="agent-radar-handle${activeClass}" data-radar-dimension="${escapeHtml(id)}" style="--radar-handle-fill:${escapeHtml(handleColor)}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${id === activeDimensionId ? activeHandleRadius : handleRadius}"></circle>
      `;
    }).join('');
    return `
      <svg viewBox="0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}" aria-hidden="true">
        <g>
          ${gridMarkup}
          ${ringLabels}
          <polygon class="agent-radar-shape" points="${polygonPoints}"></polygon>
          ${axisMarkup}
        </g>
      </svg>
    `;
  }

  function renderAgentBehaviorPanel(draft = state.agentModal.draft, locale = state.locale) {
    if (!elements.agentBehaviorPanel) {
      return;
    }
    const scores = getEditableCapacityScores(draft?.capacityScores);
    const activeDimensionId = getAgentRadarActiveDimensionId();
    elements.agentBehaviorPanel.innerHTML = FIVE_DIMENSION_ORDER.map((id) => {
      const score = clamp(Math.round(Number(scores?.[id] || DEFAULT_CAPACITY_SCORES[id])), 1, 5);
      return `
        <article class="agent-behavior-card${id === activeDimensionId ? ' active' : ''}" data-radar-dimension="${escapeHtml(id)}">
          <div class="agent-behavior-card-head">
            <div class="agent-behavior-card-title">${escapeHtml(getDimensionCapacityLabel(id, locale))}</div>
            <div class="agent-behavior-score">${escapeHtml(formatCapacityScoreLabel(id, score, locale))}</div>
          </div>
          <div class="agent-behavior-description">${escapeHtml(getDimensionAgentSettingDescription(id, score, locale))}</div>
        </article>
      `;
    }).join('');
  }

  function updateAgentRadarScore(id, score) {
    if (!FIVE_DIMENSION_ORDER.includes(id)) {
      return;
    }
    const normalizedCurrent = getEditableCapacityScores(state.agentModal.draft?.capacityScores);
    const nextScore = clamp(Math.round(Number(score || normalizedCurrent[id])), 1, 5);
    state.agentModal.activeDimensionId = id;
    state.agentModal.draft = createAgentDraft({
      ...state.agentModal.draft,
      capacityScores: {
        ...normalizedCurrent,
        [id]: nextScore,
      },
    });
    applyAgentDraftToInputs(state.agentModal.draft);
    requestRender();
  }

  function getAgentRadarLocalPoint(event) {
    const svg = elements.agentCapacityRadar?.querySelector('svg');
    if (!svg) {
      return null;
    }
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const viewBox = svg.viewBox?.baseVal;
    const width = Number(viewBox?.width || 400);
    const height = Number(viewBox?.height || 400);
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    return {
      x: (offsetX / rect.width) * width,
      y: (offsetY / rect.height) * height,
    };
  }

  function getAgentRadarScoreFromPoint(id, point) {
    const index = FIVE_DIMENSION_ORDER.indexOf(id);
    if (index < 0 || !point) {
      return DEFAULT_CAPACITY_SCORES[id] || 3;
    }
    const layout = getAgentRadarLayout();
    const angle = getAgentRadarAngle(index);
    const dx = point.x - layout.centerX;
    const dy = point.y - layout.centerY;
    const projection = dx * Math.cos(angle) + dy * Math.sin(angle);
    const ratio = clamp(projection / layout.radius, layout.minScoreRatio, 1);
    return clamp(Math.round(ratio * 5), 1, 5);
  }

  function handleAgentRadarPointerDown(event) {
    const target = event.target.closest('[data-radar-dimension]');
    if (!target || !elements.agentCapacityRadar?.contains(target)) {
      return;
    }
    const id = target.dataset.radarDimension;
    if (!FIVE_DIMENSION_ORDER.includes(id)) {
      return;
    }
    event.preventDefault();
    state.agentModal.pointerId = event.pointerId;
    if (typeof elements.agentCapacityRadar.setPointerCapture === 'function') {
      try {
        elements.agentCapacityRadar.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some browsers reject pointer capture when the pointer is already detached.
      }
    }
    state.agentModal.activeDimensionId = id;
    const point = getAgentRadarLocalPoint(event);
    if (point) {
      updateAgentRadarScore(id, getAgentRadarScoreFromPoint(id, point));
    } else {
      requestRender();
    }
  }

  function handleAgentRadarPointerMove(event) {
    if (state.agentModal.pointerId !== event.pointerId) {
      return;
    }
    const id = getAgentRadarActiveDimensionId();
    const point = getAgentRadarLocalPoint(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    updateAgentRadarScore(id, getAgentRadarScoreFromPoint(id, point));
  }

  function handleAgentRadarPointerEnd(event) {
    if (state.agentModal.pointerId === null) {
      return;
    }
    if (event.pointerId !== undefined && state.agentModal.pointerId !== event.pointerId) {
      return;
    }
    if (
      event.pointerId !== undefined
      && typeof elements.agentCapacityRadar?.hasPointerCapture === 'function'
      && elements.agentCapacityRadar.hasPointerCapture(event.pointerId)
    ) {
      elements.agentCapacityRadar.releasePointerCapture(event.pointerId);
    }
    state.agentModal.pointerId = null;
  }

  function handleAgentBehaviorPanelClick(event) {
    const card = event.target.closest('[data-radar-dimension]');
    if (!card || !elements.agentBehaviorPanel?.contains(card)) {
      return;
    }
    const id = card.dataset.radarDimension;
    if (!FIVE_DIMENSION_ORDER.includes(id)) {
      return;
    }
    state.agentModal.activeDimensionId = id;
    requestRender();
  }

  function renderAgentModal() {
    elements.agentModal.classList.toggle('hidden', !state.agentModal.open);
    applyAgentDraftToInputs(state.agentModal.draft);
    if (elements.agentCapacityRadar) {
      elements.agentCapacityRadar.innerHTML = buildAgentRadarSvg(state.agentModal.draft, state.locale);
    }
    renderAgentBehaviorPanel(state.agentModal.draft, state.locale);
  }

  function getShellLocaleToggleLabel(locale = state.locale) {
    return locale === 'en' ? '中文' : 'EN';
  }

  function showUiScreen(screen) {
    state.uiScreen = screen;
    requestRender();
  }

  function handleLandingStart() {
    if (state.uiScreen !== 'landing' || state.landingTransitioning) {
      return;
    }
    state.landingTransitioning = true;
    if (state.landingTransitionTimer) {
      window.clearTimeout(state.landingTransitionTimer);
    }
    elements.landingScreen?.classList.add('is-exiting');
    state.landingTransitionTimer = window.setTimeout(() => {
      state.landingTransitioning = false;
      state.landingTransitionTimer = null;
      elements.landingScreen?.classList.remove('is-exiting');
      showUiScreen('settings');
    }, 420);
    requestRender();
  }

  function handleSettingsBack() {
    if (state.landingTransitionTimer) {
      window.clearTimeout(state.landingTransitionTimer);
      state.landingTransitionTimer = null;
    }
    state.landingTransitioning = false;
    elements.landingScreen?.classList.remove('is-exiting');
    closeRouteModal();
    showUiScreen('landing');
  }

  function openSpatialEditor() {
    closeRouteModal();
    showUiScreen('spatial-editor');
  }

  function closeSpatialEditor() {
    state.spatialEditor.drag = null;
    showUiScreen('settings');
  }

  function setSpatialEditorTool(tool) {
    state.spatialEditor.activeTool = tool || 'select';
    state.spatialEditor.statusKey = 'spatialEditor.statusIdle';
    requestRender();
  }

  function getSpatialEditorSvgPoint(event) {
    const svg = elements.spatialEditorMap;
    if (!svg) {
      return null;
    }
    if (typeof svg.createSVGPoint === 'function' && svg.getScreenCTM()) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const transformed = point.matrixTransform(svg.getScreenCTM().inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1000,
      y: ((event.clientY - rect.top) / rect.height) * 560,
    };
  }

  function updateSpatialEditorObjectPosition(object, x, y) {
    if (!object) {
      return;
    }
    const safeX = clamp(safeNumber(x, 0), 40, 960);
    const safeY = clamp(safeNumber(y, 0), 40, 520);
    object.dataset.x = String(Number(safeX.toFixed(1)));
    object.dataset.y = String(Number(safeY.toFixed(1)));
    const shape = object.querySelector('[data-editor-shape]');
    if (shape) {
      shape.setAttribute('cx', String(Number(safeX.toFixed(1))));
      shape.setAttribute('cy', String(Number(safeY.toFixed(1))));
    }
    const label = object.querySelector('[data-editor-label]');
    if (label) {
      label.setAttribute('x', String(Number((safeX + 20).toFixed(1))));
      label.setAttribute('y', String(Number((safeY - 6).toFixed(1))));
    }
    state.spatialEditor.selectedX = safeX;
    state.spatialEditor.selectedY = safeY;
  }

  function selectSpatialEditorObject(object) {
    if (!object) {
      return;
    }
    elements.spatialEditorMap?.querySelectorAll('.spatial-editor-object').forEach((item) => {
      item.classList.toggle('active', item === object);
    });
    state.spatialEditor.selectedObjectName = object.dataset.spatialEditorObject || '--';
    state.spatialEditor.selectedObjectType = object.dataset.objectType || '--';
    state.spatialEditor.selectedX = safeNumber(object.dataset.x, 0);
    state.spatialEditor.selectedY = safeNumber(object.dataset.y, 0);
    requestRender();
  }

  function handleSpatialEditorMapPointerDown(event) {
    const object = event.target.closest?.('.spatial-editor-object');
    if (!object || !elements.spatialEditorMap?.contains(object)) {
      return;
    }
    event.preventDefault();
    selectSpatialEditorObject(object);
    const point = getSpatialEditorSvgPoint(event);
    if (!point) {
      return;
    }
    const objectX = safeNumber(object.dataset.x, point.x);
    const objectY = safeNumber(object.dataset.y, point.y);
    state.spatialEditor.drag = {
      object,
      pointerId: event.pointerId,
      offsetX: point.x - objectX,
      offsetY: point.y - objectY,
    };
    if (typeof elements.spatialEditorMap.setPointerCapture === 'function') {
      try {
        elements.spatialEditorMap.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore pointer capture failures in static prototype mode.
      }
    }
  }

  function handleSpatialEditorMapPointerMove(event) {
    const drag = state.spatialEditor.drag;
    if (!drag || (event.pointerId !== undefined && drag.pointerId !== event.pointerId)) {
      return;
    }
    const point = getSpatialEditorSvgPoint(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    updateSpatialEditorObjectPosition(drag.object, point.x - drag.offsetX, point.y - drag.offsetY);
    requestRender();
  }

  function handleSpatialEditorMapPointerEnd(event) {
    const drag = state.spatialEditor.drag;
    if (!drag) {
      return;
    }
    if (event.pointerId !== undefined && drag.pointerId !== event.pointerId) {
      return;
    }
    if (
      event.pointerId !== undefined
      && typeof elements.spatialEditorMap?.hasPointerCapture === 'function'
      && elements.spatialEditorMap.hasPointerCapture(event.pointerId)
    ) {
      elements.spatialEditorMap.releasePointerCapture(event.pointerId);
    }
    state.spatialEditor.drag = null;
    state.spatialEditor.statusKey = 'spatialEditor.statusIdle';
    requestRender();
  }

  function handleSpatialEditorAction(action) {
    const statusMap = {
      save: 'spatialEditor.statusSave',
      saveAs: 'spatialEditor.statusSaveAs',
      history: 'spatialEditor.statusHistory',
      openHeatmap: 'spatialEditor.statusOpenHeatmap',
      copyScheme: 'spatialEditor.statusCopyScheme',
      simulate: 'spatialEditor.statusSimulate',
      undo: 'spatialEditor.statusUndo',
      reset: 'spatialEditor.statusReset',
    };
    if (action === 'reset') {
      const defaults = {
        'Boundary Control P1': [126, 154],
        'Boundary Control P2': [878, 202],
        'Gate Node A': [204, 374],
        'Transfer Node B': [512, 282],
        'Platform Node C': [802, 184],
        'Noise Pressure Point': [396, 220],
        'Advertising Pressure Point': [650, 350],
      };
      elements.spatialEditorMap?.querySelectorAll('.spatial-editor-object').forEach((object) => {
        const position = defaults[object.dataset.spatialEditorObject];
        if (position) {
          updateSpatialEditorObjectPosition(object, position[0], position[1]);
        }
      });
    }
    state.spatialEditor.statusKey = statusMap[action] || 'spatialEditor.statusIdle';
    requestRender();
  }

  function renderSpatialEditorScreen() {
    renderSpatialEditorRouteMap();
    const editor = state.spatialEditor;
    elements.spatialEditorToolButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.spatialEditorTool === editor.activeTool);
    });
    if (elements.spatialEditorObjectName) {
      elements.spatialEditorObjectName.textContent = editor.selectedObjectName || '--';
    }
    if (elements.spatialEditorObjectCoord) {
      elements.spatialEditorObjectCoord.textContent = `x ${Math.round(safeNumber(editor.selectedX, 0))} · y ${Math.round(safeNumber(editor.selectedY, 0))}`;
    }
    if (elements.spatialEditorObjectType) {
      elements.spatialEditorObjectType.textContent = editor.selectedObjectType || '--';
    }
    if (elements.spatialEditorStatus) {
      elements.spatialEditorStatus.textContent = t(editor.statusKey || 'spatialEditor.statusIdle');
    }
  }

  function handleVisualizationBack() {
    closeRouteModal();
    if (state.visualizationDetailView) {
      closeVisualizationDetailView();
      return;
    }
    showUiScreen('settings');
  }

  async function handleSettingsStartAnalysis() {
    if (
      !state.prepared
      || !state.routeSelection.startPoint
      || !state.routeSelection.targetRegionId
      || state.analysisTransitioning
      || state.heatmapComputing
    ) {
      requestRender();
      return;
    }
    state.analysisTransitioning = true;
    state.heatmapComputeProgress = 0;
    closeRouteModal();
    showUiScreen('analysis-loading');
    requestRender();
    await new Promise((resolve) => window.setTimeout(resolve, 40));
    try {
      state.focusProfile = createFocusProfile(state.agentModal.draft);
      handleGenerateCrowd();
      advanceHeatmapComputeProgress(0.06);
      requestRender();
      const heatmapReady = await handleRunHeatmap();
      if (heatmapReady && state.scenario?.heatActive) {
        state.viewMode = COMPOSITE_BURDEN_VIEW;
        showUiScreen('workspace');
      }
    } finally {
      state.analysisTransitioning = false;
      requestRender();
    }
  }

  function handleShellLocaleToggle() {
    applyLocale(state.locale === 'en' ? 'zh-CN' : 'en');
  }

  function getSettingsRadarLocalPoint(event) {
    const svg = elements.settingsCapacityRadar?.querySelector('svg');
    if (!svg) {
      return null;
    }
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const viewBox = svg.viewBox?.baseVal;
    const width = Number(viewBox?.width || 400);
    const height = Number(viewBox?.height || 400);
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  function handleSettingsRadarPointerDown(event) {
    const target = event.target.closest('[data-radar-dimension]');
    if (!target || !elements.settingsCapacityRadar?.contains(target)) {
      return;
    }
    const id = target.dataset.radarDimension;
    if (!FIVE_DIMENSION_ORDER.includes(id)) {
      return;
    }
    event.preventDefault();
    state.settingsRadarPointerId = event.pointerId;
    if (typeof elements.settingsCapacityRadar.setPointerCapture === 'function') {
      try {
        elements.settingsCapacityRadar.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore detached-pointer capture failures.
      }
    }
    state.agentModal.activeDimensionId = id;
    const point = getSettingsRadarLocalPoint(event);
    if (point) {
      updateAgentRadarScore(id, getAgentRadarScoreFromPoint(id, point));
    } else {
      requestRender();
    }
  }

  function handleSettingsRadarPointerMove(event) {
    if (state.settingsRadarPointerId !== event.pointerId) {
      return;
    }
    const point = getSettingsRadarLocalPoint(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    updateAgentRadarScore(getAgentRadarActiveDimensionId(), getAgentRadarScoreFromPoint(getAgentRadarActiveDimensionId(), point));
  }

  function handleSettingsRadarPointerEnd(event) {
    if (state.settingsRadarPointerId === null) {
      return;
    }
    if (event.pointerId !== undefined && state.settingsRadarPointerId !== event.pointerId) {
      return;
    }
    if (
      event.pointerId !== undefined
      && typeof elements.settingsCapacityRadar?.hasPointerCapture === 'function'
      && elements.settingsCapacityRadar.hasPointerCapture(event.pointerId)
    ) {
      elements.settingsCapacityRadar.releasePointerCapture(event.pointerId);
    }
    state.settingsRadarPointerId = null;
  }

  function handleSettingsDimensionListClick(event) {
    const card = event.target.closest('[data-radar-dimension]');
    if (!card || !elements.settingsDimensionList?.contains(card)) {
      return;
    }
    const id = card.dataset.radarDimension;
    if (!FIVE_DIMENSION_ORDER.includes(id)) {
      return;
    }
    state.agentModal.activeDimensionId = id;
    requestRender();
  }

  function renderSettingsScreen() {
    const showLanding = state.uiScreen === 'landing';
    const showSettings = state.uiScreen === 'settings';
    const showSpatialEditor = state.uiScreen === 'spatial-editor';
    const showAgentSettings = state.uiScreen === 'agent-settings';
    const showLoading = state.uiScreen === 'analysis-loading';
    const showWorkspace = state.uiScreen === 'workspace';
    if (elements.landingScreen) {
      elements.landingScreen.classList.toggle('hidden', !showLanding);
      elements.landingScreen.classList.toggle('is-exiting', state.landingTransitioning);
    }
    if (elements.settingsScreen) {
      elements.settingsScreen.classList.toggle('hidden', !showSettings);
    }
    if (elements.spatialEditorScreen) {
      elements.spatialEditorScreen.classList.toggle('hidden', !showSpatialEditor);
    }
    if (elements.agentSettingsScreen) {
      elements.agentSettingsScreen.classList.toggle('hidden', !showAgentSettings);
    }
    if (elements.analysisLoadingScreen) {
      elements.analysisLoadingScreen.classList.toggle('hidden', !showLoading);
    }
    if (elements.legacyAppShell) {
      elements.legacyAppShell.classList.toggle('hidden', !showWorkspace);
    }
    if (elements.screenLocaleToggle) {
      elements.screenLocaleToggle.classList.remove('hidden');
      elements.screenLocaleToggle.textContent = getShellLocaleToggleLabel();
    }
    if (elements.analysisLoadingDescription) {
      elements.analysisLoadingDescription.textContent = t('loading.description');
    }
    if (showSpatialEditor) {
      renderSpatialEditorScreen();
    }
    if (elements.analysisLoadingStatus) {
      elements.analysisLoadingStatus.textContent = state.heatmapComputing
        ? getHeatmapComputeStatusText()
        : (state.analysisTransitioning ? t('loading.statusReady') : t('loading.statusDone'));
    }
    if (!showSettings && !showAgentSettings) {
      return;
    }
    if (showSettings) {
      renderSettingsDestinationMenu();
      renderSettingsRouteMap();
    }
    if (elements.settingsCapacityRadar) {
      elements.settingsCapacityRadar.innerHTML = buildAgentRadarSvg(state.agentModal.draft, state.locale, {
        getLabel: getDimensionDisplayName,
      });
    }
    const dimensionScores = getEditableCapacityScores(state.agentModal.draft?.capacityScores);
    renderSettingsAgentVisualPreview(dimensionScores, state.locale);
  }

  function rebuildReportModalContent(locale = getReportLocale()) {
    const reportData = buildRouteReportData(locale);
    state.reportModal.data = reportData;
    state.reportModal.documentHtml = buildRouteReportDocument(reportData);
    state.reportModal.fileName = buildRouteReportFileName(reportData);
    state.reportModal.error = '';
    state.reportModal.status = typeof window.showSaveFilePicker === 'function'
      ? reportT('readyPreviewPicker', null, state.locale)
      : reportT('readyPreviewDownload', null, state.locale);
  }

  async function requestRouteAnalysisFromLocalService(reportData, locale = getReportLocale()) {
    const { response, body } = await fetchJson(getLocalSimServerUrl('/api/route-analysis'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: locale === 'en' ? 'en' : 'zh-CN',
        payload: reportData?.llmInput || buildSharedRouteAnalysisLlmInput({ reportData }),
      }),
    }, Math.max(12000, LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS));
    if (!response.ok) {
      throw new Error(body?.error || `Route analysis failed (${response.status})`);
    }
    return body?.analysis ? {
      ...body.analysis,
      provider: body.analysis.provider || body.provider || null,
    } : null;
  }

  function getReportLlmAnalysisKey(reportData, locale = getReportLocale()) {
    return JSON.stringify({
      locale: locale === 'en' ? 'en' : 'zh-CN',
      route: reportData?.route,
      score: reportData?.routeScoreSummary,
      pressureIds: (reportData?.routePressurePoints || []).slice(0, 12).map((point) => point.id),
    });
  }

  async function ensureRouteAnalysisForCurrentState(locale = getReportLocale()) {
    if (!state.reportModal.open) {
      return null;
    }
    let reportData = null;
    try {
      reportData = state.reportModal.data || buildRouteReportData(locale);
    } catch (error) {
      return null;
    }
    const analysisKey = getReportLlmAnalysisKey(reportData, locale);
    if (
      state.reportModal.llmAnalysisPending
      && state.reportModal.llmAnalysisPromise
      && state.reportModal.llmAnalysisRequestKey === analysisKey
    ) {
      return state.reportModal.llmAnalysisPromise;
    }
    if (state.reportModal.llmAnalysis && state.reportModal.llmAnalysisKey === analysisKey) {
      return state.reportModal.llmAnalysis;
    }
    state.reportModal.llmAnalysisPending = true;
    state.reportModal.llmAnalysisRequestKey = analysisKey;
    state.reportModal.status = locale === 'en' ? 'Generating intelligent report recommendations...' : '正在生成智能报告建议...';
    requestRender();
    state.reportModal.llmAnalysisPromise = (async () => {
      const analysis = await requestRouteAnalysisFromLocalService(reportData, locale);
      if (
        !analysis
        || !state.reportModal.open
        || getReportLocale() !== locale
        || state.reportModal.llmAnalysisRequestKey !== analysisKey
      ) {
        return null;
      }
      state.reportModal.llmAnalysis = localizeRouteAnalysisOutput(analysis, locale);
      state.reportModal.llmAnalysisKey = analysisKey;
      rebuildReportModalContent(locale);
      return state.reportModal.llmAnalysis;
    })();
    try {
      return await state.reportModal.llmAnalysisPromise;
    } catch (error) {
      state.reportModal.status = typeof window.showSaveFilePicker === 'function'
        ? reportT('readyPreviewPicker', null, state.locale)
        : reportT('readyPreviewDownload', null, state.locale);
      return null;
    } finally {
      if (state.reportModal.llmAnalysisRequestKey === analysisKey) {
        state.reportModal.llmAnalysisPending = false;
        state.reportModal.llmAnalysisPromise = null;
        state.reportModal.llmAnalysisRequestKey = '';
      }
      requestRender();
    }
  }

  function renderReportDropdownState(reportLocale = getReportLocale(), uiLocale = state.locale) {
    const exportFormat = getReportExportFormat();
    const reportCopy = getReportCopy(uiLocale);
    if (elements.reportLanguageLabel) {
      elements.reportLanguageLabel.textContent = reportCopy.reportLanguage;
    }
    if (elements.reportLanguageTrigger) {
      elements.reportLanguageTrigger.textContent = getReportLanguageLabel(reportLocale, uiLocale);
      elements.reportLanguageTrigger.setAttribute('aria-expanded', state.reportModal.languageMenuOpen ? 'true' : 'false');
    }
    if (elements.reportLanguageMenu) {
      elements.reportLanguageMenu.classList.toggle('hidden', !state.reportModal.languageMenuOpen);
      elements.reportLanguageMenu.querySelectorAll('[data-report-locale]').forEach((button) => {
        const isActive = button.dataset.reportLocale === reportLocale;
        button.textContent = getReportLanguageLabel(button.dataset.reportLocale, uiLocale);
        button.classList.toggle('active', isActive);
        button.disabled = state.reportModal.exporting;
      });
    }
    if (elements.reportFormatLabel) {
      elements.reportFormatLabel.textContent = reportCopy.reportFormat;
    }
    if (elements.reportFormatTrigger) {
      elements.reportFormatTrigger.textContent = getReportFormatLabel(exportFormat, uiLocale);
      elements.reportFormatTrigger.setAttribute('aria-expanded', state.reportModal.formatMenuOpen ? 'true' : 'false');
    }
    if (elements.reportFormatMenu) {
      elements.reportFormatMenu.classList.toggle('hidden', !state.reportModal.formatMenuOpen);
      elements.reportFormatMenu.querySelectorAll('[data-report-format]').forEach((button) => {
        const format = button.dataset.reportFormat;
        button.textContent = getReportFormatLabel(format, uiLocale);
        button.classList.toggle('active', format === exportFormat);
        button.disabled = state.reportModal.exporting;
      });
    }
  }

  function renderReportModal() {
    const reportLocale = getReportLocale();
    const uiLocale = state.locale === 'en' ? 'en' : 'zh-CN';
    const reportCopy = getReportCopy(uiLocale);
    elements.reportModal.classList.toggle('hidden', !state.reportModal.open);
    if (elements.reportLocaleZh) {
      elements.reportLocaleZh.classList.toggle('active', reportLocale === 'zh-CN');
      elements.reportLocaleZh.disabled = state.reportModal.exporting;
    }
    if (elements.reportLocaleEn) {
      elements.reportLocaleEn.classList.toggle('active', reportLocale === 'en');
      elements.reportLocaleEn.disabled = state.reportModal.exporting;
    }
    elements.reportModalTitle.textContent = reportCopy.previewTitle;
    elements.reportModalCancelBtn.textContent = reportCopy.cancelExport;
    elements.reportModalExportBtn.textContent = state.reportModal.exporting ? reportCopy.exporting : reportCopy.confirmExport;
    renderReportDropdownState(reportLocale, uiLocale);
    const reportPreviewFrameEl = elements.reportPreviewFrame;
    if (!reportPreviewFrameEl) {
      elements.reportModalStatus.textContent = state.reportModal.status || state.reportModal.error || reportCopy.readyPreview;
      elements.reportModalExportBtn.disabled = !state.reportModal.documentHtml || state.reportModal.exporting;
      elements.reportModalCancelBtn.disabled = state.reportModal.exporting;
      return;
    }
    if (!state.reportModal.open) {
      reportPreviewFrameEl.srcdoc = '';
      return;
    }
    if (state.reportModal.error) {
      reportPreviewFrameEl.srcdoc = '';
    } else if (state.reportModal.data) {
      reportPreviewFrameEl.srcdoc = state.reportModal.documentHtml || '';
    } else {
      reportPreviewFrameEl.srcdoc = '';
    }
    elements.reportModalStatus.textContent = state.reportModal.status || state.reportModal.error || reportCopy.readyPreview;
    elements.reportModalExportBtn.disabled = !state.reportModal.documentHtml || state.reportModal.exporting;
    elements.reportModalCancelBtn.disabled = state.reportModal.exporting;
  }

  function renderPointPopover() {
    const selectedPoint = getPointPopoverSelection();
    if (!state.pointPopover.visible || !selectedPoint || !state.prepared || !state.pointPopover.anchor) {
      elements.pointPopover.classList.add('hidden');
      return;
    }
    const referenceOverlay = state.pointPopover.overlayTarget === 'detail'
      ? elements.visualizationDetailOverlay
      : elements.overlayLayer;
    const referenceTransform = state.pointPopover.overlayTarget === 'detail'
      ? computeTransformForViewportSize(referenceOverlay?.clientWidth, referenceOverlay?.clientHeight)
      : state.transform;
    const displayPoint = worldToDisplayPoint(state.pointPopover.anchor, referenceTransform);
    const localPosition = {
      x: referenceTransform.offsetX + (displayPoint.x - referenceTransform.viewBox.x) * referenceTransform.scale,
      y: referenceTransform.offsetY + (displayPoint.y - referenceTransform.viewBox.y) * referenceTransform.scale,
    };
    const referenceRect = referenceOverlay?.getBoundingClientRect?.() || elements.mapWrapper.getBoundingClientRect();
    const mapRect = elements.mapWrapper.getBoundingClientRect();
    const position = {
      x: (referenceRect.left - mapRect.left) + localPosition.x,
      y: (referenceRect.top - mapRect.top) + localPosition.y,
    };
    const categoryId = getLayerCategoryForObject(state.pointPopover.type, selectedPoint);
    elements.pointPopover.classList.remove('hidden');
    elements.pointPopover.style.left = `${Math.min(position.x + 18, (elements.mapWrapper.clientWidth || 0) - 252)}px`;
    elements.pointPopover.style.top = `${Math.max(12, position.y - 18)}px`;
    elements.pointPopoverHeader.textContent = selectedPoint.name || selectedPoint.label || selectedPoint.id;
    if (state.pointPopover.readOnly || !state.pointPopover.draft) {
      elements.pointPopoverContent.innerHTML = `
        <div class="point-popover-note">${escapeHtml(getCategoryDefinition(categoryId)?.label || categoryId || '--')}</div>
        <div class="point-popover-note">${escapeHtml(selectedPoint.feature || selectedPoint.label || '--')}</div>
      `;
      elements.pointPopoverConfirmBtn.disabled = true;
      elements.pointPopoverResetBtn.disabled = true;
      return;
    }
    elements.pointPopoverConfirmBtn.disabled = false;
    elements.pointPopoverResetBtn.disabled = false;
    if (state.pointPopover.draft.kind === 'ad') {
      elements.pointPopoverContent.innerHTML = `
        <label class="point-popover-field">
          <span class="label">Ads Type</span>
          <select data-popover-field="adMode">
            <option value="flashing-ads" ${state.pointPopover.draft.adMode === 'flashing-ads' ? 'selected' : ''}>Dynamic/flashing ads</option>
            <option value="static-ads" ${state.pointPopover.draft.adMode === 'static-ads' ? 'selected' : ''}>Static ads</option>
          </select>
        </label>
        <label class="point-popover-field">
          <span class="label">Lux</span>
          <input data-popover-field="lux" type="number" min="0" max="3000" step="1" value="${escapeHtml(state.pointPopover.draft.lux)}" />
        </label>
        <label class="point-popover-field">
          <span class="label">Decibel</span>
          <input data-popover-field="decibel" type="number" min="0" max="120" step="1" value="${escapeHtml(state.pointPopover.draft.decibel)}" />
        </label>
      `;
      return;
    }
    elements.pointPopoverContent.innerHTML = `
      <label class="point-popover-field">
        <span class="label">Decibel</span>
        <input data-popover-field="decibel" type="number" min="0" max="120" step="1" value="${escapeHtml(state.pointPopover.draft.decibel)}" />
      </label>
    `;
  }

  function renderSummary() {
    if (!state.scenario) {
      elements.runSummary.innerHTML = `<div class="detail-card glass-card muted">${escapeHtml(t('hint.summaryEmpty'))}</div>`;
      return;
    }
    const summary = getDynamicSummaryState();
    const cards = [
      { label: t('label.simultaneousCount'), value: `${formatNumber(summary.simultaneousCount, 0)} ${t('units.agents')}` },
      { label: t('label.travelTime'), value: formatDuration(summary.travelTime) },
      { label: t('label.minimumHeat'), value: formatMetricValue(summary.minHeat) },
      { label: t('label.maximumHeat'), value: formatMetricValue(summary.maxHeat) },
      { label: t('label.heatmapSource'), value: getHeatmapSourceLabel() },
    ];
    elements.runSummary.innerHTML = cards
      .map((card) => `<div class="summary-card glass-card"><span class="label">${escapeHtml(card.label)}</span><strong>${escapeHtml(card.value)}</strong></div>`)
      .join('');
  }

  function renderInspectorAgentSummary() {
    if (!elements.inspectorAgentSummary) {
      return;
    }
    const showingDetails = state.selectedDynamic?.kind === 'focus-agent';
    elements.inspectorAgentSummary.className = showingDetails ? 'detail-card glass-card' : 'detail-card glass-card muted';
    elements.inspectorAgentSummary.innerHTML = getInspectorAgentSummaryMarkup();
  }

  function renderObjectInspector() {
    const item = getObjectBySelection(state.selectedObject);
    if (!item) {
      elements.objectInspector.className = 'detail-card glass-card muted';
      elements.objectInspector.textContent = t('hint.objectEmpty');
      return;
    }

    elements.objectInspector.className = 'detail-card glass-card';
    if (state.selectedObject.type === 'node') {
      elements.objectInspector.innerHTML = `
        <strong>${escapeHtml(state.locale === 'zh-CN' ? item.displayLabel || item.id : item.displayLabelEn || item.displayLabel || item.id)}</strong>
        <div>${escapeHtml(t('label.type'))}: ${escapeHtml(getRoleLabel('facility'))}</div>
        <div>${escapeHtml(t('label.kind'))}: ${escapeHtml(getNodeKindLabel(item.kind))}</div>
        <div>${escapeHtml(t('label.routeSelected'))}: ${escapeHtml(getTargetRegionLabel(getTargetRegionById(item.targetRegionIds?.[0])) || '--')}</div>
        <div>${escapeHtml(t('label.x'))}: ${escapeHtml(formatNumber(item.x, 2))}</div>
        <div>${escapeHtml(t('label.y'))}: ${escapeHtml(formatNumber(item.y, 2))}</div>
        <div>${escapeHtml(t('label.z'))}: ${escapeHtml(formatNumber(item.z, 2))}</div>
      `;
      return;
    }

    if (state.selectedObject.type === 'pressure') {
      elements.objectInspector.innerHTML = `
        <strong>${escapeHtml(item.name || item.id)}</strong>
        <div>${escapeHtml(t('label.type'))}: ${escapeHtml(getRoleLabel(item.simRole || (item.activeForSimulation ? 'pressure' : 'facility')))}</div>
        <div>${escapeHtml(t('label.category'))}: ${escapeHtml(getCategoryLabel(item.category))}</div>
        <div>${escapeHtml(t('label.feature'))}: ${escapeHtml(item.feature || '--')}</div>
        <div>${escapeHtml(t('label.strength'))}: ${escapeHtml(formatNumber(item.strength || 0, 2))}</div>
        <div>${escapeHtml(t('label.range'))}: ${escapeHtml(formatMeters(item.range || 0))}</div>
        <div>${escapeHtml(t('label.x'))}: ${escapeHtml(formatNumber(item.x, 2))}</div>
        <div>${escapeHtml(t('label.y'))}: ${escapeHtml(formatNumber(item.y, 2))}</div>
      `;
      return;
    }

    elements.objectInspector.innerHTML = `
      <strong>${escapeHtml(item.label || item.id)}</strong>
      <div>${escapeHtml(t('label.type'))}: ${escapeHtml(getRoleLabel('facility'))}</div>
      <div>${escapeHtml(t('label.seatCount'))}: ${escapeHtml(formatNumber(item.seatCount || 0, 0))} ${escapeHtml(t('units.seats'))}</div>
      <div>${escapeHtml(t('label.reliefStrength'))}: ${escapeHtml(formatNumber(item.reliefStrength || 0, 2))}</div>
      <div>${escapeHtml(t('label.range'))}: ${escapeHtml(formatMeters(item.reliefRange || 0))}</div>
      <div>${escapeHtml(t('label.x'))}: ${escapeHtml(formatNumber(item.x, 2))}</div>
      <div>${escapeHtml(t('label.y'))}: ${escapeHtml(formatNumber(item.y, 2))}</div>
    `;
  }

  function renderDynamicInspector() {
    if (!elements.heatInspector) {
      return;
    }
    const inspection = getDynamicInspection();
    renderPrimaryMetrics(inspection && inspection.type === 'agent' ? inspection : null);
    if (!inspection) {
      elements.heatInspector.className = 'detail-card glass-card muted';
      elements.heatInspector.textContent = t('hint.dynamicEmpty');
      return;
    }

    const title = inspection.type === 'agent' ? t('roles.focusAgent') : t('roles.point');
    const nearbySeats = (inspection.nearbySeats || []).slice(0, 3).map((seat) => seat.label || seat.id).join(', ') || '--';
    const burdenMarkup = inspection.burdenScores
      ? buildDimensionSummaryEntries(inspection.capacityScores, inspection.burdenScores, state.locale).map((item) => `
          <div>${escapeHtml(item.burdenLabel)}: ${escapeHtml(formatMetricValue(item.burdenScore || 0))}</div>
        `).join('')
      : '';
    elements.heatInspector.className = 'detail-card glass-card';
    elements.heatInspector.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <div>${escapeHtml(t('label.cognitiveLoad'))}: ${escapeHtml(formatMetricValue((inspection.cognitiveLoad ?? inspection.pressure) || 0))}</div>
      <div>${escapeHtml(t('label.fatigue'))}: ${escapeHtml(formatMetricValue(inspection.fatigue || 0))}</div>
      <div>${escapeHtml(t('label.heat'))}: ${escapeHtml(formatMetricValue(inspection.heat || 0))}</div>
      <div>${escapeHtml(t('label.fatigueThreshold'))}: ${escapeHtml(formatMetricValue(inspection.fatigueThreshold || 0, 0))}</div>
      <div>${escapeHtml(t('label.crowdDensity'))}: ${escapeHtml(formatNumber(inspection.crowdDensity || 0, 2))}</div>
      <div>${escapeHtml(t('label.progress'))}: ${escapeHtml(formatPercent((inspection.progress || 0) * 100))}</div>
      <div>${escapeHtml(t('label.visionRadius'))}: ${escapeHtml(formatMeters(inspection.visionRadius || 0))}</div>
      ${inspection.environmentNoise !== undefined ? `<div>${escapeHtml(t('label.environmentNoise'))}: ${escapeHtml(formatMetricValue(inspection.environmentNoise || 0))} ${escapeHtml(t('units.decibel'))}</div>` : ''}
      ${inspection.environmentLighting !== undefined ? `<div>${escapeHtml(t('label.environmentLighting'))}: ${escapeHtml(formatMetricValue(inspection.environmentLighting || 0))} ${escapeHtml(t('units.lux'))}</div>` : ''}
      ${inspection.queueCount !== undefined ? `<div>${escapeHtml(t('label.queueCount'))}: ${escapeHtml(formatMetricValue(inspection.queueCount || 0, 0))}</div>` : ''}
      ${inspection.type === 'agent' ? `<div>${escapeHtml(t('label.walkingSpeed'))}: ${escapeHtml(formatNumber(inspection.walkingSpeed || 0, 2))} ${escapeHtml(t('units.perSecond'))}</div>` : ''}
      ${inspection.type === 'agent' ? `<div>${escapeHtml(t('label.decisionDelay'))}: ${escapeHtml(formatNumber(inspection.decisionDelay || 0, 2))} ${escapeHtml(t('units.seconds'))}</div>` : ''}
      ${burdenMarkup}
      <div>${escapeHtml(t('label.nearbySeats'))}: ${escapeHtml(nearbySeats)}</div>
      <div>${escapeHtml(t('label.advice'))}: ${escapeHtml(suggestionForInspection(inspection))}</div>
    `;
  }

  function getSuggestionByCategoryText(category, locale = state.locale) {
    const suggestions = {
      'zh-CN': {
        noise_congestion: '建议疏解扶梯口周边汇流，并降低局部噪声与并行冲突。',
        advert: '建议降低高亮广告干扰，避免分散方向判断。',
        noise: '建议控制高噪声界面，减少连续声压刺激。',
        signage: '建议增强连续导向标识，降低寻找路径成本。',
        decision: '建议在关键决策点前置方向信息，减少犹豫与停滞。',
        facility: '建议优化设施周边停留与通行关系，避免形成局部阻塞。',
        unknown: '建议补充该热点对象的规则描述后再细化优化策略。',
      },
      en: {
        noise_congestion: 'Relieve merging pressure around escalator mouths and reduce local noise-conflict overlap.',
        advert: 'Reduce high-salience advertising interference so directional judgment stays clear.',
        noise: 'Mitigate high-noise surfaces and reduce continuous acoustic stress.',
        signage: 'Strengthen continuous wayfinding to lower path-search effort.',
        decision: 'Place directional cues earlier at decision points to reduce hesitation and stopping.',
        facility: 'Reorganize facility-adjacent waiting and passing space to avoid local blockage.',
        unknown: 'Add clearer rules for this hotspot before proposing a more specific intervention.',
      },
    };
    return (suggestions[locale] || suggestions['zh-CN'])[category || 'unknown'];
  }

  function getSuggestionByCategory(category) {
    return getSuggestionByCategoryText(category, state.locale);
  }

  function formatReportNumber(value, maximumFractionDigits = 1) {
    return formatNumberForLocale(getReportLocale() === 'en' ? 'en-US' : 'zh-CN', value, maximumFractionDigits);
  }

  function formatReportMetric(value, maximumFractionDigits) {
    const digits = maximumFractionDigits ?? (Math.abs(Number(value) || 0) >= 100 ? 0 : 1);
    return formatReportNumber(value, digits);
  }

  function formatReportDuration(seconds, locale = getReportLocale()) {
    const number = formatNumberForLocale(locale === 'en' ? 'en-US' : 'zh-CN', seconds, 1);
    return `${number} ${reportT('secondsUnit', null, locale)}`;
  }

  function getReportStartLabel(locale = getReportLocale()) {
    const node = state.routeSelection.startNodeId ? state.prepared?.nodeById?.[state.routeSelection.startNodeId] : null;
    if (!node) {
      return '--';
    }
    return locale === 'en' ? node.displayLabelEn || node.displayLabel || node.id : node.displayLabel || node.displayLabelEn || node.id;
  }

  function getReportTargetLabel(locale = getReportLocale()) {
    const region = getTargetRegionById(state.routeSelection.targetRegionId);
    if (!region) {
      return '--';
    }
    return locale === 'en' ? region.labelEn || region.labelZh || region.id : region.labelZh || region.labelEn || region.id;
  }

  function sanitizeFileName(value) {
    const safe = String(value || '')
      .trim()
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .replace(/\s+/g, ' ');
    return safe || DEFAULT_FILE_NAME;
  }

  function buildRouteReportFileName(reportData) {
    return `${sanitizeFileName(reportData.projectName)}-route-report.html`;
  }

  function buildRouteReportPdfFileName(reportData) {
    return `${sanitizeFileName(reportData.projectName)}-route-report.pdf`;
  }

  function getReportHotspots() {
    return (state.scenario?.hotspots || []).slice(0, 3);
  }

  function getRouteReportRiskSummary(summary, hotspots, locale = getReportLocale()) {
    const hotspotPeak = hotspots.length ? Math.max(...hotspots.map((item) => Number(item.pressure || item.score || 0))) : 0;
    const averageHeat = Number(summary?.averageHeat || 0);
    const averageFatigue = Number(summary?.averageFatigue || 0);
    const fatigueThreshold = getFatigueThreshold();
    const averageTravelTime = Number(summary?.averageTravelTime || 0);
    if (hotspotPeak >= 80 || averageHeat >= 45 || averageFatigue >= fatigueThreshold * 0.9 || averageTravelTime >= 240) {
      return {
        level: reportT('riskHigh', null, locale),
        className: 'high',
        summary: reportT('riskHighSummary', null, locale),
      };
    }
    if (hotspotPeak >= 45 || averageHeat >= 20 || averageFatigue >= fatigueThreshold * 0.65 || averageTravelTime >= 150) {
      return {
        level: reportT('riskMedium', null, locale),
        className: 'medium',
        summary: reportT('riskMediumSummary', null, locale),
      };
    }
    return {
      level: reportT('riskLow', null, locale),
      className: 'low',
      summary: reportT('riskLowSummary', null, locale),
    };
  }

  function buildRouteReportFindings(summary, hotspots, risk, locale = getReportLocale()) {
    const findings = [];
    const hotspotPeak = hotspots[0] || null;
    const fatigueThreshold = getFatigueThreshold();
    const averageFatigue = Number(summary?.averageFatigue || 0);
    const averageTravelTime = Number(summary?.averageTravelTime || 0);
    if (hotspotPeak) {
      findings.push(reportT('findingHotspot', {
        name: hotspotPeak.name || hotspotPeak.id,
        category: hotspotPeak.categoryLabel,
        value: formatReportMetric(hotspotPeak.pressure || hotspotPeak.score || 0),
      }, locale));
    }
    if (averageTravelTime >= 150) {
      findings.push(reportT('findingTravelTime', { value: formatReportDuration(averageTravelTime, locale) }, locale));
    }
    if (averageFatigue >= fatigueThreshold * 0.8) {
      findings.push(reportT('findingFatigue', { value: formatReportMetric(fatigueThreshold, 0) }, locale));
    }
    if (!findings.length) {
      findings.push(risk.summary);
    }
    return findings.slice(0, 3);
  }

  function buildRouteReportRecommendations(summary, hotspots, locale = getReportLocale()) {
    const recommendations = [];
    const seen = new Set();
    const addRecommendation = (value) => {
      const text = String(value || '').trim();
      if (!text || seen.has(text)) {
        return;
      }
      seen.add(text);
      recommendations.push(text);
    };
    hotspots.forEach((item) => addRecommendation(getSuggestionByCategoryText(item.category, locale)));
    if (Number(summary?.averageTravelTime || 0) >= 150) {
      addRecommendation(reportT('recommendationWayfinding', null, locale));
    }
    if (Number(summary?.averageFatigue || 0) >= getFatigueThreshold() * 0.8) {
      addRecommendation(reportT('recommendationRecovery', null, locale));
    }
    if (!recommendations.length) {
      addRecommendation(reportT('recommendationBaseline', null, locale));
    }
    return recommendations.slice(0, 4);
  }

  function buildDimensionReportMarkup(reportData) {
    const copy = reportData.copy || getReportCopy(reportData.locale);
    if (!reportData.dimensionSummary?.length) {
      return `<div class="support-text">${escapeHtml(copy.noDimensionData)}</div>`;
    }
    return `
      <div class="grid">
        ${reportData.dimensionSummary.map((item) => `
          <div class="card">
            <span class="label">${escapeHtml(item.burdenLabel)}</span>
            <strong>${escapeHtml(formatReportMetric(item.burdenScore))}</strong>
            <div class="support-text">${escapeHtml(copy.capacityScores)}: ${escapeHtml(item.capacityScoreLabel || String(item.capacityScore || 0))} / 5</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildReportExportCopy(locale = getReportLocale()) {
    const base = getReportCopy(locale);
    const zh = locale !== 'en';
    return {
      ...base,
      pageOneTitle: zh ? '空间模型信息' : 'Spatial Model Information',
      pageOneInputTitle: zh ? '代理人属性' : 'Agent Attribute',
      detailedSimulationTitle: zh ? '详细模拟结果' : 'Detailed simulation results',
      pageTwoSimulationTitle: zh ? '模拟参数信息' : 'Simulation Parameters',
      pageTwoThoughtTitle: zh ? '代理人思维链' : 'Agent Thought Chain',
      thoughtMapNote: zh
        ? '平面图上的黑色圆环和实心圆点表示代理人在该位置触发对应思维链判断。'
        : 'Black rings and solid dots on the plan mark where the corresponding thought-chain decisions were triggered.',
      pageTwoPressureTitle: zh ? '涉及的压力点' : 'Involved Stressors',
      pageThreeHeatTitle: zh ? '热力图结果' : 'Heatmap Results',
      coverTitle: zh ? '智能诊断报告' : 'INTELLIGENT DIAGNOSTIC REPORT',
      coverSubtitle: zh ? '老人旅行负担模拟' : 'Elderly Travel Burden Simulation',
      coverProjectFile: zh ? '项目文件:' : 'Project File:',
      coverExportTime: zh ? '导出时间:' : 'Export Time:',
      coverRoute: zh ? '模拟路线:' : 'Simulation Route:',
      coverBackgroundCrowd: zh ? '背景人流:' : 'Background Crowd:',
      frontExecutiveTitle: zh ? '路线诊断摘要' : 'Route Diagnosis Summary',
      frontAdjustmentTitle: zh ? '模型调整建议' : 'Model Adjustment Recommendations',
      frontLlmBadge: zh ? 'LLM智能总结' : 'LLM-generated insight',
      frontEvidenceBadge: zh ? '基于模拟证据' : 'Simulation-grounded',
      frontRouteJudgement: zh ? '路线总体判断' : 'Route Judgement',
      frontCoreProblems: zh ? '核心问题摘要' : 'Core Problems',
      frontPriorityActions: zh ? '重点修改内容' : 'Key Modifications',
      frontRouteMapTitle: zh ? '路线诊断平面图' : 'Route Diagnosis Plan',
      frontScoreScale: zh ? '负担等级' : 'Burden Level',
      frontSpatialChanges: zh ? '空间模型修改建议' : 'Spatial Model Changes',
      frontPriorityAreas: zh ? '重点修改区域' : 'Priority Areas',
      frontPriorityFacilities: zh ? '重点修改设施' : 'Priority Facilities',
      frontExpectedImpact: zh ? '预计改善方向' : 'Expected Improvement',
      frontEvidenceSource: zh ? '证据来源' : 'Evidence Source',
      frontOverallScore: zh ? '总体负担' : 'Overall Burden',
      frontFriendlyScore: zh ? '路线友好度' : 'Route Friendliness',
      frontDominantBurden: zh ? '主导负担' : 'Dominant Burden',
      frontRouteMapNote: zh
        ? '黑色虚线表示本次模拟路线，彩色区域表示综合高热区，彩色圆圈表示本路线涉及的压力点，圆圈内部数字表示压力点贡献值排序。'
        : 'The black dashed line shows the simulated route, colored areas show composite hot zones, colored circles show involved stressors, and the number inside each circle is its contribution rank.',
      frontTraceability: zh ? '后续模拟结果页提供热力图、思维链和压力点贡献证据。' : 'The following simulation-result pages provide heatmaps, thought-chain evidence, and stressor contribution records.',
      detailAnalysisTitle: zh ? '详细负担分析' : 'Detailed Burden Analysis',
      llmAdjustmentTitle: zh ? '模型调整建议总结' : 'Model Adjustment Recommendations',
      llmAdjustmentSpaceTitle: zh ? '空间模型修改建议' : 'Spatial Model Changes',
      llmAdjustmentAreaTitle: zh ? '重点修改区域' : 'Priority Areas',
      llmAdjustmentFacilityTitle: zh ? '重点修改设施' : 'Priority Facilities',
      routeScoreTitle: zh ? '路线总体评分' : 'Route Score',
      overallBurdenScore: zh ? '总体负担评分' : 'Overall Burden Score',
      routeFriendlyScore: zh ? '路线友好度' : 'Route Friendliness',
      fiveDimensionScore: zh ? '五维负担评分' : 'Five-Dimension Burden Scores',
      influenceRankingTitle: zh ? '主要影响源按贡献值排序' : 'Influence Sources Ranked By Contribution',
      importedModel: zh ? '导入模型' : 'Imported Model',
      modelArea: zh ? '面积' : 'Area',
      category: zh ? '类别' : 'Category',
      type: zh ? '类型' : 'Type',
      count: zh ? '数量' : 'Count',
      nodeCategory: 'node',
      pressureCategory: zh ? '压力点' : 'Stressors',
      routeSelection: zh ? '路线选择' : 'Selected Route',
      routeArrow: zh ? '到' : 'to',
      backgroundCrowdCount: zh ? '背景人流数量' : 'Background Crowd',
      simulationMetric: zh ? '指标' : 'Metric',
      minimum: zh ? '最低值' : 'Minimum',
      maximum: zh ? '最高值' : 'Maximum',
      value: zh ? '数值' : 'Value',
      travelTime: zh ? '通行时间' : 'Travel Time',
      minOnsitePeople: zh ? '最低在场人数' : 'Minimum Occupancy',
      maxOnsitePeople: zh ? '最高在场人数' : 'Maximum Occupancy',
      crowdDensity: zh ? '人群密度' : 'Crowd Density',
      environmentNoise: zh ? '环境噪音' : 'Ambient Noise',
      environmentLighting: zh ? '环境照度' : 'Ambient Lighting',
      walkingSpeed: zh ? '步行速度' : 'Walking Speed',
      decisionDelay: zh ? '决策迟滞' : 'Decision Delay',
      visionRadius: zh ? '视野范围' : 'Vision Radius',
      noThoughtChain: zh ? '当前模拟没有生成思维链，报告以运行轨迹和压力点作为诊断依据。' : 'No thought chain was generated; this report uses the runtime trace and stressors as diagnostic evidence.',
      noPressurePoints: zh ? '当前路线未关联明确压力点。' : 'No explicit route stressors are associated with this run.',
      minBurden: zh ? '最小负担' : 'Minimum Burden',
      maxBurden: zh ? '最大负担' : 'Maximum Burden',
      burdenContributionRanking: zh ? '负担贡献度排行榜' : 'Burden Contribution Ranking',
      highHeatIssueAdvice: zh ? '高热区域问题与建议' : 'High-Heat Issues And Suggestions',
      pressureInfluence: zh ? '压力点影响' : 'Stressor Influence',
      noHighHeat: zh ? '未检测到负担值大于等于 80 的高热区域。' : 'No high-heat region at or above burden value 80 was detected.',
      modelNodeExit: zh ? '出入口' : 'Entry / Exit',
      modelNodeEscalator: zh ? '扶梯' : 'Escalator',
      modelNodeStair: zh ? '楼梯' : 'Stair',
      modelNodeElevator: zh ? '电梯' : 'Elevator',
      modelNodeBoarding: zh ? '乘车点' : 'Boarding Point',
      squareMeters: zh ? '平方米' : 'sqm',
      people: zh ? '人' : 'people',
      seconds: zh ? '秒' : 's',
    };
  }

  function computeReportPolygonArea(polygon = []) {
    let area = 0;
    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index] || [];
      const next = polygon[(index + 1) % polygon.length] || [];
      area += Number(current[0] || 0) * Number(next[1] || 0) - Number(next[0] || 0) * Number(current[1] || 0);
    }
    return Math.abs(area) * 0.5;
  }

  function buildReportModelSpaceInfo(locale = getReportLocale()) {
    const copy = buildReportExportCopy(locale);
    const prepared = state.prepared || {};
    const nodes = Array.isArray(prepared.nodes) ? prepared.nodes : [];
    const pressureObjects = Array.isArray(prepared.pressureObjects) ? prepared.pressureObjects : [];
    const seats = Array.isArray(prepared.seats) ? prepared.seats : [];
    const walkableArea = (prepared.walkableAreas || [])
      .reduce((sum, polygon) => sum + computeReportPolygonArea(polygon), 0);
    const nodeCounts = {
      exit: nodes.filter((node) => /^gate_/i.test(String(node.id || ''))).length,
      escalator: nodes.filter((node) => /^es_/i.test(String(node.id || ''))).length,
      stair: nodes.filter((node) => /^stair_/i.test(String(node.id || ''))).length,
      elevator: nodes.filter((node) => /^elev_/i.test(String(node.id || ''))).length,
      boarding: nodes.filter((node) => /^train_door/i.test(String(node.id || ''))).length,
    };
    const pressureCounts = LAYER_CATEGORY_DEFINITIONS.map((definition) => {
      const count = definition.id === 'seat'
        ? seats.length
        : pressureObjects.filter((item) => getLayerCategoryForObject('pressure', item) === definition.id).length;
      return {
        category: copy.pressureCategory,
        label: definition.label,
        color: definition.color,
        count,
      };
    });
    return {
      modelName: state.modelSourceName || getDisplayFileName(),
      area: walkableArea,
      rows: [
        { category: copy.nodeCategory, label: copy.modelNodeExit, count: nodeCounts.exit },
        { category: copy.nodeCategory, label: copy.modelNodeEscalator, count: nodeCounts.escalator },
        { category: copy.nodeCategory, label: copy.modelNodeStair, count: nodeCounts.stair },
        { category: copy.nodeCategory, label: copy.modelNodeElevator, count: nodeCounts.elevator },
        { category: copy.nodeCategory, label: copy.modelNodeBoarding, count: nodeCounts.boarding },
        ...pressureCounts,
      ],
    };
  }

  function getReportPlayback() {
    return getActivePlayback() || state.scenario?.precomputedPlayback || null;
  }

  function getReportTraceSnapshots() {
    return getPlaybackTraceSnapshots(getReportPlayback());
  }

  function getReportMetricRangeFromSnapshots(traceSnapshots, key, fallback = 0) {
    const values = (Array.isArray(traceSnapshots) ? traceSnapshots : [])
      .map((snapshot) => Number(snapshot?.[key]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) {
      const safeFallback = Number(fallback || 0);
      return { min: safeFallback, max: safeFallback };
    }
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  function buildReportSimulationParameterRows(locale = getReportLocale()) {
    const copy = buildReportExportCopy(locale);
    const traceSnapshots = getReportTraceSnapshots();
    const summary = state.scenario?.summary || {};
    const inspection = getCurrentFocusInspection() || {};
    const travelTime = Number(summary.averageTravelTime || traceSnapshots[traceSnapshots.length - 1]?.time || inspection.time || 0);
    const peopleRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'simultaneousCount', Number(summary.simultaneousCount || getBackgroundCrowdCount() || 0));
    const densityRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'crowdDensity', Number(inspection.crowdDensity || 0));
    const noiseRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'environmentNoise', Number(inspection.environmentNoise || 0));
    const lightRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'environmentLighting', Number(inspection.environmentLighting || 0));
    const speedRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'walkingSpeed', Number(inspection.walkingSpeed || 0));
    const delayRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'decisionDelay', Number(inspection.decisionDelay || 0));
    const visionRange = getReportMetricRangeFromSnapshots(traceSnapshots, 'visionRadius', Number(inspection.visionRadius || 0));
    return [
      { label: copy.travelTime, min: formatReportDuration(travelTime, locale), max: formatReportDuration(travelTime, locale) },
      { label: copy.minOnsitePeople, min: `${formatReportNumber(peopleRange.min, 0)} ${copy.people}`, max: `${formatReportNumber(peopleRange.max, 0)} ${copy.people}` },
      { label: copy.crowdDensity, min: `${formatReportNumber(densityRange.min, 2)} p/m²`, max: `${formatReportNumber(densityRange.max, 2)} p/m²` },
      { label: copy.environmentNoise, min: `${formatReportNumber(noiseRange.min, 1)} dB`, max: `${formatReportNumber(noiseRange.max, 1)} dB` },
      { label: copy.environmentLighting, min: `${formatReportNumber(lightRange.min, 0)} lux`, max: `${formatReportNumber(lightRange.max, 0)} lux` },
      { label: copy.walkingSpeed, min: `${formatReportNumber(speedRange.min, 2)} m/s`, max: `${formatReportNumber(speedRange.max, 2)} m/s` },
      { label: copy.decisionDelay, min: `${formatReportNumber(delayRange.min, 2)} ${copy.seconds}`, max: `${formatReportNumber(delayRange.max, 2)} ${copy.seconds}` },
      { label: copy.visionRadius, min: `${formatReportNumber(visionRange.min, 1)} m`, max: `${formatReportNumber(visionRange.max, 1)} m` },
    ];
  }

  function buildReportThoughtChainItems(locale = getReportLocale()) {
    const playback = getReportPlayback();
    const plan = playback?.llmDecisionPlan || state.scenario?.llmDecisionPlan || {};
    const timeline = Array.isArray(plan.timeline) ? plan.timeline : [];
    const items = timeline
      .map((item) => (
        locale === 'en'
          ? item.thoughtEn || item.textEn || item.labelEn || item.titleEn || item.summaryEn
          : item.thoughtZh || item.textZh || item.labelZh || item.titleZh || item.summaryZh
      ))
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (items.length) {
      return items.slice(0, 8);
    }
    return getVisualizationDetailTimelineSteps({
      route: { startLabel: getReportStartLabel(locale), targetLabel: getReportTargetLabel(locale) },
      activeView: { label: getDimensionBurdenLabel(getSafeViewMode(state.viewMode), locale) },
      peakDimension: null,
      summary: { averageTravelTime: Number(state.scenario?.summary?.averageTravelTime || 0) },
      risk: { level: '--' },
      findings: [],
    }).slice(0, 5);
  }

  function buildReportBaseSvg(transform) {
    const viewBox = `${transform.viewBox.x} ${transform.viewBox.y} ${transform.viewBox.width} ${transform.viewBox.height}`;
    const walkable = (state.prepared?.walkableAreas || [])
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, transform)}"></polygon>`)
      .join('');
    const obstacles = (state.prepared?.obstacles || [])
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, transform)}"></polygon>`)
      .join('');
    return `<svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${walkable}${obstacles}</svg>`;
  }

  function buildReportRoutePathMarkup(transform, options = {}) {
    const traceSnapshots = getReportTraceSnapshots();
    if (!traceSnapshots.length) {
      return '';
    }
    const maxPoints = Math.max(2, Number(options.maxPoints || 220));
    const stride = Math.max(1, Math.ceil(traceSnapshots.length / maxPoints));
    const points = traceSnapshots
      .filter((snapshot, index) => index % stride === 0 || index === traceSnapshots.length - 1)
      .map((snapshot) => worldToDisplayPoint(snapshot, transform))
      .map((point) => `${Number(point.x).toFixed(2)},${Number(point.y).toFixed(2)}`)
      .join(' ');
    return `<polyline class="report-route-path" points="${points}"></polyline>`;
  }

  function getReportTimelineExplicitPoint(item) {
    const candidates = [
      item?.position,
      item?.worldPosition,
      item?.point,
      item?.triggerPoint,
      item?.trigger_position,
      item,
    ];
    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }
      const x = Number(candidate.x ?? candidate.worldX ?? candidate.positionX);
      const y = Number(candidate.y ?? candidate.worldY ?? candidate.positionY);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return { x, y };
      }
    }
    return null;
  }

  function findReportTraceSnapshotByProgress(traceSnapshots, progress) {
    if (!traceSnapshots.length) {
      return null;
    }
    const safeProgress = clamp(Number(progress), 0, 1);
    const index = clamp(Math.round(safeProgress * (traceSnapshots.length - 1)), 0, traceSnapshots.length - 1);
    return traceSnapshots[index] || null;
  }

  function findReportTraceSnapshotByTime(traceSnapshots, timeSeconds) {
    const safeTime = Number(timeSeconds);
    if (!traceSnapshots.length || !Number.isFinite(safeTime)) {
      return null;
    }
    let best = traceSnapshots[0];
    let bestDistance = Number.POSITIVE_INFINITY;
    traceSnapshots.forEach((snapshot) => {
      const snapshotTime = Number(snapshot?.time ?? snapshot?.timeSeconds ?? snapshot?.elapsedTime ?? snapshot?.t);
      if (!Number.isFinite(snapshotTime)) {
        return;
      }
      const distance = Math.abs(snapshotTime - safeTime);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = snapshot;
      }
    });
    return best || null;
  }

  function getReportPlaybackEvents(playback = getReportPlayback()) {
    return [
      playback?.events,
      playback?.runtimeEvents,
      playback?.decisionEvents,
      playback?.focusEvents,
      playback?.meta?.events,
      playback?.meta?.runtimeEvents,
    ].flatMap((items) => (Array.isArray(items) ? items : []));
  }

  function resolveReportDecisionPoint(item, traceSnapshots) {
    const explicitPoint = getReportTimelineExplicitPoint(item);
    if (explicitPoint) {
      return explicitPoint;
    }
    const nodeId = String(item?.nodeId || item?.node_id || '').trim();
    if (nodeId && state.prepared?.nodeById?.[nodeId]) {
      return state.prepared.nodeById[nodeId];
    }
    const triggerEventId = String(item?.triggerEventId || item?.trigger_event_id || '').trim();
    if (triggerEventId) {
      const matchedEvent = getReportPlaybackEvents().find((event) => {
        const eventId = String(event?.id || event?.eventId || event?.event_id || event?.triggerEventId || '').trim();
        return eventId && eventId === triggerEventId;
      });
      const eventPoint = getReportTimelineExplicitPoint(matchedEvent);
      if (eventPoint) {
        return eventPoint;
      }
      const eventSnapshotIndex = Number(matchedEvent?.snapshotIndex ?? matchedEvent?.traceIndex);
      if (Number.isFinite(eventSnapshotIndex) && traceSnapshots[eventSnapshotIndex]) {
        return traceSnapshots[eventSnapshotIndex];
      }
      const eventByTime = findReportTraceSnapshotByTime(traceSnapshots, matchedEvent?.timeSeconds ?? matchedEvent?.time);
      if (eventByTime) {
        return eventByTime;
      }
      if (Number.isFinite(Number(matchedEvent?.progress))) {
        return findReportTraceSnapshotByProgress(traceSnapshots, Number(matchedEvent.progress));
      }
    }
    const timedPoint = findReportTraceSnapshotByTime(traceSnapshots, item?.timeSeconds ?? item?.time);
    if (timedPoint) {
      return timedPoint;
    }
    if (Number.isFinite(Number(item?.progress ?? item?.routeProgress))) {
      return findReportTraceSnapshotByProgress(traceSnapshots, Number(item.progress ?? item.routeProgress));
    }
    const sampleOrder = parseTimelineSampleOrder(item?.nodeId || item?.node_id || '');
    if (sampleOrder !== null) {
      const progress = timelineSampleOrderToProgress(sampleOrder, item?.order);
      return findReportTraceSnapshotByProgress(traceSnapshots, progress);
    }
    return traceSnapshots[0] || null;
  }

  function timelineSampleOrderToProgress(sampleOrder, fallbackOrder) {
    const safeOrder = Math.max(1, Number(sampleOrder || fallbackOrder || 1));
    return clamp((safeOrder - 1) / Math.max(1, 4), 0, 1);
  }

  function buildReportDecisionPointMarkup(transform) {
    const playback = getReportPlayback();
    const timeline = Array.isArray(playback?.llmDecisionPlan?.timeline) ? playback.llmDecisionPlan.timeline : [];
    const traceSnapshots = getReportTraceSnapshots();
    if (!timeline.length || !traceSnapshots.length) {
      return '';
    }
    return timeline.slice(0, 12).map((item) => {
      const decisionPoint = resolveReportDecisionPoint(item, traceSnapshots);
      if (!decisionPoint) {
        return '';
      }
      const point = worldToDisplayPoint(decisionPoint, transform);
      const ringRadius = worldRadiusForPixels(7.2, transform);
      const dotRadius = worldRadiusForPixels(4.2, transform);
      return `<circle class="report-decision-ring" cx="${point.x}" cy="${point.y}" r="${ringRadius}"></circle><circle class="report-decision-dot" cx="${point.x}" cy="${point.y}" r="${dotRadius}"></circle>`;
    }).join('');
  }

  function reportDistanceToTrace(point, traceSnapshots = getReportTraceSnapshots()) {
    if (!point || !traceSnapshots.length) {
      return Number.POSITIVE_INFINITY;
    }
    let best = Number.POSITIVE_INFINITY;
    for (let index = 1; index < traceSnapshots.length; index += 1) {
      const start = traceSnapshots[index - 1];
      const end = traceSnapshots[index];
      const dx = Number(end.x || 0) - Number(start.x || 0);
      const dy = Number(end.y || 0) - Number(start.y || 0);
      const lengthSq = dx * dx + dy * dy || 1;
      const ratio = clamp(((Number(point.x || 0) - Number(start.x || 0)) * dx + (Number(point.y || 0) - Number(start.y || 0)) * dy) / lengthSq, 0, 1);
      const px = Number(start.x || 0) + dx * ratio;
      const py = Number(start.y || 0) + dy * ratio;
      best = Math.min(best, Math.hypot(Number(point.x || 0) - px, Number(point.y || 0) - py));
    }
    return best;
  }

  function getReportPressureContributionLog() {
    const playback = getReportPlayback();
    return [
      playback?.pressureContributionLog,
      playback?.heat?.pressureContributionLog,
      state.scenario?.precomputedPlayback?.pressureContributionLog,
      state.scenario?.precomputedPlayback?.heat?.pressureContributionLog,
    ].find((items) => Array.isArray(items)) || [];
  }

  function buildReportPressurePointIndex(locale = getReportLocale()) {
    const contributionLog = getReportPressureContributionLog();
    const activePressureObjects = Array.isArray(state.prepared?.activePressureObjects)
      ? state.prepared.activePressureObjects
      : [];
    const pressureById = new Map(activePressureObjects.map((item) => [item.id, item]));
    const aggregate = new Map();
    contributionLog.forEach((entry) => {
      const id = String(entry?.pressurePointId || entry?.id || '').trim();
      const source = pressureById.get(id);
      if (!id || !source) {
        return;
      }
      const previous = aggregate.get(id) || {
        source,
        contribution: 0,
        count: 0,
        burdenTypes: new Set(),
        missedSignage: false,
      };
      previous.contribution += Math.max(0, Number(entry.contribution || entry.score || 0));
      previous.count += 1;
      if (entry.burdenType) {
        previous.burdenTypes.add(entry.burdenType);
      }
      previous.missedSignage = previous.missedSignage || Boolean(entry.missedSignage);
      aggregate.set(id, previous);
    });
    const items = Array.from(aggregate.values())
      .sort((left, right) => Number(right.contribution || 0) - Number(left.contribution || 0))
      .slice(0, 32)
      .map((item, index) => {
        const source = item.source;
        const categoryId = getLayerCategoryForObject('pressure', source) || source.category || 'unknown';
        return {
          id: source.id,
          pressureNumber: index + 1,
          reportPressureNumber: index + 1,
          name: source.name || source.label || source.id,
          description: source.feature || source.category || '--',
          categoryId,
          categoryLabel: getCategoryDefinition(categoryId)?.label || categoryId,
          color: getCategoryColor(categoryId),
          x: Number(source.x || 0),
          y: Number(source.y || 0),
          range: Math.max(4, Number(source.range || 0), Number(source.decibel || 0) ? 8 : 0, Number(source.lux || 0) ? 6 : 0),
          contribution: item.contribution,
          burdenTypes: Array.from(item.burdenTypes),
          missedSignage: item.missedSignage,
          locale,
        };
      });
    return {
      items,
      byId: new Map(items.map((item) => [item.id, item])),
    };
  }

  function buildReportRoutePressurePoints(locale = getReportLocale()) {
    const indexed = buildReportPressurePointIndex(locale);
    return indexed.items;
  }

  function buildReportNumberedPressurePointMarkup(transform, pressurePoints = []) {
    return pressurePoints.map((item) => {
      const point = worldToDisplayPoint(item, transform);
      const radius = worldRadiusForPixels(7.2, transform);
      const number = item.reportPressureNumber || item.pressureNumber || '';
      return `<g class="report-pressure-marker"><circle class="report-pressure-dot" cx="${point.x}" cy="${point.y}" r="${radius}" fill="${escapeHtml(item.color)}"><title>${escapeHtml(item.name)}</title></circle><text x="${point.x}" y="${point.y}">${escapeHtml(String(number))}</text></g>`;
    }).join('');
  }

  function buildReportNumberedInfluenceSourceMarkup(transform, influenceSources = []) {
    return influenceSources.map((item) => {
      if (item?.sourceType === 'pressure') {
        return buildReportNumberedPressurePointMarkup(transform, [item]);
      }
      const point = worldToDisplayPoint(item, transform);
      const label = item.displayNumber || item.sourceNumber || '';
      const radius = item.sourceType === 'area' ? worldRadiusForPixels(9.6, transform) : worldRadiusForPixels(7.8, transform);
      const className = item.sourceType === 'area' ? 'report-area-marker' : 'report-node-marker';
      return `<g class="${className}"><circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${escapeHtml(item.color || '#60707b')}"><title>${escapeHtml(item.name || '')}</title></circle><text x="${point.x}" y="${point.y}">${escapeHtml(String(label))}</text></g>`;
    }).join('');
  }

  function buildReportThoughtMapSnapshot(reportData, locale = getReportLocale()) {
    const transform = computeTransformForViewportSize(860, 400);
    return {
      baseSvg: buildReportBaseSvg(transform),
      overlaySvg: `<svg viewBox="${transform.viewBox.x} ${transform.viewBox.y} ${transform.viewBox.width} ${transform.viewBox.height}" preserveAspectRatio="xMidYMid meet">${buildReportRoutePathMarkup(transform)}${buildReportDecisionPointMarkup(transform)}${buildReportNumberedPressurePointMarkup(transform, reportData?.routePressurePoints || [])}</svg>`,
    };
  }

  function getReportHeatCells(viewMode) {
    const playback = getReportPlayback();
    const heatState = playback?.heat || state.scenario?.heat || null;
    return getFinalHeatCells(heatState, getReportTraceSnapshots(), getSafeViewMode(viewMode), getTraceRevealRadiusMeters(getSafeViewMode(viewMode)));
  }

  function getReportHeatCellColor(viewMode, metric, minMetric, maxMetric) {
    const style = HEATMAP_VIEW_STYLES[getSafeViewMode(viewMode)] || HEATMAP_VIEW_STYLES.default;
    const ratio = maxMetric > minMetric ? clamp((Number(metric || 0) - minMetric) / (maxMetric - minMetric), 0, 1) : clamp(Number(metric || 0) / 100, 0, 1);
    return rgbToCss(samplePaletteRgb(ratio, style.colorStops || DEFAULT_HEAT_COLOR_STOPS));
  }

  function getReportHeatCellKey(cell) {
    return `${Number(cell?.x || 0).toFixed(2)}:${Number(cell?.y || 0).toFixed(2)}`;
  }

  function clusterReportHighHeatCells(cells, options = {}) {
    const sourceCells = Array.isArray(cells) ? cells.filter((cell) => Number.isFinite(Number(cell?.x)) && Number.isFinite(Number(cell?.y))) : [];
    if (!sourceCells.length) {
      return [];
    }
    const cellSize = Math.max(0.2, Number(state.prepared?.grid?.cellSize || 1.15));
    const linkDistance = Math.max(cellSize * 1.85, Number(options.linkDistance || 0));
    const linkDistanceSquared = linkDistance * linkDistance;
    const bucketSize = Math.max(linkDistance, cellSize);
    const buckets = new Map();
    const getBucketKey = (x, y) => `${Math.floor(x / bucketSize)}:${Math.floor(y / bucketSize)}`;
    sourceCells.forEach((cell, index) => {
      const key = getBucketKey(Number(cell.x || 0), Number(cell.y || 0));
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(index);
    });
    const visited = new Set();
    const regions = [];
    sourceCells.forEach((cell, startIndex) => {
      if (visited.has(startIndex)) {
        return;
      }
      const queue = [startIndex];
      const regionCells = [];
      visited.add(startIndex);
      while (queue.length) {
        const currentIndex = queue.shift();
        const current = sourceCells[currentIndex];
        regionCells.push(current);
        const bucketX = Math.floor(Number(current.x || 0) / bucketSize);
        const bucketY = Math.floor(Number(current.y || 0) / bucketSize);
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            const neighborIndexes = buckets.get(`${bucketX + dx}:${bucketY + dy}`) || [];
            neighborIndexes.forEach((neighborIndex) => {
              if (visited.has(neighborIndex)) {
                return;
              }
              const neighbor = sourceCells[neighborIndex];
              const distanceSquared = (Number(neighbor.x || 0) - Number(current.x || 0)) ** 2
                + (Number(neighbor.y || 0) - Number(current.y || 0)) ** 2;
              if (distanceSquared <= linkDistanceSquared) {
                visited.add(neighborIndex);
                queue.push(neighborIndex);
              }
            });
          }
        }
      }
      let weightedX = 0;
      let weightedY = 0;
      let weightSum = 0;
      let peakCell = regionCells[0];
      regionCells.forEach((regionCell) => {
        const metric = Math.max(0.001, Number(regionCell.metric || 0));
        weightedX += Number(regionCell.x || 0) * metric;
        weightedY += Number(regionCell.y || 0) * metric;
        weightSum += metric;
        if (Number(regionCell.metric || 0) > Number(peakCell.metric || 0)) {
          peakCell = regionCell;
        }
      });
      const averageMetric = regionCells.reduce((sum, regionCell) => sum + Number(regionCell.metric || 0), 0) / Math.max(1, regionCells.length);
      regions.push({
        cells: regionCells,
        area: regionCells.length,
        peakCell,
        labelPoint: {
          x: weightSum > 0 ? weightedX / weightSum : Number(peakCell.x || 0),
          y: weightSum > 0 ? weightedY / weightSum : Number(peakCell.y || 0),
        },
        averageMetric,
        peakMetric: Number(peakCell.metric || 0),
      });
    });
    return regions
      .sort((left, right) => Number(right.area || 0) - Number(left.area || 0) || Number(right.peakMetric || 0) - Number(left.peakMetric || 0))
      .map((region, index) => ({ ...region, index: index + 1 }));
  }

  function getReportHighHeatRegions(viewMode, options = {}) {
    const cells = getReportHeatCells(viewMode)
      .filter((cell) => Number(cell.metric || 0) > 0);
    if (!cells.length) {
      return [];
    }
    const metricValues = getSortedNumericValues(cells.map((cell) => Number(cell.metric || 0)));
    const threshold = sampleQuantile(metricValues, 1 - REPORT_HIGH_HEAT_TOP_PERCENT);
    const highCells = cells.filter((cell) => Number(cell.metric || 0) >= threshold);
    return clusterReportHighHeatCells(highCells, options).slice(0, Number(options.maxRegions || REPORT_DETAIL_HIGH_REGION_LIMIT));
  }

  function getReportVitalitySurgeRegions(options = {}) {
    const segments = buildVitalityRibbonSegments(getReportTraceSnapshots())
      .filter((segment) => (
        Number.isFinite(Number(segment?.previous?.x))
        && Number.isFinite(Number(segment?.previous?.y))
        && Number.isFinite(Number(segment?.current?.x))
        && Number.isFinite(Number(segment?.current?.y))
      ));
    if (segments.length < 2) {
      return [];
    }
    const candidates = [];
    for (let index = 1; index < segments.length; index += 1) {
      const previousSegment = segments[index - 1];
      const currentSegment = segments[index];
      const previousWidth = Math.max(0, Number(previousSegment.growthRateNormalized || 0));
      const currentWidth = Math.max(0, Number(currentSegment.growthRateNormalized || 0));
      const widthSurge = Math.max(0, currentWidth - previousWidth);
      if (widthSurge > 0.015) {
        const previous = currentSegment.previous;
        const current = currentSegment.current;
        candidates.push({
          cells: [previous, current],
          area: 1,
          peakCell: current,
          labelPoint: {
            x: (Number(previous.x || 0) + Number(current.x || 0)) * 0.5,
            y: (Number(previous.y || 0) + Number(current.y || 0)) * 0.5,
          },
          averageMetric: widthSurge,
          peakMetric: widthSurge,
        });
      }
    }
    if (!candidates.length) {
      segments
        .filter((segment) => Number(segment.growthRateNormalized || 0) > 0)
        .forEach((segment) => {
          const previous = segment.previous;
          const current = segment.current;
          candidates.push({
            cells: [previous, current],
            area: 1,
            peakCell: current,
            labelPoint: {
              x: (Number(previous.x || 0) + Number(current.x || 0)) * 0.5,
              y: (Number(previous.y || 0) + Number(current.y || 0)) * 0.5,
            },
            averageMetric: Number(segment.growthRateNormalized || 0),
            peakMetric: Number(segment.growthRateNormalized || 0),
          });
        });
    }
    const minSpacing = Math.max(2, Number(state.prepared?.grid?.cellSize || 1.15) * 4);
    const selected = [];
    candidates
      .sort((left, right) => Number(right.peakMetric || 0) - Number(left.peakMetric || 0))
      .forEach((candidate) => {
        if (selected.length >= Number(options.maxRegions || REPORT_DETAIL_HIGH_REGION_LIMIT)) {
          return;
        }
        const tooClose = selected.some((item) => (
          Math.hypot(Number(item.labelPoint.x || 0) - Number(candidate.labelPoint.x || 0), Number(item.labelPoint.y || 0) - Number(candidate.labelPoint.y || 0)) < minSpacing
        ));
        if (!tooClose) {
          selected.push(candidate);
        }
      });
    return selected.map((region, index) => ({ ...region, index: index + 1, vitalitySurge: true }));
  }

  function getReportRegionCells(regions = []) {
    return regions.flatMap((region) => Array.isArray(region.cells) ? region.cells : []);
  }

  function pointInsideReportRegion(point, regionCells = [], cellSize = 1.15) {
    if (!point || !regionCells.length) {
      return false;
    }
    const radius = Math.max(cellSize * 1.65, 1.2);
    const px = Number(point.x || 0);
    const py = Number(point.y || 0);
    return regionCells.some((cell) => (
      Math.hypot(px - Number(cell.x || 0), py - Number(cell.y || 0)) <= radius
    ));
  }

  function aggregateReportRegionPressureContributions(region, pressurePoints = [], viewMode = COMPOSITE_BURDEN_VIEW) {
    const regionCells = Array.isArray(region?.cells) ? region.cells : [];
    if (!regionCells.length || !Array.isArray(pressurePoints) || !pressurePoints.length) {
      return [];
    }
    const cellSize = Math.max(0.2, Number(state.prepared?.grid?.cellSize || 1.15));
    const pressureById = new Map(pressurePoints.map((item) => [String(item.id || '').trim(), item]));
    const safeViewMode = getSafeViewMode(viewMode);
    const aggregate = new Map();
    getReportPressureContributionLog().forEach((entry) => {
      const id = String(entry?.pressurePointId || entry?.id || '').trim();
      const pressurePoint = pressureById.get(id);
      if (!id || !pressurePoint) {
        return;
      }
      const normalizedBurdenType = getSafeViewMode(entry?.burdenType || '');
      if (safeViewMode !== COMPOSITE_BURDEN_VIEW && normalizedBurdenType !== safeViewMode) {
        return;
      }
      const entryPoint = {
        x: Number(entry?.x ?? entry?.position?.x ?? entry?.worldPosition?.x),
        y: Number(entry?.y ?? entry?.position?.y ?? entry?.worldPosition?.y),
      };
      if (!Number.isFinite(entryPoint.x) || !Number.isFinite(entryPoint.y) || !pointInsideReportRegion(entryPoint, regionCells, cellSize)) {
        return;
      }
      const previous = aggregate.get(id) || {
        ...pressurePoint,
        regionContribution: 0,
        regionCount: 0,
      };
      previous.regionContribution += Math.max(0, Number(entry.contribution || entry.score || 0));
      previous.regionCount += 1;
      aggregate.set(id, previous);
    });
    return Array.from(aggregate.values())
      .sort((left, right) => Number(right.regionContribution || 0) - Number(left.regionContribution || 0));
  }

  function getReportRegionInfluencingPressurePoints(region, pressurePoints = [], viewMode = COMPOSITE_BURDEN_VIEW) {
    return aggregateReportRegionPressureContributions(region, pressurePoints, viewMode);
  }

  function getReportNodeLabel(node) {
    return node?.label || node?.name || node?.semanticId || node?.id || 'node';
  }

  function getReportNodeKind(node) {
    const raw = `${node?.semanticId || ''} ${node?.type || ''} ${node?.category || ''} ${node?.id || ''}`.toLowerCase();
    if (/elev|电梯/.test(raw)) return 'elevator';
    if (/es_|escalator|扶梯/.test(raw)) return 'escalator';
    if (/stair|楼梯/.test(raw)) return 'stair';
    if (/gate|exit|entry|出入口|入口|出口/.test(raw)) return 'gate';
    if (/platform|boarding|乘车/.test(raw)) return 'boarding';
    return 'node';
  }

  function getReportNodeKindLabel(kind, locale = getReportLocale()) {
    const zh = locale !== 'en';
    const labels = {
      elevator: zh ? '电梯节点' : 'Elevator node',
      escalator: zh ? '扶梯节点' : 'Escalator node',
      stair: zh ? '楼梯节点' : 'Stair node',
      gate: zh ? '出入口节点' : 'Entry/exit node',
      boarding: zh ? '乘车点节点' : 'Boarding node',
      node: zh ? '空间节点' : 'Spatial node',
    };
    return labels[kind] || labels.node;
  }

  function getReportNodeInfluenceColor(kind) {
    const colors = {
      elevator: '#396a9f',
      escalator: '#4b8f7a',
      stair: '#7a6aa8',
      gate: '#4f5960',
      boarding: '#b27a2a',
      node: '#60707b',
    };
    return colors[kind] || colors.node;
  }

  function getReportRouteNodeInfluenceIndex(locale = getReportLocale()) {
    const nodes = Array.isArray(state.prepared?.nodes) ? state.prepared.nodes : [];
    const traceSnapshots = getReportTraceSnapshots();
    const candidates = nodes
      .map((node) => {
        const kind = getReportNodeKind(node);
        const routeDistance = reportDistanceToTrace(node, traceSnapshots);
        const relevant = kind !== 'node' || routeDistance <= 3.5;
        return {
          id: node.id || node.semanticId || getReportNodeLabel(node),
          node,
          sourceType: 'node',
          sourceNumber: 0,
          name: getReportNodeLabel(node),
          categoryLabel: getReportNodeKindLabel(kind, locale),
          color: getReportNodeInfluenceColor(kind),
          x: Number(node.x || 0),
          y: Number(node.y || 0),
          kind,
          routeDistance,
          relevant,
        };
      })
      .filter((item) => item.relevant && Number.isFinite(item.routeDistance))
      .sort((left, right) => Number(left.routeDistance || 0) - Number(right.routeDistance || 0))
      .slice(0, 48)
      .map((item, index) => ({
        ...item,
        sourceNumber: index + 1,
        displayNumber: `N${index + 1}`,
      }));
    return {
      items: candidates,
      byId: new Map(candidates.map((item) => [String(item.id), item])),
    };
  }

  function getReportRegionSnapshots(region) {
    const regionCells = Array.isArray(region?.cells) ? region.cells : [];
    if (!regionCells.length) {
      return [];
    }
    const cellSize = Math.max(0.2, Number(state.prepared?.grid?.cellSize || 1.15));
    return getReportTraceSnapshots().filter((snapshot) => pointInsideReportRegion(snapshot, regionCells, cellSize * 1.15));
  }

  function averageReportSnapshotValue(snapshots, keys = []) {
    const values = snapshots
      .map((snapshot) => {
        for (const key of keys) {
          const value = Number(snapshot?.[key]);
          if (Number.isFinite(value)) {
            return value;
          }
        }
        return NaN;
      })
      .filter((value) => Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function getReportAreaInfluenceLabel(id, locale = getReportLocale()) {
    const zh = locale !== 'en';
    const labels = {
      crowd_density: zh ? '局部人群密度' : 'Local crowd density',
      queue_spillover: zh ? '排队/等待外溢' : 'Queue spillover',
      slow_walking: zh ? '步速下降' : 'Reduced walking speed',
      decision_delay: zh ? '决策迟滞' : 'Decision delay',
      fatigue_growth: zh ? '疲劳快速增长' : 'Fatigue growth',
      narrow_passage: zh ? '窄通道/贴边通行' : 'Narrow passage',
      vertical_transfer: zh ? '垂直交通转换' : 'Vertical transfer',
      noise_environment: zh ? '区域噪音水平' : 'Area noise level',
      lighting_environment: zh ? '区域照度舒适度' : 'Area lighting comfort',
    };
    return labels[id] || (zh ? '区域影响因素' : 'Area influence factor');
  }

  function getReportAreaInfluenceReason(id, value, locale = getReportLocale()) {
    const zh = locale !== 'en';
    const formatted = Number.isFinite(Number(value)) ? formatReportMetric(value) : '';
    const reasons = {
      crowd_density: zh ? `热区附近人群密度偏高` : `crowd density is elevated near this hot zone`,
      queue_spillover: zh ? `等待或排队状态在该段叠加` : `waiting or queueing accumulates in this segment`,
      slow_walking: zh ? `代理人步速在该段下降` : `agent walking speed drops in this segment`,
      decision_delay: zh ? `代理人在该段决策迟滞上升` : `decision delay increases in this segment`,
      fatigue_growth: zh ? `疲劳值或疲劳增长速度上升` : `fatigue value or fatigue growth rises`,
      narrow_passage: zh ? `贴边或窄通道行为增强` : `wall-following or narrow-passage behaviour increases`,
      vertical_transfer: zh ? `垂直交通转换增加行动/决策成本` : `vertical transfer raises movement or decision cost`,
      noise_environment: zh ? `区域噪音水平提高` : `area noise level increases`,
      lighting_environment: zh ? `照度偏离舒适范围` : `lighting deviates from the comfort range`,
    };
    return formatted ? `${reasons[id] || getReportAreaInfluenceLabel(id, locale)} (${formatted})` : (reasons[id] || getReportAreaInfluenceLabel(id, locale));
  }

  function buildReportAreaInfluenceSource(id, contribution, point, value, locale = getReportLocale()) {
    return {
      id: `area:${id}`,
      sourceType: 'area',
      sourceNumber: 0,
      displayNumber: '',
      name: getReportAreaInfluenceLabel(id, locale),
      categoryLabel: locale === 'en' ? 'Area factor' : '区域因素',
      color: '#d25f52',
      x: Number(point?.x || 0),
      y: Number(point?.y || 0),
      contribution: Number(Math.max(0, contribution || 0).toFixed(3)),
      regionContribution: Number(Math.max(0, contribution || 0).toFixed(3)),
      reasonLabel: getReportAreaInfluenceReason(id, value, locale),
      value: Number.isFinite(Number(value)) ? Number(Number(value).toFixed(3)) : null,
    };
  }

  function getReportRegionAreaInfluenceSources(region, viewMode = COMPOSITE_BURDEN_VIEW, locale = getReportLocale()) {
    const snapshots = getReportRegionSnapshots(region);
    const point = region?.labelPoint || region?.peakCell || {};
    const safeViewMode = getSafeViewMode(viewMode);
    const sources = [];
    const crowdDensity = averageReportSnapshotValue(snapshots, ['crowdDensity', 'crowdDensityLocal']);
    const queueCount = averageReportSnapshotValue(snapshots, ['queueCount']);
    const walkingSpeed = averageReportSnapshotValue(snapshots, ['walkingSpeed', 'currentWalkingSpeed']);
    const decisionDelay = averageReportSnapshotValue(snapshots, ['decisionDelay']);
    const fatigue = averageReportSnapshotValue(snapshots, ['fatiguePercent', 'fatigue']);
    const noise = averageReportSnapshotValue(snapshots, ['environmentNoise', 'noiseLevel']);
    const lighting = averageReportSnapshotValue(snapshots, ['environmentLighting', 'lightingLevel']);
    const movementCauses = snapshots.map((snapshot) => String(snapshot?.movementMainCause || '')).join(' ');
    if (crowdDensity > 0.65 && [COMPOSITE_BURDEN_VIEW, 'locomotor', 'sensory', 'cognitive', 'psychological'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('crowd_density', crowdDensity * 18, point, crowdDensity, locale));
    }
    if (queueCount > 0.8 && [COMPOSITE_BURDEN_VIEW, 'locomotor', 'cognitive', 'psychological'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('queue_spillover', queueCount * 5.5, point, queueCount, locale));
    }
    if (walkingSpeed > 0 && walkingSpeed < 0.78 && [COMPOSITE_BURDEN_VIEW, 'locomotor', 'vitality'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('slow_walking', (0.78 - walkingSpeed) * 55, point, walkingSpeed, locale));
    }
    if (decisionDelay > 1.05 && [COMPOSITE_BURDEN_VIEW, 'cognitive', 'psychological'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('decision_delay', (decisionDelay - 1.05) * 24, point, decisionDelay, locale));
    }
    if ((fatigue > 45 || region?.vitalitySurge) && [COMPOSITE_BURDEN_VIEW, 'vitality'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('fatigue_growth', Math.max(fatigue / 4, Number(region?.peakMetric || 0) * 80), point, fatigue, locale));
    }
    if (/narrow|obstacle|wall/.test(movementCauses) && [COMPOSITE_BURDEN_VIEW, 'locomotor'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('narrow_passage', 18, point, 1, locale));
    }
    if (noise > 58 && [COMPOSITE_BURDEN_VIEW, 'sensory', 'cognitive', 'psychological', 'vitality'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('noise_environment', (noise - 55) * 1.25, point, noise, locale));
    }
    const lightingDeviation = Math.max((250 - lighting) / 35, (lighting - 800) / 120, 0);
    if (lightingDeviation > 0 && [COMPOSITE_BURDEN_VIEW, 'sensory', 'cognitive', 'psychological', 'vitality'].includes(safeViewMode)) {
      sources.push(buildReportAreaInfluenceSource('lighting_environment', lightingDeviation * 10, point, lighting, locale));
    }
    return sources
      .filter((item) => Number(item.regionContribution || item.contribution || 0) > 0.5)
      .sort((left, right) => Number(right.regionContribution || right.contribution || 0) - Number(left.regionContribution || left.contribution || 0));
  }

  function getReportRegionNodeInfluenceSources(region, viewMode = COMPOSITE_BURDEN_VIEW, locale = getReportLocale()) {
    const nodeIndex = getReportRouteNodeInfluenceIndex(locale);
    const regionCells = Array.isArray(region?.cells) ? region.cells : [];
    if (!regionCells.length || !nodeIndex.items.length) {
      return [];
    }
    const cellSize = Math.max(0.2, Number(state.prepared?.grid?.cellSize || 1.15));
    const safeViewMode = getSafeViewMode(viewMode);
    return nodeIndex.items
      .map((item) => {
        const inside = pointInsideReportRegion(item, regionCells, cellSize * 1.5);
        const distanceToLabel = Math.hypot(Number(item.x || 0) - Number(region?.labelPoint?.x || 0), Number(item.y || 0) - Number(region?.labelPoint?.y || 0));
        const nearby = distanceToLabel <= 7.5;
        if (!inside && !nearby) {
          return null;
        }
        const verticalWeight = ['elevator', 'escalator', 'stair'].includes(item.kind) ? 1.25 : 0.75;
        const viewWeight = safeViewMode === 'locomotor' || safeViewMode === 'vitality'
          ? 1.25
          : safeViewMode === 'cognitive'
            ? 1.05
            : safeViewMode === COMPOSITE_BURDEN_VIEW
              ? 0.95
              : 0.55;
        const proximity = inside ? 1 : clamp(1 - distanceToLabel / 8, 0, 1);
        const contribution = proximity * verticalWeight * viewWeight * 18;
        return {
          ...item,
          regionContribution: Number(contribution.toFixed(3)),
          contribution: Number(contribution.toFixed(3)),
          reasonLabel: locale === 'en'
            ? `${item.categoryLabel} is close to this hot zone and may affect route choice, transfer, queueing, or movement speed.`
            : `${item.categoryLabel}靠近该高热区，可能影响路线选择、换乘、排队或通行速度。`,
        };
      })
      .filter(Boolean)
      .filter((item) => Number(item.regionContribution || 0) > 2)
      .sort((left, right) => Number(right.regionContribution || 0) - Number(left.regionContribution || 0))
      .slice(0, 6);
  }

  function numberReportAreaInfluenceSources(sources = []) {
    return sources.map((source, index) => ({
      ...source,
      sourceNumber: index + 1,
      displayNumber: `A${index + 1}`,
    }));
  }

  function numberReportInfluenceSourceGroups(groups = []) {
    let areaIndex = 0;
    return groups.map((group) => ({
      ...group,
      sources: (group.sources || []).map((source) => {
        if (source?.sourceType !== 'area') {
          return source;
        }
        areaIndex += 1;
        return {
          ...source,
          id: `${source.id}:${group.index}`,
          sourceNumber: areaIndex,
          displayNumber: `A${areaIndex}`,
        };
      }),
    }));
  }

  function getReportRegionInfluenceSources(region, pressurePoints = [], viewMode = COMPOSITE_BURDEN_VIEW, locale = getReportLocale()) {
    const pressureSources = getReportRegionInfluencingPressurePoints(region, pressurePoints, viewMode)
      .map((point) => ({
        ...point,
        sourceType: 'pressure',
        displayNumber: String(point.reportPressureNumber || point.pressureNumber || ''),
        reasonLabel: point.reasonLabel || point.description || point.categoryLabel || point.name,
      }));
    const nodeSources = getReportRegionNodeInfluenceSources(region, viewMode, locale);
    const areaSources = getReportRegionAreaInfluenceSources(region, viewMode, locale);
    return [...pressureSources, ...nodeSources, ...areaSources]
      .sort((left, right) => Number(right.regionContribution || right.contribution || 0) - Number(left.regionContribution || left.contribution || 0))
      .slice(0, 10);
  }

  function getUniqueReportInfluenceSources(sourceGroups = []) {
    const unique = new Map();
    sourceGroups.flatMap((group) => Array.isArray(group?.sources) ? group.sources : []).forEach((source) => {
      const key = `${source?.sourceType || 'pressure'}:${source?.id || source?.name || source?.displayNumber || ''}`;
      if (key && !unique.has(key)) {
        unique.set(key, source);
      }
    });
    return Array.from(unique.values()).sort((left, right) => (
      Number(right.regionContribution || right.contribution || 0) - Number(left.regionContribution || left.contribution || 0)
    ));
  }

  function getUniqueReportPressurePoints(pressureGroups = []) {
    const unique = new Map();
    pressureGroups.flatMap((group) => Array.isArray(group?.points) ? group.points : []).forEach((point) => {
      if (point?.id && !unique.has(point.id)) {
        unique.set(point.id, point);
      }
    });
    return Array.from(unique.values()).sort((left, right) => (
      Number(right.regionContribution || right.contribution || 0) - Number(left.regionContribution || left.contribution || 0)
    ));
  }

  function buildCompositeRegionContributionRankings(region, locale = getReportLocale()) {
    const regionCells = Array.isArray(region?.cells) ? region.cells : [];
    if (!regionCells.length) {
      return [];
    }
    const regionKeys = new Set(regionCells.map(getReportHeatCellKey));
    const cellBurdenFallbacks = regionCells
      .map((cell) => cell?.burdenScores)
      .filter(Boolean);
    return FIVE_DIMENSION_ORDER.map((viewMode) => {
      const dimensionCells = getReportHeatCells(viewMode).filter((cell) => regionKeys.has(getReportHeatCellKey(cell)));
      const values = dimensionCells
        .map((cell) => Number(cell.metric || 0))
        .filter((value) => Number.isFinite(value));
      if (!values.length && cellBurdenFallbacks.length) {
        cellBurdenFallbacks.forEach((scores) => {
          const value = Number(getBurdenMetricFromScores(scores, viewMode));
          if (Number.isFinite(value)) {
            values.push(value);
          }
        });
      }
      const score = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
      return {
        id: viewMode,
        burdenLabel: getDimensionBurdenLabel(viewMode, locale),
        burdenScore: score,
      };
    }).sort((left, right) => Number(right.burdenScore || 0) - Number(left.burdenScore || 0));
  }

  function getReportIssuePoint(item) {
    const explicitPoint = getReportTimelineExplicitPoint(item);
    if (explicitPoint) {
      return explicitPoint;
    }
    const targetIds = [
      item?.mapTargetId,
      item?.targetId,
      item?.id,
      ...(Array.isArray(item?.mapTargetIds) ? item.mapTargetIds : []),
    ].filter(Boolean);
    for (const targetId of targetIds) {
      const node = state.prepared?.nodeById?.[targetId];
      if (node) {
        return node;
      }
      const pressure = (state.prepared?.activePressureObjects || []).find((object) => object?.id === targetId);
      if (pressure) {
        return pressure;
      }
    }
    return null;
  }

  function getReportRegionDescriptor(region, locale = getReportLocale()) {
    const point = region?.labelPoint || region?.peakCell || null;
    if (!point) {
      return locale === 'en' ? 'this route segment' : '该路线段';
    }
    const progressValues = (Array.isArray(region?.cells) ? region.cells : [])
      .map((cell) => Number(cell?.progress))
      .filter((value) => Number.isFinite(value));
    if (progressValues.length) {
      const averageProgress = progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length;
      if (locale === 'en') {
        if (averageProgress < 0.33) return 'the early route segment';
        if (averageProgress < 0.67) return 'the middle route segment';
        return 'the late route segment';
      }
      if (averageProgress < 0.33) return '路线前段';
      if (averageProgress < 0.67) return '路线中段';
      return '路线后段';
    }
    const x = Number(point.x || 0).toFixed(1);
    const y = Number(point.y || 0).toFixed(1);
    return locale === 'en' ? `around (${x}, ${y})` : `坐标(${x}, ${y})附近`;
  }

  function getReportRegionIntensity(region, locale = getReportLocale()) {
    const peak = Number(region?.peakMetric || 0);
    const average = Number(region?.averageMetric || 0);
    const value = Math.max(peak, average);
    if (!Number.isFinite(value) || value <= 0) {
      return locale === 'en' ? 'elevated' : '偏高';
    }
    if (value >= 80) return locale === 'en' ? 'very high' : '很高';
    if (value >= 60) return locale === 'en' ? 'high' : '较高';
    return locale === 'en' ? 'noticeable' : '明显';
  }

  function buildEvidenceBasedRegionIssueAdvice(region, viewMode, locale = getReportLocale(), regionPressurePoints = []) {
    const zh = locale !== 'en';
    const index = region?.index || 1;
    const dominantSource = Array.isArray(regionPressurePoints) && regionPressurePoints.length ? regionPressurePoints[0] : null;
    const sourceName = dominantSource?.name || '';
    const regionDescriptor = getReportRegionDescriptor(region, locale);
    const regionIntensity = getReportRegionIntensity(region, locale);
    const sourceText = buildReportInfluenceSourceCauseText(regionPressurePoints, locale);
    if (viewMode === 'sensory') {
      return {
        index,
        title: zh
          ? `高热区${index}在${regionDescriptor}出现${regionIntensity}感知负担，主要与${sourceText}有关。`
          : `Hot zone ${index} shows ${regionIntensity} perception burden in ${regionDescriptor}, mainly associated with ${sourceText}.`,
        advice: zh
          ? `优先复核${sourceName || '该区域'}的亮度、噪音、朝向、遮挡和信息密度，降低突兀刺激并保留必要识别信息。`
          : `Review ${sourceName || 'this area'} for brightness, noise, orientation, occlusion, and information density; reduce abrupt stimulus while keeping essential cues readable.`,
        peakMetric: Number(region?.peakMetric || 0),
      };
    }
    if (viewMode === 'cognitive') {
      return {
        index,
        title: zh
          ? `高热区${index}在${regionDescriptor}需要反复确认方向，${sourceText}提高了决策负担。`
          : `Hot zone ${index} requires repeated route confirmation in ${regionDescriptor}; ${sourceText} raises decision burden.`,
        advice: zh
          ? `在该段补强与目的地直接相关的连续导向，削弱干扰性标识层级，避免代理人在同一点重复比较路线。`
          : `Strengthen destination-relevant continuous guidance here and reduce competing sign hierarchy so the agent does not repeatedly compare route options at the same point.`,
        peakMetric: Number(region?.peakMetric || 0),
      };
    }
    if (viewMode === 'psychological') {
      return {
        index,
        title: zh
          ? `高热区${index}在${regionDescriptor}形成${regionIntensity}心理压力，触发源集中在${sourceText}。`
          : `Hot zone ${index} forms ${regionIntensity} psychological stress in ${regionDescriptor}, with the strongest trigger around ${sourceText}.`,
        advice: zh
          ? `降低该点的不确定感：减少突发刺激，补足可连续确认的导向信息，并让下一步行动选择更清晰。`
          : `Lower uncertainty here by reducing abrupt stressors, adding continuous confirmation cues, and making the next action choice clearer.`,
        peakMetric: Number(region?.peakMetric || 0),
      };
    }
    if (viewMode === 'locomotor') {
      return {
        index,
        title: zh
          ? `高热区${index}在${regionDescriptor}出现移动阻力，${sourceText}附近的通过效率下降。`
          : `Hot zone ${index} shows movement friction in ${regionDescriptor}; passage efficiency drops around ${sourceText}.`,
        advice: zh
          ? `优先检查该段净宽、排队外溢和转向空间，必要时调整设施位置或分流路线。`
          : `Check clear width, queue spillover, and turning space here; adjust facility position or split flows where needed.`,
        peakMetric: Number(region?.peakMetric || 0),
      };
    }
    if (viewMode === 'vitality') {
      return {
        index,
        title: zh
          ? `高热区${index}在${regionDescriptor}疲劳带突然变宽，单位距离疲劳增长加快。`
          : `Hot zone ${index} has a sudden widening of the fatigue ribbon in ${regionDescriptor}, meaning fatigue rises faster per metre.`,
        advice: zh
          ? `复核这段的绕行、坡度/垂直交通、拥挤和休息点间距；若${sourceName ? `受${sourceName}影响，` : ''}建议缩短连续步行或补充短暂停留点。`
          : `Review detours, level changes, crowding, and rest spacing here; ${sourceName ? `because ${sourceName} contributes, ` : ''}shorten continuous walking or add a short recovery point.`,
        peakMetric: Number(region?.peakMetric || 0),
      };
    }
    return {
      index,
      title: zh
        ? `高热区${index}在${regionDescriptor}负担${regionIntensity}。`
        : `Hot zone ${index} has ${regionIntensity} burden in ${regionDescriptor}.`,
      advice: zh
        ? '结合该区域的压力点排序优先处理贡献最高的设施或环境因素。'
        : 'Use the stressor ranking for this region to prioritize the highest-contributing facility or environmental factor.',
      peakMetric: Number(region?.peakMetric || 0),
    };
  }

  function buildSingleBurdenRegionIssueAdvice(region, viewMode, locale = getReportLocale(), regionPressurePoints = []) {
    const evidenceAdvice = buildEvidenceBasedRegionIssueAdvice(region, viewMode, locale, regionPressurePoints);
    if (viewMode === 'vitality' && region?.vitalitySurge) {
      return evidenceAdvice;
    }
    const issueItems = getVisualizationDetailIssuePanelState(viewMode).items || [];
    let matchedIssue = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    issueItems.forEach((item) => {
      const point = getReportIssuePoint(item);
      if (!point || !region?.labelPoint) {
        return;
      }
      const distance = Math.hypot(Number(point.x || 0) - Number(region.labelPoint.x || 0), Number(point.y || 0) - Number(region.labelPoint.y || 0));
      if (distance < bestDistance) {
        bestDistance = distance;
        matchedIssue = item;
      }
    });
    const fallbackIssue = issueItems[Math.max(0, Number(region?.index || 1) - 1)] || issueItems[0] || null;
    const issue = matchedIssue || fallbackIssue;
    const title = evidenceAdvice.title || issue?.title || issue?.summary || issue?.name || issue?.label || getDimensionBurdenLabel(viewMode, locale);
    const advice = evidenceAdvice.advice || issue?.advice || issue?.suggestion || getSuggestionByCategory(issue?.category || issue?.categoryId || viewMode);
    return {
      index: region?.index || 1,
      title,
      advice,
      peakMetric: Number(region?.peakMetric || 0),
    };
  }

  function parseReportColorToRgb(color, fallbackRgb = [218, 68, 64]) {
    const value = String(color || '').trim();
    const hex = /^#?([0-9a-f]{6})$/i.exec(value);
    if (hex) {
      const raw = hex[1];
      return [
        parseInt(raw.slice(0, 2), 16),
        parseInt(raw.slice(2, 4), 16),
        parseInt(raw.slice(4, 6), 16),
      ];
    }
    const rgb = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(value);
    if (rgb) {
      return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((component, index) => (
        Number.isFinite(component) ? clamp(Math.round(component), 0, 255) : fallbackRgb[index]
      ));
    }
    return fallbackRgb;
  }

  function createReportHeatRasterDataUrl(viewMode, cells, transform, options = {}) {
    if (typeof document === 'undefined' || !transform || !Array.isArray(cells) || !cells.length) {
      return '';
    }
    const safeViewMode = getSafeViewMode(viewMode);
    const traceSnapshots = getReportTraceSnapshots();
    const heatmapStyle = HEATMAP_VIEW_STYLES[safeViewMode] || HEATMAP_VIEW_STYLES.default;
    const rasterCells = cells;
    if (!rasterCells.length) {
      return '';
    }
    const localMetricValues = getReportHeatCells(safeViewMode)
      .map((cell) => Number(cell.metric || 0))
      .filter((value) => Number.isFinite(value));
    const localMetricMin = localMetricValues.length ? Math.min(...localMetricValues) : 0;
    const localMetricMax = localMetricValues.length ? Math.max(...localMetricValues) : 0;
    const highRgb = parseReportColorToRgb(options.highColor, samplePaletteRgb(1, heatmapStyle.colorStops || DEFAULT_HEAT_COLOR_STOPS));
    const rasterStyle = options.highOnly
      ? {
          ...heatmapStyle,
          colorStops: [
            { stop: 0, rgb: highRgb },
            { stop: 1, rgb: highRgb },
          ],
        }
      : heatmapStyle;
    const heatDisplayProfile = options.highOnly ? null : buildHeatDisplayProfile(localMetricValues, heatmapStyle);
    const width = Math.max(1, Math.round(transform.width || 0));
    const height = Math.max(1, Math.round(transform.height || 0));
    const heatSurface = document.createElement('canvas');
    const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
    heatSurface.width = Math.max(1, Math.round(width * dpr));
    heatSurface.height = Math.max(1, Math.round(height * dpr));
    const ctx = heatSurface.getContext('2d');
    if (!ctx) {
      return '';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const sourceSurface = safeViewMode === 'vitality' && !options.highOnly
      ? createVitalityRibbonRaster(traceSnapshots, transform, localMetricMin, localMetricMax, dpr)
      : createHeatFieldRasterLegacy(rasterCells, localMetricMin, localMetricMax, rasterStyle, transform, safeViewMode);
    if (!sourceSurface) {
      return '';
    }
    const corridorMask = safeViewMode !== 'vitality' && !options.highOnly
      ? createHeatRevealMaskRaster(traceSnapshots, transform, getTraceRevealRadiusMeters(safeViewMode), dpr)
      : null;
    ctx.save();
    clipHeatmapToWalkableArea(ctx, transform);
    paintHeatSurface(ctx, sourceSurface, width, height, corridorMask);
    clearHeatmapObstacles(ctx, transform);
    ctx.restore();
    return heatSurface.toDataURL('image/png');
  }

  function buildReportHeatMapSvg(viewMode, options = {}) {
    const transform = computeTransformForViewportSize(options.width || 520, options.height || 300);
    const highRegions = options.highOnly
      ? (Array.isArray(options.highRegions) ? options.highRegions : getReportHighHeatRegions(viewMode))
      : [];
    const cells = options.highOnly ? getReportRegionCells(highRegions) : getReportHeatCells(viewMode);
    const rasterDataUrl = options.highOnly && getSafeViewMode(viewMode) === 'vitality'
      ? ''
      : createReportHeatRasterDataUrl(viewMode, cells, transform, options);
    const heatMarkup = rasterDataUrl
      ? `<img class="report-heat-raster" src="${escapeHtml(rasterDataUrl)}" alt="" />`
      : '';
    const highLabels = options.highOnly
      ? buildReportHighHeatLabels(viewMode, transform, { ...options, highRegions })
      : '';
    const routeMarkup = options.showRoutePath === false ? '' : buildReportRoutePathMarkup(transform);
    const influenceMarkup = Array.isArray(options.influenceSources)
      ? buildReportNumberedInfluenceSourceMarkup(transform, options.influenceSources)
      : buildReportNumberedPressurePointMarkup(transform, options.pressurePoints || []);
    const overlaySvg = `<svg viewBox="${transform.viewBox.x} ${transform.viewBox.y} ${transform.viewBox.width} ${transform.viewBox.height}" preserveAspectRatio="xMidYMid meet">${highLabels}${routeMarkup}${influenceMarkup}</svg>`;
    return `${heatMarkup}${overlaySvg}`;
  }

  function buildReportHighHeatLabels(viewMode, transform, options = {}) {
    const regions = Array.isArray(options.highRegions) ? options.highRegions : getReportHighHeatRegions(viewMode);
    return regions.slice(0, 8).map((region) => {
      const point = worldToDisplayPoint(region.labelPoint || region.peakCell, transform);
      const circle = region.vitalitySurge ? `<circle cx="${point.x}" cy="${point.y}" r="${worldRadiusForPixels(18, transform)}"></circle>` : '';
      return `<g class="report-high-label${region.vitalitySurge ? ' report-high-label--vitality' : ''}">${circle}<text x="${point.x}" y="${point.y}">${region.index}</text></g>`;
    }).join('');
  }

  function buildReportHeatmapCards(locale = getReportLocale()) {
    const copy = buildReportExportCopy(locale);
    return BURDEN_VIEW_ORDER.map((viewMode) => {
      const style = HEATMAP_VIEW_STYLES[getSafeViewMode(viewMode)] || HEATMAP_VIEW_STYLES.default;
      const range = getViewMetricRange(viewMode);
      const legend = style.legend || HEATMAP_VIEW_STYLES.default.legend;
      return {
        id: viewMode,
        title: getDimensionBurdenLabel(viewMode, locale),
        description: getVisualizationViewDescription(viewMode),
        min: Number(range.minMetric || range.min || 0),
        max: Number(range.maxMetric || range.max || 0),
        minLabel: `${copy.minBurden}: ${formatReportMetric(range.minMetric || range.min || 0)}`,
        maxLabel: `${copy.maxBurden}: ${formatReportMetric(range.maxMetric || range.max || 0)}`,
        legendLow: locale === 'en' ? legend.lowEn : legend.lowZh,
        legendHigh: locale === 'en' ? legend.highEn : legend.highZh,
        legendNote: locale === 'en' ? legend.widthNoteEn : legend.widthNoteZh,
        legendGradient: buildHeatLegendGradient(style),
        mapSvg: buildReportHeatMapSvg(viewMode, { showRoutePath: false }),
      };
    });
  }

  function buildReportDetailBurdenCards(locale = getReportLocale()) {
    const copy = buildReportExportCopy(locale);
    const pressurePoints = buildReportRoutePressurePoints(locale);
    return BURDEN_VIEW_ORDER.map((viewMode) => {
      const isCompositeSummary = viewMode === COMPOSITE_BURDEN_VIEW;
      const style = HEATMAP_VIEW_STYLES[getSafeViewMode(viewMode)] || HEATMAP_VIEW_STYLES.default;
      const topColor = rgbToCss(samplePaletteRgb(1, style.colorStops || DEFAULT_HEAT_COLOR_STOPS));
      const highRegions = viewMode === 'vitality' ? getReportVitalitySurgeRegions() : getReportHighHeatRegions(viewMode);
      const regionPressurePoints = highRegions.map((region) => ({
        index: region.index,
        points: getReportRegionInfluencingPressurePoints(region, pressurePoints, viewMode),
      }));
      let regionInfluenceSources = highRegions.map((region) => ({
        index: region.index,
        sources: getReportRegionInfluenceSources(region, pressurePoints, viewMode, locale),
      }));
      regionInfluenceSources = numberReportInfluenceSourceGroups(regionInfluenceSources);
      const mapPressurePoints = getUniqueReportPressurePoints(regionPressurePoints);
      const mapInfluenceSources = getUniqueReportInfluenceSources(regionInfluenceSources);
      const regionRankings = isCompositeSummary
        ? highRegions.map((region) => ({
            index: region.index,
            ranking: buildCompositeRegionContributionRankings(region, locale),
            peakMetric: Number(region.peakMetric || 0),
          }))
        : [];
      const regionIssues = isCompositeSummary
        ? []
        : highRegions.map((region) => buildSingleBurdenRegionIssueAdvice(
            region,
            viewMode,
            locale,
            regionInfluenceSources.find((group) => Number(group.index) === Number(region.index))?.sources || []
          ));
      const issues = isCompositeSummary
        ? []
        : (regionIssues.length
          ? regionIssues.map((item) => ({
              index: item.index,
              text: item.title,
              advice: item.advice,
            }))
          : [{ index: null, text: copy.noHighHeat, advice: '' }]);
      return {
        id: viewMode,
        title: getDimensionBurdenLabel(viewMode, locale),
        mapSvg: buildReportHeatMapSvg(viewMode, {
          highOnly: true,
          width: 860,
          height: 400,
          highRegions,
          highColor: viewMode === COMPOSITE_BURDEN_VIEW ? 'rgba(218, 68, 64, 0.72)' : topColor,
          influenceSources: mapInfluenceSources,
        }),
        ranking: buildDimensionSummaryEntries(
          state.scenario?.focusAgent?.profile?.capacityScores || state.focusProfile?.capacityScores || DEFAULT_CAPACITY_SCORES,
          state.scenario?.summary?.averageBurdens || {},
          locale
        ).sort((left, right) => Number(right.burdenScore || 0) - Number(left.burdenScore || 0)),
        highRegions,
        regionRankings: isCompositeSummary ? regionRankings : [],
        regionIssues: isCompositeSummary ? [] : regionIssues,
        regionPressurePoints: regionPressurePoints,
        regionInfluenceSources,
        missedSignageItems: viewMode === 'sensory' ? pressurePoints.filter((item) => item.missedSignage) : [],
        issues,
        pressurePoints: mapPressurePoints,
        influenceSources: mapInfluenceSources,
      };
    });
  }

  function buildRouteReportInputSnapshot({ locale, dimensionSummary }) {
    return {
      routeText: `${getReportStartLabel(locale)} ${buildReportExportCopy(locale).routeArrow} ${getReportTargetLabel(locale)}`,
      backgroundCrowd: getBackgroundCrowdCount(),
      dimensionSummary,
    };
  }

  function buildRouteReportExecutiveSummary(reportData, locale = getReportLocale()) {
    return buildRouteReportFindings(reportData.summary, reportData.hotspots, reportData.risk, locale);
  }

  function buildRouteReportBurdenSimulation(locale = getReportLocale()) {
    return buildReportSimulationParameterRows(locale);
  }

  function buildRouteReportPressureCategoryAnalysis(routePressurePoints = []) {
    const grouped = new Map();
    routePressurePoints.forEach((item) => {
      const key = item.categoryId || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, {
          categoryId: key,
          categoryLabel: item.categoryLabel || key,
          color: item.color || '#7ea4c1',
          items: [],
        });
      }
      grouped.get(key).items.push(item);
    });
    return Array.from(grouped.values());
  }

  function buildSharedRouteAnalysisLlmInput({ reportData }) {
    const detailBurdenCards = (reportData?.detailBurdenCards || []).map((card) => ({
      id: card.id,
      title: card.title,
      regions: (card.regionRankings || card.regionIssues || []).slice(0, 3).map((region) => ({
        index: region.index,
        ranking: Array.isArray(region.ranking) ? region.ranking.slice(0, 5) : [],
        title: region.title || region.text || '',
        advice: region.advice || '',
      })),
      pressurePoints: (card.regionPressurePoints || []).map((group) => ({
        index: group.index,
        points: (group.points || []).slice(0, 5).map((point) => ({
          number: point.reportPressureNumber || point.pressureNumber,
          name: point.name,
          category: point.categoryLabel || point.categoryId,
          contribution: Number(point.regionContribution || point.contribution || 0),
        })),
      })),
      influenceSources: (card.regionInfluenceSources || []).map((group) => ({
        index: group.index,
        sources: (group.sources || []).slice(0, 8).map((source) => ({
          number: source.displayNumber || source.reportPressureNumber || source.pressureNumber || source.sourceNumber,
          sourceType: source.sourceType || 'pressure',
          name: source.name,
          category: source.categoryLabel || source.categoryId,
          reasonLabel: source.reasonLabel || source.description || '',
          contribution: Number(source.regionContribution || source.contribution || 0),
        })),
      })),
    }));
    return {
      requestedFrontReport: {
        purpose: 'Generate the single front summary page after the report cover.',
        requiredSections: [
          'route judgement',
          'core route problems',
          'key modification content',
          'spatial model changes',
          'priority modification areas and facilities',
          'expected impact',
        ],
        constraints: [
          'Use specific route, burden, hot-zone, and numbered pressure-point evidence.',
          'Only refer to stressors by the supplied global pressure-point numbers.',
          'Use labels such as Composite hot zone 1, Decision hot zone 1, or Perception hot zone 2. Do not use ambiguous Zone labels.',
          'Explain what should be changed in the spatial model, where it is located, and what burden it is expected to reduce.',
          'Avoid vague advice such as optimize layout, improve guidance, or review facilities unless paired with a concrete object and action.',
          'Write evidence-dense professional diagnosis, not generic score restatement.',
          'Do not invent new route geometry, formulas, heatmap values, nodes, or pressure points.',
        ],
      },
      requestedReportAdjustment: {
        purpose: 'Generate intelligent model adjustment recommendations for the exported report only.',
        requiredSections: ['route score interpretation', 'spatial model changes', 'priority modification areas', 'priority facilities'],
        constraints: [
          'Base every recommendation on the supplied simulation evidence.',
          'Mention pressure-point numbers when recommending facilities.',
          'Only use global pressure-point numbers from globalPressurePointRanking.',
          'Use hot-zone labels from hotZoneEvidence and never invent new zone names.',
          'Avoid repeating the same generic wording for every facility.',
          'Do not invent new route geometry, formulas, or heatmap values.',
        ],
      },
      route: reportData?.route,
      summary: reportData?.summary,
      routeScoreSummary: reportData?.routeScoreSummary || null,
      inputSnapshot: reportData?.inputSnapshot || null,
      modelSpaceInfo: reportData?.modelSpaceInfo || null,
      dimensionSummary: reportData?.dimensionSummary || [],
      detailBurdenCards,
      routePressurePoints: (reportData?.routePressurePoints || []).slice(0, 12).map((point) => ({
        number: point.reportPressureNumber || point.pressureNumber,
        name: point.name,
        category: point.categoryLabel || point.categoryId,
        description: point.description,
        contribution: Number(point.contribution || 0),
        color: point.color,
        burdenTypes: point.burdenTypes || [],
      })),
      globalPressurePointRanking: (reportData?.routePressurePoints || []).slice(0, 16).map((point) => ({
        number: point.reportPressureNumber || point.pressureNumber,
        name: point.name,
        category: point.categoryLabel || point.categoryId,
        color: point.color,
        contribution: Number(point.contribution || 0),
        burdenTypes: point.burdenTypes || [],
      })),
      hotZoneEvidence: (reportData?.detailBurdenCards || []).map((card) => ({
        burdenId: card.id,
        burdenTitle: card.title,
        regions: (card.highRegions || []).slice(0, 3).map((region) => ({
          index: region.index,
          label: `${card.title} hot zone ${region.index}`,
          burdenRanking: (card.regionRankings || []).find((item) => Number(item.index) === Number(region.index))?.ranking || [],
          issue: (card.regionIssues || []).find((item) => Number(item.index) === Number(region.index)) || null,
          regionPressurePoints: (card.regionPressurePoints || [])
            .find((group) => Number(group.index) === Number(region.index))?.points
            ?.slice(0, 6)
            .map((point) => ({
              number: point.reportPressureNumber || point.pressureNumber,
              name: point.name,
              category: point.categoryLabel || point.categoryId,
              contribution: Number(point.regionContribution || point.contribution || 0),
              burdenTypes: point.burdenTypes || [],
            })) || [],
          influenceSources: (card.regionInfluenceSources || [])
            .find((group) => Number(group.index) === Number(region.index))?.sources
            ?.slice(0, 8)
            .map((source) => ({
              number: source.displayNumber || source.reportPressureNumber || source.pressureNumber || source.sourceNumber,
              sourceType: source.sourceType || 'pressure',
              name: source.name,
              category: source.categoryLabel || source.categoryId,
              reasonLabel: source.reasonLabel || source.description || '',
              contribution: Number(source.regionContribution || source.contribution || 0),
            })) || [],
        })),
      })),
      pressureCategorySummary: reportData?.pressureCategorySummary || [],
    };
  }

  function buildRouteAnalysisLlmOutput({ provider, sections }) {
    return { provider, sections: Array.isArray(sections) ? sections : [] };
  }

  function getRouteAnalysisProviderState(locale = getReportLocale()) {
    return {
      label: locale === 'en' ? 'Local report export' : '本地报告导出',
      status: locale === 'en' ? 'Report generated from current simulation state' : '报告基于当前模拟状态生成',
    };
  }

  function buildRouteAnalysisLlmSections({ reportData, locale = getReportLocale() }) {
    return [
      {
        title: reportT('llmAnalysisTitle', null, locale),
        body: reportData?.findings?.join(' ') || reportT('llmAnalysisPlaceholder', null, locale),
      },
    ];
  }

  function buildReportRouteScoreSummary(dimensionSummary = [], locale = getReportLocale()) {
    const scores = (Array.isArray(dimensionSummary) ? dimensionSummary : [])
      .map((item) => ({
        id: item.id,
        label: item.burdenLabel || getDimensionBurdenLabel(item.id, locale),
        burdenScore: clamp(Number(item.burdenScore || 0), 0, 100),
      }));
    const overallBurdenScore = scores.length
      ? scores.reduce((sum, item) => sum + item.burdenScore, 0) / scores.length
      : 0;
    const routeFriendlyScore = clamp(100 - overallBurdenScore, 0, 100);
    const level = overallBurdenScore >= 75
      ? (locale === 'en' ? 'High burden' : '高负担')
      : overallBurdenScore >= 55
        ? (locale === 'en' ? 'Medium-high burden' : '中高负担')
        : overallBurdenScore >= 35
          ? (locale === 'en' ? 'Medium burden' : '中等负担')
          : (locale === 'en' ? 'Low burden' : '低负担');
    return {
      overallBurdenScore: Number(overallBurdenScore.toFixed(1)),
      routeFriendlyScore: Number(routeFriendlyScore.toFixed(1)),
      level,
      dimensions: scores.map((item) => ({
        ...item,
        burdenScore: Number(item.burdenScore.toFixed(1)),
      })),
    };
  }

  function getReportBurdenLevel(score = 0, locale = getReportLocale()) {
    const value = clamp(Number(score || 0), 0, 100);
    const level = REPORT_BURDEN_LEVEL_STOPS.find((item) => value <= item.max) || REPORT_BURDEN_LEVEL_STOPS[REPORT_BURDEN_LEVEL_STOPS.length - 1];
    return {
      ...level,
      label: locale === 'en' ? level.en : level.zh,
    };
  }

  function buildSharedRouteAnalysisSnapshot(locale = getReportLocale()) {
    const localLocale = locale === 'en' ? 'en' : 'zh-CN';
    const copy = buildReportExportCopy(locale);
    const summary = state.scenario?.summary || {};
    const hotspots = getReportHotspots().map((item, index) => ({
      ...item,
      rank: index + 1,
      categoryLabel: tForLocale(locale, `categories.${item.category || 'unknown'}`),
      advice: getSuggestionByCategoryText(item.category, locale),
      pressure: Number(item.pressure || item.score || 0),
    }));
    const risk = getRouteReportRiskSummary(summary, hotspots, locale);
    const focusCapacityScores = state.scenario?.focusAgent?.profile?.capacityScores || state.focusProfile?.capacityScores || DEFAULT_CAPACITY_SCORES;
    const dimensionSummary = buildDimensionSummaryEntries(focusCapacityScores, summary.averageBurdens, locale);
    const routeScoreSummary = buildReportRouteScoreSummary(dimensionSummary, locale);
    const routePressurePoints = buildReportRoutePressurePoints(locale);
    const pressureCategoryAnalysis = buildRouteReportPressureCategoryAnalysis(routePressurePoints);
    const pressureCategorySummary = pressureCategoryAnalysis;
    const sharedReportData = {
      locale,
      copy,
      route: { startLabel: getReportStartLabel(locale), targetLabel: getReportTargetLabel(locale) },
      summary: {
        simultaneousCount: Number(summary.simultaneousCount || 0),
        activePressureCount: Number(summary.activePressureCount || 0),
        averageTravelTime: Number(summary.averageTravelTime || 0),
        averageFatigue: Number(summary.averageFatigue || 0),
        averageHeat: Number(summary.averageHeat || 0),
        averageBurdens: summary.averageBurdens || {},
      },
      hotspots,
      risk,
      dimensionSummary,
      routeScoreSummary,
      pressureCategorySummary,
    };
    const llmInput = buildSharedRouteAnalysisLlmInput({ reportData: sharedReportData });
    const defaultLlmAnalysis = buildRouteAnalysisLlmOutput({
      provider: getRouteAnalysisProviderState(localLocale),
      sections: buildRouteAnalysisLlmSections({ reportData: sharedReportData, locale }),
    });
    let llmAnalysis = defaultLlmAnalysis;
    return {
      executiveSummary: buildRouteReportExecutiveSummary(sharedReportData, locale),
      inputSnapshot: buildRouteReportInputSnapshot({ locale, dimensionSummary }),
      burdenSimulation: buildRouteReportBurdenSimulation(locale),
      pressureCategoryAnalysis,
      pressureCategorySummary,
      llmInput,
      llmAnalysis,
      placeholderTitle: reportT('llmAnalysisTitle', null, locale),
      placeholder: reportT('llmAnalysisPlaceholder', null, locale),
      placeholderSub: reportT('llmAnalysisPlaceholderSub', null, locale),
    };
  }

  function buildRouteReportData(locale = getReportLocale()) {
    if (!state.prepared || !state.scenario?.heatActive || !state.routeSelection.startPoint || !state.routeSelection.targetRegionId) {
      throw new Error(reportT('emptyPreview', null, locale));
    }
    const copy = buildReportExportCopy(locale);
    const sharedSnapshot = buildSharedRouteAnalysisSnapshot(locale);
    const summary = state.scenario.summary || {};
    const hotspots = getReportHotspots().map((item, index) => ({
      ...item,
      rank: index + 1,
      categoryLabel: tForLocale(locale, `categories.${item.category || 'unknown'}`),
      advice: getSuggestionByCategoryText(item.category, locale),
      pressure: Number(item.pressure || item.score || 0),
    }));
    const risk = getRouteReportRiskSummary(summary, hotspots, locale);
    const focusCapacityScores = state.scenario?.focusAgent?.profile?.capacityScores || {};
    const dimensionSummary = buildDimensionSummaryEntries(
      focusCapacityScores,
      summary.averageBurdens,
      locale === 'en' ? 'en' : 'zh-CN'
    );
    const routeScoreSummary = buildReportRouteScoreSummary(dimensionSummary, locale);
    const peakDimension = dimensionSummary.slice().sort((left, right) => right.burdenScore - left.burdenScore)[0] || null;
    const activeViewLabel = locale === 'en' ? 'Active View' : '当前视图';
    const capacityScores = state.focusProfile?.capacityScores || state.scenario?.focusAgent?.profile?.capacityScores || DEFAULT_CAPACITY_SCORES;
    const agentFigureUrl = getSettingsAgentPreviewFigureImageUrl(capacityScores);
    const agentRadarSvg = buildAgentRadarSvg({ capacityScores }, locale, {
      getLabel: getDimensionDisplayName,
      showHitTargets: false,
      handleRadius: 5,
      activeHandleRadius: 5,
      layout: {
        radius: 126,
        labelRadius: 186,
      },
    });
    const agentAttributes = buildDimensionSummaryEntries(capacityScores, summary.averageBurdens, locale)
      .map((item) => ({
        ...item,
        description: getDimensionAgentSettingDescription(item.id, item.capacityScore, locale),
      }));
    const routePressurePoints = buildReportRoutePressurePoints(locale);
    const reportData = {
      locale,
      copy,
      activeViewLabel,
      title: reportT('title', null, locale),
      projectName: getDisplayFileName(),
      modelSource: state.modelSourceName || reportT('localModel', null, locale),
      generatedAt: new Date().toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', { hour12: false }),
      activeView: {
        id: getSafeViewMode(state.viewMode),
        label: getDimensionBurdenLabel(getSafeViewMode(state.viewMode), locale === 'en' ? 'en' : 'zh-CN'),
      },
      route: {
        startLabel: getReportStartLabel(locale),
        targetLabel: getReportTargetLabel(locale),
      },
      agent: {
        capacitySummary: buildDimensionSummaryEntries(state.focusProfile?.capacityScores || DEFAULT_CAPACITY_SCORES, {}, locale)
          .map((item) => `${item.capacityLabel}${item.capacityScore}`)
          .join(' · '),
      },
      crowd: {
        backgroundCount: getBackgroundCrowdCount(),
      },
      summary: {
        simultaneousCount: Number(summary.simultaneousCount || 0),
        activePressureCount: Number(summary.activePressureCount || 0),
        averageTravelTime: Number(summary.averageTravelTime || 0),
        averageFatigue: Number(summary.averageFatigue || 0),
        averageHeat: Number(summary.averageHeat || 0),
        averageBurdens: summary.averageBurdens || {},
      },
      dimensionSummary,
      routeScoreSummary,
      peakDimension,
      hotspots,
      risk,
      findings: buildRouteReportFindings(summary, hotspots, risk, locale),
      recommendations: buildRouteReportRecommendations(summary, hotspots, locale),
      sharedSnapshot,
      modelSpaceInfo: buildReportModelSpaceInfo(locale),
      inputSnapshot: sharedSnapshot.inputSnapshot,
      simulationParameterRows: buildReportSimulationParameterRows(locale),
      thoughtChainItems: buildReportThoughtChainItems(locale),
      routePressurePoints,
      pressureCategoryAnalysis: buildRouteReportPressureCategoryAnalysis(routePressurePoints),
      pressureCategorySummary: buildRouteReportPressureCategoryAnalysis(routePressurePoints),
      heatmapCards: buildReportHeatmapCards(locale),
      detailBurdenCards: buildReportDetailBurdenCards(locale),
      agentFigureUrl,
      agentRadarSvg,
      agentAttributes,
      llmInput: sharedSnapshot.llmInput,
      llmAnalysis: state.reportModal?.llmAnalysis || sharedSnapshot.llmAnalysis,
    };
    reportData.llmInput = buildSharedRouteAnalysisLlmInput({ reportData });
    reportData.thoughtMapSnapshot = buildReportThoughtMapSnapshot(reportData, locale);
    return reportData;
  }

  function buildRouteReportSummaryMarkup(reportData) {
    const copy = reportData.copy || getReportCopy(reportData.locale);
    const hotspotMarkup = reportData.hotspots.length
      ? reportData.hotspots.slice(0, 2).map((item) => `
          <div class="report-hotspot-mini">
            <strong>#${item.rank} ${escapeHtml(item.name || item.id)}</strong>
            <div class="report-hotspot-meta">${escapeHtml(item.categoryLabel)} · ${escapeHtml(copy.cognitiveLoad)} ${escapeHtml(formatReportMetric(item.pressure))}</div>
          </div>
        `).join('')
      : `<div class="report-summary-card"><div class="support-text">${escapeHtml(copy.noHotspots)}</div></div>`;
    const findingMarkup = reportData.findings.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    return `
      <div class="report-summary-card">
        <div class="report-summary-title">${escapeHtml(copy.conclusion)}</div>
        <div class="report-risk-row">
          <span class="report-risk-badge ${escapeHtml(reportData.risk.className)}">${escapeHtml(reportData.risk.level)}</span>
          <span class="support-text">${escapeHtml(reportData.risk.summary)}</span>
        </div>
      </div>
      <div class="report-summary-card">
        <div class="report-summary-title">${escapeHtml(copy.snapshot)}</div>
        <div class="report-summary-grid">
          <div class="report-kv">
            <span class="label">${escapeHtml(copy.start)}</span>
            <strong>${escapeHtml(reportData.route.startLabel)}</strong>
          </div>
          <div class="report-kv">
            <span class="label">${escapeHtml(copy.target)}</span>
            <strong>${escapeHtml(reportData.route.targetLabel)}</strong>
          </div>
          <div class="report-kv">
            <span class="label">${escapeHtml(copy.averageTravelTime)}</span>
            <strong>${escapeHtml(formatReportDuration(reportData.summary.averageTravelTime, reportData.locale))}</strong>
          </div>
          <div class="report-kv">
            <span class="label">${escapeHtml(copy.backgroundCrowd)}</span>
            <strong>${escapeHtml(formatReportNumber(reportData.crowd.backgroundCount, 0))} ${escapeHtml(copy.peopleUnit)}</strong>
          </div>
          <div class="report-kv">
            <span class="label">${escapeHtml(reportData.activeViewLabel)}</span>
            <strong>${escapeHtml(reportData.activeView.label)}</strong>
          </div>
        </div>
      </div>
      <div class="report-summary-card">
        <div class="report-summary-title">${escapeHtml(copy.dimensionSnapshot)}</div>
        ${buildDimensionReportMarkup(reportData)}
      </div>
      <ol class="report-summary-list">${findingMarkup}</ol>
      ${hotspotMarkup}
    `;
  }

  function buildReportModelRowsMarkup(reportData) {
    const copy = reportData.copy;
    return (reportData.modelSpaceInfo?.rows || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${row.color ? `<span class="report-swatch" style="background:${escapeHtml(row.color)}"></span>` : ''}${escapeHtml(row.label)}</td>
        <td>${escapeHtml(formatReportNumber(row.count, 0))}</td>
      </tr>
    `).join('') || `<tr><td colspan="3">${escapeHtml(copy.noDimensionData)}</td></tr>`;
  }

  function buildReportSimulationRowsMarkup(reportData) {
    return (reportData.simulationParameterRows || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(row.min)}</td>
        <td>${escapeHtml(row.max)}</td>
      </tr>
    `).join('');
  }

  function buildReportAgentAttributesMarkup(reportData) {
    return (reportData.agentAttributes || []).map((item) => `
      <div class="report-attribute-card" style="--attribute-color:${escapeHtml(getAgentPreviewScoreColor(item.capacityScore))}">
        <div class="report-attribute-score">${escapeHtml(formatReportNumber(item.capacityScore, 0))}</div>
        <div class="report-attribute-content">
          <strong>${escapeHtml(item.capacityLabel)}</strong>
          <p>${escapeHtml(item.description || item.capacityScoreLabel || '')}</p>
        </div>
      </div>
    `).join('');
  }

  function buildReportThoughtFlowMarkup(reportData) {
    const copy = reportData.copy;
    const items = Array.isArray(reportData.thoughtChainItems) ? reportData.thoughtChainItems : [];
    if (!items.length) {
      return `<div class="report-empty">${escapeHtml(copy.noThoughtChain)}</div>`;
    }
    return items.map((item, index) => `
      <span class="report-thought-step">${escapeHtml(item)}</span>${index < items.length - 1 ? '<span class="report-thought-arrow">→</span>' : ''}
    `).join('');
  }

  function buildReportNumberedPressureGroupsMarkup(reportData) {
    const copy = reportData.copy;
    const groups = Array.isArray(reportData.pressureCategoryAnalysis) ? reportData.pressureCategoryAnalysis : [];
    if (!groups.length) {
      return `<div class="report-empty">${escapeHtml(copy.noPressurePoints)}</div>`;
    }
    return groups.map((group) => `
      <div class="report-pressure-group">
        <div class="report-pressure-group-title"><span class="report-swatch" style="background:${escapeHtml(group.color)}"></span>${escapeHtml(group.categoryLabel)}</div>
        <table class="report-pressure-table">
          <tbody>
            ${group.items.map((item) => `
              <tr>
                <td class="report-pressure-table__name">${buildReportPressurePointReferenceMarkup(item)}</td>
                <td class="report-pressure-table__desc">${escapeHtml(item.description || '--')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');
  }

  function buildReportMethodNoteMarkup(reportData) {
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const methodLabel = locale === 'en' ? 'Method note' : '方法说明';
    const body = locale === 'en'
      ? 'This report is generated from the current route simulation. The system samples the agent state along the actual walking trajectory and combines environmental stressors, crowd density, walking speed, fatigue change, and decision latency to calculate burden heatmaps. High-heat regions use the top 20% burden values in the current heatmap, clustered spatially, with the three largest regions shown. Influence rankings combine effective stressor contribution records with nearby facility nodes and regional factors such as crowding, queueing, slow walking, decision delay, fatigue growth, noise, and lighting.'
      : '本报告基于当前路线模拟结果生成。系统沿代理人实际轨迹采样通行状态，并结合环境压力点、人群密度、步行速度、疲劳变化与决策迟滞计算各类负担热力。高热区取当前热力图负担值最高的20%区域，并按空间连续性聚类后展示面积最大的三个区域。影响源排序综合目标代理人的压力点贡献记录、邻近设施节点，以及人群密度、排队、步速下降、决策迟滞、疲劳增长、噪音和照度等区域因素。';
    return `
      <div class="report-method-note">
        <p><strong>${escapeHtml(methodLabel)}:</strong> ${escapeHtml(body)}</p>
      </div>
    `;
  }

  function buildReportHeatmapCardsMarkup(reportData) {
    return (reportData.heatmapCards || []).map((card) => `
      <article class="report-heat-card">
        <div class="report-heat-stage" style="aspect-ratio:520 / 300;">
          <div class="report-map-layer report-map-layer--base">${buildReportBaseSvg(computeTransformForViewportSize(520, 300))}</div>
          <div class="report-map-layer report-map-layer--heat">${card.mapSvg}</div>
          <div class="report-heat-header">${escapeHtml(card.title)}</div>
          <div class="report-heat-legend">
            <div class="report-heat-legend-gradient" style="background:${escapeHtml(card.legendGradient)}"></div>
            <div class="report-heat-legend-labels"><span>${escapeHtml(card.legendLow || '')}</span><span>${escapeHtml(card.legendHigh || '')}</span></div>
            ${card.legendNote ? `<div class="report-heat-legend-note">${escapeHtml(card.legendNote)}</div>` : ''}
          </div>
        </div>
        <div class="report-heat-stats">
          <span>${escapeHtml(card.maxLabel)}</span>
          <span>${escapeHtml(card.minLabel)}</span>
        </div>
        <div class="report-heat-meta"><p>${escapeHtml(card.description || '')}</p></div>
      </article>
    `).join('');
  }

  function buildReportDetailCardsMarkup(reportData) {
    const copy = reportData.copy;
    return (reportData.detailBurdenCards || []).map((card) => {
      const showIssueAdvice = card.id !== COMPOSITE_BURDEN_VIEW;
      const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
      const regionLabel = locale === 'en' ? 'Hot zone' : '高热区';
      const topIssueLabel = locale === 'en' ? 'Top issue and advice' : 'Top1问题与建议';
      const pressureLabel = copy.influenceRankingTitle || (locale === 'en' ? 'Influencing stressors ranked by contribution' : '对应影响压力点按贡献值排序');
      const missedSignageLabel = locale === 'en' ? 'Visible signs missed on this route' : '这条路线上进入视野范围但漏看的标识';
      const phenomenonLabel = locale === 'en' ? 'Pattern' : '现象';
      const causeLabel = locale === 'en' ? 'Main cause' : '主要原因';
      const adviceLabel = locale === 'en' ? 'Suggestion' : '建议';
      const expectedLabel = locale === 'en' ? 'Expected effect' : '预计影响';
      const getRegionPressurePoints = (index) => (
        (card.regionPressurePoints || []).find((group) => Number(group.index) === Number(index))?.points || []
      );
      const getRegionInfluenceSources = (index) => (
        (card.regionInfluenceSources || []).find((group) => Number(group.index) === Number(index))?.sources || getRegionPressurePoints(index)
      );
      const buildPressureRankingMarkup = (points = [], includeMissedSignage = false) => {
        const missedItems = includeMissedSignage
          ? (card.missedSignageItems || []).filter((item) => item?.missedSignage)
          : [];
        const ranking = points.slice(0, 8);
        const rankingMarkup = ranking.length
          ? ranking.map((item) => `
              <li>
                ${buildReportInfluenceSourceNumberBadge(item)}
                <span>${escapeHtml(item.name)}</span>
              </li>
            `).join('')
          : `<li class="report-detail-muted">${escapeHtml(copy.noPressurePoints)}</li>`;
        const missedMarkup = missedItems.length
          ? `<p>${escapeHtml(missedSignageLabel)}: ${buildReportPressurePointReferenceListMarkup(missedItems, 8)}</p>`
          : '';
        return `
          <div class="report-detail-region-pressure-ranking">
            <strong>${escapeHtml(pressureLabel)}</strong>
            <ol>${rankingMarkup}</ol>
            ${missedMarkup}
          </div>
        `;
      };
      const buildRegionPressureRanking = (index, includeMissedSignage = false) => {
        const points = getRegionInfluenceSources(index);
        return buildPressureRankingMarkup(points, includeMissedSignage);
      };
      const buildCompositeRegionRows = () => {
        const regions = card.regionRankings || [];
        if (!regions.length) {
          return `
            <div class="report-detail-region-row">
              <div class="report-detail-region-advice">
                <strong>${escapeHtml(copy.burdenContributionRanking)}</strong>
                <p>${card.ranking.slice(0, 5).map((item, index) => `${index + 1}. ${escapeHtml(item.burdenLabel)} ${escapeHtml(formatReportMetric(item.burdenScore))}`).join('<br />')}</p>
              </div>
              ${buildPressureRankingMarkup(card.influenceSources || card.pressurePoints || [])}
            </div>
          `;
        }
        return regions.map((region) => `
          <div class="report-detail-region-row">
            <div class="report-detail-region-advice">
              <strong>${escapeHtml(regionLabel)} ${escapeHtml(String(region.index))} · ${escapeHtml(copy.burdenContributionRanking)}</strong>
              <p>${region.ranking.slice(0, 5).map((item, index) => `${index + 1}. ${escapeHtml(item.burdenLabel)} ${escapeHtml(formatReportMetric(item.burdenScore))}`).join('<br />')}</p>
            </div>
            ${buildRegionPressureRanking(region.index)}
          </div>
        `).join('');
      };
      const buildSingleRegionRows = () => {
        const issues = card.regionIssues || [];
        if (!issues.length) {
          return (card.issues || [{ index: null, text: copy.noHighHeat, advice: '' }]).map((item) => `
            <div class="report-detail-region-row">
              <div class="report-detail-region-advice">
                <strong>${item.index ? `${escapeHtml(String(item.index))}. ` : ''}${escapeHtml(item.text || copy.noHighHeat)}</strong>
                ${item.advice ? `<p>${escapeHtml(item.advice)}</p>` : ''}
              </div>
              ${buildPressureRankingMarkup(card.pressurePoints || [], card.id === 'sensory')}
            </div>
          `).join('');
        }
        const firstIssueIndex = Number(issues[0]?.index || 0);
        return issues.map((item) => {
          const regionSources = getRegionInfluenceSources(item.index);
          return `
            <div class="report-detail-region-row">
              <div class="report-detail-region-advice">
                <strong>${escapeHtml(regionLabel)} ${escapeHtml(String(item.index))} · ${escapeHtml(topIssueLabel)}</strong>
                <p>
                  <strong>${escapeHtml(phenomenonLabel)}:</strong> ${escapeHtml(item.title)}<br />
                  <strong>${escapeHtml(causeLabel)}:</strong> ${regionSources.length ? buildReportInfluenceSourceReferenceListMarkup(regionSources, 4) : escapeHtml(card.title)}<br />
                  <strong>${escapeHtml(adviceLabel)}:</strong> ${escapeHtml(item.advice || '')}<br />
                  <strong>${escapeHtml(expectedLabel)}:</strong> ${escapeHtml(locale === 'en' ? `Reduce local ${card.title} and make this route segment easier to pass.` : `降低该区域${card.title}，提升这一段路线的通过稳定性。`)}
                </p>
              </div>
              ${buildRegionPressureRanking(item.index, card.id === 'sensory' && Number(item.index) === firstIssueIndex)}
            </div>
          `;
        }).join('');
      };
      const detailRows = showIssueAdvice ? buildSingleRegionRows() : buildCompositeRegionRows();
      return `
        <article class="report-detail-card">
          <div class="report-detail-map" style="aspect-ratio:860 / 400;">
            <div class="report-map-layer report-map-layer--base">${buildReportBaseSvg(computeTransformForViewportSize(860, 400))}</div>
            <div class="report-map-layer report-map-layer--heat">${card.mapSvg}</div>
          </div>
          <div class="report-detail-text">
            <div class="report-detail-card__title">${escapeHtml(card.title)}</div>
            <div class="report-detail-region-rows">${detailRows}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function buildReportDetailCardPagesMarkup(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    return (reportData.detailBurdenCards || []).map((card) => {
      const singleCardMarkup = buildReportDetailCardsMarkup({
        ...reportData,
        detailBurdenCards: [card],
      });
      return `
        <section class="report-page report-page--detail-single">
          <section class="report-section report-section--detail-single">
            <h2 class="report-section-title">${escapeHtml(card.title || copy.detailAnalysisTitle)}</h2>
            ${singleCardMarkup}
          </section>
        </section>
      `;
    }).join('');
  }

  function getLocalizedReportAnalysisSections(reportData) {
    const localized = localizeRouteAnalysisOutput(reportData?.llmAnalysis, reportData?.locale || getReportLocale());
    return Array.isArray(localized?.sections) ? localized.sections : [];
  }

  function getReportAdjustmentSectionBullets(sections = [], keywords = [], fallback = []) {
    const normalizedKeywords = keywords.map((item) => String(item || '').toLowerCase());
    const section = sections.find((item) => {
      const haystack = `${item.title || ''} ${item.titleZh || ''} ${item.titleEn || ''}`.toLowerCase();
      return normalizedKeywords.some((keyword) => haystack.includes(keyword));
    });
    const bullets = Array.isArray(section?.bullets) ? section.bullets : [];
    return bullets.length ? bullets : fallback;
  }

  function buildReportPressureNumberBadge(point) {
    if (!point) {
      return '';
    }
    const number = point.reportPressureNumber || point.pressureNumber || '';
    return `<span class="report-pressure-number report-pressure-number--filled" style="background:${escapeHtml(point.color || '#c9d1d8')}">${escapeHtml(String(number))}</span>`;
  }

  function buildReportPressurePointReferenceMarkup(point) {
    if (!point) {
      return '';
    }
    return `<span class="report-pressure-ref">${buildReportPressureNumberBadge(point)}<span>${escapeHtml(point.name || point.label || point.id || '')}</span></span>`;
  }

  function buildReportPressurePointReferenceListMarkup(points = [], limit = 4) {
    const items = (Array.isArray(points) ? points : []).slice(0, limit);
    if (!items.length) {
      return '';
    }
    return items.map((point) => buildReportPressurePointReferenceMarkup(point)).join(' ');
  }

  function buildReportInfluenceSourceNumberBadge(source) {
    if (!source) {
      return '';
    }
    const label = source.displayNumber
      || (source.sourceType === 'pressure' ? String(source.reportPressureNumber || source.pressureNumber || '') : String(source.sourceNumber || ''));
    return `<span class="report-pressure-number report-pressure-number--filled report-influence-number report-influence-number--${escapeHtml(source.sourceType || 'pressure')}" style="background:${escapeHtml(source.color || '#c9d1d8')}">${escapeHtml(label)}</span>`;
  }

  function buildReportInfluenceSourceReferenceMarkup(source) {
    if (!source) {
      return '';
    }
    return `<span class="report-pressure-ref report-influence-ref">${buildReportInfluenceSourceNumberBadge(source)}<span>${escapeHtml(source.name || source.categoryLabel || source.id || '')}</span></span>`;
  }

  function buildReportInfluenceSourceReferenceListMarkup(sources = [], limit = 6) {
    const items = (Array.isArray(sources) ? sources : []).slice(0, limit);
    if (!items.length) {
      return '';
    }
    return items.map((source) => buildReportInfluenceSourceReferenceMarkup(source)).join(' ');
  }

  function buildReportInfluenceSourceCauseText(sources = [], locale = getReportLocale()) {
    const primary = Array.isArray(sources) && sources.length ? sources[0] : null;
    if (!primary) {
      return locale === 'en' ? 'local route conditions' : '该区域的通行状态';
    }
    if (primary.reasonLabel) {
      return primary.reasonLabel;
    }
    if (primary.sourceType === 'node') {
      return locale === 'en'
        ? `${primary.name} and its nearby transfer, queueing, or route-choice condition`
        : `${primary.name}及其附近的换乘、排队或路线选择状态`;
    }
    return primary.name || primary.categoryLabel || (locale === 'en' ? 'the main influence source' : '主要影响源');
  }

  function buildReportFrontMarkupList(items = []) {
    return `<ol>${items.map((item) => `<li>${typeof item === 'string' ? escapeHtml(item) : item?.html || ''}</li>`).join('')}</ol>`;
  }

  function getReportHotZoneLabel(card, regionIndex, locale = getReportLocale()) {
    const safeIndex = formatReportNumber(regionIndex || 1, 0);
    if (locale === 'en') {
      return `${card?.title || getDimensionBurdenLabel(card?.id || COMPOSITE_BURDEN_VIEW, 'en')} hot zone ${safeIndex}`;
    }
    return `${card?.title || getDimensionBurdenLabel(card?.id || COMPOSITE_BURDEN_VIEW, 'zh-CN')}高热区${safeIndex}`;
  }

  function getTopRegionPressurePoints(card, regionIndex, limit = 4) {
    const points = (card?.regionPressurePoints || [])
      .find((group) => Number(group.index) === Number(regionIndex))?.points || [];
    return points.slice(0, limit);
  }

  function buildReportPressurePointActionText(point, burdenLabel, locale = getReportLocale()) {
    const zh = locale !== 'en';
    const nameRaw = `${point?.name || ''} ${point?.label || ''}`.toLowerCase();
    const categoryRaw = `${point?.categoryLabel || ''} ${point?.categoryId || ''}`.toLowerCase();
    const raw = `${nameRaw} ${point?.description || ''} ${categoryRaw}`.toLowerCase();
    if (/advert|lcd|screen|广告|屏/.test(nameRaw) || /advert|lcd|screen|广告|屏/.test(categoryRaw)) {
      return zh
        ? `降低动态/高亮展示强度和声压覆盖范围，调整朝向，避免在决策点附近同时叠加视觉闪动、噪音和导向信息竞争。`
        : `Reduce dynamic brightness, visual change intensity, and sound-pressure coverage, then adjust orientation so the display does not stack visual, noise, and wayfinding competition near decision points.`;
    }
    if (/ambassador|service|服务/.test(raw)) {
      return zh
        ? `将其从主行走线和决策停顿点旁移开，改为布置在不遮挡导向视线的侧向咨询位置，优先降低${burdenLabel || '感知与决策负担'}。`
        : `Move it away from the main walking line and decision pause point, placing it as a side consultation cue that does not compete with wayfinding, mainly reducing ${burdenLabel || 'perception and decision burden'}.`;
    }
    if (/hanging|direction|sign|guide|map|标识|导向|地图/.test(raw)) {
      return zh
        ? `合并重复方向信息，突出与本路线目的地直接相关的导向层级，并减少与下一步选择无关的标识干扰。`
        : `Merge repeated direction information, emphasize cues directly relevant to this route destination, and reduce signs that compete with the next movement choice.`;
    }
    if (/noise|sound|broadcast|噪音|广播|声音/.test(raw)) {
      return zh
        ? `降低覆盖到路线高热段的声压或调整声源朝向，避免在识别导向和转向时叠加感知压力。`
        : `Reduce sound pressure over the route hot segment or redirect the source so sensory stress does not compound wayfinding and turning.`;
    }
    return zh
      ? `按贡献排序优先复核位置、朝向、强度和影响范围，减少其对应高热区的${burdenLabel || '局部负担'}。`
      : `Review position, orientation, intensity, and influence range by contribution priority to reduce ${burdenLabel || 'local burden'} in the corresponding hot zone.`;
  }

  function buildReportFacilityAdjustmentListMarkup(items = [], pressurePoints = []) {
    const fallbackPoints = Array.isArray(pressurePoints) ? pressurePoints : [];
    return `<ol>${items.map((item, index) => {
      const point = fallbackPoints[index] || null;
      return `<li>${buildReportPressureNumberBadge(point)}<span>${escapeHtml(item)}</span></li>`;
    }).join('')}</ol>`;
  }

  function buildReportRouteScoreSummaryMarkup(routeScoreSummary, copy, locale = getReportLocale()) {
    const summary = routeScoreSummary || buildReportRouteScoreSummary([], locale);
    const dimensionText = (summary.dimensions || [])
      .map((item) => `${escapeHtml(item.label)} ${escapeHtml(formatReportMetric(item.burdenScore))}`)
      .join(' / ');
    return `
      <div class="report-adjustment-score">
        <strong>${escapeHtml(copy.routeScoreTitle)}</strong>
        <p>${escapeHtml(copy.overallBurdenScore)}: ${escapeHtml(formatReportMetric(summary.overallBurdenScore))} · ${escapeHtml(copy.routeFriendlyScore)}: ${escapeHtml(formatReportMetric(summary.routeFriendlyScore))} · ${escapeHtml(summary.level || '')}</p>
        <p>${escapeHtml(copy.fiveDimensionScore)}: ${dimensionText}</p>
      </div>
    `;
  }

  function buildFallbackFacilityAdjustmentText(point, locale = getReportLocale()) {
    const zh = locale !== 'en';
    const raw = `${point?.name || ''} ${point?.description || ''} ${point?.categoryLabel || ''} ${point?.categoryId || ''}`.toLowerCase();
    if (/sign|guide|direction|map|标识|导向|地图/.test(raw)) {
      return zh
        ? `${point.name}: 优先复核可视角度、文字层级和与目的地的连续性，减少代理人在该点反复确认方向。`
        : `${point.name}: review sight angle, text hierarchy, and continuity to the destination so the agent does not repeatedly confirm direction here.`;
    }
    if (/advert|ad|lcd|screen|广告|屏/.test(raw)) {
      return zh
        ? `${point.name}: 降低动态刺激强度或调整朝向，避免在决策点附近抢占导向信息注意力。`
        : `${point.name}: reduce dynamic stimulus intensity or adjust orientation so it does not compete with wayfinding near decision points.`;
    }
    if (/noise|sound|broadcast|噪音|广播|声音/.test(raw)) {
      return zh
        ? `${point.name}: 控制声压或播放范围，优先降低其覆盖到高热区时造成的感知与心理压力。`
        : `${point.name}: control sound pressure or coverage, especially where it overlaps hot zones and raises perception or psychological stress.`;
    }
    if (/light|lighting|lux|照明|光照|灯/.test(raw)) {
      return zh
        ? `${point.name}: 调整照度和眩光方向，使导向阅读更稳定，并减少局部感知负担。`
        : `${point.name}: adjust illuminance and glare direction to stabilize sign reading and reduce local perception burden.`;
    }
    if (/service|ambassador|服务/.test(raw)) {
      return zh
        ? `${point.name}: 优化服务点可见性和咨询动线，让代理人在不确定路段能更快获得确认。`
        : `${point.name}: improve service visibility and approach path so the agent can confirm choices faster in uncertain segments.`;
    }
    return zh
      ? `${point.name}: 按贡献排序优先复核位置、朝向和影响范围，降低其对应高热区的负担。`
      : `${point.name}: based on its contribution rank, review position, orientation, and influence range to reduce the affected hot zone.`;
  }

  function getReportLlmSummaryText(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const localized = localizeRouteAnalysisOutput(reportData?.llmAnalysis, locale);
    const summary = locale === 'en'
      ? (localized?.summaryEn || localized?.summary || localized?.placeholderEn || localized?.placeholder)
      : (localized?.summaryZh || localized?.summary || localized?.placeholderZh || localized?.placeholder);
    return String(summary || '').trim();
  }

  function getReportLlmProviderBadge(reportData, copy) {
    const provider = reportData?.llmAnalysis?.provider || {};
    const connected = provider.connected === true && Boolean(reportData?.llmAnalysis);
    const label = provider.label || (connected ? 'LLM' : copy.frontEvidenceBadge);
    return connected ? `${copy.frontLlmBadge} · ${label}` : copy.frontEvidenceBadge;
  }

  function getCompositeReportRegions(reportData) {
    const cards = Array.isArray(reportData?.detailBurdenCards) ? reportData.detailBurdenCards : [];
    const composite = cards.find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    return Array.isArray(composite?.regionRankings) ? composite.regionRankings.slice(0, REPORT_DETAIL_HIGH_REGION_LIMIT) : [];
  }

  function getDominantReportBurden(reportData) {
    const peak = reportData?.peakDimension;
    if (peak?.burdenLabel) {
      return peak;
    }
    return (Array.isArray(reportData?.dimensionSummary) ? reportData.dimensionSummary : [])
      .slice()
      .sort((left, right) => Number(right?.burdenScore || 0) - Number(left?.burdenScore || 0))[0] || null;
  }

  function getReportFrontSectionBullets(reportData, keywords = [], fallback = [], limit = 4) {
    const sections = getLocalizedReportAnalysisSections(reportData);
    return getReportAdjustmentSectionBullets(sections, keywords, fallback)
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, limit);
  }

  function buildReportFrontProblemFallback(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const regions = getCompositeReportRegions(reportData);
    const dominant = getDominantReportBurden(reportData);
    const pressurePoints = Array.isArray(reportData?.routePressurePoints) ? reportData.routePressurePoints : [];
    const problems = regions.map((region) => {
      const topBurden = region.ranking?.[0]?.burdenLabel || dominant?.burdenLabel || '';
      const topPoint = pressurePoints[0] || null;
      return zh
        ? `高热区${region.index}以${topBurden || '综合负担'}为主，${topPoint ? `与${topPoint.reportPressureNumber || topPoint.pressureNumber}号${topPoint.name}的影响叠加有关` : '需要结合后续热力图核对局部成因'}。`
        : `Hot zone ${region.index} is dominated by ${topBurden || 'composite burden'}${topPoint ? ` and is linked to stressor ${topPoint.reportPressureNumber || topPoint.pressureNumber} ${topPoint.name}` : '; review the following heatmaps for local causes'}.`;
    });
    if (problems.length) {
      return problems.slice(0, 3);
    }
    return [zh
      ? `当前路线总体负担为${formatReportMetric(reportData.routeScoreSummary?.overallBurdenScore || 0)}，主导维度为${dominant?.burdenLabel || '综合负担'}。`
      : `Overall burden is ${formatReportMetric(reportData.routeScoreSummary?.overallBurdenScore || 0)}, with ${dominant?.burdenLabel || 'composite burden'} as the dominant dimension.`];
  }

  function buildReportFrontPriorityActionFallback(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const pressurePoints = Array.isArray(reportData?.routePressurePoints) ? reportData.routePressurePoints.slice(0, 3) : [];
    if (pressurePoints.length) {
      return pressurePoints.map((point) => {
        const number = point.reportPressureNumber || point.pressureNumber || '';
        return zh
          ? `优先处理${number}号${point.name}：结合其贡献维度调整位置、朝向或强度，减少附近高热区负担。`
          : `Prioritize stressor ${number} ${point.name}: adjust its position, orientation, or intensity according to its contribution dimension.`;
      });
    }
    return [zh
      ? '优先复核综合热力图前三个高热区，先处理负担峰值最高且与路线转折或等待有关的位置。'
      : 'Prioritize the top three composite hot zones, starting from locations tied to turns, waiting, or route uncertainty.'];
  }

  function buildReportFrontSpatialFallback(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const copy = reportData.copy || buildReportExportCopy(locale);
    const routeText = reportData.inputSnapshot?.routeText || `${reportData.route?.startLabel || ''} ${copy.routeArrow} ${reportData.route?.targetLabel || ''}`;
    const dominant = getDominantReportBurden(reportData);
    return [zh
      ? `围绕 ${routeText} 的高热段调整空间组织，优先处理${dominant?.burdenLabel || '主导负担'}突出的转折、等待和垂直交通衔接位置。`
      : `Adjust the spatial organization along ${routeText}, prioritizing turns, waiting points, and vertical-circulation links where ${dominant?.burdenLabel || 'the dominant burden'} is high.`];
  }

  function buildReportFrontAreaFallback(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const regions = getCompositeReportRegions(reportData);
    return regions.length
      ? regions.map((region) => {
        const burden = region.ranking?.[0]?.burdenLabel || '';
        return zh
          ? `区域${region.index}: 以${burden || '综合负担'}为主要问题，建议作为第一轮模型修改和复测的定位区域。`
          : `Area ${region.index}: dominated by ${burden || 'composite burden'}; use it as a first-round model-edit and retest area.`;
      }).slice(0, 3)
      : buildReportFrontSpatialFallback(reportData);
  }

  function buildReportFrontImpactFallback(reportData) {
    const locale = reportData?.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const dominant = getDominantReportBurden(reportData);
    return [zh
      ? `预计优先降低${dominant?.burdenLabel || '主导负担'}，并减少高热区内的停顿、回看和路径犹豫。`
      : `Expected to first reduce ${dominant?.burdenLabel || 'the dominant burden'} and reduce stopping, looking back, and hesitation in hot zones.`];
  }

  function buildReportFrontMetricCards(reportData, copy) {
    const routeScore = reportData.routeScoreSummary || buildReportRouteScoreSummary(reportData.dimensionSummary, reportData.locale);
    const dominant = getDominantReportBurden(reportData);
    const burdenLevel = getReportBurdenLevel(routeScore.overallBurdenScore, reportData.locale);
    const metrics = [
      { label: copy.frontOverallScore, value: formatReportMetric(routeScore.overallBurdenScore || 0), note: burdenLevel.label, color: burdenLevel.color },
      { label: copy.frontFriendlyScore, value: formatReportMetric(routeScore.routeFriendlyScore || 0), note: copy.routeFriendlyScore, color: burdenLevel.color },
      { label: copy.frontDominantBurden, value: dominant?.burdenLabel || '--', note: `${formatReportMetric(dominant?.burdenScore || 0)}` },
    ];
    return metrics.map((item) => `
      <div class="report-front-metric" style="--metric-color:${escapeHtml(item.color || '#17262f')}">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
        <small>${escapeHtml(item.note)}</small>
      </div>
    `).join('');
  }

  function buildReportFrontScoreBars(reportData) {
    return (reportData.routeScoreSummary?.dimensions || []).map((item) => {
      const value = clamp(Number(item.burdenScore || 0), 0, 100);
      const level = getReportBurdenLevel(value, reportData.locale);
      const levelAdjective = String(level.label || '')
        .replace(/[()（）]/g, '')
        .replace(/\s*burden\s*/ig, '')
        .replace(/\s*负担\s*/g, '')
        .trim();
      return `
        <div class="report-front-score-row">
          <span>${escapeHtml(item.label)}</span>
          <div class="report-front-score-track"><i style="width:${escapeHtml(String(value))}%; background:${escapeHtml(level.color)}"></i></div>
          <b style="color:${escapeHtml(level.color)}"><span>${escapeHtml(formatReportMetric(value))}</span><small>${escapeHtml(levelAdjective)}</small></b>
        </div>
      `;
    }).join('');
  }

  function buildReportFrontBulletList(items = []) {
    return `<ol>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
  }

  function buildReportCoverPageMarkup(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    const coverTitleMarkup = reportData.locale === 'en'
      ? '<span>INTELLIGENT</span><span>DIAGNOSTIC REPORT</span>'
      : escapeHtml(copy.coverTitle);
    return `
      <section class="report-page report-page--cover">
        <div class="report-cover-white"></div>
        <div class="report-cover-teal"></div>
        <div class="report-cover-frame"></div>
        <div class="report-cover-bar report-cover-bar--navy"></div>
        <div class="report-cover-bar report-cover-bar--teal"></div>
        <div class="report-cover-title-block">
          <h1>${coverTitleMarkup}</h1>
          <p>${escapeHtml(copy.coverSubtitle)}</p>
        </div>
        <div class="report-cover-meta">
          <div><strong>${escapeHtml(copy.coverProjectFile)}</strong> <span>${escapeHtml(reportData.projectName)}</span></div>
          <div><strong>${escapeHtml(copy.coverExportTime)}</strong> <span>${escapeHtml(reportData.generatedAt)}</span></div>
          <div><strong>${escapeHtml(copy.coverRoute)}</strong> <span>${escapeHtml(reportData.inputSnapshot.routeText)}</span></div>
          <div><strong>${escapeHtml(copy.coverBackgroundCrowd)}</strong> <span>${escapeHtml(formatReportNumber(reportData.inputSnapshot.backgroundCrowd, 0))} ${escapeHtml(copy.people)}</span></div>
        </div>
      </section>
    `;
  }

  function buildReportFrontMapMarkup(reportData) {
    const transform = computeTransformForViewportSize(860, 330);
    const detailCards = Array.isArray(reportData.detailBurdenCards) ? reportData.detailBurdenCards : [];
    const compositeCard = detailCards.find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    const highRegions = Array.isArray(compositeCard?.highRegions) ? compositeCard.highRegions : getReportHighHeatRegions(COMPOSITE_BURDEN_VIEW);
    const pressurePoints = Array.isArray(reportData.routePressurePoints) ? reportData.routePressurePoints.slice(0, 12) : [];
    const heatMap = buildReportHeatMapSvg(COMPOSITE_BURDEN_VIEW, {
      highOnly: true,
      width: 860,
      height: 330,
      highRegions,
      highColor: 'rgba(218, 68, 64, 0.66)',
      pressurePoints,
    });
    return `
      <div class="report-map-layer report-map-layer--base">${buildReportBaseSvg(transform)}</div>
      <div class="report-map-layer report-map-layer--heat">${heatMap}</div>
    `;
  }

  function buildReportFrontHotZoneProblemItems(reportData) {
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const compositeCard = (reportData.detailBurdenCards || []).find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    const regions = Array.isArray(compositeCard?.regionRankings) ? compositeCard.regionRankings.slice(0, 3) : [];
    if (!regions.length) {
      return buildReportFrontProblemFallback(reportData).map((text) => ({ html: escapeHtml(text) }));
    }
    return regions.map((region) => {
      const label = getReportHotZoneLabel(compositeCard, region.index, locale);
      const burden = region.ranking?.[0]?.burdenLabel || reportData.peakDimension?.burdenLabel || '';
      const pressurePoints = getTopRegionPressurePoints(compositeCard, region.index, 3);
      const pressureMarkup = buildReportPressurePointReferenceListMarkup(pressurePoints, 3);
      const text = zh
        ? `${label}以${burden || '综合负担'}为主，主要由`
        : `${label} is dominated by ${burden || 'composite burden'}, mainly driven by `;
      const tail = zh
        ? (pressureMarkup ? `叠加影响。` : `路线转折、等待或导向不确定叠加影响。`)
        : (pressureMarkup ? `.` : `route turning, waiting, or wayfinding uncertainty.`);
      return {
        html: `${escapeHtml(text)}${pressureMarkup || ''}${escapeHtml(tail)}`,
      };
    });
  }

  function buildReportFrontModificationItems(reportData) {
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const compositeCard = (reportData.detailBurdenCards || []).find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    const regions = Array.isArray(compositeCard?.regionRankings) ? compositeCard.regionRankings.slice(0, 3) : [];
    const items = regions.map((region, index) => {
      const label = getReportHotZoneLabel(compositeCard, region.index, locale);
      const burden = region.ranking?.[0]?.burdenLabel || reportData.peakDimension?.burdenLabel || '';
      const point = getTopRegionPressurePoints(compositeCard, region.index, 1)[0] || null;
      const pressureMarkup = buildReportPressurePointReferenceMarkup(point);
      const action = buildReportPressurePointActionText(point, burden, locale);
      const prefix = zh
        ? `优先级${index + 1}: 修改${label}${pressureMarkup ? '中的' : '的主要压力源'}`
        : `Priority ${index + 1}: adjust the main stressor in ${label}${pressureMarkup ? ', ' : ': '}`;
      const connector = zh
        ? `。调整方式：${action}`
        : ` Adjustment: ${action}`;
      return {
        html: `${escapeHtml(prefix)}${pressureMarkup}${escapeHtml(connector)}`,
      };
    });
    if (items.length) {
      return items.slice(0, 4);
    }
    const fallbackPoints = Array.isArray(reportData.routePressurePoints) ? reportData.routePressurePoints.slice(0, 3) : [];
    return fallbackPoints.map((point) => ({
      html: `${buildReportPressurePointReferenceMarkup(point)}${escapeHtml(buildReportPressurePointActionText(point, reportData.peakDimension?.burdenLabel, locale))}`,
    }));
  }

  function buildReportFrontJudgementMarkup(reportData, fallbackSummary = '') {
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const routeScore = reportData.routeScoreSummary || buildReportRouteScoreSummary(reportData.dimensionSummary, locale);
    const burdenLevel = getReportBurdenLevel(routeScore.overallBurdenScore, locale);
    const dominant = getDominantReportBurden(reportData);
    const compositeCard = (reportData.detailBurdenCards || []).find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    const topRegion = Array.isArray(compositeCard?.regionRankings) ? compositeCard.regionRankings[0] : null;
    const hotZoneLabel = topRegion ? getReportHotZoneLabel(compositeCard, topRegion.index, locale) : '';
    const topBurden = topRegion?.ranking?.[0]?.burdenLabel || dominant?.burdenLabel || '';
    const pressureMarkup = topRegion
      ? buildReportPressurePointReferenceListMarkup(getTopRegionPressurePoints(compositeCard, topRegion.index, 3), 3)
      : buildReportPressurePointReferenceListMarkup(reportData.routePressurePoints || [], 3);
    const intro = zh
      ? `本路线友好度为${formatReportMetric(routeScore.routeFriendlyScore || 0)}，总体负担为${formatReportMetric(routeScore.overallBurdenScore || 0)}（${burdenLevel.label}），主导负担为${dominant?.burdenLabel || '--'}。`
      : `The route friendliness score is ${formatReportMetric(routeScore.routeFriendlyScore || 0)}. Overall burden is ${formatReportMetric(routeScore.overallBurdenScore || 0)} (${burdenLevel.label}), led by ${dominant?.burdenLabel || '--'}.`;
    const evidence = hotZoneLabel
      ? (zh
        ? `${hotZoneLabel}是当前最需要优先查看的位置，${topBurden || '综合负担'}贡献最高${pressureMarkup ? '，主要关联' : '。'}`
        : `${hotZoneLabel} is the first area to review; ${topBurden || 'composite burden'} contributes most${pressureMarkup ? ', mainly associated with ' : '.'}`)
      : (fallbackSummary || '');
    const tail = hotZoneLabel && pressureMarkup ? (zh ? `。` : `.`) : '';
    return `
      <p>${escapeHtml(intro)}</p>
      ${evidence ? `<p>${escapeHtml(evidence)}${pressureMarkup || ''}${escapeHtml(tail)}</p>` : ''}
    `;
  }

  function buildReportExecutiveFrontPageMarkup(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    const summaryFallback = reportData.findings?.[0] || buildReportFrontProblemFallback(reportData)[0] || '';
    const summary = getReportLlmSummaryText(reportData) || summaryFallback;
    const problems = buildReportFrontHotZoneProblemItems(reportData);
    const modifications = buildReportFrontModificationItems(reportData);
    const routeScore = reportData.routeScoreSummary || buildReportRouteScoreSummary(reportData.dimensionSummary, reportData.locale);
    const burdenLevel = getReportBurdenLevel(routeScore.overallBurdenScore, reportData.locale);
    const dominant = getDominantReportBurden(reportData);
    return `
      <section class="report-page report-page--front report-page--front-summary">
        <header class="report-front-header">
          <div>
            <h1>${escapeHtml(copy.frontExecutiveTitle)}</h1>
          </div>
        </header>
        <div class="report-front-summary-grid">
          <div class="report-front-friendliness" style="--score-color:${escapeHtml(burdenLevel.color)}">
            <h2>${escapeHtml(copy.frontFriendlyScore)}</h2>
            <div class="report-front-big-score">
              <strong>${escapeHtml(formatReportMetric(routeScore.routeFriendlyScore || 0))}</strong>
              <span>${escapeHtml(burdenLevel.label)}</span>
            </div>
            <div class="report-front-dominant">
              <h2>${escapeHtml(copy.frontDominantBurden)}</h2>
              <p>${escapeHtml(dominant?.burdenLabel || '--')}</p>
            </div>
          </div>
          <div class="report-front-right-panel">
            <section class="report-front-score-panel">
              <h3>${escapeHtml(copy.fiveDimensionScore)}</h3>
              ${buildReportFrontScoreBars(reportData)}
            </section>
            <section class="report-front-judgement">
              <h2>${escapeHtml(copy.frontRouteJudgement)}</h2>
              ${buildReportFrontJudgementMarkup(reportData, summary)}
            </section>
          </div>
        </div>
        <section class="report-front-map-panel">
          <div class="report-front-map-stage">${buildReportFrontMapMarkup(reportData)}</div>
          <p class="report-front-map-note">• ${escapeHtml(copy.frontRouteMapNote)}</p>
        </section>
        <div class="report-front-priority-grid">
          <section>
            <h2>${escapeHtml(copy.frontCoreProblems)}</h2>
            ${buildReportFrontMarkupList(problems)}
          </section>
          <section>
            <h2>${escapeHtml(copy.frontPriorityActions)}</h2>
            ${buildReportFrontMarkupList(modifications)}
          </section>
        </div>
      </section>
    `;
  }

  function buildReportAdjustmentFrontPageMarkup(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const detailCards = Array.isArray(reportData.detailBurdenCards) ? reportData.detailBurdenCards : [];
    const compositeCard = detailCards.find((card) => card.id === COMPOSITE_BURDEN_VIEW) || detailCards[0] || null;
    const baseSvg = buildReportBaseSvg(computeTransformForViewportSize(860, 400));
    const spatialItems = getReportFrontSectionBullets(reportData, ['space', 'spatial', 'model', '空间', '模型'], buildReportFrontSpatialFallback(reportData), 3);
    const areaItems = getReportFrontSectionBullets(reportData, ['area', 'region', 'hot', 'zone', '区域', '高热'], buildReportFrontAreaFallback(reportData), 3);
    const facilityFallback = (Array.isArray(reportData.routePressurePoints) ? reportData.routePressurePoints.slice(0, 4) : [])
      .map((point) => buildFallbackFacilityAdjustmentText(point, locale));
    const facilityItems = getReportFrontSectionBullets(reportData, ['facility', 'stressor', 'pressure', '设施', '压力点'], facilityFallback, 4);
    const impactItems = getReportFrontSectionBullets(reportData, ['impact', 'effect', 'expected', '预计', '改善', '影响'], buildReportFrontImpactFallback(reportData), 3);
    const pressurePoints = Array.isArray(reportData.routePressurePoints) ? reportData.routePressurePoints.slice(0, 4) : [];
    return `
      <section class="report-page report-page--front report-page--front-adjustment">
        <header class="report-front-header">
          <div>
            <p class="report-front-kicker">${escapeHtml(getReportLlmProviderBadge(reportData, copy))}</p>
            <h1>${escapeHtml(copy.frontAdjustmentTitle)}</h1>
          </div>
          <div class="report-front-meta">
            <span>${escapeHtml(copy.backgroundCrowdCount)}: ${escapeHtml(formatReportNumber(reportData.inputSnapshot.backgroundCrowd, 0))} ${escapeHtml(copy.people)}</span>
            <span>${escapeHtml(copy.frontEvidenceSource)}: ${escapeHtml(copy.pageThreeHeatTitle)} / ${escapeHtml(copy.detailAnalysisTitle)}</span>
          </div>
        </header>
        <div class="report-front-adjustment-layout">
          <div class="report-front-adjustment-map">
            <div class="report-map-layer report-map-layer--base">${baseSvg}</div>
            <div class="report-map-layer report-map-layer--heat">${compositeCard?.mapSvg || ''}</div>
          </div>
          <div class="report-front-adjustment-summary">
            <section>
              <h2>${escapeHtml(copy.frontSpatialChanges)}</h2>
              ${buildReportFrontBulletList(spatialItems)}
            </section>
            <section>
              <h2>${escapeHtml(copy.frontExpectedImpact)}</h2>
              ${buildReportFrontBulletList(impactItems)}
            </section>
          </div>
        </div>
        <div class="report-front-priority-grid">
          <section>
            <h2>${escapeHtml(copy.frontPriorityAreas)}</h2>
            ${buildReportFrontBulletList(areaItems)}
          </section>
          <section>
            <h2>${escapeHtml(copy.frontPriorityFacilities)}</h2>
            ${buildReportFacilityAdjustmentListMarkup(facilityItems, pressurePoints)}
          </section>
        </div>
      </section>
    `;
  }

  function buildReportLlmAdjustmentMarkup(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    const locale = reportData.locale === 'en' ? 'en' : 'zh-CN';
    const zh = locale !== 'en';
    const detailCards = Array.isArray(reportData.detailBurdenCards) ? reportData.detailBurdenCards : [];
    const compositeCard = detailCards.find((card) => card.id === COMPOSITE_BURDEN_VIEW) || null;
    const compositeRegions = Array.isArray(compositeCard?.regionRankings) ? compositeCard.regionRankings : [];
    const topRegion = compositeRegions[0] || null;
    const topBurden = topRegion?.ranking?.[0]?.burdenLabel || reportData.peakDimension?.burdenLabel || '';
    const routeText = reportData.inputSnapshot?.routeText || `${reportData.route?.startLabel || ''} ${copy.routeArrow || 'to'} ${reportData.route?.targetLabel || ''}`;
    const pressurePoints = Array.isArray(reportData.routePressurePoints) ? reportData.routePressurePoints.slice(0, 5) : [];
    const areaItems = compositeRegions.slice(0, 3).map((region) => {
      const burden = region.ranking?.[0]?.burdenLabel || topBurden || copy.burdenContributionRanking;
      return zh
        ? `高热区${region.index}: 优先降低${burden}，预计可减少该段停顿、绕行或犹豫。`
        : `Hot zone ${region.index}: prioritize reducing ${burden}; expected to reduce stopping, detours, or hesitation in this segment.`;
    });
    if (!areaItems.length) {
      areaItems.push(zh
        ? `当前路线 ${routeText} 未形成明确独立高热区，可将本次结果作为后续方案对比基线。`
        : `The current route ${routeText} has no clear isolated high-heat zones, so use this run as a comparison baseline.`);
    }
    const facilityItems = pressurePoints.length
      ? pressurePoints.map((point) => buildFallbackFacilityAdjustmentText(point, locale))
      : [zh ? '本次模拟没有记录到明确产生贡献的压力点，建议先重新运行热力图以生成贡献日志。' : 'No effective stressor contribution was recorded; rerun the heatmap to generate contribution logs first.'];
    const spaceAdvice = zh
      ? `围绕 ${routeText} 的主要高热段调整空间组织。优先处理${topBurden || '最高负担维度'}突出的瓶颈、转折和等待区域，再评估过道宽度、垂直交通衔接与休息点间距。`
      : `Adjust spatial organization along ${routeText}. Prioritize bottlenecks, turns, and waiting areas where ${topBurden || 'the dominant burden'} is high, then review corridor width, vertical-circulation links, and rest spacing.`;
    const llmSections = getLocalizedReportAnalysisSections(reportData);
    const scoreFallback = [
      zh
        ? `总体负担评分为 ${formatReportMetric(reportData.routeScoreSummary?.overallBurdenScore || 0)}，路线友好度为 ${formatReportMetric(reportData.routeScoreSummary?.routeFriendlyScore || 0)}。`
        : `Overall burden score is ${formatReportMetric(reportData.routeScoreSummary?.overallBurdenScore || 0)}, and route friendliness is ${formatReportMetric(reportData.routeScoreSummary?.routeFriendlyScore || 0)}.`,
    ];
    const scoreItems = getReportAdjustmentSectionBullets(llmSections, ['score', '评分', 'overall', '总体'], scoreFallback);
    const spaceItems = getReportAdjustmentSectionBullets(llmSections, ['space', 'spatial', 'model', '空间', '模型'], [spaceAdvice]);
    const areaLlmItems = getReportAdjustmentSectionBullets(llmSections, ['area', 'region', 'hot', '区域', '高热'], areaItems);
    const facilityLlmItems = getReportAdjustmentSectionBullets(llmSections, ['facility', 'stressor', 'pressure', '设施', '压力点'], facilityItems);
    return `
      <section class="report-section report-llm-adjustment">
        <h2 class="report-section-title">${escapeHtml(copy.llmAdjustmentTitle)}</h2>
        ${buildReportRouteScoreSummaryMarkup(reportData.routeScoreSummary, copy, locale)}
        <div class="report-adjustment-grid">
          <div class="report-adjustment-block">
            <strong>${escapeHtml(copy.routeScoreTitle)}</strong>
            <ol>${scoreItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
          </div>
          <div class="report-adjustment-block">
            <strong>${escapeHtml(copy.llmAdjustmentSpaceTitle)}</strong>
            <ol>${spaceItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
          </div>
          <div class="report-adjustment-block">
            <strong>${escapeHtml(copy.llmAdjustmentAreaTitle)}</strong>
            <ol>${areaLlmItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
          </div>
          <div class="report-adjustment-block">
            <strong>${escapeHtml(copy.llmAdjustmentFacilityTitle)}</strong>
            ${buildReportFacilityAdjustmentListMarkup(facilityLlmItems, pressurePoints)}
          </div>
        </div>
      </section>
    `;
  }

  function buildRouteReportDocument(reportData) {
    const copy = reportData.copy || buildReportExportCopy(reportData.locale);
    const modelRows = buildReportModelRowsMarkup(reportData);
    const simulationRows = buildReportSimulationRowsMarkup(reportData);
    const agentAttributes = buildReportAgentAttributesMarkup(reportData);
    const thoughtFlow = buildReportThoughtFlowMarkup(reportData);
    const pressureGroups = buildReportNumberedPressureGroupsMarkup(reportData);
    const routePressurePointCount = (reportData.routePressurePoints || []).length;
    const heatmapCards = buildReportHeatmapCardsMarkup(reportData);
    const detailCardPages = buildReportDetailCardPagesMarkup(reportData);
    const coverPage = buildReportCoverPageMarkup(reportData);
    const frontSummaryPage = buildReportExecutiveFrontPageMarkup(reportData);
    return `<!DOCTYPE html>
<html lang="${escapeHtml(reportData.locale === 'en' ? 'en' : 'zh-CN')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(reportData.title)} - ${escapeHtml(reportData.projectName)}</title>
    <style>
      :root { color-scheme: light; --ink:#17262f; --muted:#62717c; --line:#cad2d8; --panel:#f4f6f8; --panel-soft:#f7f8fa; --panel-strong:#eef2f5; --outline:#4e5961; }
      * { box-sizing:border-box; }
      @page { size:A4 portrait; margin:7mm; }
      body { margin:0; background:#d9e0e5; color:var(--ink); font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; counter-reset:report-page; }
      .report-document { width:min(210mm, calc(100vw - 48px)); margin:0 auto; padding:18px 20px 36px; display:grid; gap:14px; background:#fff; }
      .report-page { position:relative; width:100%; min-height:auto; margin:0; padding:0; background:transparent; display:flex; flex-direction:column; gap:10mm; overflow:visible; counter-increment:report-page; }
      .report-page--cover { position:relative; min-height:270mm; overflow:hidden; background:#fff; border:1px solid #d1d8de; padding:0; gap:0; }
      .report-cover-white { position:absolute; inset:0; background:#fff; }
      .report-cover-teal { position:absolute; left:0; right:0; top:86mm; height:162mm; background:#91c9d2; }
      .report-cover-frame { position:absolute; left:14mm; top:66mm; width:54mm; height:166mm; border-left:1.7mm solid #1f5b91; border-top:1.7mm solid #1f5b91; border-bottom:1.7mm solid #1f5b91; background:transparent; }
      .report-cover-frame::before, .report-cover-frame::after { content:""; position:absolute; right:-1.7mm; width:1.7mm; background:#1f5b91; }
      .report-cover-frame::before { top:-1.7mm; height:22mm; }
      .report-cover-frame::after { bottom:-1.7mm; height:70mm; }
      .report-cover-bar { position:absolute; top:66mm; width:8.6mm; height:20mm; }
      .report-cover-bar--navy { left:74mm; background:#1f5b91; }
      .report-cover-bar--teal { left:87mm; width:4.8mm; background:#91c9d2; }
      .report-cover-title-block { position:absolute; left:55mm; top:102mm; display:grid; gap:8mm; }
      .report-cover-title-block h1 { margin:0; color:#fff; font-size:38px; line-height:1.15; font-weight:800; letter-spacing:0; }
      .report-cover-title-block h1 span { display:block; }
      .report-cover-title-block p { margin:0; color:#1f5b91; font-size:22px; line-height:1.12; font-weight:800; letter-spacing:0; }
      .report-cover-meta { position:absolute; left:90mm; top:197mm; width:102mm; display:grid; gap:5.2mm; color:#1f5b91; font-size:12px; line-height:1.32; font-weight:400; }
      .report-cover-meta div { max-width:100%; overflow-wrap:anywhere; }
      .report-cover-meta strong { font-weight:800; }
      .report-cover-meta span { font-weight:400; }
      .report-page--front { min-height:270mm; padding:7mm; border:1px solid #d1d8de; background:#ffffff; gap:4mm; }
      .report-page--front-summary { display:grid; grid-template-rows:auto 58mm auto minmax(0,1fr); align-content:stretch; }
      .report-front-header { display:grid; grid-template-columns:minmax(0,1fr); gap:8mm; align-items:start; padding-bottom:3mm; border-bottom:1px solid #cfd7dd; }
      .report-front-kicker { margin:0 0 2mm; color:#60707b; font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; }
      .report-front-header h1 { margin:0; color:#17262f; font-size:26px; line-height:1.08; letter-spacing:0; }
      .report-front-meta { display:grid; gap:1.4mm; color:#5d6d78; font-size:10.5px; line-height:1.45; text-align:right; }
      .report-front-summary-grid { display:grid; grid-template-columns:minmax(0,0.74fr) minmax(0,1.26fr); gap:6mm; align-items:stretch; min-height:0; }
      .report-front-friendliness { display:grid; grid-template-rows:auto minmax(0,1fr) auto; gap:3mm; padding:4mm 5mm; background:#f6f8fa; border-left:1.5mm solid var(--score-color); min-height:0; height:100%; }
      .report-front-friendliness h2 { margin:0; color:#17262f; font-size:14px; line-height:1.25; font-weight:800; }
      .report-front-big-score { display:grid; align-self:center; gap:1.2mm; min-height:0; }
      .report-front-big-score strong { color:var(--score-color); font-size:62px; line-height:0.92; font-weight:850; letter-spacing:0; }
      .report-front-big-score span { color:var(--score-color); font-size:12px; font-weight:800; padding-bottom:0; }
      .report-front-dominant { display:grid; gap:1mm; align-self:end; padding-top:2mm; }
      .report-front-dominant p { margin:0; color:#17262f; font-size:13px; line-height:1.25; font-weight:400; }
      .report-front-right-panel { display:grid; grid-template-rows:auto 1fr; gap:3mm; min-width:0; }
      .report-front-judgement { display:grid; align-content:start; gap:2.5mm; padding:2mm 0 0; background:transparent; color:#17262f; min-height:0; }
      .report-front-badge { justify-self:start; padding:1.4mm 2.6mm; border:1px solid rgba(255,255,255,0.34); border-radius:999px; color:#dbe6eb; font-size:9.5px; font-weight:700; }
      .report-front-judgement h2, .report-front-priority-grid h2, .report-front-adjustment-summary h2 { margin:0; font-size:14px; line-height:1.25; font-weight:800; }
      .report-front-judgement p { margin:0; color:#17262f; font-size:10.2px; line-height:1.52; font-weight:400; }
      .report-front-score-grid { display:grid; grid-template-columns:1fr; gap:3mm; }
      .report-front-metric { display:grid; gap:1mm; padding:4mm; background:#eef2f5; border-left:2.4mm solid var(--metric-color); }
      .report-front-metric span { color:#60707b; font-size:9.6px; font-weight:800; }
      .report-front-metric strong { color:var(--metric-color); font-size:24px; line-height:1.05; }
      .report-front-metric small { color:#60707b; font-size:9.5px; line-height:1.35; }
      .report-front-score-panel { display:grid; gap:2.1mm; padding:4mm 0 0; border:0; background:transparent; }
      .report-front-score-panel h3 { margin:0; font-size:14px; line-height:1.25; font-weight:800; }
      .report-front-score-row { display:grid; grid-template-columns:28mm minmax(0,1fr) 30mm; gap:3mm; align-items:center; font-size:9.5px; }
      .report-front-score-track { height:2.4mm; background:#dbe2e7; overflow:hidden; }
      .report-front-score-track i { display:block; height:100%; }
      .report-front-score-row b { display:grid; grid-template-columns:10mm minmax(0,1fr); align-items:baseline; gap:1mm; text-align:right; font-size:9.5px; white-space:nowrap; }
      .report-front-score-row b span { text-align:left; }
      .report-front-score-row b small { font-size:8px; font-weight:800; }
      .report-front-map-panel { display:grid; gap:1mm; margin:12mm 0 5mm; }
      .report-front-map-note { margin:0; color:#17262f; font-size:10.2px; line-height:1.52; }
      .report-front-map-stage { position:relative; overflow:hidden; border:1px solid #111; background:#fff; aspect-ratio:860 / 330; }
      .report-front-priority-grid { display:grid; grid-template-columns:1fr 1fr; gap:4mm; min-height:0; align-self:stretch; }
      .report-front-priority-grid section, .report-front-adjustment-summary section { display:grid; grid-template-rows:auto minmax(0,1fr); align-content:stretch; gap:2mm; padding:3mm; background:#fff; border:1px solid #cfd7dd; min-height:0; }
      .report-front-priority-grid ol, .report-front-adjustment-summary ol { margin:0; padding-left:5mm; display:grid; gap:2mm; align-content:start; overflow:hidden; }
      .report-front-priority-grid li, .report-front-adjustment-summary li { font-size:10.2px; line-height:1.52; color:#17262f; }
      .report-front-footnote { margin-top:auto; padding-top:3mm; border-top:1px solid #d7dee3; color:#60707b; font-size:9.6px; }
      .report-front-adjustment-layout { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(280px,0.85fr); gap:5mm; align-items:stretch; }
      .report-front-adjustment-map { position:relative; overflow:hidden; min-height:100mm; border:1px solid #111; background:#fff; }
      .report-front-adjustment-summary { display:grid; gap:4mm; }
      .report-header { display:flex; justify-content:space-between; gap:8mm; padding-bottom:3.2mm; border-bottom:1px solid var(--line); }
      .report-title { margin:0; font-size:21px; line-height:1.1; }
      .report-meta { margin:0; display:grid; gap:1.4mm; color:var(--muted); font-size:11px; }
      .report-section { display:grid; gap:3.5mm; }
      .report-section-title { margin:0; font-size:15px; font-weight:800; letter-spacing:0.01em; }
      .report-page--simulation-results { min-height:270mm; padding:7mm; border:1px solid #d1d8de; background:#fff; gap:5mm; }
      .report-page--simulation-results { display:grid; grid-template-rows:auto auto minmax(0,1fr); align-content:start; }
      .report-page--simulation-results .report-title { font-size:26px; line-height:1.08; }
      .report-page--simulation-results .report-header { padding-bottom:3mm; }
      .report-page--thought, .report-page--stressors, .report-page--heatmaps, .report-page--detail-single { min-height:270mm; padding:7mm; border:1px solid #d1d8de; background:#fff; gap:5mm; }
      .report-page--thought { gap:5mm; }
      .report-page--heatmaps { gap:0; }
      .report-method-note { padding:1.8mm 2.2mm; background:var(--panel-soft); border-left:2px solid var(--outline); }
      .report-method-note p { margin:0; font-size:9.4px; line-height:1.5; color:var(--muted); }
      .report-table { width:100%; border-collapse:collapse; border:1px solid var(--line); }
      .report-table th, .report-table td { padding:5px 7px; border:1px solid var(--line); font-size:10px; line-height:1.35; vertical-align:top; text-align:left; }
      .report-table thead th { background:var(--panel-strong); font-weight:700; }
      .report-model-meta, .report-input-lines { display:grid; gap:1.3mm; font-size:11px; }
      .report-model-meta strong, .report-input-lines strong { font-weight:700; }
      .report-agent-layout, .report-agent-composition { position:relative; display:grid; grid-template-columns:36% minmax(0,1fr); gap:6mm; min-height:148mm; }
      .report-agent-composition--radar-only { grid-template-columns:39% minmax(0,1fr); min-height:88mm; align-items:stretch; }
      .report-agent-composition--radar-only .report-agent-block { min-height:0; }
      .report-agent-composition--radar-only .radar-shell { align-items:center; }
      .report-agent-left { display:grid; grid-template-rows:39% 61%; gap:3.5mm; min-height:0; }
      .report-agent-block { min-height:0; display:grid; align-items:center; }
      .radar-shell { width:100%; height:100%; display:grid; place-items:center; }
      .radar-shell svg { width:100%; height:100%; }
      .report-figure-wrap { width:100%; height:100%; display:grid; place-items:center; }
      .report-figure-wrap img { max-width:100%; max-height:72mm; object-fit:contain; filter:drop-shadow(0 0.24mm 0 #111) drop-shadow(0 -0.24mm 0 #111) drop-shadow(0.24mm 0 0 #111) drop-shadow(-0.24mm 0 0 #111); }
      .report-attribute-column { display:grid; grid-template-rows:repeat(5, minmax(0, 1fr)); gap:2.2mm; min-height:0; }
      .report-attribute-card { display:grid; grid-template-columns:8.5mm minmax(0,1fr); gap:2.6mm; align-items:start; padding:0.5mm 0; min-height:0; }
      .report-attribute-score { width:7mm; height:7mm; min-height:7mm; display:grid; place-items:center; border-radius:999px; background:#fff; border:1px solid var(--attribute-color, #b9c3ca); color:var(--attribute-color, #17262f); font-size:12px; line-height:1; font-weight:850; }
      .report-attribute-content strong { display:block; margin-bottom:0.8mm; font-size:10.2px; }
      .report-attribute-content p { margin:0; color:var(--muted); font-size:9.1px; line-height:1.35; }
      .report-thought-flow { display:flex; flex-wrap:wrap; gap:1.4mm; align-items:center; font-size:10px; line-height:1.5; }
      .report-thought-note { color:var(--ink); font-size:10.2px; line-height:1.52; }
      .report-thought-step { color:var(--ink); }
      .report-thought-arrow { color:var(--muted); font-size:11px; margin:0 0.5mm; }
      .report-empty { color:var(--muted); font-size:10.2px; }
      .report-map-stage { position:relative; overflow:hidden; background:#fff; }
      .report-map-stage--thought { border:1px solid #d5dadd; }
      .report-map-layer { position:absolute; inset:0; width:100%; height:100%; }
      .report-map-layer svg { position:absolute; inset:0; width:100%; height:100%; }
      .walkable-shape { fill:#f2f2f2; stroke:#6a7278; stroke-width:0.5; }
      .obstacle-shape { fill:#cdd2d6; stroke:#6a7278; stroke-width:0.58; }
      .agent-radar-grid { fill:none; stroke:#6e7880; stroke-width:0.95; }
      .agent-radar-axis { stroke:#6e7880; stroke-width:0.95; }
      .agent-radar-ring-label { fill:#6e7880; font-size:8px; }
      .agent-radar-label { fill:#17262f; font-size:10px; font-weight:600; }
      .agent-radar-score { fill:#17262f; font-size:10px; font-weight:400; }
      .agent-radar-shape { fill:#ccd3d8; fill-opacity:0.94; stroke:#111; stroke-width:1.7; }
      .agent-radar-hit { fill:transparent; stroke:none; }
      .agent-radar-handle { fill:var(--radar-handle-fill); stroke:#111; stroke-width:0.55; }
      .report-route-path { fill:none; stroke:#111; stroke-width:0.38; stroke-dasharray:1.8 1.8; stroke-linecap:round; stroke-linejoin:round; }
      .report-decision-ring { fill:none; stroke:#111; stroke-width:0.58; }
      .report-decision-dot { fill:#111; stroke:#111; stroke-width:0.18; }
      .report-pressure-dot { stroke:#111; stroke-width:0.2; }
      .report-pressure-marker text { fill:#111; font-size:2.1px; text-anchor:middle; dominant-baseline:central; font-weight:900; stroke:none; }
      .report-node-marker circle { stroke:#111; stroke-width:0.32; fill-opacity:0.9; }
      .report-area-marker circle { stroke:#111; stroke-width:0.24; fill-opacity:0.26; stroke-dasharray:1.2 0.8; }
      .report-node-marker text, .report-area-marker text { fill:#111; font-size:2.2px; text-anchor:middle; dominant-baseline:central; font-weight:900; stroke:none; }
      .report-pressure-number { display:inline-grid; place-items:center; min-width:14px; height:14px; margin-right:4px; border-radius:999px; border:1px solid #111; font-size:8px; font-weight:800; }
      .report-pressure-number--filled { width:14px; min-width:14px; color:#111; font-size:9px; font-weight:900; line-height:1; }
      .report-influence-number { font-size:8px; padding:0 1px; }
      .report-influence-number--area { color:#111; }
      .report-influence-number--node { color:#111; }
      .report-pressure-ref { display:inline-flex; align-items:center; gap:1mm; margin:0 1mm 0.8mm 0; vertical-align:middle; font-weight:800; white-space:nowrap; }
      .report-pressure-ref .report-pressure-number { margin-right:0; }
      .report-heat-raster { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
      .report-swatch { display:inline-block; width:10px; height:10px; border-radius:999px; margin-right:6px; vertical-align:middle; border:1px solid #5f6970; }
      .report-pressure-groups { display:grid; grid-template-columns:1fr 1fr; gap:3mm 5mm; align-items:start; }
      .report-pressure-group { display:grid; gap:1.2mm; break-inside:avoid; page-break-inside:avoid; }
      .report-pressure-group-title { font-size:10.4px; font-weight:700; }
      .report-pressure-table { width:100%; border-collapse:collapse; table-layout:fixed; }
      .report-pressure-table td { padding:0.8mm 0.8mm; vertical-align:top; font-size:10.2px; line-height:1.45; border:none; }
      .report-pressure-table__name { width:32%; font-weight:700; }
      .report-pressure-table__desc { width:68%; color:var(--muted); }
      .report-heat-grid { display:grid; grid-template-columns:1fr 1fr; gap:3mm; }
      .report-heat-card { border:1px solid #111; padding:1.6mm; display:grid; gap:1mm; align-content:start; }
      .report-heat-stage { position:relative; overflow:hidden; background:#eef1f4; }
      .report-heat-header { position:absolute; left:6px; top:6px; font-size:10px; font-weight:700; color:#17262f; background:rgba(255,255,255,0.78); padding:1px 4px 1px 0; }
      .report-heat-legend { position:absolute; left:6px; top:22px; width:112px; font-size:8px; color:#17262f; text-shadow:0 0 1px rgba(255,255,255,0.9); }
      .report-heat-legend-gradient { height:7px; border-radius:999px; margin-bottom:2px; }
      .report-heat-legend-labels { display:flex; justify-content:space-between; color:#4f5960; }
      .report-heat-legend-note { margin-top:2px; line-height:1.25; color:#4f5960; }
      .report-heat-meta p { margin:0; color:var(--muted); font-size:8.2px; line-height:1.28; }
      .report-heat-stats { display:grid; gap:0.3mm; font-size:8.3px; font-weight:700; justify-items:start; }
      .report-detail-stack { display:grid; gap:5mm; }
      .report-section--detail-single { height:100%; display:grid; grid-template-rows:auto minmax(0,1fr); gap:3.5mm; }
      .report-section--detail-single > .report-section-title { font-size:15px; line-height:1.2; }
      .report-section--detail-single .report-detail-card { height:100%; grid-template-rows:minmax(0, 116mm) minmax(0,1fr); }
      .report-detail-card { display:grid; grid-template-columns:1fr; gap:3mm; align-items:start; }
      .report-detail-card__title { display:none; font-size:12px; font-weight:700; }
      .report-detail-map { position:relative; overflow:hidden; border:1px solid #111; background:#fff; }
      .report-detail-text { display:grid; grid-template-columns:1fr; gap:2mm; min-height:0; overflow:hidden; }
      .report-detail-card__title { grid-column:1 / -1; }
      .report-detail-ranking { font-size:10px; line-height:1.45; color:#17262f; }
      .report-detail-region-rows { display:grid; gap:2.2mm; }
      .report-detail-region-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,0.82fr); gap:4mm; align-items:start; padding-bottom:2mm; border-bottom:1px solid #d8dee2; }
      .report-detail-region-row:last-child { border-bottom:0; padding-bottom:0; }
      .report-detail-region-advice { display:grid; gap:0.8mm; font-size:10.2px; line-height:1.45; color:#17262f; }
      .report-detail-region-advice p { margin:0; }
      .report-detail-region-pressure-ranking { display:grid; gap:1mm; font-size:10.2px; color:#17262f; line-height:1.45; }
      .report-detail-region-pressure-ranking ol { list-style:none; margin:0; padding:0; display:grid; gap:0.8mm; }
      .report-detail-region-pressure-ranking li { display:flex; align-items:center; min-width:0; }
      .report-detail-region-pressure-ranking p { margin:0; color:#56616a; }
      .report-detail-muted { color:#56616a; }
      .report-detail-pressure-summary { display:grid; gap:1.2mm; font-size:9px; color:#17262f; line-height:1.4; }
      .report-detail-pressure-summary p { margin:0; color:#56616a; }
      .report-detail-issues { display:grid; gap:1.6mm; }
      .report-detail-issue { display:grid; gap:0.6mm; }
      .report-detail-issue-index { font-size:9.2px; font-weight:700; }
      .report-detail-issue-advice { font-size:9px; line-height:1.4; color:#17262f; }
      .report-detail-pressure-inline { display:flex; flex-wrap:wrap; gap:2mm; font-size:8.8px; color:#56616a; }
      .report-high-label circle { fill:none; stroke:#111; stroke-width:0.42; }
      .report-high-label text { fill:#111; font-size:4px; text-anchor:middle; dominant-baseline:central; font-weight:900; }
      .report-high-label--vitality circle { stroke:#d63838; stroke-width:0.5; }
      .report-adjustment-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4mm; }
      .report-adjustment-score { display:grid; gap:1mm; padding:2.2mm; background:var(--panel-soft); border:1px solid var(--line); }
      .report-adjustment-score strong { font-size:10px; }
      .report-adjustment-score p { margin:0; color:#17262f; font-size:9px; line-height:1.45; }
      .report-adjustment-block { display:grid; gap:1.2mm; align-content:start; padding:2.2mm; background:var(--panel-soft); border:1px solid var(--line); }
      .report-adjustment-block strong { font-size:10px; }
      .report-adjustment-block p, .report-adjustment-block li { margin:0; color:#17262f; font-size:9px; line-height:1.45; }
      .report-adjustment-block ol { margin:0; padding-left:4mm; display:grid; gap:1mm; }
      @media print {
        body { background:#fff; }
        .report-document { width:auto; margin:0; padding:0; display:block; gap:0; background:#fff; }
        .report-page { width:196mm; min-height:283mm; margin:0; box-shadow:none; break-after:page; page-break-after:always; overflow:hidden; }
        .report-page:last-child { break-after:auto; page-break-after:auto; }
        .report-page::after { content:counter(report-page); position:absolute; right:4mm; bottom:2.5mm; color:#5d6d78; font-size:8px; line-height:1; }
        .report-page--cover { height:283mm; min-height:283mm; border:0; }
        .report-page--front { height:283mm; min-height:283mm; border:0; padding:0; gap:3mm; }
        .report-page--front-summary { grid-template-rows:auto 58mm auto minmax(0,1fr); }
        .report-page--simulation-results, .report-page--thought, .report-page--heatmaps, .report-page--detail-single { height:283mm; min-height:283mm; border:0; padding:0; }
        .report-page--stressors { display:block; min-height:283mm; height:auto; border:0; padding:0; overflow:visible; }
        .report-page--detail-single { gap:0; }
      }
    </style>
  </head>
  <body>
    <main class="report-document">
      ${coverPage}
      ${frontSummaryPage}
      <section class="report-page report-page--simulation-results">
        <header class="report-header">
          <div>
            <h1 class="report-title">${escapeHtml(copy.detailedSimulationTitle)}</h1>
          </div>
        </header>
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageOneTitle)}</h2>
          <div class="report-model-meta">
            <div><strong>${escapeHtml(copy.importedModel)}:</strong> ${escapeHtml(reportData.modelSpaceInfo.modelName)}</div>
            <div><strong>${escapeHtml(copy.modelArea)}:</strong> ${escapeHtml(formatReportNumber(reportData.modelSpaceInfo.area, 2))} ${escapeHtml(copy.squareMeters)}</div>
          </div>
          <table class="report-table">
            <thead><tr><th>${escapeHtml(copy.category)}</th><th>${escapeHtml(copy.type)}</th><th>${escapeHtml(copy.count)}</th></tr></thead>
            <tbody>${modelRows}</tbody>
          </table>
        </section>
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageOneInputTitle)}</h2>
          <div class="report-agent-layout report-agent-composition report-agent-composition--radar-only">
            <div class="report-agent-block"><div class="radar-shell">${reportData.agentRadarSvg}</div></div>
            <div class="report-attribute-column">${agentAttributes}</div>
          </div>
        </section>
      </section>
      <section class="report-page report-page--thought">
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageTwoSimulationTitle)}</h2>
          <table class="report-table">
            <thead><tr><th>${escapeHtml(copy.simulationMetric)}</th><th>${escapeHtml(copy.minimum)}</th><th>${escapeHtml(copy.maximum)}</th></tr></thead>
            <tbody>${simulationRows}</tbody>
          </table>
        </section>
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageTwoThoughtTitle)}</h2>
          <div class="report-thought-flow">${thoughtFlow}</div>
          <div class="report-map-stage report-map-stage--thought" style="aspect-ratio:860 / 400;">
            <div class="report-map-layer report-map-layer--base">${reportData.thoughtMapSnapshot.baseSvg}</div>
            <div class="report-map-layer report-map-layer--overlay">${reportData.thoughtMapSnapshot.overlaySvg}</div>
          </div>
          <div class="report-thought-note">• ${escapeHtml(copy.thoughtMapNote)}</div>
        </section>
      </section>
      <section class="report-page report-page--stressors">
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageTwoPressureTitle)} · ${escapeHtml(formatReportNumber(routePressurePointCount, 0))}</h2>
          <div class="report-pressure-groups">${pressureGroups}</div>
        </section>
      </section>
      <section class="report-page report-page--heatmaps">
        <section class="report-section">
          <h2 class="report-section-title">${escapeHtml(copy.pageThreeHeatTitle)}</h2>
          <div class="report-heat-grid">${heatmapCards}</div>
        </section>
      </section>
      ${detailCardPages}
    </main>
  </body>
</html>`;
  }

  function renderHotspots() {
    const inspection = getDynamicInspection();
    const panelState = getIssuePanelState();
    if (panelState.mode !== 'issues') {
      elements.hotspotsList.innerHTML = `<div class="detail-card glass-card muted">${escapeHtml(t('hint.hotspotsPrompt'))}</div>`;
      return;
    }

    const summaryCard = panelState.summary
      ? `<div class="detail-card glass-card muted">${escapeHtml(panelState.summary)}</div>`
      : '';

    elements.hotspotsList.innerHTML = `${summaryCard}${panelState.items
      .map((item) => {
        const hotspotTargets = resolveHotspotTargets(item);
        const hotspotLinkId = hotspotTargets.some((target) => target.type === 'pressure') ? (item.id || item.mapTargetId || '') : '';
        const actionViewMode = item.actionViewMode ? getSafeViewMode(item.actionViewMode) : '';
        const isClickable = Boolean(hotspotLinkId || actionViewMode);
        return `
        <div class="hotspot-card glass-card${isClickable ? ' clickable' : ' static'}${state.selectedHotspotId === hotspotLinkId ? ' active' : ''}"${hotspotLinkId ? ` data-hotspot-id="${escapeHtml(hotspotLinkId)}"` : ''}${actionViewMode ? ` data-action-view-mode="${escapeHtml(actionViewMode)}"` : ''}>
          <div class="hotspot-card-head">
            <span class="hotspot-card-index">#${item.rank}</span>
            <strong>${escapeHtml(item.name || item.id)}</strong>
          </div>
          <div class="hotspot-card-meta">${escapeHtml(item.categoryLabel || getCategoryLabel(item.category))} · ${escapeHtml(item.feature || '--')}</div>
          <div class="hotspot-card-pressure">${escapeHtml(item.metricLabel || t('label.pressure'))}: ${escapeHtml(formatMetricValue(item.pressure || item.score || 0))}</div>
          <div class="hotspot-card-advice">${escapeHtml(item.advice || getSuggestionByCategory(item.category))}</div>
        </div>
      `;
      })
      .join('')}`;
  }

  function getVisualizationMetricIcon(metricId) {
    const icons = {
      start: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z"></path></svg>',
      end: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z"></path><circle cx="12" cy="11" r="2.5"></circle></svg>',
      people: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>',
      crowd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16"></path><path d="M6 18v-5"></path><path d="M10 18v-9"></path><path d="M14 18v-7"></path><path d="M18 18v-11"></path></svg>',
      progress: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.34 5.66"></path><path d="M12 8v5l3 2"></path></svg>',
      noise: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"></path><path d="M15 9a5 5 0 0 1 0 6"></path><path d="M17.5 6.5a8.5 8.5 0 0 1 0 11"></path></svg>',
      light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M4.93 4.93l2.12 2.12"></path><path d="M16.95 16.95l2.12 2.12"></path><path d="M2 12h3"></path><path d="M19 12h3"></path><path d="M4.93 19.07l2.12-2.12"></path><path d="M16.95 7.05l2.12-2.12"></path></svg>',
      queue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12"></path><path d="M6 10h12"></path><path d="M6 16h12"></path><path d="M6 22h12"></path></svg>',
    };
    return icons[metricId] || icons.people;
  }

  function getVisualizationViewTitle(viewMode = getSafeViewMode(state.viewMode)) {
    const keys = {
      composite: 'visualization.compositeTitle',
      locomotor: 'visualization.locomotorTitle',
      sensory: 'visualization.sensoryTitle',
      cognitive: 'visualization.cognitiveTitle',
      psychological: 'visualization.psychologicalTitle',
      vitality: 'visualization.vitalityTitle',
    };
    return t(keys[getSafeViewMode(viewMode)] || 'visualization.compositeTitle');
  }

  function getVisualizationViewDescription(viewMode = getSafeViewMode(state.viewMode)) {
    const keys = {
      composite: 'visualization.compositeCopy',
      locomotor: 'visualization.locomotorCopy',
      sensory: 'visualization.sensoryCopy',
      cognitive: 'visualization.cognitiveCopy',
      psychological: 'visualization.psychologicalCopy',
      vitality: 'visualization.vitalityCopy',
    };
    return t(keys[getSafeViewMode(viewMode)] || 'visualization.compositeCopy');
  }

  function updateVisualizationMetricRangeElements(viewMode, minElement, maxElement) {
    const metricRange = state.scenario?.heatActive ? getViewMetricRange(viewMode) : { min: 0, max: 0 };
    if (minElement) {
      minElement.textContent = state.scenario?.heatActive
        ? `${t('visualization.min')} ${formatMetricValue(metricRange.min)}`
        : `${t('visualization.min')} --`;
    }
    if (maxElement) {
      maxElement.textContent = state.scenario?.heatActive
        ? `${t('visualization.max')} ${formatMetricValue(metricRange.max)}`
        : `${t('visualization.max')} --`;
    }
  }

  function restoreVisualizationWorkspaceLayers() {
    renderHeatmap();
    renderBackgroundCrowdCanvas();
    renderOverlayLayer();
  }

  function getVisualizationDetailViewOptions() {
    return BURDEN_VIEW_ORDER.map((viewMode) => ({
      value: viewMode,
      label: getVisualizationViewTitle(viewMode),
    }));
  }

  function getVisualizationDetailTimelineSteps(reportData) {
    const locale = state.locale === 'en' ? 'en' : 'zh-CN';
    const inspection = getCurrentFocusInspection();
    const steps = [
      locale === 'en'
        ? `Route begins at ${reportData.route?.startLabel || '--'} and targets ${reportData.route?.targetLabel || '--'}, with ${formatNumber(getBackgroundCrowdCount(), 0)} background passengers per hour.`
        : `路线从${reportData.route?.startLabel || '--'}出发，目标为${reportData.route?.targetLabel || '--'}，当前背景人流为${formatNumber(getBackgroundCrowdCount(), 0)}人/小时。`,
      locale === 'en'
        ? `The current focus view is ${reportData.activeView?.label || '--'}, while the peak route burden falls on ${reportData.peakDimension?.burdenLabel || '--'}.`
        : `当前查看视图为${reportData.activeView?.label || '--'}，整条路线的峰值负担维度为${reportData.peakDimension?.burdenLabel || '--'}。`,
      locale === 'en'
        ? `Average travel time is ${formatReportDuration(reportData.summary?.averageTravelTime || 0, locale)}, and the route risk level is ${reportData.risk?.level || '--'}.`
        : `平均通行时间为${formatReportDuration(reportData.summary?.averageTravelTime || 0, locale)}，路线风险等级为${reportData.risk?.level || '--'}。`,
      locale === 'en'
        ? `Live inspection shows congestion at ${inspection ? getCongestionLabel(inspection.crowdDensity, 'en') : '--'}, queue count ${formatMetricValue(inspection?.queueCount || 0, 0)}, and fatigue ${formatMetricValue(inspection?.fatigue || 0)}.`
        : `实时状态显示当前拥堵为${inspection ? getCongestionLabel(inspection.crowdDensity, 'zh-CN') : '--'}，排队人数${formatMetricValue(inspection?.queueCount || 0, 0)}，疲劳值${formatMetricValue(inspection?.fatigue || 0)}。`,
    ];
    const findings = Array.isArray(reportData.findings) ? reportData.findings.slice(0, 1) : [];
    if (findings.length) {
      steps.push(findings[0]);
    }
    return steps.slice(0, 5);
  }

  function getVisualizationDetailIcon(kind) {
    const icons = {
      brain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3a3 3 0 0 0-3 3v1.1A3.5 3.5 0 0 0 4 10.2V11a3.5 3.5 0 0 0 1.54 2.9A3 3 0 0 0 8 19h1m6-16a3 3 0 0 1 3 3v1.1A3.5 3.5 0 0 1 20 10.2V11a3.5 3.5 0 0 1-1.54 2.9A3 3 0 0 1 16 19h-1M12 3v18m0-18a3 3 0 0 1 3 3v1m-3-4a3 3 0 0 0-3 3v1m3 4a3 3 0 0 1 3 3v1m-3-4a3 3 0 0 0-3 3v1"></path></svg>',
      issue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>',
      suggestion: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-4 12.75c.54.38 1 .92 1.32 1.55L10 18h4l.68-1.7c.32-.63.78-1.17 1.32-1.55A7 7 0 0 0 12 2z"></path></svg>',
    };
    return icons[kind] || icons.brain;
  }

  function clearVisualizationStageCanvas(canvas) {
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function blitVisualizationCanvas(sourceCanvas, targetCanvas, sourceTransform = state.transform) {
    if (!targetCanvas) {
      return;
    }
    const width = Math.max(1, Math.round(targetCanvas.clientWidth || 0));
    const height = Math.max(1, Math.round(targetCanvas.clientHeight || 0));
    const dpr = Math.max(1, Number(window.devicePixelRatio || 1));
    if (!width || !height) {
      clearVisualizationStageCanvas(targetCanvas);
      return;
    }
    if (targetCanvas.width !== Math.round(width * dpr) || targetCanvas.height !== Math.round(height * dpr)) {
      targetCanvas.width = Math.round(width * dpr);
      targetCanvas.height = Math.round(height * dpr);
      targetCanvas.style.width = `${width}px`;
      targetCanvas.style.height = `${height}px`;
    }
    const ctx = targetCanvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    if (!sourceCanvas || !sourceTransform?.viewBox) {
      return;
    }
    const sourceScaleX = sourceCanvas.width / Math.max(1, Number(sourceTransform.width || 1));
    const sourceScaleY = sourceCanvas.height / Math.max(1, Number(sourceTransform.height || 1));
    const targetTransform = computeTransformForViewportSize(width, height);
    const targetScaleX = targetCanvas.width / Math.max(1, Number(targetTransform.width || 1));
    const targetScaleY = targetCanvas.height / Math.max(1, Number(targetTransform.height || 1));
    const sourceRect = {
      x: Number(sourceTransform.offsetX || 0) * sourceScaleX,
      y: Number(sourceTransform.offsetY || 0) * sourceScaleY,
      width: Number(sourceTransform.viewBox?.width || 0) * Number(sourceTransform.scale || 1) * sourceScaleX,
      height: Number(sourceTransform.viewBox?.height || 0) * Number(sourceTransform.scale || 1) * sourceScaleY,
    };
    const targetRect = {
      x: Number(targetTransform.offsetX || 0) * targetScaleX,
      y: Number(targetTransform.offsetY || 0) * targetScaleY,
      width: Number(targetTransform.viewBox?.width || 0) * Number(targetTransform.scale || 1) * targetScaleX,
      height: Number(targetTransform.viewBox?.height || 0) * Number(targetTransform.scale || 1) * targetScaleY,
    };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sourceCanvas,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      targetRect.x,
      targetRect.y,
      targetRect.width,
      targetRect.height
    );
  }

  function syncVisualizationBaseLayer(baseElement) {
    if (!baseElement || !elements.baseLayer) {
      return;
    }
    const viewBox = elements.baseLayer.getAttribute('viewBox') || '0 0 100 100';
    baseElement.setAttribute('viewBox', viewBox);
    baseElement.innerHTML = elements.baseLayer.innerHTML;
  }

  function syncVisualizationSvgLayer(sourceElement, targetElement) {
    if (!sourceElement || !targetElement) {
      return;
    }
    const viewBox = sourceElement.getAttribute('viewBox') || elements.baseLayer?.getAttribute('viewBox') || '0 0 100 100';
    targetElement.setAttribute('viewBox', viewBox);
    targetElement.innerHTML = sourceElement.innerHTML;
  }

  function renderVisualizationStage(viewMode, stageElements) {
    if (!stageElements) {
      return;
    }
    const isDetailStage = stageElements.overlay === elements.visualizationDetailOverlay;
    const previousViewMode = getSafeViewMode(state.viewMode);
    const previousHeatmapDisplayMode = state.heatmapDisplayMode;
    const previousHeatmapRevealLocked = state.heatmapRevealLocked;
    const previousHeatmapRevealFrozenTime = state.heatmapRevealFrozenTime;
    const stageFrame = stageElements.overlay?.parentElement || stageElements.base?.parentElement || null;
    const stageTransform = computeTransformForContainer(stageFrame);
    state.viewMode = getSafeViewMode(viewMode);
    renderBaseLayer(stageElements.base, stageElements.overlay, stageTransform, { syncState: false });
    if (!state.prepared) {
      clearVisualizationStageCanvas(stageElements.background);
      clearVisualizationStageCanvas(stageElements.heat);
      updateVisualizationMetricRangeElements(viewMode, stageElements.min, stageElements.max);
      state.viewMode = previousViewMode;
      return;
    }
    if (state.scenario?.heatActive) {
      const playback = getActivePlayback() || state.scenario?.precomputedPlayback || null;
      state.heatmapDisplayMode = 'final';
      state.heatmapRevealLocked = true;
      state.heatmapRevealFrozenTime = Number(
        playback?.endTime
        ?? playback?.time
        ?? state.scenario?.time
        ?? 0
      );
    }
    renderHeatmap({
      targetCanvas: stageElements.heat,
      transform: stageTransform,
      useSharedCache: false,
    });
    state.heatmapDisplayMode = previousHeatmapDisplayMode;
    state.heatmapRevealLocked = previousHeatmapRevealLocked;
    state.heatmapRevealFrozenTime = previousHeatmapRevealFrozenTime;
    renderBackgroundCrowdCanvas({
      targetCanvas: stageElements.background,
      transform: stageTransform,
    });
    renderOverlayLayer({
      target: stageElements.overlay,
      transform: stageTransform,
      isVisualizationDetail: isDetailStage,
      showAllNodes: isDetailStage,
      activeLayerCategories: isDetailStage ? getVisualizationDetailActiveLayerCategories() : null,
    });
    updateVisualizationMetricRangeElements(state.viewMode, stageElements.min, stageElements.max);
    state.viewMode = previousViewMode;
  }

  function scheduleVisualizationDetailStageRender(viewMode) {
    if (state.visualizationDetailStageRenderScheduled) {
      return;
    }
    state.visualizationDetailStageRenderScheduled = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        state.visualizationDetailStageRenderScheduled = false;
        const activeView = state.visualizationDetailView ? getSafeViewMode(state.visualizationDetailView) : null;
        const safeViewMode = getSafeViewMode(viewMode);
        if (!activeView || activeView !== safeViewMode || state.uiScreen !== 'workspace') {
          return;
        }
        state.visualizationDetailStageDeferredView = null;
        renderVisualizationStage(activeView, {
          base: elements.visualizationDetailBase,
          background: elements.visualizationDetailBackground,
          heat: elements.visualizationDetailHeat,
          overlay: elements.visualizationDetailOverlay,
          min: null,
          max: null,
        });
        renderVisualizationDetailStageHeader(activeView);
      });
    });
  }

  function renderVisualizationHeatmapCards() {
    if (!elements.visualizationCards?.length) {
      return;
    }
    VISUALIZATION_CARD_ORDER.forEach((viewMode) => {
      const card = elements.visualizationCards.find((item) => item.id === viewMode);
      if (!card) {
        return;
      }
      renderVisualizationStage(viewMode, card);
    });
    restoreVisualizationWorkspaceLayers();
  }

  function renderVisualizationEnvironmentPanel(target = elements.visualizationEnvironmentPanel) {
    if (!target) {
      return;
    }
    const summary = state.scenario ? getDynamicSummaryState() : null;
    const inspection = state.scenario ? getCurrentFocusInspection() : null;
    const metrics = [
      { id: 'start', icon: 'start', label: t('label.start'), value: formatStartSelection() },
      { id: 'end', icon: 'end', label: t('label.targetRegion'), value: getTargetRegionLabel() },
      { id: 'people', icon: 'people', label: t('label.simultaneousCount'), value: summary ? `${formatNumber(summary.simultaneousCount, 0)} ${t('units.agents')}` : '--' },
      { id: 'time', icon: 'time', label: t('label.travelTime'), value: summary ? formatDuration(summary.travelTime) : '--' },
      { id: 'crowd', icon: 'crowd', label: t('visualization.congestion'), value: inspection ? getCongestionLabel(inspection.crowdDensity, state.locale) : '--' },
      { id: 'progress', icon: 'progress', label: t('label.progress'), value: summary ? formatPercent((summary.progress || 0) * 100) : '--' },
      { id: 'noise', icon: 'noise', label: t('label.environmentNoise'), value: inspection ? `${formatMetricValue(inspection.environmentNoise || 0)} ${t('units.decibel')}` : '--' },
      { id: 'light', icon: 'light', label: t('label.environmentLighting'), value: inspection ? `${formatMetricValue(inspection.environmentLighting || 0)} ${t('units.lux')}` : '--' },
      { id: 'queue', icon: 'queue', label: t('label.queueCount'), value: inspection ? formatMetricValue(inspection.queueCount || 0, 0) : '--' },
    ];
    target.innerHTML = metrics.map((item) => `
      <div class="visualization-metric-card">
        <div class="visualization-metric-card__label">${getVisualizationMetricIcon(item.icon)}<span>${escapeHtml(item.label)}</span></div>
        <div class="visualization-metric-card__value">${escapeHtml(item.value)}</div>
      </div>
    `).join('');
  }

  function renderVisualizationStatusMonitor(target = elements.visualizationStatusMonitor) {
    if (!target) {
      return;
    }
    const inspection = state.scenario ? getCurrentFocusInspection() : null;
    if (!inspection) {
      target.innerHTML = '';
      return;
    }
    const isDetailTarget = target === elements.visualizationDetailStatus;
    const detailBurdenValues = FIVE_DIMENSION_ORDER
      .map((id) => Number(inspection.burdenScores?.[id] || 0))
      .filter((value) => Number.isFinite(value));
      const entries = isDetailTarget
        ? [
          { id: 'minBurden', label: t('visualization.minBurden'), value: formatMetricValue(detailBurdenValues.length ? Math.min(...detailBurdenValues) : 0), nowrapLabel: true },
          { id: 'maxBurden', label: t('visualization.maxBurden'), value: formatMetricValue(detailBurdenValues.length ? Math.max(...detailBurdenValues) : 0), nowrapLabel: true },
          { id: 'currentBurden', label: t('visualization.currentBurden'), value: formatMetricValue(inspection.burdenScores?.[COMPOSITE_BURDEN_VIEW] || 0), nowrapLabel: true },
          { id: 'fatigue', label: t('label.fatigue'), value: formatMetricValue(inspection.fatigue || 0), nowrapLabel: true },
          { id: 'walkingSpeed', label: t('label.walkingSpeed'), value: `${formatNumber(inspection.walkingSpeed || 0, 2)} ${t('units.perSecond')}`, multilineLabel: true, labelLines: ['Walking', 'Speed'] },
          { id: 'decisionDelay', label: t('label.decisionDelay'), value: `${formatNumber(inspection.decisionDelay || 0, 2)} ${t('units.seconds')}`, nowrapLabel: true },
          { id: 'visionRadius', label: t('label.visionRadius'), value: formatMeters(inspection.visionRadius || 0), nowrapLabel: true },
          { id: 'restMargin', label: t('label.restMargin'), value: formatRestMarginLabel(inspection), nowrapLabel: true },
          { id: 'currentState', label: t('label.currentState'), value: formatCurrentStatusLabel(inspection, state.locale), multilineLabel: true, labelLines: ['Current', 'State'] },
          { id: 'decisionFocus', label: t('label.decisionFocus'), value: formatDecisionFocusLabel(inspection, state.locale), multilineLabel: true, labelLines: ['Decision', 'Focus'] },
        ]
        : [
          { id: 'currentBurden', label: t('visualization.currentBurden'), value: formatMetricValue(inspection.burdenScores?.[COMPOSITE_BURDEN_VIEW] || 0), nowrapLabel: true },
          { id: 'visionRadius', label: t('label.visionRadius'), value: formatMeters(inspection.visionRadius || 0), nowrapLabel: true },
          { id: 'walkingSpeed', label: t('label.walkingSpeed'), value: `${formatNumber(inspection.walkingSpeed || 0, 2)} ${t('units.perSecond')}`, multilineLabel: true, labelLines: ['Walking', 'Speed'] },
          { id: 'decisionDelay', label: t('label.decisionDelay'), value: `${formatNumber(inspection.decisionDelay || 0, 2)} ${t('units.seconds')}`, nowrapLabel: true },
          { id: 'restMargin', label: t('label.restMargin'), value: formatRestMarginLabel(inspection), nowrapLabel: true },
          { id: 'currentState', label: t('label.currentState'), value: formatCurrentStatusLabel(inspection, state.locale), multilineLabel: true, labelLines: ['Current', 'State'] },
          { id: 'decisionFocus', label: t('label.decisionFocus'), value: formatDecisionFocusLabel(inspection, state.locale), multilineLabel: true, labelLines: ['Decision', 'Focus'] },
          { id: 'fatigue', label: t('label.fatigue'), value: formatMetricValue(inspection.fatigue || 0), nowrapLabel: true },
        ];
      target.innerHTML = entries.map((item) => `
        <div class="visualization-status-card">
          ${buildVisualizationStatusLabelMarkup(item, state.locale)}
          ${buildVisualizationStatusValueMarkup(item, state.locale)}
        </div>
      `).join('');
  }

  function getVisualizationAgentProfile() {
    if (state.focusProfile) {
      return createFocusProfile(state.focusProfile);
    }
    if (state.scenario?.focusAgent?.profile) {
      return createFocusProfile(state.scenario.focusAgent.profile);
    }
    return createFocusProfile(state.agentModal.draft || {});
  }

  function renderVisualizationCapabilityRadar(target = elements.visualizationCapabilityRadar) {
    if (!target) {
      return;
    }
    const isDetailTarget = target === elements.visualizationDetailRadar;
    const radarProfile = getVisualizationAgentProfile();
    const radarMarkup = buildAgentRadarSvg(radarProfile, state.locale, isDetailTarget ? {
      getLabel: getDimensionDisplayName,
      layout: {
        radius: 108,
        labelRadius: 166,
      },
      getTextPlacement: (id, locale) => {
        const basePlacement = getAgentRadarTextPlacement(id, locale);
        return {
          ...basePlacement,
          scoreY: Number(basePlacement.labelY || 0) + 18,
          lineInwardOffset: Number(basePlacement.inwardOffset || 0),
          lineLateralOffset: Number(basePlacement.lateralOffset || 0),
        };
      },
    } : {
      getLabel: getDimensionDisplayName,
    });
    target.innerHTML = radarMarkup;
  }

  function renderVisualizationBurdenFeedback(target = elements.visualizationBurdenFeedback) {
    if (!target) {
      return;
    }
    const inspection = state.scenario ? getCurrentFocusInspection() : null;
    const burdenScores = cloneDimensionScoreMap(inspection?.burdenScores || {});
    target.innerHTML = FIVE_DIMENSION_ORDER.map((id) => {
      const value = Math.max(0, Number(burdenScores?.[id] || 0));
      const width = `${clamp(value, 0, 100)}%`;
      const colorRgb = samplePaletteRgb(clamp(value / 100, 0, 1), HEATMAP_VIEW_STYLES.composite.colorStops);
      return `
        <div class="visualization-burden-row">
          <div class="visualization-burden-row__head">
            <span class="visualization-burden-row__label">${escapeHtml(getDimensionBurdenLabel(id, state.locale))}</span>
            <span class="visualization-burden-row__value" style="color:${escapeHtml(rgbToCss(colorRgb))}">${escapeHtml(formatMetricValue(value))}</span>
          </div>
          <div class="visualization-burden-row__track">
            <div class="visualization-burden-row__fill" style="width:${escapeHtml(width)};--burden-fill:${escapeHtml(rgbToCss(colorRgb))};background-color:${escapeHtml(rgbToCss(colorRgb))}"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function getVisualizationDetailLayerOptions() {
    return LAYER_CATEGORY_DEFINITIONS.map((item) => ({
      value: item.id,
      label: item.label,
    }));
  }

  function renderVisualizationDetailStageMetrics(target = elements.visualizationDetailStageMetrics) {
    const summary = state.scenario ? getDynamicSummaryState() : null;
    const inspection = state.scenario ? getCurrentFocusInspection() : null;
    if (target) {
      const metrics = [
        { id: 'start', icon: 'start', label: t('label.start'), value: formatStartSelection() },
        { id: 'end', icon: 'end', label: t('label.targetRegion'), value: getTargetRegionLabel() },
        { id: 'time', icon: 'time', label: t('label.travelTime'), value: summary ? formatDuration(summary.travelTime) : '--' },
        { id: 'progress', icon: 'progress', label: t('label.progress'), value: summary ? formatPercent((summary.progress || 0) * 100) : '--' },
        { id: 'people', icon: 'people', label: t('label.simultaneousCount'), value: summary ? `${formatNumber(summary.simultaneousCount, 0)} ${t('units.agents')}` : '--' },
        { id: 'crowd', icon: 'crowd', label: t('label.crowdDensity'), value: inspection ? `${formatMetricValue(inspection.crowdDensity || 0)} p/m²` : '--' },
        { id: 'noise', icon: 'noise', label: t('label.environmentNoise'), value: inspection ? `${formatMetricValue(inspection.environmentNoise || 0)} ${t('units.decibel')}` : '--' },
        { id: 'light', icon: 'light', label: t('label.environmentLighting'), value: inspection ? `${formatMetricValue(inspection.environmentLighting || 0)} ${t('units.lux')}` : '--' },
      ];
      target.innerHTML = metrics.map((item) => `
        <div class="visualization-detail__stage-metric">
          <div class="visualization-detail__stage-metric-label">${getVisualizationMetricIcon(item.icon)}<span>${escapeHtml(item.label)}</span></div>
          <div class="visualization-detail__stage-metric-value">${escapeHtml(item.value)}</div>
        </div>
      `).join('');
    }
  }

  function renderVisualizationDetailStageHeader(viewMode = getSafeViewMode(state.visualizationDetailView || state.viewMode)) {
    renderVisualizationDetailStageMetrics(elements.visualizationDetailStageMetrics);
    if (elements.visualizationDetailStageLegend) {
      const style = HEATMAP_VIEW_STYLES[getSafeViewMode(viewMode)] || HEATMAP_VIEW_STYLES.default;
      const legend = style.legend || HEATMAP_VIEW_STYLES.default.legend;
      const low = state.locale === 'en' ? legend.lowEn : legend.lowZh;
      const high = state.locale === 'en' ? legend.highEn : legend.highZh;
      const widthNote = state.locale === 'en' ? legend.widthNoteEn : legend.widthNoteZh;
      const widthMarkup = getSafeViewMode(viewMode) === 'vitality' && widthNote
        ? `<div class="visualization-detail__legend-note">${escapeHtml(widthNote)}</div>`
        : '';
      elements.visualizationDetailStageLegend.innerHTML = `
        <div class="visualization-detail__legend-card">
          <div class="visualization-detail__legend-gradient" style="background:${escapeHtml(buildHeatLegendGradient(style))}"></div>
          <div class="visualization-detail__legend-labels">
            <span>${escapeHtml(low)}</span>
            <span>${escapeHtml(high)}</span>
          </div>
          ${widthMarkup}
        </div>
      `;
    }
  }

  function renderVisualizationDetailLayerSelect(
    target = elements.visualizationDetailLayerSelect,
    menu = elements.visualizationDetailLayerMenu
  ) {
    if (!target || !menu) {
      return;
    }
    const options = getVisualizationDetailLayerOptions();
    const activeValues = getVisualizationDetailActiveLayerCategories();
    const currentOption = options.find((item) => item.value === activeValues[0]) || options[0];
    const currentText = currentOption?.label || '';
    target.innerHTML = `
      <span class="visualization-detail__layer-select-text">${escapeHtml(currentText)}</span>
      <span class="visualization-detail__layer-select-icon" aria-hidden="true"></span>
    `;
    target.setAttribute('aria-expanded', state.visualizationDetailLayerMenuOpen ? 'true' : 'false');
    menu.classList.toggle('hidden', !state.visualizationDetailLayerMenuOpen);
    menu.innerHTML = options
      .map((item) => `<button class="visualization-detail__layer-option settings-select-option${activeValues.includes(item.value) ? ' is-active' : ''}${state.visualizationDetailLayerHoveredValue === item.value ? ' is-hovered' : ''}" type="button" data-layer-value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</button>`)
      .join('');
  }

  function handleVisualizationDetailLayerTrigger(event) {
    if (event?.type === 'click' && state.suppressNextDetailLayerTriggerClick) {
      state.suppressNextDetailLayerTriggerClick = false;
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (event?.type === 'pointerdown') {
      state.suppressNextDetailLayerTriggerClick = true;
    }
    state.visualizationDetailLayerMenuOpen = !state.visualizationDetailLayerMenuOpen;
    if (!state.visualizationDetailLayerMenuOpen) {
      state.visualizationDetailLayerHoveredValue = null;
    }
    requestRender();
  }

  function handleVisualizationDetailLayerMenuClick(event) {
    if (event?.type === 'click' && state.suppressNextDetailLayerMenuClick) {
      state.suppressNextDetailLayerMenuClick = false;
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const option = event.target.closest('[data-layer-value]');
    if (!option) {
      return;
    }
    if (event?.type === 'pointerdown') {
      state.suppressNextDetailLayerMenuClick = true;
    }
    const nextValue = String(option.dataset.layerValue || '').trim();
    const activeValues = new Set(getVisualizationDetailActiveLayerCategories());
    if (activeValues.has(nextValue)) {
      activeValues.delete(nextValue);
    } else if (nextValue) {
      activeValues.add(nextValue);
    }
    state.visualizationDetailActiveLayerCategories = LAYER_CATEGORY_DEFINITIONS
      .map((item) => item.id)
      .filter((id) => activeValues.has(id));
    closePointPopover();
    requestRender();
  }

  function handleVisualizationDetailLayerMenuPointerMove(event) {
    const option = event.target.closest('[data-layer-value]');
    const nextHoveredValue = option ? String(option.dataset.layerValue || '').trim() || null : null;
    if (state.visualizationDetailLayerHoveredValue === nextHoveredValue) {
      return;
    }
    state.visualizationDetailLayerHoveredValue = nextHoveredValue;
    requestRender();
  }

  function handleVisualizationDetailLayerMenuPointerLeave() {
    if (state.visualizationDetailLayerHoveredValue === null) {
      return;
    }
    state.visualizationDetailLayerHoveredValue = null;
    requestRender();
  }

  function handleVisualizationDetailDocumentPointerDown(event) {
    if (!state.visualizationDetailLayerMenuOpen) {
      return;
    }
    const layerControl = event.target.closest('.visualization-detail__layer-control');
    if (layerControl) {
      return;
    }
    state.visualizationDetailLayerMenuOpen = false;
    state.visualizationDetailLayerHoveredValue = null;
    requestRender();
  }

  function getPlaybackRouteAnalysisResult() {
    const playback = getActivePlayback() || state.scenario?.precomputedPlayback || null;
    const analysis = playback?.llmDecisionPlan || playback?.meta?.llmDecisionPlan || state.scenario?.llmDecisionPlan || null;
    return analysis && String(analysis?.analysisKind || '') === 'decision-plan' ? analysis : null;
  }

  function parseTimelineSampleOrder(nodeId = '') {
    const match = /path_sample_(\d+)/i.exec(String(nodeId || '').trim());
    const order = match ? Number(match[1]) : Number.NaN;
    return Number.isFinite(order) && order > 0 ? Math.round(order) : null;
  }

  function getLocalizedDecisionPlanThought(item, locale = state.locale) {
    if (!item) {
      return '';
    }
    return locale === 'en'
      ? String(item.thoughtEn || item.cueEn || item.thoughtZh || item.cueZh || '').trim()
      : String(item.thoughtZh || item.cueZh || item.thoughtEn || item.cueEn || '').trim();
  }

  function buildPlaybackFallbackDecisionPlan(locale = state.locale) {
    const playback = getActivePlayback() || state.scenario?.precomputedPlayback || null;
    const snapshots = getPlaybackTraceSnapshots(playback);
    if (!Array.isArray(snapshots) || !snapshots.length) {
      return null;
    }
    const sampleIndexes = Array.from(new Set([
      0,
      Math.floor((snapshots.length - 1) * 0.25),
      Math.floor((snapshots.length - 1) * 0.5),
      Math.floor((snapshots.length - 1) * 0.75),
      snapshots.length - 1,
    ].filter((index) => index >= 0 && index < snapshots.length)));
    const timeline = sampleIndexes.map((snapshotIndex, index) => {
      const snapshot = snapshots[snapshotIndex] || {};
      const progress = clamp(Number(snapshot.progress || 0), 0, 1);
      const timeSeconds = Number(snapshot.time || 0);
      const isFirst = index === 0;
      const isLast = index === sampleIndexes.length - 1;
      const thoughtZh = isFirst
        ? '我先确认起点和方向，按这条路线慢慢走。'
        : (isLast
          ? '已经接近实际终点了，我再确认一下最后的位置。'
          : '我继续看着前方和周围情况，保持稳一点的节奏。');
      const thoughtEn = isFirst
        ? 'I will confirm the start and direction first, then follow this route carefully.'
        : (isLast
          ? 'I am close to the actual endpoint, so I should confirm the final position.'
          : 'I will keep watching ahead and around me, and maintain a steady pace.');
      return {
        order: index + 1,
        nodeId: `path_sample_${index + 1}`,
        phase: isFirst ? 'start' : (isLast ? 'arrive' : 'progress'),
        timeSeconds,
        progress,
        thoughtZh,
        thoughtEn,
        localizedThought: locale === 'en' ? thoughtEn : thoughtZh,
      };
    });
    return {
      analysisKind: 'decision-plan',
      title: 'Elderly Travel Decision Chain',
      summaryZh: 'LLM 结果不可用，当前使用真实播放轨迹生成本地决策链。',
      summaryEn: 'The LLM result is unavailable, so a local decision chain is generated from the real playback path.',
      provider: {
        id: 'playback-fallback',
        label: 'Playback',
        status: locale === 'en' ? 'Fallback from real playback' : '已从真实播放兜底',
        connected: false,
      },
      timeline,
      decisions: [],
      sections: [],
      fallback: true,
    };
  }

  function localizeRouteAnalysisOutput(analysis, locale = state.locale) {
    if (!analysis) {
      return null;
    }
    const analysisKind = String(analysis?.analysisKind || '');
    if (analysisKind === 'decision-plan') {
      const localizedTimeline = (Array.isArray(analysis.timeline) ? analysis.timeline : [])
        .filter(Boolean)
        .map((item, index) => ({
          ...item,
          order: Math.max(1, Math.round(Number(item?.order || index + 1))),
          localizedThought: getLocalizedDecisionPlanThought(item, locale),
        }))
        .filter((item) => item.localizedThought)
        .sort((left, right) => left.order - right.order)
        .map((item, index) => ({
          ...item,
          sourceOrder: item.sourceOrder ?? item.order,
          order: index + 1,
        }));
      const localizedSections = Array.isArray(analysis.sections) ? analysis.sections.slice() : [];
      return {
        ...analysis,
        timeline: localizedTimeline,
        sections: localizedSections,
      };
    }
    const localizedSections = (Array.isArray(analysis.sections) ? analysis.sections : [])
      .map((section) => {
        const title = locale === 'en'
          ? (section.titleEn || section.title_en || section.title || section.titleZh || section.title_zh)
          : (section.titleZh || section.title_zh || section.title || section.titleEn || section.title_en);
        const bullets = locale === 'en'
          ? (section.bulletsEn || section.bullets_en || section.bullets || section.items || section.bulletsZh || section.bullets_zh)
          : (section.bulletsZh || section.bullets_zh || section.bullets || section.items || section.bulletsEn || section.bullets_en);
        return {
          ...section,
          title: String(title || '').trim(),
          bullets: (Array.isArray(bullets) ? bullets : [])
            .map((item) => String(item || '').trim())
            .filter(Boolean),
        };
      })
      .filter((section) => section.title && section.bullets.length);
    return {
      ...analysis,
      sections: localizedSections,
    };
  }

  function hydrateRouteAnalysisFromHeatmapPlayback(locale = state.locale) {
    return buildPlaybackRouteAnalysisSnapshot(locale);
  }

  function buildPlaybackRouteAnalysisSnapshot(locale = state.locale) {
    const playbackAnalysis = getPlaybackRouteAnalysisResult();
    if (playbackAnalysis) {
      const hasTimeline = Array.isArray(playbackAnalysis.timeline) && playbackAnalysis.timeline.length > 0;
      if (playbackAnalysis.failed || !hasTimeline) {
        return buildPlaybackFallbackDecisionPlan(locale) || localizeRouteAnalysisOutput(playbackAnalysis, locale);
      }
      return localizeRouteAnalysisOutput(playbackAnalysis, locale);
    }
    return buildPlaybackFallbackDecisionPlan(locale);
  }

  function shouldRequestRouteAnalysisForCurrentState() {
    if (getPlaybackRouteAnalysisResult()) {
      return false;
    }
    return false;
  }

  function getVisualizationDetailTimelineActiveOrder(timeline = []) {
    const orderedTimeline = Array.isArray(timeline)
      ? timeline
        .filter(Boolean)
        .slice()
        .sort((left, right) => Number(left?.order || 0) - Number(right?.order || 0))
      : [];
    if (!orderedTimeline.length) {
      return null;
    }

    const inspection = getCurrentFocusInspection() || null;
    const playbackSnapshot = getPlaybackSnapshotAtTime() || null;
    const playback = getActivePlayback() || state.scenario?.precomputedPlayback || null;
    const currentTime = Number.isFinite(Number(state.scenario?.playbackRevealTime))
      ? Number(state.scenario.playbackRevealTime)
      : (
        Number.isFinite(Number(playbackSnapshot?.time))
          ? Number(playbackSnapshot.time)
          : Number(inspection?.time ?? playback?.startTime ?? state.scenario?.time ?? 0)
      );
    const currentProgress = clamp(
      Number(
        playbackSnapshot?.progress
        ?? inspection?.progress
        ?? state.scenario?.focusAgent?.progress
        ?? 0
      ),
      0,
      1
    );
    const currentRestState = String(
      playbackSnapshot?.restState
      ?? inspection?.restState
      ?? state.scenario?.focusAgent?.restState
      ?? ''
    ).trim() || null;
    const currentDecisionNodeId = String(
      playbackSnapshot?.decisionDiagnostics?.decisionNodeId
      ?? inspection?.decisionDiagnostics?.decisionNodeId
      ?? state.scenario?.focusAgent?.activeDecisionNodeId
      ?? state.scenario?.focusAgent?.lastDecisionNodeId
      ?? ''
    ).trim() || null;
    const currentSelectedTargetNodeId = String(
      playbackSnapshot?.selectedTargetNodeId
      ?? inspection?.selectedTargetNodeId
      ?? state.scenario?.focusAgent?.selectedTargetNodeId
      ?? ''
    ).trim() || null;
    const currentTopBurdenId = String(
      playbackSnapshot?.topBurdenId
      ?? inspection?.topBurdenId
      ?? state.scenario?.focusAgent?.topBurdenId
      ?? ''
    ).trim() || null;
    const currentWalkingSpeed = Number(
      playbackSnapshot?.walkingSpeed
      ?? playbackSnapshot?.currentWalkingSpeed
      ?? playbackSnapshot?.actualWalkingSpeed
      ?? inspection?.walkingSpeed
      ?? state.scenario?.focusAgent?.currentWalkingSpeed
      ?? Number.NaN
    );
    const isStrictRuntimeBoundTimelineItem = (item) => {
      const triggerKind = String(item?.triggerKind || '').trim();
      const triggerEventId = String(item?.triggerEventId || '').trim();
      const triggerEventType = String(item?.triggerEventType || '').trim();
      const triggerRestState = String(item?.triggerRestState || '').trim();
      const triggerBurdenDimension = String(item?.triggerBurdenDimension || '').trim();
      const runtimeRestState = String(item?.runtimeRestState || '').trim();
      return Boolean(
        triggerKind === 'runtime_event'
        || triggerEventId
        || triggerEventType
        || triggerRestState
        || triggerBurdenDimension
        || runtimeRestState
      );
    };
    const isRestTimelineItem = (item) => {
      if (!isStrictRuntimeBoundTimelineItem(item)) {
        return false;
      }
      const eventType = String(item?.triggerEventType || item?.runtimeEventType || '').trim();
      const restState = String(item?.triggerRestState || item?.runtimeRestState || '').trim();
      return (
        eventType === 'short_rest_started'
        || eventType === 'seat_search_started'
        || eventType === 'seat_rest_started'
        || eventType === 'rest_state_changed'
        || eventType === 'rest_resumed'
        || ['searching', 'short-rest', 'sitting', 'standing'].includes(restState)
      );
    };
    const isGuidancePauseTimelineItem = (item) => {
      if (!isStrictRuntimeBoundTimelineItem(item)) {
        return false;
      }
      const eventType = String(item?.triggerEventType || item?.runtimeEventType || '').trim();
      return eventType === 'guidance_pause';
    };
    const canUseTimelineItemAsGenericFallback = (item) => {
      if (isGuidancePauseTimelineItem(item)) {
        return Number.isFinite(currentWalkingSpeed) && currentWalkingSpeed <= 0.05;
      }
      if (!isRestTimelineItem(item)) {
        return true;
      }
      const restState = String(item?.triggerRestState || item?.runtimeRestState || '').trim();
      return Boolean(currentRestState && currentRestState !== 'none' && (!restState || restState === currentRestState));
    };
    const getExplicitProgressGate = (item) => {
      const explicitProgress = Number(item?.progress);
      if (Number.isFinite(explicitProgress)) {
        return clamp(explicitProgress, 0, 1);
      }
      return null;
    };
    const timelineEndTime = (() => {
      const times = orderedTimeline
        .map((item) => Number(item?.timeSeconds))
        .filter((value) => Number.isFinite(value));
      return times.length ? Math.max(...times) : Number.NaN;
    })();
    const playbackEndTime = (() => {
      const explicitEndTime = Number(playback?.endTime);
      if (Number.isFinite(explicitEndTime)) {
        return explicitEndTime;
      }
      const snapshots = Array.isArray(playback?.traceSnapshots) ? playback.traceSnapshots : [];
      const lastSnapshotTime = snapshots.length ? Number(snapshots[snapshots.length - 1]?.time) : Number.NaN;
      if (Number.isFinite(lastSnapshotTime)) {
        return lastSnapshotTime;
      }
      const summaryDuration = Number(playback?.summary?.duration);
      return Number.isFinite(summaryDuration) ? summaryDuration : Number.NaN;
    })();
    const isFinalTimelineItem = (item, index) => {
      const eventType = String(item?.triggerEventType || item?.runtimeEventType || '').trim();
      return index === orderedTimeline.length - 1
        || eventType === 'route_completed'
        || eventType === 'route_incomplete';
    };
    const terminalClusterStartIndex = (() => {
      if (!Number.isFinite(playbackEndTime) || orderedTimeline.length < 3) {
        return -1;
      }
      let clusterStart = -1;
      for (let index = orderedTimeline.length - 1; index >= 0; index -= 1) {
        const item = orderedTimeline[index];
        const itemProgress = getExplicitProgressGate(item);
        const itemTime = Number(item?.timeSeconds);
        const isTerminalLike = Boolean(
          isFinalTimelineItem(item, index)
          || (itemProgress !== null && itemProgress >= 0.995)
          || (Number.isFinite(itemTime) && itemTime >= playbackEndTime - 0.5)
        );
        if (!isTerminalLike) {
          break;
        }
        clusterStart = index;
      }
      return clusterStart >= 0 && clusterStart < orderedTimeline.length - 1 ? clusterStart : -1;
    })();
    const isInTerminalCluster = (index) => terminalClusterStartIndex >= 0 && index >= terminalClusterStartIndex;
    const getTerminalClusterRatio = (index) => {
      if (!isInTerminalCluster(index)) {
        return null;
      }
      const clusterLength = Math.max(1, orderedTimeline.length - terminalClusterStartIndex);
      return clamp((index - terminalClusterStartIndex + 1) / clusterLength, 0, 1);
    };
    const getEffectiveProgressGate = (item, index) => {
      const explicitProgress = getExplicitProgressGate(item);
      const ratio = getTerminalClusterRatio(index);
      if (ratio === null) {
        return explicitProgress;
      }
      const previousProgress = terminalClusterStartIndex > 0
        ? getExplicitProgressGate(orderedTimeline[terminalClusterStartIndex - 1])
        : 0;
      const startProgress = previousProgress === null ? 0 : clamp(previousProgress, 0, 1);
      return clamp(startProgress + (1 - startProgress) * ratio, 0, 1);
    };
    const getEffectiveTimeGate = (item, index) => {
      const itemTime = Number(item?.timeSeconds);
      const ratio = getTerminalClusterRatio(index);
      if (ratio === null || !Number.isFinite(playbackEndTime)) {
        return itemTime;
      }
      const previousTime = terminalClusterStartIndex > 0
        ? Number(orderedTimeline[terminalClusterStartIndex - 1]?.timeSeconds)
        : Number.NaN;
      const startTime = Number.isFinite(previousTime) ? previousTime : Number(playback?.startTime || 0);
      return startTime + Math.max(0, playbackEndTime - startTime) * ratio;
    };
    const isTerminalTimelineItem = (item, index) => {
      return isFinalTimelineItem(item, index);
    };
    const isTerminalTimelineItemReached = (item, index) => {
      if (!isTerminalTimelineItem(item, index)) {
        return true;
      }
      const finalTime = Number.isFinite(playbackEndTime) ? playbackEndTime : timelineEndTime;
      if (!Number.isFinite(finalTime)) {
        return currentProgress >= 0.985;
      }
      return currentTime >= finalTime - 0.35;
    };
    const isCollapsedTerminalClusterItemReached = (item, index) => {
      if (!isInTerminalCluster(index)) {
        return true;
      }
      if (isFinalTimelineItem(item, index)) {
        return true;
      }
      const effectiveTime = getEffectiveTimeGate(item, index);
      return !Number.isFinite(effectiveTime) || effectiveTime <= currentTime + 1e-6;
    };
    const isTimelineItemReached = (item) => {
      const itemTime = Number(item?.timeSeconds);
      const progressGate = getExplicitProgressGate(item);
      const timeReached = Number.isFinite(itemTime) ? itemTime <= currentTime + 1e-6 : true;
      const progressReached = progressGate === null || progressGate <= currentProgress + 1e-6;
      return timeReached && progressReached;
    };
    const getTriggerAlignedItem = (items = []) => {
      const decisionMatches = items.filter((item) => {
        const triggerDecisionNodeId = String(item?.triggerDecisionNodeId || '').trim() || null;
        const triggerTargetNodeId = String(item?.triggerTargetNodeId || '').trim() || null;
        if (!triggerDecisionNodeId || triggerDecisionNodeId !== currentDecisionNodeId) {
          return false;
        }
        if (triggerTargetNodeId && currentSelectedTargetNodeId && triggerTargetNodeId !== currentSelectedTargetNodeId) {
          return false;
        }
        return isTimelineItemReached(item);
      });
      if (decisionMatches.length) {
        return decisionMatches[decisionMatches.length - 1];
      }

      const runtimeMatches = items.filter((item) => {
        const triggerKind = String(item?.triggerKind || '').trim() || null;
        const triggerEventType = String(item?.triggerEventType || '').trim() || null;
        const triggerRestState = String(item?.triggerRestState || item?.runtimeRestState || '').trim() || null;
        const triggerBurdenDimension = String(item?.triggerBurdenDimension || '').trim() || null;
        if (triggerKind !== 'runtime_event' && !triggerEventType && !triggerRestState && !triggerBurdenDimension) {
          return false;
        }
        const restMatch = Boolean(triggerRestState && currentRestState && triggerRestState === currentRestState);
        const eventTypeMatch = (
          (triggerEventType === 'seat_search_started' && currentRestState === 'searching')
          || (triggerEventType === 'short_rest_started' && currentRestState === 'short-rest')
          || (triggerEventType === 'rest_state_changed' && Boolean(triggerRestState) && triggerRestState === currentRestState)
          || (triggerEventType === 'burden_spike' && Boolean(triggerBurdenDimension) && triggerBurdenDimension === currentTopBurdenId)
          || (triggerEventType === 'guidance_pause' && Number.isFinite(currentWalkingSpeed) && currentWalkingSpeed <= 0.05)
        );
        if (!restMatch && !eventTypeMatch) {
          return false;
        }
        return isTimelineItemReached(item);
      });
      if (runtimeMatches.length) {
        return runtimeMatches[runtimeMatches.length - 1];
      }
      return null;
    };
    const getRestStateAlignedItem = (items = []) => {
      if (!currentRestState || currentRestState === 'none') {
        return null;
      }
      let bestMatch = null;
      items.forEach((item) => {
        if (!isStrictRuntimeBoundTimelineItem(item)) {
          return;
        }
        const runtimeRestState = String(item?.runtimeRestState || '').trim() || null;
        if (!runtimeRestState || runtimeRestState !== currentRestState) {
          return;
        }
        const itemTime = Number(item?.timeSeconds);
        const itemProgress = Number(item?.progress);
        const timeReached = Number.isFinite(itemTime) ? itemTime <= currentTime + 1e-6 : true;
        const progressReached = Number.isFinite(itemProgress) ? clamp(itemProgress, 0, 1) <= currentProgress + 1e-6 : true;
        if (timeReached && progressReached) {
          bestMatch = item;
        }
      });
      return bestMatch;
    };
    const getGuidancePauseAlignedItem = (items = []) => {
      if (!Number.isFinite(currentWalkingSpeed) || currentWalkingSpeed > 0.05) {
        return null;
      }
      let bestMatch = null;
      items.forEach((item) => {
        if (!isGuidancePauseTimelineItem(item)) {
          return;
        }
        if (!isTimelineItemReached(item)) {
          return;
        }
        bestMatch = item;
      });
      return bestMatch;
    };
    const stateAlignedItem = getRestStateAlignedItem(orderedTimeline) || getGuidancePauseAlignedItem(orderedTimeline);
    if (stateAlignedItem) {
      return stateAlignedItem.order || null;
    }

    const finiteTimes = orderedTimeline
      .map((item) => Number(item?.timeSeconds))
      .filter((value) => Number.isFinite(value));
    const explicitProgressTimeline = orderedTimeline.filter((item) => Number.isFinite(Number(item?.progress)));
    if (explicitProgressTimeline.length) {
      let bestProgressItem = explicitProgressTimeline[0];
      explicitProgressTimeline.forEach((item) => {
        const originalIndex = orderedTimeline.findIndex((timelineItem) => timelineItem === item);
        const itemProgress = getEffectiveProgressGate(item, originalIndex);
        if (
          itemProgress !== null
          && itemProgress <= currentProgress + 1e-6
          && isTerminalTimelineItemReached(item, originalIndex)
          && isCollapsedTerminalClusterItemReached(item, originalIndex)
          && canUseTimelineItemAsGenericFallback(item)
        ) {
          bestProgressItem = item;
        }
      });
      return bestProgressItem?.order || orderedTimeline[0]?.order || null;
    }

    const minTime = finiteTimes.length ? Math.min(...finiteTimes) : Number.NaN;
    const maxTime = finiteTimes.length ? Math.max(...finiteTimes) : Number.NaN;
    const hasDistinctTimelineTimes = finiteTimes.length >= 2 && Number.isFinite(maxTime - minTime) && (maxTime - minTime) > 0.5;
    if (hasDistinctTimelineTimes) {
      let bestTimedItem = orderedTimeline[0];
      orderedTimeline.forEach((item, index) => {
        const itemTime = getEffectiveTimeGate(item, index);
        if (
          Number.isFinite(itemTime)
          && itemTime <= currentTime + 1e-6
          && isTerminalTimelineItemReached(item, index)
          && canUseTimelineItemAsGenericFallback(item)
        ) {
          bestTimedItem = item;
        }
      });
      return bestTimedItem?.order || orderedTimeline[0]?.order || null;
    }

    const sampledTimeline = orderedTimeline
      .map((item) => ({
        ...item,
        sampleOrder: parseTimelineSampleOrder(item?.nodeId || ''),
      }))
      .filter((item) => item.sampleOrder !== null);
    if (sampledTimeline.length) {
      const maxSampleOrder = sampledTimeline.reduce((maxValue, item) => Math.max(maxValue, Number(item.sampleOrder || 0)), 1);
      let bestSampleItem = sampledTimeline[0];
      sampledTimeline.forEach((item) => {
        const sampleThreshold = maxSampleOrder <= 1
          ? 0
          : clamp(Number(item.sampleOrder || 1) / maxSampleOrder, 0, 1);
        const originalIndex = orderedTimeline.findIndex((timelineItem) => timelineItem.order === item.order);
        if (
          sampleThreshold <= currentProgress + 1e-6
          && isTerminalTimelineItemReached(item, originalIndex)
          && isCollapsedTerminalClusterItemReached(item, originalIndex)
          && canUseTimelineItemAsGenericFallback(item)
        ) {
          bestSampleItem = item;
        }
      });
      return bestSampleItem?.order || orderedTimeline[0]?.order || null;
    }

    const maxTimelineIndex = Math.max(1, orderedTimeline.length - 1);
    let fallbackBest = orderedTimeline[0] || null;
    orderedTimeline.forEach((item, index) => {
      const threshold = clamp(index / maxTimelineIndex, 0, 1);
      if (
        threshold <= currentProgress + 1e-6
        && isTerminalTimelineItemReached(item, index)
        && isCollapsedTerminalClusterItemReached(item, index)
        && canUseTimelineItemAsGenericFallback(item)
      ) {
        fallbackBest = item;
      }
    });
    return fallbackBest?.order || null;
  }

  function getVisualizationIssueImpactTone(value) {
    const numeric = clamp(Number(value || 0), 0, 100);
    if (numeric >= 80) return 'high';
    if (numeric >= 60) return 'medium-high';
    if (numeric >= 40) return 'medium';
    if (numeric >= 20) return 'medium-low';
    return 'low';
  }

  function getVisualizationIssueImpactLabel(value, locale = state.locale) {
    const tone = getVisualizationIssueImpactTone(value);
    const labels = locale === 'en'
      ? {
        high: 'High impact',
        'medium-high': 'Medium-high impact',
        medium: 'Medium impact',
        'medium-low': 'Medium-low impact',
        low: 'Low impact',
      }
      : {
        high: '高影响',
        'medium-high': '较高影响',
        medium: '中等影响',
        'medium-low': '较低影响',
        low: '低影响',
      };
    return {
      tone,
      label: labels[tone],
    };
  }

  function getVisualizationDetailCurrentModeLabel(viewMode = getSafeViewMode(state.visualizationDetailView || state.viewMode)) {
    const analysis = getPlaybackRouteAnalysisResult();
    const providerLabel = String(
      analysis?.provider?.label
      || analysis?.providerLabel
      || analysis?.provider?.id
      || ''
    ).trim();
    return providerLabel || getVisualizationViewTitle(viewMode);
  }

  function getVisualizationDetailApiStatusLabel(locale = state.locale) {
    const analysis = getPlaybackRouteAnalysisResult();
    const providerStatus = String(
      analysis?.provider?.status
      || analysis?.providerStatus
      || analysis?.model
      || ''
    ).trim();
    if (providerStatus) {
      return providerStatus;
    }
    if (state.localSimServerStatus === 'online') {
      return locale === 'en' ? 'Online' : '在线';
    }
    if (state.localSimServerStatus === 'offline') {
      return locale === 'en' ? 'Offline' : '离线';
    }
    return locale === 'en' ? 'Checking' : '检测中';
  }

  function buildVisualizationDetailCotMetaMarkup(activeView, locale = state.locale) {
    const currentModeLabel = locale === 'en' ? 'Current Mode' : 'Current Mode';
    const apiStatusLabel = locale === 'en' ? 'API Status' : 'API Status';
    return `
      <div class="visualization-detail__report-meta">
        <div class="visualization-detail__report-meta-column">
          <span class="visualization-detail__report-meta-label">${escapeHtml(currentModeLabel)}</span>
          <span class="visualization-detail__report-meta-value">${escapeHtml(getVisualizationDetailCurrentModeLabel(activeView))}</span>
        </div>
        <div class="visualization-detail__report-meta-column">
          <span class="visualization-detail__report-meta-label">${escapeHtml(apiStatusLabel)}</span>
          <span class="visualization-detail__report-meta-value">${escapeHtml(getVisualizationDetailApiStatusLabel(locale))}</span>
        </div>
      </div>
    `;
  }

  function isRestTimelineDisplayItem(item = {}) {
    const isStrictRuntimeBound = Boolean(
      String(item?.triggerKind || '').trim() === 'runtime_event'
      || String(item?.triggerEventId || '').trim()
      || String(item?.triggerEventType || '').trim()
      || String(item?.triggerRestState || '').trim()
      || String(item?.triggerBurdenDimension || '').trim()
    );
    if (!isStrictRuntimeBound) {
      return false;
    }
    const eventType = String(item?.triggerEventType || item?.runtimeEventType || '').trim();
    const restState = String(item?.triggerRestState || item?.runtimeRestState || '').trim();
    return (
      eventType === 'short_rest_started'
      || eventType === 'seat_search_started'
      || eventType === 'seat_rest_started'
      || eventType === 'rest_state_changed'
      || eventType === 'rest_resumed'
      || ['searching', 'short-rest', 'sitting', 'standing'].includes(restState)
    );
  }

  function isGuidancePauseTimelineDisplayItem(item = {}) {
    const isStrictRuntimeBound = Boolean(
      String(item?.triggerKind || '').trim() === 'runtime_event'
      || String(item?.triggerEventId || '').trim()
      || String(item?.triggerEventType || '').trim()
      || String(item?.triggerRestState || '').trim()
      || String(item?.triggerBurdenDimension || '').trim()
    );
    if (!isStrictRuntimeBound) {
      return false;
    }
    const eventType = String(item?.triggerEventType || item?.runtimeEventType || '').trim();
    const walkingSpeed = Number(item?.walkingSpeed ?? item?.currentWalkingSpeed);
    return eventType === 'guidance_pause' && (!Number.isFinite(walkingSpeed) || walkingSpeed <= 0.05);
  }

  function sanitizeTimelineDisplayText(text = '', item = {}) {
    let sanitized = String(text || '')
      .replace(/左手边|右手边|左侧|右侧|左边|右边|左前方|右前方|左后方|右后方/g, '附近')
      .replace(/往左|向左|往右|向右/g, '顺着指引')
      .replace(/\bon\s+the\s+(left|right)\b/gi, 'nearby')
      .replace(/\bto\s+the\s+(left|right)\b/gi, 'along the route')
      .replace(/\b(left|right)\s+side\b/gi, 'nearby area')
      .replace(/\b(left|right)\b/gi, 'nearby');
    if (isRestTimelineDisplayItem(item)) {
      return sanitized;
    }
    const preserveStopWording = isGuidancePauseTimelineDisplayItem(item);
    sanitized = sanitized
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

  function buildVisualizationDetailBurdenRankingMarkup(issueItems, activeView, locale) {
    if (!issueItems.length) {
      return `<div class="visualization-detail__empty">${escapeHtml(t('visualization.detailNoIssues'))}</div>`;
    }
    return `
      <div class="visualization-detail__burden-ranking">
        ${issueItems.slice(0, 5).map((item, index) => `
          <button
            class="visualization-detail__burden-rank-item${item.actionViewMode === activeView ? ' is-active' : ''}"
            type="button"
            data-detail-burden-view="${escapeHtml(item.actionViewMode || '')}">
            <span class="visualization-detail__burden-rank-order">${escapeHtml(String(index + 1))}</span>
            <span class="visualization-detail__burden-rank-label">${escapeHtml(item.name || item.id || '--')}</span>
            <span class="visualization-detail__burden-rank-value">${escapeHtml(formatMetricValue(item.pressure || item.score || 0))}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  function buildVisualizationDetailIssueCardMarkup(item, options = {}) {
    const locale = options.locale || state.locale;
    const showOrder = options.showOrder !== false;
    const orderText = showOrder ? `<span class="visualization-detail__issue-order">${escapeHtml(String(options.order || item.rank || ''))}</span>` : '';
    const hotspotTargets = resolveHotspotTargets(item)
      .filter((target) => target.type === 'pressure' || target.type === 'seat');
    const hotspotLinkId = hotspotTargets.length ? (item.id || item.mapTargetId || item.mapTargetIds?.[0] || '') : '';
    const isClickable = Boolean(hotspotLinkId || item.actionViewMode);
    const isActive = hotspotLinkId ? itemMatchesHotspotSelection(item) : (item.actionViewMode && item.actionViewMode === state.visualizationDetailView);
    const impact = getVisualizationIssueImpactLabel(item.pressure || item.score || 0, locale);
    const problemLabel = locale === 'en' ? 'Issue' : '问题内容';
    const adviceLabel = locale === 'en' ? 'Suggestion' : '建议';
    const impactLabel = locale === 'en' ? 'Impact' : '影响程度';
    const summaryText = item.summary || item.feature || item.name || '--';
    const adviceText = item.advice || getSuggestionByCategoryText(item.category, locale) || '--';
    return `
      <article
        class="visualization-detail__issue-panel${item.isStatusCard ? ' visualization-detail__issue-panel--status' : ''}${isClickable ? ' is-clickable' : ''}${isActive ? ' is-active' : ''}"
        ${hotspotLinkId ? `data-detail-hotspot-id="${escapeHtml(hotspotLinkId)}"` : ''}
        ${item.actionViewMode ? `data-detail-burden-view="${escapeHtml(item.actionViewMode)}"` : ''}>
        <div class="visualization-detail__issue-head">
          ${orderText}
          <div class="visualization-detail__issue-heading">${escapeHtml(item.name || item.id || '--')}</div>
        </div>
        ${item.showImpact === false ? '' : `
          <div class="visualization-detail__issue-impact">
            <span class="visualization-detail__issue-impact-label">${escapeHtml(impactLabel)}</span>
            <span class="visualization-detail__issue-impact-level ${escapeHtml(`is-${impact.tone}`)}">${escapeHtml(impact.label)}</span>
          </div>
        `}
        <div class="visualization-detail__issue-section-label">${escapeHtml(problemLabel)}</div>
        <p class="visualization-detail__issue-copy">${escapeHtml(summaryText)}</p>
        <div class="visualization-detail__issue-section-label">${escapeHtml(adviceLabel)}</div>
        <p class="visualization-detail__issue-copy">${escapeHtml(adviceText)}</p>
      </article>
    `;
  }

  function buildVisualizationDetailCotMarkup() {
    const locale = state.locale === 'en' ? 'en' : 'zh-CN';
    const activeView = getSafeViewMode(state.visualizationDetailView || state.viewMode);
    const hasPlaybackAnalysis = Boolean(getPlaybackRouteAnalysisResult());
    const defaultLlmAnalysis = hydrateRouteAnalysisFromHeatmapPlayback(locale);
    const localizedLlmAnalysis = defaultLlmAnalysis;
    const llmAnalysis = hasPlaybackAnalysis ? defaultLlmAnalysis : localizedLlmAnalysis;
    const timeline = Array.isArray(llmAnalysis?.timeline) ? llmAnalysis.timeline : [];
    const activeTimelineOrder = getVisualizationDetailTimelineActiveOrder(timeline);
    if (!timeline.length) {
      const fallbackMessage = locale === 'en'
        ? (llmAnalysis?.placeholderEn || llmAnalysis?.summaryEn || t('hint.summaryEmpty'))
        : (llmAnalysis?.placeholderZh || llmAnalysis?.summaryZh || t('hint.summaryEmpty'));
      return `
        <div class="visualization-detail__report-stack">
          <div class="visualization-detail__report-header">
            <h3 class="visualization-detail__report-title visualization-detail__report-title--icon">${getVisualizationDetailIcon('brain')}<span>${escapeHtml(t('visualization.detailCotTitle'))}</span></h3>
            ${buildVisualizationDetailCotMetaMarkup(activeView, locale)}
          </div>
          <div class="visualization-detail__empty">${escapeHtml(fallbackMessage)}</div>
        </div>
      `;
    }
    return `
      <div class="visualization-detail__report-stack">
        <div class="visualization-detail__report-header">
          <h3 class="visualization-detail__report-title visualization-detail__report-title--icon">${getVisualizationDetailIcon('brain')}<span>${escapeHtml(t('visualization.detailCotTitle'))}</span></h3>
          ${buildVisualizationDetailCotMetaMarkup(activeView, locale)}
        </div>
        <div class="visualization-detail__timeline">
          ${timeline.map((item) => `
            <div class="visualization-detail__timeline-item${item.order === activeTimelineOrder ? ' is-active' : ''}" data-timeline-order="${escapeHtml(String(item.order || ''))}">
              <div class="visualization-detail__timeline-marker"></div>
              <p class="visualization-detail__timeline-copy">${escapeHtml(sanitizeTimelineDisplayText(item.localizedThought || '', item))}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function buildVisualizationDetailIssuesMarkup() {
    const activeView = getSafeViewMode(state.visualizationDetailView || state.viewMode);
    const panelState = getVisualizationDetailIssuePanelState(activeView);
    const locale = state.locale === 'en' ? 'en' : 'zh-CN';
    const issueItems = panelState.mode === 'issues' ? panelState.items : [];
    const vitalityStatusItem = activeView === 'vitality'
      ? issueItems.find((item) => item.isStatusCard) || null
      : null;
    const detailIssueItems = activeView === 'vitality'
      ? issueItems.filter((item) => !item.isStatusCard).slice(0, 3)
      : (activeView !== COMPOSITE_BURDEN_VIEW ? issueItems.slice(0, 3) : issueItems.slice(0, 5));
    let issueMarkup = '';
    if (activeView === COMPOSITE_BURDEN_VIEW) {
      issueMarkup = buildVisualizationDetailBurdenRankingMarkup(detailIssueItems, activeView, locale);
    } else if (detailIssueItems.length || vitalityStatusItem) {
      issueMarkup = `
        <div class="visualization-detail__issue-list">
          ${vitalityStatusItem ? buildVisualizationDetailIssueCardMarkup(vitalityStatusItem, { locale, showOrder: false }) : ''}
          ${detailIssueItems.map((item, index) => buildVisualizationDetailIssueCardMarkup(item, { locale, order: index + 1 })).join('')}
        </div>
      `;
    } else {
      issueMarkup = `<div class="visualization-detail__empty">${escapeHtml(panelState.summary || t('visualization.detailNoIssues'))}</div>`;
    }
    return `
      <div class="visualization-detail__report-stack">
        <div class="visualization-detail__report-header">
          <h3 class="visualization-detail__report-title visualization-detail__report-title--icon">${getVisualizationDetailIcon('suggestion')}<span>${escapeHtml(t('visualization.detailIssuesTitle'))}</span></h3>
        </div>
        ${issueMarkup}
      </div>
    `;
  }

  function openVisualizationDetailView(viewId = COMPOSITE_BURDEN_VIEW) {
    ensurePlaybackScenarioState();
    syncScenarioToPlaybackArtifacts(getActivePlayback() || state.scenario?.precomputedPlayback || null);
    const previousDetailView = getSafeViewMode(state.visualizationDetailView || state.viewMode);
    const safeViewId = getSafeViewMode(viewId);
    applyVisualizationDetailSeatLayerPolicy(safeViewId, previousDetailView);
    state.visualizationDetailView = safeViewId;
    state.viewMode = state.visualizationDetailView;
    state.visualizationDetailLayerMenuOpen = false;
    state.visualizationDetailLayerHoveredValue = null;
    state.visualizationDetailHoverTarget = null;
    state.visualizationDetailHoverPointer = null;
    state.visualizationDetailSelectedIssue = null;
    state.selectedHotspotId = null;
    state.selectedHotspotOverlaySnapshot = null;
    state.visualizationDetailCotMarkupCache = '';
    state.visualizationDetailIssuesMarkupCache = '';
    state.visualizationDetailCotRenderedAt = 0;
    state.visualizationDetailIssuesRenderedAt = 0;
    state.visualizationDetailStageDeferredView = safeViewId;
    state.visualizationDetailStageRenderScheduled = false;
    state.suppressNextDetailLayerTriggerClick = false;
    state.suppressNextDetailLayerMenuClick = false;
    requestRender();
  }

  function closeVisualizationDetailView() {
    applyVisualizationDetailSeatLayerPolicy(COMPOSITE_BURDEN_VIEW, getSafeViewMode(state.visualizationDetailView || state.viewMode));
    state.visualizationDetailView = null;
    state.visualizationDetailLayerMenuOpen = false;
    state.visualizationDetailLayerHoveredValue = null;
    state.visualizationDetailHoverTarget = null;
    state.visualizationDetailHoverPointer = null;
    state.visualizationDetailSelectedIssue = null;
    state.selectedHotspotId = null;
    state.selectedHotspotOverlaySnapshot = null;
    state.visualizationDetailCotMarkupCache = '';
    state.visualizationDetailIssuesMarkupCache = '';
    state.visualizationDetailCotRenderedAt = 0;
    state.visualizationDetailIssuesRenderedAt = 0;
    state.visualizationDetailStageDeferredView = null;
    state.visualizationDetailStageRenderScheduled = false;
    state.suppressNextDetailLayerTriggerClick = false;
    state.suppressNextDetailLayerMenuClick = false;
    requestRender();
  }

  function handleVisualizationCardActivate(event) {
    const card = event.currentTarget?.dataset?.vizCard
      ? event.currentTarget
      : event.target.closest('[data-viz-card]');
    const viewId = card?.dataset?.vizCard;
    if (!viewId) {
      return;
    }
    openVisualizationDetailView(viewId);
  }

  function handleVisualizationCardKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleVisualizationCardActivate(event);
  }

  function handleVisualizationDetailSwitch(event) {
    const viewId = event.target?.value;
    if (!viewId) {
      return;
    }
    openVisualizationDetailView(viewId);
  }

  function handleVisualizationDetailIssueClick(event) {
    if (event.type === 'click' && state.suppressNextDetailIssueClick) {
      state.suppressNextDetailIssueClick = false;
      return;
    }
    if (!elements.visualizationDetailIssues) {
      return;
    }
    const burdenButton = event.target.closest('[data-detail-burden-view]');
    if (burdenButton && elements.visualizationDetailIssues.contains(burdenButton)) {
      const viewId = burdenButton.dataset?.detailBurdenView;
      if (!viewId) {
        return;
      }
      event.stopPropagation();
      state.visualizationDetailSelectedIssue = null;
      state.selectedHotspotId = null;
      state.selectedHotspotOverlaySnapshot = null;
      closePointPopover();
      openVisualizationDetailView(viewId);
      return;
    }
    const hotspotCard = event.target.closest('[data-detail-hotspot-id]');
    if (!hotspotCard || !elements.visualizationDetailIssues.contains(hotspotCard)) {
      return;
    }
    event.stopPropagation();
    const hotspotId = hotspotCard.dataset?.detailHotspotId;
    const hotspot = getHotspotById(hotspotId);
    if (!hotspot) {
      return;
    }
    const hotspotTargets = resolveHotspotTargets(hotspot)
      .filter((target) => target.type === 'pressure' || target.type === 'seat');
    if (!hotspotTargets.length) {
      return;
    }
    state.visualizationDetailSelectedIssue = {
      id: hotspot.id,
      name: hotspot.name || hotspot.id || '',
      category: hotspot.category || '',
      feature: hotspot.feature || '',
      pressure: hotspot.pressure,
      score: hotspot.score,
      mapTargetId: hotspot.mapTargetId || hotspotTargets[0]?.item?.id || null,
      mapTargetIds: Array.from(new Set([
        ...(Array.isArray(hotspot.mapTargetIds) ? hotspot.mapTargetIds : []),
        hotspot.mapTargetId,
        ...hotspotTargets.map((target) => target?.item?.id).filter(Boolean),
      ])),
    };
    const nextHotspotId = state.selectedHotspotId === hotspot.id ? null : hotspot.id;
    state.animationPaused = true;
    state.selectedHotspotId = nextHotspotId;
    state.selectedHotspotOverlaySnapshot = {
      selectionId: hotspot.id,
      items: buildSelectedHotspotOverlayEntries(hotspot),
    };
    if (!state.selectedHotspotId) {
      state.visualizationDetailSelectedIssue = null;
      state.selectedHotspotOverlaySnapshot = null;
    }
    closePointPopover();
    requestRender();
  }

  function handleVisualizationDetailIssuePointerDown(event) {
    const interactiveTarget = event.target.closest('[data-detail-burden-view], [data-detail-hotspot-id]');
    if (!interactiveTarget || !elements.visualizationDetailIssues?.contains(interactiveTarget)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    state.suppressNextDetailIssueClick = true;
    handleVisualizationDetailIssueClick(event);
  }

  function handleVisualizationDetailLayerSelect(event) {
    state.activeLayerCategory = event.target?.value || null;
    closePointPopover();
    requestRender();
  }

  function getVisualizationShellCopy() {
    if (state.visualizationDetailView) {
      return {
        section: t('visualization.detailSection') || 'Section 04',
        title: t('visualization.detailTitle') || 'Detailed Route Diagnosis',
        back: state.locale === 'en' ? 'Back to Overview' : '返回总览',
      };
    }
    return {
      section: t('visualization.section'),
      title: t('visualization.title'),
      back: state.locale === 'en' ? 'Back to Attribute Settings' : '返回属性设置',
    };
  }

  function renderVisualizationDetailView() {
    const activeView = state.visualizationDetailView ? getSafeViewMode(state.visualizationDetailView) : null;
    if (elements.visualizationOverview) {
      elements.visualizationOverview.classList.toggle('hidden', Boolean(activeView));
    }
    if (elements.visualizationDetail) {
      elements.visualizationDetail.classList.toggle('hidden', !activeView);
    }
    elements.visualizationCards.forEach((item) => {
      item.card.classList.toggle('is-active', item.id === activeView);
    });
    if (!activeView || !elements.visualizationDetail) {
      return;
    }
    if (elements.visualizationDetailStageTitle) {
      elements.visualizationDetailStageTitle.textContent = getVisualizationViewTitle(activeView);
    }
    if (elements.visualizationDetailStageDescription) {
      elements.visualizationDetailStageDescription.textContent = getVisualizationViewDescription(activeView);
    }
    if (elements.visualizationDetailViewSelect) {
      const options = getVisualizationDetailViewOptions();
      elements.visualizationDetailViewSelect.innerHTML = options
        .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
        .join('');
      elements.visualizationDetailViewSelect.value = activeView;
    }
    if (state.visualizationDetailStageDeferredView === activeView) {
      clearVisualizationStageCanvas(elements.visualizationDetailBackground);
      clearVisualizationStageCanvas(elements.visualizationDetailHeat);
      if (elements.visualizationDetailOverlay) {
        elements.visualizationDetailOverlay.innerHTML = '';
      }
      scheduleVisualizationDetailStageRender(activeView);
    } else {
      renderVisualizationStage(activeView, {
        base: elements.visualizationDetailBase,
        background: elements.visualizationDetailBackground,
        heat: elements.visualizationDetailHeat,
        overlay: elements.visualizationDetailOverlay,
        min: null,
        max: null,
      });
    }
    renderVisualizationDetailStageHeader(activeView);
    renderVisualizationStatusMonitor(elements.visualizationDetailStatus);
    renderVisualizationCapabilityRadar(elements.visualizationDetailRadar);
    renderVisualizationBurdenFeedback(elements.visualizationDetailFeedback);
    renderVisualizationDetailLayerSelect(elements.visualizationDetailLayerSelect, elements.visualizationDetailLayerMenu);
    if (elements.visualizationDetailCot) {
      const nextCotMarkup = buildVisualizationDetailCotMarkup();
      const shouldUpdateCot = nextCotMarkup !== state.visualizationDetailCotMarkupCache;
      if (shouldUpdateCot) {
        elements.visualizationDetailCot.innerHTML = nextCotMarkup;
        state.visualizationDetailCotMarkupCache = nextCotMarkup;
        state.visualizationDetailCotRenderedAt = Date.now();
      }
    }
    if (elements.visualizationDetailIssues) {
      const nextIssuesMarkup = buildVisualizationDetailIssuesMarkup();
      const shouldUpdateIssues = nextIssuesMarkup !== state.visualizationDetailIssuesMarkupCache;
      if (shouldUpdateIssues) {
        elements.visualizationDetailIssues.innerHTML = nextIssuesMarkup;
        state.visualizationDetailIssuesMarkupCache = nextIssuesMarkup;
        state.visualizationDetailIssuesRenderedAt = Date.now();
      }
    }
    restoreVisualizationWorkspaceLayers();
  }

  function renderVisualizationDetailPlaybackFramePanels() {
    if (!state.visualizationDetailView || !elements.visualizationDetail) {
      return;
    }
    renderVisualizationDetailStageMetrics(elements.visualizationDetailStageMetrics);
    renderVisualizationStatusMonitor(elements.visualizationDetailStatus);
    renderVisualizationBurdenFeedback(elements.visualizationDetailFeedback);
    if (elements.visualizationDetailCot) {
      const nextCotMarkup = buildVisualizationDetailCotMarkup();
      if (nextCotMarkup !== state.visualizationDetailCotMarkupCache) {
        elements.visualizationDetailCot.innerHTML = nextCotMarkup;
        state.visualizationDetailCotMarkupCache = nextCotMarkup;
        state.visualizationDetailCotRenderedAt = Date.now();
      }
    }
    if (elements.visualizationDetailIssues) {
      const nextIssuesMarkup = buildVisualizationDetailIssuesMarkup();
      if (nextIssuesMarkup !== state.visualizationDetailIssuesMarkupCache) {
        elements.visualizationDetailIssues.innerHTML = nextIssuesMarkup;
        state.visualizationDetailIssuesMarkupCache = nextIssuesMarkup;
        state.visualizationDetailIssuesRenderedAt = Date.now();
      }
    }
  }

  function renderVisualizationDetailPlaybackFrameStage(shouldRenderOverlay = true) {
    if (!state.visualizationDetailView || !elements.visualizationDetailOverlay) {
      return;
    }
    const stageFrame = elements.visualizationDetailOverlay.parentElement
      || elements.visualizationDetailBase?.parentElement
      || null;
    const stageTransform = computeTransformForContainer(stageFrame);
    renderBackgroundCrowdCanvas({
      targetCanvas: elements.visualizationDetailBackground,
      transform: stageTransform,
    });
    if (shouldRenderOverlay) {
      renderOverlayLayer({
        target: elements.visualizationDetailOverlay,
        transform: stageTransform,
        isVisualizationDetail: true,
        showAllNodes: true,
        activeLayerCategories: getVisualizationDetailActiveLayerCategories(),
      });
    }
  }

  function renderVisualizationShell() {
    if (state.uiScreen !== 'workspace' || !elements.visualizationShell) {
      return;
    }
    const shellCopy = getVisualizationShellCopy();
    if (elements.visualizationShellEyebrow) {
      elements.visualizationShellEyebrow.textContent = shellCopy.section;
    }
    if (elements.visualizationShellTitle) {
      elements.visualizationShellTitle.textContent = shellCopy.title;
    }
    if (elements.visualizationBackBtn) {
      const label = elements.visualizationBackBtn.querySelector('span');
      if (label) {
        label.textContent = shellCopy.back;
      }
    }
    renderVisualizationDetailView();
    if (!state.visualizationDetailView) {
      renderVisualizationHeatmapCards();
    }
    renderVisualizationEnvironmentPanel();
    renderVisualizationStatusMonitor();
    renderVisualizationCapabilityRadar();
    renderVisualizationBurdenFeedback();
  }

  function updateMapHeader() {
    const targetRegion = state.scenario?.focusTargetRegion || getTargetRegionById();
    const title = targetRegion ? `${t('map.title')} · ${getTargetRegionLabel(targetRegion)}` : t('map.title');
    elements.mapTitle.textContent = title;
    if (!state.prepared) {
      elements.mapStatus.textContent = t('map.empty');
      return;
    }
    if (state.heatmapRunError && !state.heatmapComputing) {
      elements.mapStatus.textContent = state.heatmapRunError;
      return;
    }
    const sourceLabel = getHeatmapSourceLabel();
    if (state.heatmapComputing) {
      const sourceSuffix = state.heatmapSourceInfo?.source && state.heatmapSourceInfo.source !== 'none'
        ? ` · ${sourceLabel}`
        : '';
      elements.mapStatus.textContent = `${t('map.heatComputing')} · ${formatPercent(state.heatmapComputeProgress * 100)}${sourceSuffix}`;
      return;
    }
    if (state.scenario?.heatActive) {
      const statusLabel = (state.heatmapDisplayMode === 'final' && isHeatmapFullyRevealed())
        ? t('map.heatFinal')
        : t('map.heatActive');
      elements.mapStatus.textContent = `${statusLabel} · ${sourceLabel}`;
      return;
    }
    elements.mapStatus.textContent = t('map.loaded');
  }

  function render() {
    ensurePlaybackScenarioState();
    syncScenarioRuntimeState();
    updateLocaleStaticText();
    setModelStatus();
    updateControls();
    updateRouteSummary();
    renderSettingsScreen();
    renderRouteModal();
    renderAgentModal();
    renderReportModal();
    if (state.uiScreen !== 'workspace') {
      return;
    }
    updateMapHeader();
    renderViewHeatLegend();
    renderBaseLayer();
    renderBackgroundCrowdCanvas();
    renderHeatmap();
    renderOverlayLayer();
    renderPointPopover();
    renderSummary();
    renderInspectorAgentSummary();
    renderObjectInspector();
    renderHotspots();
    renderVisualizationShell();
  }

  function renderPlaybackFrame() {
    if (state.uiScreen !== 'workspace') {
      return;
    }
    const shouldRenderOverlay = shouldRenderPlaybackOverlayFrame();
    const shouldRenderUiPanels = shouldRenderPlaybackUiPanels();
    if (state.visualizationDetailView) {
      renderVisualizationDetailPlaybackFrameStage(shouldRenderOverlay);
      syncVisualizationDetailHoverTargetFromPointer();
      if (state.pointPopover.visible) {
        renderPointPopover();
      }
      if (shouldRenderUiPanels) {
        renderVisualizationDetailPlaybackFramePanels();
      }
      return;
    }
    renderBackgroundCrowdCanvas();
    if (shouldRenderHeatmapDuringPlaybackFrame()) {
      renderHeatmap();
    }
    if (shouldRenderOverlay) {
      renderOverlayLayer();
    }
    syncVisualizationDetailHoverTargetFromPointer();
    if (shouldRenderUiPanels && state.selectedDynamic) {
      renderSummary();
      renderInspectorAgentSummary();
      renderHotspots();
    }
    if (shouldRenderUiPanels && state.selectedObject) {
      renderObjectInspector();
    }
    if (state.pointPopover.visible) {
      renderPointPopover();
    }
    if (shouldRenderUiPanels) {
      state.visualizationDetailView ? renderVisualizationDetailPlaybackFramePanels() : renderVisualizationShell();
    }
  }

  function applyLocale(locale) {
    state.locale = locale;
    state.reportLocale = locale === 'en' ? 'en' : 'zh-CN';
    if (state.reportModal.open && !state.reportModal.exporting) {
      try {
        rebuildReportModalContent(getReportLocale());
      } catch (error) {
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview', null, state.locale);
      }
    }
    requestRender();
  }

  function applyPreparedModel(rawData, sourceName) {
    resetHeatmapComputationState();
    resetHeatmapSourceInfo();
    state.editedPressureOverrides = {};
    const prepared = buildPreparedFromRawModel(rawData);
    if (!prepared.targetRegions || !prepared.targetRegions.length) {
      throw new Error('当前模型缺少可用的目标区域。');
    }
    state.rawModel = rawData;
    state.prepared = prepared;
    state.modelSourceName = sourceName;
    state.importError = '';
    state.selectedObject = null;
    state.selectedDynamic = null;
    state.selectedHotspotId = null;
    state.activeLayerCategory = null;
    state.vitalitySeatLayerRestoreCategory = null;
    state.vitalitySeatLayerForced = false;
    closePointPopover();
    state.animationPaused = false;
    state.crowdGenerated = false;
    state.routePickMode = 'idle';
    state.routeSelection = { startPoint: null, startNodeId: null, targetRegionId: null };
    state.routeModal = { open: false, startNodeId: null, targetRegionId: null };
    state.reportModal = createDefaultReportModalState();
    syncAgentDraftFromInputs();
    state.scenario = null;
    clearHeatCellMetricCache();
    updateRouteSummary();
    requestRender();
  }

  async function handleFileImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    try {
      setChip(elements.viewModelStatus, 'running', t('status.loading'));
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const raw = JSON.parse(text);
      applyPreparedModel(raw, file.name);
      void requestBackgroundFieldPrewarmForModel(raw);
    } catch (error) {
      state.prepared = null;
      state.rawModel = null;
      state.scenario = null;
      state.crowdGenerated = false;
      state.reportModal = createDefaultReportModalState();
      state.selectedHotspotId = null;
      state.importError = error instanceof Error ? error.message : t('hint.importFailed');
      requestRender();
    } finally {
      elements.modelFileInput.value = '';
    }
  }

  function buildScenarioOptions() {
    return {
      crowdPresetId: 'normal',
      backgroundCrowdCount: getBackgroundCrowdCount(),
      startPoint: state.routeSelection.startPoint,
      targetRegionId: state.routeSelection.targetRegionId,
      focusProfile: getFocusProfile(),
    };
  }

  function handleGenerateCrowd() {
    if (!state.prepared || !state.routeSelection.startPoint || !state.routeSelection.targetRegionId) {
      requestRender();
      return;
    }
    const scenario = Sim.createScenario(state.prepared, buildScenarioOptions());
    scenario.precomputedPlayback = null;
    scenario.usePrecomputedHeatPlayback = false;
    scenario.playbackRevealTime = 0;
    state.scenario = scenario;
    state.heatmapRunError = '';
    state.crowdGenerated = true;
    state.animationPaused = true;
    state.selectedDynamic = null;
    state.selectedObject = null;
    state.selectedHotspotId = null;
    resetHeatmapPlaybackDisplayState();
    resetHeatmapSourceInfo();
    clearHeatCellMetricCache();
    syncScenarioRuntimeState();
    requestRender();
  }

  async function handleRunHeatmap() {
    if (!state.prepared || !state.scenario || !state.crowdGenerated || state.heatmapComputing) {
      requestRender();
      return false;
    }
    const computeToken = state.heatmapComputeToken + 1;
    state.heatmapComputeToken = computeToken;
    state.heatmapComputing = true;
    state.heatmapComputeProgress = 0.02;
    state.heatmapComputeStage = 'bootstrap';
    state.heatmapRunError = '';
    resetHeatmapPlaybackDisplayState();
    state.animationPaused = true;
    state.selectedDynamic = null;
    state.selectedHotspotId = null;
    requestRender();
    try {
      let precomputedPlayback = state.scenario.precomputedPlayback || null;
      if (!precomputedPlayback) {
        try {
          setHeatmapSourceInfo('localService', { phase: 'computing', cacheHit: false });
          precomputedPlayback = await fetchLocalHeatmapPlayback(computeToken);
        } catch (serverError) {
          if (state.heatmapComputeToken !== computeToken) {
            return;
          }
          if (isLocalSimConnectionError(serverError)) {
            const localServiceReady = await probeLocalSimServerHealth({ force: true, clearError: false });
            if (!localServiceReady) {
              const localServiceError = new Error(
                '本地仿真服务 8891 未连接，已停止前端回退计算。请在项目目录运行 node scripts/start_local_stack.js，或至少运行 node server/sim-server.js。'
              );
              localServiceError.cause = serverError;
              state.heatmapRunError = localServiceError.message;
              setHeatmapSourceInfo('localServiceUnavailable', { phase: 'error', cacheHit: false });
              throw localServiceError;
            }
            const transientReadError = new Error('本地仿真任务结果读取中断，请重试一次。');
            transientReadError.cause = serverError;
            state.heatmapRunError = transientReadError.message;
            setHeatmapSourceInfo('localService', { phase: 'error', cacheHit: false });
            throw transientReadError;
          }
          state.heatmapRunError = serverError instanceof Error ? serverError.message : '热力图计算失败。';
          setHeatmapSourceInfo('localService', { phase: 'error', cacheHit: false });
          throw serverError;
        }
      } else if (state.heatmapSourceInfo?.source === 'none') {
        const cached = Boolean(precomputedPlayback?.meta?.cacheHit);
        const source = precomputedPlayback?.meta?.source || (cached ? 'localCache' : 'localService');
        setHeatmapSourceInfo(source, { phase: 'ready', cacheHit: cached });
      }
      if (state.heatmapComputeToken !== computeToken) {
        return;
      }
      Sim.activateHeatmap(state.prepared, state.scenario, DEFAULT_HEAT_OPTIONS);
      state.scenario.precomputedPlayback = precomputedPlayback;
      state.scenario.usePrecomputedHeatPlayback = true;
      state.scenario.playbackRevealTime = Number(precomputedPlayback?.startTime || 0);
      resetHeatmapPlaybackDisplayState();
      state.heatmapRunError = '';
      clearHeatCellMetricCache();
      syncScenarioToPlaybackArtifacts(precomputedPlayback);
      state.animationPaused = false;
      syncScenarioRuntimeState();
      return true;
    } catch (error) {
      console.error('Heatmap precompute failed:', error);
      state.heatmapRunError = error instanceof Error ? error.message : '热力图计算失败。';
      state.animationPaused = true;
      return false;
    } finally {
      if (state.heatmapComputeToken === computeToken) {
        state.heatmapComputing = false;
        state.heatmapComputeProgress = 0;
        state.heatmapComputeStage = '';
        requestRender();
      }
    }
  }

  function openReportModal() {
    if (!state.prepared || !state.scenario?.heatActive) {
      requestRender();
      return;
    }
    try {
      state.reportLocale = state.locale === 'en' ? 'en' : 'zh-CN';
      const reportLocale = getReportLocale();
      const reportData = buildRouteReportData(reportLocale);
      state.reportModal = {
        open: true,
        exporting: false,
        exportFormat: getReportExportFormat(),
        languageMenuOpen: false,
        formatMenuOpen: false,
        status: typeof window.showSaveFilePicker === 'function'
          ? reportT('readyPreviewPicker', null, state.locale)
          : reportT('readyPreviewDownload', null, state.locale),
        error: '',
        data: reportData,
        documentHtml: buildRouteReportDocument(reportData),
        fileName: buildRouteReportFileName(reportData),
        llmAnalysis: null,
        llmAnalysisPending: false,
        llmAnalysisPromise: null,
        llmAnalysisKey: '',
        llmAnalysisRequestKey: '',
      };
    } catch (error) {
      state.reportModal = {
        ...createDefaultReportModalState(),
        open: true,
        error: error instanceof Error ? error.message : reportT('errorPreview', null, state.locale),
      };
    }
    requestRender();
    if (state.reportModal.open && state.reportModal.documentHtml) {
      ensureRouteAnalysisForCurrentState(getReportLocale());
    }
  }

  function setReportLocale(locale) {
    if (state.reportModal.exporting) {
      return;
    }
    state.reportLocale = locale === 'en' ? 'en' : 'zh-CN';
    state.reportModal.languageMenuOpen = false;
    if (state.reportModal.open) {
      try {
        state.reportModal.llmAnalysis = null;
        state.reportModal.llmAnalysisPending = false;
        state.reportModal.llmAnalysisPromise = null;
        state.reportModal.llmAnalysisKey = '';
        state.reportModal.llmAnalysisRequestKey = '';
        rebuildReportModalContent(getReportLocale());
        ensureRouteAnalysisForCurrentState(getReportLocale());
      } catch (error) {
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview', null, state.locale);
        state.reportModal.documentHtml = '';
        state.reportModal.data = null;
      }
    }
    requestRender();
  }

  function setReportExportFormat(format) {
    if (state.reportModal.exporting) {
      return;
    }
    state.reportModal.exportFormat = format === 'pdf' ? 'pdf' : 'html';
    state.reportModal.formatMenuOpen = false;
    requestRender();
  }

  function handleReportLanguageTrigger(event) {
    if (event?.type === 'click' && state.reportModal.suppressNextReportLanguageTriggerClick) {
      state.reportModal.suppressNextReportLanguageTriggerClick = false;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (state.reportModal.exporting) {
      return;
    }
    if (event?.type === 'pointerdown') {
      state.reportModal.suppressNextReportLanguageTriggerClick = true;
    }
    state.reportModal.languageMenuOpen = !state.reportModal.languageMenuOpen;
    state.reportModal.formatMenuOpen = false;
    requestRender();
  }

  function handleReportLanguageMenuClick(event) {
    if (event?.type === 'click' && state.reportModal.suppressNextReportLanguageMenuClick) {
      state.reportModal.suppressNextReportLanguageMenuClick = false;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (state.reportModal.exporting) {
      return;
    }
    const option = event.target.closest('[data-report-locale]');
    if (!option || !elements.reportLanguageMenu?.contains(option)) {
      return;
    }
    if (event?.type === 'pointerdown') {
      state.reportModal.suppressNextReportLanguageMenuClick = true;
    }
    setReportLocale(option.dataset.reportLocale);
  }

  function handleReportFormatTrigger(event) {
    if (event?.type === 'click' && state.reportModal.suppressNextReportFormatTriggerClick) {
      state.reportModal.suppressNextReportFormatTriggerClick = false;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (state.reportModal.exporting) {
      return;
    }
    if (event?.type === 'pointerdown') {
      state.reportModal.suppressNextReportFormatTriggerClick = true;
    }
    state.reportModal.formatMenuOpen = !state.reportModal.formatMenuOpen;
    state.reportModal.languageMenuOpen = false;
    requestRender();
  }

  function handleReportFormatMenuClick(event) {
    if (event?.type === 'click' && state.reportModal.suppressNextReportFormatMenuClick) {
      state.reportModal.suppressNextReportFormatMenuClick = false;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      return;
    }
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (state.reportModal.exporting) {
      return;
    }
    const option = event.target.closest('[data-report-format]');
    if (!option || !elements.reportFormatMenu?.contains(option)) {
      return;
    }
    if (event?.type === 'pointerdown') {
      state.reportModal.suppressNextReportFormatMenuClick = true;
    }
    setReportExportFormat(option.dataset.reportFormat);
  }

  function handleReportDropdownClick(event) {
    const languageOption = event.target.closest('[data-report-locale]');
    if (languageOption) {
      event?.preventDefault?.();
      setReportLocale(languageOption.dataset.reportLocale);
      return;
    }
    const languageTrigger = event.target.closest('#report-language-trigger');
    if (languageTrigger) {
      handleReportLanguageTrigger(event);
      return;
    }
    const formatOption = event.target.closest('[data-report-format]');
    if (formatOption) {
      event?.preventDefault?.();
      setReportExportFormat(formatOption.dataset.reportFormat);
      return;
    }
    const formatTrigger = event.target.closest('#report-format-trigger');
    if (formatTrigger) {
      handleReportFormatTrigger(event);
      return;
    }
    state.reportModal.languageMenuOpen = false;
    state.reportModal.formatMenuOpen = false;
  }

  function closeReportModal() {
    state.reportModal = createDefaultReportModalState();
    requestRender();
  }

  async function exportReportPdf(fileName, reportLocale) {
    const response = await fetch(getLocalSimServerUrl('/api/report/pdf'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        html: state.reportModal.documentHtml,
      }),
    });
    if (!response.ok) {
      let message = reportT('exportFailed', null, reportLocale);
      try {
        const body = await response.json();
        message = body?.error || message;
      } catch (error) {
        message = await response.text().catch(() => message);
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    state.reportModal.status = reportT('pdfPrintReady', { fileName }, reportLocale);
  }

  async function reserveReportHtmlFileHandle(fileName) {
    if (typeof window.showSaveFilePicker !== 'function') {
      return null;
    }
    return window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'HTML Report',
          accept: { 'text/html': ['.html'] },
        },
      ],
    });
  }

  async function exportReportHtml(fileName, reportLocale, reservedFileHandle = null) {
    const fileHandle = reservedFileHandle;
    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(state.reportModal.documentHtml);
      await writable.close();
      state.reportModal.status = reportT('exported', { fileName }, reportLocale);
    } else if (typeof window.showSaveFilePicker === 'function') {
      const nextFileHandle = await reserveReportHtmlFileHandle(fileName);
      const writable = await nextFileHandle.createWritable();
      await writable.write(state.reportModal.documentHtml);
      await writable.close();
      state.reportModal.status = reportT('exported', { fileName }, reportLocale);
    } else {
      const blob = new Blob([state.reportModal.documentHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      state.reportModal.status = reportT('downloaded', null, reportLocale);
    }
  }

  async function handleExportReport() {
    if (!state.reportModal.documentHtml) {
      return;
    }
    const fileName = state.reportModal.fileName || 'route-report.html';
    const pdfFileName = state.reportModal.data ? buildRouteReportPdfFileName(state.reportModal.data) : fileName.replace(/\.html?$/i, '.pdf');
    const reportLocale = getReportLocale();
    const uiLocale = state.locale === 'en' ? 'en' : 'zh-CN';
    const exportFormat = getReportExportFormat();
    let reservedHtmlFileHandle = null;
    state.reportModal.exporting = true;
    state.reportModal.languageMenuOpen = false;
    state.reportModal.formatMenuOpen = false;
    state.reportModal.error = '';
    state.reportModal.status = reportT('exporting', null, uiLocale);
    requestRender();
    try {
      if (exportFormat !== 'pdf') {
        reservedHtmlFileHandle = await reserveReportHtmlFileHandle(fileName);
      }
      await ensureRouteAnalysisForCurrentState(reportLocale);
      if (getReportLocale() !== reportLocale) {
        return;
      }
      rebuildReportModalContent(reportLocale);
      if (exportFormat === 'pdf') {
        await exportReportPdf(pdfFileName, uiLocale);
      } else {
        await exportReportHtml(fileName, reportLocale, reservedHtmlFileHandle);
      }
    } catch (error) {
      if (error && error.name === 'AbortError') {
        state.reportModal.status = reportT('cancelled', null, uiLocale);
      } else {
        state.reportModal.error = error instanceof Error ? error.message : reportT('exportFailed', null, uiLocale);
        state.reportModal.status = '';
      }
    } finally {
      state.reportModal.exporting = false;
      requestRender();
    }
  }

  function handleParameterChange() {
    syncAgentDraftFromInputs();
    invalidateScenario();
    requestRender();
  }

  function applyVitalitySeatLayerPolicy(nextViewMode) {
    const previousViewMode = getSafeViewMode(state.viewMode);
    if (nextViewMode === previousViewMode) {
      return;
    }
    if (nextViewMode === 'vitality' && previousViewMode !== 'vitality') {
      state.vitalitySeatLayerRestoreCategory = state.activeLayerCategory;
      state.vitalitySeatLayerForced = state.activeLayerCategory !== 'seat';
      state.activeLayerCategory = 'seat';
      return;
    }
    if (previousViewMode === 'vitality' && nextViewMode !== 'vitality') {
      if (state.vitalitySeatLayerForced) {
        state.activeLayerCategory = state.vitalitySeatLayerRestoreCategory || null;
      }
      state.vitalitySeatLayerRestoreCategory = null;
      state.vitalitySeatLayerForced = false;
    }
  }

  function handleViewModeChange(event) {
    applyViewModeChange(event.target.value);
  }

  function applyViewModeChange(nextViewMode) {
    const safeViewMode = getSafeViewMode(nextViewMode);
    if (safeViewMode === state.viewMode) {
      return;
    }
    applyVitalitySeatLayerPolicy(safeViewMode);
    state.viewMode = safeViewMode;
    state.selectedHotspotId = null;
    clearHeatCellMetricCache();
    if (state.reportModal.open && !state.reportModal.exporting) {
      try {
        rebuildReportModalContent(getReportLocale());
      } catch (error) {
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview', null, state.locale);
        state.reportModal.documentHtml = '';
        state.reportModal.data = null;
      }
    }
    requestRender();
  }

  function handleHotspotClick(event) {
    const hotspotCard = event.target.closest('[data-hotspot-id], [data-action-view-mode]');
    if (!hotspotCard || !elements.hotspotsList.contains(hotspotCard)) {
      return;
    }
    const actionViewMode = hotspotCard.dataset?.actionViewMode;
    if (actionViewMode) {
      state.selectedHotspotId = null;
      closePointPopover();
      applyViewModeChange(actionViewMode);
      return;
    }
    const { hotspotId } = hotspotCard.dataset;
    const hotspot = getHotspotById(hotspotId);
    if (!hotspot) {
      return;
    }
    const hotspotTargets = resolveHotspotTargets(hotspot)
      .filter((target) => target.type === 'pressure');
    if (!hotspotTargets.length) {
      return;
    }
    state.selectedHotspotId = hotspot.id;
    state.selectedObject = null;
    closePointPopover();
    requestRender();
  }

  function handleFileNameInput(event) {
    state.fileNameDraft = event.target.value;
  }

  function handleFileNameBlur() {
    if (!state.isEditingFileName) {
      return;
    }
    stopFileNameEdit({ save: true });
  }

  function handleFileNameKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      stopFileNameEdit({ save: true });
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      stopFileNameEdit({ save: false });
    }
  }

  function handleRoutePickToggle() {
    if (!state.prepared) {
      return;
    }
    state.routePickMode = 'pick-start';
    state.routeModal = {
      open: true,
      startNodeId: state.routeSelection.startNodeId,
      targetRegionId: state.routeSelection.targetRegionId,
    };
    requestRender();
  }

  function handleRouteModalMapClick(event) {
    const node = event.target.closest('[data-route-node-id]');
    if (!node || !state.prepared) {
      return;
    }
    state.routeModal.startNodeId = node.dataset.routeNodeId;
    state.routePickMode = 'pick-target';
    requestRender();
  }

  function handleRouteRegionPick(event) {
    const button = event.target.closest('[data-region-id]');
    if (!button) {
      return;
    }
    state.routeModal.targetRegionId = button.dataset.regionId;
    state.routePickMode = 'pick-target';
    requestRender();
  }

  function closeRouteModal(resetMode = true) {
    state.routeModal.open = false;
    if (resetMode) {
      state.routePickMode = 'idle';
    }
    requestRender();
  }

  function handleRouteModalClear() {
    state.routeSelection = { startPoint: null, startNodeId: null, targetRegionId: null };
    state.routeModal = { open: true, startNodeId: null, targetRegionId: null };
    state.routePickMode = 'pick-start';
    invalidateScenario();
    closePointPopover();
    state.selectedObject = null;
    state.selectedTracePoint = null;
    requestRender();
  }

  function handleRouteModalConfirm() {
    const startNode = state.prepared?.nodeById?.[state.routeModal.startNodeId];
    if (!startNode || !state.routeModal.targetRegionId) {
      return;
    }
    state.routeSelection = {
      startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
      startNodeId: startNode.id,
      targetRegionId: state.routeModal.targetRegionId,
    };
    invalidateScenario();
    closeRouteModal();
  }

  function handleSettingsNext() {
    showUiScreen('agent-settings');
  }

  function handleAgentSettingsBack() {
    showUiScreen('settings');
  }

  function handleSettingsRouteClear() {
    state.routeSelection = { startPoint: null, startNodeId: null, targetRegionId: null };
    state.routePickMode = 'pick-start';
    state.settingsDestinationMenuOpen = false;
    invalidateScenario();
    requestRender();
  }

  function handleSettingsRouteConfirm() {
    if (!state.routeSelection.startNodeId) {
      state.routePickMode = 'pick-start';
      requestRender();
      return;
    }
    if (!state.routeSelection.targetRegionId) {
      state.routePickMode = 'pick-target';
      requestRender();
      return;
    }
    state.routePickMode = 'idle';
    state.settingsDestinationMenuOpen = false;
    requestRender();
  }

  function handleSettingsDestinationTrigger() {
    if (!state.prepared?.targetRegions?.length) {
      return;
    }
    state.settingsDestinationMenuOpen = !state.settingsDestinationMenuOpen;
    requestRender();
  }

  function handleSettingsDestinationToggle() {
    handleSettingsDestinationTrigger();
  }

  function handleSettingsDestinationMenuClick(event) {
    const button = event.target.closest('[data-settings-region-id]');
    if (!button) {
      return;
    }
    state.routeSelection = {
      ...state.routeSelection,
      targetRegionId: button.dataset.settingsRegionId,
    };
    state.routePickMode = state.routeSelection.startNodeId ? 'idle' : 'pick-start';
    state.settingsDestinationMenuOpen = false;
    invalidateScenario();
    requestRender();
  }

  function handleSettingsRouteMapClick(event) {
    const nodeElement = event.target.closest('[data-route-node-id]');
    if (!nodeElement || !state.prepared) {
      return;
    }
    const node = state.prepared.nodeById?.[nodeElement.dataset.routeNodeId];
    if (!node) {
      return;
    }
    state.routeSelection = {
      ...state.routeSelection,
      startPoint: { x: node.x, y: node.y, z: node.z || 0 },
      startNodeId: node.id,
    };
    state.routePickMode = state.routeSelection.targetRegionId ? 'idle' : 'pick-target';
    state.settingsDestinationMenuOpen = false;
    invalidateScenario();
    requestRender();
  }

  function handleAgentSettingsOpen() {
    applyAgentDraftToInputs(state.focusProfile);
    syncAgentDraftFromInputs();
    state.agentModal.activeDimensionId = FIVE_DIMENSION_ORDER[0];
    state.agentModal.pointerId = null;
    state.agentModal.open = true;
    requestRender();
  }

  function handleAgentModalClear() {
    state.agentModal.draft = createAgentDraft();
    state.agentModal.activeDimensionId = FIVE_DIMENSION_ORDER[0];
    state.agentModal.pointerId = null;
    applyAgentDraftToInputs(state.agentModal.draft);
    requestRender();
  }

  function handleAgentModalConfirm() {
    state.focusProfile = createFocusProfile(state.agentModal.draft);
    applyAgentDraftToInputs(state.focusProfile);
    state.agentModal.open = false;
    state.agentModal.pointerId = null;
    invalidateScenario();
    requestRender();
  }

  function handleBackgroundCrowdChange(event) {
    const rawValue = String(event?.target?.value ?? '').trim();
    if (!rawValue) {
      if (event?.type === 'change' && event.target) {
        event.target.value = String(getBackgroundCrowdCount());
      }
      return;
    }
    const maximum = Math.max(
      100,
      Number(elements.backgroundCrowdSlider?.max) || 3000,
      Number(elements.settingsBackgroundCrowdSlider?.max) || 3000
    );
    const nextCrowd = clamp(Math.round(Number(rawValue) || DEFAULT_BACKGROUND_CROWD), 100, maximum);
    state.backgroundCrowd = nextCrowd;
    invalidateScenario();
    requestRender();
  }

  function handleLayerCategoryClick(event) {
    const button = event.target.closest('.layer-category-btn');
    if (!button) {
      return;
    }
    const nextCategory = button.dataset.category;
    state.activeLayerCategory = state.activeLayerCategory === nextCategory ? null : nextCategory;
    closePointPopover();
    requestRender();
  }

  function handleOverlayClick(event) {
    if (state.suppressNextOverlayClick) {
      state.suppressNextOverlayClick = false;
      return;
    }

    const overlayRoot = event.currentTarget || elements.overlayLayer;
    const overlayTransform = getOverlayInteractionTransform(overlayRoot);
    const target = findInteractiveTarget(event.target, overlayRoot);
    if (target) {
      const { type, id } = target.dataset;
      if (type === 'focus-agent') {
        state.animationPaused = true;
        state.selectedDynamic = { kind: 'focus-agent', id };
        requestRender();
        return;
      }
      if (type === 'node' || type === 'pressure' || type === 'seat') {
        state.selectedObject = { type, id };
        state.selectedHotspotId = null;
        const selectedItem = getObjectBySelection({ type, id });
        const layerCategory = getLayerCategoryForObject(type, selectedItem);
        const detailLayerActive = overlayRoot === elements.visualizationDetailOverlay
          && getVisualizationDetailActiveLayerCategories().includes(layerCategory);
        const workspaceLayerActive = Boolean(state.activeLayerCategory) && layerCategory === state.activeLayerCategory;
        if (selectedItem && (detailLayerActive || workspaceLayerActive)) {
          openPointPopover(type, selectedItem, {
            overlayTarget: overlayRoot === elements.visualizationDetailOverlay ? 'detail' : 'main',
          });
        } else {
          closePointPopover();
        }
        requestRender();
        return;
      }
    }

    if (state.animationPaused) {
      state.animationPaused = false;
      state.selectedDynamic = null;
      state.selectedHotspotId = null;
      requestRender();
      return;
    }

    if (state.prepared && state.scenario?.heatActive) {
      const point = screenToWorld(event.clientX, event.clientY, overlayTransform, overlayRoot);
      if (Sim.isWalkablePoint(state.prepared, point)) {
        state.selectedObject = null;
        state.selectedHotspotId = null;
        state.selectedDynamic = { kind: 'point', point };
        requestRender();
        return;
      }
    }

    state.selectedObject = null;
    state.selectedHotspotId = null;
    closePointPopover();
    requestRender();
  }


  function handleOverlayPointerDown(event) {
    const overlayRoot = event.currentTarget || elements.overlayLayer;
    const target = findInteractiveTarget(event.target, overlayRoot);
    if (!target || target.dataset.type !== 'focus-agent') {
      return;
    }
    event.preventDefault();
    state.suppressNextOverlayClick = true;
    state.animationPaused = true;
    state.selectedObject = null;
    state.selectedHotspotId = null;
    closePointPopover();
    state.selectedDynamic = { kind: 'focus-agent', id: target.dataset.id };
    requestRender();
  }

  function handleVisualizationDetailOverlayPointerMove(event) {
    const overlayRoot = event.currentTarget || elements.visualizationDetailOverlay;
    state.visualizationDetailHoverPointer = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    const nextHoverTarget = findVisualizationDetailHoverTarget(event.clientX, event.clientY, overlayRoot);
    if (
      state.visualizationDetailHoverTarget?.type === nextHoverTarget?.type
      && state.visualizationDetailHoverTarget?.id === nextHoverTarget?.id
    ) {
      return;
    }
    state.visualizationDetailHoverTarget = nextHoverTarget;
    requestRender();
  }

  function handleVisualizationDetailOverlayPointerLeave() {
    if (!state.visualizationDetailHoverTarget && !state.visualizationDetailHoverPointer) {
      return;
    }
    state.visualizationDetailHoverPointer = null;
    state.visualizationDetailHoverTarget = null;
    requestRender();
  }

  function handlePointPopoverInput(event) {
    const field = event.target.dataset?.popoverField;
    if (!field || !state.pointPopover.draft) {
      return;
    }
    if (field === 'adMode') {
      state.pointPopover.draft.adMode = event.target.value;
    } else {
      state.pointPopover.draft[field] = Number(event.target.value);
    }
  }

  function handlePointPopoverConfirm() {
    const selectedPoint = getPointPopoverSelection();
    if (!selectedPoint || !state.pointPopover.draft || selectedPoint.sourceIndex === undefined) {
      return;
    }
    state.editedPressureOverrides[selectedPoint.sourceIndex] = { ...state.pointPopover.draft };
    state.prepared = buildPreparedFromRawModel(state.rawModel);
    invalidateScenario();
    const refreshed = state.prepared.pressureObjects.find((item) => item.sourceIndex === selectedPoint.sourceIndex);
    if (refreshed) {
      openPointPopover('pressure', refreshed);
    }
    requestRender();
  }

  function handlePointPopoverReset() {
    const selectedPoint = getPointPopoverSelection();
    if (!selectedPoint || selectedPoint.sourceIndex === undefined) {
      return;
    }
    delete state.editedPressureOverrides[selectedPoint.sourceIndex];
    state.prepared = buildPreparedFromRawModel(state.rawModel);
    invalidateScenario();
    closePointPopover();
    requestRender();
  }

  function animationLoop(timestamp) {
    try {
      const elapsedSeconds = state.lastFrameTime ? Math.max(0, (timestamp - state.lastFrameTime) / 1000) : 0.016;
      const playbackDeltaSeconds = Math.min(0.25, elapsedSeconds);
      const simulationDeltaSeconds = Math.min(0.08, elapsedSeconds);
      state.lastFrameTime = timestamp;
      ensurePlaybackScenarioState();
      if (state.prepared && state.scenario && !state.animationPaused) {
        if (state.scenario.usePrecomputedHeatPlayback && state.scenario.precomputedPlayback) {
          advancePrecomputedPlayback(playbackDeltaSeconds);
        } else {
          Sim.stepScenario(state.prepared, state.scenario, simulationDeltaSeconds);
        }
        syncScenarioRuntimeState();
        state.needsPlaybackRender = true;
      }
      if (state.needsRender) {
        render();
        state.needsRender = false;
        state.needsPlaybackRender = false;
      } else if (state.needsPlaybackRender) {
        renderPlaybackFrame();
        state.needsPlaybackRender = false;
      }
    } catch (error) {
      console.error('Animation loop failed:', error);
      state.animationPaused = true;
    }
    window.requestAnimationFrame(animationLoop);
  }

  function bindEvents() {
    if (elements.landingStartBtn) {
      elements.landingStartBtn.addEventListener('click', handleLandingStart);
    }
    if (elements.screenLocaleToggle) {
      elements.screenLocaleToggle.addEventListener('click', handleShellLocaleToggle);
    }
    if (elements.settingsBackBtn) {
      elements.settingsBackBtn.addEventListener('click', handleSettingsBack);
    }
    if (elements.settingsUploadTrigger) {
      elements.settingsUploadTrigger.addEventListener('click', () => elements.modelFileInput?.click());
    }
    if (elements.settingsSpatialEditorBtn) {
      elements.settingsSpatialEditorBtn.addEventListener('click', openSpatialEditor);
    }
    if (elements.spatialEditorBackBtn) {
      elements.spatialEditorBackBtn.addEventListener('click', closeSpatialEditor);
    }
    if (elements.spatialEditorReturnSettingsBtn) {
      elements.spatialEditorReturnSettingsBtn.addEventListener('click', closeSpatialEditor);
    }
    elements.spatialEditorToolButtons.forEach((button) => {
      button.addEventListener('click', () => setSpatialEditorTool(button.dataset.spatialEditorTool));
    });
    elements.spatialEditorActionButtons.forEach((button) => {
      button.addEventListener('click', () => handleSpatialEditorAction(button.dataset.spatialEditorAction));
    });
    elements.spatialEditorResultButtons.forEach((button) => {
      button.addEventListener('click', () => {
        elements.spatialEditorResultButtons.forEach((item) => item.classList.toggle('active', item === button));
        state.spatialEditor.statusKey = 'spatialEditor.statusHistory';
        requestRender();
      });
    });
    if (elements.spatialEditorMap) {
      elements.spatialEditorMap.addEventListener('pointerdown', handleSpatialEditorMapPointerDown);
      elements.spatialEditorMap.addEventListener('pointermove', handleSpatialEditorMapPointerMove);
      elements.spatialEditorMap.addEventListener('pointerup', handleSpatialEditorMapPointerEnd);
      elements.spatialEditorMap.addEventListener('pointercancel', handleSpatialEditorMapPointerEnd);
      elements.spatialEditorMap.addEventListener('lostpointercapture', handleSpatialEditorMapPointerEnd);
    }
    if (elements.settingsRoutePickBtn) {
      elements.settingsRoutePickBtn.addEventListener('click', handleRoutePickToggle);
    }
    if (elements.settingsDestinationTrigger) {
      elements.settingsDestinationTrigger.addEventListener('click', handleSettingsDestinationTrigger);
    }
    if (elements.settingsDestinationMenu) {
      elements.settingsDestinationMenu.addEventListener('click', handleSettingsDestinationMenuClick);
    }
    if (elements.settingsRouteClearBtn) {
      elements.settingsRouteClearBtn.addEventListener('click', handleSettingsRouteClear);
    }
    if (elements.settingsRouteConfirmBtn) {
      elements.settingsRouteConfirmBtn.addEventListener('click', handleSettingsRouteConfirm);
    }
    if (elements.settingsRouteMap) {
      elements.settingsRouteMap.addEventListener('click', handleSettingsRouteMapClick);
    }
    if (elements.settingsNextBtn) {
      elements.settingsNextBtn.addEventListener('click', handleSettingsNext);
    }
    if (elements.agentSettingsBackBtn) {
      elements.agentSettingsBackBtn.addEventListener('click', handleAgentSettingsBack);
    }
    if (elements.settingsStartAnalysisBtn) {
      elements.settingsStartAnalysisBtn.addEventListener('click', handleSettingsStartAnalysis);
    }
    if (elements.visualizationBackBtn) {
      elements.visualizationBackBtn.addEventListener('click', handleVisualizationBack);
    }
    elements.visualizationCards.forEach((item) => {
      item.card.addEventListener('click', handleVisualizationCardActivate);
      item.card.addEventListener('keydown', handleVisualizationCardKeydown);
    });
    if (elements.visualizationDetailViewSelect) {
      elements.visualizationDetailViewSelect.addEventListener('change', handleVisualizationDetailSwitch);
    }
    if (elements.visualizationDetailIssues) {
      elements.visualizationDetailIssues.addEventListener('pointerdown', handleVisualizationDetailIssuePointerDown);
      elements.visualizationDetailIssues.addEventListener('click', handleVisualizationDetailIssueClick);
    }
    if (elements.visualizationDetailLayerSelect) {
      elements.visualizationDetailLayerSelect.addEventListener('pointerdown', handleVisualizationDetailLayerTrigger);
      elements.visualizationDetailLayerSelect.addEventListener('click', handleVisualizationDetailLayerTrigger);
    }
    if (elements.visualizationDetailLayerMenu) {
      elements.visualizationDetailLayerMenu.addEventListener('pointerdown', handleVisualizationDetailLayerMenuClick);
      elements.visualizationDetailLayerMenu.addEventListener('click', handleVisualizationDetailLayerMenuClick);
      elements.visualizationDetailLayerMenu.addEventListener('pointermove', handleVisualizationDetailLayerMenuPointerMove);
      elements.visualizationDetailLayerMenu.addEventListener('pointerleave', handleVisualizationDetailLayerMenuPointerLeave);
    }
    if (elements.visualizationDetailOverlay) {
      elements.visualizationDetailOverlay.addEventListener('pointermove', handleVisualizationDetailOverlayPointerMove);
      elements.visualizationDetailOverlay.addEventListener('pointerleave', handleVisualizationDetailOverlayPointerLeave);
    }
    if (elements.settingsBackgroundCrowdSlider) {
      elements.settingsBackgroundCrowdSlider.addEventListener('input', handleBackgroundCrowdChange);
      elements.settingsBackgroundCrowdSlider.addEventListener('change', handleBackgroundCrowdChange);
    }
    if (elements.settingsBackgroundCrowdInput) {
      elements.settingsBackgroundCrowdInput.addEventListener('input', handleBackgroundCrowdChange);
      elements.settingsBackgroundCrowdInput.addEventListener('change', handleBackgroundCrowdChange);
    }
    if (elements.settingsCapacityRadar) {
      elements.settingsCapacityRadar.addEventListener('pointerdown', handleSettingsRadarPointerDown);
      elements.settingsCapacityRadar.addEventListener('pointermove', handleSettingsRadarPointerMove);
      elements.settingsCapacityRadar.addEventListener('pointerup', handleSettingsRadarPointerEnd);
      elements.settingsCapacityRadar.addEventListener('pointercancel', handleSettingsRadarPointerEnd);
      elements.settingsCapacityRadar.addEventListener('lostpointercapture', handleSettingsRadarPointerEnd);
    }
    if (elements.settingsDimensionList) {
      elements.settingsDimensionList.addEventListener('click', handleSettingsDimensionListClick);
    }
    elements.localeZh.addEventListener('click', () => applyLocale('zh-CN'));
    elements.localeEn.addEventListener('click', () => applyLocale('en'));
    elements.appFileName.addEventListener('click', startFileNameEdit);
    elements.appFileNameInput.addEventListener('input', handleFileNameInput);
    elements.appFileNameInput.addEventListener('blur', handleFileNameBlur);
    elements.appFileNameInput.addEventListener('keydown', handleFileNameKeyDown);
    elements.modelFileInput.addEventListener('change', handleFileImport);
    elements.routePickBtn.addEventListener('click', handleRoutePickToggle);
    elements.routeModalMap.addEventListener('click', handleRouteModalMapClick);
    elements.routeRegionList.addEventListener('click', handleRouteRegionPick);
    elements.routeModalConfirmBtn.addEventListener('click', handleRouteModalConfirm);
    elements.routeModalClearBtn.addEventListener('click', handleRouteModalClear);
    elements.routeModal.addEventListener('click', (event) => {
      if (event.target.dataset?.modalClose === 'route') {
        closeRouteModal();
      }
    });
    elements.agentSettingsBtn.addEventListener('click', handleAgentSettingsOpen);
    elements.agentModalConfirmBtn.addEventListener('click', handleAgentModalConfirm);
    elements.agentModalClearBtn.addEventListener('click', handleAgentModalClear);
    elements.agentModal.addEventListener('click', (event) => {
      if (event.target.dataset?.modalClose === 'agent') {
        applyAgentDraftToInputs(state.focusProfile);
        state.agentModal.open = false;
        requestRender();
      }
    });
    elements.exportReportBtn.addEventListener('click', openReportModal);
    if (elements.visualizationExportReportBtn) {
      elements.visualizationExportReportBtn.addEventListener('click', openReportModal);
    }
    if (elements.visualizationDetailExportReportBtn) {
      elements.visualizationDetailExportReportBtn.addEventListener('click', openReportModal);
    }
    elements.reportModalCancelBtn.addEventListener('click', closeReportModal);
    elements.reportModalExportBtn.addEventListener('click', handleExportReport);
    if (elements.reportLocaleZh) {
      elements.reportLocaleZh.addEventListener('click', () => setReportLocale('zh-CN'));
    }
    if (elements.reportLocaleEn) {
      elements.reportLocaleEn.addEventListener('click', () => setReportLocale('en'));
    }
    if (elements.reportLanguageTrigger) {
      elements.reportLanguageTrigger.addEventListener('pointerdown', handleReportLanguageTrigger);
      elements.reportLanguageTrigger.addEventListener('click', handleReportLanguageTrigger);
    }
    if (elements.reportLanguageMenu) {
      elements.reportLanguageMenu.addEventListener('pointerdown', handleReportLanguageMenuClick);
      elements.reportLanguageMenu.addEventListener('click', handleReportLanguageMenuClick);
    }
    if (elements.reportFormatTrigger) {
      elements.reportFormatTrigger.addEventListener('pointerdown', handleReportFormatTrigger);
      elements.reportFormatTrigger.addEventListener('click', handleReportFormatTrigger);
    }
    if (elements.reportFormatMenu) {
      elements.reportFormatMenu.addEventListener('pointerdown', handleReportFormatMenuClick);
      elements.reportFormatMenu.addEventListener('click', handleReportFormatMenuClick);
    }
    document.addEventListener('pointerdown', handleVisualizationDetailDocumentPointerDown);
    elements.viewModeSelect.addEventListener('change', handleViewModeChange);
    elements.reportModal.addEventListener('click', (event) => {
      handleReportDropdownClick(event);
      if (event.target.dataset?.modalClose === 'report' && !state.reportModal.exporting) {
        closeReportModal();
      }
    });
    FIVE_DIMENSION_ORDER.forEach((id) => {
      const input = elements.capacityInputs[id];
      if (!input) {
        return;
      }
      input.addEventListener('input', () => {
        syncAgentDraftFromInputs();
        requestRender();
      });
      input.addEventListener('change', () => {
        syncAgentDraftFromInputs();
        requestRender();
      });
    });
    if (elements.agentCapacityRadar) {
      elements.agentCapacityRadar.addEventListener('pointerdown', handleAgentRadarPointerDown);
      elements.agentCapacityRadar.addEventListener('pointermove', handleAgentRadarPointerMove);
      elements.agentCapacityRadar.addEventListener('pointerup', handleAgentRadarPointerEnd);
      elements.agentCapacityRadar.addEventListener('pointercancel', handleAgentRadarPointerEnd);
      elements.agentCapacityRadar.addEventListener('lostpointercapture', handleAgentRadarPointerEnd);
    }
    if (elements.agentBehaviorPanel) {
      elements.agentBehaviorPanel.addEventListener('click', handleAgentBehaviorPanelClick);
    }
    elements.backgroundCrowdSlider.addEventListener('input', handleBackgroundCrowdChange);
    elements.generateCrowdBtn.addEventListener('click', handleGenerateCrowd);
    elements.runHeatmapBtn.addEventListener('click', handleRunHeatmap);
    elements.showFinalHeatmapBtn.addEventListener('click', handleHeatmapDisplayModeToggle);
    elements.layerCategoryButtons.forEach((button) => button.addEventListener('click', handleLayerCategoryClick));
    elements.hotspotsList.addEventListener('click', handleHotspotClick);
    elements.overlayLayer.addEventListener('pointerdown', handleOverlayPointerDown);
    elements.overlayLayer.addEventListener('click', handleOverlayClick);
    if (elements.visualizationDetailOverlay) {
      elements.visualizationDetailOverlay.addEventListener('pointerdown', handleOverlayPointerDown);
      elements.visualizationDetailOverlay.addEventListener('click', handleOverlayClick);
    }
    elements.pointPopoverContent.addEventListener('input', handlePointPopoverInput);
    elements.pointPopoverContent.addEventListener('change', handlePointPopoverInput);
    elements.pointPopoverConfirmBtn.addEventListener('click', handlePointPopoverConfirm);
    elements.pointPopoverResetBtn.addEventListener('click', handlePointPopoverReset);
    window.addEventListener('resize', requestRender);
  }

  function init() {
    state.focusProfile = createFocusProfile(state.focusProfile);
    state.agentModal.draft = createAgentDraft(state.focusProfile);
    applyAgentDraftToInputs(state.focusProfile);
    syncAgentDraftFromInputs();
    state.backgroundCrowd = Number(elements.backgroundCrowdSlider.value || DEFAULT_BACKGROUND_CROWD);
    bindEvents();
    applyLocale('zh-CN');
    startLocalSimHealthMonitor();
    requestRender();
    window.requestAnimationFrame(animationLoop);
  }

  init();
})();
