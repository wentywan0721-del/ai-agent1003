const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const workspaceRoot = path.resolve(__dirname, '..');
const cmdExe = process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
const sessionId = `detail-layer-${Date.now()}`;
const outputDir = path.join(workspaceRoot, 'output', 'playwright');

function runPlaywrightCli(args, options = {}) {
  return execFileSync(
    cmdExe,
    ['/d', '/s', '/c', 'npx.cmd', '--yes', '--package', '@playwright/cli', 'playwright-cli', `-s=${sessionId}`, ...args],
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

function screenshot(fileName) {
  const filePath = path.join(outputDir, fileName);
  runPlaywrightCli(['screenshot', '--selector', '#visualization-detail-stage-frame', filePath]);
  return filePath;
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  try {
    runPlaywrightCli(['open', 'http://127.0.0.1:8890/']);
    evalExpression("window.__PLANAR_DEBUG__.showUiScreen('settings')");
    evalExpression("window.__PLANAR_DEBUG__.loadPreparedModelFromUrl('./data/111.sim.json', '111.sim.json')");
    evalExpression("window.__PLANAR_DEBUG__.setRoute('gate_in_1', 'exit_d')");
    evalExpression('window.__PLANAR_DEBUG__.startAnalysis()');
    evalExpression("new Promise((resolve) => setTimeout(() => resolve(window.__PLANAR_DEBUG__.openDetailView('composite')), 1500))");
    evalExpression('new Promise((resolve) => setTimeout(() => resolve(true), 1500))');

    const reset = "(() => { const bg = document.getElementById('visualization-detail-background'); const heat = document.getElementById('visualization-detail-heat'); const overlay = document.getElementById('visualization-detail-overlay'); if (bg) bg.style.opacity = '1'; if (heat) heat.style.opacity = '1'; if (overlay) overlay.style.opacity = '1'; return true; })()";
    const stages = [
      { name: 'detail-normal.png', script: reset },
      {
        name: 'detail-hide-background.png',
        script: "(() => { const bg = document.getElementById('visualization-detail-background'); const heat = document.getElementById('visualization-detail-heat'); const overlay = document.getElementById('visualization-detail-overlay'); if (bg) bg.style.opacity = '0'; if (heat) heat.style.opacity = '1'; if (overlay) overlay.style.opacity = '1'; return true; })()",
      },
      {
        name: 'detail-hide-heat.png',
        script: "(() => { const bg = document.getElementById('visualization-detail-background'); const heat = document.getElementById('visualization-detail-heat'); const overlay = document.getElementById('visualization-detail-overlay'); if (bg) bg.style.opacity = '1'; if (heat) heat.style.opacity = '0'; if (overlay) overlay.style.opacity = '1'; return true; })()",
      },
      {
        name: 'detail-hide-both.png',
        script: "(() => { const bg = document.getElementById('visualization-detail-background'); const heat = document.getElementById('visualization-detail-heat'); const overlay = document.getElementById('visualization-detail-overlay'); if (bg) bg.style.opacity = '0'; if (heat) heat.style.opacity = '0'; if (overlay) overlay.style.opacity = '1'; return true; })()",
      },
    ];

    stages.forEach((stage) => {
      evalExpression(stage.script);
      const filePath = screenshot(stage.name);
      console.log(filePath);
    });
  } finally {
    try {
      runPlaywrightCli(['close']);
    } catch (error) {
      // Ignore close failures.
    }
  }
}

main();
