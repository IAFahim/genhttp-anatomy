const at = (name) => `[data-part="${name}"]`;
const tap = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "filter-stack",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: {},
    blocked: tap("1"),
    cached: tap("4"),
    bare: { actions: [["key", "1"], ["key", "2"], ["key", "3"], ["key", "1"], ["wait", 300]] },
  },

  name: "Chain",
  title: "the concern chain",
  number: "GHTTP-04",
  tagline: "middleware without a middleware framework",
  question: "How does a request pass through auth, CORS and caching without a pipeline framework?",
  lead: "A concern is a handler that owns its inner handler, and Concerns.Chain folds the builders around the tree: the first concern added becomes the outermost ring, so the order in source is the order a request meets. Here auth sits before CORS, compression and caching — close its shutter and nothing downstream sees light at all.",
  quote: "the first concern added becomes the outermost ring",
  numbers: [
    ["4", "rings", "auth, CORS, compression, caching on this bench"],
    ["17", "shipped", "concerns across the standard modules"],
    ["1st", "added", "is the outermost — met first, every time"],
    ["365", "days", "HSTS preload default on StrictTransport"],
    ["1", "call", "host.Defaults(...) wires the common rings"],
  ],
  spec: [
    ["Interface", "IConcern : IHandler, owns Content"],
    ["Chain", "Concerns.Chain(builders, tree)"],
    ["Order", "first added is outermost"],
    ["Root", "compliance, errors, concerns, logging"],
    ["Scoped", ".Add(...) chains one subtree"],
    ["Defaults", "host.Defaults(...) in one call"],
    ["Errors", "ErrorHandler via IErrorMapper<T>"],
  ],
  why: {
    title: "Why not middleware?",
    text: "A pipeline framework needs its own interface, its own ordering rules and its own composition root. A concern is only a handler that holds the next handler — so the same two-method contract runs the cross-cutting layers, they compose with every module by construction, and any ring can be lifted off without touching the others.",
  },

  parts: [
    { id: "lamp", name: "The lamp", say: "One request, heading in along the rail.", select: at("lamp") },
    { id: "f0", name: "Auth ring", say: "With a shutter: closed, nothing passes it at all.", select: at("f0") },
    { id: "f1", name: "CORS ring", say: "A slit: per-origin policy on methods, headers, credentials.", select: at("f1") },
    { id: "f2", name: "Compression ring", say: "A lens: brotli, gzip or zstd on compressible responses.", select: at("f2") },
    { id: "f3", name: "Cache ring", say: "A mirror: ETag in, If-None-Match answered with a 304.", select: at("f3") },
    { id: "meter", name: "The meter", say: "The response — only the light that got through, read here.", select: at("meter") },
  ],

  main: { view: "rest" },
  inset: { label: "Auth closed", view: "blocked" },
  steps: [
    { view: "rest", title: "First added, first met", text: "Auth sits outermost, then CORS, then compression: Concerns.Chain folds the builders so source order is encounter order.", focus: ["f0", "f1", "f2"] },
    { view: "blocked", title: "Close the shutter", text: "Auth refuses the request and the chain stops there — nothing downstream sees light; the error concern writes the answer.", focus: ["f0"] },
    { view: "cached", title: "The 304 return", text: "The cache mirror answers from light it already holds: same content, nothing re-sent, one 304 straight back along the rail.", focus: ["f3", "meter"] },
    { view: "bare", title: "Every ring removable", text: "Strip all four and the raw handler still serves, unfiltered. host.Defaults(...) is a convenience, never a requirement.", focus: ["lamp", "meter"] },
    { view: "rest", title: "The host builds the same way", text: "Compliance, errors, your concerns, logging: the server's root is one Concerns.Chain too, and .Add(...) scopes another to any subtree.", focus: ["f0", "meter"] },
  ],
  details: [
    { title: "The shutter", text: "Authentication resolves the user into request.SetUser(...) — or blocks. As a ring it guards everything screwed inside it.", around: ["f0"], focus: ["f0"] },
    { title: "The lens", text: "CompressedContent rebuilds the response in place: brotli, gzip and zstd, filtered by compressible type, minimum size and Accept-Encoding.", around: ["f2"], focus: ["f2"] },
    { title: "The mirror", text: "ClientCache.Validation() generates the ETag and answers If-None-Match with a 304 — the return lamp on the bench.", around: ["f3"], focus: ["f3"] },
  ],
};
