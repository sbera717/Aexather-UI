# Aexather — Frontend Architecture

The interface to an **agent behavior engineering platform**: the screens where you watch an agent
investigate, read why it decided what it decided, find out which change caused a failure, and gate a
release on measured evidence.

Next.js 15 (App Router) · React 19 · Zustand 5 · Tailwind · Recharts · Three.js · ~7,900 lines.

> The Java service that backs this lives in a separate repository; its `ARCHITECTURE.md` explains
> the runtime, the contract engine and the promotion gates in depth. This file covers the client and
> the one thing it has that the backend does not: a self-contained runtime that lets every screen
> work with nothing behind it.

---

## 1. The idea in one paragraph

Every number on these screens is either **measured** or **absent**. That sounds like a small
convention and it drives most of the code: a contract that has judged nothing has no pass rate
rather than 100%, a version nobody has run the suite against has no scorecard rather than zeroes,
and a promotion gate with no evidence blocks rather than passes. The product's entire argument is
that it never asserts a figure it cannot show the evidence for, so a UI that rendered an absent
value as `0` would be demonstrating the opposite of what it is selling.

That is why so many types here are `number | null` and why `formatPercent(null)` returns `—`.

---

## 2. Layout of the source

```
src/
├── app/
│   ├── layout.tsx           shell: sidebar, command palette, data gate, toaster
│   ├── page.tsx             ①  Landing — state a goal, watch it investigate
│   ├── studio/page.tsx      ②  Execution Studio — the decision graph and its lineage
│   ├── debugger/page.tsx    ③  Counterfactual Debugger — which change moved the outcome
│   ├── promotion/page.tsx   ④  Promotion Controller — measured gates, release
│   ├── contracts/page.tsx       Behavioral contracts — author and test CEL rules
│   └── regressions/page.tsx     Golden suite — codify, replay, mutation-test
├── components/
│   ├── layout/              Sidebar, Topbar, CommandPalette, DataSourceGate
│   └── 3d/                  NeuralParticleSphere, AniwallRibbon
├── data/
│   ├── mockData.ts          the original fixtures — untouched, still exported
│   └── demoData.ts          the demo fixtures, mirroring the backend's seed set
├── lib/
│   ├── api.ts               typed client for the backend
│   ├── demoRuntime.ts       the same behaviour, with no backend
│   └── utils.ts             formatters, including the "not measured" rule
├── store/platformStore.ts   one Zustand store; every page reads from it
└── types/platform.ts        the API contract, mirrored field-for-field by the DTOs
```

`types/platform.ts` is the contract of record. The backend's DTOs mirror it, so moving a page from
fixtures to live data is a data-source change, not a type change.

---

## 3. The four demo pages

The product's argument runs in this order, and so does the 60-second cut.

### ① Landing — `app/page.tsx`

You state a goal; the platform investigates and hands back the record of how.

The prompt bar is **not a search box**. Submitting runs a real investigation, and each graph node is
streamed as it completes — Adaptive Router, Specialist Executor, Evidence Engine, round by round,
with coverage climbing. Streaming matters more than it looks: the point of an adaptive runtime is
that the number of rounds is decided by what the evidence looks like, and a spinner followed by a
finished answer hides exactly that.

When it finishes, it routes to the Studio with that trace selected.

Layout note: this page is `h-screen` and **does not scroll**. The orb, the caption and the prompt bar
are one composition. The agent column on the left scrolls on its own, the orb sizes to
`min(380px, 34vh)`, and the live step feed is capped at `26vh` with its own scroll — it grows to ten
rows mid-run and would otherwise push the prompt bar off the screen.

### ② Studio — `app/studio/page.tsx`

The decision graph, and the half of a trace that answers *why*.

Left: the pipeline, one card per step, coloured by status. Right: an inspector for the selected step
holding the part that makes this more than a log —

- **Why this step happened** — the trigger (`insufficient coverage`, `evidence conflict`,
  `budget exhausted`) and the router's stated reason.
- **Options weighed at this decision** — every specialist the router considered, with its score as a
  bar, marked *Dispatched* or *Passed over*. A trace that records only what ran cannot answer the
  question a post-mortem asks.
- **Budget at that moment** — tokens, tool calls, elapsed.

Two more tabs: the **evidence ledger** (every source, its confidence, whether it was verified) and
the **claims** (each with the ledger ids it cites, and its status).

The inspector is `sticky top-8` so it follows as the pipeline scrolls — it describes whichever step
you clicked, so it should stay in view rather than scroll away from what you are reading.

### ③ Debugger — `app/debugger/page.tsx`

Which single change moved the outcome.

A pie of attribution by arm, the original failed run beside the perturbations, and per-arm detail:
what changed, what the replay concluded, the coverage delta, whether it counts as a fix.

**The scores do not sum to 100, and that is the point.** They are effect sizes measured against a
reproduced baseline, not shares of one cause — two arms can both score highly if both fix the
failure. The page says so in as many words.

*Re-run Diagnosis* replays the arms with staged progress (`Reproducing baseline…` →
`Replaying arm 2 of 4…`), each pending arm showing its own spinner. *Codify as Regression* turns the
failure into a permanent case — the loop the platform exists to close.

### ④ Promotion — `app/promotion/page.tsx`

Candidate against incumbent, and five gates that can refuse.

Gates render three ways, not two: **PASS**, **FAIL**, and **NOT MEASURED**. The third is the one
that matters. Open the page cold and every gate is grey, because nothing has been measured yet.
*Run Suite on Candidate* replays the golden suite with per-case rows ticking over live, and only
then do the gates fill in.

Try to promote before that and it refuses with the reason — *"no suite run on record… none of the
release gates can be evaluated"*. That refusal is the single clearest statement of what the product
is for.

### The other two

**Contracts** — author CEL invariants against a live editor. The backend compiles before it writes,
so a rule that could never yield a verdict is refused at authoring time rather than discovered later
as a wave of indeterminate results. *Test Rule* dry-runs an expression against a trace and records
nothing.

**Regressions** — the golden suite. Cases carry three states (`Passed`, `Failed`, **`Not run`**);
a case nobody has replayed has not passed and has not failed. *Test the Suite* runs mutation testing:
degrade the agent five ways and report whether these cases would have noticed. A survivor is a blind
spot.

---

## 4. State — `store/platformStore.ts`

One Zustand store. Every page reads from it; no page fetches for itself.

```ts
traces, selectedTraceId, selectedNodeId
contracts, counterfactual, regressionSuites, regressionSummary
candidates, dashboard
dataSource: 'mock' | 'live'
connection: 'connecting' | 'live' | 'offline'
```

**It is seeded from the fixtures at construction**, so the first paint is complete and every page
renders before any network call resolves. `hydrate()` replaces them when a backend answers; when one
does not, the fixtures stay and every action routes to the demo runtime instead.

Three deliberate choices:

**Mutations are not optimistic.** Activating a contract compiles its expression server-side and can
legitimately fail; a promotion is gate-checked against measured results the client cannot predict. A
toggle that flips back a moment later reads as a bug rather than as a rejection.

**Trace detail is fetched on selection.** The list endpoint returns scalars only — no graph, no
ledger, no claims — because a feed of full traces would carry every decision payload for every row.
The Studio needs all of it, so `setSelectedTraceId` pulls the detail once and keeps it.

**Refreshes are targeted.** After a suite run, the suite and the candidates are re-read; the roll-up
moves with every live run so it is re-read rather than incremented.

---

## 5. The demo runtime — `lib/demoRuntime.ts`

The part with no counterpart in the backend, and the reason the app is presentable with nothing
behind it.

**It reproduces the runtime rather than faking it.** Running an investigation here executes the same
loop, with the same arithmetic:

- The router scores every eligible specialist — 0.70 for closing a gap, 0.15 for a tool nothing has
  used yet, minus a penalty on a retry — and takes the best three above 0.20.
- Specialists return findings derived from a **hash of the goal**, so the same question always
  produces the same investigation. That is what lets a recording be re-taken without the numbers
  moving.
- Coverage is counted from usable findings — conclusive *and* above the confidence floor.
- **The loop continues while coverage is short**, so some questions close in two rounds and others
  need three. A demo that hard-coded three steps would be showing the wrong thing.

It also keeps the refusals. The demo promotion path enforces the same five gates: a candidate whose
scorecard the page is simultaneously showing as *not measured* cannot be promoted.

Timings are tuned so a page reads in about fifteen seconds — 380 ms per graph node, 260 ms per
regression case — fast enough to hold attention, slow enough that each row is legible as it lands.

### Fixtures

`demoData.ts` mirrors the backend's `seed/*.json`, so the offline story and the live one are the
same story rather than two unrelated sample sets. Two transforms are applied on the way across:

1. **Human-facing strings are rewritten out of the enum vocabulary.** `[SOURCE_GROUNDING, HISTORICAL]`
   reads as a variable name that leaked; *"source grounding and historical"* reads as something the
   product knows about. The **payloads keep their constants verbatim**, because those are data the
   contract expressions read.
2. **Candidate scorecards start empty**, so the promotion page's central beat works.

`mockData.ts` is the original fixture set. It is **untouched and still exported** — `demoData.ts`
sits alongside it rather than replacing it.

---

## 6. The API client — `lib/api.ts`

Grouped by resource: `tracesApi`, `executionsApi`, `contractsApi`, `experimentsApi`,
`regressionsApi`, `candidatesApi`, `dashboardApi`, `jobsApi`.

Two pieces worth knowing:

**`executionsApi.stream`** hand-parses Server-Sent Events over `fetch`. `EventSource` can only issue
GET requests and cannot carry the goal, so the response body is read as a stream and split on blank
lines, with a partial event held in the buffer for the next read. A `step` event per graph node, one
`trace` event at the end.

**`jobsApi.poll`** — two endpoints answer **202 with a job handle** rather than the result. A
diagnosis is two baseline replays plus one investigation per arm; mutation testing replays the whole
suite once per degradation. Against a served model both run for minutes, long enough to outlast a
proxy's read timeout — at which point the client sees a failure while the work lands anyway.

Errors arrive in one envelope and surface as `ApiError`, carrying the backend's own message. A
blocked promotion names every failing gate and the evidence behind it, so the UI shows that message
**verbatim** rather than summarising it away.

---

## 7. Conventions worth keeping

**Absent is not zero.** `formatPercent`, `formatLatency`, `formatCost` and `formatCount` all return
`—` for `null`. Nullable scorecard fields are annotated on the backend to serialize as `null` rather
than being dropped, so the client can tell *not measured* from *not present*.

**The enum vocabulary stays out of the UI.** `humanize()` turns `INDEPENDENT_CORROBORATION` into
*Independent corroboration*; `humanizeList()` renders a set as prose. Acronyms the platform actually
uses — API, RAG, SSO, CEL — stay uppercase.

The one place constants are shown verbatim is inside a CEL expression block, where
`n.actionType == "INVARIANT_GUARD"` **is** code and is set in monospace to say so.

**Long ids are keys, not labels.** `shortId()` renders `exec_0f4b7bfe22f5adb` as `exec_0f4b`, with
the full value in a `title`. A sixteen-character hex string dominates any row it sits in and carries
no meaning to a reader.

**Every long action shows what it is doing.** Not a generic spinner — the suite runner names the
case, the diagnosis names the arm, the rule test names the contract. Where work settles as a batch,
rows are revealed in order rather than claiming per-item progress the endpoint does not report.

**Scrolling belongs to the page, not the shell.** The shell wrapper scrolls by default. Pages that
should not — the Landing page — set their own `h-screen` and hand the scroll to one column.

---

## 8. Running it

```bash
npm install
npm run dev            # http://localhost:3000
```

### Demo mode

`.env.local` carries:

```
NEXT_PUBLIC_DEMO_MODE=true
```

With it set, the app never probes for a backend and runs entirely on the fixtures through the demo
runtime. No Java, no MongoDB, no Docker. Delete the line to go back to live — the store will find a
backend at `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8090/api/v1`) and hydrate from it,
falling back to the fixtures if it cannot.

`DataSourceGate` renders **nothing**. It hydrates on mount and that is all — which of the two is
answering is an operational detail, and a badge for it would sit on top of every screen for the sake
of a distinction nobody watching is being asked to make.

### The 60-second cut

| Time | Page | Beat |
|---|---|---|
| 0–15s | Landing | Goal is pre-filled. **Investigate.** Steps stream in, coverage climbs, it lands on the Studio. |
| 15–30s | Studio | The failing trace. Click step 1 — five specialists scored, three dispatched. Step 6 — *evidence conflict*. Step 7 — *budget exhausted*, everything at 0.00. |
| 30–45s | Debugger | Four arms: 78% and 70% both fix it, 15% and 0% do not. *These are effect sizes, not shares of one cause.* |
| 45–60s | Promotion | Gates grey. **Run Suite** — rows tick green. Gates fill in, 5/5. **Promote.** |

The strongest single beat is promoting *before* running the suite: it refuses, and names why.

---

## 9. Contract changes to be aware of

Three things differ from the original `platform.ts` and are load-bearing:

1. **`BehavioralContract.passRatePercent` and every `CandidateVersion` scorecard figure are
   nullable.** Null means *not measured*, never zero.
2. **`RegressionTestCase.lastRunStatus` gains `NOT_RUN`.**
3. **`diagnose` and `mutation-test` return a job handle**, polled at `/api/v1/jobs/{jobId}`.

Additive and safe to ignore if unused: `ExecutionTrace.origin`, `DecisionNode.trigger`,
`.candidates`, `.selectionReason`, `.budgetAtDecision`, and the `DashboardSummary` /
`RegressionSummary` read models.
