import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 660;
const HEIGHT = 430;

const MAT = { x: -140, y: -60, w: 280, d: 116, r: 8 };
const MAT_H = 10;
const FOOT_H = 5;

const PLINTH = { x: -128, y: -40, w: 92, d: 52, r: 3 };
const PLINTH_H = 6;

const A = { x: -122, y: -34, w: 26, d: 22, r: 2 };
const A_H = 14;
const B = [-88, -30];
const B_H = 20;
const C = { x: -54, y: -32, w: 30, d: 26, r: 2 };
const C_H = 16;

const POD = [-104, 38];
const POD_TOP = 30;
const SCOPE_Z = 27;
const LEG_LEN = 34;
const LEG_Z = -0.72;
const LEGS = [
  [0.49, 0.49, LEG_Z],
  [-0.49, 0.49, LEG_Z],
  [0, -0.694, LEG_Z],
];

const TABLE = { x: -10, y: -48, w: 116, d: 52, r: 3 };
const TABLE_TOP = 20;
const TABLE_H = 4;
const SHEET = { x: -2, y: -40, w: 84, d: 38, r: 1 };
const CELL_W = SHEET.w / 3;

const CASE = { x: 92, y: 18, w: 36, d: 26, r: 3 };
const CASE_H = 10;

const P = k.fitProjection(
  [
    ...k.boxCorners(MAT, -MAT_H - FOOT_H, 0),
    [PLINTH.x, PLINTH.y, PLINTH_H + B_H + 4],
    [POD[0], POD[1], POD_TOP + 2],
    [TABLE.x + TABLE.w, TABLE.y, TABLE_TOP + TABLE_H + 7],
    [CASE.x + CASE.w, CASE.y + CASE.d, CASE_H],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(MAT, -MAT_H, MAT_H + FOOT_H, P)}"/>`];
  for (const [x, y] of [...k.corners(MAT, 18)].sort((a, b) => k.depthOf([a[0], a[1], -MAT_H], P) - k.depthOf([b[0], b[1], -MAT_H], P))) {
    out.push(S(k.cylinder(x, y, 5.5, -MAT_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(MAT, -MAT_H, MAT_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MAT, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(MAT, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  out.push(L(k.lineOnTop([-135, 20], [135, 20], 0.1, P), { tone: "faint" }));
  return out.join("");
}

function plinth() {
  const out = [];
  out.push(S(k.slabOf(PLINTH, 0, PLINTH_H, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 2), PLINTH_H, P), { tone: "faint" }));
  return out.join("");
}

function machineA() {
  const out = [];
  out.push(S(k.slabOf(A, PLINTH_H, A_H, P, 3, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(A, 2), PLINTH_H + A_H, P), { tone: "lo" }));
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      const cell = { x: A.x + 3.4 + j * 6.8, y: A.y + 3.4 + i * 8, w: 5.2, d: 6.2, r: 0.8 };
      out.push(L(k.planOutline(cell, PLINTH_H + A_H, P, 2), { tone: "lo" }));
      out.push(D([at([cell.x + cell.w / 2, cell.y + cell.d / 2, PLINTH_H + A_H])], { size: 0.55 }));
    }
  }
  return out.join("");
}

function machineB() {
  const out = [];
  const [bx, by] = B;
  out.push(L(k.lineOnTop([bx + 6, by + 11], [bx + 18, by + 11], PLINTH_H + 0.05, P), { tone: "lo" }));
  for (const px of [bx, bx + 18]) {
    out.push(S(k.slabOf({ x: px, y: by, w: 6, d: 22, r: 1.5 }, PLINTH_H, B_H, P, 2, 0.5), { tone: "hi", crease: "lo" }));
  }
  out.push(S(k.slabOf({ x: bx - 2, y: by - 2, w: 28, d: 6, r: 1.5 }, PLINTH_H + B_H, 4, P, 2, 0.5), { tone: "hi", crease: "lo" }));
  out.push(D([at([bx + 9, by - 1.2, PLINTH_H + B_H + 4]), at([bx + 21, by - 1.2, PLINTH_H + B_H + 4])], { size: 0.5 }));
  return out.join("");
}

function machineC() {
  const out = [];
  out.push(S(k.slabOf(C, PLINTH_H, C_H, P, 3, 0.6), { tone: "hi", crease: "lo" }));
  for (let i = 0; i < 3; i++) {
    const bay = { x: C.x + 3 + i * 8.4, y: C.y + C.d - 1.6, w: 6.6, d: 1.6, r: 0.6 };
    out.push(S(k.slabOf(bay, PLINTH_H + 3, C_H - 5, P, 2, 0.4), { tone: "lo", crease: "none" }));
  }
  out.push(S(k.slabOf({ x: C.x - 1.5, y: C.y - 1.5, w: C.w + 3, d: C.d + 3, r: 2 }, PLINTH_H + C_H, 2.4, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  return out.join("");
}

function theodolite() {
  const out = [];
  for (const leg of LEGS) {
    const F = G.frameAlong([POD[0], POD[1], POD_TOP], G.unit3(leg));
    out.push(S(G.solidOf([[0, 1.1], [LEG_LEN, 0.7, 1]], F, P, { steps: 10 }), { tone: "mid", crease: "none" }));
    const fx = POD[0] + leg[0] * LEG_LEN;
    const fy = POD[1] + leg[1] * LEG_LEN;
    out.push(S(k.cylinder(fx, fy, 1.6, POD_TOP + leg[2] * LEG_LEN - 1.4, 1.4, P, 12), { tone: "lo" }));
  }
  out.push(S(k.cylinder(POD[0], POD[1], 5.5, POD_TOP - 1.6, 1.6, P, 28), { tone: "hi", crease: "lo" }));
  for (const sx of [-4.5, 4.5]) {
    out.push(S(k.cylinder(POD[0] + sx, POD[1], 1.1, POD_TOP, 6, P, 12), { tone: "hi", crease: "none" }));
  }
  const scopeF = G.frameAlong([POD[0], POD[1], SCOPE_Z], [0, -1, 0]);
  out.push(S(G.solidOf([[0, 1.6], [3, 2.1, 1], [13, 2.1, 1], [16, 1.6]], scopeF, P, { steps: 22 }), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(POD[0], POD[1] + 8, 1.7, SCOPE_Z - 2.4, 2.2, P, 16), { tone: "hi" }));
  out.push(S(k.cylinder(POD[0] + 7.5, POD[1] + 2, 0.9, SCOPE_Z + 2, 2.6, P, 12), { tone: "mid", crease: "none" }));
  return out.join("");
}

function table() {
  const out = [];
  for (const [lx, ly] of [[TABLE.x + 5, TABLE.y + 5], [TABLE.x + TABLE.w - 5, TABLE.y + 5], [TABLE.x + 5, TABLE.y + TABLE.d - 5], [TABLE.x + TABLE.w - 5, TABLE.y + TABLE.d - 5]]) {
    out.push(S(k.cylinder(lx, ly, 2.4, 0, TABLE_TOP, P, 12), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(TABLE, TABLE_TOP, TABLE_H, P, 3, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(SHEET, TABLE_TOP + TABLE_H, 0.7, P, 1), { tone: "hi", crease: "none" }));
  const sz = TABLE_TOP + TABLE_H + 0.7;
  out.push(L(k.planOutline(SHEET, sz, P, 1), { tone: "lo" }));
  for (let i = 1; i < 3; i++) {
    out.push(L(k.lineOnTop([SHEET.x + i * CELL_W, SHEET.y], [SHEET.x + i * CELL_W, SHEET.y + SHEET.d], sz + 0.05, P), { tone: "faint" }));
  }
  for (let i = 1; i < 4; i++) {
    out.push(L(k.lineOnTop([SHEET.x, SHEET.y + i * 9.5], [SHEET.x + SHEET.w, SHEET.y + i * 9.5], sz + 0.05, P), { tone: "faint" }));
  }
  out.push(k.faceTextSvg(k.topMatrix([SHEET.x + SHEET.w - 13, SHEET.y + SHEET.d - 4], sz + 0.1, P, "x"), "OPENAPI", { size: 2.2, tone: "mid", anchor: "middle" }));
  for (const rx of [SHEET.x - 3, SHEET.x + SHEET.w + 3]) {
    out.push(S(k.slabOf({ x: rx - 1.2, y: SHEET.y - 2, w: 2.4, d: SHEET.d + 4, r: 0.8 }, TABLE_TOP + TABLE_H, 3.2, P, 2, 0.4), { tone: "mid" }));
  }
  return out.join("");
}

function drawings() {
  const sz = TABLE_TOP + TABLE_H + 0.8;
  const cells = [];
  for (let i = 0; i < 3; i++) {
    const cx = SHEET.x + CELL_W * i + CELL_W / 2;
    const cy = SHEET.y + SHEET.d / 2;
    const cell = [];
    cell.push(L(k.planOutline({ x: cx - 9, y: cy - 8, w: 18, d: 16, r: 1.5 }, sz + 0.1, P, 2), { tone: "mid" }));
    if (i === 0) {
      cell.push(L(k.lineOnTop([cx - 9, cy - 3], [cx + 9, cy - 3], sz + 0.1, P), { tone: "mid" }));
      cell.push(L(k.lineOnTop([cx - 9, cy + 1], [cx + 9, cy + 1], sz + 0.1, P), { tone: "mid" }));
      cell.push(L(k.lineOnTop([cx - 9, cy + 5], [cx + 9, cy + 5], sz + 0.1, P), { tone: "mid" }));
    }
    if (i === 1) {
      cell.push(L(k.lineOnTop([cx - 9, cy], [cx + 9, cy], sz + 0.1, P), { tone: "mid" }));
      cell.push(L(k.planOutline({ x: cx - 5, y: cy - 5.5, w: 10, d: 7, r: 1 }, sz + 0.1, P, 2), { tone: "mid" }));
    }
    if (i === 2) {
      cell.push(L(k.planOutline({ x: cx - 7, y: cy - 6, w: 6, d: 12, r: 1 }, sz + 0.1, P, 2), { tone: "mid" }));
      cell.push(L(k.planOutline({ x: cx + 1, y: cy - 6, w: 6, d: 12, r: 1 }, sz + 0.1, P, 2), { tone: "mid" }));
      cell.push(L(k.lineOnTop([cx - 7, cy], [cx + 7, cy], sz + 0.1, P), { tone: "mid" }));
    }
    cells.push(`<g data-part="draw-${i}" style="opacity:0.18">${cell.join("")}</g>`);
  }
  return cells.join("");
}

function instrumentCase() {
  const out = [];
  out.push(S(k.slabOf(CASE, 0, CASE_H, P, 4, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(CASE, 2), CASE_H, P), { tone: "lo" }));
  out.push(S(k.slabOf({ x: CASE.x + CASE.w / 2 - 8, y: CASE.y + CASE.d / 2 - 1.4, w: 16, d: 2.8, r: 1.2 }, CASE_H, 1.6, P, 2, 0.3), { tone: "hi", crease: "none" }));
  for (const clx of [CASE.x + 6, CASE.x + CASE.w - 6]) {
    out.push(S(k.slabOf({ x: clx - 1, y: CASE.y + CASE.d - 2.6, w: 2, d: 1.6, r: 0.4 }, CASE_H - 2.4, 2.4, P, 2), { tone: "hi", crease: "none" }));
  }
  return out.join("");
}

function staffRack() {
  const out = [];
  const rack = { x: -134, y: 28, w: 32, d: 20, r: 2 };
  out.push(S(k.slabOf(rack, 0, 2, P, 3, 0.4), { tone: "mid" }));
  for (const py of [34, 44]) {
    out.push(S(k.slabOf({ x: -131, y: py - 1.2, w: 5, d: 2.4, r: 0.8 }, 2, 5.5, P, 2, 0.3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: -110, y: py - 1.2, w: 5, d: 2.4, r: 0.8 }, 2, 5.5, P, 2, 0.3), { tone: "mid" }));
  }
  const poleF = G.frameAlong([-117, 39, 6.4], G.unit3([0.985, 0.1, 0.14]));
  out.push(S(G.solidOf([[0, 0.7], [24, 0.7, 1], [25.4, 0.8, 1], [26.6, 0.4]], poleF, P, { steps: 12 }), { tone: "hi", crease: "lo" }));
  for (const band of [5, 18]) {
    out.push(S(G.ringBand(band, band + 1.6, 0.72, 1.05, poleF, P, { steps: 12 }), { tone: "lit", crease: "none" }));
  }
  return out.join("");
}

function cable(route) {
  const pts = G.fillet(route, 2.2, 7, { P, tube: 0.55 });
  const pieces = tubePieces(pts, 0.55, P, { maxLength: 12 });
  return pieces.map((piece) => tubeSvg(piece, { tone: "lo" })).join("");
}

const AIM = [-104, 44];
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A surveyor's station: a theodolite on a tripod aims at a model factory of three machines standing for the explorer chain; beside it a drafting table whose pen carriage draws each surveyed machine's outline onto a gridded sheet, and an instrument case sits at the front. A range pole with a lit bead stands at the machine being surveyed.",
  body: [
    base(),
    plinth(),
    machineA(),
    machineB(),
    machineC(),
    theodolite(),
    table(),
    drawings(),
    instrumentCase(),
    staffRack(),
    `<g data-part="pole" transform="${k.translateAlong(P, [0, 0, 0])}">${S(k.cylinder(A.x + A.w / 2, A.y + A.d + 3, 0.8, PLINTH_H, 24, P, 10), { tone: "hi", crease: "none" })}${S(k.cylinder(A.x + A.w / 2, A.y + A.d + 3, 1.4, PLINTH_H + 24, 2.2, P, 14), { tone: "hi", lit: true })}</g>`,
    `<g data-part="carriage" transform="${k.translateAlong(P, [0, 0, 0])}">${S(k.slabOf({ x: SHEET.x + CELL_W / 2 - 5, y: SHEET.y - 4, w: 10, d: SHEET.d + 8, r: 1 }, TABLE_TOP + TABLE_H + 3.2, 3.4, P, 2, 0.4), { tone: "hi", crease: "lo" })}${S(k.cylinder(SHEET.x + CELL_W / 2, SHEET.y + SHEET.d / 2, 0.5, TABLE_TOP + TABLE_H + 0.7, 3.3, P, 8), { tone: "hi", crease: "none", lit: true })}</g>`,
    `<g data-part="cables">${cable([[POD[0] + 6, POD[1] + 2, SCOPE_Z - 2], [POD[0] + 16, 22, 1.2], [-26, 22, 1.2], [-26, -24, 1.2], [-21, -24, 1.8]])}${cable([[-15, -24, 2], [-11.5, -14, 2], [-11.5, -8, 3], [-11.5, -8, 21], [-8, -8, 25.4]])}</g>`,
    S(k.slabOf({ x: -24, y: -28, w: 10, d: 8, r: 1.5 }, 0, 4, P, 2, 0.4), { tone: "mid" }) + L(k.planOutline(k.insetPlan({ x: -24, y: -28, w: 10, d: 8, r: 1.5 }, 1.2), 4, P), { tone: "lo" }),
    S(k.slabOf({ x: -11.2, y: -9.4, w: 2.4, d: 2.8, r: 0.6 }, 11, 2.6, P, 2), { tone: "hi", crease: "none" }),
    S(k.cylinder(-8, -8, 1.4, TABLE_TOP + TABLE_H, 1.6, P, 14), { tone: "hi" }) + L(k.ring(-8, -8, 0.8, TABLE_TOP + TABLE_H + 1.6, P, 12), { tone: "lo" }),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const AIMS = ${JSON.stringify([
  [A.x + A.w / 2, A.y + A.d + 3, PLINTH_H],
  [B[0] + 12, B[1] + B_H + 6, PLINTH_H],
  [C.x + C.w / 2, C.y + C.d + 3, PLINTH_H],
])};
const PENS = ${JSON.stringify([0, 1, 2].map((i) => [SHEET.x + CELL_W * i + CELL_W / 2, 0, 0]))};
const PATHS = ${JSON.stringify([0, 1, 6])};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const pole = svg.querySelector('[data-part="pole"]');
const carriage = svg.querySelector('[data-part="carriage"]');
const draws = [0, 1, 2].map((i) => svg.querySelector('[data-part="draw-' + i + '"]'));
let aim = 0, target = 0, seen = new Set([0]), last = 0, frame = 0, visible = false, touring = true, clock = 0, idleTimer = 0, cacheHit = false;
const follow = (cur, to, dt) => cur + (to - cur) * (1 - Math.exp(-dt / 0.22));
let poleAt = [...AIMS[0]], penX = PENS[0][0];
function draw() {
  pole.setAttribute("transform", translateAlong(P, [poleAt[0] - AIMS[0][0], poleAt[1] - AIMS[0][1], poleAt[2] - AIMS[0][2]]));
  carriage.setAttribute("transform", translateAlong(P, [penX - PENS[0][0], 0, 0]));
  draws.forEach((group, i) => {
    const want = seen.has(i) ? "1" : "0.18";
    if (group.style.opacity !== want) group.style.opacity = want;
  });
  const paths = [...seen].reduce((sum, i) => sum + PATHS[i], 0);
  const text = (seen.size < 3 ? "survey " + seen.size + " of 3 · paths " + paths : "paths " + paths + " · schemas 4 · " + (cacheHit ? "cached" : "live"));
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(seen.size));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = Math.floor(clock / 2.2) % 3; }
  const calm = still.matches;
  if (calm) { poleAt = [...AIMS[target]]; penX = PENS[target][0]; }
  else {
    for (let i = 0; i < 3; i++) poleAt[i] = follow(poleAt[i], AIMS[target][i], dt);
    penX = follow(penX, PENS[target][0], dt);
  }
  draw();
  const settled = Math.abs(penX - PENS[target][0]) < 0.05 && Math.abs(poleAt[1] - AIMS[target][1]) < 0.05;
  frame = visible && (touring || !settled || !calm) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  target = Math.max(0, Math.min(2, next));
  cacheHit = seen.has(target);
  seen.add(target);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; clock = target * 2.2; run(); }, 3600);
  run();
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.max(0, Math.min(0.999, (event.clientX - box.left) / box.width));
  steer(Math.floor(share * 3));
});
stage.addEventListener("pointerleave", () => steer(target));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = target + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = target - 1;
  if (event.key === "Home") to = 0;
  if (event.key >= "1" && event.key <= "3") to = Number(event.key) - 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 6",
  title: "The OpenAPI generator",
  hint: "Hover to aim the theodolite at a machine",
  readout: "survey 1 of 3 · paths 0",
  keys: [
    { mark: "lit", label: "Range pole and pen: where the survey is right now" },
    { mark: "raised", label: "Three machines: concerns, layout gateway, service bays" },
    { mark: "dim", label: "The sheet: one outline per surveyed machine, cached after" },
  ],
  caption:
    "ApiDescription crawls the live handler tree — concerns, then layout, then service methods — instead of a parallel description. The document is drawn from what actually answers, its schemas come from the same serializer options you serve with, and it is cached with a checksum and served content-negotiated as JSON or YAML.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="OpenAPI surveyor: arrow keys aim at a machine" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "The OpenAPI generator", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
