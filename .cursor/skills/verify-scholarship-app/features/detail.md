# Scholarship detail and response generator

`/scholarship/<id>` shows one scholarship: name, amount, deadline, eligibility, the cached match score if there is one, and an `Apply ↗` link. Each essay prompt has a `Generate` button that asks Claude for a response in the applicant's voice. The response opens in an editable textarea with a word count and a `Copy` button.

## Sub-features

- `detail-render` shows the h1 with the scholarship name and the `Essay Prompts (N)` heading.
- `detail-generate` clicks `Generate`, sees `Writing…` and "Claude is writing your response…", then a textarea, "N words" and `Regenerate`.
- `detail-no-score` shows "No match score yet" with a `score from the feed` link when the scholarship is unscored.
- `detail-copy` clicks `Copy` and sees `Copied!` for 2s.
- `detail-live` resolves AI-discovered ids from `scholarship-live` on the client.
- `detail-not-found` shows "Scholarship not found." for an unknown id.

## How to get to it (user POV)

- On the feed, click a card's `View & Generate →`.
- On the tracker, click a card's name.
- Go directly to `/scholarship/<id>`, for example `/scholarship/techpoint-indiana`.

## Driving it with vsa + Playwright

Preconditions: `vsa doctor` is OK and the context is fresh.

- **Open from feed.** Run `vsa drive detail-generate`. The scenario clicks `View & Generate →` on the `TechPoint Foundation Scholarship` card. The URL becomes `/scholarship/techpoint-indiana` and the h1 matches.
- **Generate (paid).** Run `VSA_ALLOW_AI=1 vsa drive detail-generate`. The scenario clicks the first `Generate`, waits for `Claude is writing your response…`, then for `Regenerate` (up to 180s). The first textarea holds more than 50 words and a word count is visible.
- **Not found.** The same scenario first opens `/scholarship/does-not-exist` and waits for `Scholarship not found.` (that view has no h1, so it uses `page.goto`, not `go()`).
- **No score.** In a fresh context the detail page shows the `score from the feed` link.

## Gotchas

- The feed card has no accessible name. Locate it as the innermost div holding both the h3 name and a `View & Generate →` link (see `detail-generate.mjs`).
- `Copy` uses `navigator.clipboard`. Headless Chromium needs `context.grantPermissions(['clipboard-read','clipboard-write'])` before `Copied!` shows reliably.
- Generated text lives only in React state and is never saved to localStorage, so it's gone after a reload. That's expected behavior, not a bug.
- `Generate` stays disabled until the client effect finishes. Wait for it to be enabled before clicking.
