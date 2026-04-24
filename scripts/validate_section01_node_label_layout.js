const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  appJs.includes("if (id === 'gate_in_1' || id === 'gate_out_1')"),
  'Expected Exit A nodes to have an explicit label placement rule'
);

assert(
  appJs.includes("if (id === 'gate_out_2' || id === 'gate_out_3')"),
  'Expected Exit B exit gates to have an explicit label placement rule'
);

assert(
  appJs.includes("if (id === 'gate_in_3')") && appJs.includes("if (id === 'gate_out_4')"),
  'Expected Exit C nodes to have explicit label placement rules'
);

assert(
  appJs.includes("if (id === 'gate_in_4')") && appJs.includes("if (id === 'gate_out_5')"),
  'Expected Exit D nodes to have explicit label placement rules'
);

assert(
  appJs.includes("if (id === 'es_down_1_top')") && appJs.includes("if (id === 'es_down_4_top')"),
  'Expected Kennedy Town down 1 and down 4 to have explicit label placement rules'
);

assert(
  appJs.includes("if (id === 'es_up_1_top')"),
  'Expected Kennedy Town up 1 to have an explicit label placement rule'
);

assert(
  appJs.includes("if (id === 'es_up_2_top')"),
  'Expected Kennedy Town up 2 to have an explicit label placement rule'
);

assert(
  appJs.includes("if (id === 'es_up_8_top')"),
  'Expected Tsuen Wan up 8 to have an explicit label placement rule'
);

assert(
  appJs.includes("if (id === 'stair_2_top')"),
  'Expected Kennedy Town stair 2 to have an explicit label placement rule'
);

assert(
  appJs.includes("node.targetRegionIds?.includes('twl')"),
  'Expected Tsuen Wan line nodes to be grouped into a dedicated placement rule'
);

assert(
  !appJs.includes('y: spreadOffsetY'),
  'Expected Section 01 node label offsets to stop using the farther spread offset'
);

assert(
  appJs.includes('const bottomRight = {\n      x: offsetX,\n      y: defaultOffsetY,'),
  'Expected bottom-right labels to keep the same near-point distance as the default Kennedy Town up1 label'
);

assert(
  appJs.includes('const topLeft = {\n      x: -offsetX,\n      y: -defaultOffsetY,'),
  'Expected top-left labels to keep the same near-point distance as the default Kennedy Town up1 label'
);

assert(
  stylesCss.includes('.node-dot.exit-a {\n  fill: #52ce8c;'),
  'Expected Exit A node color to be unified to Exit B green'
);

assert(
  stylesCss.includes('.node-dot.exit-c {\n  fill: #52ce8c;'),
  'Expected Exit C node color to be unified to Exit B green'
);

assert(
  stylesCss.includes('.node-dot.exit-d {\n  fill: #52ce8c;'),
  'Expected Exit D node color to be unified to Exit B green'
);

assert(
  stylesCss.includes('.node-dot.elevator-node {\n  fill: #f39a27;'),
  'Expected elevator node color to change to orange'
);

assert(
  stylesCss.includes('.settings-card--route-stage .route-modal-node-ring.elevator-node {\n  color: #f39a27;'),
  'Expected the Section 01 route-stage elevator ring to change to orange'
);

console.log('validate_section01_node_label_layout: ok');
