# SPEC.md — Whodunit AI: Interactive Mystery Game

> **Single source of truth.** This document is the blueprint for the whole project. Any developer or AI coding assistant (e.g., Codex) must be able to build the application from this file without further clarification. If code and this spec disagree, the spec wins until the spec is updated.

---

## Table of Contents

1. Project Requirements
2. Technology Stack and Architecture
3. User Flow
4. UI and Page Specifications
5. Backend and Database Design
6. AI Behavior and Scoring Rules
7. Security Requirements
8. Acceptance Criteria
9. Deployment and Environment
10. Suggested Build Order for Codex
11. Testing Requirements

---

## 1. Project Requirements

### 1.1 Overview and Problem Statement

**Whodunit AI** is a full-stack web app where the player types a short mystery premise (for example, *"A jewel theft at a masquerade ball"*), picks a difficulty, and the app uses the Gemini API to generate a complete, playable detective case: a story, a cast of suspects, discoverable clues, and progressive hints.

**Problem:** Mystery games are usually static and replayable only once. Players want fresh, logically solvable cases on any theme. Naïve AI generation also causes two problems this project must solve:

1. **Spoilers** — if the full case (including the culprit) is sent to the browser, the player can cheat by reading the network response.
2. **Unsolvable or inconsistent cases** — an LLM may produce mysteries where the culprit is not supported by the clues.

This project solves both through **server-side secrecy**, **strict validation of AI output**, and **server-side scoring**.

### 1.2 Target Users and Expected Experience

| User | Description | Expectation |
|---|---|---|
| Casual player | Enjoys puzzles and stories, no technical background | Start a case in under 30 seconds, clear instructions, no sign-up |
| Mystery fan | Wants challenge and fair logic | Hard cases with red herrings; the solution must be deducible |
| Student / evaluator | Reviews the project | Clean code, working deployment, spec-compliant behavior |

**Experience goals:** immersive, noir/detective tone; fast feedback; mobile-friendly; no account required; every case is fair (solvable from the clues).

### 1.3 Core Features (MVP — required)

1. Home page with introduction and a "Start Investigation" button.
2. Create-mystery form: premise text + difficulty (Easy / Medium / Hard).
3. AI generation of title, story, suspects, clues, hints, culprit, and explanation via Gemini.
4. Backend validation of the AI output before saving to MongoDB.
5. Investigation Room: story, suspect cards, clue board (locked/discovered), hint panel, progress tracker.
6. Clue discovery (click a locked clue to reveal it; points awarded server-side).
7. Hint system (sequential, limited per difficulty, penalized).
8. Accusation page (choose one suspect, confirm, submit once).
9. Results page: verdict (correct/incorrect), culprit, explanation, score breakdown.
10. "Start another mystery" action.
11. Backend-calculated scoring; the culprit and solution are never sent to the client before accusation.

### 1.4 Optional Enhancements (only after MVP passes all acceptance criteria)

- Resume last case from `localStorage` on Home.
- AI "solver check" pass that verifies the case is uniquely solvable.
- Sound effects / typewriter text animation.
- Share-result card (copy text).
- Leaderboard (requires player names; **out of MVP scope**).
- Dark/light theme toggle (default is dark).

### 1.5 Limitations (explicit constraints)

- **No user authentication** in MVP. A case is identified by its ID.
- **One accusation per case.** Once submitted, the case is complete and read-only.
- Premise length: 10–300 characters. English-language output only.
- Content must be non-graphic, non-sexual, and must not depict real people (see §6.6).
- Gemini generation may take 5–40 seconds; the UI must handle this.
- Free-tier Gemini rate limits apply; the backend must rate-limit and handle 429s gracefully.
- No payments, no real-time multiplayer.

### 1.6 Final Deliverables

1. `SPEC.md` (this file).
2. Source code in a single repository with `client/` and `server/` folders.
3. `README.md` with setup, environment variables, and run instructions.
4. `.env.example` files for client and server (no real secrets committed).
5. Deployed frontend and backend, with a public URL.
6. (Recommended) Screenshots of the Stitch AI designs and a mapping table (§4.8).

---

## 2. Technology Stack and Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS v3 |
| HTTP client | `fetch` or Axios (one wrapper module in `client/src/api/`) |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB (Atlas) via Mongoose 8 |
| AI | Google Gemini API via the official `@google/genai` SDK (model name from env `GEMINI_MODEL`, default `gemini-2.5-flash`) |
| Validation | Zod (request bodies and AI output) |
| Security middleware | `helmet`, `cors`, `express-rate-limit` |
| Testing | Vitest (client + server) or Jest (server), Supertest for API |
| Language | JavaScript (ES modules). TypeScript is allowed but not required. |

### 2.1 Architecture

```
Browser (React SPA)
   │  JSON over HTTPS  (never contains culprit/solution before accusation)
   ▼
Express API ──► Zod validation ──► Services
   │                                  ├─ geminiService   (generate + validate case)
   │                                  ├─ caseService     (public projection, state changes)
   │                                  └─ scoringService  (pure functions)
   ▼
MongoDB (Mongoose: Case collection)
```

The **Gemini API key lives only on the server.** The client never talks to Gemini.

### 2.2 Repository Structure

```
/
├── SPEC.md
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example                 # VITE_API_URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  # routes
│       ├── api/client.js            # all fetch calls
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── CreateMystery.jsx
│       │   ├── InvestigationRoom.jsx
│       │   ├── Accusation.jsx
│       │   ├── Results.jsx
│       │   └── NotFound.jsx
│       ├── components/
│       │   ├── Navbar.jsx  Footer.jsx
│       │   ├── DifficultySelector.jsx
│       │   ├── SuspectCard.jsx  ClueCard.jsx
│       │   ├── HintPanel.jsx  ProgressBar.jsx  ScoreBreakdown.jsx
│       │   ├── LoadingScreen.jsx  ErrorBanner.jsx  ConfirmModal.jsx
│       └── hooks/useCase.js
└── server/
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js                 # starts server, connects DB
        ├── app.js                   # express app (exported for tests)
        ├── config/env.js            # validates env vars
        ├── models/Case.js
        ├── routes/cases.js
        ├── controllers/casesController.js
        ├── services/
        │   ├── geminiService.js
        │   ├── caseValidator.js     # validates + consistency checks
        │   ├── caseService.js       # toPublicCase(), helpers
        │   └── scoringService.js
        ├── middleware/
        │   ├── validate.js  errorHandler.js  rateLimit.js
        └── tests/
```

### 2.3 Environment Variables

**server/.env.example**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster/dbname
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**client/.env.example**
```
VITE_API_URL=http://localhost:5000/api
```

The server must fail fast on startup with a clear message if `MONGODB_URI` or `GEMINI_API_KEY` is missing.

---

## 3. User Flow

```
[1] Open website (Home)
      │  click "Start Investigation"
      ▼
[2] Create Mystery: enter premise + choose difficulty ── submit
      │  POST /api/cases   (loading screen, 5–40 s)
      ▼
[3] Backend asks Gemini → validates → saves → returns PUBLIC case
      │  navigate to /case/:id
      ▼
[4] Investigation Room: read story, review suspects, see locked clues
      │  click a clue → POST …/clues/:clueId/discover → clue text revealed, +5
      ▼
[5] (Optional) Request hint → POST …/hints → next hint shown, −10
      │  (repeat 4–5 as desired)
      ▼
[6] Click "Make Accusation" → /case/:id/accuse → select suspect → confirm
      │  POST …/accuse
      ▼
[7] Backend scores, marks case complete, reveals solution
      │  navigate to /case/:id/result
      ▼
[8] Results: verdict, culprit, explanation, score breakdown
      │  click "Start Another Mystery" → /create
```

**Edge flows**
- Refresh on any page: state reloads from `GET /api/cases/:id`.
- Opening `/case/:id` for a completed case redirects to `/case/:id/result`.
- Opening `/case/:id/result` for an unfinished case redirects to `/case/:id` with a notice.
- Invalid or unknown case ID → "Case not found" screen with a link to Create Mystery.
- Generation failure → error banner with "Try Again" (form values preserved).

---

## 4. UI and Page Specifications

### 4.1 Global Rules

- **Theme:** dark noir (e.g., slate/zinc-900 background, amber accent, off-white text). Fonts: a serif for headings (e.g., "Playfair Display"), sans-serif for body. Tailwind only; no other CSS framework.
- **Navbar:** logo/title (links to Home) and a "New Mystery" button. Visible on all pages.
- **Responsive:** mobile-first. Breakpoints: `<640px` single column; `≥768px` two columns where specified; `≥1024px` max content width ~1100px, centered.
- **Accessibility:** semantic HTML, visible focus rings, `aria-live="polite"` for loading/error messages, color contrast ≥ 4.5:1, buttons ≥ 44px tall on mobile.
- **Routing:**

| Route | Page |
|---|---|
| `/` | Home |
| `/create` | Create Mystery |
| `/case/:id` | Investigation Room |
| `/case/:id/accuse` | Accusation |
| `/case/:id/result` | Results |
| `*` | Not Found |

### 4.2 Home (`/`)

**Purpose:** introduce the project and get the user into a case.

**Elements:** hero title and tagline; 3-step "How it works" (Create → Investigate → Accuse); difficulty overview (suspects/clues/hints per level and scoring summary); primary button **Start Investigation** → `/create`; optional "Resume last case" if a case ID exists in `localStorage` and is not complete.

**States:** static page; no loading/error states except the optional resume check (silent failure).

### 4.3 Create Mystery (`/create`)

**Purpose:** collect premise + difficulty and trigger generation.

**Elements**
- Textarea "Mystery premise" (placeholder: *"A poisoned cup at a village tea festival…"*), live character counter (10–300).
- 3–4 clickable example premises that fill the textarea.
- Difficulty selector (radio cards): Easy / Medium / Hard, each showing suspects · clues · hints and max base points.
- Submit button **Generate Mystery** (disabled while invalid or loading).

**Validation (client, mirrored by server):** premise trimmed, 10–300 chars; difficulty required. Inline error text under the field.

**Loading state:** full-screen or inline `LoadingScreen` with rotating messages (e.g., "Dusting for fingerprints…", "Interviewing suspects…"), disabled form, and an indeterminate spinner. Client timeout: 60 s.

**Error states (show `ErrorBanner` with retry; keep inputs):**
- Validation error (400): show server message.
- `429` rate limit / AI quota: "The detective agency is busy. Please wait a moment and try again."
- `502/503` AI failure: "We couldn't generate a valid mystery. Please try again."
- Network error/timeout: "Can't reach the server. Check your connection."

**Navigation:** success → `navigate('/case/:id')`.

### 4.4 Investigation Room (`/case/:id`)

**Purpose:** the main gameplay screen.

**Layout:** desktop two-column (left: story + suspects; right: sticky sidebar with progress, hints, accuse button). Mobile: single column with the sidebar content in a collapsible section above the clues.

**Elements**
1. **Header:** case title, difficulty badge, current score preview (see §6.5 "live score").
2. **Story panel:** the case story (setting, victim/incident, what is known).
3. **Suspect cards** (3/4/5): name, role/relationship, short description, **alibi claim**, **stated motive-relevant detail** (public profile only). Cards are informational; no accuse button here.
4. **Clue board:** `clueCount` cards. Locked card shows `label` + location teaser + lock icon + "Investigate" button. Discovered card shows full clue text with a "Discovered" tag.
5. **Hint panel:** "Request Hint (−10)" button, shows `hintsUsed / hintsTotal`, previously revealed hints in order. Button disabled when no hints remain. Before the first use of each hint, a small confirm ("This will cost 10 points") is **optional**; if implemented, use `ConfirmModal`.
6. **Progress:** progress bar "Clues found X / N" and "Hints used Y / M".
7. **Make Accusation** button (always enabled) → `/case/:id/accuse`.

**Loading states:** skeleton placeholders on initial fetch; per-card spinner while a clue is being discovered; spinner inside the hint button while requesting.

**Error states:** fetch failure → full-page error with Retry; discover/hint failure → inline toast/banner, state unchanged; `404` → Case not found; `409` (already completed) → redirect to results.

**Behavior:** every action updates UI from the **server response** (not optimistic) so the displayed score always matches the backend.

### 4.5 Accusation (`/case/:id/accuse`)

**Purpose:** let the player choose exactly one suspect and submit.

**Elements:** short warning ("You can only accuse once."); selectable suspect cards (radio behavior, name + role + one-line description); summary of current progress (clues found, hints used); **Confirm Accusation** button (disabled until a suspect is selected) that opens `ConfirmModal` ("Accuse *{name}*? This is final."); **Back to Investigation** link.

**States:** submitting → button spinner and disabled UI; failure → inline error, selection preserved; `409` already accused → redirect to results.

### 4.6 Results (`/case/:id/result`)

**Purpose:** reveal the outcome.

**Elements**
- **Verdict banner:** "Case Solved!" (green/amber) or "Wrong Suspect" (red).
- **Your accusation** vs **The culprit** (highlight culprit card; mark the player's choice).
- **Explanation:** the full solution narrative (how/why/when), plus a list of key clues that prove it (clue labels, linked to clue text).
- **Score breakdown table:** base points, clues bonus, hint penalty, final score, with the formula applied.
- **Full clue list:** all clues, including ones the player never discovered, marked "Missed" vs "Found". (Allowed now because the case is complete.)
- Buttons: **Start Another Mystery** → `/create`; **Home**.

**States:** loading skeleton; error with retry; if case not complete → redirect to `/case/:id`.

### 4.7 Not Found

Message + link to Home/Create.

### 4.8 Stitch AI Design Mapping (to complete by the student)

Students may use Stitch AI to generate an initial UI design. After generating, fill in the table below (screenshots saved under `/docs/design/`). A screen is not accepted if it omits the required elements above.

| Stitch screen | Route | Spec section | Required elements present? | Notes / deviations |
|---|---|---|---|---|
| Landing | `/` | 4.2 | ☐ | |
| Create case | `/create` | 4.3 | ☐ | |
| Investigation | `/case/:id` | 4.4 | ☐ | |
| Accusation | `/case/:id/accuse` | 4.5 | ☐ | |
| Results | `/case/:id/result` | 4.6 | ☐ | |

Stitch output is a visual reference only; behavior, data flow, and security rules come from this spec.

---

## 5. Backend and Database Design

### 5.1 General API Rules

- Base path: `/api`. JSON only (`Content-Type: application/json`).
- A `GET /api/health` endpoint returns `{ "status": "ok" }` (used by the host).
- Case IDs are MongoDB ObjectIds. Invalid ID format → `400 INVALID_ID`; not found → `404 CASE_NOT_FOUND`.
- All request bodies/params validated with Zod before reaching controllers.
- **Error response shape (all errors):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message", "details": [ { "field": "premise", "issue": "Must be 10-300 characters" } ] } }
```
`details` is optional.

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` / `INVALID_ID` | Bad body or ID |
| 404 | `CASE_NOT_FOUND` / `CLUE_NOT_FOUND` | Unknown case or clue |
| 409 | `CASE_ALREADY_COMPLETED` | Mutating a completed case |
| 409 | `NO_HINTS_REMAINING` | Hint limit reached |
| 409 | `CASE_NOT_COMPLETE` | Requesting result before accusation |
| 429 | `RATE_LIMITED` / `AI_QUOTA_EXCEEDED` | Too many requests / Gemini quota |
| 502 | `AI_GENERATION_FAILED` | Gemini failed or output invalid after retries |
| 504 | `AI_TIMEOUT` | Gemini timeout |
| 500 | `INTERNAL_ERROR` | Anything else (no stack traces to client) |

### 5.2 Endpoints

#### `POST /api/cases` — Generate a mystery

**Request**
```json
{ "premise": "A jewel theft at a masquerade ball", "difficulty": "medium" }
```
Validation: `premise` string, trimmed, 10–300 chars; `difficulty` ∈ `easy | medium | hard`.

**Behavior:** call Gemini (§6) → validate (§6.3) → retry up to 2 more times on invalid output → save → return the **public** case.

**Response `201`**
```json
{
  "case": {
    "id": "665f...",
    "title": "The Masquerade Heist",
    "difficulty": "medium",
    "premise": "A jewel theft at a masquerade ball",
    "story": "…",
    "suspects": [
      { "id": "s1", "name": "…", "role": "…", "description": "…", "alibi": "…" }
    ],
    "clues": [
      { "id": "c1", "label": "A torn glove", "location": "Cloakroom", "discovered": false }
    ],
    "hints": { "total": 3, "used": 0, "revealed": [] },
    "progress": { "cluesFound": 0, "cluesTotal": 7, "hintsUsed": 0, "hintsTotal": 3 },
    "status": "active",
    "score": { "current": 0 },
    "createdAt": "2026-10-28T10:00:00.000Z"
  }
}
```
(`clue.text` is absent for undiscovered clues.)

#### `GET /api/cases/:id` — Retrieve an active (or completed) case

Returns `200 { "case": <PublicCase> }`, the same shape as above, with discovered clues including `text` and `discoveredAt`, and revealed hints. If `status === "completed"`, the response still contains **no** solution fields; the client should call `/result`. (Include `status: "completed"` so the client can redirect.)

#### `POST /api/cases/:id/clues/:clueId/discover` — Discover a clue

No body. Behavior:
- Case must exist and be `active` (else `409 CASE_ALREADY_COMPLETED`).
- Clue must exist (`404 CLUE_NOT_FOUND`).
- **Idempotent:** if already discovered, return `200` with the clue and unchanged progress (no extra points).
- Otherwise mark discovered, store `discoveredAt`, save.

**Response `200`**
```json
{
  "clue": { "id": "c1", "label": "A torn glove", "location": "Cloakroom", "text": "A black silk glove caught on the window latch…", "discovered": true },
  "progress": { "cluesFound": 1, "cluesTotal": 7, "hintsUsed": 0, "hintsTotal": 3 },
  "score": { "current": 5 }
}
```

#### `POST /api/cases/:id/hints` — Request a hint

No body. Behavior: case must be active; if `hintsUsed >= hints.length` → `409 NO_HINTS_REMAINING`. Otherwise reveal the **next hint in order** (`hintsUsed` increments by 1, saved).

**Response `200`**
```json
{
  "hint": { "index": 0, "text": "Pay attention to who knew about the second safe." },
  "hints": { "total": 3, "used": 1, "remaining": 2 },
  "score": { "current": 0 }
}
```
(Current score = `max(0, 5*cluesFound − 10*hintsUsed)` before accusation.)

#### `POST /api/cases/:id/accuse` — Submit an accusation

**Request**
```json
{ "suspectId": "s3" }
```
Validation: `suspectId` must be a string matching one of the case's suspect IDs (else `400 VALIDATION_ERROR`).

Behavior: case must be active (else `409`). Compare to the stored culprit **on the server**, compute the score (§6.5), save `accusation`, `score`, `status = "completed"`, `completedAt`, and return the full result.

**Response `200`** — same shape as `GET /result` (below).

#### `GET /api/cases/:id/result` — Retrieve the completed result

If `status !== "completed"` → `409 CASE_NOT_COMPLETE` (**must not leak any solution data**).

**Response `200`**
```json
{
  "result": {
    "caseId": "665f...",
    "title": "The Masquerade Heist",
    "difficulty": "medium",
    "correct": true,
    "accusedSuspectId": "s3",
    "culprit": { "id": "s3", "name": "…", "role": "…", "description": "…" },
    "explanation": "Full narrative of how, why, and when…",
    "keyClueIds": ["c2", "c4", "c6"],
    "clues": [ { "id": "c1", "label": "…", "location": "…", "text": "…", "discovered": true } ],
    "suspects": [ { "id": "s1", "name": "…", "role": "…", "description": "…", "alibi": "…" } ],
    "score": {
      "basePoints": 150, "cluesFound": 5, "clueBonus": 25,
      "hintsUsed": 1, "hintPenalty": 10, "final": 165
    },
    "completedAt": "2026-10-28T10:25:00.000Z"
  }
}
```

### 5.3 Database Model (Mongoose `Case`)

Single collection `cases`. Clues, suspects, and hints are embedded subdocuments.

```js
const CaseSchema = new Schema({
  title:      { type: String, required: true, maxlength: 120 },
  premise:    { type: String, required: true, maxlength: 300 },
  difficulty: { type: String, enum: ['easy','medium','hard'], required: true },
  story:      { type: String, required: true, maxlength: 4000 },

  suspects: [{
    id:          { type: String, required: true },   // "s1", "s2", …
    name:        { type: String, required: true },
    role:        { type: String, required: true },
    description: { type: String, required: true },
    alibi:       { type: String, required: true },
    motive:      { type: String, required: true },   // PRIVATE: never sent before completion
    _id: false
  }],

  clues: [{
    id:            { type: String, required: true }, // "c1", "c2", …
    label:         { type: String, required: true }, // public teaser
    location:      { type: String, required: true }, // public teaser
    text:          { type: String, required: true }, // revealed only after discovery
    pointsTo:      { type: [String], default: [] },  // PRIVATE: suspect IDs it implicates
    isRedHerring:  { type: Boolean, default: false },// PRIVATE
    discovered:    { type: Boolean, default: false },
    discoveredAt:  { type: Date, default: null },
    _id: false
  }],

  hints: [{                                          // ordered, progressively more specific
    index: Number,
    text:  String,
    _id: false
  }],

  // PRIVATE solution block — never serialized to the client before completion
  solution: {
    culpritId:   { type: String, required: true },
    explanation: { type: String, required: true },
    keyClueIds:  { type: [String], required: true }
  },

  progress: {
    hintsUsed: { type: Number, default: 0, min: 0 }
    // cluesFound is derived from clues[].discovered
  },

  accusation: {
    suspectId:   { type: String, default: null },
    correct:     { type: Boolean, default: null },
    accusedAt:   { type: Date, default: null }
  },

  score: {
    basePoints:  { type: Number, default: 0 },
    clueBonus:   { type: Number, default: 0 },
    hintPenalty: { type: Number, default: 0 },
    final:       { type: Number, default: null }
  },

  status:      { type: String, enum: ['active','completed'], default: 'active', index: true },
  completedAt: { type: Date, default: null },
  createdAt / updatedAt via { timestamps: true }
});
```

Additional rules:
- Add a TTL index to delete **active** cases unfinished after 30 days (optional but recommended).
- All reads for client-facing endpoints must go through `caseService.toPublicCase(doc)` or `toResult(doc)`. **Never `res.json(doc)` directly.**

---

## 6. AI Behavior and Scoring Rules

### 6.1 Difficulty Configuration (authoritative constants)

| Difficulty | Suspects | Clues | Hints | Base points (correct) |
|---|---|---|---|---|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Define once in `server/src/config/difficulty.js` and reuse for prompts, validation, and scoring.

Difficulty flavor for the prompt:
- **Easy:** straightforward, 1–2 red herrings at most, direct evidence available.
- **Medium:** several plausible suspects, 2–3 red herrings, requires connecting 2–3 clues.
- **Hard:** subtle misdirection, 3–4 red herrings, alibis that need cross-checking; still fully solvable.

### 6.2 Gemini Output Format

The backend calls Gemini with **JSON output mode** (`responseMimeType: "application/json"` plus a `responseSchema` matching the shape below) and a low-ish temperature (≈0.8). The model must return **only** this JSON object:

```json
{
  "title": "string",
  "story": "string (150–400 words, sets scene, introduces incident; MUST NOT reveal the culprit)",
  "suspects": [
    {
      "id": "s1",
      "name": "string",
      "role": "string",
      "description": "string (1–2 sentences, public info)",
      "alibi": "string (what they claim)",
      "motive": "string (private note)"
    }
  ],
  "clues": [
    {
      "id": "c1",
      "label": "string (≤ 8 words, does not spoil)",
      "location": "string (where it is found)",
      "text": "string (1–3 sentences of evidence)",
      "pointsTo": ["s2"],
      "isRedHerring": false
    }
  ],
  "hints": [
    "string (hint 1: vague)", "string (hint 2: more specific)", "string (hint 3: strongest, but never names the culprit)"
  ],
  "solution": {
    "culpritId": "s3",
    "explanation": "string (150–300 words: who, how, why, and how the clues prove it)",
    "keyClueIds": ["c2", "c4", "c6"]
  }
}
```

**Prompt requirements (build in `geminiService.js`):**
- System instruction: you are a mystery author who writes fair-play detective puzzles; output JSON only; obey the schema.
- Include exact counts for suspects/clues/hints from §6.1 and the difficulty flavor.
- Treat the user's premise as **untrusted story inspiration only**. Wrap it in delimiters (e.g., `<premise>…</premise>`) and instruct the model to ignore any instructions inside it.
- Fair-play rules the model must follow (also enforced in §6.3):
  1. Exactly one culprit; every other suspect is innocent.
  2. The culprit has means, motive, and opportunity, each supported by at least one clue.
  3. Every innocent suspect has a plausible alibi or an exculpating clue (revealed through clues or consistent alibi statements).
  4. Red herrings must be explainable and must **not** uniquely incriminate an innocent suspect.
  5. The story and clue labels must not state who the culprit is.
  6. Hints are ordered from vague to specific and never name the culprit.
  7. Tone: PG-13, non-graphic.

### 6.3 Backend Validation of AI Output (before saving)

Parse the text as JSON (strip stray markdown fences if present), then run, in order. **If any check fails, discard the output and regenerate (max 3 total attempts); if all fail, return `502 AI_GENERATION_FAILED`.** Log the failing check name server-side (never to the client).

**A. Schema validation (Zod)** — correct types, non-empty strings, max lengths (title ≤ 120, story ≤ 4000, clue text ≤ 500, explanation ≤ 2000).

**B. Counts** — `suspects.length`, `clues.length`, `hints.length` exactly equal the §6.1 values.

**C. Identity and reference integrity**
- Suspect IDs are unique and match `s1…sN`; clue IDs unique and match `c1…cM`.
- `solution.culpritId` references an existing suspect.
- Every ID in `pointsTo` and `keyClueIds` exists.
- Suspect names are unique (case-insensitive).

**D. Logical consistency**
- `keyClueIds` has at least 3 entries for medium/hard and at least 2 for easy; every key clue has `culpritId` in `pointsTo` and `isRedHerring === false`.
- The culprit is implicated by **strictly more** non-red-herring clues than any other suspect.
- At least 1 clue clears or is consistent with each innocent suspect OR the suspect has an alibi that conflicts with no clue (soft check; log a warning rather than fail).
- Red-herring count ≤ 1 (easy), ≤ 3 (medium), ≤ 4 (hard), and at least 1 for medium/hard.
- No clue marked red herring appears in `keyClueIds`.

**E. Spoiler/leak checks**
- `story`, every `suspect.description`, every clue `label`, and every hint must **not** contain the string "culprit", "guilty", or "murderer/thief/killer is" combined with the culprit's name; simple rule: none of `story`, `labels`, or `hints` may contain `suspect.name` of the culprit within a phrase like "did it", "is the culprit", or "is guilty" (case-insensitive). Hints must not contain the culprit's full name.

**F. Safety** — reject output containing explicit sexual content, graphic gore, or real public figures' names where detectable (basic keyword list), and if Gemini returns a safety block, return `502` with a friendly message (do not retry more than once on a safety block).

**G. Normalization** — trim strings, set `discovered=false` for all clues, assign hint indexes, drop unknown fields.

*(Optional enhancement: a second Gemini "solver" call that is given only the story, suspects, and clues, and must name the culprit; if it disagrees with `solution.culpritId`, regenerate.)*

### 6.4 Gemini Error Handling

- Timeout: 45 s per attempt → `504 AI_TIMEOUT` after final attempt.
- HTTP 429 from Gemini → `429 AI_QUOTA_EXCEEDED` (no further retries).
- Network/5xx → retry within the 3-attempt budget.
- Never expose the API key, raw Gemini errors, or stack traces to the client.

### 6.5 Scoring Rules (server-side, pure function in `scoringService.js`)

| Rule | Value |
|---|---|
| Correct accusation base points | Easy **100**, Medium **150**, Hard **200** |
| Incorrect accusation base points | **0** |
| Each discovered clue | **+5** |
| Each hint used | **−10** |
| Minimum final score | **0** |

```js
function calculateScore({ difficulty, correct, cluesFound, hintsUsed }) {
  const basePoints  = correct ? BASE[difficulty] : 0;
  const clueBonus   = cluesFound * 5;
  const hintPenalty = hintsUsed * 10;
  const final       = Math.max(0, basePoints + clueBonus - hintPenalty);
  return { basePoints, clueBonus, hintPenalty, final };
}
```

Rules:
- `cluesFound` is derived on the server by counting `clues[].discovered === true`; `hintsUsed` comes from the stored `progress.hintsUsed`. **The client never sends a score or counts.**
- Each clue can be scored once (discovering twice does nothing). Hints cannot exceed the difficulty limit.
- **Live score (before accusation):** `max(0, 5*cluesFound − 10*hintsUsed)` shown as "Current score" (excludes base points, which depend on the verdict). Label it "Evidence score" in the UI to avoid confusion.
- Maximum possible final scores: Easy 125, Medium 185, Hard 245.
- The final score is computed once at accusation, stored, and returned unchanged by `GET /result`.
- Example: Medium, correct, 5 clues, 1 hint → `150 + 25 − 10 = 165`. Hard, wrong, 2 clues, 3 hints → `max(0, 0 + 10 − 30) = 0`.

---

## 7. Security Requirements

1. **Solution secrecy (critical):** `solution`, `suspects[].motive`, `clues[].pointsTo`, `clues[].isRedHerring`, and undiscovered `clues[].text` must never appear in any response before `status === "completed"`. Use explicit allow-list projection functions (`toPublicCase`, `toResult`), not deny-lists. Mongoose `select: false` on the `solution` field is recommended as a second layer.
2. **Result gating:** `/result` and any solution data require `status === "completed"`, checked on the server.
3. **Hints** are served one at a time from the server; the full `hints` array is never sent to the client.
4. **Input safety:** Zod validation on every route; `express.json({ limit: '10kb' })`; ObjectId validation; strip control characters from the premise.
5. **Prompt injection:** premise is delimited and treated as data (§6.2); AI output is always validated, never trusted; AI output is rendered as plain text on the client (**no `dangerouslySetInnerHTML`**).
6. **Rate limiting:** `POST /api/cases` max 5 per 10 minutes per IP; all other routes 100 per 15 minutes per IP.
7. **CORS:** allow only `CLIENT_ORIGIN`. Use `helmet`. HTTPS in production.
8. **Secrets:** `.env` is git-ignored; no keys in client code or logs.
9. **Errors:** central error handler returns the §5.1 shape and hides internals in production.

---

## 8. Acceptance Criteria

The project is complete only when **every** item passes.

**Generation**
- [ ] A user can generate a mystery at **Easy**, **Medium**, and **Hard**.
- [ ] Generated cases contain exactly 3/4/5 suspects, 5/7/9 clues, and 2/3/3 hints respectively.
- [ ] Invalid AI output (wrong counts, bad references, inconsistent solution) is rejected and regenerated; after 3 failures the user sees a friendly error.
- [ ] Empty, too short (<10), or too long (>300) premises are rejected on both client and server.

**Gameplay**
- [ ] Players can read the story, view suspects, and discover clues; each clue awards +5 once only.
- [ ] Players can request hints one at a time, in order, each costing 10 points, up to the difficulty limit; extra requests are refused.
- [ ] Progress (clues found, hints used) persists across page refresh.
- [ ] Players can accuse exactly one suspect; a second accusation is refused (`409`).

**Security**
- [ ] Inspecting every network response before accusation shows **no** culprit ID, solution, explanation, motive, `pointsTo`, `isRedHerring`, or undiscovered clue text.
- [ ] `GET /api/cases/:id/result` on an active case returns `409` with no solution data.
- [ ] Gemini API key is not present in client bundle or any response.

**Scoring**
- [ ] Final scores equal the §6.5 formula in all tested cases, including floor at 0 and wrong accusations.
- [ ] Sending a fake score or counts in any request body has no effect.

**Results**
- [ ] The results page shows the correct culprit, full explanation, verdict, and a score breakdown that adds up.
- [ ] Missed clues are displayed on the results page.
- [ ] "Start Another Mystery" leads to a fresh create flow.

**UX and quality**
- [ ] Loading states for generation, clue discovery, hint request, and accusation.
- [ ] Clear error messages for validation, rate limits, AI failure, network failure, and unknown case ID.
- [ ] Layout works at 360px, 768px, and 1280px widths with no horizontal scrolling.
- [ ] Unit tests exist and pass for scoring and AI-output validation; API tests cover the six endpoints.

**Deployment**
- [ ] Frontend and backend are deployed and publicly reachable; a full play-through (create → investigate → accuse → results) works on the deployed URL.
- [ ] README documents setup, env vars, and the live URL.

---

## 9. Deployment and Environment

- **Database:** MongoDB Atlas free cluster; allow-list the host IPs (or `0.0.0.0/0` for coursework only).
- **Backend:** Render, Railway, or similar. Start command `node src/index.js`; set all server env vars; `CLIENT_ORIGIN` = deployed frontend URL. Configure the health check at `/api/health`.
- **Frontend:** Vercel or Netlify. Build `npm run build`, output `dist`. Set `VITE_API_URL` to the deployed API base. Add an SPA fallback rewrite to `index.html`.
- Cold-start note: free backend tiers may sleep; the UI loading state and 60 s client timeout must tolerate this.
- Scripts: `server` — `dev` (nodemon), `start`, `test`; `client` — `dev`, `build`, `preview`, `test`.

---

## 10. Suggested Build Order for Codex

Complete and verify each step before the next.

1. **Scaffold** `client/` (Vite + React + Tailwind + Router) and `server/` (Express + Mongoose); env validation; `/api/health`.
2. **Constants and models:** `difficulty.js`, `Case` model.
3. **Scoring service** + unit tests (pure functions).
4. **Case validator** (§6.3) + unit tests with valid and invalid fixtures.
5. **Gemini service** with prompt, JSON schema, retry loop; allow a mock mode via `MOCK_AI=true` returning a fixed valid case for tests/dev.
6. **Endpoints** one by one (§5.2) with `toPublicCase` / `toResult`; Supertest tests, including the secrecy assertions.
7. **Frontend API client** and routing shell.
8. **Pages in order:** Create → Investigation Room → Accusation → Results → Home → Not Found.
9. **Polish:** loading/error states, responsive layout, accessibility.
10. **Deploy**, run the §8 checklist on the live site, update README.

---

## 11. Testing Requirements

**Unit tests (required)**
- `calculateScore`: each difficulty, correct/incorrect, floor at 0, max-score cases.
- `caseValidator`: passes a valid fixture; fails for wrong counts, duplicate IDs, unknown culprit, culprit not strictly most-implicated, key clue that is a red herring, spoiler in a hint.

**API tests (required, Supertest with in-memory MongoDB or mocked model and `MOCK_AI=true`)**
- Create case (valid/invalid body); get case; discover clue (including idempotency); request hints until `NO_HINTS_REMAINING`; accuse (valid suspect, invalid suspect, duplicate accusation); result before and after completion.
- **Secrecy test:** recursively scan JSON of every pre-completion response and assert it contains none of the forbidden keys (`solution`, `culpritId`, `explanation`, `motive`, `pointsTo`, `isRedHerring`) and no undiscovered clue text.

**Manual QA:** run the full flow at all three difficulties on desktop and mobile widths, and on the deployed site.

---

*End of SPEC.md*
