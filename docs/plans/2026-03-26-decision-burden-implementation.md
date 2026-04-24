# Decision Burden Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将已确认的决策负担机制、公式和最小行为结果接入现有单页模拟器，并保持已确认 UI 结构不变。

**Architecture:** 先新增纯函数级决策机制计算入口，固定公式与行为输出；再让 `deriveFiveDimensionStateAtPoint` 采集场景输入并接入该机制；最后把决策停顿、复核、回退等最小行为挂到重点代理人步进逻辑，并把关键诊断值暴露给现有检查面板与快照。

**Tech Stack:** 原生 HTML/CSS/JS，Node 校验脚本，UMD 模块导出

---

### Task 1: 锁定决策公式回归脚本

**Files:**
- Create: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/scripts/validate_cognitive_rules.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`

**Step 1: Write the failing test**

新增脚本，先断言以下接口存在且结果符合公式：
- `computeDecisionBurdenState`
- `rollDecisionBehaviorOutcome`
- `deriveFiveDimensionStateAtPoint` 能返回新的认知/决策诊断字段

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_cognitive_rules.js`
Expected: FAIL，因为新接口尚未接入。

**Step 3: Write minimal implementation**

在 `src/core.js` 中添加纯函数级决策公式计算与行为掷骰结果函数。

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_cognitive_rules.js`
Expected: PASS

### Task 2: 接入场景输入与五维计算

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/data/unified-rules.js`

**Step 1: Write the failing test**

让校验脚本覆盖：
- 引导支持降低决策负担
- 干扰与冲突提高决策负担
- 认知能力下降时 `M/A/P/O` 变差
- 反应时间随环境恶化而上升

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_cognitive_rules.js`

**Step 3: Write minimal implementation**

在 `deriveFiveDimensionStateAtPoint` 中：
- 采集分支复杂度、导向连续性、干扰项、噪音、光照、拥挤、排队、不确定性
- 调用纯函数计算 `Vc / M / A / P / O / reactionTime / probabilities / burden`
- 返回到 `burdens.cognitive`

同步更新 `data/unified-rules.js` 中认知维度的公式文本和参数说明。

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_cognitive_rules.js`

### Task 3: 接入重点代理人的最小行为机制

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`

**Step 1: Write the failing test**

扩展校验脚本，验证高风险决策状态下会产生：
- 停顿时间
- 复核触发
- 错行前探
- 回退距离

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_cognitive_rules.js`

**Step 3: Write minimal implementation**

在 `createAgent` / `respawnAgent` / `stepAgent` 中新增并消费：
- `lastEffectiveGuideTime`
- `lastEffectiveGuideDistance`
- `decisionPauseRemaining`
- `decisionRecheckRemaining`
- `decisionWrongTurnRemaining`
- `decisionBacktrackRemaining`
- `decisionLateralOffset`

重点代理人在决策节点附近应用最小行为，不重构整套路网。

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_cognitive_rules.js`

### Task 4: 暴露诊断字段给现有面板与快照

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/inspector-utils.js`

**Step 1: Write the failing test**

让检查脚本覆盖重点代理人属性里仍保留原有字段，并可拿到新的决策诊断字段。

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_inspector_panel.js`

**Step 3: Write minimal implementation**

保留现有右侧面板布局，只把新决策诊断值暴露给检查数据对象与快照结构，便于后续继续细化 UI。

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_inspector_panel.js`

### Task 5: 完整校验

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/inspector-utils.js`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/data/unified-rules.js`
- Create: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/scripts/validate_cognitive_rules.js`

**Step 1: Run verification**

Run: `node scripts/validate_cognitive_rules.js`

Run: `node scripts/validate_inspector_panel.js`

Run: `node --check src/core.js`

Run: `node --check src/app.js`

Run: `node --check src/inspector-utils.js`

Run: `node scripts/validate_scenarios.js`

**Step 2: Fix only concrete failures**

只修复验证里暴露出的具体问题，不做额外 UI 重做。
