# Feed

The feed is the landing page (`/` redirects to `/feed`). It shows seed and AI-discovered scholarships as cards, hides expired deadlines, and sorts by match score and then deadline. `Score with AI` scores every open scholarship in a single Anthropic call. `AI Discover` uses Tavily search plus Claude to add scholarships tagged `AI Pick`.

## Sub-features

- `feed-grid` renders one card per open scholarship, and the header's "N open" matches the card count.
- `feed-expired` hides past-deadline items and shows "N expired".
- `feed-score` clicks `Score with AI`, sees the progress banner, then score rings, quoted reasons, the `avg score N` chip, and a `Re-score` button. Writes `scholarship-scores`.
- `feed-discover` clicks `AI Discover`, sees the success banner "Found N AI-suggested scholarships", and `AI Pick` badges appear. Writes `scholarship-live` and `scholarship-last-updated`.
- `feed-open-detail` follows `View & Generate →` to `/scholarship/<id>`.

## How to get to it (user POV)

- Open `/` (it redirects), go to `/feed`, or click `Feed` in the nav or the logo.

## Driving it with vsa + Playwright

Preconditions: `vsa doctor` is OK and the context is fresh (unscored, no live results).

- **Grid.** Run `vsa drive feed-score`. The output shows `PASS: feed renders 12 open scholarship cards` (the count drops as seed deadlines pass) and the "N open" check.
- **Score (paid).** Run `VSA_ALLOW_AI=1 vsa drive feed-score`. The scenario clicks `Score with AI`, waits for `Claude is scoring all scholarships against your profile…`, then for `Re-score` (up to 180s). `storage-scores.json` has an entry for each id with a tier of high, medium or low, and the header shows `avg score N`.
- **Discover (paid, no scenario yet).** Click `AI Discover` and wait for `Found` text or an amber error banner (up to several minutes). It needs `TAVILY_API_KEY` and makes many Tavily calls plus Claude calls. Run it only when the change touches `scrapeScholarships`.

## Gotchas

- Without `VSA_ALLOW_AI=1` the run ends with `SKIP: scoring not driven`. That run proves only the grid.
- The scoring prompt sends the profile and resume text. In a fresh context that means DEFAULT_PROFILE and no resume.
- Scores are cached in localStorage. Once scored, the button reads `Re-score`, not `Score with AI`.
- `feed-expired` can't be reached in a fresh context while every seed deadline is in the future (the earliest is October 31, 2026). It needs a past-deadline item from AI Discover, or a date after a seed deadline. Until then, the "N expired" text won't render.
- `isDeadlinePast` uses the real clock, so the number of open seeds changes over time. Assert that "N open" equals the card count, not a fixed number.
