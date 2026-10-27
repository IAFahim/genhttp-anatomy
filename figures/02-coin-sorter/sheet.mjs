const at = (name) => `[data-part="${name}"]`;

const pose = (p, l, s) => `(window.__fig.pose(${p}, ${l}, ${s}), "ok")`;
const BR = "window.__fig.BRIDGE", AN = "window.__fig.ANVIL", T = "window.__fig.TRAY";
const still = (js) => ({ actions: [["eval", js], ["wait", 250]] });

export default {
  page: "index-light.html",
  out: "coin-sorter",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: still(pose(0, 0, 8)),
    bridge: still(pose(0, 0, `window.__fig.BRIDGE`)),
    gate: still(pose(0, 0, `window.__fig.BRIDGE + 20`)),
    press: still(pose(1, 0, `window.__fig.ANVIL + 2`)),
    tray404: still(pose(1, 1, `window.__fig.TRAY[1]`)),
    trayerr: still(pose(1, 2, `window.__fig.TRAY[2]`)),
    return0: still(pose(1, 0, `window.__fig.TRAY[0]`)),
  },

  name: "Minted: 0",
  title: "the zero-alloc exchange",
  number: "GHTTP-02",
  tagline: "one coin, round the machine, forever",
  question: "What does one request cost the garbage collector?",
  lead: "Every exchange runs one coin round the machine. The reading bridge is Glyph11: headers become zero-copy ByteString views over the request buffer — no strings minted. The gate is the handler tree, the press is serialization, and the return chute empties back into the pool.",
  quote: "the same coin circulates forever: nothing is minted",
  numbers: [
    ["0", "minted", "allocations on the whole exchange"],
    ["1024", "deep", "per-thread stack of pooled Requests"],
    ["0", "copies", "headers are views over the read buffer"],
    ["20", "bytes", "of digit buffer cover any content-length"],
  ],
  spec: [
    ["Parser", "Glyph11, UltraHardenedParser"],
    ["Headers", "ByteString views, hash precomputed"],
    ["Generated", "[MemoryView] source generator"],
    ["Requests", "[ThreadStatic] pool, 1024 max"],
    ["Bodies", "Pipelines — streamed, not buffered"],
    ["Sinks", "RegularSink or ChunkedSink"],
    ["Pipelining", "next request parses from the buffer"],
  ],
  why: {
    title: "Why views, not strings?",
    text: "A header read as a C# string allocates on every request and again for every lookup hash. A ByteString is a struct over the bytes already in the buffer, with its hash computed once by the [MemoryView] generator — parsing, matching and hashing stop costing anything at all.",
  },

  parts: [
    { id: "hopper", name: "Hopper", say: "Accepted connections queue here to be dealt one at a time.", select: at("hopper") },
    { id: "coin", name: "The coin", say: "One pooled Request, reused every exchange.", select: at("coin") },
    { id: "bridge", name: "Reading bridge", say: "Glyph11 weighs the headers into zero-copy views.", select: at("bridge") },
    { id: "flap", name: "Routing gate", say: "The handler tree's answer: response, null, or thrown.", select: at("flap") },
    { id: "press", name: "The press", say: "Status line and headers stamped out as raw UTF-8.", select: at("press") },
    { id: "tray0", name: "Handler tray", say: "Where answered requests land before the return.", select: at("tray-0") },
    { id: "tray1", name: "404 tray", say: "A null answer drops the coin here.", select: at("tray-1") },
    { id: "tray2", name: "Error tray", say: "A thrown one is mapped to a status and lands here.", select: at("tray-2") },
    { id: "tube", name: "Return tube", say: "Drained, reset and blown back to the pool.", select: at("tube") },
    { id: "pool", name: "The pool", say: "Spare coins: 1024 Requests deep, per thread.", select: at("pool") },
  ],

  main: { view: "rest" },
  inset: { label: "The 404 lane", view: "tray404" },
  steps: [
    { view: "rest", title: "One coin, dealt again", text: "The request object is rented from a per-thread stack — up to 1024 deep. The same coin runs the machine forever; the readout never minted one.", focus: ["coin", "pool"] },
    { view: "bridge", title: "The reading bridge", text: "Glyph11's hardened parser reads the head of the stream: every header becomes a ByteString view over bytes already in memory, hash precomputed.", focus: ["bridge"] },
    { view: "gate", title: "The gate decides", text: "The handler tree answers. A response routes on; a null drops the coin in the 404 tray; a thrown error is mapped and takes the third lane.", focus: ["flap"] },
    { view: "press", title: "The stamping press", text: "Serialization: status line and headers as raw UTF-8 — server and date cached — then the body drives a Regular or Chunked sink.", focus: ["press"] },
    { view: "return0", title: "Back to the tray", text: "Drain unread bodies, reset the state, re-pool the object. If bytes are already buffered, the next request parses immediately.", focus: ["tube", "pool"] },
  ],
  details: [
    { title: "The gauge", text: "The dial swings as the bridge reads: parsing cost, weighed in allocations, pinned at zero.", around: ["bridge"], focus: ["bridge"] },
    { title: "The gate", text: "Three lanes, labelled handler, 404 and error — the three shapes an IHandler answer can take.", around: ["flap"], focus: ["flap"] },
    { title: "The pool", text: "Coins stacked and waiting. Rent, run, return: the pool makes allocation a decision, not an accident.", around: ["pool"], focus: ["pool"] },
  ],
};
