const stage = (n) => `[data-part="station-${n}"]`;

export default {
  page: "index-light.html",
  out: "ioxide-exchange",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: {},
    s2: { actions: [["key", "ArrowRight"], ["wait", 250]] },
    s3: { actions: [["key", "ArrowRight"], ["key", "ArrowRight"], ["wait", 250]] },
    s4: { actions: [["key", "ArrowRight"], ["key", "ArrowRight"], ["key", "ArrowRight"], ["wait", 250]] },
  },

  name: "Ioxide",
  title: "the io_uring exchange",
  number: "GHTTP-01",
  tagline: "GenHTTP's native Linux engine",
  question: "How does a request wait for the network without a single syscall?",
  lead: "One reactor thread per core, each with its own io_uring ring of 8192 entries. Connections arrive on trunk ports — TCP with TLS and QUIC over UDP for HTTP/3 — and every reactor serves any of them. Each posted ticket is a submission; each lit one, a completion.",
  quote: "each posted ticket is a submission; each lit one, a completion",
  numbers: [
    ["1", "ring", "io_uring instance per core"],
    ["8192", "entries", "submissions and completions per ring"],
    ["4096", "slots", "receive buffers per reactor, 32 KiB each"],
    ["0", "syscalls", "spent waiting for work to arrive"],
    ["3", "protocols", "HTTP/1.1, HTTP/2 and HTTP/3 on one host"],
  ],
  spec: [
    ["Engine", "Ioxide, NuGet 0.15.251"],
    ["Reactors", "one pinned thread per core"],
    ["Ring", "8192 entries, DEFER_TASKRUN"],
    ["Receive", "4096 slots × 32 KiB, pre-allocated"],
    ["TLS", "OpenSSL, ALPN, optional kernel TLS"],
    ["HTTP/3", "ngtcp2 + nghttp3 over QUIC"],
    ["Parser", "Glyph11, hardened HTTP/1.1 + h2"],
  ],
  why: {
    title: "Why a ring per core?",
    text: "epoll asks the kernel what is ready, then reads each socket. io_uring is two shared ring buffers: submissions go in one side and completions appear on the other without a syscall per event. One ring per core with DEFER_TASKRUN means a request lives its whole life on one core.",
  },

  parts: [
    { id: "panel", name: "Trunk panel", say: "Two listener ports, plain and TLS; the small block is kernel TLS.", select: '[data-part="panel"]' },
    { id: "radio", name: "Radio mast", say: "QUIC over UDP — ngtcp2 and nghttp3 feed HTTP/3 in from the air.", select: '[data-part="radio"]' },
    { id: "block", name: "Distribution block", say: "Where cords meet: the junction the completions call back through.", select: '[data-part="block"]' },
    { id: "s1", name: "Operator 1", say: "Reactor on core 1, patching calls on its own ring.", select: stage(1) },
    { id: "s2", name: "Operator 2", say: "Reactor on core 2; its cord rests on the hook between calls.", select: stage(2) },
    { id: "s3", name: "Operator 3", say: "Reactor on core 3, fed from the second trunk port.", select: stage(3) },
    { id: "s4", name: "Operator 4", say: "Reactor on core 4, fed through the distribution block.", select: stage(4) },
    { id: "pool", name: "Request pool", say: "Request objects dealt from a tray, not allocated on the call path.", select: '[data-part="pool"]' },
    { id: "cord2", name: "Patch cord", say: "One cord per live connection, port to operator.", select: '[data-part="cord2"]' },
  ],

  main: { view: "rest" },
  inset: { label: "Reactor 4 on duty", view: "s4" },
  steps: [
    { view: "rest", title: "The call lands", text: "A connection arrives on a trunk port. The kernel accepted it already; the trunk cord is waiting at the port plate.", focus: ["panel", "cord2"] },
    { view: "rest", title: "A reactor picks up", text: "Operator 1's lamp lights and the duty flag goes up: this call belongs to reactor 1 until it is answered.", focus: ["s1"] },
    { view: "rest", title: "The ring turns", text: "Each completion advances the patch ring one slot. The readout counts completions — work reaped without waiting on a syscall.", focus: ["s1", "pool"] },
    { view: "s3", title: "Hand-off, not migration", text: "Another port, another operator: every core's ring runs on its own pinned thread, so a call hands off cleanly — through the distribution block, same four-method handler at the end.", focus: ["s3", "cord2", "block"] },
    { view: "rest", title: "Radio, no wires", text: "QUIC skips the trunk panel entirely: the mast feeds HTTP/3 streams straight into the exchange, one handler call per stream.", focus: ["radio", "cordm"] },
  ],
  details: [
    { title: "Trunk panel", text: "ALPN negotiates h2 on the TLS port; without it the driver peeks for the HTTP/2 preface and falls through to HTTP/1.1. Kernel TLS moves cipher work to the NIC.", around: ["panel"], focus: ["panel"] },
    { title: "A patch ring", text: "Twelve slots around one ring — the ring's entries. The lit dot is the completion being reaped right now.", around: ["s1"], focus: ["s1"] },
    { title: "The mast", text: "QUIC needs its own timeouts, datagram routing and peer-migration pinning, so the mast is guyed like the real thing.", around: ["radio"], focus: ["radio"] },
  ],
};
