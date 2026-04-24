const { parentPort, workerData } = require('worker_threads');

const { runHeatmapSimulation } = require('./heatmap-runner.js');

async function main() {
  const payload = workerData?.payload || {};
  const options = workerData?.options || {};
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
    const result = await runHeatmapSimulation(payload, serializableOptions);
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
