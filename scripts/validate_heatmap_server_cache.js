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
        const json = text ? JSON.parse(text) : null;
        resolve({ statusCode: res.statusCode, body: json });
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
  for (let attempt = 0; attempt < 1200; attempt += 1) {
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

async function main() {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-heatmap-cache-'));
  const simData = readJson(path.join(PROJECT_ROOT, 'data', 'default-sim.json'));
  const healthyAgents = readJson(path.join(PROJECT_ROOT, 'data', 'healthy-agents.json'));
  const requestBody = {
    simData,
    healthyAgents,
    scenarioOptions: {
      focusProfile: {},
      crowdPresetId: 'normal',
      startPoint: { x: 12.4, y: 34.414, z: 0 },
      startNodeId: 'gate_in_1',
      targetRegionId: 'exit_a',
    },
    heatOptions: {
      warmupSeconds: 48,
      warmupDt: 0.25,
      maxSimulationSeconds: 60,
    },
  };

  const server = createSimServer({
    rootDir: PROJECT_ROOT,
    cacheDir,
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const healthResponse = await requestJson(port, 'GET', '/api/health');
    assert.strictEqual(healthResponse.statusCode, 200, 'health endpoint should respond');
    assert.strictEqual(healthResponse.body.ok, true, 'health endpoint should return ok');

    const firstResponse = await requestJson(port, 'POST', '/api/heatmap/jobs', requestBody);
    assert.strictEqual(firstResponse.statusCode, 202, 'first heatmap request should create a job');
    assert.strictEqual(firstResponse.body.cacheHit, false, 'first heatmap request should not hit cache');
    assert(firstResponse.body.jobId, 'first heatmap request should return a job id');

    const firstCompleted = await waitForCompletion(port, firstResponse.body.jobId);
    assert.strictEqual(firstCompleted.cacheHit, false, 'first completed job should still be marked as uncached');
    assert(firstCompleted.result, 'completed heatmap job should return a result payload');
    assert(firstCompleted.result.heat, 'completed heatmap job should include heat playback result');
    assert(firstCompleted.result.summary, 'completed heatmap job should include summary metadata');
    assert(firstCompleted.result.meta.durationMs >= 0, 'completed heatmap job should include duration');

    const cacheFiles = fs.readdirSync(cacheDir);
    assert(cacheFiles.length > 0, 'first completed job should write cache files');

    const secondResponse = await requestJson(port, 'POST', '/api/heatmap/jobs', requestBody);
    assert.strictEqual(secondResponse.statusCode, 200, 'second identical heatmap request should resolve from cache immediately');
    assert.strictEqual(secondResponse.body.cacheHit, true, 'second identical heatmap request should hit cache');
    assert(secondResponse.body.result, 'cached heatmap response should include result payload');
    assert.strictEqual(secondResponse.body.result.cacheHit, true, 'cached result metadata should mark cache hit');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main()
  .then(() => {
    console.log('validate_heatmap_server_cache: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
