# 中环站平面模拟器

纯前端单页应用，读取 Rhino 导出的 `sim.json`，在单层平面内完成：

- 全站背景人流生成
- 单条重点路线评估
- 轨迹沉积式热力图
- 热点问题点与规则化建议

## 当前实现

- 空间模型基于平面可步行区，不再使用线段中心线热力图
- 背景人流来自 `data/healthy-agents.json`
- 严格健康样本池共 `123` 人
- 同时人数预设：`平时 70`、`高峰 123`
- 重点路线预设：
  - `route1`: `gate_in_2 -> train_door4`
  - `route2`: `es_up_1_top -> gate_out_1`
  - `route3`: `train_door1 -> es_down_5_top`
- 背景人流按 `132` 条有效 OD 路线加权分配
- 热力图只沿重点代理人的真实轨迹累积，背景人流只作为路径扰动来源

## 目录

- `index.html`：页面入口
- `styles.css`：样式
- `src/core.js`：OD 规则、代理人模拟、热力图计算
- `src/app.js`：界面渲染与交互
- `data/default-sim.json`：默认平面模型
- `data/healthy-agents.json`：严格健康老人样本池
- `scripts/export_rhino_sim.py`：Rhino 图层导出 `sim.json`
- `scripts/generate_healthy_agents.py`：从 `../agents_base.csv` 生成 `healthy-agents.json`
- `scripts/validate_scenarios.js`：前端核心逻辑验证

## 使用方式

1. 生成健康样本池：

```bash
python scripts/generate_healthy_agents.py
```

2. 直接一键启动本地页面和 Node 仿真服务：

```bash
node scripts/start_local_stack.js
```

3. 如果只想单独启动页面静态服务：

```bash
python -m http.server 8890
```

4. 打开：

```text
http://127.0.0.1:8890/
```

## 本地 Node 仿真服务（第一批）

用于把热力图预计算搬出前端主线程，并把结果缓存到项目目录：

```bash
node server/sim-server.js
```

默认地址：

```text
http://127.0.0.1:8891
```

默认缓存目录：

```text
./.cache/heatmap
```

当前已提供接口：

- `GET /api/health`
- `POST /api/heatmap/jobs`
- `GET /api/heatmap/jobs/:id`

## 前端热力图接线（第二批）

- 运行热力图会优先请求本地 Node 服务
- 如果本地服务不可用，前端会自动回退到浏览器内计算
- 相同参数再次运行时，会优先命中 `./.cache/heatmap` 中的缓存
- 页面顶部状态和右侧摘要会显示本次热力图来源：`本地服务 / 本地服务缓存 / 浏览器回退`

## 页面流程

1. 加载默认模型或导入本地 `sim.json`
2. 选择重点路线、五维能力、背景人流
3. 点击“生成人流”
4. 点击“运行热力图”
5. 点击重点代理人查看即时压力、疲劳与座位建议

## 验证

```bash
node scripts/validate_scenarios.js
python scripts/validate_rhino_export_logic.py
```
