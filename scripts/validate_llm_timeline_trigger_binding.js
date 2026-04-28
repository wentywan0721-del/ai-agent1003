const assert = require('assert');

const runner = require('../server/heatmap-runner.js');

function main() {
  assert(
    runner.__private && typeof runner.__private.groundTimelineAgainstRuntimeEvents === 'function',
    'expected private groundTimelineAgainstRuntimeEvents export'
  );

  const groundedTimeline = runner.__private.groundTimelineAgainstRuntimeEvents(
    [
      {
        order: 1,
        nodeId: 'gate_out_2',
        phase: 'hesitate',
        thoughtZh: '这里得先确认一下方向。',
      },
      {
        order: 2,
        nodeId: 'path_sample_4',
        phase: 'rest',
        runtimeEventType: 'seat_search_started',
        runtimeRestState: 'searching',
        thoughtZh: '先看看附近有没有座位。',
      },
    ],
    [
      {
        eventId: 'seat_search_started_010',
        type: 'seat_search_started',
        node_id: 'path_sample_4',
        timeSeconds: 38,
        progress: 0.44,
        restState: 'searching',
      },
      {
        eventId: 'route_incomplete_020',
        type: 'route_incomplete',
        node_id: 'lift_1',
        timeSeconds: 92,
        progress: 0.86,
        restState: 'none',
      },
    ],
    {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 92, progress: 0.86 },
      ],
      summary: { duration: 92 },
    },
    {
      llmDecisions: [
        {
          order: 1,
          decisionNodeId: 'gate_out_2',
          chosenTargetNodeId: 'elev_3',
        },
      ],
      decisionPoints: [
        {
          order: 1,
          decisionNodeId: 'gate_out_2',
          recommendedTargetNodeId: 'elev_3',
        },
      ],
    }
  );

  assert.strictEqual(groundedTimeline[0].triggerKind, 'decision', 'decision-like timeline items should carry a decision trigger');
  assert.strictEqual(groundedTimeline[0].triggerDecisionNodeId, 'gate_out_2', 'decision trigger should preserve the real decision node id');
  assert.strictEqual(groundedTimeline[0].triggerTargetNodeId, 'elev_3', 'decision trigger should preserve the chosen target node id');
  assert.strictEqual(
    groundedTimeline[0].runtimeEventType,
    null,
    'generic decision timeline items should not inherit nearest runtime event type, otherwise playback highlight can be incorrectly gated'
  );

  assert.strictEqual(groundedTimeline[1].triggerKind, 'runtime_event', 'runtime-event timeline items should carry a runtime-event trigger');
  assert.strictEqual(groundedTimeline[1].triggerEventId, 'seat_search_started_010', 'runtime-event trigger should preserve the exact event id');
  assert.strictEqual(groundedTimeline[1].triggerEventType, 'seat_search_started', 'runtime-event trigger should preserve the exact event type');
}

main();
console.log('validate_llm_timeline_trigger_binding: ok');
