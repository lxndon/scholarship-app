# Scholarship Intelligence App

A personal tool for finding, scoring, and applying to scholarships — powered by Claude AI.

## Features

- **AI-Scored Feed** — scholarships ranked by match quality against your applicant profile
- **Essay Generator** — Claude drafts tailored responses to scholarship prompts
- **Application Tracker** — kanban-style board to track application stages
- **Profile** — stores your academic background, used in every AI prompt
- **Resume Parser** — extracts profile data from an uploaded resume

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 — dark mode, zinc palette
- Claude API (`claude-sonnet-4-20250514`) via server actions
- localStorage for all state (no database)
- Vercel for deployment

## Project Structure

```
app/
├── actions/          # Server actions — all Claude API calls live here
│   ├── score.ts      # scoreScholarships() — AI match scoring
│   ├── generate.ts   # generateResponse() — essay drafting
│   ├── scrapeScholarships.ts
│   └── parse-resume.ts
├── feed/             # Scholarship feed with AI scores
├── profile/          # Applicant profile form (localStorage-backed)
├── scholarship/[id]/ # Scholarship detail + essay generator
├── tracker/          # Application stage tracker
└── Nav.tsx
data/
└── scholarships.ts   # Seed scholarship data
lib/
├── profile.ts        # localStorage helpers + DEFAULT_PROFILE
└── types.ts          # ApplicantProfile, Scholarship, MatchScore, TrackerStage
```

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture Notes

- All Claude API calls go through `/app/actions/` — the Anthropic SDK is never called client-side
- `scoreScholarships()` sends all scholarships in a single prompt to avoid N API calls
- Scores are cached in localStorage under `scholarship-scores` and cleared on re-score
- Dynamic route params are async (`await params`) per Next.js 15+ requirements
