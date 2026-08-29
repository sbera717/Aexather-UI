# Aexather UI

**Aexather** is a specialized AI Agent Behavior Engineering Platform designed to help teams debug, trace, and enforce strict safety invariants on autonomous AI agents. 

This repository contains the frontend interface — the screens where you watch an agent investigate, read why it decided what it decided, find out which change caused a failure, and gate a release on measured evidence.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **State Management:** Zustand 5
- **Styling:** Tailwind CSS
- **Visualization:** Recharts & Three.js

## Core Features
1. **Landing:** State a goal and watch the platform investigate with live execution streaming.
2. **Execution Studio:** Visualize the decision graph and its lineage. Look inside the black box to see exact routing decisions, evidence weighting, and latency timelines.
3. **Counterfactual Debugger:** Isolate exactly which change moved the outcome. Tweak a single variable in a past execution to see how the agent would have reacted differently.
4. **Promotion Controller:** Measured gates for agent release. 
5. **Contracts:** Author and test CEL (Common Expression Language) rules to create hard deterministic boundaries.
6. **Regressions:** Codify complex reasoning tests to ensure your agents don't unlearn critical guardrails over time.

## Running Locally

```bash
npm install
npm run dev 
```

Navigate to `http://localhost:3000`.

### Demo Mode
To run the platform using the self-contained demo runtime (no backend required), ensure your `.env.local` file contains:
```env
NEXT_PUBLIC_DEMO_MODE=true
```
If you want to connect to the live Aexather backend, simply remove this line and set your `NEXT_PUBLIC_API_BASE_URL`.
