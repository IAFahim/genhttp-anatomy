# 07 — Freshness and size

*Figure: `figures/07-cloakroom/index.html` — a cloakroom: claim tickets on a rail; when your
ticket still matches the tag on the coat, you get the same ticket back and the coat is not
re-wrapped. A folding press beside the counter sizes each handout to what the client says it
can carry.*

## Freshness by validation, not by copies

GenHTTP ships **no server-side content cache** — deliberately. The freshness model is
HTTP's own: strong validators and revalidation.

`Modules/ClientCaching/Validation/CacheValidationHandler.cs`:

- reuses an existing `ETag`, or computes one as
  `await response.Content.CalculateChecksumAsync()` — and the checksum contract is honest:
  `IResource.CalculateChecksumAsync()` hashes `Modified` + `Length`, so unchanged content
  costs a stat, not a hash;
- compares it with `If-None-Match` and rewrites the response to **304 Not Modified** with
  null content — the concern chain does this by rebuilding the pooled response in place;
- documents `If-None-Match`/`ETag` through `IDocumentedConcern`, so OpenAPI shows it.

`ClientCache.Policy()` adds `Expires` (`DateTime.UtcNow + Duration`, RFC 1123) for GET/200
responses, gated by an optional predicate. `host.ClientCaching()` or `host.Defaults()`
enable validation globally.

Where caching *does* exist internally, it is small and pointed: the OpenAPI document cache
(checksummed), and change-tracking trees (`ChangeTrackingResource`) so heavy parses
(archives, templates) re-run only when the source actually changed (`Checksum.Calculate` =
`Modified` + `Length`).

## Size on the wire

`Modules/Compression`:

- **Response compression** — `CompressedContent.Default()`: brotli, gzip and zstd (on .NET 11),
  selected against `Accept-Encoding`, applied only to compressible content types above a
  minimum size, skipping already-compressed content. The concern rebuilds the response
  through `IResponse.Rebuild()` — same pooled object, new content wrapper
  (`CompressedResponseContent`).
- **Request decompression** — `DecompressedContent.Default()` transparently unwraps
  compressed request bodies.
- **Pre-compressed assets** — `Assets` serves `.br`/gzip siblings directly when present
  (`AllowPrecompressed`), with an Ioxide-optimized fast path (`Multi/Ioxide/`); there is a
  dedicated benchmark for it (`Benchmarks/Files/PreCompressedBenchmark.cs`, with a real
  `file.js.br` checked into resources).
- **Ranges** — `RangeSupport` in `Modules/IO` serves byte ranges through a `RangedSink`, so
  big static files are resumable and seekable.

## Why this is god tier

Instead of a cache that can go stale, the framework gives you the two primitives that cannot:
validators derived from content identity, and compression that respects what the client
asked for. The defaults are in `host.Defaults()`; every piece is removable; the benchmarks
measure the pre-compressed path; and the OpenAPI document says all of it.
