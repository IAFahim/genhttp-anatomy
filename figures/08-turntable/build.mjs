import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 660;
const HEIGHT = 460;

const PIT_C = [-30, -10];
const OCT_R = 118;
const OCT_C = PIT_C;
const OCT_RING = Array.from({ length: 8 }, (_, i) => {
  const a = ((15 + i * 45) * Math.PI) / 180;
  return [OCT_C[0] + OCT_R * Math.cos(a), OCT_C[1] + OCT_R * Math.sin(a)];
});
const APRON_H = 10;
const FOOT_H = 5;
const PIT_R = 56;
const PIT_H = 8;

const ROADS = [
  { angle: 150 },
  { angle: 270 },
  { angle: 30 },
];
const ROAD_LEN = 66;

const DECK_LEN = 104;
const DECK_W = 14;

const P = k.fitProjection(
  [
    ...OCT_RING.map(([x, y]) => [x, y, 0]),
    ...OCT_RING.map(([x, y]) => [x, y, -APRON_H - FOOT_H]),
    [PIT_C[0], PIT_C[1], PIT_H + 26],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

const roadDir = (deg) => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
const rotated = (point, deg) => {
  const rad = (deg * Math.PI) / 180;
  const dx = point[0] - PIT_C[0];
  const dy = point[1] - PIT_C[1];
  return [PIT_C[0] + dx * Math.cos(rad) - dy * Math.sin(rad), PIT_C[1] + dx * Math.sin(rad) + dy * Math.cos(rad), point[2]];
};

function base() {
  const out = [];
  for (let i = 0; i < 8; i += 2) {
    const [x, y] = OCT_RING[i];
    out.push(S(k.cylinder(x, y, 5.5, -APRON_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.extrude(OCT_RING, -APRON_H, APRON_H, P, { convex: true, bevel: 1.2 }), { tone: "mid" }));
  const inner = OCT_RING.map(([x, y]) => [OCT_C[0] + (x - OCT_C[0]) * 0.94, OCT_C[1] + (y - OCT_C[1]) * 0.94]);
  out.push(L(k.onTop(inner, 0, P, true), { tone: "lo" }));
  for (let i = 1; i < 8; i += 2) {
    const [x, y] = OCT_RING[i];
    const sx = OCT_C[0] + (x - OCT_C[0]) * 0.9;
    const sy = OCT_C[1] + (y - OCT_C[1]) * 0.9;
    out.push(L(k.ring(sx, sy, 2, 0, P, 14), { tone: "lo" }));
    out.push(D([at([sx, sy, 0])], { size: 0.45 }));
  }
  return out.join("");
}

function pit() {
  const out = [];
  const F = G.frameOf([PIT_C[0], PIT_C[1], 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  out.push(S(k.cylinder(PIT_C[0], PIT_C[1], PIT_R - 7, -1.5, 1.5, P, 72), { tone: "lo", crease: "none" }));
  out.push(S(G.ringBand(0, PIT_H, PIT_R - 7, PIT_R, F, P, { steps: 72 }), { tone: "lo", crease: "none" }));
  out.push(L(k.ring(PIT_C[0], PIT_C[1], PIT_R - 2.5, PIT_H, P, 72), { tone: "faint" }));
  const ticks = k.radialTicks(PIT_C[0], PIT_C[1], PIT_R - 2.5, 36, 3, PIT_H, [1.2, 2.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  for (const road of ROADS) {
    const [dx, dy] = roadDir(road.angle);
    const px = PIT_C[0] + dx * (PIT_R + 4);
    const py = PIT_C[1] + dy * (PIT_R + 4);
    out.push(S(k.cylinder(px, py, 2.2, 0, 7, P, 14), { tone: "mid" }));
    out.push(S(k.cylinder(px, py, 1.1, 7, 2.2, P, 10), { tone: "hi", crease: "none" }));
  }
  return out.join("");
}

function rails(deg) {
  const out = [];
  const [dx, dy] = roadDir(deg);
  for (const sign of [-1, 1]) {
    const nx = -dy * sign;
    const ny = dx * sign;
    for (const off of [4.2, -4.2]) {
      const a = [PIT_C[0] + dx * (PIT_R + 2) + nx * off, PIT_C[1] + dy * (PIT_R + 2) + ny * off];
      const b = [PIT_C[0] + dx * (PIT_R + ROAD_LEN) + nx * off, PIT_C[1] + dy * (PIT_R + ROAD_LEN) + ny * off];
      out.push(L(k.lineOnTop(a, b, 0.8, P), { tone: "lo" }));
      if (off > 0) {
        const c0 = [PIT_C[0] + dx * (PIT_R + 2), PIT_C[1] + dy * (PIT_R + 2)];
        const d0 = [PIT_C[0] + dx * (PIT_R + ROAD_LEN), PIT_C[1] + dy * (PIT_R + ROAD_LEN)];
        for (let i = 0; i < 8; i++) {
          const t = (i + 0.5) / 8;
          const cx = c0[0] + (d0[0] - c0[0]) * t;
          const cy = c0[1] + (d0[1] - c0[1]) * t;
          out.push(L(k.lineOnTop([cx + nx * 4.2, cy + ny * 4.2], [cx - nx * 4.2, cy - ny * 4.2], 0.4, P), { tone: "faint" }));
        }
      }
    }
  }
  return out.join("");
}

function bodyAt(cx, cy, w, z, h, tone) {
  return S(k.slabOf({ x: cx - w / 2, y: cy - w / 2, w, d: w, r: 1.5 }, z, h, P, 2, 0.4), { tone, crease: "lo" });
}

function engine(index) {
  const [dx, dy] = roadDir(ROADS[index].angle);
  const baseR = PIT_R + ROAD_LEN - 22;
  const cx = PIT_C[0] + dx * baseR;
  const cy = PIT_C[1] + dy * baseR;
  const ahead = (back, lateral = 0) => [cx + dx * back - dy * lateral, cy + dy * back + dx * lateral];
  const out = [];
  if (index === 0) {
    let p = ahead(-14);
    out.push(bodyAt(p[0], p[1], 11, 1.2, 7, "hi"));
    p = ahead(-2);
    out.push(bodyAt(p[0], p[1], 8, 1.2, 8.4, "hi"));
    out.push(S(k.cylinder(...ahead(-20), 3.2, 8.2, 9, P, 20), { tone: "hi", crease: "lo" }));
    out.push(S(k.cylinder(...ahead(-20), 1.6, 17.2, 3, P, 14), { tone: "hi" }));
  } else if (index === 1) {
    let p = ahead(-18);
    out.push(bodyAt(p[0], p[1], 11, 1.2, 8, "hi"));
    p = ahead(-3);
    out.push(bodyAt(p[0], p[1], 9, 1.2, 9.6, "hi"));
    p = ahead(9);
    out.push(bodyAt(p[0], p[1], 12, 1.2, 6.4, "hi"));
    out.push(S(k.cylinder(...ahead(-9), 3.6, 9.2, 14, P, 22), { tone: "hi", crease: "lo" }));
    out.push(S(k.cylinder(...ahead(-9), 1.8, 23.2, 2.6, P, 14), { tone: "hi" }));
  } else {
    let p = ahead(-13);
    out.push(bodyAt(p[0], p[1], 10, 1.2, 6.4, "hi"));
    p = ahead(1);
    out.push(bodyAt(p[0], p[1], 9.4, 1.2, 7.6, "hi"));
    p = ahead(-19);
    out.push(bodyAt(p[0], p[1], 4.4, 7.6, 2.6, "hi"));
  }
  const lp = ahead(9);
  out.push(`<g data-part="lamp-${index}-off" style="display:none">${S(k.cylinder(lp[0], lp[1], 1.2, 5.2, 1.6, P, 12), { tone: "lo" })}</g>`);
  out.push(`<g data-part="lamp-${index}" style="display:none">${S(k.cylinder(lp[0], lp[1], 1.2, 5.2, 1.6, P, 12), { tone: "hi", lit: true })}</g>`);
  return out.join("");
}

function deckPiece(deg) {
  const half = DECK_LEN / 2;
  const z0 = PIT_H + 1.5;
  const h = 4;
  const deckRing = [
    [PIT_C[0] - half, PIT_C[1] - DECK_W / 2],
    [PIT_C[0] + half, PIT_C[1] - DECK_W / 2],
    [PIT_C[0] + half, PIT_C[1] + DECK_W / 2],
    [PIT_C[0] - half, PIT_C[1] + DECK_W / 2],
  ].map(([x, y]) => {
    const p = rotated([x, y, 0], deg);
    return [p[0], p[1]];
  });
  const out = [S(k.extrude(deckRing, z0, h, P, { convex: true, bevel: 0.5 }), { tone: "mid" })];
  for (const sign of [-1, 1]) {
    const a = rotated([PIT_C[0] - half + 4, PIT_C[1] + (sign * DECK_W) / 2, z0 + h], deg);
    const b = rotated([PIT_C[0] + half - 4, PIT_C[1] + (sign * DECK_W) / 2, z0 + h], deg);
    out.push(L(k.segment(a, b, P), { tone: "lo" }));
    for (const t of [0.18, 0.5, 0.82]) {
      out.push(L(k.rise([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], z0 + h, z0 + h + 3.4, P), { tone: "lo" }));
    }
  }
  const pivot = rotated([PIT_C[0], PIT_C[1], 0], deg);
  out.push(S(k.cylinder(pivot[0], pivot[1], 3.4, z0 + h, 2.2, P, 24), { tone: "hi", crease: "lo" }));
  const gauge = rotated([PIT_C[0] + half - 9, PIT_C[1], z0 + h], deg);
  const ticks = k.radialTicks(gauge[0], gauge[1], 3.2, 12, 3, z0 + h, [1, 2], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(k.ring(gauge[0], gauge[1], 3.2, z0 + h, P, 20), { tone: "lo" }));
  return out.join("");
}

function coachPiece(deg) {
  const c = rotated([PIT_C[0], PIT_C[1], 0], deg);
  const angle = (deg * Math.PI) / 180;
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const back = DECK_LEN / 2 - 22;
  const bx = c[0] + ax * back;
  const by = c[1] + ay * back;
  const out = [];
  out.push(S(k.slabOf({ x: bx - 5.5, y: by - 5.5, w: 11, d: 11, r: 1.5 }, PIT_H + 5.5, 8.5, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  out.push(S(k.slabOf({ x: bx - 4.5, y: by - 4.5, w: 9, d: 9, r: 1 }, PIT_H + 14, 2.2, P, 2, 0.4), { tone: "hi", crease: "none" }));
  for (const s of [-1, 1]) {
    const wx = bx + ay * s * 5.5;
    const wy = by - ax * s * 5.5;
    out.push(L(k.lineOnTop([wx - ax * 4.4, wy - ay * 4.4], [wx + ax * 4.4, wy + ay * 4.4], PIT_H + 14, P), { tone: "lo" }));
  }
  const cx2 = c[0] + ax * (back + 8.5);
  const cy2 = c[1] + ay * (back + 8.5);
  out.push(S(k.cylinder(cx2, cy2, 1.1, PIT_H + 5.5, 2.6, P, 10), { tone: "mid", crease: "none" }));
  return out.join("");
}

const LIVE_PIECE = `
const PIT_C = ${JSON.stringify(PIT_C)};
const PIT_H = ${PIT_H};
const DECK_LEN = ${DECK_LEN};
const DECK_W = ${DECK_W};
const rotated = (point, deg) => {
  const rad = (deg * Math.PI) / 180;
  const dx = point[0] - PIT_C[0];
  const dy = point[1] - PIT_C[1];
  return [PIT_C[0] + dx * Math.cos(rad) - dy * Math.sin(rad), PIT_C[1] + dx * Math.sin(rad) + dy * Math.cos(rad), point[2]];
};
function deckPiece(deg) {
  const half = DECK_LEN / 2;
  const z0 = PIT_H + 1.5;
  const h = 4;
  const deckRing = [
    [PIT_C[0] - half, PIT_C[1] - DECK_W / 2],
    [PIT_C[0] + half, PIT_C[1] - DECK_W / 2],
    [PIT_C[0] + half, PIT_C[1] + DECK_W / 2],
    [PIT_C[0] - half, PIT_C[1] + DECK_W / 2],
  ].map(([x, y]) => {
    const p = rotated([x, y, 0], deg);
    return [p[0], p[1]];
  });
  const out = [solidSvg(extrude(deckRing, z0, h, P, { convex: true, bevel: 0.5 }), { tone: "mid" })];
  for (const sign of [-1, 1]) {
    const a = rotated([PIT_C[0] - half + 4, PIT_C[1] + (sign * DECK_W) / 2, z0 + h], deg);
    const b = rotated([PIT_C[0] + half - 4, PIT_C[1] + (sign * DECK_W) / 2, z0 + h], deg);
    out.push(lineSvg(segment(a, b, P), { tone: "lo" }));
    for (const t of [0.18, 0.5, 0.82]) {
      out.push(lineSvg(rise([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], z0 + h, z0 + h + 3.4, P), { tone: "lo" }));
    }
  }
  const pivot = rotated([PIT_C[0], PIT_C[1], 0], deg);
  out.push(solidSvg(cylinder(pivot[0], pivot[1], 3.4, z0 + h, 2.2, P, 24), { tone: "hi", crease: "lo" }));
  const gauge = rotated([PIT_C[0] + half - 9, PIT_C[1], z0 + h], deg);
  const ticks = radialTicks(gauge[0], gauge[1], 3.2, 12, 3, z0 + h, [1, 2], P);
  out.push(lineSvg(ticks.minor, { tone: "lo" }));
  out.push(lineSvg(ring(gauge[0], gauge[1], 4.4, z0 + h, P, 20), { tone: "lo" }));
  return out.join("");
}
function coachPiece(deg) {
  const c = rotated([PIT_C[0], PIT_C[1], 0], deg);
  const angle = (deg * Math.PI) / 180;
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const back = DECK_LEN / 2 - 22;
  const bx = c[0] + ax * back;
  const by = c[1] + ay * back;
  const out = [];
  out.push(solidSvg(slabOf({ x: bx - 5.5, y: by - 5.5, w: 11, d: 11, r: 1.5 }, PIT_H + 5.5, 8.5, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  out.push(solidSvg(slabOf({ x: bx - 4.5, y: by - 4.5, w: 9, d: 9, r: 1 }, PIT_H + 14, 2.2, P, 2, 0.4), { tone: "hi", crease: "none" }));
  for (const s of [-1, 1]) {
    const wx = bx + ay * s * 5.5;
    const wy = by - ax * s * 5.5;
    out.push(lineSvg(lineOnTop([wx - ax * 3, wy - ay * 3], [wx + ax * 3, wy + ay * 3], PIT_H + 14, P), { tone: "lo" }));
  }
  const cx2 = c[0] + ax * (back + 8.5);
  const cy2 = c[1] + ay * (back + 8.5);
  out.push(solidSvg(cylinder(cx2, cy2, 1.1, PIT_H + 5.5, 2.6, P, 10), { tone: "mid", crease: "none" }));
  return out.join("");
}
`;

function fixtures() {
  const out = [];
  const crane = [58, 58];
  out.push(S(k.cylinder(crane[0], crane[1], 4, 0, 2.4, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(crane[0], crane[1], 1.4, 2.4, 22, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: crane[0] - 1.6, y: crane[1] - 16, w: 3.2, d: 15, r: 1 }, 21, 2.6, P, 2, 0.4), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(crane[0], crane[1] - 15, 1.6, 17.5, 3.6, P, 12), { tone: "hi", crease: "none" }));
  out.push(L(k.ring(crane[0], crane[1], 3.2, 24.4, P, 20), { tone: "lo" }));
  out.push(S(k.slabOf({ x: crane[0] + 6, y: crane[1] + 4, w: 5, d: 3.4, r: 0.8 }, 0, 2.6, P, 2), { tone: "mid" }));
  const coal = [-108, -48];
  out.push(S(k.slabOf({ x: coal[0] - 14, y: coal[1] - 9, w: 28, d: 18, r: 2 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: coal[0] - 10, y: coal[1] - 12, w: 20, d: 6, r: 1 }, 0, 1.2, P, 2, 0.3), { tone: "mid" }));
  for (let i = 0; i < 5; i++) {
    const px = coal[0] - 8 + (i % 3) * 7;
    const py = coal[1] - 3 + Math.floor(i / 3) * 6;
    out.push(S(k.cylinder(px + (i % 2) * 1.4, py, 2.6 + (i % 2) * 0.8, 3, 2.6 + (i % 3) * 0.9, P, 14), { tone: "hi", crease: "lo" }));
  }
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A locomotive turntable: a round pit set in an apron, a rotating bridge deck with handrails and an angle gauge carrying one coach, and three roads leading away to three different locomotives — a small tank engine, a heavy tender locomotive and a sleek diesel with a nose lamp.",
  body: [
    base(),
    pit(),
    rails(150),
    rails(270),
    rails(30),
    fixtures(),
    engine(0),
    engine(1),
    engine(2),
    `<g data-part="deck">${deckPiece(150)}</g>`,
    `<g data-part="coach">${coachPiece(150)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const ANGLES = ${JSON.stringify(ROADS.map((r) => r.angle))};
const ENGINE_NAMES = ["internal", "kestrel", "ioxide"];
const ENGINE_SPECS = ["h1", "h1 h2 h3", "h1 h2 h3 · io_uring"];
${LIVE_PIECE}
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const deck = svg.querySelector('[data-part="deck"]');
const coachG = svg.querySelector('[data-part="coach"]');
const lamps = [0, 1, 2].map((i) => [svg.querySelector('[data-part="lamp-' + i + '-off"]'), svg.querySelector('[data-part="lamp-' + i + '"]')]);
let engine = 0, target = 0, angle = ANGLES[0], last = 0, frame = 0, visible = false, touring = true, clock = 0, idleTimer = 0;
function draw() {
  deck.innerHTML = deckPiece(angle);
  coachG.innerHTML = coachPiece(angle);
  lamps.forEach((pair, i) => {
    pair[0].style.display = i === engine ? "none" : "";
    pair[1].style.display = i === engine ? "" : "none";
  });
  const text = "engine " + (engine + 1) + " · " + ENGINE_NAMES[engine] + " · " + ENGINE_SPECS[engine];
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(engine + 1));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = Math.floor(clock / 2.6) % 3; }
  const calm = still.matches;
  const want = ANGLES[target];
  if (calm) angle = want;
  else {
    const diff = ((want - angle + 540) % 360) - 180;
    angle = (angle + diff * (1 - Math.exp(-dt / 0.3)) + 360) % 360;
  }
  engine = target;
  draw();
  const settled = Math.abs(((want - angle + 540) % 360) - 180) < 0.05;
  frame = visible && (touring || !settled) && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  target = Math.max(0, Math.min(2, next));
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; clock = target * 2.6; run(); }, 3600);
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
  fig: "Fig 8",
  title: "The turntable",
  hint: "Hover to couple the coach to an engine",
  readout: "engine 1 · internal · h1",
  keys: [
    { mark: "lit", label: "The coupled engine's headlamp" },
    { mark: "raised", label: "The coach: your application, unchanged on every road" },
    { mark: "dim", label: "Three roads: Internal, Kestrel, Ioxide — one IServerHost" },
  ],
  caption:
    "The same application couples to any of three engines through one IServerHost: the threaded Internal engine (HTTP/1.1, embedding), Kestrel (the ASP.NET edge), and Ioxide (io_uring on Linux, HTTP/1.1 to HTTP/3). The meta-packages differ only in the engine dependency, and every acceptance test runs against every engine.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Engine turntable: arrow keys choose an engine" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "The turntable", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
