# 02 — The zero-alloc exchange

*Figure: `figures/02-coin-sorter/index.html` — a coin sorter: each coin (request) is read,
routed, stamped and sent back down the return chute; no new coins are minted.*

## The claim

README, History: *"In 2026, the API and internal engine have been rewritten to be
allocation-free, greatly improving performance in result."* This doc is what that sentence
is made of.

## One exchange, start to finish

The classic-engine path (identical shape under Ioxide, different transport):

1. **Accept** — `EndPoint.Start()` (`Engine/Internal/.../EndPoint.cs`) binds with backlog
   2048, accepts, sets `NoDelay`, and takes a `ClientContext` from a
   `DefaultObjectPool<ClientContext>`; pipes wrap the stream.
2. **Parse** — `ClientHandler.RunAsync` (`Engine/Internal/Protocol/ClientHandler.cs`) reads a
   `ReadOnlySequence<byte>` and hands it to `Glyph11`'s
   `UltraHardenedParser.TryExtractFullHeaderValidated(ref buffer, request.Source, Limits, out _)`.
   Headers become **views**: `ByteString` structs over the request buffer — no string
   allocation, no copy. `ByteString` is a `readonly partial struct` completed by the
   `[MemoryView]` source generator (`Generators/MemoryView/CodeEmitter.cs`): a
   `ReadOnlyMemory<byte>` field, a **precomputed hash**, generated equality. The same
   generator produces `ContentType`, `HttpProtocol`, `PathSegment`, `RequestMethod`,
   `AlgorithmName`.
3. **Bind** — `request.Apply(...)` re-points the pooled `Request` (`Engine/Shared/Types/Request.cs`)
   at this exchange: header/body/properties reset, body detected from `Content-Length` or
   `Transfer-Encoding`, body strategies pre-chosen (length-limited vs chunked, memory vs
   stream).
4. **Handle** — `await server.Handler.HandleAsync(request)` walks the concern chain into your
   handler. A handler answers with `request.Respond()` — an `IResponseBuilder` mutating the
   pooled `Response` in place. Returning `null` means 404.
5. **Serialize** — `ResponseHandler` → `ResponseSerializer` writes status line and headers as
   raw UTF-8 (`Server: GenHTTP/x`, cached `Date`), then body content drives
   `content.WriteAsync(sink)` into a `RegularSink` (known length) or `ChunkedSink`
   (`IResponseSink` exposes `IBufferWriter<byte>`).
6. **Recycle** — `request.DrainAsync()` discards unread bodies, `request.Reset()` re-pools
   state, the writer flushes, and if bytes are already buffered the next request is parsed
   immediately (pipelining). Otherwise the 60 s keep-alive timeout is armed via
   `CancellationTokenSource.TryReset` (no re-allocation of the CTS).

## The pooling ledger

| Object | Pool | Where |
|---|---|---|
| `ClientContext` (pipes, handler state) | `DefaultObjectPool` | Internal engine |
| `Request` (HTTP/1.1, per connection) | `[ThreadStatic] Stack<Request>`, max 1024 | `Http1Driver` (Ioxide) |
| `StreamedRequest` (H2/H3 stream) | `[ThreadStatic] Stack<StreamedRequest>`, max 1024 | `Engine/Ioxide/Protocol/Requests/StreamedRequest.cs` |
| `Response` / `ResponseBuilder` | one per `Request`, reused | `Engine/Shared/Types` |

The `StreamedRequest` remark states the design goal outright: *"Pooled per reactor and
reused stream after stream … so a whole exchange allocates nothing."* It even carries the
scratch the response side needs — a 20-byte content-length digit buffer ("ulong tops out at
20 digits") and a lowercase header-name buffer appended end to end.

## Streamed, not buffered

Bodies never have to land in memory: `IRequestBody` is read through `System.IO.Pipelines`,
requests can be streamed straight into handlers (`GetStream` binding), responses with unknown
length go chunked, and websockets/SSE are just responses with `Connection.Upgrade` / length
`null` whose content drives the sink.

## Why this is god tier

Most "fast C# servers" get there by narrowing the programming model. GenHTTP keeps the full
handler/concern/reflection model and still takes allocations out of the per-request path:
zero-copy header views with generated hashing, pooled everything, `TryReset`-based timeouts,
a response builder that mutates in place (`IResponse.Rebuild()` returns the same builder —
how the compression concern rewrites a response without allocating a second one), and a
BenchmarkDotNet harness (`Benchmarks/Infrastructure/BenchmarkContext.cs`) that feeds raw
HTTP/1.1 bytes through the *real* parser and pipeline so every optimization is measurable.
