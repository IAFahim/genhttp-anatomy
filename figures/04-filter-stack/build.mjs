import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 640;
const HEIGHT = 430;

// ---------------------------------------------------------------- world
const PLATE = { x: -152, y: -32, w: 304, d: 64, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const RAIL = { x: -140, y: -14, w: 280, d: 28, r: 2 };
const RAIL_H = 4.5;

const BZ = 35.5; // beam axis height, beam runs along x at y = 0
const LAMP_X = -107; // lamp nose face
const F_X = [-48, -16, 16, 48]; // filter slots 1..4
const METER_X = 101.2; // meter window face
const SPREAD = (4.1 - 1.7) / (F_X[0] - LAMP_X); // beam divergence per unit of travel
const FW = [null, 2.5, 1.5, null]; // half-width each filter passes when seated
const RET_Z = BZ - 4.2; // the 304 returns just under the incoming cone
const DROP = 12.5; // filter ring travel: seated (35.5) -> parked (48)
const SHUT_UP = 8.4; // auth dark-slide travel (the slide also drops home as the ring parks)

const RING_IN = 4.3;
const RING_OUT = 5.8;
const RING_LEN = 1.4; // half thickness of each ring along x
const GLASS_R = 4.2;

const DIAL = { x: 112.5, y: 0, z: 47.4, r: 9.5 };
const NEEDLE_FROM = (-135 * Math.PI) / 180;
const NEEDLE_SPAN = (270 * Math.PI) / 180;

const FX = (cx) => G.frameAlong([cx, 0, BZ], [1, 0, 0]);
const FX_LAMP = G.frameAlong([-114, 0, BZ], [1, 0, 0]);
const FX_METER = G.frameAlong([103, 0, BZ], [-1, 0, 0]);

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(RAIL, 0, RAIL_H),
    ...k.boxCorners({ x: -133, y: -6.5, w: 19, d: 13 }, 29.5, 42.5),
    [-111.5, 0, 43.4],
    ...F_X.flatMap((cx) => [
      [cx, -13.8, 61.6],
      [cx, -8.2, 61.6],
      [cx, 0, 80],
    ]),
    [48, -11, 66.5],
    [DIAL.x - DIAL.r, DIAL.y - DIAL.r, DIAL.z],
    [DIAL.x + DIAL.r, DIAL.y + DIAL.r, DIAL.z],
    [101.2, -4.4, 31.1],
    [122, 9.5, 44],
  ],
  WIDTH,
  HEIGHT,
  { pad: 28, azimuth: 42 },
);

const { iso, lineOnTop, translateAlong } = k; // used by the serialized live helpers too

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

// ---------------------------------------------------------------- base and rail
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H + FOOT_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 16)].sort((a, b) => k.depthOf([a[0], a[1], -PLATE_H], P) - k.depthOf([b[0], b[1], -PLATE_H], P));
  for (const [x, y] of feet) out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  const label = { x: -146, y: 20, w: 36, d: 9, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.9, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.9, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([-128, 24.5], 0.9, P, "x"), "GENHTTP · CONCERNS", { size: 2.1, tone: "mid", anchor: "middle" }));
  return out.join("");
}

function rail() {
  const out = [];
  out.push(S(k.slabOf(RAIL, 0, RAIL_H, P, 6, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(RAIL, 4), RAIL_H, P), { tone: "faint" }));
  const ticks = k.topTicks(RAIL.x + 8, RAIL.x + RAIL.w - 8, 4, 10, RAIL.y + 0.4, RAIL_H, [1.1, 2.2], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));
  for (const stop of [{ x: -139, y: -12 }, { x: 134, y: -12 }]) {
    out.push(S(k.slabOf({ x: stop.x, y: stop.y, w: 5, d: 24, r: 1.2 }, RAIL_H, 3, P, 3, 0.5), { tone: "lo" }));
    out.push(D([at([stop.x + 2.5, stop.y + 12, RAIL_H + 3])], { size: 0.45 }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- lamp (the request)
function lamp() {
  const out = [];
  out.push(S(k.slabOf({ x: -131, y: -4.5, w: 14, d: 9, r: 1.5 }, RAIL_H, 3.5, P, 4, 0.5), { tone: "lo" }));
  out.push(D([at([-128.5, -1, RAIL_H + 3.5]), at([-119.5, -1, RAIL_H + 3.5])], { size: 0.45 }));
  out.push(S(k.cylinder(-124, 0, 2.7, RAIL_H + 3.5, 21.5, P, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(-124, 0, 2.7, 18, P, 16), { tone: "faint" }));
  out.push(S(k.cylinder(-124, 0, 3.6, 27.5, 2, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf({ x: -133, y: -6.5, w: 19, d: 13, r: 2.5 }, 29.5, 13, P, 6, 0.7), { tone: "mid", inner: L(k.sideSeam({ x: -133, y: -6.5, w: 19, d: 13, r: 2.5 }, 41.6, P, 6), { tone: "faint" }) }));
  for (let i = 0; i < 4; i++) {
    out.push(L(k.planOutline({ x: -130.5 + i * 3.5, y: -3.2, w: 2.2, d: 6.4, r: 0.8 }, 42.5, P, 3), { tone: "lo" }));
  }
  out.push(S(G.disc(0, 7, 4.2, FX_LAMP, P), { tone: "mid", crease: "lo", inner: L(G.arcOf(FX_LAMP, 4.5, 4.2, P, {}), { tone: "faint" }) }));
  out.push(L(G.circleOf(FX_LAMP, 7, 4.2, P, 40), { tone: "faint" }));
  out.push(L(G.circleOf(FX_LAMP, 7, 1.7, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(-111.5, 0, 2.0, BZ + 4.7, 3.2, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(-111.5, 0, 2.0, BZ + 4.9, BZ + 7.7, 18, P), { tone: "lo" }));
  out.push(L(k.ring(-111.5, 0, 1.1, BZ + 7.9, P, 12), { tone: "faint" }));
  return out.join("");
}

// ---------------------------------------------------------------- meter cell
function meter() {
  const out = [];
  const body = { x: 103, y: -7, w: 17, d: 14, r: 2 };
  out.push(S(k.slabOf({ x: 104, y: -6, w: 18, d: 12, r: 1.5 }, RAIL_H, 3.5, P, 4, 0.5), { tone: "lo" }));
  out.push(D([at([107, -1, RAIL_H + 3.5]), at([119, -1, RAIL_H + 3.5])], { size: 0.45 }));
  out.push(S(k.slabOf(body, 8, 36, P, 6, 0.7), { tone: "mid", inner: L(k.sideSeam(body, 42, P, 6), { tone: "faint" }) }));
  out.push(S(G.disc(0, 1.8, 4.4, FX_METER, P), { tone: "lo", crease: "none" }));
  out.push(L(G.circleOf(FX_METER, 1.8, 3.2, P, 36), { tone: "lo" }));
  out.push(L(G.circleOf(FX_METER, 1.8, 2.4, P, 28), { tone: "faint" }));
  out.push(S(k.slabOf({ x: 120, y: -2.5, w: 2.6, d: 5, r: 0.8 }, 40, 4, P, 3), { tone: "lo" }));
  out.push(S(k.cylinder(DIAL.x, DIAL.y, DIAL.r, 44, 3.4, P, 56, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(DIAL.x, DIAL.y, DIAL.r, DIAL.z - 2.9, DIAL.z, 64, P, 0.35), { tone: "lo" }));
  out.push(L(k.sideArc(DIAL.x, DIAL.y, DIAL.r, DIAL.z - 2.9, P, 40), { tone: "faint" }));
  out.push(L(k.ring(DIAL.x, DIAL.y, 7.8, DIAL.z, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(DIAL.x, DIAL.y, 7.8, 24, 6, DIAL.z, [1.2, 2.6], P, NEEDLE_FROM, NEEDLE_SPAN);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(DIAL.x, DIAL.y, 2.0, DIAL.z, P, 20), { tone: "lo" }));
  out.push(D([at([DIAL.x, DIAL.y, DIAL.z])], { size: 0.8, tone: "hi" }));
  return out.join("");
}

// ---------------------------------------------------------------- filter rack
function stationFrame(cx, index, last) {
  const out = [];
  const post = { x: cx - 2.8, y: -13.8, w: 5.6, d: 5.6, r: 1.2 };
  out.push(S(k.slabOf(post, RAIL_H, 57.1, P, 4, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(cx, -11, 3.8, RAIL_H, 2, P, 24), { tone: "lo" }));
  out.push(L(k.ring(cx, -11, 2.6, RAIL_H + 2, P, 16), { tone: "faint" }));
  out.push(S(k.slabOf({ x: cx - 3.4, y: -8.2, w: 6.8, d: 1.1, r: 0.4 }, 44, 8, P, 3), { tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([cx, -7, 46.4], 46.4, P, "left"), String(index + 1), { size: 4.4, tone: "mid", anchor: "middle" }));
  out.push(D([at([cx, -7, 45]), at([cx, -7, 51])], { size: 0.4 }));
  out.push(S(k.slabOf({ x: cx - 1.7, y: -8.4, w: 3.4, d: 5.1, r: 0.8 }, 59.2, 2.4, P, 4, 0.4), { tone: "mid" }));
  if (last) {
    out.push(S(k.cylinder(cx, -11, 1.6, 61.6, 2.4, P, 14), { tone: "mid" }));
    out.push(`<g data-part="ret-off">${S(k.cylinder(cx, -11, 1.05, 64, 1.5, P, 12), { tone: "lo" })}</g>`);
    out.push(`<g data-part="ret-on" style="display:none">${S(k.cylinder(cx, -11, 1.05, 64, 1.5, P, 12), { tone: "hi", lit: true })}</g>`);
  }
  return out.join("");
}

function bushing(cx) {
  const out = [];
  out.push(S(k.slabOf({ x: cx - 2.6, y: -3.6, w: 5.2, d: 4.6, r: 0.8 }, 58.2, 4.4, P, 4, 0.4), { tone: "lo" }));
  out.push(L(k.ring(cx, -1.3, 1.3, 62.6, P, 14), { tone: "faint" }));
  return out.join("");
}

// the moving assembly: ring + glass + stem + knob, built in the SEATED pose
function filterGroup(cx, index) {
  const F = FX(cx);
  const out = [];
  if (index === 0) {
    // auth: a dark slide behind the glass — shut = seated over the aperture
    const plate = [
      [-4.1, -2.6], [-2.6, -4.1], [2.6, -4.1], [4.1, -2.6],
      [4.1, 2.6], [2.6, 4.1], [-2.6, 4.1], [-4.1, 2.6],
    ];
    const tab = [[-2.0, 4.1], [-1.2, 4.9], [1.2, 4.9], [2.0, 4.1]];
    out.push(
      `<g data-part="shut" transform="${k.translateAlong(P, [0, 0, SHUT_UP])}">` +
        S(G.prismOf(F, plate, -2.4, -1.4, P), { tone: "lo", crease: "none" }) +
        S(G.prismOf(F, tab, -2.35, -1.45, P), { tone: "lo", crease: "none" }) +
        `</g>`,
    );
  }
  out.push(`<path class="${index === 3 ? "mirror" : "glass"}" d="${G.circleOf(F, 0, GLASS_R, P, 44)}"/>`);
  if (index === 1) {
    // cors: a slit that only passes near-axis angles
    const bars = [
      [[-3.37, 2.5], [-1.11, 4.05], [1.11, 4.05], [3.37, 2.5]],
      [[-3.37, -2.5], [-1.11, -4.05], [1.11, -4.05], [3.37, -2.5]],
    ];
    for (const bar of bars) out.push(S(G.prismOf(F, bar, -0.15, 0.15, P), { tone: "lo", crease: "none" }));
  }
  if (index === 2) {
    // compress: a condenser lens
    const lens = [];
    const N = 9;
    for (let j = 0; j <= N; j++) {
      const t = -4.0 + (8.0 * j) / N;
      lens.push([t, 1.5 * Math.cos((t / 4.0) * (Math.PI / 2))]);
    }
    for (let j = N - 1; j > 0; j--) {
      const t = -4.0 + (8.0 * j) / N;
      lens.push([t, -1.5 * Math.cos((t / 4.0) * (Math.PI / 2))]);
    }
    const d = "M" + lens.map(([t, dz]) => at([cx, t, BZ + dz]).map((v) => Math.round(v * 10) / 10).join(" ")).join("L") + "Z";
    out.push(`<path class="lens" d="${d}"/>`);
  }
  if (index === 3) {
    // cache: half-silvered mirror, marked across the face
    out.push(L(G.circleOf(F, 0, 3.5, P, 36), { tone: "lo" }));
    out.push(L(G.circleOf(F, 0, 2.3, P, 28), { tone: "faint" }));
    const c = 3.5 * Math.SQRT1_2;
    out.push(L(k.segment([cx, -c, BZ - c], [cx, c, BZ + c], P), { tone: "faint" }));
    out.push(L(k.segment([cx, -c, BZ + c], [cx, c, BZ - c], P), { tone: "faint" }));
    out.push(D([at([cx, 0, BZ])], { size: 0.8, tone: "hi" }));
  }
  out.push(S(G.ringBand(-RING_LEN, RING_LEN, RING_IN, RING_OUT, F, P), { tone: "hi", crease: "lo" }));
  out.push(k.fadedSvg(G.ribsOf(F, -RING_LEN, RING_LEN, RING_OUT + 0.05, 18, P, { fade: [0.08, 0.5], seams: true }), { tone: "lo" }));
  out.push(S(k.cylinder(cx, 0, 0.9, BZ + RING_OUT, 64 - BZ - RING_OUT, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(cx, 0, 1.4, BZ + RING_OUT, 1.6, P, 14), { tone: "lo" }));
  out.push(S(k.cylinder(cx, 0, 2.1, 64, 2.8, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(cx, 0, 2.1, 64.15, 66.65, 16, P), { tone: "lo" }));
  out.push(L(k.ring(cx, 0, 1.15, 66.8, P, 12), { tone: "faint" }));
  out.push(D([at([cx, 0, 66.8])], { size: 0.5 }));
  return `<g data-part="f${index}"${index === 3 ? ` transform="${k.translateAlong(P, [0, 0, DROP])}"` : ""}>${out.join("")}</g>`;
}

// ---------------------------------------------------------------- beam
function beamMarkup(fp, sp) {
  // fp: seated progress of each filter (0..1); sp: auth shutter open progress
  const b0 = fp[0] * (1 - sp); // auth closed: everything downstream stops
  const b3 = fp[3]; // cache: the mirror sends the light home
  const verts = [[LAMP_X, 1.7, 1]];
  const push = (x, w, f) => {
    const lastV = verts[verts.length - 1];
    if (Math.abs(lastV[0] - x) < 0.01 && Math.abs(lastV[1] - w) < 0.02) {
      lastV[2] = Math.min(lastV[2], f);
      return;
    }
    verts.push([x, w, f]);
  };
  let xPrev = LAMP_X;
  let wPrev = 1.7;
  for (let i = 0; i < 4; i++) {
    const arrive = Math.min(wPrev + (F_X[i] - xPrev) * SPREAD, 5.75);
    let out = FW[i] === null ? arrive : arrive + (FW[i] - arrive) * fp[i];
    let f = 1;
    if (i === 0) {
      out *= 1 - b0;
      f = 1 - b0;
    }
    if (i === 3) {
      out *= 1 - b3;
      f = Math.min(f, 1 - b3);
    }
    push(F_X[i], arrive, f);
    push(F_X[i], out, f);
    xPrev = F_X[i];
    wPrev = out;
  }
  push(METER_X, Math.min(wPrev + (METER_X - xPrev) * SPREAD, 3.2), (1 - b0) * (1 - b3));
  const r = (p) => Math.round(p * 10) / 10;
  const pt = (x, dz) => {
    const s = iso([x, 0, BZ + dz], P);
    return `${r(s[0])} ${r(s[1])}`;
  };
  let out = "";
  for (let j = 0; j < verts.length - 1; j++) {
    const a = verts[j];
    const b = verts[j + 1];
    const op = Math.min(a[2], b[2]);
    if (op < 0.02) continue;
    const fill = `M${pt(a[0], a[1])}L${pt(b[0], b[1])}L${pt(b[0], -b[1])}L${pt(a[0], -a[1])}Z`;
    const up = `M${pt(a[0], a[1])}L${pt(b[0], b[1])}`;
    const dn = `M${pt(a[0], -a[1])}L${pt(b[0], -b[1])}`;
    out += `<g opacity="${r(op)}"><path class="beam-fill" d="${fill}"/><path class="iso-line beam-edge" data-tone="hi" d="${up}"/><path class="iso-line beam-edge" data-tone="hi" d="${dn}"/></g>`;
  }
  const ret = (1 - b0) * b3;
  if (ret > 0.02) {
    const fill = `M${pt(F_X[3], RET_Z - BZ + 0.7)}L${pt(LAMP_X, RET_Z - BZ + 0.7)}L${pt(LAMP_X, RET_Z - BZ - 0.7)}L${pt(F_X[3], RET_Z - BZ - 0.7)}Z`;
    const line = `M${pt(F_X[3], RET_Z - BZ)}L${pt(LAMP_X, RET_Z - BZ)}`;
    out += `<g opacity="${r(Math.min(1, ret * 1.4))}"><path class="ret-fill" d="${fill}"/><path class="iso-line ret-edge" data-tone="hi" data-flow="" d="${line}"/></g>`;
  }
  return out;
}

function needleMarkup(v) {
  const a = NEEDLE_FROM + NEEDLE_SPAN * Math.max(0, Math.min(1, v));
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const d = lineOnTop([DIAL.x - dx * 1.7, DIAL.y - dy * 1.7], [DIAL.x + dx * 6.9, DIAL.y + dy * 6.9], DIAL.z + 0.15, P);
  return `<path class="iso-line needle" data-tone="lit" data-free="end" d="${d}"/>`;
}

// ---------------------------------------------------------------- assemble
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An optical bench drawn as GenHTTP's concern chain: a lamp shines along a ruled rail through four drop-in filter rings — auth with a shutter, a CORS slit, a compressor lens, a cache mirror — into a meter cell whose needle reads the light that gets through; a return lamp on the cache mirror marks a 304. Keys 1 to 4 seat or lift each filter.",
  body: [
    `<style>
.beam-fill{fill:var(--anatomy-hi);fill-opacity:.055;stroke:none}
.beam-edge{stroke:var(--anatomy-hi);opacity:.5}
.ret-fill{fill:var(--anatomy-hi);fill-opacity:.045;stroke:none}
.ret-edge{stroke:var(--anatomy-hi);opacity:.45}
.glass{fill:var(--anatomy-hi);fill-opacity:.07;stroke:var(--anatomy-lo);stroke-width:.5}
.mirror{fill:var(--anatomy-hi);fill-opacity:.12;stroke:var(--anatomy-lo);stroke-width:.5}
.lens{fill:var(--anatomy-hi);fill-opacity:.17;stroke:var(--anatomy-lo);stroke-width:.5}
.needle{stroke-width:1.1}
</style>`,
    base(),
    rail(),
    lamp(),
    meter(),
    F_X.map((cx, i) => stationFrame(cx, i, i === 3)).join(""),
    `<g data-part="beam">${beamMarkup([1, 1, 1, 0], 1)}</g>`,
    `<g data-part="needle">${needleMarkup(0.27)}</g>`,
    F_X.map((cx, i) => filterGroup(cx, i) + bushing(cx)).join(""),
  ],
});

// ---------------------------------------------------------------- live
const live = `
const P = ${JSON.stringify(P)};
const VW = ${WIDTH};
const LAMP_X = ${LAMP_X}, METER_X = ${METER_X}, BZ = ${BZ};
const F_X = ${JSON.stringify(F_X)}, FW = ${JSON.stringify(FW)};
const SPREAD = ${SPREAD}, RET_Z = ${RET_Z}, DROP = ${DROP}, SHUT_UP = ${SHUT_UP};
const NEEDLE_FROM = ${NEEDLE_FROM}, NEEDLE_SPAN = ${NEEDLE_SPAN};
const DIAL = ${JSON.stringify(DIAL)};
const beamMarkup = ${beamMarkup.toString()};
const needleMarkup = ${needleMarkup.toString()};
const TOUR = [
  [0, { m: [1, 1, 1, 0], a: 1 }],
  [3, { m: [1, 1, 1, 1], a: 1 }],
  [6, { m: [1, 1, 1, 0], a: 1 }],
  [7.6, { m: [1, 1, 1, 0], a: 0 }],
  [9.8, { m: [1, 1, 1, 0], a: 1 }],
  [11.4, { m: [1, 0, 0, 0], a: 1 }],
  [13.4, { m: [1, 1, 1, 0], a: 1 }],
];
const PERIOD = 15.4;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const beam = svg.querySelector('[data-part="beam"]');
const needle = svg.querySelector('[data-part="needle"]');
const shutEl = svg.querySelector('[data-part="shut"]');
const fGroups = [0, 1, 2, 3].map((i) => svg.querySelector('[data-part="f' + i + '"]'));
const retOff = svg.querySelector('[data-part="ret-off"]');
const retOn = svg.querySelector('[data-part="ret-on"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let mode = [1, 1, 1, 0];
let authOpen = 1;
let fp = mode.slice();
let sp = 1;
let nv = 0.27;
let touring = !still.matches;
let clock = 0, tourAt = -1, last = 0, frame = 0, visible = false, idleTimer = 0, said = "";
function value() {
  if (mode[0] === 1 && authOpen === 0) return 0;
  let v = 1;
  if (mode[1]) v *= 0.9;
  if (mode[2]) v *= 0.3;
  if (mode[3]) v = 0.03;
  return v;
}
function readoutText() {
  if (mode[0] === 1 && authOpen === 0) return "auth closed · blocked";
  const names = [];
  for (let i = 0; i < 4; i++) if (mode[i]) names.push(i + 1);
  const chain = names.length ? names.join("-") + " in" : "none in";
  const v = value();
  return mode[3] ? chain + " · 304 · meter 0.03" : chain + " · meter " + v.toFixed(2);
}
function draw() {
  for (let i = 0; i < 4; i++) fGroups[i].setAttribute("transform", translateAlong(P, [0, 0, DROP * (1 - fp[i])]));
  shutEl.setAttribute("transform", translateAlong(P, [0, 0, SHUT_UP * sp]));
  const bm = beamMarkup(fp, sp);
  if (beam.innerHTML !== bm) beam.innerHTML = bm;
  const nd = needleMarkup(nv);
  if (needle.innerHTML !== nd) needle.innerHTML = nd;
  const litRet = mode[3] === 1 && !(mode[0] === 1 && authOpen === 0);
  retOff.style.display = litRet ? "none" : "";
  retOn.style.display = litRet ? "" : "none";
  const text = readoutText();
  if (text !== said) { said = text; readout.textContent = text; }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    const t = clock % PERIOD;
    let idx = 0;
    for (let j = 0; j < TOUR.length; j++) if (TOUR[j][0] <= t) idx = j;
    if (idx !== tourAt) { tourAt = idx; mode = TOUR[idx][1].m.slice(); authOpen = TOUR[idx][1].a; }
  }
  const snap = still.matches;
  const ease = Math.min(1, dt * 6.5);
  for (let i = 0; i < 4; i++) fp[i] = snap ? mode[i] : fp[i] + (mode[i] - fp[i]) * ease;
  sp = snap ? authOpen : sp + (authOpen - sp) * ease;
  const v = value();
  nv = snap ? v : nv + (v - nv) * Math.min(1, dt * 5);
  draw();
  let settled = !touring;
  if (settled) {
    for (let i = 0; i < 4; i++) if (Math.abs(fp[i] - mode[i]) > 0.001) settled = false;
    if (Math.abs(sp - authOpen) > 0.001) settled = false;
    if (Math.abs(nv - v) > 0.001) settled = false;
  }
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = () => {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; clock = 0; tourAt = -1; run(); } }, 4200);
  run();
};
function toggle(i) {
  if (i === 0) {
    if (!mode[0]) { mode[0] = 1; authOpen = 1; }
    else if (authOpen) authOpen = 0;
    else { mode[0] = 0; authOpen = 1; }
  } else mode[i] = mode[i] ? 0 : 1;
  steer();
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointerdown", (event) => {
  const box = svg.getBoundingClientRect();
  const vx = ((event.clientX - box.left) / box.width) * VW;
  let best = -1, bd = 36;
  for (let i = 0; i < 4; i++) {
    const d = Math.abs(vx - iso([F_X[i], 0, BZ], P)[0]);
    if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0) toggle(best);
});
stage.addEventListener("keydown", (event) => {
  const i = "1234".indexOf(event.key);
  if (i < 0) return;
  event.preventDefault();
  toggle(i);
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 4",
  title: "The concern chain",
  hint: "press 1–4 or click a slot",
  readout: "1-2-3 in · meter 0.27",
  keys: [
    { mark: "raised", label: "Filter rings — the concerns: first added is outermost, met first" },
    { mark: "lit", label: "Needle — the light that reaches the meter (the response)" },
    { mark: "dashed", label: "Dashed return — the cache's 304: same light back, nothing re-sent" },
  ],
  caption:
    "A concern is a handler that owns its inner handler, and Concerns.Chain folds the builders around the tree: the first concern added becomes the outermost ring, so the order in source is the order a request meets. Here auth sits before CORS, compression and caching — close its shutter and nothing downstream sees light at all. The host builds its root the same way (compliance, errors, your concerns, logging), .Add(...) scopes a chain to one subtree, and host.Defaults(...) wires the common rings in one call — each one individually removable.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="The concern chain as an optical bench: keys 1 to 4 seat or lift each filter ring">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "The concern chain", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
