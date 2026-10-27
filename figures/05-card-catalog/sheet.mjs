const at = (name) => `[data-part="${name}"]`;
const pick = (k) => ({ actions: [["key", k], ["wait", 300]] });

export default {
  page: "index-light.html",
  out: "card-catalog",
  layers: ".iso-stage svg.iso-svg",
  reduced: true,

  views: {
    rest: {},
    m2: pick("2"),
    m3: pick("3"),
  },

  name: "Mapper",
  title: "the reflection mapper",
  number: "GHTTP-05",
  tagline: "attributes in, typed calls out",
  question: "How does a plain C# method become an HTTP operation?",
  lead: "Every front door — ServiceResource, Controller or an Inline lambda — ends in the same machinery: TypeAnalyzer reads the attributes into a MethodCollection and the OperationRouter matches the request card to one drawer. SignatureAnalyzer then binds each parameter by fixed precedence, so a bead drops only into the slot the signature declares.",
  quote: "a bead drops only into the slot the signature declares",
  numbers: [
    ["3", "front doors", "ServiceResource, Controller, Inline"],
    ["6", "slots", "fixed binding precedence: path to content"],
    ["15", "files", "a mini-MediatR-plus-MVC, no code-gen step"],
    ["403", "intercepted", "[RequireRole] blocks before the method"],
  ],
  spec: [
    ["Analyzer", "TypeAnalyzer, public and internal"],
    ["Segments", "literal, :variable, regex, closing"],
    ["Binding", "path, injected, streamed, body, query, content"],
    ["Injectors", "request, handler, user, services, body"],
    ["Fast path", "ExecutionMode.Auto, Roslyn delegate"],
    ["Formats", "JSON default; YAML, XML, Protobuf addable"],
    ["Interceptors", "[InterceptWith<T>], OpenAPI-documented"],
  ],
  why: {
    title: "Why compiled?",
    text: "MethodInfo.Invoke per request is the classic reflection tax. ExecutionMode.Auto instead emits a real Invoke(...) with Roslyn and compiles it once per operation, so the hot path is a plain call — falling back to reflection only where Roslyn cannot run, or for internal methods, deliberately.",
  },

  parts: [
    { id: "card", name: "The request card", say: "Method and path, dropped into the throat to be matched.", select: at("card") },
    { id: "d0", name: "Drawer — GET list", say: "One operation per method, read from the attributes.", select: at("drawer-0") },
    { id: "d1", name: "Drawer — GET :id", say: "Literal, :variable and regex segments all route here.", select: at("drawer-1") },
    { id: "d2", name: "Drawer — POST", say: "A body-carrying operation; the tray takes its answer.", select: at("drawer-2") },
    { id: "b1", name: "The beads", say: "Bound arguments, seated by precedence, never by guesswork.", select: at("bead-1") },
    { id: "pen", name: "The pen arm", say: "The Roslyn-compiled invocation, writing the response.", select: at("pen") },
  ],

  main: { view: "rest" },
  inset: { label: "Card 3 — POST", view: "m3" },
  steps: [
    { view: "rest", title: "Three doors, one engine", text: "ServiceResource, Controller or Inline.Create(): every front door ends in MethodCollection, OperationRouter, MethodHandler.", focus: ["card", "d0"] },
    { view: "m2", title: "Match the card", text: "The OperationRouter reads the attributes once and matches the request to one drawer — segments as literals, :variables or regexes.", focus: ["d1", "card"] },
    { view: "m2", title: "Bind by precedence", text: "Path, injected, streamed, body, query, content: SignatureAnalyzer seats each argument in the slot its signature declares.", focus: ["b1"] },
    { view: "rest", title: "The pen writes", text: "ExecutionMode.Auto compiles the call with Roslyn into a real delegate — and falls back to plain reflection where it cannot.", focus: ["pen"] },
    { view: "m3", title: "Interception first", text: "An interceptor such as [RequireRole(\"admin\")] can short-circuit the call before the method runs — 401 or 403, documented.", focus: ["pen", "d2"] },
  ],
  details: [
    { title: "A drawer", text: "One operation: route segments parsed at build time, wildcards closing into sub-handlers when a method returns a handler.", around: ["d1"], focus: ["d1"] },
    { title: "The beads", text: "Arguments bound by fixed precedence. Injectors cover the request, the handler, the auth user and any registered service.", around: ["b1"], focus: ["b1"] },
    { title: "The pen", text: "Compiled once per operation, invoked per request — with the interceptor as the guard who can stop the hand mid-air.", around: ["pen"], focus: ["pen"] },
  ],
};
