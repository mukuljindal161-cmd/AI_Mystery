# Whodunit AI

A detective game built from [SPEC.md](SPEC.md): describe a mystery, investigate suspects and clues, request hints, and make one final accusation. React 18 / Vite / Tailwind 3 frontend; Express 4 / Mongoose 8 backend; Gemini generation using `@google/genai`.

## Local setup

Use Node.js 20.19+ (Node 22 or 24 recommended), npm, and a running MongoDB instance or MongoDB Atlas connection. From the repository root:

```powershell
npm.cmd install
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Edit `server/.env`: set `MONGODB_URI` and `GEMINI_API_KEY`. Both are required at startup. Then:

```powershell
npm.cmd run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:5000/api**. On shells without PowerShell execution-policy restrictions, `npm` works in place of `npm.cmd`.

You can also run `npm.cmd run dev -w server` and `npm.cmd run dev -w client` in separate terminals from the repository root. Do not run those alongside the root `npm.cmd run dev`, which already starts both services. Vite uses port 5173 with `strictPort` enabled, so a duplicate frontend reports an occupied port instead of silently switching to 5174. Open **http://localhost:5173**, not `http://127.0.0.1:5173`: the browser origin must exactly match `CLIENT_ORIGIN`, including hostname and port. A mismatch can appear as “Can’t reach the server” even when the backend is healthy.

For deterministic development without Gemini calls, set `MOCK_AI=true` and a nonempty placeholder `GEMINI_API_KEY` in the server environment. MongoDB is still required. Mock mode always returns **The Midnight Compass**, with the correct counts for the selected difficulty, and intentionally ignores the premise. It is a test fixture, not AI generation. Keep `MOCK_AI=false` for real gameplay.

## Environment

| Server variable | Purpose |
| --- | --- |
| `PORT` | API port; default 5000 |
| `MONGODB_URI` | Required MongoDB connection string |
| `GEMINI_API_KEY` | Required server-only Google API key |
| `GEMINI_MODEL` | Defaults to `gemini-2.5-flash` |
| `CLIENT_ORIGIN` | Exact allowed browser origin; defaults to `http://localhost:5173` |
| `MOCK_AI` | `true` enables deterministic development cases; defaults to `false` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `TRUST_PROXY` | Trusted reverse-proxy hop count; default 0, Render configuration uses 1 |

Client: `VITE_API_URL` is the API base including `/api`; defaults to `http://localhost:5000/api`. Vite injects this at build time. Never put secrets in `VITE_*` variables.

## Checks and scripts

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test -w server
npm.cmd run test -w client
```

The server suite uses an injected in-memory repository and mocked Mongoose reads for concurrency tests; it does not need a database, API key, or network. It tests scoring, AI validation, retries/timeouts/safety blocks, all six case endpoints, secrecy, score tampering, duplicate discoveries, hint limits, final accusation, rate limits, and version conflicts. Client tests exercise premise validation, failed generation, server-confirmed clue discovery, and accusation confirmation.

Verified on 29 October 2026: all **41 tests passed** (38 server, 3 client), and the production frontend build succeeded. The dependency audit reports no high or critical findings; the two remaining moderate package entries are React Router and React Router DOM, discussed below. Live MongoDB/Gemini integration, visual browser QA, and deployment have not yet been verified.

For a production-like local run, start `npm.cmd start -w server`, build the client, and use `npm.cmd run preview -w client`. Set `CLIENT_ORIGIN` to the preview origin first.

## Architecture and game rules

- `client/src/pages/`: Home, Create Mystery, Investigation Room, Accusation, Results.
- `client/src/api/client.js`: centralized requests with a 60-second timeout and cancellation.
- `server/src/config/difficulty.js`: authoritative counts and base scores.
- `server/src/services/geminiService.js`: delimited premise, structured JSON, bounded retries, safe errors.
- `server/src/services/caseValidator.js`: schema, counts, references, evidence ranking, spoilers, and basic safety checks.
- `server/src/services/caseService.js`: explicit public/result projections; private fields never serialized through active-case endpoints.
- `server/src/services/caseRepository.js`: Mongoose optimistic concurrency prevents lost progress and double accusations.

The server awards 5 points per discovered clue and deducts 10 per hint. A correct accusation adds 100/150/200 points for easy/medium/hard. Wrong accusations add zero base points. The minimum score is zero. The live evidence score excludes the final accusation bonus. Completed cases cannot be changed.

## API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/cases` | Generate, validate, and persist a case |
| GET | `/api/cases/:id` | Public case and revealed evidence |
| POST | `/api/cases/:id/clues/:clueId/discover` | Reveal one clue; repeat calls add no points |
| POST | `/api/cases/:id/hints` | Reveal the next paid hint |
| POST | `/api/cases/:id/accuse` | Final accusation with `{ "suspectId": "s1" }` |
| GET | `/api/cases/:id/result` | Completed result only |

Creation accepts `{ "premise": "A missing compass at midnight", "difficulty": "medium" }`. Errors use `{ "error": { "code": "...", "message": "...", "details": [] } }` (`details` optional). Unexpected request fields are rejected, including fake scores and counts.

## Deployment

Deployment status: **not deployed**. MongoDB Atlas, a Gemini key, and hosting access must be configured before live verification.

1. Create an Atlas database/user and allow the backend host's outbound IPs.
2. Deploy the API to Render using root `render.yaml`, or to Railway with root build `npm ci` and start `npm start -w server`. Supply all required server environment variables. Check `/api/health`.
3. Deploy the frontend to Vercel with `client` as root, build `npm run build`, output `dist`; `client/vercel.json` supplies the SPA fallback. Netlify can use the repository root, build `npm ci && npm run build`, publish `client/dist`; `client/public/_redirects` supplies the fallback.
4. Set `VITE_API_URL` to the deployed API base, and set the backend's `CLIENT_ORIGIN` to the exact frontend origin. Rebuild after changing the client variable.
5. Use HTTPS and test a complete case at every difficulty. Record the live URL here after deployment.

## Manual acceptance checks and limits

- Play every difficulty; refresh after discovering clues and requesting hints.
- Inspect pre-accusation network responses for hidden solution fields, unrequested hints, and locked clue text.
- Verify mobile/tablet/desktop layouts at 360/768/1280px, keyboard focus, dialog Escape, and loading/error states.
- Verify an unfinished results URL redirects to the investigation and a completed investigation redirects to results.
- Test MongoDB persistence and real Gemini generation in the configured environment. Mocked tests do not establish real provider availability or narrative quality.

The validator enforces structural consistency and evidence metadata, but it cannot prove narrative entailment or unique solvability. Alibi consistency remains a soft check. Basic keyword safety checks are intentionally limited; Gemini safety blocks are also handled. The optional independent AI solver, account system, leaderboard, and resume-from-home are not implemented.

The spec allows three AI attempts of up to 45 seconds each but gives the client a 60-second timeout. Those limits are preserved; a slow generation may finish after the browser times out. A background generation job with resumable polling would resolve this mismatch in a future spec revision. Without authentication, anyone with a case ID can play that case, as specified.

React Router v6 is retained as explicitly required by the spec. npm currently flags moderate advisories for its redirect handling and SSR error hydration; this app uses fixed internal navigation paths and no SSR. The advertised upstream fixes require v7, which would be a spec change. Review the advisories before public deployment. Zod and Vitest have been updated to patched releases.
