# 08 — The turntable: three engines, one application

*Figure: `figures/08-turntable/index.html` — a locomotive turntable: one train (your
application) stays on the track while the table is turned to couple any of three engines.*

## The contract that makes it possible

Every engine implements the same two faces:

- **`IServerHost`** — the public hosting API: `.Port()`, `.Bind(...)`, `.Handler(...)`,
  `.Add(concern)`, `.StartAsync()`, `.RunAsync()`. Each engine's `Host.Create()` returns one;
  your code does not change.
- **`IServer`** — what the host builds: endpoints, logging, `Handler`, `StartAsync`/
  `DisposeAsync`. Plus `ServerEngine` for the one place you might care.

`Engine/Shared/Hosting/ServerHost.cs` is the shared skeleton: it collects endpoints and
concerns, applies defaults (port 8080 dual-stack, console logging), and assembles the root
`CoreRouter`. Each engine overrides a single hook, `Build(...)`.

## The three engines

| | Internal | Kestrel | Ioxide |
|---|---|---|---|
| Package | `GenHTTP.Core` | `GenHTTP.Core.Kestrel` | `GenHTTP.Core.Ioxide` |
| Transport | managed sockets, thread-per-connection | ASP.NET Core `WebApplication` | native io_uring, reactor-per-core |
| Protocols | HTTP/1.1 | HTTP/1.1, 2, 3 | HTTP/1.1, 2, 3 |
| TLS | `SslStream` + SNI | ASP.NET Core TLS | OpenSSL + SNI + mTLS + kTLS + cert rotation |
| Use case (README) | embedding; behind a reverse proxy | web applications on the edge | high performance on Linux via io_uring |
| Extra deps | Glyph11, ObjectPool | ASP.NET Core | `ioxide*` native packages |

The Kestrel engine is a *hosting engine*: `KestrelServerBridge : IServer` builds a real
`WebApplication` and maps every `HttpContext` into the GenHTTP pipeline via `Bridge.MapAsync`
— Kestrel does transport, GenHTTP still owns handlers and responses (and suppresses
Kestrel's `Server:` header because `ResponseSerializer` emits its own). The
`Adapters/AspNetCore` package is the reverse direction: embed GenHTTP handlers into an
existing ASP.NET Core app at a path. Both share the same `IFeatureCollection` ↔ `IRequest`
bridge.

## What it takes to make the promise honest

*"Engines are tested to be compatible with all modules, so you can switch the runtime
without any further adjustments"* is a test-suite statement, not marketing:

- `MultiEngineTest` runs **every** wire-level acceptance test against **all** engines —
  Ioxide automatically on Linux, skipped with a reason elsewhere;
- websockets and SSE are specified at the *response* level (`Connection.Upgrade`, content
  with `Length => null`) so each engine implements the same contract in its own I/O;
- CI exercises the io_uring path itself (`sysctl kernel.io_uring_disabled=0`,
  `modprobe tls` for kTLS, libmsquic for HTTP/3) rather than only the managed engines;
- the six meta-packages differ *only* in the engine dependency — the switch is one NuGet id.

## Why this is god tier

The engine is a decision you can defer, reverse, and make per deployment — embedded service
inside a desktop app (Internal), edge service (Ioxide), inside an existing ASP.NET Core
estate (Kestrel or the adapter) — without touching application code, and with a test suite
that would catch an engine drifting from the contract. That is the property every figure in
this repo ultimately points at: the architecture, not a trick, is the performance story.
