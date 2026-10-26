# 01 — The Ioxide core: one io_uring reactor per core

*Figure: `figures/01-ioxide-exchange/index.html` — a telephone exchange: one patch ring per
operator (reactor), trunks for the cable (TCP, TLS, kTLS) and the radio mast (QUIC).*

## What it is

`Engine/Ioxide/` is a Linux server engine whose entire I/O surface is a native library,
NuGet package `ioxide 0.15.251` (plus `ioxide.http2`, `ioxide.ngtcp2`, `ioxide.nghttp3` for
the protocol stacks, and `Glyph11 0.3.7` for HTTP parsing). The C# side is a thin, careful
driver over it.

## The reactor model

`Server.StartAsync()` (`Engine/Ioxide/Infrastructure/Server.cs`) starts **one `Reactor` per
thread, pinned to its own thread**, each running its own io_uring instance:

```csharp
_threads = new Thread[serverConfig.ReactorCount];
_reactors = new Reactor[serverConfig.ReactorCount];
...
_threads[i].Start();   // thread name: "ioxide-genhttp-{i}"
```

Every reactor gets, via `OnStart`, a `IoxideReactor.Bind(...)` call so request-handling code
can reach its reactor with `IoxideReactor.Current` (`API/Ioxide/IoxideReactor.cs` — a
`[ThreadStatic]`, which is why it is only valid *inside* request handling). The default
tuning from `EngineOptions.ReactorOptions`:

| Knob | Default | Meaning |
|---|---|---|
| `ReactorCount` | `Environment.ProcessorCount` | one ring per core |
| `RingEntries` | 8192 | submission/completion slots per ring |
| `RecvBufferSize` | 32 KiB | per receive buffer |
| `RecvSlots` | 4096 | pre-allocated receive buffers |
| `Incremental` | off | incremental ring sizing |

TCP transport adds listen backlog 1024, 16 KiB write slabs, a 1024-deep connection pool,
optional `ZeroCopySend`, and optional kTLS on the transmit and/or receive side
(`TcpTransportOptions`). QUIC gets its own timeouts, datagram routing mode and peer-migration
pinning (`QuicTransportOptions`).

## From socket to protocol

`TcpDriver.HandleAsync` (`Protocol/Drivers/Tcp/TcpDriver.cs`) takes an accepted connection
through, in order:

1. **TLS if the port has it** — a per-reactor `TcpTlsRegistry` finds the `TlsService` for the
   listener port; the OpenSSL-backed session negotiates ALPN (`h2` or nothing), and the
   endpoint's `ICertificateValidator` can inspect the peer (mutual TLS: `RequireClientCertificate`
   with `ClientCaPath`/`ClientCaPem`, validated in `TcpDriver.Accepts` against the DER the
   session produced).
2. **Protocol choice** — `h2` if ALPN said so; otherwise, when both HTTP/1.1 and HTTP/2 are
   allowed on the port, it peeks for the HTTP/2 client preface
   (`"PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n"`) *without consuming it*, so prior-knowledge clients
   work on plain TCP.
3. **Dispatch** — `Http1Driver.RunAsync` (keep-alive loop, request pooling, pipelining via
   `reader.TryRead`), `Http2Driver.RunAsync` (streams off the multiplexed connection), or —
   for QUIC endpoints — `Http3Driver.RunAsync`, one handler call per stream.

Details that show the care: half-close uses `libc.shutdown` directly (`put a FIN on the
wire`), the peer address comes from `getpeername` because the native connection exposes the
fd but not the address, and a `GENHTTP_IOXIDE_PARSER=pico` env switch swaps the hardened
parser for picohttpparser *for benchmarking only* — "not for untrusted traffic".

## HTTP/3

`Http3Driver` (`Protocol/Drivers/Quic/Http3Driver.cs`) runs one `Nghttp3Connection` per QUIC
connection and dispatches each stream through the same handler chain the other protocols use
(`StreamedRequest.Rent()` → `server.Handler.HandleAsync` → `StreamedResponder`). A fault on a
stream becomes a 500 with headers only if they were not already written — the comment
documents a real past bug where a masking exception hid the original fault.

## Why this is god tier

A C# webserver whose hot path is Linux `io_uring` (one ring per core, single-issuer,
`DEFER_TASKRUN` — see the dispose comment: *"a single-issuer / DEFER_TASKRUN ring must be
disposed on its own thread"*), with kTLS and zero-copy sends as *options you can reason
about*, HTTP/3 via the industry-standard ngtcp2/nghttp3 pair, and timeouts documented as
engineering decisions rather than defaults — while remaining a drop-in NuGet package behind
the same `IServerHost` API as the other two engines. The 9 samples in
`Playground/Samples/Ioxide/` (HTTP/1, HTTP/2 including h2c, HTTP/3, TLS, **kTLS**, SNI,
certificate rotation on `SIGHUP`, all-protocols-on-one-host, and a mutual-TLS showcase) are
the proof that all of it is meant to be used, not just shipped.
