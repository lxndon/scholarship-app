@AGENTS.md
# Scholarship Intelligence App — Project Context

## Stack
- Next.js 16 (App Router), TypeScript
- Tailwind CSS v4 — always dark, zinc palette
- Vercel for deployment
- @anthropic-ai/sdk (claude-sonnet-4-20250514) via server actions only
- localStorage for all state (no database yet)

## What This App Does
Personal tool for Landon Hill to find, score, and apply to scholarships.
Core flow: Profile → Feed (AI-scored) → Detail/Response Generator → Tracker.

## My Applicant Profile (injected into every Claude prompt)
- Name: Landon Hill
- School: Indiana University, Luddy School of Informatics
- Major: Computer Science, AI specialization
- Year: Sophomore, Class of 2028
- GPA: 3.23
- Honors: Hudson & Holland Scholar
- Orgs: Kappa Theta Pi, 812 Consulting
- Skills: n8n, Make.com, Apify, Next.js, Java, Python, AI/ML, automation
- Career target: tech-focused management consulting

## Architecture Decisions
- Pages are 'use client' components (need localStorage); server actions handle all Claude API calls
- scoreScholarships() sends all scholarships in one prompt — efficient, avoids N API calls
- Scores cached in localStorage (key: scholarship-scores); cleared on re-score
- params in dynamic routes are async (Next.js 15+ requirement): await params in page.tsx
- All localStorage operations centralized in lib/profile.ts
- DEFAULT_PROFILE pre-fills Landon's data so the app works on first load

## Rules
- All Claude API calls go through /app/actions/ — never call Anthropic SDK client-side
- No unnecessary dependencies — this file is the source of truth
- Build lean and functional before adding polish
- Dark mode always on (hardcoded zinc colors, no dark: prefix needed)
- TypeScript strict — no any

## Environment
- ANTHROPIC_API_KEY must be set in .env.local

## File Structure
- /app/actions/score.ts    — scoreScholarships() server action
- /app/actions/generate.ts — generateResponse() server action
- /app/Nav.tsx             — top navigation (client, uses usePathname)
- /app/feed/page.tsx       — scholarship feed with AI scoring
- /app/profile/page.tsx    — profile form (localStorage-backed)
- /app/scholarship/[id]/page.tsx      — async server wrapper, awaits params
- /app/scholarship/[id]/DetailClient.tsx — essay generator UI
- /app/tracker/page.tsx    — application stage tracker
- /lib/types.ts            — ApplicantProfile, Scholarship, MatchScore, TrackerStage
- /lib/profile.ts          — all localStorage read/write helpers + DEFAULT_PROFILE
- /data/scholarships.ts    — 12 hardcoded seed scholarships
