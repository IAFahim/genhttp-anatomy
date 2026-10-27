const at = (name) => `[data-part="${name}"]`;
const aim = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "surveyor",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    s1: aim("1"),
    s2: aim("2"),
    s3: aim("3"),
    cached: aim("1"),
  },

  name: "As-built",
  title: "the OpenAPI generator",
  number: "GHTTP-06",
  tagline: "surveyed from the live handler tree",
  question: "How does the OpenAPI document stay true to what the server serves?",
  lead: "ApiDescription crawls the live handler tree — concerns, then layout, then service methods — instead of a parallel description. The document is drawn from what actually answers, its schemas come from the same serializer options you serve with, and it is cached with a checksum and served content-negotiated as JSON or YAML.",
  quote: "the document is generated from the real thing, not from a description of it",
  numbers: [
    ["5", "explorers", "concern, layout, service, collection, method"],
    ["1", "source", "the live handler graph, never a parallel model"],
    ["2", "formats", "JSON or YAML, by content negotiation"],
    ["1", "line", ".AddOpenApi() puts it on your host"],
    ["0", "drift", "what answers is what is documented"],
  ],
  spec: [
    ["Chain", "Concern, Layout, Service, Collection, Method"],
    ["Source", "the live handler tree itself"],
    ["Schemas", "NJsonSchema on your serializer options"],
    ["Cache", "checksummed via OpenApiConcernBuilder"],
    ["Negotiated", "Vary: Accept — JSON or YAML"],
    ["Security", ".Security(...); auth concerns self-document"],
    ["Metadata", "method > interceptors > class > concerns"],
  ],
  why: {
    title: "Why crawl instead of describe?",
    text: "A parallel description drifts the day someone changes a route and forgets the spec. Crawling the real object graph means the document cannot disagree with the server: the operations it lists are the ones the runtime dispatches, and the schemas describe the bytes on the wire.",
  },

  parts: [
    { id: "theodolite", name: "The theodolite", say: "ApiDescription, sighted on the live tree — concerns, layout, services.", select: at("theodolite") },
    { id: "ma", name: "Machine A", say: "An endpoint the survey has sighted: its drawing joins the sheet.", select: at("machine-a") },
    { id: "mb", name: "Machine B", say: "The explorer chain decides, then descends, handler by handler.", select: at("machine-b") },
    { id: "mc", name: "Machine C", say: "Service methods fan out to one OpenApiOperation per verb.", select: at("machine-c") },
    { id: "table", name: "The drafting table", say: "The document, drawn at full scale from the measurements.", select: at("table") },
    { id: "case", name: "The instrument case", say: "The cache: the finished document, kept with a checksum.", select: at("case") },
  ],

  main: { view: "s3" },
  inset: { label: "First sighting", view: "s1" },
  steps: [
    { view: "s1", title: "Crawl, don't describe", text: "ApiDescription intercepts openapi.json and walks the live tree. No parallel description exists to fall out of sync.", focus: ["theodolite", "ma"] },
    { view: "s2", title: "The explorer chain", text: "Each explorer decides whether it can read a handler, then descends: concerns, layout roots, services, method collections, methods.", focus: ["mb", "pole"] },
    { view: "s3", title: "The sheet is drawn", text: "Arguments become parameters, content types become schemas — built from the same serializer options the responses use.", focus: ["table", "mc"] },
    { view: "cached", title: "Sighted before, served from cache", text: "A re-sight hits the checksummed cache: same document, content-negotiated JSON or YAML with Vary: Accept.", focus: ["case"] },
    { view: "s3", title: "Security on the sheet", text: "Authentication concerns document their own schemes, and [RequireRole] is where the 401 and 403 responses come from.", focus: ["ma", "table"] },
  ],
  details: [
    { title: "The instrument", text: "One OpenApiOperation per verb at the leaf; XML doc comments supply summaries, attributes layer the rest.", around: ["theodolite"], focus: ["theodolite"] },
    { title: "A machine", text: "Whatever the tree serves: a webservice, a controller, a nested layout — if it answers, it gets surveyed.", around: ["ma"], focus: ["ma"] },
    { title: "The sheet", text: "Swagger UI, Redoc and Scalar can host it straight from Modules/ApiBrowsing — the drawing and the machine never disagree.", around: ["table"], focus: ["table"] },
  ],
};
