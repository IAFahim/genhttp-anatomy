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

const PLATE = { x: -150, y: -70, w: 300, d: 132, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const PANEL = { x: -120, y: -64, w: 120, d: 8, r: 2 };
const PANEL_H = 64;
const PORTS = [
  { x: -84, z0: 34, label: "h1 h2" },
  { x: -48, z0: 16, label: "h2 h3" },
];
const KTLS = { x: -30, z0: 25, w: 13 };

const RADIO = { x: 70, y: -52, w: 34, d: 22, r: 2 };
const RADIO_H = 10;
const MAST = [87, -41];
const MAST_TOP = 52;

const BLOCK = { x: 3, y: -52, w: 12, d: 6, r: 1.5 };
const BLOCK_H = 4;

const POOL = { x: -124, y: 36, w: 40, d: 20, r: 2 };
const POOL_H = 3;

const STATIONS = [-99, -63, -27, 9];
const DESK = { w: 26, d: 26, r: 2 };
const DESK_Y = 6;
const DESK_H = 6;
const RING_R = 9;
const RING_Z = DESK_H;
const RING_H = 2.5;
const SLOTS = 12;
const TICKETS = [2, 5, 8, 11];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [PANEL.x, PANEL.y, PANEL_H],
    [PANEL.x + PANEL.w, PANEL.y + PANEL.d, PANEL_H],
    [MAST[0], MAST[1], MAST_TOP + 4],
    [RADIO.x + RADIO.w, RADIO.y + RADIO.d, RADIO_H],
    [STATIONS[3] + 13, DESK_Y + DESK.d, RING_Z + 15],
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
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H + FOOT_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 18)].sort((a, b) => k.depthOf([a[0], a[1], -PLATE_H], P) - k.depthOf([b[0], b[1], -PLATE_H], P))) {
    out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  for (const lane of [-53, -51, -54]) {
    out.push(L(k.lineOnTop([-145.4, lane], [145.4, lane], 0.1, P), { tone: "faint" }));
  }
  const strip = { x: 30, y: 44, w: 100, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([[strip.x + 2, strip.y + 3.5, 0.6], [strip.x + strip.w - 2, strip.y + 3.5, 0.6]].map((p) => at(p)), { size: 0.45 }));
  return out.join("");
}

function panel() {
  const out = [];
  out.push(S(k.slabOf(PANEL, 0, PANEL_H, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 2.5), PANEL_H, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([PANEL.x + PANEL.w / 2, PANEL.y + PANEL.d / 2], PANEL_H, P, "x"), "GENHTTP · IOXIDE", { size: 2.6, tone: "mid", anchor: "middle" }));
  for (const [sx, sy] of k.corners(PANEL, 4)) {
    out.push(L(k.ring(sx, sy, 1.4, PANEL_H, P, 12), { tone: "lo" }));
    out.push(D([at([sx, sy, PANEL_H])], { size: 0.4 }));
  }
  for (const port of PORTS) {
    const plan = { x: port.x - 10, y: -57.2, w: 20, d: 1.6, r: 0.6 };
    out.push(S(k.slabOf(plan, port.z0, 12, P, 2, 0.4), { tone: "hi", crease: "lo" }));
    out.push(k.faceTextSvg(k.sideMatrix([port.x - 7, -55.6, port.z0 + 7.5], port.z0 + 7.5, P, "left"), port.label, { size: 2.4, tone: "mid" }));
    out.push(S(k.cylinder(port.x, -55.4, 1.9, port.z0 - 4.5, 3.4, P, 18), { tone: "mid" }));
    out.push(L(k.ring(port.x, -55.4, 1.2, port.z0 - 1.1, P, 12), { tone: "faint" }));
    out.push(S(k.cylinder(port.x, -55.9, 1.4, port.z0 + 12, 1.6, P, 14), { tone: "mid" }));
  }
  const box = { x: KTLS.x, y: -57.2, w: KTLS.w, d: 1.6, r: 0.6 };
  out.push(S(k.slabOf(box, KTLS.z0, 8, P, 2, 0.4), { tone: "hi", crease: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([KTLS.x + 1, -55.6, KTLS.z0 + 5], KTLS.z0 + 5, P, "left"), "kTLS", { size: 2, tone: "mid" }));
  out.push(D([[KTLS.x + KTLS.w - 2, -55.4, KTLS.z0 + 6.5]].map((p) => at(p)), { size: 0.6, tone: "lit" }));
  return out.join("");
}

function mast() {
  const out = [];
  out.push(S(k.slabOf(RADIO, 0, RADIO_H, P, 4, 0.7), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(RADIO, 2), RADIO_H, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([RADIO.x + 3, RADIO.y + RADIO.d + 0.1, RADIO_H - 2.5], RADIO_H - 2.5, P, "left"), "QUIC · UDP", { size: 2.2, tone: "mid" }));
  out.push(S(k.cylinder(MAST[0], MAST[1], 1.4, RADIO_H, MAST_TOP - RADIO_H, P, 16), { tone: "mid", crease: "none" }));
  const armY = MAST_TOP - 8;
  out.push(S(k.slabOf({ x: MAST[0] - 13, y: MAST[1] - 1, w: 26, d: 2, r: 0.8 }, armY, 1.4, P, 2, 0.3), { tone: "mid" }));
  for (const wx of [MAST[0] - 10, MAST[0], MAST[0] + 10]) {
    out.push(S(k.cylinder(wx, MAST[1], 0.5, armY + 1.4, 7, P, 10), { tone: "hi", crease: "none" }));
  }
  out.push(S(k.cylinder(MAST[0], MAST[1], 2.2, MAST_TOP, 1.6, P, 16), { tone: "hi" }));
  for (const anchor of [[66, -12], [112, -24]]) {
    out.push(S(k.cylinder(anchor[0], anchor[1], 1.6, 0, 1.2, P, 12), { tone: "lo" }));
  }
  return out.join("");
}

function stow() {
  const out = [];
  const board = { x: 44, y: 6, w: 24, d: 20, r: 2 };
  out.push(S(k.slabOf(board, 0, 1.6, P, 3, 0.4), { tone: "mid" }));
  for (const [px, py] of [[50, 12], [62, 12], [50, 22], [62, 22]]) {
    out.push(S(k.cylinder(px, py, 1.1, 1.6, 3.4, P, 10), { tone: "mid", crease: "none" }));
    if (px === 50) {
      out.push(L(k.ring(px, py, 2.6, 3.2, P, 22), { tone: "lo" }));
      out.push(L(k.ring(px, py, 1.7, 3.2, P, 16), { tone: "lo" }));
      out.push(D([at([px, py, 5])], { size: 0.7 }));
    }
  }
  out.push(k.faceTextSvg(k.sideMatrix([board.x + board.w - 8, board.y - 0.1, 1], 1, P, "left"), "SPARE", { size: 1.8, tone: "mid" }));
  return out.join("");
}

function pool() {
  const out = [];
  out.push(S(k.slabOf(POOL, 0, POOL_H, P, 3, 0.4), { tone: "mid" }));
  for (const wall of [
    { x: POOL.x, y: POOL.y, w: POOL.w, d: 1.6, r: 0.6 },
    { x: POOL.x, y: POOL.y + POOL.d - 1.6, w: POOL.w, d: 1.6, r: 0.6 },
    { x: POOL.x, y: POOL.y, w: 1.6, d: POOL.d, r: 0.6 },
    { x: POOL.x + POOL.w - 1.6, y: POOL.y + 1.6, w: 1.6, d: POOL.d - 3.2, r: 0.6 },
  ]) {
    out.push(S(k.slabOf(wall, POOL_H, 4, P, 2, 0.3), { tone: "mid" }));
  }
  for (let i = 0; i < 3; i++) {
    const card = { x: POOL.x + 4 + i * 1.1, y: POOL.y + 4, w: 26, d: 12, r: 1 };
    out.push(S(k.slabOf(card, POOL_H + 0.4 + i * 0.7, 0.5, P, 2), { tone: "hi", crease: "none" }));
  }
  out.push(k.faceTextSvg(k.sideMatrix([POOL.x + POOL.w - 12, POOL.y - 0.1, POOL_H + 2], POOL_H + 2, P, "left"), "POOL", { size: 2, tone: "mid" }));
  return out.join("");
}

function station(cx) {
  const out = [];
  const desk = { x: cx - DESK.w / 2, y: DESK_Y, w: DESK.w, d: DESK.d, r: DESK.r };
  out.push(S(k.slabOf(desk, 0, DESK_H, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(desk, 2), DESK_H, P), { tone: "faint" }));
  out.push(S(k.cylinder(cx, DESK_Y + 14, RING_R, RING_Z, RING_H, P, 48, 0.5), { tone: "hi", crease: "lo" }));
  const ticks = k.radialTicks(cx, DESK_Y + 14, RING_R - 1.6, SLOTS, 1, RING_Z + RING_H, [1, 1.8], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(k.ring(cx, DESK_Y + 14, 2.4, RING_Z + RING_H, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(cx + 6.6, DESK_Y + 6.5, 1.4, RING_Z + RING_H, 3, P, 12), { tone: "mid" }));
  out.push(L(k.knurl(cx + 6.6, DESK_Y + 6.5, 1.4, RING_Z + RING_H, RING_Z + RING_H + 3, 14, P), { tone: "lo" }));
  out.push(S(k.cylinder(cx, DESK_Y + 3.5, 1.7, DESK_H, 2.2, P, 16), { tone: "mid" }));
  out.push(L(k.ring(cx, DESK_Y + 3.5, 1.1, DESK_H + 2.2, P, 12), { tone: "faint" }));
  out.push(`<g data-part="lamp-${cx}-off">${S(k.cylinder(cx - 9, DESK_Y + 21.5, 2.2, DESK_H, 2.4, P, 16), { tone: "mid" })}${S(k.cylinder(cx - 9, DESK_Y + 21.5, 1.5, DESK_H + 2.4, 1.2, P, 14), { tone: "lo" })}</g>`);
  out.push(`<g data-part="lamp-${cx}-on" style="display:none">${S(k.cylinder(cx - 9, DESK_Y + 21.5, 2.2, DESK_H, 2.4, P, 16), { tone: "mid" })}${S(k.cylinder(cx - 9, DESK_Y + 21.5, 1.5, DESK_H + 2.4, 1.2, P, 14), { tone: "hi", lit: true })}</g>`);
  out.push(S(k.cylinder(cx + 9.5, DESK_Y + 3, 0.7, RING_Z + RING_H, 5.5, P, 8), { tone: "mid", crease: "none" }));
  out.push(`<g data-part="flag-${cx}-off">${S(k.slabOf({ x: cx + 9.5, y: DESK_Y + 3.6, w: 1.3, d: 5.5, r: 0.5 }, 12, 3, P, 2), { tone: "lo", crease: "none" })}</g>`);
  out.push(`<g data-part="flag-${cx}-on" style="display:none">${S(k.slabOf({ x: cx + 9.5, y: DESK_Y + 3.6, w: 1.3, d: 5.5, r: 0.5 }, 12, 3, P, 2), { tone: "hi", crease: "none", lit: true })}</g>`);
  return out.join("");
}

function stations() {
  return STATIONS.map((cx) => station(cx)).join("");
}

function ringDots(cx, rotFrac, litIndex) {
  const cy = DESK_Y + 14;
  const points = TICKETS.map((slot) => {
    const theta = ((slot + rotFrac) / SLOTS) * Math.PI * 2;
    const lit = TICKETS.indexOf(slot) === litIndex % TICKETS.length;
    return [cx + (RING_R - 3.4) * Math.sin(theta), cy - (RING_R - 3.4) * Math.cos(theta), RING_Z + RING_H, lit ? 1 : 0.7];
  });
  return dotsSvg(points, { size: 1.0 });
}

function cord(route) {
  const pts = G.fillet(route, 2.5, 7, { P, tube: 0.7 });
  const pieces = tubePieces(pts, 0.7, P, { maxLength: 14 });
  return pieces.map((piece) => tubeSvg(piece, { tone: "hi" })).join("");
}

function hookedCord(cx) {
  const out = [];
  out.push(S(k.cylinder(cx + 11.5, DESK_Y + 1.5, 0.5, DESK_H, 5, P, 8), { tone: "mid", crease: "none" }));
  out.push(L(k.ring(cx + 9.5, DESK_Y + 1.5, 3, DESK_H + 1.2, P, 24), { tone: "lo" }));
  out.push(L(k.ring(cx + 9.5, DESK_Y + 1.5, 1.6, DESK_H + 1.2, P, 16), { tone: "lo" }));
  out.push(D([at([cx + 11.5, DESK_Y + 1.5, DESK_H + 5])], { size: 0.8 }));
  return out.join("");
}

const CORD_1 = [[-84, -55.4, 31.2], [-84, -53, 1.2], [-99, -53, 1.2], [-99, DESK_Y + 3.5, 1.2], [-99, DESK_Y + 3.5, 7.6], [-99, DESK_Y + 3.5, 7.6]];
const CORD_2 = [[-48, -55.4, 13.2], [-48, -51, 1.2], [-27, -51, 1.2], [-27, DESK_Y + 3.5, 1.2], [-27, DESK_Y + 3.5, 7.6], [-27, DESK_Y + 3.5, 7.6]];
const CORD_M = [[80, -41, RADIO_H + 1], [80, -54, 1.2], [9, -54, 1.2], [9, -52, 1.8]];
const CORD_3 = [[9, -50, 1.8], [9, 3, 1.8], [9, 3, 7.6], [9, DESK_Y + 3.5, 7.6], [9, DESK_Y + 3.5, 7.6]];
const GUY_1 = [[MAST[0], MAST[1], MAST_TOP - 6], [66, -12, 1]];
const GUY_2 = [[MAST[0], MAST[1], MAST_TOP - 6], [112, -24, 1]];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A telephone exchange drawn as an engine: a base plate carries a trunk panel with two port plates and a kTLS block, a radio mast on its own box, a distribution block and a tray of pooled request cards. Four operator stations each carry a patch ring with ticket slots, a crank, a jack, a lamp and an on-duty flag. Patch cords run from the trunk ports and the radio feed to three of the stations; the fourth keeps its cord on a hook.",
  body: [
    base(),
    panel(),
    mast(),
    stations(),
    pool(),
    stow(),
    `<g data-part="cord1">${cord(CORD_1)}</g>`,
    `<g data-part="cord2">${cord(CORD_2)}</g>`,
    `<g data-part="cordm">${cord(CORD_M)}</g>`,
    `<g data-part="guy1">${cord(GUY_1)}</g>`,
    `<g data-part="guy2">${cord(GUY_2)}</g>`,
    S(k.slabOf(BLOCK, 0, BLOCK_H, P, 3, 0.5), { tone: "mid" }) + L(k.planOutline(k.insetPlan(BLOCK, 1.2), BLOCK_H, P), { tone: "lo" }),
    `<g data-part="cord3">${cord(CORD_3)}</g>`,
    hookedCord(-63),
    `<g data-part="dots"></g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const STATIONS = ${JSON.stringify(STATIONS)};
const SLOTS = ${SLOTS};
const DESK_Y = ${DESK_Y};
const RING_R = ${RING_R}, RING_Z = ${RING_Z}, RING_H = ${RING_H};
const TICKETS = ${JSON.stringify(TICKETS)};
const ringDots = ${ringDots.toString()};
const FLAG_UP = ${JSON.stringify(k.translateAlong(P, [0, 0, 2.5]))};
const FLAG_DOWN = ${JSON.stringify(k.translateAlong(P, [0, 0, 0]))};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const dots = svg.querySelector('[data-part="dots"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const lamps = STATIONS.map((cx) => [svg.querySelector('[data-part="lamp-' + cx + '-off"]'), svg.querySelector('[data-part="lamp-' + cx + '-on"]')]);
const flags = STATIONS.map((cx) => [svg.querySelector('[data-part="flag-' + cx + '-off"]'), svg.querySelector('[data-part="flag-' + cx + '-on"]')]);
let active = 0, target = 0, rot = [0, 0, 0, 0], done = 0, last = 0, frame = 0, visible = false, touring = true, clock = 0, idleTimer = 0;
function draw() {
  let markup = "";
  for (let i = 0; i < STATIONS.length; i++) {
    markup += ringDots(STATIONS[i], rot[i], i === active ? Math.floor(rot[i]) : -1);
  }
  if (dots.innerHTML !== markup) dots.innerHTML = markup;
  lamps.forEach((pair, i) => { pair[0].style.display = i === active ? "none" : ""; pair[1].style.display = i === active ? "" : "none"; });
  flags.forEach((pair, i) => {
    const up = i === active;
    pair[0].style.display = up ? "none" : "";
    pair[1].style.display = up ? "" : "none";
    pair[up ? 1 : 0].setAttribute("transform", up ? FLAG_UP : FLAG_DOWN);
  });
  const text = "reactor " + (active + 1) + " of 4 · completions " + done;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(active + 1));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = Math.floor(clock / 2.4) % STATIONS.length; }
  active = target;
  const before = Math.floor(rot[active]);
  for (let i = 0; i < rot.length; i++) rot[i] += dt * (i === active ? 1.5 : 0.35);
  if (Math.floor(rot[active]) !== before) done += 1;
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => {
  touring = false;
  target = Math.max(0, Math.min(STATIONS.length - 1, next));
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; clock = target * 2.4; run(); }, 3600);
  run();
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.max(0, Math.min(0.999, (event.clientX - box.left) / box.width));
  steer(Math.floor(share * STATIONS.length));
});
stage.addEventListener("pointerleave", () => steer(target));
stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = target + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = target - 1;
  if (event.key === "Home") to = 0;
  if (event.key === "End") to = STATIONS.length - 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Ioxide — the io_uring exchange",
  hint: "Hover to hand the call to another reactor",
  readout: "reactor 1 of 4 · completions 0",
  keys: [
    { mark: "lit", label: "On-duty reactor: flag up, lamp lit, its ring turning fastest" },
    { mark: "raised", label: "Patch rings: one io_uring ring per reactor, 8192 entries each" },
    { mark: "dim", label: "Trunks: two TCP ports (kTLS on one) and the QUIC radio feed" },
  ],
  caption:
    "Ioxide runs one reactor thread per core, each with its own io_uring ring of 8192 entries. Connections arrive on trunk ports — TCP with TLS (kernel TLS offload optional) and QUIC over UDP for HTTP/3 — and every reactor serves any of them. Each posted ticket is a submission; each lit one, a completion. Requests are pooled cards, dealt from the tray; the parser is Glyph11's hardened HTTP/1.1 + HTTP/2 reader. The rings never stop turning.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Ioxide exchange: arrow keys hand the call between reactors" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "Ioxide — the io_uring exchange", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
