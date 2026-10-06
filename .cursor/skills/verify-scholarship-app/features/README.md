# Scholarship Intelligence verification map

This directory is the maintained source for verifying the app's user-facing behavior. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- `vsa doctor` reports `doctor: OK` and an http line naming the app at the recorded base URL (default `http://127.0.0.1:3456`).
- Every scenario starts in a fresh Playwright context: empty localStorage, so the app shows `DEFAULT_PROFILE` (Landon Hill) and the 12 seed scholarships from `data/scholarships.ts`, all in Not Started and unscored.
- The user's own browser data is never read or changed. Never point the harness at a persistent browser profile.

## Driving conventions

- Use `vsa drive <scenario>` from the repo root. Write new scenarios next to the existing ones and import `lib.mjs`.
- Prefer role + accessible name (`getByRole('button', { name: 'Next →' })`) and h1 text. The app has no test ids.
- Wait for the page h1 plus network idle before asserting: every page reads localStorage in a `useEffect` after hydration.
- Read localStorage only to observe side effects. Never write it to set up a state the user could reach by clicking.

## Proof and skip reporting

- Capture the state before and after each user action (`capture`), plus a `storage-*.json` dump of the affected key.
- Mutation proof includes a reload, or a second page that reads the same stored value.
- Any console error fails the run.
- `SKIP:` lines are unverified sub-features. Name them in your report.
- AI sub-features (`VSA_ALLOW_AI=1`) spend real Anthropic credits. Do not report them verified from a run without that flag.

## Feature entry contract

Each feature file has an H1, one paragraph of user-visible behavior, then exactly four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with vsa + Playwright`, `Gotchas`.

## Features

- [Tracker](./tracker.md): kanban stage moves, header stats, persistence. Scenario `tracker`.
- [Profile](./profile.md): applicant form save, resume PDF upload. Scenarios `profile` and `resume`.
- [Feed](./feed.md): card grid, AI scoring, AI Discover. Scenario `feed-score`.
- [Scholarship detail](./detail.md): detail page and essay response generator. Scenario `detail-generate`.
