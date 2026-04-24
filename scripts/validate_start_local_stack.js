const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const scriptPath = path.join(projectRoot, 'scripts', 'start_local_stack.js');
const readmePath = path.join(projectRoot, 'README.md');

assert(fs.existsSync(scriptPath), 'start_local_stack.js should exist');

const result = spawnSync(process.execPath, [scriptPath, '--dry-run'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

assert.strictEqual(result.status, 0, 'dry-run should exit successfully');
assert(result.stdout.includes('http://127.0.0.1:8890'), 'dry-run should print the static app address');
assert(result.stdout.includes('http://127.0.0.1:8891'), 'dry-run should print the local sim service address');
assert(result.stdout.includes('server/sim-server.js'), 'dry-run should mention the sim server command');

const readme = fs.readFileSync(readmePath, 'utf8');
assert(readme.includes('node scripts/start_local_stack.js'), 'README should document the one-command local stack startup');
assert(readme.includes('运行热力图会优先请求本地 Node 服务'), 'README should explain the browser-to-local-service heatmap flow');

console.log('validate_start_local_stack: ok');
