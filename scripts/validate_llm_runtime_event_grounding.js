const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const runner = require('../server/heatmap-runner.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createScenario(prepared) {
  const startNode = prepared.nodeById.gate_in_1;
  assert(startNode, 'expected gate_in_1 in default sim');
  return Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z },
    targetRegionId: 'kdt',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 2,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260423,
  });
}

function main() {
  assert(
    runner.__private && typeof runner.__private.buildDecisionPlanInput === 'function',
    'expected private buildDecisionPlanInput export'
  );
  const prepared = loadPrepared();
  const scenario = createScenario(prepared);
  const playback = {
    traceSnapshots: [
      {
        time: 0,
        progress: 0,
        x: scenario.focusStartPoint.x,
        y: scenario.focusStartPoint.y,
        fatigue: 5,
        fatigueThreshold: 100,
        restState: 'none',
        burdenScores: { cognitive: 20, sensory: 15, psychological: 12, locomotor: 30, vitality: 5 },
        topPressureSources: [],
      },
      {
        time: 32,
        progress: 0.42,
        x: scenario.focusStartPoint.x + 3,
        y: scenario.focusStartPoint.y + 2,
        selectedTargetNodeId: 'elev_3',
        fatigue: 86,
        fatigueThreshold: 100,
        restState: 'searching',
        restMode: 'seat-search',
        burdenScores: { cognitive: 82, sensory: 35, psychological: 28, locomotor: 52, vitality: 86 },
        topBurdenId: 'cognitive',
        topPressureSources: [
          { id: 'common_direction_signs_brief', name: 'Common direction signs', category: 'signage', feature: 'brief_information', score: 64 },
        ],
        nearbySeats: [{ id: 'seat_1', label: 'Seat 1', distance: 4.2 }],
      },
      {
        time: 38,
        progress: 0.45,
        x: scenario.focusStartPoint.x + 4,
        y: scenario.focusStartPoint.y + 2,
        selectedTargetNodeId: 'elev_3',
        fatigue: 88,
        fatigueThreshold: 100,
        restState: 'sitting',
        restMode: 'sitting',
        burdenScores: { cognitive: 55, sensory: 30, psychological: 25, locomotor: 45, vitality: 88 },
        topBurdenId: 'vitality',
        topPressureSources: [],
      },
    ],
  };

  const input = runner.__private.buildDecisionPlanInput(prepared, scenario, {
    scenarioOptions: {
      startNodeId: 'gate_in_1',
      backgroundCrowdCount: 1,
    },
  }, playback);

  assert(Array.isArray(input.runtimeEvents), 'LLM input should include runtimeEvents extracted from playback trace');
  assert(input.runtimeEvents.some((event) => event.type === 'seat_search_started'), 'runtimeEvents should include seat-search start at 85% fatigue');
  assert(input.runtimeEvents.some((event) => event.type === 'rest_state_changed' && event.restState === 'sitting'), 'runtimeEvents should include sitting/rest state');
  assert(input.runtimeEvents.some((event) => event.type === 'burden_spike' && event.dimension === 'cognitive'), 'runtimeEvents should include high cognitive burden with top cause');
  const seatSearchEvent = input.runtimeEvents.find((event) => event.type === 'seat_search_started');
  assert(
    seatSearchEvent && /^path_sample_/i.test(String(seatSearchEvent.node_id || '')),
    'seat-search runtime events without a real decision node should fall back to progress/path samples instead of reusing the final selected target node id'
  );
  assert(
    input.allowedPressureMentions.some((item) => item.id === 'common_direction_signs_brief'),
    'runtime top pressure sources should be allowed for LLM mention'
  );

  assert(
    typeof runner.__private.groundTimelineAgainstRuntimeEvents === 'function',
    'expected private groundTimelineAgainstRuntimeEvents export'
  );
  const groundedTimeline = runner.__private.groundTimelineAgainstRuntimeEvents([
    { order: 1, nodeId: 'custom_start', thoughtZh: '出发前先看方向。' },
    { order: 2, nodeId: 'path_sample_2', thoughtZh: '前面有点乱，慢一点。' },
    { order: 3, nodeId: 'path_sample_3', thoughtZh: '感觉有点累，先留意座位。' },
    { order: 4, nodeId: 'path_sample_4', thoughtZh: '准备休息一下。' },
  ], input.runtimeEvents);
  assert.strictEqual(groundedTimeline.length, 4, 'grounded timeline should preserve item count');
  assert(
    groundedTimeline.every((item) => Number.isFinite(item.timeSeconds)),
    'grounded timeline items should carry concrete playback times'
  );
  assert(
    groundedTimeline.every((item) => Number.isFinite(item.progress)),
    'grounded timeline items should carry concrete playback progress'
  );
  assert(
    groundedTimeline.every((item, index, list) => index === 0 || item.timeSeconds >= list[index - 1].timeSeconds),
    'grounded timeline times should stay monotonic so Section04 can highlight in playback order'
  );

  const singleEventTimeline = runner.__private.groundTimelineAgainstRuntimeEvents([
    { order: 1, nodeId: 'custom_start', thoughtZh: '先看一眼方向。' },
    { order: 2, nodeId: 'path_sample_2', thoughtZh: '继续往前走。' },
    { order: 3, nodeId: 'path_sample_3', thoughtZh: '快到中段了。' },
    { order: 4, nodeId: 'path_sample_4', thoughtZh: '继续往终点去。' },
  ], [
    { type: 'route_completed', timeSeconds: 80, progress: 1, restState: 'none' },
  ], {
    traceSnapshots: [
      { time: 0, progress: 0 },
      { time: 80, progress: 1 },
    ],
    summary: { duration: 80 },
  });
  assert(
    singleEventTimeline[0].timeSeconds < singleEventTimeline[singleEventTimeline.length - 1].timeSeconds,
    'when runtimeEvents only has one final event, grounded timeline should still spread across playback time instead of collapsing every item onto the same timestamp'
  );
}

main();
console.log('validate_llm_runtime_event_grounding: ok');
