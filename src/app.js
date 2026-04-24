(() => {
  const Sim = window.PlanarSim;
  const InspectorUtils = window.InspectorUtils || {};
  const HEALTHY_AGENTS = Array.isArray(window.__HEALTHY_AGENTS__) ? window.__HEALTHY_AGENTS__ : [];
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MAP_PADDING_RATIO = 0.07;
  const DEFAULT_HEAT_OPTIONS = { warmupSeconds: 48, warmupDt: 0.25 };
  const LOCAL_SIM_SERVER_ORIGIN = 'http://127.0.0.1:8891';
  const LOCAL_SIM_SERVER_REQUEST_TIMEOUT_MS = 15000;
  const LOCAL_SIM_SERVER_JOB_POLL_INTERVAL_MS = 180;
  const LOCAL_SIM_SERVER_JOB_RETRY_LIMIT = 8;
  const LOCAL_SIM_SERVER_HEALTHCHECK_TIMEOUT_MS = 2500;
  const LOCAL_SIM_SERVER_HEALTHCHECK_INTERVAL_MS = 4000;
  const PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND = 30;
  const HEAT_RASTER_SUPERSAMPLE = 4;
  const BACKGROUND_AGENT_INTERPOLATION_MAX_JUMP_METERS = 4.5;
  const DEFAULT_FILE_NAME = 'untitled';
  const DEFAULT_BACKGROUND_CROWD = 1595;
  const DEFAULT_BACKGROUND_RENDERER_MODE = 'canvas';
  const HEAT_TRACE_RADIUS_METERS = 3;
  const HEAT_TRACE_MIN_SEGMENT_DISTANCE = 0.08;
  const HEAT_VALUE_STOPS = [0, 10, 20, 35, 55, 80, 130];
  const VITALITY_RIBBON_MIN_WIDTH_METERS = 2;
  const VITALITY_RIBBON_MAX_WIDTH_METERS = 6;
  const LAYER_CATEGORY_DEFINITIONS = [
    { id: 'flashing-ads', label: 'flashing ads', color: '#1faea5', editable: true },
    { id: 'static-ads', label: 'Static ads', color: '#2f92d6', editable: true },
    { id: 'ai-virtual-service-ambassador', label: 'AI virtual service ambassador', color: '#cf775d', editable: false },
    { id: 'common-direction-signs', label: 'Common direction Signs', color: '#6f9f4c', editable: false },
    { id: 'customer-service-centre', label: 'Customer Service Centre', color: '#d1a14a', editable: false },
    { id: 'noise', label: 'Noise', color: '#d35367', editable: true },
    { id: 'hanging-signs', label: 'Hanging Signs', color: '#836cd4', editable: false },
    { id: 'lcd', label: 'LCD', color: '#5ea2cd', editable: false },
    { id: 'panoramic-guide-map', label: 'Panoramic guide map', color: '#6fb96b', editable: false },
    { id: 'seat', label: 'Seat', color: '#c5af59', editable: false },
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
      loading: {
        section: 'Section 02',
        title: '正在准备可视化分析',
        description: '系统正在为当前路线生成背景人流并计算六张热力图。',
        preparing: '准备分析中',
        statusReady: '背景人流已生成，正在请求热力图计算。',
        statusComputing: '正在计算热力图，请稍候。',
        statusDone: '热力图计算完成，正在进入可视化页面。',
      },
      agentSettings: {
        section: 'Section 02',
        title: '代理人属性设置',
        back: '返回路线设置',
      },
      visualization: {
        section: 'Section 03',
        title: '可视化分析',
        detailSection: 'Section 04',
        detailTitle: '路径详细诊断',
        back: '返回上一级',
        description: '六个视角同时展示老人站内出行负担的空间分布。',
        compositeTag: '综合',
        compositeTitle: '综合负担热力图',
        compositeCopy: '综合展示五维负担在整条路线上的空间叠加结果，用于快速总览主要压力带。',
        locomotorTag: '行动',
        locomotorTitle: '行动负担热力图',
        locomotorCopy: '展示步行距离、竖向转换与排队干扰造成的行动阻力分布。',
        sensoryTag: '感知',
        sensoryTitle: '感知负担热力图',
        sensoryCopy: '展示光照、噪音、可见距离与标识辨识条件带来的感知压力分布。',
        cognitiveTag: '认知',
        cognitiveTitle: '认知负担热力图',
        cognitiveCopy: '展示寻路、标识连续性与换乘决策造成的认知压力分布。',
        psychologicalTag: '心理',
        psychologicalTitle: '心理负担热力图',
        psychologicalCopy: '展示不确定性、拥挤压力与安全感下降导致的心理负担热点。',
        vitalityTag: '活力',
        vitalityTitle: '活力负担热力图',
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
        detailCotTitle: '老年代理人出行链式分析',
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
      marker: { start: '起点', end: '终点', startShort: '起点', endShort: '终点' },
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
      loading: {
        section: 'Section 02',
        title: 'Preparing Visualization Analysis',
        description: 'The platform is generating the crowd field and computing six heatmap views for the selected route.',
        preparing: 'Preparing Analysis',
        statusReady: 'Crowd field is ready and heatmap computation is starting.',
        statusComputing: 'Computing heatmaps for the selected route.',
        statusDone: 'Heatmap computation finished. Opening the visualization workspace.',
      },
      agentSettings: {
        section: 'Section 02',
        title: 'Attribute Settings',
        back: 'Back to Route Settings',
      },
      visualization: {
        section: 'Section 03',
        title: 'Visualization Analysis',
        detailSection: 'Section 04',
        detailTitle: 'Detailed Route Diagnosis',
        back: 'Back',
        description: 'Six coordinated views showing the spatial distribution of elderly travel burden in the station.',
        compositeTag: 'Composite',
        compositeTitle: 'Composite Burden Heatmap',
        compositeCopy: 'Integrated spatial burden field combining all five dimensions for route-level overview.',
        locomotorTag: 'Mobility',
        locomotorTitle: 'Mobility Burden Heatmap',
        locomotorCopy: 'Physical movement resistance caused by walking distance, vertical transfer, and queue interference.',
        sensoryTag: 'Sensory',
        sensoryTitle: 'Sensory Burden Heatmap',
        sensoryCopy: 'Perception burden from lighting, noise, visibility range, and sign recognition conditions.',
        cognitiveTag: 'Cognitive',
        cognitiveTitle: 'Cognitive Burden Heatmap',
        cognitiveCopy: 'Decision pressure from route choice, signage continuity, and hesitation at transfer nodes.',
        psychologicalTag: 'Psychological',
        psychologicalTitle: 'Psychological Burden Heatmap',
        psychologicalCopy: 'Stress hotspots caused by uncertainty, crowd pressure, and reduced comfort or safety.',
        vitalityTag: 'Vitality',
        vitalityTitle: 'Vitality Burden Heatmap',
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
        detailCotTitle: 'Elderly Travel Chain-of-Thought Analysis',
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
      marker: { start: 'START', end: 'END', startShort: 'START', endShort: 'END' },
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
      close: '关闭',
      exportHtml: '导出 HTML',
      emptyPreview: '请先运行热力图，再生成当前路线的报告预览。',
      readyPreview: '已生成当前路线的报告预览，可直接导出 HTML。',
      readyPreviewPicker: '已生成当前路线报告预览，可选择保存位置并导出 HTML。',
      readyPreviewDownload: '已生成当前路线报告预览；当前环境将使用浏览器下载 HTML。',
      errorPreview: '报告生成失败，请检查当前模拟状态。',
      exporting: '导出中...',
      exported: '已导出 HTML：{fileName}',
      downloaded: '当前环境不支持直接选择保存路径，已使用浏览器下载 HTML。',
      cancelled: '已取消导出。',
      exportFailed: '报告导出失败。',
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
      secondsUnit: '秒',
      peopleUnit: '人',
    },
    en: {
      title: 'Single Route Diagnostic Report',
      close: 'Close',
      exportHtml: 'Export HTML',
      emptyPreview: 'Run the heatmap first to generate the current route report preview.',
      readyPreview: 'The current route report preview is ready and can be exported as HTML.',
      readyPreviewPicker: 'The current route report preview is ready. Choose a save location to export the HTML file.',
      readyPreviewDownload: 'The current route report preview is ready. This environment will use a browser download for the HTML file.',
      errorPreview: 'Report generation failed. Check the current simulation state.',
      exporting: 'Exporting...',
      exported: 'HTML exported: {fileName}',
      downloaded: 'This environment cannot choose a save location directly, so the HTML file was downloaded through the browser.',
      cancelled: 'Export cancelled.',
      exportFailed: 'Report export failed.',
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
    routePickMode: 'idle',
    viewMode: getSafeViewMode('cognitive'),
    routeSelection: { startPoint: null, startNodeId: null, targetRegionId: null },
    routeModal: { open: false, startNodeId: null, targetRegionId: null },
    settingsDestinationMenuOpen: false,
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
    pointPopover: { visible: false, type: null, id: null, draft: null, anchor: null, readOnly: true },
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
    revealedHeatCellsCache: new Map(),
    heatRasterCache: new Map(),
    visibleTraceSnapshotCache: null,
    playbackSnapshotCache: null,
    playbackFocusInspectionCache: null,
    heatmapRenderCache: null,
    heatRevealMaskCache: new Map(),
    visualizationDetailView: null,
  };

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
    visualizationDetailViewSelect: document.getElementById('visualization-detail-view-select'),
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
    clearHeatCellMetricCache();
  }

  function clearHeatCellMetricCache() {
    state.heatCellMetricCache = new Map();
    state.revealedHeatCellsCache = new Map();
    state.heatRasterCache = new Map();
    state.visibleTraceSnapshotCache = null;
    state.playbackSnapshotCache = null;
    state.playbackFocusInspectionCache = null;
    state.heatmapRenderCache = null;
    state.heatRevealMaskCache = new Map();
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
      pressureRange: playback.pressureRange ? { ...playback.pressureRange } : { min: 0, max: 0 },
      duration: Number(playback.duration || 0),
      startTime: Number(playback.startTime || 0),
      endTime: Number(playback.endTime || 0),
      heat: normalizedHeat,
      hotspots: Array.isArray(playback.hotspots) ? playback.hotspots.map((item) => ({ ...item })) : [],
      suggestions: Array.isArray(playback.suggestions) ? playback.suggestions.slice() : [],
      summary: playback.summary ? { ...playback.summary } : (result?.summary ? { ...result.summary } : null),
      backgroundField: cloneBackgroundPlaybackField(playback.backgroundField),
      meta: {
        ...(result?.meta ? { ...result.meta } : {}),
        cacheHit: Boolean(result?.cacheHit || result?.meta?.cacheHit),
        source: result?.meta?.source || null,
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
        ({ response, body } = await fetchJson(getLocalSimServerUrl(`/api/heatmap/jobs/${encodeURIComponent(jobId)}`)));
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
      state.heatmapComputeProgress = clamp(Number(body?.progress || 0), 0, body?.status === 'completed' ? 1 : 0.99);
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
        maxSimulationSeconds: 120,
      },
    };
    const { response, body } = await fetchJson(getLocalSimServerUrl('/api/heatmap/jobs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (state.heatmapComputeToken !== computeToken) {
      return null;
    }
    if (response.status === 200) {
      state.heatmapComputeProgress = 1;
      setHeatmapSourceInfo('localCache', { phase: 'ready', cacheHit: true });
      requestRender();
      return attachHeatmapSourceMeta(normalizeLocalHeatmapPlayback(body?.result || body), state.heatmapSourceInfo);
    }
    if (response.status === 202 && body?.jobId) {
      state.heatmapComputeProgress = clamp(Math.max(0.02, Number(body?.progress || 0)), 0, 0.99);
      requestRender();
      const playback = await fetchHeatmapJobResult(body.jobId, computeToken);
      if (playback && state.heatmapComputeToken === computeToken) {
        setHeatmapSourceInfo('localService', { phase: 'ready', cacheHit: false });
      }
      return attachHeatmapSourceMeta(playback, state.heatmapSourceInfo);
    }
    throw new Error(body?.error || `本地仿真服务请求失败（${response.status}）`);
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
          state.heatmapComputeProgress = firstPassComplete ? 1 : clamp(rawProgress, 0, 0.99);
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
    const values = getViewMetricValues(viewMode, { fullReveal: true });
    if (!values.length) {
      return { min: 0, max: 0 };
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
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
    const metricValues = getCurrentViewMetricValues();
    const fallbackMax = Number(
      inspection?.burdenScores?.[getSafeViewMode(state.viewMode)]
      || state.scenario?.heat?.maxHeat
      || 0
    );
    const simultaneousCount = typeof InspectorUtils.getDynamicSimultaneousCount === 'function'
      ? InspectorUtils.getDynamicSimultaneousCount(state.scenario?.agents || [])
      : ((state.scenario?.agents || []).filter((agent) => agent && agent.active !== false).length);
    const travelTime = typeof InspectorUtils.getCurrentTravelTimeSeconds === 'function'
      ? InspectorUtils.getCurrentTravelTimeSeconds({
        inspectionTime: inspection?.time,
        playbackTime: state.scenario?.playbackRevealTime,
        scenarioTime: state.scenario?.time,
      })
      : Math.max(0, Number(inspection?.time ?? state.scenario?.playbackRevealTime ?? state.scenario?.time ?? 0) || 0);
    const metricRange = typeof InspectorUtils.getMetricRange === 'function'
      ? InspectorUtils.getMetricRange(metricValues, fallbackMax)
      : {
        minMetric: metricValues.length ? Math.min(...metricValues) : 0,
        maxMetric: metricValues.length ? Math.max(...metricValues) : Math.max(0, fallbackMax),
      };
    return {
      simultaneousCount,
      travelTime,
      minHeat: Number(metricRange.minMetric || 0),
      maxHeat: Number(metricRange.maxMetric || 0),
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

  function getBackgroundCrowdRenderStyle(activeCount, transform = state.transform) {
    const count = Math.max(0, Math.round(Number(activeCount) || 0));
    const scale = Math.max(0.01, Number(transform?.scale || 0));
    const densityFactor = clamp((count - 220) / 1500, 0, 1);
    const personDiameterMeters = 0.4;
    return {
      radius: Math.max(0.24, personDiameterMeters * 0.5 * scale),
      alpha: Number(clamp(0.44 - densityFactor * 0.22, 0.12, 0.44).toFixed(3)),
      fill: 'rgba(18, 22, 26, 1)',
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
      return state.locale === 'zh-CN' ? node.displayLabel || node.id : node.displayLabelEn || node.displayLabel || node.id;
    }
    if (!point) {
      return '--';
    }
    return `${formatNumber(point.x, 1)}, ${formatNumber(point.y, 1)}`;
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

    for (let index = 1; index < snapshots.length; index += 1) {
      const previous = snapshots[index - 1];
      const current = snapshots[index];
      const previousTime = Number(previous.time || 0);
      const currentTime = Number(current.time || 0);
      if (time > currentTime + 1e-9) {
        continue;
      }
      const segmentSpan = Math.max(1e-6, currentTime - previousTime);
      const ratio = clamp((time - previousTime) / segmentSpan, 0, 1);
      const anchor = ratio < 0.5 ? previous : current;
      const fatigueThreshold = Number(anchor.fatigueThreshold || previous.fatigueThreshold || current.fatigueThreshold || getFatigueThreshold());
      const fatigue = interpolateValue(previous, current, 'fatigue', ratio, 0);
      const capacityScores = cloneCapacityScoreMap(anchor.capacityScores || state.focusProfile?.capacityScores);
      const burdenScores = interpolateDimensionScoreMap(previous, current, 'burdenScores', ratio, anchor.burdenScores || current.burdenScores || {});
      const nearbySeats = clonePlaybackArray(anchor.nearbySeats);
      const needsRest = fatigue >= fatigueThreshold;
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

    const snapshot = {
      ...last,
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

  function getPlaybackRevealTimeBucket(time) {
    return Math.round((Number(time) || 0) * 4) / 4;
  }

  function getPlaybackFocusSnapshotBucket(time) {
    return Math.round((Number(time) || 0) * PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND) / PLAYBACK_FOCUS_SNAPSHOT_BUCKETS_PER_SECOND;
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
    const inspection = {
      type: 'agent',
      id: focusAgent.id,
      routeId: focusAgent.routeId,
      routeLabel: focusAgent.routeLabel,
      isFocusAgent: true,
      queueLocked: Boolean(focusAgent.queueLocked),
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
      walkingSpeed: focusAgent.profile?.walkingSpeed,
      decisionDelay: focusAgent.profile?.decisionDelay,
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
    return Math.max(HEAT_TRACE_RADIUS_METERS, VITALITY_RIBBON_MAX_WIDTH_METERS * 0.5);
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
    const gridPadding = Math.min(0.32, Math.max(0.12, Number(state.prepared?.grid?.cellSize || 1.15) * 0.25));
    const revealDistance = revealRadiusMeters + gridPadding;
    const revealedCells = heatState.cells
      .map((cell) => {
        const pressure = Math.max(0, Number(cell.pressure || 0));
        const heat = Math.max(0, Number(cell.heat || 0));
        let traceDistance = Number.POSITIVE_INFINITY;
        if (traceSnapshots.length === 1) {
          traceDistance = Math.hypot(cell.x - traceSnapshots[0].x, cell.y - traceSnapshots[0].y);
        } else {
          for (let index = 1; index < traceSnapshots.length; index += 1) {
            const previous = traceSnapshots[index - 1];
            const current = traceSnapshots[index];
            const segmentDistance = distancePointToSegment(cell, previous, current);
            if (segmentDistance < traceDistance) {
              traceDistance = segmentDistance;
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

  function createHeatFieldRaster(revealedHeatCells, localPressureMin, localPressureMax, style = getHeatmapViewStyle(), transform = state.transform) {
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
    const weightBuffer = new Float32Array(pixelWidth * pixelHeight);
    const metricBuffer = new Float32Array(pixelWidth * pixelHeight);
    let maxWeight = 0;
    revealedHeatCells.forEach((cell) => {
      const point = worldToScreen(cell, transform);
      const rasterX = point.x * rasterScale;
      const rasterY = point.y * rasterScale;
      const pressure = Math.max(0, Number(cell.metric ?? cell.pressure ?? 0));
      const revealWeight = clamp(Number(cell.revealWeight ?? 1), 0, 1);
      const alpha = getHeatCellAlpha(pressure, cell.revealWeight);
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
          const weight = kernel * (0.2 + alpha * 0.8);
          const index = pixelY * pixelWidth + pixelX;
          weightBuffer[index] += weight;
          metricBuffer[index] += weight * pressure;
          if (weightBuffer[index] > maxWeight) {
            maxWeight = weightBuffer[index];
          }
        }
      }
    });
    const image = rasterCtx.createImageData(pixelWidth, pixelHeight);
    const densityThreshold = maxWeight > 0 ? maxWeight * 0.015 : 0;
    for (let index = 0; index < weightBuffer.length; index += 1) {
      const weight = weightBuffer[index];
      if (weight <= densityThreshold) {
        continue;
      }
      const metric = metricBuffer[index] / Math.max(weight, 1e-6);
      const rgb = getHeatDisplayRgb(metric, localPressureMin, localPressureMax, style);
      const offset = index * 4;
      image.data[offset] = rgb[0];
      image.data[offset + 1] = rgb[1];
      image.data[offset + 2] = rgb[2];
      image.data[offset + 3] = 255;
    }
    rasterCtx.putImageData(image, 0, 0);
    return raster;
  }

  function getCachedHeatRaster(cacheKey, heatState, revealedHeatCells, localMetricMin, localMetricMax, style, transformSignature, transform) {
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
      && cached.style === style
      && cached.transformSignature === transformSignature
    ) {
      return cached.raster;
    }
    const raster = createHeatFieldRaster(revealedHeatCells, localMetricMin, localMetricMax, style, transform);
    if (state.heatRasterCache.size > 24) {
      const oldestKey = state.heatRasterCache.keys().next().value;
      state.heatRasterCache.delete(oldestKey);
    }
    state.heatRasterCache.set(cacheKey, {
      heatState,
      revealedHeatCells,
      localMetricMin,
      localMetricMax,
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
    ctx.filter = 'blur(1.4px)';
    if (traceSnapshots.length === 1) {
      const point = worldToScreen(traceSnapshots[0], transform);
      ctx.beginPath();
      ctx.arc(point.x, point.y, lineWidth * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
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
    ctx.filter = 'none';
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
      let prevFrame = frames[0];
      let nextFrame = frames[frames.length - 1];
      for (let i = 0; i < frames.length - 1; i++) {
        if (frames[i].time <= nextTime && frames[i + 1].time >= nextTime) {
          prevFrame = frames[i];
          nextFrame = frames[i + 1];
          break;
        }
      }
      const timeSpan = nextFrame.time - prevFrame.time;
      const ratio = timeSpan > 1e-6
        ? Math.min(1, Math.max(0, (nextTime - prevFrame.time) / timeSpan))
        : 0;
      if (prevFrame.agents?.length && nextFrame.agents?.length) {
        state.scenario.backgroundAgents = interpolateBackgroundPlaybackAgents(prevFrame.agents, nextFrame.agents, ratio);
      } else if (prevFrame.agents?.length) {
        state.scenario.backgroundAgents = prevFrame.agents.map((agent) => ({
          ...agent,
          position: clonePlaybackPoint(agent.position),
        }));
      } else if (nextFrame.agents?.length) {
        state.scenario.backgroundAgents = nextFrame.agents.map((agent) => ({
          ...agent,
          position: clonePlaybackPoint(agent.position),
        }));
      }
    } else if (backgroundField?.initialAgents?.length) {
      // Fallback: use initial agents if frames not yet available
      state.scenario.backgroundAgents = backgroundField.initialAgents.map((a) => ({ ...a }));
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
      elements.analysisLoadingProgressBtn.textContent = state.heatmapComputing
        ? formatPercent(state.heatmapComputeProgress * 100)
        : (state.analysisTransitioning ? t('loading.preparing') : t('settings.analyzeBtn'));
    }
    if (elements.analysisLoadingStatus) {
      elements.analysisLoadingStatus.textContent = state.heatmapComputing
        ? t('loading.statusComputing')
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
    if (elements.settingsBackgroundCrowdInput) {
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

  function renderBaseLayer() {
    if (!state.prepared) {
      elements.baseLayer.innerHTML = '';
      return;
    }
    const transform = computeTransform();
    state.transform = transform;
    const viewBox = `${transform.viewBox.x} ${transform.viewBox.y} ${transform.viewBox.width} ${transform.viewBox.height}`;
    elements.baseLayer.setAttribute('viewBox', viewBox);
    elements.overlayLayer.setAttribute('viewBox', viewBox);
    const walkable = state.prepared.walkableAreas
      .map((polygon) => `<polygon class="walkable-shape" points="${polygonToPoints(polygon, transform)}"></polygon>`)
      .join('');
    const obstacles = state.prepared.obstacles
      .map((polygon) => `<polygon class="obstacle-shape" points="${polygonToPoints(polygon, transform)}"></polygon>`)
      .join('');
    elements.baseLayer.innerHTML = `${walkable}${obstacles}`;
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
    if (!id || !hotspots.length) {
      return null;
    }
    return hotspots.find((item) => item.id === id || item.mapTargetId === id || item.mapTargetIds?.includes(id)) || null;
  }

  function getSelectedHotspotOverlayItems() {
    if (!state.prepared || !state.selectedHotspotId) {
      return [];
    }
    const displayedHotspots = getDisplayedHotspots();
    const hotspot = displayedHotspots.find((item) => (
      item.id === state.selectedHotspotId || item.mapTargetId === state.selectedHotspotId || item.mapTargetIds?.includes(state.selectedHotspotId)
    ))
      || getHotspotById(state.selectedHotspotId);
    if (!hotspot) {
      return [];
    }
    const hotspotTargets = resolveHotspotTargets(hotspot)
      .filter((target) => target.type === 'pressure');
    if (!hotspotTargets.length) {
      return [];
    }
    const rankIndex = displayedHotspots.findIndex((item) => item.id === hotspot.id);
    return hotspotTargets.map((hotspotTarget) => ({
      hotspot,
      hotspotTarget,
      item: hotspotTarget.item,
      rank: rankIndex >= 0 ? rankIndex + 1 : null,
    }));
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
    state.pointPopover = { visible: false, type: null, id: null, draft: null, anchor: null, readOnly: true };
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

  function openPointPopover(type, item) {
    const categoryId = getLayerCategoryForObject(type, item);
    const definition = getCategoryDefinition(categoryId);
    state.selectedObject = { type, id: item.id };
    state.pointPopover = {
      visible: true,
      type,
      id: item.id,
      draft: createPointPopoverDraft(type, item),
      anchor: { x: item.x, y: item.y },
      readOnly: !(definition && definition.editable),
    };
  }

  function renderHeatmap() {
    const canvas = elements.heatmapLayer;
    const ctx = canvas.getContext('2d');
    const transform = state.transform || computeTransform();
    const heatmapStyle = getHeatmapViewStyle();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(transform.width));
    const height = Math.max(1, Math.round(transform.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    if (!state.scenario?.heatActive || !state.prepared) {
      state.heatmapRenderCache = null;
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
      Number(transform.scale || 0).toFixed(5),
      Number(transform.offsetX || 0).toFixed(2),
      Number(transform.offsetY || 0).toFixed(2),
      Number(transform.viewBox?.x || 0).toFixed(2),
      Number(transform.viewBox?.y || 0).toFixed(2),
      Number(transform.viewBox?.width || 0).toFixed(2),
      Number(transform.viewBox?.height || 0).toFixed(2),
    ].join(':');
    if (
      heatFullyRevealed
      && state.heatmapRenderCache
      && state.heatmapRenderCache.heatState === heatState
      && state.heatmapRenderCache.viewMode === activeViewMode
      && state.heatmapRenderCache.transformSignature === transformSignature
      && state.heatmapRenderCache.traceSnapshots === fullTraceSnapshots
      && state.heatmapRenderCache.style === heatmapStyle
    ) {
      return;
    }
    state.heatmapRenderCache = null;
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
        transform
      )
      : null;
    const vitalityRaster = !shouldDrawRasterField
      ? getCachedVitalityRibbonRaster(
        `vitality:${heatFullyRevealed ? 'final' : revealBucket}`,
        activeTraceSnapshots,
        transformSignature,
        transform,
        localMetricMin,
        localMetricMax
      )
      : null;
    const heatSurface = shouldDrawRasterField ? heatRaster : vitalityRaster;

    if (finalHeatCells.length && heatSurface) {
      ctx.save();
      clipHeatmapToWalkableArea(ctx, transform);
      paintHeatSurface(ctx, heatSurface, width, height);
      clearHeatmapObstacles(ctx, transform);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (heatFullyRevealed) {
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

  function renderBackgroundCrowdCanvas() {
    const canvas = elements.backgroundCrowdCanvas;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const transform = state.transform || computeTransform();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(transform.width));
    const height = Math.max(1, Math.round(transform.height));
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.backgroundRendererMode !== 'canvas' || !state.scenario) {
      return;
    }
    ctx.scale(dpr, dpr);
    const renderableAgents = getRenderableBackgroundAgents(state.scenario.backgroundAgents);
    if (!renderableAgents.length) {
      return;
    }
    const renderStyle = getBackgroundCrowdRenderStyle(renderableAgents.length, transform);
    const radius = renderStyle.radius;
    ctx.fillStyle = renderStyle.fill;
    ctx.globalAlpha = renderStyle.alpha;
    ctx.beginPath();
    renderableAgents.forEach((agent) => {
      const point = worldToScreen(agent.position, transform);
      ctx.moveTo(point.x + radius, point.y);
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function renderBackgroundCrowdSvgFallback() {
    return state.backgroundRendererMode === 'svg';
  }

  function renderOverlayLayer() {
    if (!state.prepared) {
      elements.overlayLayer.innerHTML = '';
      return;
    }
    const transform = state.transform || computeTransform();
    const selectedObject = state.selectedObject;
    const dynamicInspection = getDynamicInspection();
    const playbackFocusSnapshot = getActivePlayback() ? getPlaybackSnapshotAtTime() : null;
    const playbackFocusInspection = state.selectedDynamic?.kind === 'focus-agent' ? getPlaybackFocusInspection() : null;
    const activeTargetRegion =
      getTargetRegionById() ||
      state.scenario?.focusTargetRegion ||
      (state.scenario?.focusRoute?.targetRegionId ? state.prepared.targetRegionById[state.scenario.focusRoute.targetRegionId] : null);
    const startPoint = state.routeSelection.startPoint || state.scenario?.focusStartPoint || state.scenario?.focusRoute?.startAnchor || null;
    const endPoint = activeTargetRegion?.anchor || state.scenario?.focusRoute?.endAnchor || null;
    const activeLayerItems = getLayerItemsForCategory();
    const selectedHotspotOverlay = getSelectedHotspotOverlayItem();
    const selectedHotspotOverlays = selectedHotspotOverlay ? getSelectedHotspotOverlayItems() : [];
    const traceSnapshots = state.viewMode === 'vitality'
      ? getVisibleTraceSnapshots(getActivePlayback())
      : [];
    const highlightedSeatIds = new Set();
    if (state.selectedDynamic?.kind === 'focus-agent' && dynamicInspection?.needsRest) {
      (dynamicInspection.nearbySeats || []).forEach((seat) => highlightedSeatIds.add(seat.id));
    }

    const badgeRadius = worldRadiusForPixels(6.5, transform);
    const pressureRadius = worldRadiusForPixels(4.2, transform);
    const seatRadius = worldRadiusForPixels(4, transform);
    const bgRadius = 0.25;
    const focusRadius = 0.72;
    const hitRadius = worldRadiusForPixels(18, transform);
    const markerLabelGap = worldRadiusForPixels(4, transform);
    const markerLabelFill = 'rgba(255, 255, 255, 0.96)';

    const parts = [];
    const placedBadges = [];
    const renderedPressureIds = new Set();
    const renderedHotspotTargetKeys = new Set();
    const backgroundAgentParts = [];
    const focusAgentParts = [];
    const renderableBackgroundAgentIds = renderBackgroundCrowdSvgFallback()
      ? new Set(getRenderableBackgroundAgents(state.scenario?.backgroundAgents || []).map((agent) => agent.id))
      : null;

    [
      { point: startPoint, markerType: 'start' },
      { point: endPoint, markerType: 'end' },
    ]
      .filter((item) => item.point)
      .forEach(({ point, markerType }) => {
        const displayPoint = worldToDisplayPoint(point, transform);
        const badge = getMarkerBadgePlacement(displayPoint, placedBadges, transform);
        const badgeLabel = t(`marker.${markerType}Short`);
        const textAnchor = badge.edge === 'left' ? 'end' : 'start';
        const labelX = badge.edge === 'left' ? badge.x - badgeRadius - markerLabelGap : badge.x + badgeRadius + markerLabelGap;
        parts.push(`<line class="map-marker-line" x1="${displayPoint.x}" y1="${displayPoint.y}" x2="${badge.x}" y2="${badge.y}"></line>`);
        parts.push(
          `<g class="map-marker-badge ${markerType}"><circle cx="${badge.x}" cy="${badge.y}" r="${badgeRadius}"></circle><text x="${labelX}" y="${badge.y}" fill="${markerLabelFill}" text-anchor="${textAnchor}">${escapeHtml(badgeLabel)}</text></g>`
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
      if (type === 'pressure') {
        renderedPressureIds.add(item.id);
      }
      parts.push(
        `<circle class="${className}" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${type === 'seat' ? seatRadius : pressureRadius}" fill="${escapeHtml(type === 'seat' ? getCategoryColor('seat') : getCategoryColor(categoryId))}" data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}"></circle>`
      );
      if (isSelected && !(type === 'pressure' && state.selectedHotspotId === item.id)) {
        parts.push(`<circle class="hotspot-highlight-ring" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${worldRadiusForPixels(9, transform)}"></circle>`);
      }
    });

    selectedHotspotOverlays.forEach(({ item: hotspotItem, hotspotTarget, rank }) => {
      const hotspotTargetKey = hotspotTarget ? `${hotspotTarget.type}:${hotspotTarget.item.id}` : null;
      if (!hotspotTargetKey || renderedHotspotTargetKeys.has(hotspotTargetKey)) {
        return;
      }
      const showInlineHotspotRank = state.viewMode === 'psychological' && rank;
      const showHotspotRankBadge = state.viewMode !== 'cognitive' && state.viewMode !== 'psychological' && rank;
      const hotspotPoint = worldToDisplayPoint(hotspotItem, transform);
      const hotspotCategory = hotspotTarget?.type === 'pressure' ? getLayerCategoryForObject('pressure', hotspotItem) : null;
      if (hotspotTarget?.type === 'pressure' && !renderedPressureIds.has(hotspotItem.id)) {
        parts.push(
          `<circle class="pressure-dot highlighted hotspot-highlight-dot" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${pressureRadius}" fill="${escapeHtml(getCategoryColor(hotspotCategory))}" data-type="pressure" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      } else if (hotspotTarget?.type === 'seat' && state.activeLayerCategory !== 'seat') {
        parts.push(
          `<circle class="seat-dot highlighted" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${seatRadius}" fill="${escapeHtml(getCategoryColor('seat'))}" data-type="seat" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      } else if (hotspotTarget?.type === 'node') {
        parts.push(
          `<circle class="node-dot ${getNodeDisplayClass(hotspotItem)} highlighted" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${worldRadiusForPixels(6.1, transform)}" data-type="node" data-id="${escapeHtml(hotspotItem.id)}"></circle>`
        );
      }
      parts.push(`<circle class="hotspot-highlight-ring" cx="${hotspotPoint.x}" cy="${hotspotPoint.y}" r="${worldRadiusForPixels(9, transform)}"></circle>`);
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
          `<circle class="node-dot ${getNodeDisplayClass(node)} highlighted" cx="${displayNode.x}" cy="${displayNode.y}" r="${worldRadiusForPixels(6.1, transform)}" data-type="node" data-id="${escapeHtml(node.id)}"></circle>`
        );
        parts.push(
          `<text class="route-node-label" x="${displayNode.x + worldRadiusForPixels(4, transform)}" y="${displayNode.y - worldRadiusForPixels(4, transform)}">${escapeHtml(state.locale === 'zh-CN' ? node.displayLabel || node.id : node.displayLabelEn || node.displayLabel || node.id)}</text>`
        );
      }
    }

    if (highlightedSeatIds.size && state.activeLayerCategory !== 'seat') {
      state.prepared.seats.forEach((seat) => {
        if (!highlightedSeatIds.has(seat.id)) {
          return;
        }
        const displaySeat = worldToDisplayPoint(seat, transform);
        parts.push(`<circle class="seat-dot highlighted" cx="${displaySeat.x}" cy="${displaySeat.y}" r="${seatRadius}" fill="${escapeHtml(getCategoryColor('seat'))}" data-type="seat" data-id="${escapeHtml(seat.id)}"></circle>`);
      });
    }

    if (state.selectedDynamic?.kind === 'focus-agent' && dynamicInspection && (state.viewMode === 'sensory' || state.viewMode === 'vitality')) {
      const displayPoint = worldToDisplayPoint(dynamicInspection, transform);
      parts.push(`<circle class="vision-ring" cx="${displayPoint.x}" cy="${displayPoint.y}" r="${dynamicInspection.visionRadius}"></circle>`);
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
          focusAgentParts.push(`<circle class="agent-dot focus${pausedClass}" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${focusRadius}"></circle>`);
          focusAgentParts.push(`<circle class="agent-hit-area" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${hitRadius}" data-type="focus-agent" data-id="${escapeHtml(agent.id)}"></circle>`);
        } else if (renderBackgroundCrowdSvgFallback() && renderableBackgroundAgentIds?.has(agent.id)) {
          const displayAgent = worldToDisplayPoint(agent.position, transform);
          backgroundAgentParts.push(`<circle class="agent-dot background" cx="${displayAgent.x}" cy="${displayAgent.y}" r="${bgRadius}"></circle>`);
        }
      });
    }

    parts.push(...backgroundAgentParts, ...focusAgentParts);

    elements.overlayLayer.innerHTML = parts.join('');
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
    const axisMarkup = currentPoints.map(({ id, score, point, labelTextPoint, scoreTextPoint, lineEndPoint }) => {
      const activeClass = id === activeDimensionId ? ' is-active' : '';
      const handleColor = getAgentPreviewScoreColor(score);
      return `
        <line class="agent-radar-axis" x1="${layout.centerX}" y1="${layout.centerY}" x2="${lineEndPoint.x.toFixed(2)}" y2="${lineEndPoint.y.toFixed(2)}"></line>
        <text class="agent-radar-label" x="${labelTextPoint.x.toFixed(2)}" y="${labelTextPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(getLabel(id, locale))}</text>
        <text class="agent-radar-score" x="${scoreTextPoint.x.toFixed(2)}" y="${scoreTextPoint.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(formatAgentRadarScore(score, locale))}</text>
        <circle class="agent-radar-hit" data-radar-dimension="${escapeHtml(id)}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${id === activeDimensionId ? 19 : 17}"></circle>
        <circle class="agent-radar-handle${activeClass}" data-radar-dimension="${escapeHtml(id)}" style="--radar-handle-fill:${handleColor}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${id === activeDimensionId ? 9 : 8}"></circle>
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
    closeRouteModal();
    showUiScreen('analysis-loading');
    requestRender();
    await new Promise((resolve) => window.setTimeout(resolve, 40));
    try {
      handleGenerateCrowd();
      state.heatmapComputeProgress = 0.06;
      requestRender();
      await handleRunHeatmap();
      if (state.scenario?.heatActive) {
        state.viewMode = COMPOSITE_BURDEN_VIEW;
        showUiScreen('workspace');
      } else {
        showUiScreen('settings');
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
    if (elements.analysisLoadingStatus) {
      elements.analysisLoadingStatus.textContent = state.heatmapComputing
        ? t('loading.statusComputing')
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
      ? reportT('readyPreviewPicker', null, locale)
      : reportT('readyPreviewDownload', null, locale);
  }

  function renderReportModal() {
    const reportLocale = getReportLocale();
    const reportCopy = getReportCopy(reportLocale);
    elements.reportModal.classList.toggle('hidden', !state.reportModal.open);
    if (elements.reportLocaleZh) {
      elements.reportLocaleZh.classList.toggle('active', reportLocale === 'zh-CN');
      elements.reportLocaleZh.disabled = state.reportModal.exporting;
    }
    if (elements.reportLocaleEn) {
      elements.reportLocaleEn.classList.toggle('active', reportLocale === 'en');
      elements.reportLocaleEn.disabled = state.reportModal.exporting;
    }
    elements.reportModalCancelBtn.textContent = reportCopy.close;
    elements.reportModalExportBtn.textContent = state.reportModal.exporting ? reportCopy.exporting : reportCopy.exportHtml;
    const reportSummaryEl = elements.reportModalSummary;
    const reportPreviewFrameEl = elements.reportPreviewFrame;
    if (!reportSummaryEl || !reportPreviewFrameEl) {
      elements.reportModalStatus.textContent = state.reportModal.status || (state.reportModal.error ? reportCopy.errorPreview : reportCopy.readyPreview);
      elements.reportModalExportBtn.disabled = !state.reportModal.documentHtml || state.reportModal.exporting;
      elements.reportModalCancelBtn.disabled = state.reportModal.exporting;
      return;
    }
    if (!state.reportModal.open) {
      reportSummaryEl.innerHTML = '';
      reportPreviewFrameEl.srcdoc = '';
      return;
    }
    elements.reportModalTitle.textContent = state.reportModal.data?.title || reportCopy.title;
    if (state.reportModal.error) {
      reportSummaryEl.innerHTML = `<div class="detail-card glass-card muted">${escapeHtml(state.reportModal.error)}</div>`;
      reportPreviewFrameEl.srcdoc = '';
    } else if (state.reportModal.data) {
      reportSummaryEl.innerHTML = buildRouteReportSummaryMarkup(state.reportModal.data);
      reportPreviewFrameEl.srcdoc = state.reportModal.documentHtml || '';
    } else {
      reportSummaryEl.innerHTML = `<div class="detail-card glass-card muted">${escapeHtml(reportCopy.emptyPreview)}</div>`;
      reportPreviewFrameEl.srcdoc = '';
    }
    elements.reportModalStatus.textContent = state.reportModal.status || (state.reportModal.error ? reportCopy.errorPreview : reportCopy.readyPreview);
    elements.reportModalExportBtn.disabled = !state.reportModal.documentHtml || state.reportModal.exporting;
    elements.reportModalCancelBtn.disabled = state.reportModal.exporting;
  }

  function renderPointPopover() {
    const selectedPoint = getPointPopoverSelection();
    if (!state.pointPopover.visible || !selectedPoint || !state.prepared || !state.pointPopover.anchor) {
      elements.pointPopover.classList.add('hidden');
      return;
    }
    const position = worldToScreen(state.pointPopover.anchor);
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

  function buildRouteReportData(locale = getReportLocale()) {
    if (!state.prepared || !state.scenario?.heatActive || !state.routeSelection.startPoint || !state.routeSelection.targetRegionId) {
      throw new Error(reportT('emptyPreview', null, locale));
    }
    const copy = getReportCopy(locale);
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
    const peakDimension = dimensionSummary.slice().sort((left, right) => right.burdenScore - left.burdenScore)[0] || null;
    const activeViewLabel = locale === 'en' ? 'Active View' : '当前视图';
    return {
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
      peakDimension,
      hotspots,
      risk,
      findings: buildRouteReportFindings(summary, hotspots, risk, locale),
      recommendations: buildRouteReportRecommendations(summary, hotspots, locale),
    };
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

  function buildRouteReportDocument(reportData) {
    const copy = reportData.copy || getReportCopy(reportData.locale);
    const hotspotRows = reportData.hotspots.length
      ? reportData.hotspots.map((item) => `
          <tr>
            <td>${escapeHtml(String(item.rank))}</td>
            <td>${escapeHtml(item.name || item.id)}</td>
            <td>${escapeHtml(item.categoryLabel)}</td>
            <td>${escapeHtml(formatReportMetric(item.pressure))}</td>
            <td>${escapeHtml(item.advice)}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="5">${escapeHtml(copy.noHotspots)}</td></tr>`;
    const recommendationRows = reportData.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const findingRows = reportData.findings.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    return `<!DOCTYPE html>
<html lang="${escapeHtml(reportData.locale === 'en' ? 'en' : 'zh-CN')}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(reportData.title)} - ${escapeHtml(reportData.projectName)}</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #17262f;
        --muted: #62717c;
        --line: #d6dee4;
        --panel: #f4f8fb;
        --accent: #1f7a8c;
        --accent-soft: rgba(31, 122, 140, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #ecf1f4;
        color: var(--ink);
        font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .sheet {
        width: min(1080px, calc(100vw - 48px));
        margin: 24px auto;
        padding: 28px;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: 0 24px 48px rgba(19, 32, 40, 0.08);
      }
      .hero {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--line);
      }
      .hero h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      .hero p {
        margin: 4px 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .risk-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 0 14px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 800;
      }
      .risk-badge.medium { background: rgba(255, 191, 71, 0.18); color: #986700; }
      .risk-badge.high { background: rgba(224, 62, 48, 0.14); color: #b73022; }
      .section { margin-top: 24px; }
      .section h2 {
        margin: 0 0 14px;
        font-size: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .card {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: var(--panel);
      }
      .card .label {
        display: block;
        margin-bottom: 6px;
        color: var(--muted);
        font-size: 12px;
      }
      .card strong {
        font-size: 18px;
      }
      ul {
        margin: 0;
        padding-left: 20px;
        line-height: 1.75;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--line);
        border-radius: 18px;
        overflow: hidden;
      }
      th, td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
        font-size: 14px;
        line-height: 1.6;
      }
      thead th {
        background: #edf4f7;
        color: var(--ink);
      }
      tbody tr:nth-child(even) td {
        background: #fbfdfe;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .meta-block {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 16px;
      }
      .footer-note {
        margin-top: 20px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.7;
      }
      @media print {
        body { background: #ffffff; }
        .sheet {
          width: auto;
          margin: 0;
          border: 0;
          box-shadow: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <section class="hero">
        <div>
          <h1>${escapeHtml(reportData.title)}</h1>
          <p>${escapeHtml(copy.projectFile)}: ${escapeHtml(reportData.projectName)}</p>
          <p>${escapeHtml(copy.exportedAt)}: ${escapeHtml(reportData.generatedAt)}</p>
        </div>
        <div>
          <div class="risk-badge ${escapeHtml(reportData.risk.className)}">${escapeHtml(reportData.risk.level)}</div>
          <p>${escapeHtml(reportData.risk.summary)}</p>
        </div>
      </section>

      <section class="section">
        <h2>1. ${escapeHtml(copy.routeAgentSnapshot)}</h2>
        <div class="meta-grid">
          <div class="meta-block">
            <p><strong>${escapeHtml(copy.start)}:</strong> ${escapeHtml(reportData.route.startLabel)}</p>
            <p><strong>${escapeHtml(copy.target)}:</strong> ${escapeHtml(reportData.route.targetLabel)}</p>
            <p><strong>${escapeHtml(copy.backgroundCrowd)}:</strong> ${escapeHtml(formatReportNumber(reportData.crowd.backgroundCount, 0))} ${escapeHtml(copy.peopleUnit)}</p>
        </div>
        <div class="meta-block">
          <p><strong>${escapeHtml(copy.agentProfile)}:</strong> ${escapeHtml(reportData.agent.capacitySummary)}</p>
          <p><strong>${escapeHtml(reportData.activeViewLabel)}:</strong> ${escapeHtml(reportData.activeView.label)}</p>
        </div>
      </div>
      </section>

      <section class="section">
        <h2>2. ${escapeHtml(copy.snapshot)}</h2>
        <div class="grid">
          <div class="card">
            <span class="label">${escapeHtml(copy.simultaneousCount)}</span>
            <strong>${escapeHtml(formatReportNumber(reportData.summary.simultaneousCount, 0))} ${escapeHtml(copy.peopleUnit)}</strong>
          </div>
          <div class="card">
            <span class="label">${escapeHtml(copy.activePressureCount)}</span>
            <strong>${escapeHtml(formatReportNumber(reportData.summary.activePressureCount, 0))}</strong>
          </div>
          <div class="card">
            <span class="label">${escapeHtml(copy.averageTravelTime)}</span>
            <strong>${escapeHtml(formatReportDuration(reportData.summary.averageTravelTime, reportData.locale))}</strong>
          </div>
          <div class="card">
            <span class="label">${escapeHtml(copy.averageFatigue)}</span>
            <strong>${escapeHtml(formatReportMetric(reportData.summary.averageFatigue))}</strong>
          </div>
          <div class="card">
            <span class="label">${escapeHtml(copy.averageHeat)}</span>
            <strong>${escapeHtml(formatReportMetric(reportData.summary.averageHeat))}</strong>
          </div>
          <div class="card">
            <span class="label">${escapeHtml(copy.modelSource)}</span>
            <strong>${escapeHtml(reportData.modelSource)}</strong>
          </div>
        </div>
      </section>

      <section class="section">
        <h2>3. ${escapeHtml(copy.dimensionSnapshot)}</h2>
        ${buildDimensionReportMarkup(reportData)}
        ${reportData.peakDimension ? `<p class="footer-note">${escapeHtml(copy.peakBurden)}: ${escapeHtml(reportData.peakDimension.burdenLabel)} (${escapeHtml(formatReportMetric(reportData.peakDimension.burdenScore))})</p>` : ''}
      </section>

      <section class="section">
        <h2>4. ${escapeHtml(copy.findings)}</h2>
        <ul>${findingRows}</ul>
      </section>

      <section class="section">
        <h2>5. ${escapeHtml(copy.hotspots)}</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>${escapeHtml(copy.hotspotLocation)}</th>
              <th>${escapeHtml(copy.category)}</th>
              <th>${escapeHtml(copy.cognitiveLoad)}</th>
              <th>${escapeHtml(copy.improvement)}</th>
            </tr>
          </thead>
          <tbody>${hotspotRows}</tbody>
        </table>
      </section>

      <section class="section">
        <h2>6. ${escapeHtml(copy.recommendations)}</h2>
        <ul>${recommendationRows}</ul>
      </section>

      <p class="footer-note">${escapeHtml(copy.footer)}</p>
    </div>
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
    renderBaseLayer();
    renderBackgroundCrowdCanvas();
    renderOverlayLayer();
    syncVisualizationBaseLayer(stageElements.base);
    syncVisualizationSvgLayer(elements.overlayLayer, stageElements.overlay);
    if (!state.prepared) {
      clearVisualizationStageCanvas(stageElements.background);
      clearVisualizationStageCanvas(stageElements.heat);
      updateVisualizationMetricRangeElements(viewMode, stageElements.min, stageElements.max);
      return;
    }
    const previousViewMode = getSafeViewMode(state.viewMode);
    const previousHeatmapDisplayMode = state.heatmapDisplayMode;
    const previousHeatmapRevealLocked = state.heatmapRevealLocked;
    const previousHeatmapRevealFrozenTime = state.heatmapRevealFrozenTime;
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
    state.viewMode = getSafeViewMode(viewMode);
    renderHeatmap();
    renderBackgroundCrowdCanvas();
    renderOverlayLayer();
    blitVisualizationCanvas(elements.backgroundCrowdCanvas, stageElements.background);
    blitVisualizationCanvas(state.scenario?.heatActive ? elements.heatmapLayer : null, stageElements.heat);
    syncVisualizationSvgLayer(elements.overlayLayer, stageElements.overlay);
    updateVisualizationMetricRangeElements(state.viewMode, stageElements.min, stageElements.max);
    state.viewMode = previousViewMode;
    state.heatmapDisplayMode = previousHeatmapDisplayMode;
    state.heatmapRevealLocked = previousHeatmapRevealLocked;
    state.heatmapRevealFrozenTime = previousHeatmapRevealFrozenTime;
  }

  function renderVisualizationHeatmapCards() {
    if (!elements.visualizationCards?.length) {
      return;
    }
    renderBaseLayer();
    renderBackgroundCrowdCanvas();
    renderOverlayLayer();
    elements.visualizationCards.forEach((card) => {
      syncVisualizationBaseLayer(card.base);
      syncVisualizationSvgLayer(elements.overlayLayer, card.overlay);
      if (!state.prepared) {
        clearVisualizationStageCanvas(card.background);
        clearVisualizationStageCanvas(card.heat);
      }
    });
    if (!state.prepared) {
      return;
    }
    const previousViewMode = getSafeViewMode(state.viewMode);
    const previousHeatmapDisplayMode = state.heatmapDisplayMode;
    const previousHeatmapRevealLocked = state.heatmapRevealLocked;
    const previousHeatmapRevealFrozenTime = state.heatmapRevealFrozenTime;
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
    VISUALIZATION_CARD_ORDER.forEach((viewMode) => {
      const card = elements.visualizationCards.find((item) => item.id === viewMode);
      if (!card) {
        return;
      }
      state.viewMode = viewMode;
      renderHeatmap();
      renderBackgroundCrowdCanvas();
      renderOverlayLayer();
      blitVisualizationCanvas(elements.backgroundCrowdCanvas, card.background);
      blitVisualizationCanvas(state.scenario?.heatActive ? elements.heatmapLayer : null, card.heat);
      syncVisualizationSvgLayer(elements.overlayLayer, card.overlay);
      updateVisualizationMetricRangeElements(viewMode, card.min, card.max);
    });
    state.viewMode = previousViewMode;
    state.heatmapDisplayMode = previousHeatmapDisplayMode;
    state.heatmapRevealLocked = previousHeatmapRevealLocked;
    state.heatmapRevealFrozenTime = previousHeatmapRevealFrozenTime;
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
      { id: 'progress', icon: 'progress', label: t('label.progress'), value: inspection ? formatPercent((inspection.progress || 0) * 100) : '--' },
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
        { label: t('visualization.minBurden'), value: formatMetricValue(detailBurdenValues.length ? Math.min(...detailBurdenValues) : 0) },
        { label: t('visualization.maxBurden'), value: formatMetricValue(detailBurdenValues.length ? Math.max(...detailBurdenValues) : 0) },
        { label: t('visualization.currentBurden'), value: formatMetricValue(inspection.burdenScores?.[COMPOSITE_BURDEN_VIEW] || 0) },
        { label: t('label.fatigue'), value: formatMetricValue(inspection.fatigue || 0) },
        { label: t('label.walkingSpeed'), value: `${formatNumber(inspection.walkingSpeed || 0, 2)} ${t('units.perSecond')}` },
        { label: t('label.decisionDelay'), value: `${formatNumber(inspection.decisionDelay || 0, 2)} ${t('units.seconds')}` },
        { label: t('label.visionRadius'), value: formatMeters(inspection.visionRadius || 0) },
        { label: t('visualization.speedFactor'), value: `${formatNumber(((inspection.fiveDimensions?.burdens?.locomotor?.speedFactor) || 0) * 100, 0)}%` },
        { label: t('visualization.motionState'), value: formatMovementBehaviorLabel(inspection.fiveDimensions?.burdens?.locomotor?.behavior, state.locale) },
        { label: t('visualization.mainResistance'), value: formatMovementCauseLabel(inspection.fiveDimensions?.burdens?.locomotor?.mainCause, state.locale) },
      ]
      : [
        { label: t('visualization.currentBurden'), value: formatMetricValue(inspection.burdenScores?.[COMPOSITE_BURDEN_VIEW] || 0) },
        { label: t('label.visionRadius'), value: formatMeters(inspection.visionRadius || 0) },
        { label: t('label.walkingSpeed'), value: `${formatNumber(inspection.walkingSpeed || 0, 2)} ${t('units.perSecond')}` },
        { label: t('label.decisionDelay'), value: `${formatNumber(inspection.decisionDelay || 0, 2)} ${t('units.seconds')}` },
        { label: t('visualization.motionState'), value: formatMovementBehaviorLabel(inspection.fiveDimensions?.burdens?.locomotor?.behavior, state.locale) },
        { label: t('visualization.mainResistance'), value: formatMovementCauseLabel(inspection.fiveDimensions?.burdens?.locomotor?.mainCause, state.locale) },
        { label: t('visualization.speedFactor'), value: `${formatNumber(((inspection.fiveDimensions?.burdens?.locomotor?.speedFactor) || 0) * 100, 0)}%` },
        { label: t('label.fatigue'), value: formatMetricValue(inspection.fatigue || 0) },
      ];
    target.innerHTML = entries.map((item) => `
      <div class="visualization-status-card">
        <div class="visualization-status-card__label">${escapeHtml(item.label)}</div>
        <div class="visualization-status-card__value">${escapeHtml(item.value)}</div>
      </div>
    `).join('');
  }

  function renderVisualizationCapabilityRadar(target = elements.visualizationCapabilityRadar) {
    if (!target) {
      return;
    }
    const isDetailTarget = target === elements.visualizationDetailRadar;
    const radarMarkup = buildAgentRadarSvg(state.agentModal.draft, state.locale, isDetailTarget ? {
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

  function renderVisualizationDetailLayerSelect(target = elements.visualizationDetailLayerSelect) {
    if (!target) {
      return;
    }
    const options = [
      { value: '', label: t('visualization.detailLayerAll') },
      ...LAYER_CATEGORY_DEFINITIONS.map((item) => ({
        value: item.id,
        label: item.label,
      })),
    ];
    target.innerHTML = options
      .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
      .join('');
    target.value = state.activeLayerCategory || '';
  }

  function buildVisualizationDetailCotMarkup() {
    const locale = state.locale === 'en' ? 'en' : 'zh-CN';
    let reportData = null;
    try {
      reportData = buildRouteReportData(locale);
    } catch (error) {
      return `<div class="visualization-detail__empty">${escapeHtml(error instanceof Error ? error.message : t('hint.summaryEmpty'))}</div>`;
    }
    const steps = getVisualizationDetailTimelineSteps(reportData);
    return `
      <div class="visualization-detail__report-stack">
        <div class="visualization-detail__report-header">
          <h3 class="visualization-detail__report-title visualization-detail__report-title--icon">${getVisualizationDetailIcon('brain')}<span>${escapeHtml(t('visualization.detailCotTitle'))}</span></h3>
          <p class="visualization-detail__report-copy">${escapeHtml(reportData.risk?.summary || '--')}</p>
        </div>
        <div class="visualization-detail__timeline">
          ${steps.map((item, index) => `
            <div class="visualization-detail__timeline-item">
              <div class="visualization-detail__timeline-marker">${index + 1}</div>
              <p class="visualization-detail__timeline-copy">${escapeHtml(item)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function buildVisualizationDetailIssuesMarkup() {
    if (state.selectedDynamic?.kind !== 'focus-agent') {
      return `<div class="visualization-detail__empty">${escapeHtml(t('hint.hotspotsPrompt'))}</div>`;
    }
    const panelState = getIssuePanelState();
    const locale = state.locale === 'en' ? 'en' : 'zh-CN';
    const issueItems = panelState.mode === 'issues' ? panelState.items : [];
    const issueMarkup = issueItems.length
      ? issueItems.map((item) => `
          <article class="visualization-detail__issue-pair">
            <div class="visualization-detail__issue-box">
              <div class="visualization-detail__issue-box-title">${getVisualizationDetailIcon('issue')}<span>${escapeHtml(item.name || item.id || '--')}</span></div>
              <div class="visualization-detail__issue-meta">${escapeHtml(item.categoryLabel || getCategoryLabel(item.category))} · ${escapeHtml(formatMetricValue(item.pressure || item.score || 0))}</div>
            </div>
            <div class="visualization-detail__issue-box visualization-detail__issue-box--suggestion">
              <div class="visualization-detail__issue-box-title">${getVisualizationDetailIcon('suggestion')}<span>${escapeHtml(t('label.advice'))}</span></div>
              <p class="visualization-detail__issue-copy">${escapeHtml(item.advice || getSuggestionByCategoryText(item.category, locale) || '--')}</p>
            </div>
          </article>
        `).join('')
      : `<div class="visualization-detail__empty">${escapeHtml(panelState.summary || t('visualization.detailNoIssues'))}</div>`;
    return `
      <div class="visualization-detail__report-stack">
        <div class="visualization-detail__report-header">
          <h3 class="visualization-detail__report-title visualization-detail__report-title--icon">${getVisualizationDetailIcon('suggestion')}<span>${escapeHtml(t('visualization.detailIssuesTitle'))}</span></h3>
        </div>
        <div class="visualization-detail__issue-list">${issueMarkup}</div>
      </div>
    `;
  }

  function openVisualizationDetailView(viewId = COMPOSITE_BURDEN_VIEW) {
    state.visualizationDetailView = getSafeViewMode(viewId);
    state.viewMode = state.visualizationDetailView;
    requestRender();
  }

  function closeVisualizationDetailView() {
    state.visualizationDetailView = null;
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
      };
    }
    return {
      section: t('visualization.section'),
      title: t('visualization.title'),
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
    renderVisualizationStage(activeView, {
      base: elements.visualizationDetailBase,
      background: elements.visualizationDetailBackground,
      heat: elements.visualizationDetailHeat,
      overlay: elements.visualizationDetailOverlay,
      min: null,
      max: null,
    });
    renderVisualizationStatusMonitor(elements.visualizationDetailStatus);
    renderVisualizationCapabilityRadar(elements.visualizationDetailRadar);
    renderVisualizationBurdenFeedback(elements.visualizationDetailFeedback);
    renderVisualizationDetailLayerSelect(elements.visualizationDetailLayerSelect);
    if (elements.visualizationDetailCot) {
      elements.visualizationDetailCot.innerHTML = buildVisualizationDetailCotMarkup();
    }
    if (elements.visualizationDetailIssues) {
      elements.visualizationDetailIssues.innerHTML = buildVisualizationDetailIssuesMarkup();
    }
    restoreVisualizationWorkspaceLayers();
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
    renderBackgroundCrowdCanvas();
    renderHeatmap();
    renderOverlayLayer();
    if (state.selectedDynamic) {
      renderSummary();
      renderInspectorAgentSummary();
      renderHotspots();
    }
    if (state.selectedObject) {
      renderObjectInspector();
    }
    if (state.pointPopover.visible) {
      renderPointPopover();
    }
    renderVisualizationShell();
  }

  function applyLocale(locale) {
    state.locale = locale;
    state.reportLocale = locale === 'en' ? 'en' : 'zh-CN';
    if (state.reportModal.open && !state.reportModal.exporting) {
      try {
        rebuildReportModalContent(getReportLocale());
      } catch (error) {
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview');
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
      return;
    }
    const computeToken = state.heatmapComputeToken + 1;
    state.heatmapComputeToken = computeToken;
    state.heatmapComputing = true;
    state.heatmapComputeProgress = 0.02;
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
    } catch (error) {
      console.error('Heatmap precompute failed:', error);
      state.heatmapRunError = error instanceof Error ? error.message : '热力图计算失败。';
      state.animationPaused = true;
    } finally {
      if (state.heatmapComputeToken === computeToken) {
        state.heatmapComputing = false;
        state.heatmapComputeProgress = 0;
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
      const reportLocale = getReportLocale();
      const reportData = buildRouteReportData(reportLocale);
      state.reportModal = {
        open: true,
        exporting: false,
        status: typeof window.showSaveFilePicker === 'function'
          ? reportT('readyPreviewPicker', null, reportLocale)
          : reportT('readyPreviewDownload', null, reportLocale),
        error: '',
        data: reportData,
        documentHtml: buildRouteReportDocument(reportData),
        fileName: buildRouteReportFileName(reportData),
      };
    } catch (error) {
      state.reportModal = {
        ...createDefaultReportModalState(),
        open: true,
        error: error instanceof Error ? error.message : reportT('errorPreview'),
      };
    }
    requestRender();
  }

  function setReportLocale(locale) {
    if (state.reportModal.exporting) {
      return;
    }
    state.reportLocale = locale === 'en' ? 'en' : 'zh-CN';
    if (state.reportModal.open) {
      try {
        rebuildReportModalContent(getReportLocale());
      } catch (error) {
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview');
        state.reportModal.documentHtml = '';
        state.reportModal.data = null;
      }
    }
    requestRender();
  }

  function closeReportModal() {
    state.reportModal = createDefaultReportModalState();
    requestRender();
  }

  async function handleExportReport() {
    if (!state.reportModal.documentHtml) {
      return;
    }
    const fileName = state.reportModal.fileName || 'route-report.html';
    const reportLocale = getReportLocale();
    state.reportModal.exporting = true;
    state.reportModal.error = '';
    state.reportModal.status = reportT('exporting', null, reportLocale);
    requestRender();
    try {
      if (typeof window.showSaveFilePicker === 'function') {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'HTML Report',
              accept: { 'text/html': ['.html'] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
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
    } catch (error) {
      if (error && error.name === 'AbortError') {
        state.reportModal.status = reportT('cancelled', null, reportLocale);
      } else {
        state.reportModal.error = error instanceof Error ? error.message : reportT('exportFailed', null, reportLocale);
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
        state.reportModal.error = error instanceof Error ? error.message : reportT('errorPreview');
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
        if (selectedItem && state.activeLayerCategory && layerCategory === state.activeLayerCategory) {
          openPointPopover(type, selectedItem);
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
      const deltaSeconds = state.lastFrameTime ? Math.min(0.08, (timestamp - state.lastFrameTime) / 1000) : 0.016;
      state.lastFrameTime = timestamp;
      ensurePlaybackScenarioState();
      if (state.prepared && state.scenario && !state.animationPaused) {
        if (state.scenario.usePrecomputedHeatPlayback && state.scenario.precomputedPlayback) {
          advancePrecomputedPlayback(deltaSeconds);
        } else {
          Sim.stepScenario(state.prepared, state.scenario, deltaSeconds);
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
    if (elements.visualizationDetailLayerSelect) {
      elements.visualizationDetailLayerSelect.addEventListener('change', handleVisualizationDetailLayerSelect);
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
    elements.viewModeSelect.addEventListener('change', handleViewModeChange);
    elements.reportModal.addEventListener('click', (event) => {
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
