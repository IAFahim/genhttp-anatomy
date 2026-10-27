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

// ---------------------------------------------------------------- world

const PLATE = { x: -128, y: -64, w: 256, d: 140, r: 8 }; // x -128..128, y -64..76
const PLATE_H = 8;
const FOOT_H = 5;

const CASE = { x: -96, y: -48, w: 144, d: 56, r: 3 }; // x -96..48, y -48..8
const CASE_Z = 8;
const DECK = { x: -96, y: -48, w: 144, d: 56, r: 3 };
const DECK_Z = 60;
const DECK_TOP = 66;

const BAYS = [44, 26, 8]; // floor z of each bay, top drawer first
const BAY_H = 16;
const RAILS = [
  { x: -91, y: 3, w: 134, d: 6, r: 1.5, z: 42 },
  { x: -91, y: 3, w: 134, d: 6, r: 1.5, z: 24 },
];

const FRONT = { y: 5, w: 126, d: 5 }; // x -88..38, y 5..10
const FRONT_H = 14;
const TRAVEL = 20;
const BOX = { x: -86, y: -34, w: 122, d: 36 }; // y -34..2
const DRAWER_LABEL = ["list", ":id", "post"];

const BAR = { x: -88, y: -6, w: 132, d: 11, r: 2 }; // z 80..86
const BAR_Z = 80;
const BAR_TOP = 86;
const POSTS = [
  [-84, 0],
  [40, 0],
];
const SEATS = [-60, -22, 16];
const SEAT_LABEL = ["path", "body", "query"];
const CHUTE_POSTS = [
  [-78, -4],
  [34, -4],
];
const CHUTE_RAIL = { x: -76, y: -6.5, w: 126, d: 4, r: 1 }; // z 90..95
const TUBE = { z0: 90.5, z1: 95, rIn: 2.4, rOut: 3.3 };
const BEAD_R = 2;
const BEAD_TOP = 97;
const BEAD_DROP = 9;

const THROAT = { x: -96, y: -44, w: 38, d: 16, r: 2 }; // x -96..-58, y -44..-28
const JAW_TOP = 68.2;
const LIP = { z0: 70.1, z1: 73.1 };
const TABLE = { x: -52, y: -42, w: 34, d: 12, r: 1.5 }; // z 66..68.2
const ROLL_X = -56.5;
const ROLLS = [
  { z: 67.35, r: 1.3 },
  { z: 70.9, r: 1.3 },
];
const CHEEKS = [
  { x: -60, y: -44, w: 6, d: 2 },
  { x: -60, y: -30, w: 6, d: 2 },
];
const QCARD = { x: -56, y: -42, w: 34, d: 12, r: 1 }; // z 68.3..69.7
const CARD_DX = -38;

const TRAY = { x: 30, y: 40, w: 64, d: 30, r: 2 }; // z 1..7
const TRAY_WALL = 2.5;
const TRAY_WALL_H = 4;
const TRAY_CARD = { x: 42, y: 44, w: 34, d: 20, r: 1 };

const PEN_POST = [108, 14, 53, 2.6];
const SHOULDER = [108, 14, 50];
const ELBOW = [88, 34, 42];
const PEN_DIP = 2.6;

const PLATES = [
  { x: -98, label: "GET list" },
  { x: -70, label: "GET :id" },
  { x: -42, label: "POST" },
];
const PLATE_D = 26;
const IDX_H = 1.2;

const NAMES = ["GET list", "GET :id", "POST"];
const BINDS = ["query", "path", "body"];

// ---------------------------------------------------------------- camera

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [-96, -48, DECK_TOP],
    [48, 8, DECK_TOP],
    [-96, -28, 74],
    [-18, -30, 70],
    [BAR.x, BAR.y, BAR_TOP],
    [BAR.x + BAR.w, BAR.y + BAR.d, BAR_TOP],
    [SEATS[0], 1, BEAD_TOP + BEAD_R + 0.5],
    [SEATS[2], 1, BEAD_TOP + BEAD_R + 0.5],
    [CHUTE_RAIL.x, CHUTE_RAIL.y, 95],
    [CHUTE_RAIL.x + CHUTE_RAIL.w, CHUTE_RAIL.y + CHUTE_RAIL.d, 95],
    [108, 17, 53.4],
    [ELBOW[0], ELBOW[1], ELBOW[2] + 3],
    [64.5, 49, 8.5],
    [94, 70, 11],
    [PLATES[0].x, 72, IDX_H],
    [PLATES[2].x + 22, 46, IDX_H],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const unit = (from, to) => {
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(...d);
  return [d[0] / len, d[1] / len, d[2] / len];
};
const rod = (from, to, r, style) => S(G.disc(0, Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]), r, G.frameAlong(from, unit(from, to)), P), style);

// ---------------------------------------------------------------- base

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H + FOOT_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 18))) {
    out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  return out.join("");
}

// ---------------------------------------------------------------- case

function caseFrame() {
  const out = [];
  out.push(S(k.slabOf(CASE, 0, CASE_Z, P, 4, 0.8), { tone: "lo" }));
  out.push(S(k.slabOf({ x: -94, y: -48, w: 140, d: 6, r: 2 }, CASE_Z, DECK_Z - CASE_Z, P, 4, 0.8), { tone: "mid" }));
  for (const wall of [
    { x: -96, y: -48, w: 5, d: 56, r: 2 },
    { x: 43, y: -48, w: 5, d: 56, r: 2 },
  ]) {
    out.push(S(k.slabOf(wall, CASE_Z, DECK_Z - CASE_Z, P, 4, 0.8), { tone: "mid" }));
  }
  return out.join("");
}

function rail(index) {
  const rail = RAILS[index];
  const out = [];
  out.push(S(k.slabOf(rail, rail.z, 2, P, 4, 0.5), { tone: "mid" }));
  out.push(D([at([rail.x + 8, rail.y + 3, rail.z + 2]), at([rail.x + rail.w - 8, rail.y + 3, rail.z + 2])], { size: 0.4 }));
  return out.join("");
}

function deck() {
  const out = [];
  out.push(
    S(k.slabOf(DECK, DECK_Z, DECK_TOP - DECK_Z, P, 6, 1), {
      tone: "mid",
      inner: L(k.sideSeam(DECK, DECK_Z + 3, P, 6), { tone: "faint" }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(DECK, 4), DECK_TOP, P, 6), { tone: "faint" }));
  for (const sx of [-24, 28]) {
    out.push(L(k.ring(sx, 2, 1.5, DECK_TOP, P, 12), { tone: "lo" }));
    out.push(D([at([sx, 2, DECK_TOP])], { size: 0.4 }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- drawers

function drawer(index) {
  const bay = BAYS[index];
  const floorTop = bay + 1.5;
  const front = { x: -88, y: FRONT.y, w: FRONT.w, d: FRONT.d, r: 2 };
  const out = [];
  // box floor
  out.push(S(k.slabOf(BOX, bay + 0.5, 1, P, 3), { tone: "mid" }));
  // filed cards: two rows of ticks rooted on a base line, capped by a rod
  for (const [rowY, x0, x1] of [
    [-12, -79, 29],
    [-21, -79, -51],
  ]) {
    out.push(L(k.lineOnTop([-84, rowY], [34, rowY], floorTop, P), { tone: "lo" }));
    let d = "";
    for (let x = x0; x <= x1; x += 4) d += k.rise([x, rowY], floorTop, floorTop + 9.5, P);
    out.push(L(d, { tone: "hi" }));
    out.push(rod([-84, rowY, floorTop + 9.5], [34, rowY, floorTop + 9.5], 0.9, { tone: "mid", crease: "none" }));
  }
  // box walls
  out.push(S(k.slabOf({ x: BOX.x, y: -34, w: BOX.w, d: 3, r: 1 }, floorTop, 8.5, P, 3), { tone: "mid" }));
  for (const side of [
    { x: BOX.x, y: -34, w: 3, d: BOX.d, r: 1 },
    { x: BOX.x + BOX.w - 3, y: -34, w: 3, d: BOX.d, r: 1 },
  ]) {
    out.push(S(k.slabOf(side, floorTop, 8.5, P, 3), { tone: "mid" }));
  }
  // front with label frame and cup pull
  out.push(S(k.slabOf(front, bay + 1.5, FRONT_H, P, 4, 0.7), { tone: "mid" }));
  const label = { x: -38, y: 10, w: 22, d: 1, r: 1 };
  out.push(S(k.slabOf(label, bay + 7.5, 6, P, 3), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.sideMatrix([-27, 11], bay + 10.5, P, "left"), DRAWER_LABEL[index], { size: 2.4, tone: "mid", anchor: "middle" }));
  const cupZ = bay + 4.2;
  out.push(rod([-27, 9.6, cupZ], [-27, 12.4, cupZ], 2.2, { tone: "mid" }));
  out.push(L(k.sideRing([-27, 12.5, cupZ], 1.3, "y", P), { tone: "lo" }));
  return `<g data-part="drawer-${index}">${out.join("")}</g>`;
}

// ---------------------------------------------------------------- throat (query card feed)

function throat() {
  const out = [];
  out.push(S(k.slabOf(TABLE, DECK_TOP, JAW_TOP - DECK_TOP, P, 4, 0.5), { tone: "mid" }));
  const card = `<g data-part="card">${S(k.slabOf(QCARD, 68.3, 1.4, P, 3), { tone: "mid", crease: "lo" })}${L(
    [k.lineOnTop([-52, -36.5], [-26, -36.5], 69.7, P), k.lineOnTop([-52, -39], [-38, -39], 69.7, P)].join(""),
    { tone: "lo", free: true },
  )}</g>`;
  out.push(card);
  out.push(S(k.slabOf(THROAT, DECK_TOP, JAW_TOP - DECK_TOP, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf(THROAT, LIP.z0, LIP.z1 - LIP.z0, P, 4, 0.6), { tone: "mid" }));
  for (const cheek of CHEEKS) {
    out.push(S(k.slabOf({ ...cheek, r: 1 }, DECK_TOP, 8, P, 3, 0.4), { tone: "mid" }));
  }
  for (const roll of ROLLS) {
    out.push(rod([ROLL_X, -42.5, roll.z], [ROLL_X, -29.5, roll.z], roll.r, { tone: "mid" }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- binding bar

function binding() {
  const out = [];
  for (const [px, py] of POSTS) {
    out.push(S(k.cylinder(px, py, 2.8, DECK_TOP, BAR_Z - DECK_TOP, P, 20), { tone: "mid" }));
    out.push(L(k.ring(px, py, 1.7, BAR_Z, P, 14), { tone: "lo" }));
  }
  out.push(S(k.slabOf(BAR, BAR_Z, BAR_TOP - BAR_Z, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BAR, 2), BAR_TOP, P, 5), { tone: "faint" }));
  SEATS.forEach((sx, i) => {
    out.push(L(k.ring(sx, -0.5, 2.6, BAR_TOP, P, 20), { tone: "lo" }));
    out.push(k.faceTextSvg(k.sideMatrix([sx, BAR.y + BAR.d], BAR_Z + 3, P, "left"), SEAT_LABEL[i], { size: 2, tone: "mid", anchor: "middle" }));
  });
  for (const [px, py] of CHUTE_POSTS) {
    out.push(S(k.cylinder(px, py, 1.5, BAR_TOP, 4, P, 12), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(CHUTE_RAIL, BAR_TOP + 4, 5, P, 4, 0.6), { tone: "mid" }));
  return out.join("");
}

function bead(i) {
  const [sx, sy] = [SEATS[i], -0.5];
  return `<g data-part="bead-${i}">${S(G.sphereOf([sx, sy, BEAD_TOP], BEAD_R, P), { tone: "hi" })}</g>`;
}

function tubes() {
  const out = [];
  for (const sx of SEATS) {
    out.push(S(G.ringBand(TUBE.z0, TUBE.z1, TUBE.rIn, TUBE.rOut, G.frameAlong([sx, -0.5, 0], [0, 0, 1]), P), { tone: "mid" }));
  }
  return out.join("");
}

// ---------------------------------------------------------------- output tray and pen arm

function tray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, 1, 6, P, 4, 0.6), { tone: "lo" }));
  for (const wall of [
    { x: TRAY.x, y: TRAY.y, w: TRAY.w, d: TRAY_WALL, r: 1 },
    { x: TRAY.x, y: TRAY.y, w: TRAY_WALL, d: TRAY.d, r: 1 },
    { x: TRAY.x + TRAY.w - TRAY_WALL, y: TRAY.y, w: TRAY_WALL, d: TRAY.d, r: 1 },
  ]) {
    out.push(S(k.slabOf(wall, 7, TRAY_WALL_H, P, 3, 0.4), { tone: "lo" }));
  }
  const rules = (z, tone) =>
    L(
      [k.lineOnTop([TRAY_CARD.x + 3, 55], [TRAY_CARD.x + 29, 55], z, P), k.lineOnTop([TRAY_CARD.x + 3, 51], [TRAY_CARD.x + 24, 51], z, P), k.lineOnTop([TRAY_CARD.x + 3, 47], [TRAY_CARD.x + 20, 47], z, P)].join(""),
      { tone, free: true },
    );
  out.push(`<g data-part="tray-blank">${S(k.slabOf(TRAY_CARD, 7.2, 1.2, P, 3), { tone: "mid", crease: "none" })}</g>`);
  out.push(
    `<g data-part="tray-written" style="display:none">${S(k.slabOf(TRAY_CARD, 7.2, 1.2, P, 3), { tone: "hi" })}${rules(8.5, "lo")}</g>`,
  );
  return out.join("");
}

function penArm() {
  const out = [];
  out.push(S(k.cylinder(PEN_POST[0], PEN_POST[1], PEN_POST[3], 0, PEN_POST[2], P, 20), { tone: "mid" }));
  out.push(L(k.ring(PEN_POST[0], PEN_POST[1], 1.7, PEN_POST[2], P, 14), { tone: "lo" }));
  const penTip = [69.1, 46, 28.3];
  const nibEnd = [64.5, 49, 11];
  const arm = [
    rod([SHOULDER[0], SHOULDER[1] - 1.5, SHOULDER[2]], [SHOULDER[0], SHOULDER[1] + 2.5, SHOULDER[2]], 3.4, { tone: "mid", lit: true }),
    rod(SHOULDER, ELBOW, 2.1, { tone: "mid", lit: true }),
    rod([ELBOW[0], ELBOW[1] - 1.8, ELBOW[2]], [ELBOW[0], ELBOW[1] + 1.8, ELBOW[2]], 2.9, { tone: "mid", lit: true }),
    rod(ELBOW, penTip, 1.7, { tone: "mid", lit: true }),
    rod(penTip, [penTip[0] - 1.6, penTip[1] + 1, penTip[2] - 2.1], 2.2, { tone: "mid", lit: true }),
    rod([penTip[0] - 1.6, penTip[1] + 1, penTip[2] - 2.1], nibEnd, 0.85, { tone: "mid", lit: true }),
  ].join("");
  out.push(`<g data-part="pen">${arm}</g>`);
  return out.join("");
}

// ---------------------------------------------------------------- index plates

function plates() {
  const out = [];
  PLATES.forEach((plate, i) => {
    const plan = { x: plate.x, y: 46, w: 22, d: PLATE_D, r: 2 };
    const corners = [at([plan.x, plan.y, IDX_H]), at([plan.x + plan.w, plan.y, IDX_H]), at([plan.x, plan.y + plan.d, IDX_H]), at([plan.x + plan.w, plan.y + plan.d, IDX_H])];
    const xs = corners.map((c) => c[0]);
    const ys = corners.map((c) => c[1]);
    const hit = `<rect x="${Math.min(...xs) - 7}" y="${Math.min(...ys) - 7}" width="${Math.max(...xs) - Math.min(...xs) + 14}" height="${Math.max(...ys) - Math.min(...ys) + 14}" fill="transparent" pointer-events="all" style="cursor:pointer"/>`;
    const dim = S(k.slabOf(plan, 0, IDX_H, P, 4), { tone: "mid" }) + k.faceTextSvg(k.topMatrix([plate.x + 11, 59], IDX_H, P, "x"), plate.label, { size: 2.8, tone: "mid", anchor: "middle" });
    const lit = S(k.slabOf(plan, 0, IDX_H, P, 4), { tone: "hi" }) + k.faceTextSvg(k.topMatrix([plate.x + 11, 59], IDX_H, P, "x"), plate.label, { size: 2.8, tone: "lo", anchor: "middle" });
    out.push(
      `<g data-plate="${i}"><g data-part="plate-${i}-off">${dim}</g><g data-part="plate-${i}-on" style="display:none">${lit}</g>${hit}</g>`,
    );
  });
  return out.join("");
}

// ---------------------------------------------------------------- figure

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A library card catalog drawn as GenHTTP's reflection mapper: a request card feeds into a slot on the cabinet top, the matching method drawer slides open, a chute drops a bead into the argument slot the signature binds, and a hinged pen arm writes a response card into the output tray. Hover the index plates or press 1 to 3 to pick a method.",
  body: [
    base(),
    caseFrame(),
    drawer(2),
    rail(1),
    drawer(1),
    rail(0),
    drawer(0),
    deck(),
    throat(),
    binding(),
    bead(0),
    bead(1),
    bead(2),
    tubes(),
    tray(),
    plates(),
    penArm(),
  ],
});

// ---------------------------------------------------------------- live

const live = `
const P = ${JSON.stringify(P)};
const NAMES = ${JSON.stringify(NAMES)};
const BINDS = ${JSON.stringify(BINDS)};
const V = {
  card: axisVector(P, [${CARD_DX}, 0, 0]),
  drawer: axisVector(P, [0, ${TRAVEL}, 0]),
  bead: axisVector(P, [0, 0, -${BEAD_DROP}]),
  pen: axisVector(P, [0, 0, -${PEN_DIP}]),
};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const one = (name) => svg.querySelector('[data-part="' + name + '"]');
const cardEl = one("card");
const penEl = one("pen");
const drawerEls = [0, 1, 2].map((i) => one("drawer-" + i));
const beadEls = [0, 1, 2].map((i) => one("bead-" + i));
const platesOff = [0, 1, 2].map((i) => one("plate-" + i + "-off"));
const platesOn = [0, 1, 2].map((i) => one("plate-" + i + "-on"));
const trayBlank = one("tray-blank");
const trayWritten = one("tray-written");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const cur = { card: 0, drawer: [0, 0, 0], bead: [0, 0, 0], pen: 0 };
let active = 0, t = 9, touring = true, clock = 0, frame = 0, last = 0, visible = false, idleTimer = 0;

function setMove(el, vec, f) {
  el.setAttribute("transform", "translate(" + (vec[0] * f).toFixed(2) + " " + (vec[1] * f).toFixed(2) + ")");
}

function draw() {
  setMove(cardEl, V.card, cur.card);
  setMove(penEl, V.pen, cur.pen);
  const written = t > 1.62;
  trayBlank.style.display = written ? "none" : "";
  trayWritten.style.display = written ? "" : "none";
  for (let i = 0; i < 3; i++) {
    setMove(drawerEls[i], V.drawer, cur.drawer[i]);
    setMove(beadEls[i], V.bead, cur.bead[i]);
    platesOff[i].style.display = i === active ? "none" : "";
    platesOn[i].style.display = i === active ? "" : "none";
  }
  const text = "card " + (active + 1) + " · " + NAMES[active] + " · " + BINDS[active] + " bound";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(active + 1));
  stage.setAttribute("aria-valuetext", text);
}

function step(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  t += dt;
  if (touring) {
    clock += dt;
    if (clock > 4.8) {
      clock = 0;
      select((active + 1) % 3, true);
    }
  }
  const ease = 1 - Math.exp(-8 * dt);
  cur.card += ((t > 0.45 ? 1 : 0) - cur.card) * ease;
  cur.pen += (((t > 1.5 && t < 1.95) ? 1 : 0) - cur.pen) * ease;
  for (let i = 0; i < 3; i++) {
    const on = i === active;
    cur.drawer[i] += ((on && t > 0.55 ? 1 : 0) - cur.drawer[i]) * ease;
    cur.bead[i] += ((on && t > 1.05 ? 1 : 0) - cur.bead[i]) * ease;
  }
  draw();
  const calm = !touring && t > 3.2;
  frame = visible && !calm ? requestAnimationFrame(step) : 0;
}

const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(step);
  }
};

function select(next, fromTour) {
  active = next;
  t = 0;
  if (still.matches) {
    t = 9;
    cur.card = 1;
    cur.pen = 0;
    for (let i = 0; i < 3; i++) {
      cur.drawer[i] = i === active ? 1 : 0;
      cur.bead[i] = i === active ? 1 : 0;
    }
    draw();
    return;
  }
  if (!fromTour) {
    touring = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      touring = true;
      clock = 2.4;
      run();
    }, 4200);
  }
  run();
}

new IntersectionObserver((entries) => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) run();
}, { rootMargin: "120px 0px" }).observe(stage);

svg.querySelectorAll("[data-plate]").forEach((group) => {
  group.addEventListener("pointerenter", () => select(Number(group.getAttribute("data-plate"))));
});

stage.addEventListener("keydown", (event) => {
  let to = null;
  if (event.key === "1") to = 0;
  if (event.key === "2") to = 1;
  if (event.key === "3") to = 2;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = (active + 1) % 3;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = (active + 2) % 3;
  if (to === null) return;
  event.preventDefault();
  select(to);
});

if (still.matches) touring = false;
select(0, true);
`;

// ---------------------------------------------------------------- card

const body = k.plateHtml({
  fig: "Fig 5",
  title: "The reflection mapper",
  hint: "Hover an index card or press 1–3",
  readout: "card 1 · GET list · query bound",
  keys: [
    { mark: "lit", label: "Pen arm — the Roslyn-compiled invocation writes the response" },
    { mark: "raised", label: "Beads — bound arguments, seated by precedence: path → body → query" },
    { mark: "dim", label: "Drawers — one operation per method, matched from attributes" },
  ],
  caption:
    "Every front door — ServiceResource, Controller or an Inline lambda — ends in the same machinery: TypeAnalyzer reads the attributes into a MethodCollection and the OperationRouter matches the request card to one drawer. SignatureAnalyzer then binds each parameter by fixed precedence — path, injected, streamed, body, query, content — so a bead drops only into the slot the signature declares. The pen writes through a Roslyn-compiled Invoke when one can be generated and falls back to plain reflection otherwise, while an interceptor such as [RequireRole(\"admin\")] can short-circuit the call before the method runs.",
  body: `${pdfButton(`card-catalog-detailed-a4.pdf`)}<div class="iso-stage" tabindex="0" role="slider" aria-label="Card catalog: pick a method with the index plates or arrow keys" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "GenHTTP — the reflection mapper", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");
