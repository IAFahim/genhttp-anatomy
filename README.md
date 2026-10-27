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

**Live gallery: <https://iafahim.github.io/genhttp-anatomy/>** — or open any
`figures/*/index.html` in a browser (`npx serve .` and click through). Each figure answers
to hover and arrow keys, tours when idle, and goes still under `prefers-reduced-motion`.
Every figure ships in a light theme (`index-light.html`) and links a printable A4 PDF
(poster, explained drawing, and a 2-page detailed sheet) from its top-right corner.

| | Figure | The idea it explains | Try this |
|---|---|---|---|
| Fig 1 | [The io_uring exchange](figures/01-ioxide-exchange/index.html) · [PDF](figures/01-ioxide-exchange/ioxide-exchange-detailed-a4.pdf) | Ioxide: one io_uring reactor per core, ring entries, TCP/kTLS + QUIC trunks | Hover to hand the call to another reactor |
| Fig 2 | [The coin sorter](figures/02-coin-sorter/index.html) · [PDF](figures/02-coin-sorter/coin-sorter-detailed-a4.pdf) | The zero-alloc exchange: pooled requests circulate, none minted | Move the gate between outcomes |
| Fig 3 | [The signal box](figures/03-signal-box/index.html) · [PDF](figures/03-signal-box/signal-box-detailed-a4.pdf) | The handler tree: `IHandler` all the way down, `null` means 404 | Route the train; find the buffer spur |
| Fig 4 | [The filter stack](figures/04-filter-stack/index.html) · [PDF](figures/04-filter-stack/filter-stack-detailed-a4.pdf) | The concern chain: first concern added is outermost | Insert filters 1-4, watch the meter |
| Fig 5 | [The card catalog](figures/05-card-catalog/index.html) · [PDF](figures/05-card-catalog/card-catalog-detailed-a4.pdf) | The reflection mapper: binding precedence, compiled fast path | Choose a method card, watch binding |
| Fig 6 | [The surveyor](figures/06-surveyor/index.html) · [PDF](figures/06-surveyor/surveyor-detailed-a4.pdf) | OpenAPI generated from the real handler tree | Aim at a machine, watch the plotter |
| Fig 7 | [The cloakroom](figures/07-cloakroom/index.html) · [PDF](figures/07-cloakroom/cloakroom-detailed-a4.pdf) | ETag validation (304) and response folding (compression) | Match a tag; mismatch one |
| Fig 8 | [The turntable](figures/08-turntable/index.html) · [PDF](figures/08-turntable/turntable-detailed-a4.pdf) | Three engines, one application: Internal, Kestrel, Ioxide | Couple the coach to each engine |

Companion deep-dives live in [`docs/`](docs/) — one per figure, with the real interface
signatures and file paths from the GenHTTP tree.

## Printable A4 sheets

Every figure prints as an explained drawing on paper, generated from the same page and the
same model (`scripts/print.mjs`, from the anatomy kit):

```sh
cd figures/01-ioxide-exchange
node build.mjs --light                      # the light page the sheets are cut from
CHROME_PATH=/usr/sbin/chromium node ../../scripts/print.mjs sheet.mjs --format all --png
```

Three formats per figure, written next to the spec: `*-poster-a4.pdf` (one page: numbers,
pinned figure, every part with a line), `*-drawing-a4.pdf` (one page: parts list,
specification, an inset pose and a strip of steps), and `*-detailed-a4.pdf` (two pages: the
figure with close-ups, then every step with its parts lit). All three print in black and
white.

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
