# GenHTTP, drawn as machines

An explainer of [GenHTTP](https://github.com/Kaliumhexacyanoferrat/GenHTTP) — the pure-C#
webserver and its new **Ioxide** engine — told the [Anatomy](https://github.com/wheresryan22/anatomy)
way: for every part of the architecture there is an interactive isometric machine whose
working *is* the concept, built from dozens of solid shaded parts, framed on a card with a
live readout, and driven by a small model that keeps every number true.

**Why "god tier"?** Read the argument: [docs/00-why-genhttp-is-god-tier.md](docs/00-why-genhttp-is-god-tier.md)
— one paragraph, an evidence table with file paths, and the full architecture laid out.
Every claim was read out of the GenHTTP source tree (v11.1.0, October 2026).

## The gallery

Open any `figures/*/index.html` in a browser (or `npx serve .` and click through). Each
figure answers to hover and arrow keys, tours when idle, and goes still under
`prefers-reduced-motion`.

| | Figure | The idea it explains | Try this |
|---|---|---|---|
| Fig 1 | [The io_uring exchange](figures/01-ioxide-exchange/index.html) | Ioxide: one io_uring reactor per core, ring entries, TCP/kTLS + QUIC trunks | Hover to hand the call to another reactor |
| Fig 2 | [The coin sorter](figures/02-coin-sorter/index.html) | The zero-alloc exchange: pooled requests circulate, none minted | Move the gate between outcomes |
| Fig 3 | [The signal box](figures/03-signal-box/index.html) | The handler tree: `IHandler` all the way down, `null` means 404 | Route the train; find the buffer spur |
| Fig 4 | [The filter stack](figures/04-filter-stack/index.html) | The concern chain: first concern added is outermost | Insert filters 1-4, watch the meter |
| Fig 5 | [The card catalog](figures/05-card-catalog/index.html) | The reflection mapper: binding precedence, compiled fast path | Choose a method card, watch binding |
| Fig 6 | [The surveyor](figures/06-surveyor/index.html) | OpenAPI generated from the real handler tree | Aim at a machine, watch the plotter |
| Fig 7 | [The cloakroom](figures/07-cloakroom/index.html) | ETag validation (304) and response folding (compression) | Match a tag; mismatch one |
| Fig 8 | [The turntable](figures/08-turntable/index.html) | Three engines, one application: Internal, Kestrel, Ioxide | Couple the coach to each engine |

Companion deep-dives live in [`docs/`](docs/) — one per figure, with the real interface
signatures and file paths from the GenHTTP tree.

## Running the figures

Each figure is a Node build script that writes a standalone HTML page (no dependencies;
Node 20.10+):

```sh
node figures/01-ioxide-exchange/build.mjs
```

Quality checks used while building (need Chromium; `CHROME_PATH` points at it):

```sh
CHROME_PATH=/usr/sbin/chromium node scripts/capture.mjs figures/01-ioxide-exchange/index.html --out /tmp/fig.png
CHROME_PATH=/usr/sbin/chromium node scripts/lines.mjs figures/01-ioxide-exchange/index.html
```

## Credits

- [GenHTTP](https://github.com/Kaliumhexacyanoferrat/GenHTTP) by Andreas Nägeli and
  contributors, MIT — the subject of all of this.
- The isometric kit in `kit/` and the check scripts in `scripts/` are vendored from
  [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), MIT © 2026 Ryan — see
  [NOTICE.md](NOTICE.md).
- This repository is an independent explainer and is not affiliated with or endorsed by the
  GenHTTP project.

License: MIT — see [LICENSE](LICENSE).
