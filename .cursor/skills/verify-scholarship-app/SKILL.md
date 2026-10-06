---
name: verify-scholarship-app
description: Launch and drive the Scholarship Intelligence Next.js web app (feed, scholarship detail/essay generator, tracker, profile) in a real headless Chromium via Playwright, and capture screenshot, ARIA and localStorage evidence. Use whenever you need to prove a UI change or bug fix works in the running app rather than by reading code.
---

# Verify Scholarship Intelligence

The app is a single-user Next.js 16 web UI. All user state lives in browser localStorage, and the server is stateless apart from server actions that call Anthropic (score, generate), Tavily + Anthropic (AI Discover) and pdf-parse (resume upload). The only surface is the browser. There is no CLI or public API.

Everything goes through one script. Run it from the repo root:

```bash
V=.cursor/skills/verify-scholarship-app/scripts/vsa
$V setup      # once per machine: Playwright 1.63 + Chromium into ~/.cache/verify-scholarship-app/harness
$V launch     # start (or reuse) the dev server and wait until it answers
$V doctor     # read-only health check, run first whenever anything looks off
$V drive tracker            # run scenarios/tracker.mjs, evidence to a fresh dir
$V cleanup    # stop only the server vsa started, keep evidence
$V paths      # print repo, harness, run and evidence locations
```

## Launch

- `$V launch` runs `npx next dev -p 3456 -H 127.0.0.1` in the background, writes `~/.cache/verify-scholarship-app/run/server.pid` and `server.log`, and polls `GET /tracker` until it returns 200 (90s timeout). Ready means it printed `vsa: ready at http://127.0.0.1:3456`.
- Port 3000 on this machine usually belongs to a different project (Kerra). Never assume `localhost:3000` is this app. Override the port with `VSA_PORT=<n>`.
- Next 16 holds a lockfile, so only one `next dev` can run per project directory. If the user already has `next dev` running in this repo, `launch` reuses it: it detects the process by its cwd, records that server's port, and leaves the pid file out so cleanup never kills it. Reusing it is safe because the server holds no state, and each scenario uses a fresh browser context with its own empty localStorage.
- `.env.local` must define `ANTHROPIC_API_KEY` (and `TAVILY_API_KEY` for AI Discover). Never print its values.

## Doctor

`$V doctor` checks, without changing anything: the repo HEAD and how many paths are uncommitted, that the harness is installed, whether the server is ours, reused, or missing, that `GET /tracker` serves `<title>Scholarship Intelligence</title>` (so you aren't driving some other app on that port), and whether the Anthropic key is present. It exits nonzero and prints `doctor: NOT OK` when something needs fixing.

## Drive

Scenarios are Node ESM files in `scenarios/` that import `scenarios/lib.mjs`. Run them with `$V drive <name>`, never with `node` directly (the script sets `VSA_BASE_URL`, `VSA_OUT` and `VSA_HARNESS`).

| Scenario | Proves | Cost |
|---|---|---|
| `tracker` | Next/Back moves a card between columns, the header stats update, the state persists to localStorage and survives a reload | free |
| `profile` | form edits save to localStorage and survive a reload | free |
| `resume` | uploading a synthetic PDF shows "N words extracted" and stores `resume_text`, and Remove clears it | free (pdf-parse, no AI) |
| `feed-score` | the feed renders the seed cards. With `VSA_ALLOW_AI=1` it also clicks Score with AI and checks the scores | 1 Anthropic call when enabled |
| `detail-generate` | the not-found view, feed card to detail navigation, and the no-score link. With `VSA_ALLOW_AI=1` it also generates an essay response | 1 Anthropic call when enabled |

`lib.mjs` helpers: `run(fn)` (opens Chromium, fails on any console error, captures a failure screenshot), `go(page, path, h1Text)` (navigates and waits for the h1 and network idle, so hydration has finished), `capture(page, label)` (numbered full-page PNG plus an ARIA snapshot of `<main>`), `readStorage(page, key)`, `saveJson(name, data)` and `check(cond, msg)`.

To verify something new, copy the closest scenario, keep its imports, and assert on what a user sees plus the localStorage side effect. Stable handles in this app:
- Page h1 text: `Scholarship Feed`, `Application Tracker`, `Applicant Profile`, and the scholarship name on `/scholarship/<id>`.
- Button names: `Score with AI` / `Re-score` / `Scoring…`, `AI Discover` / `Discovering…`, `Next →`, `← Back`, `Generate` / `Regenerate` / `Writing…`, `Copy` / `Copied!`, `Save Profile`, `Choose PDF`, `Upload & Parse`, `Remove`.
- Link names: `View & Generate →`, `Apply ↗`, `Back to Feed`, and the nav links `Feed`, `Tracker`, `Profile`.
- localStorage keys: `scholarship-profile`, `scholarship-scores`, `scholarship-tracker`, `scholarship-live`, `scholarship-last-updated`, `resume_text`.
- Seed ids live in `data/scholarships.ts`, for example `dell-scholars` (Dell Scholars Program) and `techpoint-indiana` (TechPoint Foundation Scholarship).

The app has no `data-testid` or ARIA labels. Profile inputs are not linked to their labels (`<label>` without `htmlFor`), so `getByLabel` fails on them. Use the `field()` helper pattern in `profile.mjs`.

## Evidence

- Each `drive` writes to `~/.cache/verify-scholarship-app/evidence/<YYYYMMDD-HHMMSS>-<scenario>/`: numbered `*.png` and `*.aria.txt` per step, `storage-*.json` side-effect dumps, and `transcript.txt` (every PASS/FAIL/SKIP line and `exit=<rc>`). Override the location with `VSA_EVIDENCE`.
- Proof standard: drive the real user path (click the real buttons, never call `saveTracker` or set localStorage to fake a state). Capture before and after the action. Confirm the stored side effect with `readStorage` and a reload, not only the visible screen. A run passes only on `RESULT: PASS` with exit 0.
- A `SKIP:` line means that sub-feature was **not** verified. Report it as skipped, not as passed.
- AI paths call the real Anthropic API and spend the user's credits. Run them only when the change touches scoring, generation, discovery or resume parsing, and say you're doing it. No mocks exist, and you shouldn't add any. AI scenarios fail fast on the app's own error banner. A `400 ... credit balance is too low` FAIL means the Anthropic account has no credits, which is a blocked prerequisite, not an app bug.

## Cleanup

`$V cleanup` kills only the process tree whose pid it recorded (`npx`, then `next dev`, then its children), copies `server.log` to `evidence/last-server.log`, and deletes `run/`. It never kills by process name and never touches a reused server. Evidence directories survive. Run cleanup after every session, including failed ones.

## Helpers

- `scripts/vsa`: the bash control script above (executable).
- `scenarios/lib.mjs`: the shared Playwright harness.
- `scenarios/*.mjs`: one runnable scenario per feature.
- `features/`: the verification map. Read `features/README.md` before driving anything not listed above.
