const Sim = require('../src/core.js');
const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertClose(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

const snapshots = [
  { x: 0, y: 0, burdenScores: { psychological: 10 } },
  { x: 10, y: 0, burdenScores: { psychological: 50 } },
  { x: 20, y: 0, burdenScores: { psychological: 90 } },
];

function getMetric(snapshot) {
  return Number(snapshot?.burdenScores?.psychological || 0);
}

function main() {
  assert(typeof Sim.interpolateTraceMetricAtPoint === 'function', 'Expected interpolateTraceMetricAtPoint export');
  assert(typeof Sim.computePsychologicalBurdenScore === 'function', 'Expected computePsychologicalBurdenScore export');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert(
    /function getSnapshotMetricValue[\s\S]*if \(viewMode === 'psychological'[\s\S]*computePsychologicalBurdenScore[\s\S]*const burdenMetric/.test(appJs),
    'Expected psychological heat metric to be derived before generic snapshot burden lookup'
  );
  assert(
    /const metric = getSnapshotMetricValue\(metricSource, metricId, \(metricId === 'cognitive' \|\| metricId === 'psychological'\) \? pressure : 0\);/.test(appJs),
    'Expected psychological revealed heat cells to use local cell pressure as fallback'
  );

  const left = Sim.interpolateTraceMetricAtPoint(
    snapshots,
    { x: 5, y: 0 },
    getMetric,
    { corridorRadius: 3 }
  );
  const right = Sim.interpolateTraceMetricAtPoint(
    snapshots,
    { x: 15, y: 0 },
    getMetric,
    { corridorRadius: 3 }
  );
  const offAxis = Sim.interpolateTraceMetricAtPoint(
    snapshots,
    { x: 10, y: 1.5 },
    getMetric,
    { corridorRadius: 3 }
  );

  assertClose(left.metric, 30, 0.5, 'Expected midpoint on first segment to interpolate');
  assertClose(right.metric, 70, 0.5, 'Expected midpoint on second segment to interpolate');
  assertClose(offAxis.metric, 50, 0.5, 'Expected off-axis point to keep local segment metric');
  assert(left.traceDistance <= 1e-6, 'Expected midpoint distance on segment to be 0');
  assertClose(offAxis.traceDistance, 1.5, 1e-6, 'Expected off-axis distance to segment');

  const vulnerableScore = Sim.computePsychologicalBurdenScore(200, {
    capacityScores: { psychological: 1 },
  });
  const robustScore = Sim.computePsychologicalBurdenScore(200, {
    capacityScores: { psychological: 5 },
  });
  const saturatedScore = Sim.computePsychologicalBurdenScore(500, {
    capacityScores: { psychological: 3 },
  });

  assertClose(vulnerableScore, 65, 1e-6, 'Expected pressure to scale by psychological vulnerability');
  assertClose(robustScore, 35, 1e-6, 'Expected robust profile to reduce psychological burden');
  assertClose(saturatedScore, 100, 1e-6, 'Expected burden to clamp to 100');

  console.log('Heat field interpolation validation passed');
}

main();
