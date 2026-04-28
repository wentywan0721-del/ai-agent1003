const { parentPort, workerData } = require('worker_threads');

const {
  prewarmBackgroundField,
  runHeatmapSimulation,
} = require('./heatmap-runner.js');

async function main() {
  const payload = workerData?.payload || {};
  const options = workerData?.options || {};
  const taskType = workerData?.taskType || 'simulation';
  const serializableOptions = {
    ...options,
    onProgress: (progress) => {
      parentPort?.postMessage({
        type: 'progress',
        progress,
      });
    },
  };
  try {
    const result = taskType === 'background-prewarm'
      ? await prewarmBackgroundField(payload, serializableOptions)
      : await runHeatmapSimulation(payload, serializableOptions);
    parentPort?.postMessage({
      type: 'result',
      result,
    });
  } catch (error) {
    parentPort?.postMessage({
      type: 'error',
      error: error?.stack || error?.message || String(error),
    });
  }
}

void main();
