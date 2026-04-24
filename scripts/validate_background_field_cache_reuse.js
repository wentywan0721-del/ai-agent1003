const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const { createSimServer } = require('../server/sim-server.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requestJson(port, method, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers: payload
        ? {
            'Content-Type': 'application/json',
            'Content-Length': String(payload.length),
          }
        : {},
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          statusCode: res.statusCode,
          body: text ? JSON.parse(text) : null,
        });
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function waitForCompletion(port, jobId) {
  for (let attempt = 0; attempt < 2000; attempt += 1) {
    const response = await requestJson(port, 'GET', `/api/heatmap/jobs/${jobId}`);
    assert.strictEqual(response.statusCode, 200, 'job polling should succeed');
    if (response.body.status === 'completed') {
      return response.body;
    }
    if (response.body.status === 'failed') {
      throw new Error(response.body.error || 'heatmap job failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error('heatmap job polling timed out');
}

function createRequestBody(simData, healthyAgents, overrides = {}) {
  const base = {
    simData,
    healthyAgents,
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 100,
      startPoint: { x: 12.4, y: 34.414, z: 0 },
      startNodeId: 'gate_in_1',
      targetRegionId: 'exit_a',
      focusProfile: {
        capacityScores: {
          locomotor: 3,
          sensory: 3,
          cognitive: 3,
          psychological: 3,
          vitality: 3,
        },
      },
    },
    heatOptions: {
      warmupSeconds: 6,
      warmupDt: 0.25,
      maxSimulationSeconds: 8,
    },
  };
  return {
    ...base,
    ...overrides,
    scenarioOptions: {
      ...base.scenarioOptions,
      ...(overrides.scenarioOptions || {}),
    },
    heatOptions: {
      ...base.heatOptions,
      ...(overrides.heatOptions || {}),
    },
  };
}

async function main() {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-background-cache-'));
  const simData = readJson(path.join(PROJECT_ROOT, 'data', 'default-sim.json'));
  const healthyAgents = readJson(path.join(PROJECT_ROOT, 'data', 'healthy-agents.json'));
  const requestA = createRequestBody(simData, healthyAgents, {
    scenarioOptions: {
      focusProfile: {
        capacityScores: {
          locomotor: 2,
          sensory: 4,
          cognitive: 3,
          psychological: 2,
          vitality: 1,
        },
      },
    },
  });
  const requestB = createRequestBody(simData, healthyAgents, {
    scenarioOptions: {
      focusProfile: {
        capacityScores: {
          locomotor: 5,
          sensory: 1,
          cognitive: 4,
          psychological: 5,
          vitality: 4,
        },
      },
    },
  });

  const server = createSimServer({
    rootDir: PROJECT_ROOT,
    cacheDir,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const firstResponse = await requestJson(port, 'POST', '/api/heatmap/jobs', requestA);
    assert.strictEqual(firstResponse.statusCode, 202, 'first request should start a job');
    const firstCompleted = await waitForCompletion(port, firstResponse.body.jobId);
    assert(firstCompleted.result?.meta?.backgroundCacheKey, 'completed result should expose background cache key');
    assert.strictEqual(firstCompleted.result.meta.backgroundCacheHit, false, 'first request should compute background field');

    const secondResponse = await requestJson(port, 'POST', '/api/heatmap/jobs', requestB);
    assert.strictEqual(secondResponse.statusCode, 202, 'different focus parameters should still require a fresh focus job');
    const secondCompleted = await waitForCompletion(port, secondResponse.body.jobId);
    assert(secondCompleted.result?.meta?.backgroundCacheKey, 'second result should expose background cache key');
    assert.strictEqual(
      secondCompleted.result.meta.backgroundCacheKey,
      firstCompleted.result.meta.backgroundCacheKey,
      'background cache key should stay stable when only focus route/profile changes'
    );
    assert.strictEqual(secondCompleted.result.meta.backgroundCacheHit, true, 'second request should reuse the background field cache');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log('validate_background_field_cache_reuse: ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
