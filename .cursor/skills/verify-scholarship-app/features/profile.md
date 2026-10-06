# Profile

The profile page is a form, pre-filled with Landon's defaults, for basic info, activities, background and three sample essays. A resume PDF upload extracts text on the server and stores it locally. Saving writes to localStorage, and every AI call on the feed and detail pages reads the profile.

## Sub-features

- `profile-defaults` shows DEFAULT_PROFILE when nothing is saved.
- `profile-save` saves edits, shows a `Saved` confirmation, and writes `scholarship-profile`.
- `profile-persist` keeps edits after a reload.
- `profile-resume-upload` takes a PDF via `Choose PDF` then `Upload & Parse`, shows "N words extracted", and writes `resume_text`.
- `profile-resume-remove` clears it with `Remove`.

## How to get to it (user POV)

- Click `Profile` in the left nav.
- Go directly to `/profile`.

## Driving it with vsa + Playwright

Preconditions: `vsa doctor` is OK and the context is fresh.

- **Defaults.** Run `vsa drive profile`. The output shows `PASS: fresh context shows DEFAULT_PROFILE name`.
- **Edit and save.** The scenario fills `GPA` with `3.99` and `Background` with a unique `vsa-<ts>` marker, then clicks `Save Profile`. `Saved` appears and `storage-profile.json` shows both values.
- **Reload.** After a reload the inputs still hold `3.99` and the marker.
- **Resume upload.** Run `vsa drive resume`. The scenario renders a synthetic PDF with `page.pdf()` into the evidence dir (never the user's real resume), sets it on the hidden `input[type=file]`, and checks that `synthetic-resume.pdf` is shown. It clicks `Upload & Parse` and expects `words extracted` and a `resume_text` containing the marker. Then it clicks `Remove`, expects `No resume uploaded yet.`, and checks that the key is gone. Parsing runs in a server action with pdf-parse and makes no AI call. On failure the red error text below the buttons goes into the FAIL line, and the server stack trace is in `run/server.log`.

## Gotchas

- Labels have no `htmlFor`, so `getByLabel('GPA')` finds nothing. Use the `field(page, label)` helper in `profile.mjs`.
- Inputs fill from localStorage after hydration. Wait for the expected value (`waitForFunction`) before asserting after a reload.
- `resume_text` is stored as plain text, not JSON. Read it with `localStorage.getItem`, not `readStorage`.
- `Saved` disappears after 2.5s. Assert it right after the click.
- The nav footer always reads "Landon Hill" because it's hardcoded. Don't use it as proof of a saved name.
