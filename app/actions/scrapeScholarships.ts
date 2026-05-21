'use server'

import { tavily } from '@tavily/core'
import Anthropic from '@anthropic-ai/sdk'
import type { Scholarship, ApplicantProfile } from '@/lib/types'

type TavilyResult = { title: string; url: string; content: string; score: number }

function buildQueries(profile?: ApplicantProfile): string[] {
  const location = profile?.location?.trim() || 'Indiana'
  const school = (profile?.school ?? 'Indiana University').split(',')[0].trim()
  const hasKTP = profile?.orgs?.toLowerCase().includes('kappa')

  return [
    // National CS / tech
    'undergraduate computer science AI scholarships 2026 2027 apply now',
    'technology STEM scholarships undergraduate no essay small awards 2026 2027',
    'AI machine learning data science scholarships college students 2026 2027',

    // Location / state / local
    `${location} scholarships undergraduate college students 2026 2027 apply`,
    `${location} community foundation scholarship award 2026 2027`,
    `${location} state scholarships residents undergraduate financial aid 2026 2027`,
    `local county city scholarships undergraduate ${location} small awards $500 $1000 $2000`,

    // School-specific
    `"${school}" scholarship students award 2026 2027`,

    // Career / interest focus
    'consulting management technology business scholarships undergraduate STEM 2026 2027',
    'automation software engineering entrepreneurship scholarships undergraduate 2026 2027',

    // Organizations / identity
    hasKTP
      ? 'Kappa Theta Pi foundation scholarship technology fraternity 2026 2027'
      : 'professional technology Greek organization scholarship undergraduate 2026 2027',

    // Employer-sponsored
    'Google Microsoft Amazon Apple Adobe Salesforce scholarship undergraduate CS 2026 2027',

    // Need-based / first-gen / diverse backgrounds
    'first generation college student technology scholarships need-based 2026 2027',

    // Professional bodies (small money still counts)
    'ACM IEEE NCWIT CompTIA scholarship undergraduate computer science 2026 2027',
  ]
}

export async function scrapeScholarships(profile?: ApplicantProfile): Promise<Scholarship[]> {
  const tavilyKey = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey) throw new Error('TAVILY_API_KEY not set in .env.local')
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set in .env.local')

  const tc = tavily({ apiKey: tavilyKey })
  const queries = buildQueries(profile)

  const searchResults = await Promise.all(
    queries.map(q =>
      tc.search(q, { maxResults: 8, searchDepth: 'basic', includeAnswer: false }),
    ),
  )

  const seen = new Set<string>()
  const allResults: TavilyResult[] = []
  for (const r of searchResults.flatMap(r => r.results as TavilyResult[])) {
    if (r.score > 0.25 && !seen.has(r.url)) {
      seen.add(r.url)
      allResults.push(r)
    }
  }
  allResults.sort((a, b) => b.score - a.score)
  const top = allResults.slice(0, 70)

  if (top.length === 0) throw new Error('No search results returned from Tavily.')

  const context = top
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n')

  const location = profile?.location?.trim() || 'Indiana'
  const profileSummary = profile
    ? `Name: ${profile.name} | School: ${profile.school} | Major: ${profile.major} | Year: ${profile.year} | GPA: ${profile.gpa} | Honors: ${profile.honors} | Orgs: ${profile.orgs} | Skills: ${profile.skills} | Career: ${profile.careerTarget} | Location/Hometown: ${location} | Background: ${profile.background || 'Not specified'}`
    : `CS/AI student, Indiana University, sophomore, 3.2 GPA, tech organizations, consulting career goal, Indiana resident`

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: `You are building a comprehensive scholarship feed for a student. Your job is to find as many relevant scholarships as possible — big national awards AND small local ones. Any money is good money.

STUDENT PROFILE:
${profileSummary}

WEB SEARCH RESULTS (extract every scholarship mentioned):
${context}

INSTRUCTIONS:
1. Extract every distinct scholarship from the search results above.
2. ALSO add scholarships from your own training knowledge that match this student but aren't in the results. Focus especially on:
   - ${location}-specific scholarships (state, county, city, community foundations)
   - CS / AI / automation scholarships
   - Tech consulting / business + tech scholarships
   - Professional org scholarships (ACM, IEEE, NCWIT, etc.)
   - Employer scholarships (Google, Microsoft, Amazon, Meta, Apple, Accenture, Deloitte, etc.)
   - Greek/professional fraternity scholarships
   - Small local scholarships ($500–$2,000) that are easier to win
   - IU Bloomington / Luddy School specific awards

TARGET: Return 45–60 scholarships total. More is better. Do not artificially limit — include every one you find or know about.

For each scholarship, return a JSON object. If a field isn't known, make a reasonable inference — do NOT skip scholarships due to missing fields.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "id": "unique-kebab-case-id",
    "name": "Official Scholarship Name",
    "amount": "$X,XXX or Varies",
    "deadline": "Month Day, 2027",
    "eligibility": "1-2 sentence eligibility summary",
    "description": "2-3 sentences about the scholarship mission and focus.",
    "prompts": ["Essay prompt if known, otherwise empty array"],
    "tags": ["relevant", "tags"],
    "url": "application or info URL — use real URL from search results if available, otherwise official org website"
  }
]

RULES:
- Deadlines: use the 2026-2027 cycle. If a result shows a 2025 date, roll it forward to 2026 (same month/day).
- Deduplicate by name — include each scholarship only once.
- Include scholarships the student could realistically apply to given their profile.
- Tag location-specific scholarships with the location name (e.g. "indiana", "bloomington").
- Small awards ($500–$2,000) are valuable — include them.`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'

  // Extract the JSON array regardless of surrounding markdown fences or prose
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Claude did not return a JSON array. Raw: ${raw.slice(0, 300)}`)
  }
  const json = raw.slice(start, end + 1)

  let parsed: Scholarship[]
  try {
    parsed = JSON.parse(json) as Scholarship[]
  } catch {
    throw new Error(`Claude returned invalid JSON. Raw: ${raw.slice(0, 300)}`)
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Claude extracted 0 scholarships. Try again.')
  }

  return parsed.map(s => ({
    ...s,
    tags: [...(s.tags ?? []), 'ai-suggested'],
  }))
}
