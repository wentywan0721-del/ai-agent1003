const assert = require('assert');
const http = require('http');
const path = require('path');

const { createSimServer } = require(path.join(__dirname, '..', 'server', 'sim-server.js'));

function listen(server) {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
    server.on('error', reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

function postJson(port, pathname, body) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(JSON.stringify(body), 'utf8');
    const request = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(payload.length),
      },
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({
          statusCode: response.statusCode,
          body: text ? JSON.parse(text) : {},
        });
      });
    });
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

(async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const server = createSimServer();
  try {
    const address = await listen(server);
    const result = await postJson(address.port, '/api/route-analysis', {
      locale: 'zh-CN',
      payload: { route: { startLabel: 'A', targetLabel: 'B' } },
    });
    assert.strictEqual(result.statusCode, 200, 'Expected route analysis endpoint to respond with 200');
    assert.strictEqual(result.body.connected, false, 'Expected route analysis endpoint to stay in placeholder mode without OPENAI_API_KEY');
    assert.strictEqual(result.body.analysis, null, 'Expected no live analysis payload without OPENAI_API_KEY');
    assert(result.body.provider && typeof result.body.provider.status === 'string', 'Expected provider status text when live LLM is unavailable');
    console.log('validate_route_analysis_service: ok');
  } finally {
    if (originalKey !== undefined) {
      process.env.OPENAI_API_KEY = originalKey;
    }
    await close(server);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
