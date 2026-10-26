# 03 — The handler tree

*Figure: `figures/03-signal-box/index.html` — a signal box: the train (request) enters, the
lever frame routes it over the points, and every track ends in a platform that hands
something back.*

## The whole model is one interface

`API/General/Content/IHandler.cs`:

```csharp
public interface IHandler
{
    ValueTask PrepareAsync(IServer server);
    ValueTask<IResponse?> HandleAsync(IRequest request);
}
```

Everything in GenHTTP — the server root, the layout router, static files, reverse proxies,
webservices, websockets — is an `IHandler`. Returning `null` means "not mine", which the
concern chain turns into a 404. `PrepareAsync` gives the tree one warm-up pass before the
first connection (Ioxide logs it: *"Prepared handlers in {ElapsedMs} ms"*).

## Composition: builders in, handlers out

Builders are factories; `IHandlerBuilder.Build()` yields the handler, and the typed variant
carries concerns:

```csharp
public interface IHandlerBuilder<out TBuilder> : IHandlerBuilder where TBuilder : IHandlerBuilder<TBuilder>
{
    TBuilder Add(IConcernBuilder concern);
}
```

The central router is `Layout.Create()` (`Modules/Layouting/Provider/LayoutBuilder.cs`):
`.Add(segment, handler)` for path segments (multi-segment strings like `"api/v1"` split and
merge into child layouts via `MultiSegmentSupport`), `.Add(handler)` for ordered fallbacks,
`.Index(handler)` for the root. At the root the layout *forces a trailing slash* by
redirecting, so the same content is never served at two URLs. Its `Build()` shows the idiom
every module shares:

```csharp
return Concerns.Chain(_concerns, new LayoutHandler(routed, root, _index?.Build()));
```

Other handlers in the same style: `VirtualHosts.Create()` (routes on the `Host` header),
`LoadBalancer.Create()`, `Redirect.To()`, `Assets.From(...)`, `SinglePageApplication.From(...)`
(SPA fallback to `index.html`), `ArchiveTree.From(...)` (serve ZIP/RAR/TAR as a tree).

## The root of every server

`Engine/Shared/Hosting/ServerHost.cs` wraps your tree in a `CoreRouter` with a fixed concern
order — this is the actual composition root of every GenHTTP server:

```
ServerCompliance (Host header required, GET/HEAD must not carry a body)
  → ErrorHandler.Default()
  → your concerns (host.Add(...))
  → request logging (optional)
  → your handler tree
```

The same three interfaces are also the extension points *outward*: `Adapters/AspNetCore`
maps an existing ASP.NET Core app's paths onto any GenHTTP handler
(`Adapter.Map(app, "/path", handler)`), and `Engine/Kestrel` maps the other direction —
each `HttpContext` becomes a GenHTTP `IRequest` through the shared `Bridge`.

## Why this is god tier

One two-method interface, honoured from the socket to your lambda, means every module is
composable with every other module by construction — which is exactly what makes the
three-engine promise testable. There is no "middleware" interface distinct from the handler
interface; there is no special case for the root; there is no hidden global state. The
handler tree is the whole story, and it fits on a postcard.
