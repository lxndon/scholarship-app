# Tracker

The tracker shows every scholarship (seed plus AI-discovered) in five kanban columns: Not Started, In Progress, Submitted, Won and Lost. Each card has `Next →` and `← Back` buttons that move it one stage. The header chips count in progress, submitted and won. Stages persist in localStorage.

## Sub-features

- `tracker-move-next` moves a card one column right and updates the header chips.
- `tracker-move-back` moves a card one column left.
- `tracker-persist` keeps stages after a reload.
- `tracker-edges` shows no Back button in Not Started and no Next button in Lost.
- `tracker-scores` shows the match score on cards after scoring on the feed.
- `tracker-live` includes AI Discover results that aren't duplicates of seed names.

## How to get to it (user POV)

- Click `Tracker` in the left nav.
- Go directly to `/tracker`.
- Click a card's name to open `/scholarship/<id>`. That exit is covered in [detail](./detail.md).

## Driving it with vsa + Playwright

Preconditions: `vsa doctor` is OK, with a fresh context and no `scholarship-tracker` key.

- **Baseline.** Run `vsa drive tracker`. The output shows `PASS: Dell Scholars Program starts in Not Started` and `PASS: header shows 0 in progress`.
- **Next.** The scenario clicks `Next →` inside the card whose link is `Dell Scholars Program`. The card's column header reads `IN PROGRESS`, the chip reads `1 in progress`, and `storage-after-next.json` has `"dell-scholars": "in_progress"`.
- **Reload.** The page reloads and the card is still in In Progress.
- **Back.** It clicks `← Back`. The card returns to Not Started and the stored value is `not_started`.
- **Proof.** The evidence dir contains `01-before` through `04-after-back` (`.png` + `.aria.txt`), the two storage dumps, and `transcript.txt` ending `exit=0`.
- **Edge.** The scenario also checks that a Not Started card has no `← Back` button. The Lost-side edge (no `Next →`) isn't driven.
- `tracker-scores` and `tracker-live` have no scenario yet. Extend `tracker.mjs` when a change touches them.

## Gotchas

- Column labels are uppercased by CSS, so `innerText` returns `NOT STARTED`. Compare case-insensitively.
- A card is located as the parent of its name link. The column header is the previous sibling of the card's parent drop zone.
- The Next dev indicator ("N" bubble, bottom left) overlaps the nav user box in screenshots. That's dev-only chrome, not a bug.
- Moving past Won into Lost is a plain stage change, with no confirmation dialog.
