import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../kit/tube.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 640;
const HEIGHT = 430;

// ---------------------------------------------------------------- world plan
// The coin sorter: hopper (inbound connections) -> chute -> reading bridge
// (Glyph11 parse into zero-copy views) -> routing gate (dispatch into the
// handler tree) -> 3 outcome lanes (handler / 404 / error) -> press (response
// serialization) on the handler lane -> trays -> return gutter -> pneumatic
// tube (blower at its foot) -> pool tray (the [ThreadStatic] stack, max 1024)
// -> feed rail -> hopper again. The same coin circulates; none is minted.

const PLATE = { x: -148, y: -82, w: 296, d: 140, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;

const RULER = { x: -136, y: 40, w: 104, d: 7, r: 1 };

const HOP = { x: -108, y: -34 };          // funnel centre
const HOP_Z0 = 25.0;                      // stem base (sinks into the head block)
const FUN = G.frameOf([HOP.x, HOP.y, HOP_Z0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const FUN_PROFILE = [[0, 2], [4.5, 2], [5.1, 3.1], [5.7, 3.1], [5.9, 4.4, 1], [8.6, 12.4, 1], [10.2, 13.1]];
const FUN_TOP = HOP_Z0 + 10.2;            // mouth face
const RIM_TOP = HOP_Z0 + 11.3;

const HEAD_BLOCK = { x: -111.5, y: -36.5, w: 9, d: 9, r: 1.5 };
const HEAD_TOP = 25.6;

const POOL = { x: -146, y: -59, w: 26, d: 16, r: 2 };
const POOL_FLOOR = 40.2;
const POOL_WALL_H = 3.4;

const FEED_A = [-131.5, -52.5, 44.2];     // feed rail: pool stack to funnel rim
const FEED_B = [-118.3, -42.7, 34.6];

const CHUTE_A = [-101.5, -30.8, 24.2];    // rail centre line, head slot to deck
const CHUTE_B = [24, 4, 14.4];

const DECK = { x: 22, y: -24, w: 26, d: 52, r: 3 };
const DECK_TOP = 13.2;
const PIVOT = [33, 4];
const EXITS = [-14, 4, 22];               // lane exit y at the deck edge (x = 48)
const FLAP_Z0 = 13.5;
const FLAP_Z1 = 17.0;
const FLAP_PTS = [[2.4, -1.15], [12.6, -1.15], [14.8, 0], [12.6, 1.15], [2.4, 1.15]];
const FLAP_ANGLES = EXITS.map((ey) => Math.atan2(ey - PIVOT[1], 48 - PIVOT[0]));

const ANVIL = { x: 69, y: -23.2, w: 17, d: 9.4, r: 1.5 };
const ANVIL_TOP = 12.4;

const TRAYS = [
  { name: "HANDLER", x: 97, y: -29, entry: -21.6, exit: -20.5, railEnd: [97.4, -21, 8.7], drop: [100, -21.5, 7.4], hold: [100, -21.5, 7.4] },
  { name: "404", x: 94, y: -5, entry: 2.6, exit: 4.2, railEnd: [94.4, 3, 8.7], drop: [97, 3, 7.4], hold: [102, 3, 7.4] },
  { name: "ERROR", x: 91, y: 19, entry: 24.6, exit: 24.3, railEnd: [91.4, 23.9, 8.9], drop: [94, 24.4, 7.4], hold: [99, 24.6, 7.4] },
];
const TRAY_FLOOR = 5.6;
const TRAY_WALL_H = 3.2;

const GUTTER = { x: 134, y: -58, w: 14, d: 94, r: 1.5 };
const GUTTER_TOP = 4.8;

const MOUTH = [142, -52];
const NOZZLE_END = [-131.5, -51.5, 46.2];

const BLOWER = { x: 134, y: -76, w: 14, d: 12, r: 2 };

const TUBE_ROUTE = [
  [142, -52, 5.4], [142, -55, 7.8], [142, -59, 10.6], [112, -64, 17], [30, -66, 29.5],
  [-52, -62.5, 41.5], [-113, -57, 48.4], [-128, -54.5, 48.4], [-131, -52.5, 47.6], NOZZLE_END,
];

const BRIDGE_AT = -40;
const GAUGE = { r: 6.4, z0: 22.7, z1: 26.2, x: 0, y: 0 };               // filled below
const NEEDLE_REST = -0.7;

// ---------------------------------------------------------------- projection
const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [POOL.x, POOL.y, POOL_FLOOR + POOL_WALL_H], [POOL.x + POOL.w, POOL.y + POOL.d, POOL_FLOOR + POOL_WALL_H],
    [FEED_A[0], FEED_A[1], 45.8],
    [-113, -57, 50], [-128, -54.5, 50],
    [HOP.x, HOP.y, RIM_TOP + 0.6],
    [-41.6, -19.5, 31.8],
    [78, -18.6, 32.2],
    [DECK.x + DECK.w, DECK.y + DECK.d, DECK_TOP + 0.2],
    [117, 35, 10.4],
    [GUTTER.x + GUTTER.w, GUTTER.y + GUTTER.d, 8.4],
    [RULER.x + RULER.w, RULER.y + RULER.d, 1],
    [BLOWER.x, BLOWER.y, 8.4],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const coinSvg = (x, y, z, lit = false) => S(k.cylinder(x, y, 3.2, z, 1.15, P, 30, 0.35), { tone: "hi", crease: "lo", lit }) + L(k.ring(x, y, 2.25, z + 1.15, P, 22), { tone: "lo" });

// ---------------------------------------------------------------- rails -----
// A rail is a square-section prism along an arbitrary 3D axis; the section's
// v axis is world z and u the horizontal perpendicular, so a rail's top stays
// level across the chute while the centre line slopes.

function railGeo(a, b) {
  const axis = G.unit3(G.sub3(b, a));
  const u = G.unit3([-axis[1], axis[0], 0]);
  return { a, b, axis, u, len: G.len3(G.sub3(b, a)), F: G.frameOf(a, axis, u, [0, 0, 1]) };
}

function railSvg(geo, { w = 0.75, h0 = -0.9, h1 = 0.9, tone = "mid" } = {}) {
  return S(G.prismOf(geo.F, [[-w, h0], [w, h0], [w, h1], [-w, h1]], 0, geo.len, P), { tone, crease: "none" });
}

const offset = (p, u, d) => [p[0] + u[0] * d, p[1] + u[1] * d, p[2] + u[2] * d];

function railPairSvg(a, b, gap = 2.1, opts = {}) {
  const geo = railGeo(a, b);
  return railSvg(railGeo(offset(a, geo.u, gap), offset(b, geo.u, gap)), opts) + railSvg(railGeo(offset(a, geo.u, -gap), offset(b, geo.u, -gap)), opts);
}

function sleepersSvg(a, b, step = 8, gap = 2.1) {
  const geo = railGeo(a, b);
  const out = [];
  for (let t = step; t < geo.len - 3; t += step) {
    const c = G.lerp3(a, b, t / geo.len);
    const e1 = offset(c, geo.u, gap - 0.65);
    const e2 = offset(c, geo.u, -(gap - 0.65));
    out.push(k.segment([e1[0], e1[1], c[2] + 0.92], [e2[0], e2[1], c[2] + 0.92], P));
  }
  return L(out.join(""), { tone: "faint" });
}

// ------------------------------------------------------------ the coin loop -
// Head leg: pool stack -> feed rail -> funnel mouth -> (hidden) stem -> chute
// -> bridge -> deck -> pivot. Lane legs: pivot -> exit -> lane (press on 0)
// -> tray -> gutter -> (hidden) tube -> pool stack again.

const HEAD_PTS = [
  [-131, -51.8, 45.6], [-124.5, -50.5, 45.1], [-121.8, -47.8, 43.6], [-118.3, -42.7, 36.1],
  [-114.6, -38.9, 36.4], [-110, -35.2, 36.4], [-108, -34, 33], [-108, -34, 25.8],
  [-104.6, -32.4, 25.6], CHUTE_A, [-70, -22.2, 22.6], [-40, -13.7, 20.9], [-8, -6.4, 18.6],
  [20, 1.9, 15.9], [28, 4, 14.9], [PIVOT[0], PIVOT[1], 13.9],
];

const LANE_PTS = [
  [
    [39, -4.5, 13.9], [45, -11, 13.85], [48, -14, 13.9], [60, -16.6, 13.6], [67.5, -18.1, 13.4],
    [72, -18.5, 13.0], [78, -18.6, 13.0], [84, -18.6, 13.0], [88, -19.2, 13.3], [96, -21, 10.2],
    [100, -21.5, 7.4], [108, -21.4, 7.4], [121, -20.6, 7.4], [129, -20.2, 6.9], [139, -19.6, 5.5],
    [141, -30, 5.3], [141.8, -50, 5.2], [142, -52, 5.1],
  ],
  [
    [41, 3.4, 13.9], [48, 4, 13.9], [70, 3.4, 12.9], [93, 3, 10.2], [97, 3, 7.4], [104, 3, 7.4],
    [121, 3.8, 7.4], [129, 4.2, 6.9], [139, 4.8, 5.5], [141, -30, 5.3], [141.8, -50, 5.2], [142, -52, 5.1],
  ],
  [
    [41, 9.5, 13.9], [44, 15.5, 13.85], [48, 22, 13.9], [70, 22.9, 11.9], [89, 23.9, 10.4], [93, 24.4, 7.4],
    [100, 24.6, 7.4], [118, 24.4, 7.4], [129, 24.3, 6.9], [139, 24.6, 5.5], [141, -30, 5.3], [141.8, -50, 5.2], [142, -52, 5.1],
  ],
];

const TUBE_COIN_TAIL = TUBE_ROUTE.slice(1).map((p) => [p[0], p[1], p[2] + 0.2]);
const LANE_TAILS = LANE_PTS.map((pts) => [...pts, ...TUBE_COIN_TAIL, [-131, -51.8, 45.9], [-131, -51.8, 45.6]]);

function screenPath(points, radius = 2.5) {
  const dense = G.resample(G.fillet(points, radius, 8, { P, tube: 1.6 }), 1.5);
  const xy = [];
  const cum = [];
  let total = 0;
  let prev = null;
  for (const p of dense) {
    const s = k.iso(p, P);
    if (prev) total += Math.hypot(s[0] - prev[0], s[1] - prev[1]);
    xy.push([+s[0].toFixed(2), +s[1].toFixed(2)]);
    cum.push(+total.toFixed(2));
    prev = s;
  }
  return { xy, cum, total: +total.toFixed(2), pts: dense };
}

const sNear = (path, point) => {
  let best = 0;
  let bd = 1e9;
  path.pts.forEach((p, i) => {
    const d = G.len3(G.sub3(p, point));
    if (d < bd) { bd = d; best = i; }
  });
  return path.cum[best];
};

const HEAD_PATH = screenPath(HEAD_PTS);
const LANE_PATHS = LANE_TAILS.map((pts) => screenPath(pts));

const S_PIVOT = sNear(HEAD_PATH, [PIVOT[0], PIVOT[1], 13.9]);
const S_BRIDGE = sNear(HEAD_PATH, [-40, -13.7, 20.9]);
const S_MOUTH_IN = sNear(HEAD_PATH, [-110, -35.2, 36.4]);
const S_STEM_OUT = sNear(HEAD_PATH, [-104.6, -32.4, 25.6]);
const S_ANVIL = sNear(LANE_PATHS[0], [78, -18.6, 13.0]);
const S_TRAY_HOLD = TRAYS.map((tray, i) => sNear(LANE_PATHS[i], tray.hold));
const S_TUBE_IN = sNear(LANE_PATHS[0], [142, -52, 5.1]);
const S_TUBE_OUT = sNear(LANE_PATHS[0], [-131, -51.8, 45.9]);

// ---------------------------------------------------------------- assemblies

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H + FOOT_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 18)].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  out.push(S(k.slabOf(RULER, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(RULER.x + 4, RULER.x + RULER.w - 4, 4, 5, RULER.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([[RULER.x + 2, RULER.y + 3.5, 0.6], [RULER.x + RULER.w - 2, RULER.y + 3.5, 0.6]].map((p) => at(p)), { size: 0.45 }));
  return out.join("");
}

function gutter() {
  const out = [];
  out.push(S(k.slabOf(GUTTER, GUTTER_TOP - 1, 1, P, 3, 0.4), { tone: "lo" }));
  for (const gy of [-46, -8, 30]) {
    out.push(S(k.cylinder(141, gy, 1.2, 0, GUTTER_TOP - 1, P, 10), { tone: "lo", crease: "none" }));
  }
  out.push(S(k.slabOf({ x: GUTTER.x, y: GUTTER.y, w: 2, d: GUTTER.d, r: 0.6 }, GUTTER_TOP, 2.8, P, 3, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GUTTER.x + GUTTER.w - 2, y: GUTTER.y, w: 2, d: GUTTER.d, r: 0.6 }, GUTTER_TOP, 2.8, P, 3, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GUTTER.x, y: -60.2, w: GUTTER.w, d: 2.2, r: 0.6 }, GUTTER_TOP, 2.8, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GUTTER.x, y: GUTTER.y + GUTTER.d, w: GUTTER.w, d: 3.6, r: 0.8 }, GUTTER_TOP, 3.4, P, 3, 0.4), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([141, GUTTER.y + GUTTER.d + 1.8], GUTTER_TOP + 3.4, P, "x"), "RETURN", { size: 1.7, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function blower() {
  const out = [];
  out.push(S(k.slabOf(BLOWER, 0, 8, P, 4, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BLOWER, 2), 8, P), { tone: "lo" }));
  const vents = k.sideTicks(BLOWER.x + 2.4, BLOWER.x + BLOWER.w - 2.4, 2.4, 4, BLOWER.y + BLOWER.d, 8, [1.1, 2.4], P, "x");
  out.push(L(vents.minor, { tone: "lo" }), L(vents.major, { tone: "lo" }));
  const stub = G.fillet([[141, -64.5, 6], [141, -63, 8.6], [141.5, -57.5, 8.6], [142, -53.4, 7.2]], 1.8, 7, { P, tube: 0.8 });
  out.push(tubePieces(stub, 0.8, P, { maxLength: 20 }).map((piece) => tubeSvg(piece, { tone: "lo" })).join(""));
  out.push(D([at([141, -64.5, 6.6])], { size: 0.7 }));
  return out.join("");
}

function pool() {
  const out = [];
  out.push(S(k.cylinder(-133, -51, 2.6, 0, POOL_FLOOR, P, 18, 0.4), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(-133, -51, 5, 0, 1.6, P, 20), { tone: "lo" }));
  out.push(S(k.slabOf(POOL, POOL_FLOOR, 1.2, P, 4, 0.4), { tone: "mid" }));
  const wall = (plan) => S(k.slabOf(plan, POOL_FLOOR + 1.2, POOL_WALL_H, P, 3, 0.3), { tone: "mid" });
  out.push(wall({ x: POOL.x, y: POOL.y, w: POOL.w, d: 1.6, r: 0.6 }));                       // back
  out.push(wall({ x: POOL.x, y: POOL.y, w: 1.6, d: POOL.d, r: 0.6 }));                       // left
  out.push(wall({ x: POOL.x + POOL.w - 1.6, y: POOL.y, w: 1.6, d: 5.5, r: 0.6 }));            // right, back piece
  out.push(wall({ x: POOL.x + POOL.w - 1.6, y: -47.5, w: 1.6, d: 4.5, r: 0.6 }));             // right, front piece (gap: feed exit)
  for (let i = 0; i < 3; i++) {
    out.push(coinSvg(-131.4 + i * 0.8, -53.6 - i * 0.5, POOL_FLOOR + 1.2 + i * 1.15));
  }
  out.push(k.faceTextSvg(k.topMatrix([-136.5, -47.6], POOL_FLOOR + 1.2, P, "y"), "POOL · 1024", { size: 1.8, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function returnTube() {
  const pts = G.fillet(TUBE_ROUTE, 6, 9, { P, tube: 1.5 });
  const pieces = tubePieces(pts, 1.5, P, { maxLength: 30 });
  const out = [pieces.map((piece) => tubeSvg(piece, { tone: "mid" })).join("")];
  out.push(S(k.cylinder(MOUTH[0], MOUTH[1], 2.9, GUTTER_TOP, 2.8, P, 26, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(MOUTH[0], MOUTH[1], 1.6, GUTTER_TOP + 2.8, 0.5, P, 18), { tone: "lo", crease: "none" }));
  out.push(L(k.ring(MOUTH[0], MOUTH[1], 2.1, GUTTER_TOP + 2.8, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(NOZZLE_END[0], NOZZLE_END[1], 2.4, NOZZLE_END[2] - 0.8, 2.2, P, 22, 0.4), { tone: "mid" }));
  out.push(L(k.ring(NOZZLE_END[0], NOZZLE_END[1], 1.5, NOZZLE_END[2] + 1.4, P, 16), { tone: "lo" }));
  return out.join("");
}

function hopper() {
  const out = [];
  for (const [lx, ly] of k.corners({ x: HOP.x - 9.5, y: HOP.y - 7.5, w: 19, d: 15 }, 0).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(lx, ly, 2.2, 0, 1.4, P, 14), { tone: "lo" }));
    out.push(S(k.cylinder(lx, ly, 1.5, 0, 33.7, P, 12), { tone: "mid", crease: "none" }));
  }
  out.push(L(k.ring(HOP.x, HOP.y, 12.1, 14, P, 44), { tone: "faint" }));
  out.push(S(G.lathe(FUN_PROFILE, FUN, P, { steps: 56 }), { tone: "mid" }));
  out.push(S(G.ringBand(10.2, 11.3, 12.5, 13.3, FUN, P, { steps: 56 }), { tone: "mid" }));
  out.push(S(k.cylinder(HOP.x, HOP.y, 12.4, FUN_TOP + 0.1, 0.5, P, 44), { tone: "lo", crease: "none" }));
  out.push(L(k.ring(HOP.x, HOP.y, 12.4, RIM_TOP, P, 44), { tone: "lo" }));
  out.push(coinSvg(-112.5, -37.5, FUN_TOP + 0.6));
  out.push(coinSvg(-103.8, -31, FUN_TOP + 0.6));
  return out.join("");
}

function feedRail() {
  return railPairSvg(FEED_A, FEED_B, 2.0) + sleepersSvg(FEED_A, FEED_B, 3.4, 2.0);
}

function chuteHead() {
  const out = [];
  out.push(S(k.slabOf(HEAD_BLOCK, 20.4, HEAD_TOP - 20.4, P, 4, 0.5), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(HEAD_BLOCK, 1.6), HEAD_TOP, P), { tone: "lo" }));
  out.push(S(k.slabOf({ x: -102.9, y: -34.6, w: 1.3, d: 4.6, r: 0.5 }, 23.7, 1.5, P, 3), { tone: "lo", crease: "none" }));
  return out.join("");
}

function chute() {
  return railPairSvg(CHUTE_A, CHUTE_B) + sleepersSvg(CHUTE_A, CHUTE_B, 8);
}

function bridge() {
  const out = [];
  const geo = railGeo(CHUTE_A, CHUTE_B);
  const t = (BRIDGE_AT - CHUTE_A[0]) / (CHUTE_B[0] - CHUTE_A[0]);
  const mid = G.lerp3(CHUTE_A, CHUTE_B, t);
  for (const side of [-1, 1]) {
    const p = offset([mid[0], mid[1], 0], geo.u, side * 6);
    out.push(S(k.cylinder(p[0], p[1], 2.6, 0, 1.6, P, 16), { tone: "lo" }));
    out.push(S(k.cylinder(p[0], p[1], 1.8, 0, 31.4, P, 14), { tone: "mid", crease: "none" }));
  }
  out.push(railSvg(railGeo(offset([mid[0], mid[1], 29.9], geo.u, 7.2), offset([mid[0], mid[1], 29.9], geo.u, -7.2)), { w: 1.5, h0: -1.5, h1: 1.5 }));
  const gx = mid[0];
  const gy = mid[1];
  out.push(S(k.cylinder(gx, gy, 1.1, GAUGE.z1, 28.6 - GAUGE.z1, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(gx, gy, 0.6, 21.6, GAUGE.z0 - 21.6, P, 8), { tone: "hi", crease: "none" }));
  out.push(S(k.cylinder(gx, gy, GAUGE.r, GAUGE.z0, GAUGE.z1 - GAUGE.z0, P, 48, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(gx, gy, GAUGE.r, GAUGE.z1 - 0.7, GAUGE.z1, 44, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(gx, gy, GAUGE.r - 0.6, GAUGE.z1, P, 44), { tone: "lo" }));
  const ticks = k.radialTicks(gx, gy, GAUGE.r - 1.3, 20, 4, GAUGE.z1, [0.9, 1.8], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([gx, gy + 3.6], GAUGE.z1, P, "x"), "GLYPH 11", { size: 1.25, tone: "mid", anchor: "middle" }));
  GAUGE.x = gx;
  GAUGE.y = gy;
  return out.join("");
}

function needleMarkup(theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  const tip = [GAUGE.x + 4.6 * s, GAUGE.y - 4.6 * c, GAUGE.z1 + 0.1];
  const tail = [GAUGE.x - 1.1 * s, GAUGE.y + 1.1 * c, GAUGE.z1 + 0.1];
  return L(k.lineOnTop(tail, tip, GAUGE.z1 + 0.1, P), { tone: "hi", free: "end" });
}

function deck() {
  const out = [];
  out.push(S(k.slabOf(DECK, 0, DECK_TOP, P, 6, 1.0), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(DECK, 3), DECK_TOP, P), { tone: "lo" }));
  const screws = k.corners(DECK, 5);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.3, DECK_TOP, P, 12)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, DECK_TOP])), { size: 0.4 }));
  for (const ey of EXITS) {
    out.push(L(k.lineOnTop([DECK.x + DECK.w, ey], [DECK.x + DECK.w - 2.4, ey], DECK_TOP + 0.05, P), { tone: "lo" }));
    out.push(S(k.slabOf({ x: DECK.x + DECK.w - 0.2, y: ey - 2.2, w: 1.1, d: 4.4, r: 0.4 }, 11.8, 1.4, P, 3), { tone: "lo", crease: "none" }));
  }
  out.push(S(k.cylinder(PIVOT[0], PIVOT[1], 1.5, DECK_TOP, 4.2, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(PIVOT[0], PIVOT[1], 1.9, DECK_TOP + 4.0, 2.8, P, 16), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(PIVOT[0], PIVOT[1], 1.9, DECK_TOP + 4.0, DECK_TOP + 6.8, 16, P, 0.25), { tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([DECK.x + 2, DECK.y + DECK.d + 0.1, 2.6], 2.6, P, "left"), "GATE", { size: 1.7, tone: "mid" }));
  return out.join("");
}

function flapSvg(theta) {
  const d = [Math.cos(theta), Math.sin(theta)];
  const p = [-Math.sin(theta), Math.cos(theta)];
  const pts = FLAP_PTS.map(([r, a]) => [PIVOT[0] + d[0] * r + p[0] * a, PIVOT[1] + d[1] * r + p[1] * a]);
  return S(k.extrude(pts, FLAP_Z0, FLAP_Z1 - FLAP_Z0, P, { convex: true }), { tone: "hi", crease: "lo" });
}

const LANES = [
  [[48, -14, 12.4], [69, -18.2, 12.0]],
  [[86, -19, 12.0], TRAYS[0].railEnd],
  [[48, 4, 12.4], TRAYS[1].railEnd],
  [[48, 22, 12.4], TRAYS[2].railEnd],
];

function lanes() {
  const out = [];
  out.push(railPairSvg(...LANES[0]) + sleepersSvg(...LANES[0], 6));
  out.push(railPairSvg(...LANES[1]) + sleepersSvg(...LANES[1], 5));
  out.push(railPairSvg(...LANES[2]) + sleepersSvg(...LANES[2], 7));
  out.push(railPairSvg(...LANES[3]) + sleepersSvg(...LANES[3], 7));
  out.push(S(k.slabOf(ANVIL, 0, ANVIL_TOP, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(ANVIL, 2), ANVIL_TOP, P), { tone: "lo" }));
  return out.join("");
}

function tray(tray) {
  const out = [];
  const x = tray.x;
  const y = tray.y;
  const w = 26;
  const d = 16;
  const wall = (plan) => S(k.slabOf(plan, TRAY_FLOOR + 1.2, TRAY_WALL_H, P, 3, 0.3), { tone: "mid" });
  out.push(S(k.cylinder(x + 3.5, y + 3.2, 1.2, 0, TRAY_FLOOR, P, 10, 0.3), { tone: "lo", crease: "none" }));
  out.push(S(k.cylinder(x + w - 3.5, y + 3.2, 1.2, 0, TRAY_FLOOR, P, 10, 0.3), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf({ x, y, w, d, r: 1.5 }, TRAY_FLOOR, 1.2, P, 4, 0.4), { tone: "mid" }));
  out.push(wall({ x, y, w, d: 1.6, r: 0.6 }));                                       // back
  out.push(wall({ x, y: y + 1.6, w: 1.6, d: tray.entry - 2.6 - (y + 1.6), r: 0.6 }));
  out.push(wall({ x, y: tray.entry + 2.6, w: 1.6, d: y + d - (tray.entry + 2.6), r: 0.6 }));
  out.push(wall({ x: x + w - 1.6, y: y + 1.6, w: 1.6, d: tray.exit - 3 - (y + 1.6), r: 0.6 }));
  out.push(wall({ x: x + w - 1.6, y: tray.exit + 3, w: 1.6, d: y + d - (tray.exit + 3), r: 0.6 }));
  out.push(k.faceTextSvg(k.topMatrix([x + w / 2, y + d / 2], TRAY_FLOOR + 1.2, P, "x"), tray.name, { size: 1.8, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function pressStatics() {
  const out = [];
  for (const py of [-24.6, -12.6]) {
    out.push(S(k.cylinder(78, py, 2.8, 0, 1.6, P, 16), { tone: "lo" }));
    out.push(S(k.cylinder(78, py, 2.0, 0, 23.6, P, 16), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

function plungerSvg() {
  const out = [];
  out.push(S(k.cylinder(78, -18.6, 3.5, 14.7, 1.7, P, 32, 0.5), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(78, -18.6, 1.4, 16.4, 10.4, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(78, -18.6, 2.5, 26.6, 4.2, P, 22, 0.4), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(78, -18.6, 2.5, 26.6, 30.8, 22, P, 0.35), { tone: "lo" }));
  out.push(S(k.cylinder(78, -18.6, 1.0, 30.8, 1.0, P, 12), { tone: "mid" }));
  return out.join("");
}

function pressTop() {
  const out = [];
  out.push(railSvg(railGeo([78, -26.5, 25.0], [78, -10.7, 25.0]), { w: 1.8, h0: -1.6, h1: 1.6 }));
  out.push(S(k.cylinder(78, -18.6, 3.0, 26.6, 2.2, P, 22, 0.4), { tone: "mid" }));
  return out.join("");
}

// ---------------------------------------------------------------------- svg --
// painter's order: base, gutter and blower, pool, return tube (over the pool
// tray, behind the funnel), hopper and feed rail, chute, bridge (gauge + live
// needle), deck (+ live flap), lanes and anvil, trays, press (live plunger
// under the yoke), coin last.

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A coin-sorting machine drawn as GenHTTP's allocation-free request path: a hopper of inbound connections feeds coins down a rail; a reading bridge with a dial gauge (the Glyph11 parser) weighs each coin; a routing gate on a deck selects one of three outcome lanes, labelled handler, 404 and error; the handler lane crosses a stamping press (response serialization) over an anvil; three trays catch the coins and a return gutter and pneumatic tube carry them back to the pool tray beside the hopper, where the stacked spare coins wait. The same coin circulates forever: nothing is minted.",
  body: [
    base(),
    gutter(),
    blower(),
    pool(),
    returnTube(),
    hopper(),
    feedRail(),
    chuteHead(),
    chute(),
    bridge(),
    `<g data-part="needle">${needleMarkup(NEEDLE_REST)}</g>`,
    L(k.ring(GAUGE.x, GAUGE.y, 1.5, GAUGE.z1 + 0.1, P, 14), { tone: "lo" }),
    D([at([GAUGE.x, GAUGE.y, GAUGE.z1 + 0.1])], { size: 0.6, tone: "mid" }),
    deck(),
    `<g data-part="flap">${flapSvg(FLAP_ANGLES[0])}</g>`,
    lanes(),
    TRAYS.map((t) => tray(t)).join(""),
    pressStatics(),
    `<g data-part="plunger">${plungerSvg()}</g>`,
    pressTop(),
    `<g data-part="coin">${coinSvg(0, 0, 0, true)}</g>`,
  ],
});

// --------------------------------------------------------------------- live --

function sampleFn(path, s) {
  const xy = path.xy;
  const cum = path.cum;
  const n = xy.length;
  if (s <= 0) return xy[0];
  if (s >= path.total) return xy[n - 1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo] || 1;
  const t = (s - cum[lo]) / span;
  return [xy[lo][0] + (xy[hi][0] - xy[lo][0]) * t, xy[lo][1] + (xy[hi][1] - xy[lo][1]) * t];
}

function needleFn(theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  const tip = [NEEDLE.x + NEEDLE.r2 * s, NEEDLE.y - NEEDLE.r2 * c, NEEDLE.z];
  const tail = [NEEDLE.x - NEEDLE.r1 * s, NEEDLE.y + NEEDLE.r1 * c, NEEDLE.z];
  return lineSvg(lineOnTop(tail, tip, NEEDLE.z, P), { tone: "hi", free: "end" });
}

function flapFn(theta) {
  const d = [Math.cos(theta), Math.sin(theta)];
  const p = [-Math.sin(theta), Math.cos(theta)];
  const pts = FLAP.pts.map(([r, a]) => [FLAP.x + d[0] * r + p[0] * a, FLAP.y + d[1] * r + p[1] * a]);
  return solidSvg(extrude(pts, FLAP.z0, FLAP.z1 - FLAP.z0, P, { convex: true }), { tone: "hi", crease: "lo" });
}

const live = `
const P = ${JSON.stringify(P)};
const NAMES = ["handler", "404", "error"];
const ANGLES = ${JSON.stringify(FLAP_ANGLES.map((a) => +a.toFixed(4)))};
const HEAD = ${JSON.stringify({ xy: HEAD_PATH.xy, cum: HEAD_PATH.cum, total: HEAD_PATH.total })};
const LANES = ${JSON.stringify(LANE_PATHS.map((p) => ({ xy: p.xy, cum: p.cum, total: p.total })))};
const S_PIVOT = ${S_PIVOT.toFixed(1)};
const S_BRIDGE = ${S_BRIDGE.toFixed(1)};
const S_ANVIL = ${S_ANVIL.toFixed(1)};
const S_TUBE_IN = ${S_TUBE_IN.toFixed(1)};
const S_TUBE_OUT = ${S_TUBE_OUT.toFixed(1)};
const HOLDS_HEAD = [[${sNear(HEAD_PATH, [-110, -35.2, 36.4]).toFixed(1)}, 420]];
const HOLDS_LANE = [
  [[${S_ANVIL.toFixed(1)}, 620], [${S_TRAY_HOLD[0].toFixed(1)}, 340]],
  [[${S_TRAY_HOLD[1].toFixed(1)}, 340]],
  [[${S_TRAY_HOLD[2].toFixed(1)}, 340]],
];
const HIDE_HEAD = [[${S_MOUTH_IN.toFixed(1)}, ${S_STEM_OUT.toFixed(1)}]];
const HIDE_LANE = [[${S_TUBE_IN.toFixed(1)}, ${S_TUBE_OUT.toFixed(1)}]];
const NEEDLE = { x: ${GAUGE.x.toFixed(2)}, y: ${GAUGE.y.toFixed(2)}, z: ${(GAUGE.z1 + 0.1).toFixed(2)}, r1: 1.1, r2: 4.6 };
const FLAP = ${JSON.stringify({ pts: FLAP_PTS, x: PIVOT[0], y: PIVOT[1], z0: FLAP_Z0, z1: FLAP_Z1 })};
const COIN_BASE = ${JSON.stringify(k.iso([0, 0, 0], P))};
const sample = ${sampleFn.toString()};
const needleSvg = ${needleFn.toString()};
const flapSvg = ${flapFn.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const coin = svg.querySelector('[data-part="coin"]');
const flap = svg.querySelector('[data-part="flap"]');
const needle = svg.querySelector('[data-part="needle"]');
const plunger = svg.querySelector('[data-part="plunger"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let gate = 0, gateAuto = true, angle = ANGLES[0], theta = -0.7, pl = 0, pulse = 0;
let thetaN = "", thetaF = "", plS = "";
let phase = 0, lane = 0, locked = 0, s = 0, v = 0, holdUntil = 0;
let holds = HOLDS_HEAD.map((h) => [h[0], h[1], false]);
let exchanges = 0, last = 0, frame = 0, visible = false, touring = !still.matches, idle = 0;
const pathNow = () => (phase === 0 ? HEAD : LANES[lane]);
const hiddenNow = (x) => (phase === 0 ? HIDE_HEAD : HIDE_LANE).some((a) => x >= a[0] && x <= a[1]);
function draw() {
  const pos = sample(pathNow(), s);
  coin.setAttribute("transform", "translate(" + (pos[0] - COIN_BASE[0]).toFixed(2) + " " + (pos[1] - COIN_BASE[1]).toFixed(2) + ")");
  coin.style.display = hiddenNow(s) ? "none" : "";
  if (thetaN !== theta.toFixed(3)) { thetaN = theta.toFixed(3); needle.innerHTML = needleSvg(theta); }
  if (thetaF !== angle.toFixed(3)) { thetaF = angle.toFixed(3); flap.innerHTML = flapSvg(angle); }
  if (plS !== pl.toFixed(2)) { plS = pl.toFixed(2); plunger.setAttribute("transform", translateAlong(P, [0, 0, -pl])); }
  const text = NAMES[lane] + " · exchange " + exchanges + " · minted 0";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(gate + 1));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (gateAuto) { idle += dt; if (idle > 3.6) { idle = 0; gate = (gate + 1) % 3; } }
  angle += (ANGLES[gate] - angle) * (1 - Math.exp(-dt * 8));
  pulse = phase === 0 ? Math.max(0, 1 - Math.abs(s - S_BRIDGE) / 42) : 0;
  theta += (-0.7 + 2.3 * pulse - theta) * (1 - Math.exp(-dt * 7));
  pl += ((phase === 1 && lane === 0 && Math.abs(s - S_ANVIL) < 26 ? 1 : 0) - pl) * (1 - Math.exp(-dt * 11));
  if (touring) {
    let vt = 46;
    if (now < holdUntil) vt = 0;
    for (const hold of holds) if (!hold[2] && hold[0] - s < 26 && hold[0] - s > -2) vt = Math.min(vt, 12);
    v += (vt - v) * (1 - Math.exp(-dt * 7));
    const prev = s;
    s += v * dt;
    for (const hold of holds) if (!hold[2] && prev < hold[0] && s >= hold[0]) { holdUntil = now + hold[1]; hold[2] = true; }
    if (phase === 0 && s > S_PIVOT - 10) locked = gate;
    if (s >= pathNow().total) {
      if (phase === 1) {
        phase = 0;
        holds = HOLDS_HEAD.map((h) => [h[0], h[1], false]);
        holdUntil = now + 480;
      } else {
        phase = 1;
        lane = locked;
        holds = HOLDS_LANE[lane].map((h) => [h[0], h[1], false]);
        exchanges += 1;
      }
      s = 0;
      v = 0;
    }
  }
  draw();
  const settled = !touring && Math.abs(angle - ANGLES[gate]) < 0.002 && pl < 0.01 && Math.abs(theta + 0.7) < 0.01;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  gateAuto = false;
  clearTimeout(holdUntil2);
  holdUntil2 = setTimeout(() => { if (!still.matches) gateAuto = true; }, 4200);
  idle = 0;
  gate = Math.max(0, Math.min(2, next));
  run();
};
let holdUntil2 = 0;
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.max(0, Math.min(0.999, (event.clientX - box.left) / box.width));
  steer(Math.floor(share * 3));
});
stage.addEventListener("pointerleave", () => steer(gate));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = gate + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = gate - 1;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = 2;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
draw();
`;

// --------------------------------------------------------------------- card --

const body = k.plateHtml({
  fig: "Fig 2",
  title: "The zero-alloc exchange",
  hint: "Steer the gate: three ways a coin lands",
  readout: "handler · exchange 0 · minted 0",
  keys: [
    { mark: "lit", label: "The coin — one pooled Request, reused every exchange" },
    { mark: "raised", label: "Reading bridge: Glyph11 parses headers into zero-copy views" },
    { mark: "dim", label: "Press, trays and return tube: response into the sink, then re-pooled" },
  ],
  caption:
    "Every exchange runs one coin round the machine. The reading bridge is Glyph11: headers become zero-copy ByteString views over the request buffer — no strings minted. The gate stands for the handler tree — a null answer drops the coin in the 404 tray, a thrown one is mapped — and the press is serialization: status line and headers as raw UTF-8, the body driven into a RegularSink or ChunkedSink. The return chute empties back into the pool: Requests live in a per-thread stack, up to 1024 deep, so minted stays at zero.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Coin sorter: arrow keys steer the routing gate between handler, 404 and error" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "GenHTTP — the zero-alloc exchange", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
