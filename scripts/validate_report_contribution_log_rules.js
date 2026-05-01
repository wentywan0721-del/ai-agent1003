const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const coreJs = fs.readFileSync(path.join(root, 'src', 'core.js'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const runnerJs = fs.readFileSync(path.join(root, 'server', 'heatmap-runner.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(root, 'server', 'sim-server.js'), 'utf8');

assert(
  coreJs.includes('const FOCUS_PRESSURE_CONTRIBUTION_THRESHOLD = 1;')
    && coreJs.includes('function recordFocusPressureContributionLog(prepared, scenario, agent, pressureState, dimensionState) {')
    && coreJs.includes('function recordPsychologicalPressureContributionLogs(')
    && coreJs.includes('function recordVitalityPressureContributionLogs(')
    && coreJs.includes("burdenType: 'psychological'")
    && coreJs.includes("burdenType: 'vitality'")
    && coreJs.includes('scenario.focusPressureContributionLog')
    && coreJs.includes('pressurePointId')
    && coreJs.includes('burdenType')
    && coreJs.includes('contribution')
    && coreJs.includes('visible')
    && coreJs.includes('inVisionRange')
    && coreJs.includes('missedSignage'),
  'Expected core to record thresholded focus-agent pressure contribution logs with burden type, value, location, visibility, and missed signage'
);

assert(
  coreJs.includes('pressureContributionLog: Array.isArray(workingScenario.focusPressureContributionLog)')
    && runnerJs.includes('pressureContributionLog: Array.isArray(playback?.pressureContributionLog)')
    && runnerJs.includes("const HEATMAP_ENGINE_VERSION = 'node-cache-v48';")
    && serverJs.includes("const EXPECTED_HEATMAP_ENGINE_VERSION = 'node-cache-v48';"),
  'Expected playback serialization and cache version to include the new contribution log'
);

assert(
  appJs.includes('function getReportPressureContributionLog() {')
    && appJs.includes('function buildReportPressurePointIndex(locale = getReportLocale()) {')
    && appJs.includes('reportPressureNumber')
    && appJs.includes('pressureNumber')
    && appJs.includes('buildReportNumberedPressurePointMarkup')
    && appJs.includes('buildReportNumberedPressureGroupsMarkup'),
  'Expected report to use contribution-log pressure points with stable numbered pressure markers'
);

assert(
  appJs.includes('const pressureContributionLog = Array.isArray(playback.pressureContributionLog)')
    && appJs.includes('playback.heat?.pressureContributionLog')
    && appJs.includes('pressureContributionLog,')
    && appJs.includes('playback?.pressureContributionLog'),
  'Expected frontend playback normalization to preserve pressure contribution logs returned by the local sim server'
);

assert(
  appJs.includes('function aggregateReportRegionPressureContributions(region, pressurePoints = [], viewMode = COMPOSITE_BURDEN_VIEW) {')
    && appJs.includes('getReportPressureContributionLog().forEach((entry) => {')
    && appJs.includes('pointInsideReportRegion(entryPoint, regionCells, cellSize)')
    && appJs.includes('normalizedBurdenType !== safeViewMode')
    && !/reportDistanceToTrace\(pressurePoint/.test(appJs),
  'Expected report region pressure rankings to aggregate actual focus-agent contribution logs by high-heat region, not route-distance fallback'
);

assert(
  appJs.includes('function buildEvidenceBasedRegionIssueAdvice(')
    && appJs.includes('sourceText')
    && appJs.includes('regionIntensity')
    && appJs.includes('regionDescriptor')
    && appJs.includes('regionInfluenceSources.find((group) => Number(group.index) === Number(region.index))?.sources || []'),
  'Expected detailed burden issue/advice text to be generated per high-heat region from burden type, region intensity, and unified influence sources'
);

assert(
  appJs.includes('showRoutePath: false')
    && appJs.includes("viewMode === 'vitality'")
    && appJs.includes('getReportVitalitySurgeRegions')
    && appJs.includes('buildReportMethodNoteMarkup')
    && appJs.includes('missedSignageItems'),
  'Expected report to hide full heatmap route paths, use vitality surge regions, include method notes, and list missed visible signage'
);

assert(
  /function buildReportMethodNoteMarkup\(reportData\) \{[\s\S]*return `\s*<div class="report-method-note">/.test(appJs)
    && !/report-method-note">\s*<h2 class="report-section-title">/.test(appJs),
  'Expected method note to render under Detailed Burden Analysis without its own section title'
);

console.log('validate_report_contribution_log_rules: ok');
