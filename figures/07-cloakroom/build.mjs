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

const PLATE = { x: -172, y: -84, w: 248, d: 105, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

const COUNTER = { x: -140, y: -62, w: 184, d: 56, r: 4 }; // x -140..44, y -62..-6
const KICK = k.insetPlan(COUNTER, 3);
const TOP = { x: -144, y: -65, w: 192, d: 62, r: 4 };
const TOP_Z = 38;

const POSTS = [-132, -2];
const RAIL_Y = -58;
const BAR = { x: -132, y: -59.4, w: 130, d: 2.8, r: 1.4 };
const SLOTS = [-114, -91, -68, -45, -22];
const TAGS = [1, 2, 5, 4, 3]; // tag now hanging on coat at each slot

const DIAL = { x: -62, y: -21, r: 13, h: 8 }; // on the counter top, face at TOP_Z + h
const GEAR = { x: -46.5, y: -16, r: 4.6 };
const LAMP = { x: -28, y: -28 };

const BED = { x: 2, y: -41.5, w: 20, d: 11, r: 2 };
const PRESS_X = 12;
const HEAD = { x: 3, y: -40.5, w: 18, d: 9, r: 1.8 };
const BEAM = { x: -10, y: -41.5, w: 44, d: 11, r: 3 };
const ROD_F = G.frameOf([PRESS_X, -36, 74], [0, 0, -1], [1, 0, 0], [0, 1, 0]);
const ROD_STROKE = 16;
const TRAY = { x: 0, y: -18, w: 24, d: 11, r: 2 };
const BUNDLE = { x: 3, y: -29, w: 18, d: 8, r: 1.2 };

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners(TOP, 0, TOP_Z),
    [POSTS[0], RAIL_Y, 95],
    [POSTS[1], RAIL_Y, 95],
    [SLOTS[0], RAIL_Y, 81],
    [SLOTS[4], RAIL_Y, 81],
    [PRESS_X, -36, 85],
    [DIAL.x, DIAL.y, TOP_Z + DIAL.h + 1],
    [-106, 2, 19],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 42 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H, PLATE_H + FOOT_H, P)}"/>`];
  for (const [x, y] of [...k.corners(PLATE, 18)].sort((a, b) => k.depthOf([a[0], a[1], -PLATE_H], P) - k.depthOf([b[0], b[1], -PLATE_H], P))) {
    out.push(S(k.cylinder(x, y, 5.5, -PLATE_H - FOOT_H, FOOT_H, P, 24), { tone: "lo" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.45 }));
  return out.join("");
}

function counter() {
  const out = [];
  for (const [fx, fy] of [
    [-132, -60],
    [36, -60],
    [-132, -12],
    [36, -12],
  ].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(fx, fy, 2, 0, 3, P, 14), { tone: "lo" }));
  }
  out.push(S(k.slabOf(KICK, 3, 6, P, 5), { tone: "lo" }));
  out.push(S(k.slabOf(COUNTER, 9, 25, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(COUNTER, 10, P, 6), { tone: "faint" }) }));
  const surround = { x: -128, y: -8.6, w: 40, d: 2.8, r: 2 };
  out.push(S(k.slabOf(surround, 17, 16, P, 5, 0.6), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -124, y: -8.9, w: 32, d: 3.6, r: 1.5 }, 20, 10, P, 4), { tone: "lo", crease: "none" }));
  for (const sx of [-125, -91]) {
    out.push(L(k.sideRing([sx, -5.6, 30.5], 0.9, "y", P, 10), { tone: "lo" }));
    out.push(D([at([sx, -5.6, 30.5])], { size: 0.4 }));
  }
  const tray = { x: -128, y: -6, w: 40, d: 8, r: 1.5 };
  out.push(S(k.slabOf(tray, 13.5, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(tray, 1.4), 16.5, P), { tone: "faint" }));
  const tickets = SLOTS.map(
    (_, i) =>
      `<g data-part="ticket-${i}"${i ? ' style="display:none"' : ""}>${S(k.slabOf({ x: -114, y: -4.5, w: 16, d: 7, r: 1 }, 16.7, 1.3, P, 3), { tone: "hi", crease: "lo" })}${k.faceTextSvg(k.topMatrix([-106, -1, 18.1], 18.1, P, "x"), String(i + 1), { size: 6.5, tone: "hi", anchor: "middle" })}</g>`,
  );
  out.push(`<g data-part="ticket">${tickets.join("")}</g>`);
  out.push(S(k.slabOf(TOP, 34, 4, P, 6, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TOP, 4), TOP_Z, P), { tone: "lo" }));
  const screws = k.corners(TOP, 9);
  out.push(L(screws.map(([sx, sy]) => k.ring(sx, sy, 1.6, TOP_Z, P, 12)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([sx, sy]) => at([sx, sy, TOP_Z])), { size: 0.45 }));
  return out.join("");
}

function rail() {
  const out = [];
  for (const px of POSTS) {
    out.push(S(k.cylinder(px, RAIL_Y, 3.2, TOP_Z, 2.2, P, 20), { tone: "mid" }));
    out.push(S(k.cylinder(px, RAIL_Y, 2.2, TOP_Z, 92 - TOP_Z, P, 18), { tone: "mid", crease: "none" }));
    out.push(L(k.sideArc(px, RAIL_Y, 2.2, 62, P, 16), { tone: "faint" }));
    out.push(L(k.sideArc(px, RAIL_Y, 2.2, 84, P, 16), { tone: "faint" }));
    out.push(S(k.cylinder(px, RAIL_Y, 3, 92, 2.5, P, 20), { tone: "hi" }));
  }
  out.push(S(k.slabOf(BAR, 87, 2, P, 4, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -135, y: -60.6, w: 5, d: 5.2, r: 1.6 }, 86.6, 2.8, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -2, y: -60.6, w: 5, d: 5.2, r: 1.6 }, 86.6, 2.8, P, 3), { tone: "mid" }));
  return out.join("");
}

function coatStatic(s) {
  const out = [];
  out.push(L(k.ring(s, RAIL_Y, 2.7, 88, P, 14), { tone: "lo" }));
  out.push(S(k.cylinder(s, RAIL_Y, 0.8, 82, 5.4, P, 10), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: s - 8, y: -59.7, w: 16, d: 3.4, r: 1.6 }, 79.5, 2.5, P, 4, 0.4), { tone: "mid" }));
  return out.join("");
}

function coatBody(s, tag, index) {
  const shoulders = { x: s - 6.5, y: -57.5, w: 13, d: 5, r: 3 };
  const body = { x: s - 9, y: -58.5, w: 18, d: 6, r: 3.2 };
  const F = G.frameOf([s + 6.5, -52.2, 57.5], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const pieces = (lit) =>
    [
      S(k.slabOf(shoulders, 66, 14.5, P, 5, 0.8), { tone: "hi", crease: "lo", lit }),
      S(k.slabOf(body, 54, 16, P, 6, 0.8), { tone: "hi", crease: "lo", lit, inner: L(k.sideSeam(body, 57, P, 6), { tone: "faint" }) }),
      S(G.disc(-0.7, 0.7, 6, F, P), { tone: "hi", crease: "lo", lit }),
      L(G.circleOf(F, 0.7, 4.4, P, 24), { tone: lit ? "hi" : "lo" }),
      k.faceTextSvg(k.sideMatrix([s + 6.5, -51.4, 57.5], 57.5, P, "left"), String(tag), { size: 6.5, tone: "hi", anchor: "middle" }),
    ].join("");
  return `<g data-part="coat-${index}"><g data-part="bdim-${index}">${pieces(false)}</g><g data-part="blit-${index}" style="display:none">${pieces(true)}</g></g>`;
}

function calendar() {
  const out = [];
  const base = { x: -134, y: -33, w: 24, d: 12, r: 2 };
  out.push(S(k.slabOf(base, TOP_Z, 2, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(base, 1.6), TOP_Z + 2, P), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -131, y: -31.4, w: 18, d: 1.4, r: 0.4 }, 40, 13, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(-0.9, 0.9, 0.9, G.frameOf([-122, -30.7, 52.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]), P), { tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([-129.5, -29.8, 50.5], 50.5, P, "left"), "EXPIRES", { size: 2.1, tone: "mid" }));
  out.push(L(k.segment([-129.9, -30, 48.8], [-114.1, -30, 48.8], P), { tone: "lo" }));
  out.push(L(k.segment([-129.9, -30, 46.9], [-114.1, -30, 46.9], P), { tone: "lo" }));
  out.push(L(k.segment([-129.9, -30, 48.8], [-129.9, -30, 46.9], P), { tone: "lo" }));
  out.push(L(k.segment([-114.1, -30, 48.8], [-114.1, -30, 46.9], P), { tone: "lo" }));
  const grid = k.sideTicks(-128.4, -115.6, 2.3, 4, -30, 46.9, [0.9, 1.5], P);
  out.push(L(grid.minor + grid.major, { tone: "lo" }));
  return out.join("");
}

function comparator() {
  const out = [];
  const top = TOP_Z + DIAL.h;
  out.push(S(k.slabOf({ x: -50.5, y: -23.5, w: 6, d: 5, r: 1.2 }, TOP_Z, 3, P, 3), { tone: "mid" }));
  out.push(S(k.cylinder(DIAL.x, DIAL.y, DIAL.r, TOP_Z, DIAL.h, P, 56, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(DIAL.x, DIAL.y, DIAL.r, top - 3.3, top - 0.3, 56, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(DIAL.x, DIAL.y, DIAL.r, top - 3.3, P, 40), { tone: "faint" }));
  out.push(L(k.ring(DIAL.x, DIAL.y, 11.5, top, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(DIAL.x, DIAL.y, 11.2, 25, 5, top, [0.8, 2], P);
  out.push(L(ticks.minor, { tone: "lo" }));
  out.push(L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(DIAL.x, DIAL.y, 1.6, top, P, 14), { tone: "lo" }));
  out.push(D([at([DIAL.x, DIAL.y, top])], { size: 0.6, tone: "hi" }));
  out.push(S(k.cylinder(GEAR.x, GEAR.y, GEAR.r, TOP_Z, 3.2, P, 26), { tone: "mid" }));
  out.push(L(k.knurl(GEAR.x, GEAR.y, GEAR.r, TOP_Z + 0.4, TOP_Z + 2.8, 18, P), { tone: "lo" }));
  out.push(L(k.ring(GEAR.x, GEAR.y, 3.6, 41.2, P, 20), { tone: "lo" }));
  out.push(L(k.ring(GEAR.x, GEAR.y, 1.3, 41.2, P, 12), { tone: "lo" }));
  out.push(S(k.cylinder(GEAR.x, GEAR.y, 1, 41.2, 1.3, P, 10), { tone: "mid" }));
  return out.join("");
}

function lamp() {
  const out = [];
  out.push(S(k.cylinder(LAMP.x, LAMP.y, 2.6, TOP_Z, 2, P, 18), { tone: "mid" }));
  out.push(S(k.cylinder(LAMP.x, LAMP.y, 0.8, TOP_Z + 2, 4.6, P, 10), { tone: "mid", crease: "none" }));
  out.push(`<g data-part="lamp-off">${S(k.cylinder(LAMP.x, LAMP.y, 1.8, 44.6, 2.4, P, 16), { tone: "lo" })}</g>`);
  out.push(
    `<g data-part="lamp-on" style="display:none">${S(k.cylinder(LAMP.x, LAMP.y, 1.8, 44.6, 2.4, P, 16), { tone: "hi", lit: true })}${L(k.ring(LAMP.x, LAMP.y, 2.5, 44.6, P, 16), { tone: "green" })}</g>`,
  );
  return out.join("");
}

const ROD = G.rodOut(ROD_F, 0, 2, 1.5, P, { stroke: ROD_STROKE });

function press() {
  const out = [];
  out.push(S(k.slabOf(BED, TOP_Z, 2, P, 5, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BED, 1.6), TOP_Z + 2, P), { tone: "faint" }));
  for (const gx of [0.6, 21.7]) {
    out.push(S(k.slabOf({ x: gx, y: -41, w: 1.7, d: 10, r: 0.7 }, TOP_Z + 2, 3.4, P, 3), { tone: "mid" }));
  }
  out.push(
    `<g data-part="plunger"><clipPath id="press-rod-clip"><path data-hold d="${ROD.clip}"/></clipPath><g clip-path="url(#press-rod-clip)">${S(ROD.paths, { tone: "mid", crease: "none" })}</g>${S(k.slabOf(HEAD, 69, 3, P, 5, 0.5), { tone: "hi", crease: "lo" })}</g>`,
  );
  for (const px of [-6, 30]) {
    out.push(S(k.cylinder(px, -38, 3.4, TOP_Z, 1.8, P, 18), { tone: "mid" }));
    out.push(S(k.cylinder(px, -38, 2.6, TOP_Z, 36, P, 16), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf(BEAM, 74, 4, P, 5, 0.8), { tone: "mid" }));
  out.push(D(k.corners(BEAM, 5).map(([bx, by]) => at([bx, by, 78])), { size: 0.45 }));
  out.push(S(k.cylinder(PRESS_X, -36, 2.3, 78, 1.6, P, 14), { tone: "mid" }));
  out.push(S(k.cylinder(PRESS_X, -36, 1.3, 79.6, 1.6, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(PRESS_X, -36, 4, 81.2, 3, P, 26, 0.6), { tone: "mid" }));
  out.push(L(k.knurl(PRESS_X, -36, 4, 81.6, 83.8, 20, P), { tone: "lo" }));
  out.push(L(k.ring(PRESS_X, -36, 3.2, 84.2, P, 18), { tone: "faint" }));
  out.push(L(k.ring(PRESS_X, -36, 0.9, 84.2, P, 10), { tone: "lo" }));
  out.push(S(k.slabOf({ x: 5, y: -30.5, w: 18, d: 5, r: 1 }, 39.6, 0.6, P, 3), { tone: "lo", crease: "none" }));
  out.push(S(k.slabOf({ x: 5, y: -25, w: 18, d: 5, r: 1 }, 39, 0.6, P, 3), { tone: "lo", crease: "none" }));
  return out.join("");
}

function outTray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, TOP_Z, 2.2, P, 5, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 1.4), TOP_Z + 2.2, P), { tone: "faint" }));
  out.push(S(k.slabOf({ x: 0, y: -8.8, w: 24, d: 2, r: 0.9 }, TOP_Z + 2.2, 2.8, P, 4), { tone: "mid" }));
  out.push(D([at([6, -14, TOP_Z + 2.4]), at([18, -14, TOP_Z + 2.4])], { size: 0.4 }));
  out.push(
    `<g data-part="bundle" style="display:none">${S(k.slabOf(BUNDLE, TOP_Z + 2.4, 2.8, P, 4, 0.4), { tone: "hi", crease: "lo", inner: L(k.sideSeam(BUNDLE, 41.8, P, 4), { tone: "faint" }) })}</g>`,
  );
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A cloakroom counter drawn as a freshness and size rig: a base plate carries a long counter with a ticket window and tray, an Expires calendar stand, a comparator dial with two pointers and a gear, a green return lamp, a plunger folding press with a knurled knob, and an out tray. A rail on two posts holds five coats on hangers, each with a numbered claim tag. Handing in a ticket turns the pointers: a match lights the lamp and the same ticket goes back, a mismatch takes the coat down, presses it thinner and hands it out.",
  body: [
    floor(),
    `<g data-part="counter">${counter()}</g>`,
    `<g data-part="rail">${rail()}</g>`,
    ...SLOTS.flatMap((s, i) => [coatStatic(s), coatBody(s, TAGS[i], i)]),
    `<g data-part="calendar">${calendar()}</g>`,
    `<g data-part="comparator">${comparator()}</g>`,
    `<g data-part="lamp">${lamp()}</g>`,
    `<g data-part="press">${press()}</g>`,
    `<g data-part="outtray">${outTray()}</g>`,
    `<g data-part="live"></g>`,
  ],
});

const needleParts = (aA, aB, gearPhase, knobA) => {
  const at = (r, a) => [-62 + r * Math.sin(a), -21 - r * Math.cos(a)];
  const kt = (r, a) => [12 + r * Math.sin(a), -36 - r * Math.cos(a)];
  return (
    lineSvg(lineOnTop(at(-2.4, aA), at(9.7, aA), 46.2, P), { tone: "hi", free: true }) +
    lineSvg(lineOnTop(at(-1.8, aB), at(6.7, aB), 46.2, P), { tone: "lit", free: true }) +
    lineSvg(radialTicks(-46.5, -16, 3.6, 8, 1, 41.2, [2.3, 2.3], P, gearPhase).major, { tone: "lo" }) +
    lineSvg(lineOnTop(kt(0.9, knobA), kt(3.1, knobA), 84.4, P), { tone: "hi", free: true })
  );
};

const live = `
const P = ${JSON.stringify(P)};
const SLOTS = ${JSON.stringify(SLOTS)};
const TAGS = ${JSON.stringify(TAGS)};
const needleParts = ${needleParts.toString()};
const TAU = Math.PI * 2;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const grab = (name) => svg.querySelector('[data-part="' + name + '"]');
const liveG = grab("live");
const ticketG = grab("ticket");
const tickets = SLOTS.map((_, i) => grab("ticket-" + i));
const coats = SLOTS.map((_, i) => grab("coat-" + i));
const dims = SLOTS.map((_, i) => grab("bdim-" + i));
const lits = SLOTS.map((_, i) => grab("blit-" + i));
const lampOff = grab("lamp-off");
const lampOn = grab("lamp-on");
const plunger = grab("plunger");
const bundle = grab("bundle");
const HOME = translateAlong(P, [0, 0, 0]);
const ease = (p) => p * p * (3 - 2 * p);
const wrap = (d) => { d = (d + Math.PI) % TAU; if (d < 0) d += TAU; return d - Math.PI; };
const angOf = (i) => (i / 5) * TAU;
let angA = angOf(0), angB = angOf(TAGS[0] - 1), knobA = 0.6;
let ticketSlide = 0, bundleDy = 0, bundleOut = 0, label = "";
let steps = [], stepI = 0, stepAt = 0, touring = true, current = 0, frame = 0, last = 0, visible = false, idleTimer = 0;

function setLamp(on) { lampOff.style.display = on ? "none" : ""; lampOn.style.display = on ? "" : "none"; }
function setPlunger(dz) {
  plunger.setAttribute("transform", translateAlong(P, [0, 0, dz]));
  holdStill(plunger, axisVector(P, [0, 0, dz]));
}
function setBundle() { bundle.setAttribute("transform", translateAlong(P, [0, bundleDy + bundleOut, 0])); }
function coatAt(i, off) { coats[i].setAttribute("transform", off ? translateAlong(P, off) : HOME); }

function present(i, instant) {
  current = i;
  const tag = TAGS[i];
  const match = tag === i + 1;
  const a0 = angA, b0 = angB;
  const a1 = angOf(i), b1 = angOf(tag - 1);
  tickets.forEach((el, n) => (el.style.display = n === i ? "" : "none"));
  coats.forEach((el, n) => { el.style.display = ""; coatAt(n, null); dims[n].style.display = ""; lits[n].style.display = "none"; });
  bundle.style.display = "none"; bundleDy = 0; bundleOut = 0; setBundle();
  setPlunger(0); ticketSlide = 0; setLamp(false);
  lits[i].style.display = ""; dims[i].style.display = "none";
  label = "ticket " + (i + 1) + " · tag " + tag + " · checking";
  if (instant) {
    angA = a1; angB = b1;
    if (match) { setLamp(true); label = "ticket " + (i + 1) + " · tag " + tag + " · same ticket"; }
    else {
      coats[i].style.display = "none"; bundle.style.display = ""; bundleDy = 12; bundleOut = 1.2; setBundle();
      label = "ticket " + (i + 1) + " · folded · handed out";
    }
    steps = [];
    draw();
    return;
  }
  const sweep = { d: 0.85, tick: (p) => { const e = ease(p); angA = a0 + wrap(a1 - a0) * e; angB = b0 + wrap(b1 - b0) * e; } };
  let k0 = 0;
  if (match) {
    steps = [sweep,
      { d: 0.05, start: () => { setLamp(true); label = "ticket " + (i + 1) + " · tag " + tag + " · same ticket"; } },
      { d: 0.45, tick: (p) => (ticketSlide = ease(p) * 2.6) },
      { d: 0.45, tick: (p) => (ticketSlide = 2.6 * (1 - ease(p))) },
      { d: 1.55 },
      { d: 0.05, start: () => setLamp(false) },
    ];
  } else {
    const vs = [[0, 8, -5], [12 - SLOTS[i], 0, 0], [0, 0, -8], [0, 11.5, 0], [0, 0, -1]];
    let ph = [0, 0, 0, 0, 0];
    const apply = () => {
      const off = [0, 0, 0];
      for (let n = 0; n < 5; n++) { off[0] += vs[n][0] * ph[n]; off[1] += vs[n][1] * ph[n]; off[2] += vs[n][2] * ph[n]; }
      coatAt(i, off);
    };
    steps = [sweep,
      { d: 0.1, start: () => (label = "ticket " + (i + 1) + " · tag " + tag + " · refold") },
      { d: 0.5, tick: (p) => { ph[0] = ease(p); apply(); } },
      { d: 0.65, tick: (p) => { ph[1] = ease(p); apply(); } },
      { d: 0.5, tick: (p) => { ph[2] = ease(p); apply(); } },
      { d: 0.5, tick: (p) => { ph[3] = ease(p); apply(); } },
      { d: 0.3, tick: (p) => { ph[4] = ease(p); apply(); } },
      { d: 0.38, start: () => (k0 = knobA), tick: (p) => { const e = ease(p); setPlunger(-16 * e); knobA = k0 + e * TAU; } },
      { d: 0.1, start: () => { coats[i].style.display = "none"; bundle.style.display = ""; } },
      { d: 0.34, start: () => (k0 = knobA), tick: (p) => { const e = ease(p); setPlunger(-16 * (1 - e)); knobA = k0 + e * Math.PI; } },
      { d: 0.55, tick: (p) => { bundleDy = ease(p) * 12; setBundle(); } },
      { d: 0.3, start: () => (label = "ticket " + (i + 1) + " · folded · handed out"), tick: (p) => { bundleOut = ease(p) * 1.2; setBundle(); } },
      { d: 1.6 },
      { d: 0.16, start: () => { bundle.style.display = "none"; coats[i].style.display = ""; }, tick: (p) => { ph[4] = 1 - ease(p); apply(); } },
      { d: 0.16, tick: (p) => { ph[3] = 1 - ease(p); apply(); } },
      { d: 0.16, tick: (p) => { ph[2] = 1 - ease(p); apply(); } },
      { d: 0.22, tick: (p) => { ph[1] = 1 - ease(p); apply(); } },
      { d: 0.16, tick: (p) => { ph[0] = 1 - ease(p); apply(); } },
    ];
  }
  stepI = 0; stepAt = 0;
  if (steps[0] && steps[0].start) steps[0].start();
  run();
}

function draw() {
  const markup = needleParts(angA, angB, angA + angB, knobA);
  if (liveG.innerHTML !== markup) liveG.innerHTML = markup;
  ticketG.setAttribute("transform", translateAlong(P, [0, ticketSlide, 0]));
  if (readout.textContent !== label) readout.textContent = label;
  stage.setAttribute("aria-valuenow", String(current + 1));
  stage.setAttribute("aria-valuetext", label);
}

function finished() { if (touring) present((current + 1) % SLOTS.length, false); }

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (steps.length) {
    stepAt += dt;
    let step = steps[stepI];
    while (step && stepAt >= step.d) {
      if (step.tick) step.tick(1);
      stepAt -= step.d; stepI += 1; step = steps[stepI];
      if (step && step.start) step.start();
    }
    if (!step) { steps = []; finished(); }
    else if (step.tick) step.tick(stepAt / step.d);
  }
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}

const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };

const steer = (next) => {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches) return;
    touring = true;
    if (!steps.length) present((current + 1) % SLOTS.length, false); else run();
  }, 4200);
  const i = Math.max(0, Math.min(SLOTS.length - 1, next));
  if (i !== current) present(i, still.matches); else run();
};

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = Math.max(0, Math.min(0.999, (event.clientX - box.left) / box.width));
  steer(Math.floor(share * SLOTS.length));
});
stage.addEventListener("pointerleave", () => steer(current));
stage.addEventListener("keydown", (event) => {
  let to = null;
  const digit = /^Digit([1-5])$/.exec(event.code) || /^Numpad([1-5])$/.exec(event.code);
  if (digit) to = Number(digit[1]) - 1;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") to = current + 1;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") to = current - 1;
  if (to === null) return;
  event.preventDefault();
  steer(to);
});
if (still.matches) touring = false;
present(0, still.matches);
`;

const body = k.plateHtml({
  fig: "Fig 7",
  title: "Freshness and size",
  hint: "Type 1–5 or sweep the rail to hand in a ticket",
  readout: "ticket 1 · tag 1 · same ticket",
  keys: [
    { mark: "green", label: "Green lamp: tag matches ticket — 304 Not Modified, no coat comes down" },
    { mark: "lit", label: "Claim tags: the ETag, a checksum of Modified + Length" },
    { mark: "dim", label: "Press and out tray: the coat folded to what Accept-Encoding admits" },
  ],
  caption:
    "The cloakroom keeps no spare copies: freshness is left to HTTP itself. A coat's tag is its ETag — a checksum of Modified and Length — so a ticket that still matches gets the very same ticket back as 304 Not Modified and the coat stays on the rail. A stale ticket brings the coat down and the press hands it out folded — brotli, gzip or zstd, whichever Accept-Encoding admits — while the Expires card on the counter says how long a client may trust what it holds.",
  body: `${pdfButton(`cloakroom-detailed-a4.pdf`)}<div class="iso-stage" tabindex="0" role="slider" aria-label="Cloakroom: keys 1 to 5 hand in a claim ticket" aria-valuemin="1" aria-valuemax="5" aria-valuenow="1">${svg}</div>`,
});

writeFileSync(join(HERE, theme === "light" ? "index-light.html" : "index.html"), k.pageHtml({ title: "Freshness and size — the cloakroom", theme, body, script: kitScript() + live }));
console.log("wrote", theme === "light" ? "index-light.html" : "index.html");

if (process.argv.includes("--debug")) {
  const probes = {
    coat1Hanger: [-114, -58, 84],
    coat1Tag: [-107.5, -52, 57.5],
    dialPivot: [-62, -21, 46],
    pressMouth: [12, -36, 58],
    tray: [12, -13, 41],
    ticket: [-106, -1, 18],
    lamp: [-28, -28, 46],
    calendar: [-122, -30, 47],
  };
  for (const [name, point] of Object.entries(probes)) console.log(name, k.iso(point, P).map((n) => Math.round(n)));
}
