import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import { pdfButton } from "../../kit/pdf-button.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 640;
const HEIGHT = 430;

// ---------- world ----------
const PLATE = { x: -160, y: -84, w: 330, d: 148, r: 10 }; // x -160..170, y -84..64
const PLATE_H = 8;
const FOOT_H = 5;

const CABIN = { x: -150, y: -74, w: 110, d: 30, r: 2 }; // x -150..-40, y -74..-44, open front at y -44
const WALL_T = 6;
const WALL_Z0 = 4;
const WALL_Z1 = 30;
const ROOF = { x: -156, y: -78, w: 122, d: 36, r: 3 }; // y -78..-42
const ROOF_Z = 30;
const ROOF_H = 4;

const FRAME = { x: -138, y: -60, w: 84, d: 8, r: 1 }; // lever frame, z 4..9
const FRAME_Z = 5;
const LEVERS = [-124, -106, -88, -70];
const LEVER_LABELS = ["1", "2", "3", "null"];
const LEVER_PULL = [0, 2.6, 0];

const ENTRY_Y = 34;
const GAUGE = 2.2; // half gauge
const HINGE = [-98, ENTRY_Y];
const ANCHOR = [-102, ENTRY_Y]; // blade tongue anchor
const BLADE_LEN = 27;
const ROADS = [
  { y: -26, label: "api" },
  { y: -4, label: "files" },
  { y: 18, label: "spa" },
];
const CONV_X = -46; // where each fan road becomes parallel
const RUN_X = 166; // roads run off the baseboard's right edge
const SPUR_END = [-7.4, ENTRY_Y]; // loco stop at the buffer beam
const BUFFER = { x: 8, y: 27.5, w: 5.5, d: 13, r: 1 }; // beam, z 0..11
const HOME = [-148, ENTRY_Y]; // loco rest centre

const POST_X = -30;
const POSTS = ROADS.map((road) => [POST_X, road.y - 10, 23.5]); // arm pivots
const ANG_DOWN = -1.05; // semaphore drop, radians

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(ROOF, ROOF_Z, ROOF_Z + ROOF_H + 3),
    [-30, -36, 27.6],
    [-30, 8, 27.6],
    [141, -36, 13.6],
    [141, 12, 13.6],
    [-162, 38.5, 13.2],
    [112, -30, 13],
    [112, 22, 13],
    [7, 38.5, 13],
    [13, 41, 11.6],
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 42, elevation: 27 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

// ---------- base plate ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H + FOOT_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 18)].sort((a, b) => k.depthOf([a[0], a[1], -PLATE_H], P) - k.depthOf([b[0], b[1], -PLATE_H], P))) {
    out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  // baseboard edge strip with a ruler
  const strip = { x: -130, y: 54, w: 260, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([[strip.x + 2, strip.y + 3.5, 0.6], [strip.x + strip.w - 2, strip.y + 3.5, 0.6]].map((p) => at(p)), { size: 0.45 }));
  return out.join("");
}

// ---------- cabin with the lever frame ----------
function leverSvg(lx, on) {
  const bar = on ? "hi" : "mid";
  return (
    S(k.slabOf({ x: lx - 1.7, y: -59.2, w: 3.4, d: 4.6, r: 0.8 }, 10.2, 1.8, P, 2, 0.3), { tone: "lo" }) +
    S(k.slabOf({ x: lx - 1.15, y: -58.4, w: 2.3, d: 1.9, r: 0.6 }, 12, 3.4, P, 2, 0.3), { tone: bar }) +
    S(k.cylinder(lx, -57.45, 1.8, 15.4, 1.6, P, 16), { tone: bar, crease: "lo" })
  );
}

function cabin() {
  const out = [];
  out.push(S(k.slabOf(CABIN, 0, WALL_Z0, P, 4, 0.6), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(CABIN, 2), WALL_Z0, P), { tone: "faint" }));
  const back = { x: CABIN.x, y: CABIN.y, w: CABIN.w, d: WALL_T, r: 2 };
  const left = { x: CABIN.x, y: CABIN.y, w: WALL_T, d: CABIN.d, r: 2 };
  const right = { x: CABIN.x + CABIN.w - WALL_T, y: CABIN.y, w: WALL_T, d: CABIN.d, r: 2 };
  for (const wall of [back, left]) {
    out.push(S(k.slabOf(wall, WALL_Z0, WALL_Z1 - WALL_Z0, P, 3, 0.7), { tone: "mid", inner: L(k.sideSeam(wall, 12, P, 3), { tone: "faint" }) }));
  }
  // lever frame with its builder-call label
  out.push(S(k.slabOf(FRAME, WALL_Z0, FRAME_Z, P, 3, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(FRAME, 1.4), WALL_Z0 + FRAME_Z, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.sideMatrix([-96, -51.7, 6.4], 6.4, P, "left"), ".ADD · .INDEX", { size: 2, tone: "mid" }));
  LEVERS.forEach((lx, i) => {
    out.push(S(k.slabOf({ x: lx - 4.5, y: -59.5, w: 9, d: 7, r: 1 }, WALL_Z0 + FRAME_Z, 1.2, P, 3, 0.3), { tone: "lo" }));
    const fan = [-0.5, 0, 0.5]
      .map((a) => k.lineOnTop([lx + 1.6 * Math.sin(a), -57.5 + 1.6 * Math.cos(a)], [lx + 4.6 * Math.sin(a), -52.5], WALL_Z0 + FRAME_Z + 1.2, P))
      .join("");
    out.push(L(fan, { tone: "lo" }));
    out.push(k.faceTextSvg(k.sideMatrix([lx, -52.2, 9.4], 9.4, P, "left"), LEVER_LABELS[i], { size: LEVER_LABELS[i].length > 1 ? 1.5 : 1.8, tone: "mid", anchor: "middle" }));
    out.push(`<g data-part="lever${i}-off">${leverSvg(lx, false)}</g>`);
    out.push(`<g data-part="lever${i}-on" style="display:none">${leverSvg(lx, true)}</g>`);
  });
  // right wall with a glazed window band
  out.push(
    S(k.slabOf(right, WALL_Z0, WALL_Z1 - WALL_Z0, P, 3, 0.7), {
      tone: "mid",
      inner: L(k.sideSeam(right, 12, P, 3), { tone: "faint" }),
    }),
  );
  const face = right.x + right.w + 0.1;
  out.push(L(k.pathOf([at([face, -71, 14]), at([face, -47, 14]), at([face, -47, 26]), at([face, -71, 26])], true), { tone: "lo" }));
  for (const my of [-66.5, -59, -51.5]) {
    out.push(L(k.segment([face, my, 14], [face, my, 26], P), { tone: "lo" }));
  }
  // roof
  out.push(S(k.slabOf(ROOF, ROOF_Z, ROOF_H, P, 3, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(ROOF, 3), ROOF_Z + ROOF_H, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([-95, -59], ROOF_Z + ROOF_H, P, "x"), "GENHTTP", { size: 4.4, tone: "mid", anchor: "middle" }));
  return out.join("");
}

// ---------- track ----------
const legOf = (A, B) => {
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  const len = Math.hypot(dx, dy);
  return { A, B, u: [dx / len, dy / len], n: [-dy / len, dx / len], len };
};

function railQuad(leg, off) {
  const [ux, uy] = leg.u;
  const [nx, ny] = leg.n;
  const e = 1.2;
  const ax = leg.A[0] - ux * e;
  const ay = leg.A[1] - uy * e;
  const bx = leg.B[0] + ux * e;
  const by = leg.B[1] + uy * e;
  const a0 = off - 0.8;
  const b0 = off + 0.8;
  return [
    [ax + nx * a0, ay + ny * a0],
    [bx + nx * a0, by + ny * a0],
    [bx + nx * b0, by + ny * b0],
    [ax + nx * b0, ay + ny * b0],
  ];
}

function trackLegs() {
  const legs = [legOf([-158, ENTRY_Y], [-93, ENTRY_Y]), legOf([-95, ENTRY_Y], [5.5, ENTRY_Y])];
  for (const road of ROADS) {
    legs.push(legOf([-92, ENTRY_Y], [CONV_X, road.y]));
    legs.push(legOf([CONV_X, road.y], [RUN_X, road.y]));
  }
  return legs;
}

function track() {
  const legs = trackLegs();
  const out = [];
  // sleepers, drawn under the rails
  const ticks = [];
  for (const leg of legs) {
    for (let s = 6; s <= leg.len - 6; s += 6.5) {
      const px = leg.A[0] + leg.u[0] * s;
      const py = leg.A[1] + leg.u[1] * s;
      ticks.push(k.lineOnTop([px + leg.n[0] * 2.6, py + leg.n[1] * 2.6], [px - leg.n[0] * 2.6, py - leg.n[1] * 2.6], 0.18, P));
    }
  }
  out.push(L(ticks.join(""), { tone: "lo" }));
  // rails
  const rails = [];
  for (const leg of legs) {
    for (const off of [-GAUGE, GAUGE]) {
      const ring = railQuad(leg, off);
      const cx = ring.reduce((sum, p) => sum + p[0], 0) / 4;
      const cy = ring.reduce((sum, p) => sum + p[1], 0) / 4;
      rails.push({ cx, cy, svg: S(k.extrude(ring, 0, 1.5, P), { tone: "lo", crease: "none" }) });
    }
  }
  rails.sort((a, b) => k.depthOf([a.cx, a.cy, 0], P) - k.depthOf([b.cx, b.cy, 0], P));
  out.push(rails.map((rail) => rail.svg).join(""));
  // the dead-end spur's buffer stop
  out.push(S(k.slabOf({ x: 5.5, y: 29.5, w: 10, d: 9, r: 1 }, 0, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf(BUFFER, 0, 11, P, 3, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BUFFER, 1.2), 11, P), { tone: "lo" }));
  out.push(S(G.sphereOf([6.9, 31.8, 2.4], 1.5, P), { tone: "hi" }));
  out.push(S(G.sphereOf([6.9, 36.2, 2.4], 1.5, P), { tone: "hi" }));
  out.push(k.faceTextSvg(k.sideMatrix([10.7, 40.8, 6], 6, P, "left"), "404", { size: 3, tone: "hi", anchor: "middle" }));
  return out.join("");
}

// ---------- platforms ----------
function platform(road) {
  const y0 = road.y - 12;
  const plan = { x: 64, y: y0, w: 82, d: 8, r: 1.5 };
  const out = [];
  out.push(S(k.slabOf({ x: 55, y: y0 + 0.6, w: 9, d: 6.8, r: 1 }, 0, 1.8, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf(plan, 0, 3.2, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plan, 1.8), 3.2, P), { tone: "faint" }));
  out.push(S(k.cylinder(140, y0 + 2.4, 0.85, 3.2, 8.2, P, 14), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(140, y0 + 2.4, 0.85, 8.4, P, 10), { tone: "faint" }));
  out.push(S(k.cylinder(140, y0 + 2.4, 1.35, 11.4, 1.7, P, 12), { tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([70, y0 + 8.4, 1.6], 1.6, P, "left"), road.label, { size: 2.3, tone: "mid" }));
  return out.join("");
}

function platforms() {
  return ROADS.map((road, i) => `<g data-part="platform-${road.label}">${platform(road)}</g>`).join("");
}

// ---------- signals ----------
function lampSvg(px, py, on) {
  const housing = S(k.cylinder(px, py + 2.7, 1.3, 19.2, 2.6, P, 14), on ? { tone: "hi", lit: true } : { tone: "mid" });
  const glow = on ? D([at([px, py + 2.7, 20.5])], { size: 1, tone: "lit" }) : L(k.ring(px, py + 2.7, 0.8, 21.8, P, 10), { tone: "faint" });
  return housing + glow;
}

function signals() {
  const out = [];
  POSTS.forEach(([px, py], i) => {
    out.push(S(k.cylinder(px, py, 2.6, 0, 1.6, P, 20), { tone: "lo" }));
    out.push(S(k.cylinder(px, py, 1.05, 1.6, 24.4, P, 16), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(px, py, 1.05, 9, P, 10) + k.sideArc(px, py, 1.05, 17, P, 10), { tone: "faint" }));
    out.push(S(k.cylinder(px, py, 1.5, 26, 1.4, P, 14), { tone: "mid" }));
    out.push(S(k.slabOf({ x: px - 0.7, y: py + 0.4, w: 1.4, d: 2.2, r: 0.5 }, 19.6, 1.8, P, 2, 0.3), { tone: "mid" }));
    out.push(`<g data-part="lamp${i}-off">${lampSvg(px, py, false)}</g>`);
    out.push(`<g data-part="lamp${i}-on" style="display:none">${lampSvg(px, py, true)}</g>`);
  });
  return out.join("");
}

// ---------- locomotive ----------
function loco() {
  const out = [];
  out.push(S(k.slabOf({ x: -160, y: 30.9, w: 24, d: 6.2, r: 1.2 }, 0.9, 2.7, P, 3, 0.4), { tone: "hi" }));
  const boiler = G.frameAlong([-152, ENTRY_Y, 6.5], [1, 0, 0]);
  out.push(
    S(
      G.solidOf([[0, 2.85], [13.4, 2.85], [13.5, 3.05], [16.6, 3.05], [17.4, 2.4, 1], [18, 0, 1]], boiler, P),
      { tone: "hi", crease: "lo" },
    ),
  );
  out.push(S(k.slabOf({ x: -161, y: 30.7, w: 9.5, d: 6.6, r: 1 }, 3.6, 7.9, P, 3, 0.5), { tone: "hi" }));
  out.push(S(k.cylinder(-137.5, ENTRY_Y, 1.15, 9.3, 3.5, P, 14), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(-137.5, ENTRY_Y, 0.7, 12.8, P, 10), { tone: "faint" }));
  for (const wx of [-158, -151.5, -145, -138.5]) {
    out.push(S(G.disc(0, 1.4, 2.05, G.frameAlong([wx, 37.0, 2.05], [0, 1, 0]), P), { tone: "lo", crease: "none" }));
  }
  return `<g data-part="loco">${out.join("")}</g>`;
}

// ---------- routes for the live runner ----------
function buildRoute(index) {
  const raw =
    index < 3
      ? [HOME, [-98, ENTRY_Y], [CONV_X, ROADS[index].y], [105, ROADS[index].y]]
      : [HOME, SPUR_END];
  const fil = G.fillet(raw.map(([x, y]) => [x, y, 0]), 12, 7).map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
  const cum = [0];
  for (let i = 1; i < fil.length; i++) cum.push(cum[i - 1] + Math.hypot(fil[i][0] - fil[i - 1][0], fil[i][1] - fil[i - 1][1]));
  return { pts: fil, cum: cum.map((v) => Math.round(v * 10) / 10), total: Math.round(cum[cum.length - 1] * 10) / 10 };
}

const ROUTES = [0, 1, 2, 3].map(buildRoute);
const TIPS = [
  ...ROADS.map((road) => {
    const dx = CONV_X + 2 - HINGE[0];
    const dy = road.y - HINGE[1];
    const len = Math.hypot(dx, dy);
    return [Math.round((ANCHOR[0] + (BLADE_LEN * dx) / len) * 10) / 10, Math.round((ANCHOR[1] + (BLADE_LEN * dy) / len) * 10) / 10];
  }),
  [ANCHOR[0] + BLADE_LEN, ANCHOR[1]],
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A railway signal box drawn as GenHTTP's handler tree. An open-front cabin with a four-lever builder frame stands behind a junction where the entry track crosses point blades and splits into three branch roads ending at platforms, with one short dead-end spur stopped by a buffer. Setting a route pulls its lever, swings the blades, drops that branch's signal arm and runs a small locomotive from the entry to the platform, or into the buffer when the null spur is set.",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="cabin">${cabin()}</g>`,
    `<g data-part="track">${track()}</g>`,
    platforms(),
    `<g data-part="signals">${signals()}</g>`,
    `<g data-part="arms"></g>`,
    `<g data-part="blades"></g>`,
    loco(),
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const ROUTES = ${JSON.stringify(ROUTES)};
const TIPS = ${JSON.stringify(TIPS)};
const ANCHOR = ${JSON.stringify(ANCHOR)};
const POSTS = ${JSON.stringify(POSTS)};
const HOME = ${JSON.stringify(HOME)};
const PULL = ${JSON.stringify(k.translateAlong(P, LEVER_PULL))};
const REST = ${JSON.stringify(k.translateAlong(P, [0, 0, 0]))};
const ANG_DOWN = ${ANG_DOWN};
const RUN = 2600;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const bladesEl = svg.querySelector('[data-part="blades"]');
const armsEl = svg.querySelector('[data-part="arms"]');
const locoEl = svg.querySelector('[data-part="loco"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const levers = [0, 1, 2, 3].map((i) => [svg.querySelector('[data-part="lever' + i + '-off"]'), svg.querySelector('[data-part="lever' + i + '-on"]')]);
const lamps = [0, 1, 2].map((i) => [svg.querySelector('[data-part="lamp' + i + '-off"]'), svg.querySelector('[data-part="lamp' + i + '-on"]')]);
const SAY = ["route 1 · points set · platform", "route 2 · points set · platform", "route 3 · points set · platform", "spur · null → 404"];
let target = 0, tip = TIPS[0].slice(), ang = [0, 0, 0], pull = [0, 0, 0, 0];
let phase = "wait", departAt = 0, s = 0, frame = 0, last = 0, visible = false, touring = true, clock = 0, idleTimer = 0;
let bladesKey = "", armsKey = "", saidKey = "";
function posAlong(route, at) {
  const c = route.cum, p = route.pts;
  if (at <= 0) return p[0];
  if (at >= route.total) return p[p.length - 1];
  let i = 1;
  while (c[i] < at) i++;
  const t = (at - c[i - 1]) / (c[i] - c[i - 1]);
  return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t];
}
function bladeSvg(t) {
  const dx = t[0] - ANCHOR[0], dy = t[1] - ANCHOR[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  let out = "";
  for (const side of [-1, 1]) {
    const a = 2.2 * side, b = 1.8 * side;
    const ring = [
      [ANCHOR[0] + nx * (a - 0.9) - ux * 2, ANCHOR[1] + ny * (a - 0.9) - uy * 2],
      [t[0] + nx * (b - 0.75), t[1] + ny * (b - 0.75)],
      [t[0] + nx * (b + 0.75), t[1] + ny * (b + 0.75)],
      [ANCHOR[0] + nx * (a + 0.9), ANCHOR[1] + ny * (a + 0.9)],
    ];
    out += solidSvg(extrude(ring, 0.25, 1.7, P), { tone: "mid", crease: "lo" });
  }
  return out;
}
function armSvg(post, angle, on) {
  const end = [post[0] + 13.5 * Math.cos(angle), post[1], post[2] - 13.5 * Math.sin(angle)];
  return (
    '<path class="iso-line" data-tone="' + (on ? "hi" : "mid") + '" style="stroke-width:' + (on ? "2px" : "1.4px") + '" d="' + segment(post, end, P) + '"/>' +
    dotsSvg([iso(end, P)], { size: on ? 1.05 : 0.8, tone: on ? "hi" : "mid" }) +
    dotsSvg([iso(post, P)], { size: 0.7, tone: "mid" })
  );
}
function draw() {
  const key = tip[0].toFixed(1) + "," + tip[1].toFixed(1);
  if (key !== bladesKey) { bladesKey = key; bladesEl.innerHTML = bladeSvg(tip); }
  const akey = ang.map((a) => a.toFixed(2)).join(",");
  if (akey !== armsKey) { armsKey = akey; armsEl.innerHTML = POSTS.map((post, i) => armSvg(post, ang[i], target === i)).join(""); }
  const route = ROUTES[target];
  const pos = phase === "wait" ? route.pts[0] : posAlong(route, s);
  locoEl.setAttribute("transform", translateAlong(P, [pos[0] - HOME[0], pos[1] - HOME[1], 0]));
  levers.forEach((pair, i) => {
    const on = target === i;
    pair[0].style.display = on ? "none" : "";
    pair[1].style.display = on ? "" : "none";
    const move = pull[i] > 0.5 ? PULL : REST;
    pair[0].setAttribute("transform", move);
    pair[1].setAttribute("transform", move);
  });
  lamps.forEach((pair, i) => { pair[0].style.display = target === i ? "none" : ""; pair[1].style.display = target === i ? "" : "none"; });
  if (saidKey !== SAY[target]) { saidKey = SAY[target]; readout.textContent = saidKey; }
  stage.setAttribute("aria-valuenow", String(target + 1));
  stage.setAttribute("aria-valuetext", SAY[target]);
}
function eased(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; if (clock > 5.6) { clock = 0; steer((target + 1) % 4, true); } }
  const tx = TIPS[target];
  tip[0] += (tx[0] - tip[0]) * Math.min(1, dt * 9);
  tip[1] += (tx[1] - tip[1]) * Math.min(1, dt * 9);
  if (Math.hypot(tx[0] - tip[0], tx[1] - tip[1]) < 0.02) { tip[0] = tx[0]; tip[1] = tx[1]; }
  for (let i = 0; i < 3; i++) {
    const goal = target === i ? ANG_DOWN : 0;
    ang[i] += (goal - ang[i]) * Math.min(1, dt * 7);
    if (Math.abs(goal - ang[i]) < 0.004) ang[i] = goal;
  }
  for (let i = 0; i < 4; i++) {
    const goal = target === i ? 1 : 0;
    pull[i] += (goal - pull[i]) * Math.min(1, dt * 8);
    if (Math.abs(goal - pull[i]) < 0.01) pull[i] = goal;
  }
  if (phase === "wait" && now >= departAt) phase = "run";
  if (phase === "run") {
    const u = Math.min(1, (now - departAt) / RUN);
    s = eased(u) * ROUTES[target].total;
    if (u >= 1) phase = "done";
  }
  draw();
  const settled = !touring && tip[0] === TIPS[target][0] && tip[1] === TIPS[target][1] && ang.every((a, i) => a === (target === i ? ANG_DOWN : 0)) && pull.every((p, i) => p === (target === i ? 1 : 0)) && phase === "done";
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function snap() {
  tip = TIPS[target].slice();
  for (let i = 0; i < 3; i++) ang[i] = target === i ? ANG_DOWN : 0;
  for (let i = 0; i < 4; i++) pull[i] = target === i ? 1 : 0;
  s = ROUTES[target].total;
  phase = "done";
}
function steer(next, fromTour) {
  target = Math.max(0, Math.min(3, next));
  if (still.matches) { snap(); draw(); return; }
  s = 0;
  phase = "wait";
  departAt = performance.now() + 480;
  if (!fromTour) {
    touring = false;
    clock = 0;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 4200);
  }
  run();
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.max(0, Math.min(0.999, (event.clientX - box.left) / box.width));
  steer(share < 0.25 ? 3 : Math.min(2, Math.floor((share - 0.25) / 0.25)));
});
stage.addEventListener("pointerleave", () => steer(target));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = (target + 1) % 4;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = (target + 3) % 4;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 3;
  if (event.key >= "1" && event.key <= "4") to = Number(event.key) - 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
departAt = performance.now() + 900;
if (still.matches) snap();
draw();
`;

const body = k.plateHtml({
  fig: "Fig 3",
  title: "The handler tree",
  hint: "Hover the track or press 1–4 to set the points",
  readout: "route 1 · points set · platform",
  keys: [
    { mark: "lit", label: "Clear signal: arm dropped, lamp lit — the branch the points are set for" },
    { mark: "raised", label: "Platforms: handlers that answer — .Add(segment, handler), .Index at the root" },
    { mark: "dim", label: "Buffer spur: no handler, HandleAsync returns null → 404" },
  ],
  caption:
    "Every part of GenHTTP is the same two-method IHandler: PrepareAsync warms the tree once before the first connection, HandleAsync answers the request. The lever frame is the builder — .Add(segment, handler) hangs a platform on each branch, .Index(handler) covers the root — and the points are the segment match. Three roads end at platforms that return a response; the dead spur is the null that the concern chain turns into a 404. At the root the layout even forces a trailing slash by redirecting, so no content is ever served at two URLs.",
  body: `${pdfButton(`signal-box-detailed-a4.pdf`)}<div class="iso-stage" tabindex="0" role="slider" aria-label="Signal box: arrow keys or 1 to 4 set the points to a branch or the dead spur" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "The handler tree — signal box", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
