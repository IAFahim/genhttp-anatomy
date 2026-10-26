# 04 — The concern chain

*Figure: `figures/04-filter-stack/index.html` — a camera filter stack: light passes through
screwed-on filter rings on the way in and on the way back out; each ring may transform it.*

## Middleware without a middleware framework

A concern is just a handler that owns its inner handler:

```csharp
public interface IConcern : IHandler
{
    IHandler Content { get; }
}

public interface IConcernBuilder
{
    IConcern Build(IHandler content);
}
```

`Concerns.Chain(IEnumerable<IConcernBuilder>, IHandler)` (`API/General/Content/Concerns.cs`)
folds them around your tree — the **first** concern added becomes the **outermost**, so the
order you add them is the order a request meets them:

```csharp
public static IHandler Chain(IEnumerable<IConcernBuilder> concerns, IHandler handler)
{
    var content = handler;
    foreach (var concern in concerns) { content = concern.Build(content); }
    return content;
}
```

The server host uses exactly this to build the root (compliance → errors → your concerns →
logging), and every handler builder exposes `.Add(...)` so concerns can be scoped to one
subtree as well as to the whole server.

## What ships as concerns

| Concern | Where | What it does |
|---|---|---|
| `ServerCompliance` | `Engine/Shared/Infrastructure` | protocol-level checks (Host header, no body on GET/HEAD) |
| `ErrorHandler` | `Modules/ErrorHandling` | exceptions → structured JSON/XML or HTML via `IErrorMapper<T>` |
| `CompressedContent` | `Modules/Compression` | brotli + gzip + zstd, filtered by compressible types, minimum size, `Accept-Encoding`; `IResponse.Rebuild()` rewrites the response in place |
| `DecompressedContent` | `Modules/Compression` | transparent request-body decompression |
| `ClientCache.Validation()` | `Modules/ClientCaching` | ETag generation, `If-None-Match` → 304 (see topic 07) |
| `RangeSupport` | `Modules/IO` | byte-range serving through a `RangedSink`/`RangedStream` |
| `StrictTransport` | `Modules/Security` | HSTS (365 d preload default) |
| `SecureUpgrade` | `Modules/Security` | `Force` redirects HTTP → HTTPS |
| `SnifferPrevention` | `Modules/Security` | `X-Content-Type-Options: nosniff` |
| `CorsPolicy` | `Modules/Security` | per-origin CORS with methods/headers/credentials/max-age |
| `BasicAuthentication`, `BearerAuthentication`, `ApiKeyAuthentication`, `ClientCertificateAuthentication`, `MultiAuthentication` | `Modules/Authentication` | resolve `IUser` into `request.SetUser(...)`; JWT reads the issuer's `.well-known` keys |
| `InjectionConcern` | `Modules/DependencyInjection` | opens an `IServiceScope` per request |
| `LocalizationConcern` | `Modules/I18n` | culture per request from header/cookie/query |
| `InspectionConcern` | `Modules/Inspection` | `?inspect` → structured dump |
| `ApiDescription` | `Modules/OpenApi` | intercepts `openapi.json` — see topic 06 |

## The one-call baseline

`Modules/Practices/Extensions.cs` — `host.Defaults(...)` wires HSTS (365 d, subdomains,
preload), compression, optional decompression, range support, client caching validation,
forced secure upgrade and sniffing prevention in one line. That is the house opinion, and
every part of it is individually removable.

## Why this is god tier

The concern model is four lines of interface with no lifecycle, no delegates, no
config object — yet it carries authentication, CORS, compression, caching, error mapping and
DI scoping, in an order that is literal, visible in source, and identical at every scale
(server-wide or one subtree). Cross-cutting code here is an `IHandler` like any other, so it
composes with the engine swap, the adapter and OpenAPI for free.
