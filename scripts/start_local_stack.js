const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const STATIC_PORT = 8890;
const SIM_PORT = 8891;

function createServiceConfigs() {
  return [
    {
      name: 'static',
      command: process.env.PYTHON_BIN || 'python',
      args: ['-m', 'http.server', String(STATIC_PORT)],
      cwd: PROJECT_ROOT,
      url: `http://127.0.0.1:${STATIC_PORT}`,
    },
    {
      name: 'sim',
      command: process.execPath,
      args: ['server/sim-server.js'],
      cwd: PROJECT_ROOT,
      url: `http://127.0.0.1:${SIM_PORT}`,
    },
  ];
}

function formatCommand(service) {
  return [service.command, ...service.args].join(' ');
}

function printDryRun() {
  const services = createServiceConfigs();
  services.forEach((service) => {
    console.log(`[${service.name}] ${formatCommand(service)}`);
    console.log(`[${service.name}] ${service.url}`);
  });
}

function pipeTaggedOutput(child, name) {
  const forward = (stream, writer) => {
    if (!stream) {
      return;
    }
    stream.on('data', (chunk) => {
      const text = String(chunk || '');
      text
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => writer(`[${name}] ${line}\n`));
    });
  };
  forward(child.stdout, (line) => process.stdout.write(line));
  forward(child.stderr, (line) => process.stderr.write(line));
}

function startLocalStack() {
  const services = createServiceConfigs();
  const children = services.map((service) => {
    const child = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: false,
    });
    pipeTaggedOutput(child, service.name);
    child.on('exit', (code, signal) => {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      process.stdout.write(`[${service.name}] exited with ${reason}\n`);
    });
    child.on('error', (error) => {
      process.stderr.write(`[${service.name}] failed to start: ${error.message}\n`);
    });
    process.stdout.write(`[${service.name}] ${service.url}\n`);
    return child;
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    children.forEach((child) => {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    });
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv.includes('--dry-run')) {
  printDryRun();
  process.exit(0);
}

startLocalStack();

module.exports = {
  STATIC_PORT,
  SIM_PORT,
  createServiceConfigs,
  formatCommand,
  startLocalStack,
};
