const at = (name) => `[data-part="${name}"]`;
const hand = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "cloakroom",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    match: {},
    match2: hand("2"),
    stale: hand("3"),
    stale2: hand("4"),
  },

  name: "304",
  title: "freshness and size",
  number: "GHTTP-07",
  tagline: "the cloakroom keeps no spare copies",
  question: "How does a response stay fresh without a cache to go stale?",
  lead: "Freshness is left to HTTP itself. A coat's tag is its ETag — a checksum of Modified and Length — so a ticket that still matches gets the very same ticket back as 304 Not Modified and the coat stays on the rail. A stale ticket brings the coat down and the press hands it out folded — brotli, gzip or zstd, whichever Accept-Encoding admits.",
  quote: "unchanged content costs a stat, not a hash",
  numbers: [
    ["0", "copies", "no server-side content cache, by design"],
    ["2", "fields", "in the ETag checksum: Modified + Length"],
    ["3", "codecs", "brotli, gzip, zstd against Accept-Encoding"],
    ["304", "on match", "same ticket back, coat stays on the rail"],
  ],
  spec: [
    ["Validator", "ETag from CalculateChecksumAsync"],
    ["Match", "If-None-Match rewrites to 304"],
    ["Policy", "ClientCache.Policy() adds Expires"],
    ["Compression", "CompressedContent.Default()"],
    ["Rebuild", "same pooled response, new wrapper"],
    ["Pre-compressed", ".br / .gzip siblings served directly"],
    ["Ranges", "RangeSupport through a RangedSink"],
  ],
  why: {
    title: "Why no cache?",
    text: "A server-side cache can serve stale bytes; a validator cannot. The ETag derives from the content's identity — Modified plus Length — so revalidation checks the truth itself, and a 304 costs only the comparison. Size is the client's call: compression respects Accept-Encoding, and nothing is folded that was already folded.",
  },

  parts: [
    { id: "ticket", name: "The claim ticket", say: "If-None-Match, handed in at the counter.", select: at("ticket") },
    { id: "comparator", name: "The comparator", say: "Two dials compared: the ticket against the coat's tag.", select: at("comparator") },
    { id: "coat2", name: "A coat on the rail", say: "The representation, its tag the ETag — checksum of Modified + Length.", select: at("coat-1") },
    { id: "lamp", name: "The green lamp", say: "Tag matches: 304 Not Modified, no coat comes down.", select: at("lamp") },
    { id: "press", name: "The press", say: "Brotli, gzip or zstd — the coat folded to what the client admits.", select: at("press") },
    { id: "tray", name: "The out tray", say: "The folded bundle handed over the counter.", select: at("outtray") },
    { id: "calendar", name: "The Expires card", say: "How long a client may trust what it holds.", select: at("calendar") },
  ],

  main: { view: "match" },
  inset: { label: "A stale ticket", view: "stale" },
  steps: [
    { view: "match", title: "No spare copies", text: "The coat hangs on the rail and the cloakroom keeps nothing else. Its tag is an ETag checksummed from Modified and Length.", focus: ["coat2", "ticket"] },
    { view: "match", title: "Match: the same ticket", text: "If-None-Match still matches, so the response is rewritten to 304 Not Modified in place — the coat never leaves the rail.", focus: ["comparator", "lamp"] },
    { view: "stale", title: "Stale: the coat comes down", text: "A stale ticket re-wraps: the representation is rebuilt — same pooled response, new compressed content.", focus: ["press", "coat2"] },
    { view: "stale", title: "Folded to size", text: "Only compressible types above a minimum size are pressed; already-compressed content is skipped, and .br siblings are served straight away.", focus: ["press", "tray"] },
    { view: "match", title: "Trust, with a date", text: "ClientCache.Policy() adds Expires to GET/200 responses — how long the client may trust its coat before asking again.", focus: ["calendar"] },
  ],
  details: [
    { title: "The comparator", text: "CacheValidationHandler compares the computed checksum with If-None-Match — and documents both headers through IDocumentedConcern.", around: ["comparator"], focus: ["comparator"] },
    { title: "The press", text: "CompressedContent rebuilds through IResponse.Rebuild(): brotli, gzip and zstd, chosen against Accept-Encoding.", around: ["press"], focus: ["press"] },
    { title: "The card", text: "Expires is stamped as RFC 1123, for GET and 200 responses, gated by an optional predicate.", around: ["calendar"], focus: ["calendar"] },
  ],
};
