# 06 — The OpenAPI generator

*Figure: `figures/06-surveyor/index.html` — a surveyor's instrument on a tripod measuring a
model machine and drawing its blueprint at full scale: the document is generated from the
real thing, not from a description of it.*

## The principle

`Modules/OpenApi` intercepts `openapi`, `openapi.json` and `openapi.yaml`, then **crawls the
live handler tree**. There is no parallel description to keep in sync: whatever your
`Layout`/concern/service graph serves is what the document describes.

## The explorer chain

`ApiDiscovery.Default()` registers explorers in order; each one decides whether it can
handle a handler and descends further:

```
ConcernExplorer        walks IConcern.Content, pushing IDocumentedConcern metadata
  LayoutExplorer       walks LayoutHandler roots/routes, accumulating the path
    ServiceExplorer    finds IServiceMethodProvider (webservices, controllers)
      MethodCollectionExplorer   fans out to MethodHandlers
        MethodHandlerExplorer    builds OpenApiOperation per verb
```

`MethodHandlerExplorer` maps each `OperationArgumentSource` to OpenAPI constructs: path
arguments → path parameters, query → query parameters, `[FromBody]` → `text/plain` body,
content-typed arguments → schema per registered serialization format, streamed → binary,
wildcard routes → a `remainingPath` parameter. XML doc comments supply summaries; `[Tag]`,
`[Response]`, `[RequestHeader]`, `[ResponseHeader]` attributes add metadata with the
precedence *method > interceptors > service class > concerns* — so `[RequireRole]` (an
`IDocumentedInterceptor`) is where the 401/403 responses in the document come from.

## Schemas match what you actually serve

`SchemaManager.GetOrCreateSchema(Type)` runs NJsonSchema with the **same
`JsonSerializerOptions` as the registry's JSON format**, so `$ref` schemas describe the bytes
on the wire, not a parallel configuration. The finished document is cached with a checksum
(`OpenApiConcernBuilder.Caching(bool)`), served content-negotiated (`Vary: Accept`), and
`.Security(...)` adds security schemes; the authentication concerns document themselves
(`IAuthenticationBuilder.Documentation(SecurityScheme)`).

## Why this is god tier

OpenAPI generation is usually a bolt-on that drifts. Here it is a concern over the real
object graph, built from the same operation model the runtime dispatches with, with schemas
tied to the actual serializer, cached, content-negotiated, and extensible by post-processor —
plus `.AddOpenApi()` one-liner UX and Swagger UI / Redoc / Scalar hosting from
`Modules/ApiBrowsing`.
