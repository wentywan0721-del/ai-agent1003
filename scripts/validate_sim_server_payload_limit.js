const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  source.includes('150 * 1024 * 1024'),
  'sim server should allow substantially larger request bodies for exported sim.json payloads'
);

assert(
  source.includes('Request body too large'),
  'sim server should preserve an explicit oversized-payload error'
);

console.log('validate_sim_server_payload_limit: ok');
