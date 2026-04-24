const { execFileSync } = require('node:child_process');
const path = require('node:path');

const workspaceRoot = path.resolve(__dirname, '..');
const cmdExe = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
const sessionId = `detail-live-${Date.now()}`;

function runPlaywrightCli(args, options = {}) {
  return execFileSync(
    cmdExe,
    ['/d', '/s', '/c', 'npx.cmd', '--yes', '--package', '@playwright/cli', 'playwright-cli', '-s=' + sessionId, ...args],
    {
      cwd: workspaceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    }
  );
}

function evalExpression(expression) {
  const output = runPlaywrightCli(['eval', expression]);
  const marker = '### Result';
  const markerIndex = output.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Unexpected eval output:\n${output}`);
  }
  const afterMarker = output.slice(markerIndex + marker.length).trimStart();
  const nextSection = afterMarker.indexOf('\n### ');
  const payload = (nextSection >= 0 ? afterMarker.slice(0, nextSection) : afterMarker).trim();
  return JSON.parse(payload);
}

function main() {
  try {
    runPlaywrightCli(['open', 'http://127.0.0.1:8890/']);

    evalExpression("window.__PLANAR_DEBUG__.showUiScreen('settings')");
    evalExpression("window.__PLANAR_DEBUG__.loadPreparedModelFromUrl('./data/111.sim.json', '111.sim.json')");
    evalExpression("window.__PLANAR_DEBUG__.setRoute('gate_in_1', 'exit_d')");
    evalExpression('window.__PLANAR_DEBUG__.startAnalysis()');
    evalExpression('new Promise((resolve) => setTimeout(() => resolve(window.__PLANAR_DEBUG__.getState()), 800))');

    const beforeDetail = evalExpression('window.__PLANAR_DEBUG__.getState()');
    if (!beforeDetail.heatActive || beforeDetail.animationPaused || beforeDetail.lastAnimationError) {
      throw new Error(`overview should stay live before opening detail: ${JSON.stringify(beforeDetail)}`);
    }

    evalExpression("window.__PLANAR_DEBUG__.openDetailView('sensory')");
    const afterDetail = evalExpression('new Promise((resolve) => setTimeout(() => resolve(window.__PLANAR_DEBUG__.getState()), 500))');

    if (afterDetail.animationPaused) {
      throw new Error(`detail view should remain live, but animation paused: ${JSON.stringify(afterDetail)}`);
    }
    if (afterDetail.lastAnimationError) {
      throw new Error(`detail view should not raise animation errors: ${JSON.stringify(afterDetail.lastAnimationError)}`);
    }
    if (!(Number(afterDetail.playbackRevealTime) > Number(beforeDetail.playbackRevealTime))) {
      throw new Error(`detail playback time should keep advancing: before=${beforeDetail.playbackRevealTime}, after=${afterDetail.playbackRevealTime}`);
    }

    console.log('Visualization detail view keeps live motion after opening.');
  } finally {
    try {
      runPlaywrightCli(['close']);
    } catch (error) {
      // Ignore close failures for already-closed sessions.
    }
  }
}

main();
