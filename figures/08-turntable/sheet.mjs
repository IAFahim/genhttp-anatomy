const at = (name) => `[data-part="${name}"]`;
const couple = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "turntable",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: {},
    e2: couple("2"),
    e3: couple("3"),
  },

  name: "Anywhere",
  title: "the engine turntable",
  number: "GHTTP-08",
  tagline: "three engines, one application",
  question: "What if the web server were a decision you could defer?",
  lead: "The same application couples to any of three engines through one IServerHost: the threaded Internal engine (HTTP/1.1, embedding), Kestrel (the ASP.NET edge), and Ioxide (io_uring on Linux, HTTP/1.1 to HTTP/3). The meta-packages differ only in the engine dependency, and every acceptance test runs against every engine.",
  quote: "the architecture, not a trick, is the performance story",
  numbers: [
    ["3", "engines", "Internal, Kestrel, Ioxide"],
    ["2", "faces", "IServerHost above, IServer below"],
    ["1", "hook", "each engine overrides a single Build(...)"],
    ["1", "NuGet id", "to switch — the meta-packages differ only there"],
    ["0", "code changes", "to move the application between engines"],
  ],
  spec: [
    ["Contract", "IServerHost / IServer"],
    ["Skeleton", "Engine/Shared/Hosting/ServerHost.cs"],
    ["Internal", "GenHTTP.Core — embed, HTTP/1.1"],
    ["Kestrel", "GenHTTP.Core.Kestrel — the ASP.NET edge"],
    ["Ioxide", "GenHTTP.Core.Ioxide — io_uring, Linux"],
    ["Bridge", "HttpContext to IRequest, both directions"],
    ["Tested", "every acceptance test, every engine"],
  ],
  why: {
    title: "Why three engines?",
    text: "The right engine is a deployment decision: embedded inside a desktop app, on the ASP.NET edge of an existing estate, or on bare Linux with io_uring. Because all three keep one contract — and a wire-level test suite fails if any of them drifts — the decision stays deferrable and reversible without touching application code.",
  },

  parts: [
    { id: "coach", name: "The coach", say: "Your application, unchanged, coupled to whichever engine faces the road.", select: at("coach") },
    { id: "deck", name: "The turntable", say: "IServerHost: one coupling face shared by every engine.", select: at("deck") },
    { id: "e1", name: "Internal", say: "Managed sockets, thread-per-connection, HTTP/1.1 — for embedding.", select: at("engine-1") },
    { id: "e2", name: "Kestrel", say: "A hosting engine: ASP.NET Core does transport, GenHTTP keeps handlers.", select: at("engine-2") },
    { id: "e3", name: "Ioxide", say: "io_uring per core on Linux, HTTP/1.1 to HTTP/3.", select: at("engine-3") },
    { id: "pit", name: "The pit", say: "The inspectable core below: endpoints, logging, the root router.", select: at("pit") },
  ],

  main: { view: "rest" },
  inset: { label: "Ioxide coupled", view: "e3" },
  steps: [
    { view: "rest", title: "One contract, two faces", text: "IServerHost is the public hosting API; IServer is what it builds. Each engine overrides a single Build(...) hook — your code does not change.", focus: ["deck", "coach"] },
    { view: "rest", title: "Coupled: Internal", text: "Thread-per-connection managed sockets with Glyph11 parsing: the engine a desktop app embeds, or a service behind a reverse proxy.", focus: ["e1", "coach"] },
    { view: "e2", title: "Coupled: Kestrel", text: "A real WebApplication is built and every HttpContext is bridged into the GenHTTP pipeline — Kestrel does transport, GenHTTP owns responses.", focus: ["e2", "coach"] },
    { view: "e3", title: "Coupled: Ioxide", text: "Native io_uring on Linux, reactors per core, HTTP/1.1 through HTTP/3 — the same handlers, a different kernel story.", focus: ["e3", "coach"] },
    { view: "e3", title: "Proven, not promised", text: "MultiEngineTest runs every wire-level acceptance test against every engine, and CI turns on io_uring, kTLS and libmsquic to exercise the native path.", focus: ["e3", "pit"] },
  ],
  details: [
    { title: "The deck", text: "ServerHost collects endpoints and concerns, applies defaults, assembles the root CoreRouter — then calls the engine's Build.", around: ["deck"], focus: ["deck"] },
    { title: "The coach", text: "Handlers, concerns and responses are engine-independent by construction; websockets and SSE are specified at the response level.", around: ["coach"], focus: ["coach"] },
    { title: "The Ioxide road", text: "CI loads the tls module for kTLS and libmsquic for HTTP/3, so the native path is exercised, not skipped.", around: ["e3"], focus: ["e3"] },
  ],
};
