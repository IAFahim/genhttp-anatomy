const at = (name) => `[data-part="${name}"]`;

const key = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "signal-box",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: {},
    files: key("2"),
    spa: key("3"),
    spur: key("4"),
  },

  name: "IHandler",
  title: "the handler tree",
  number: "GHTTP-03",
  tagline: "two methods, socket to lambda",
  question: "What does every part of a GenHTTP server have in common?",
  lead: "Every part of GenHTTP is the same two-method IHandler: PrepareAsync warms the tree once before the first connection, HandleAsync answers the request. The lever frame is the builder, the points are the segment match, and every road ends somewhere — a response, or the dead spur that becomes a 404.",
  quote: "the handler tree is the whole story, and it fits on a postcard",
  numbers: [
    ["2", "methods", "PrepareAsync warms, HandleAsync answers"],
    ["4", "roads", "three handlers and one dead spur"],
    ["null", "→ 404", "what an unclaimed segment returns"],
    ["1", "interface", "no separate middleware, ever"],
    ["0", "special cases", "not even for the root of the tree"],
  ],
  spec: [
    ["Root", "CoreRouter wraps your tree"],
    ["Order", "compliance, errors, concerns, logging"],
    ["Segment", ".Add(segment, handler)"],
    ["Fallback", ".Add(handler), ordered"],
    ["Root page", ".Index(handler), trailing slash forced"],
    ["Hosts", "VirtualHosts.Create(), routed on Host"],
    ["Adapter", "AspNetCore apps map onto handlers"],
  ],
  why: {
    title: "Why one interface?",
    text: "One two-method contract from the socket to your lambda means every module composes with every other by construction — no middleware interface distinct from handlers, no special case for the root, no hidden global state. That is also what makes the three-engine promise testable.",
  },

  parts: [
    { id: "loco", name: "The train", say: "One request, running the road the points set.", select: at("loco") },
    { id: "cabin", name: "The signal box", say: "The builder: .Add(segment, handler) hangs a platform on each branch.", select: at("cabin") },
    { id: "api", name: "Platform api", say: "A routed segment — webservices, proxies, anything with a handler.", select: at("platform-api") },
    { id: "files", name: "Platform files", say: "Assets and trees: static files are handlers like any other.", select: at("platform-files") },
    { id: "spa", name: "Platform spa", say: "A single-page app, with its fallback to index.html.", select: at("platform-spa") },
    { id: "spur", name: "The dead spur", say: "No handler claims it: HandleAsync returns null.", select: at("track") },
    { id: "signals", name: "Signals", say: "Arm dropped, lamp lit — the road that answered.", select: at("signals") },
  ],

  main: { view: "rest" },
  inset: { label: "The dead spur", view: "spur" },
  steps: [
    { view: "rest", title: "Two methods, one tree", text: "The train enters at the root. PrepareAsync warmed every road once before the first connection; now HandleAsync answers.", focus: ["loco", "track"] },
    { view: "files", title: "The points set", text: "The segment match throws the points: .Add(\"files\", handler) hung this platform on the branch when the tree was built.", focus: ["cabin", "files"] },
    { view: "spa", title: "Every road ends somewhere", text: "api, files, spa — webservices, asset trees, single-page apps. All handlers, so all of them compose.", focus: ["spa", "signals"] },
    { view: "spur", title: "The dead spur", text: "No handler claims the road, so HandleAsync returns null — and the concern chain around the tree turns that into a 404.", focus: ["spur"] },
    { view: "rest", title: "One address per page", text: "At the root the layout forces a trailing slash by redirecting, so the same content is never served at two URLs.", focus: ["cabin"] },
  ],
  details: [
    { title: "The lever frame", text: "The builder API: segments, ordered fallbacks and the root index, composed into one handler by Concerns.Chain.", around: ["cabin"], focus: ["cabin"] },
    { title: "A platform", text: "One .Add(segment, handler): multi-segment strings like \"api/v1\" split and merge into child layouts on the way in.", around: ["api"], focus: ["api"] },
    { title: "The train", text: "The same IRequest reaches every platform — the Kestrel engine and the ASP.NET Core adapter hand their contexts over as exactly this.", around: ["loco"], focus: ["loco"] },
  ],
};
