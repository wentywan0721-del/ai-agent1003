const assert = require('assert');

const runner = require('../server/heatmap-runner.js');

function main() {
  assert(
    runner.__private && typeof runner.__private.groundTimelineAgainstRuntimeEvents === 'function',
    'expected private groundTimelineAgainstRuntimeEvents export'
  );

  const groundedTimeline = runner.__private.groundTimelineAgainstRuntimeEvents(
    [
      { order: 1, nodeId: 'gate_in_1', phase: 'approach', thoughtZh: '先看清方向。' },
      { order: 2, nodeId: 'path_sample_4', phase: 'move', thoughtZh: '慢慢往前走。' },
      { order: 3, nodeId: 'path_sample_8', phase: 'hesitate', thoughtZh: '前面有点干扰。' },
      { order: 4, nodeId: 'gate_out_4', phase: 'finish', thoughtZh: '快到了。' },
    ],
    [
      { eventId: 'burden_spike_200', type: 'burden_spike', node_id: 'path_sample_8', timeSeconds: 58.86, progress: 0.83, restState: 'none', dimension: 'locomotor' },
      { eventId: 'route_completed_300', type: 'route_completed', node_id: 'gate_out_4', timeSeconds: 77.58, progress: 1, restState: 'none' },
    ],
    {
      traceSnapshots: [
        { time: 0, progress: 0 },
        { time: 77.58, progress: 1 },
      ],
      summary: { duration: 77.58 },
    }
  );

  assert.strictEqual(
    groundedTimeline[0].timeSeconds,
    0,
    'when the first real runtime event happens late in the route, the first timeline item should still anchor to playback start instead of jumping to that late event'
  );
  assert.strictEqual(
    groundedTimeline[0].progress,
    0,
    'when the first real runtime event happens late in the route, the first timeline item should still anchor to route progress start'
  );
  assert(
    groundedTimeline[1].timeSeconds > groundedTimeline[0].timeSeconds,
    'timeline times should continue increasing from the synthetic start anchor'
  );
  assert(
    !Object.prototype.hasOwnProperty.call(groundedTimeline[0], 'triggerKind') || groundedTimeline[0].triggerKind !== 'runtime_event',
    'a generic opening thought should not be mislabeled as a late runtime-event trigger only because the first real event happens near the end'
  );
}

main();
console.log('validate_llm_timeline_start_anchor_grounding: ok');
