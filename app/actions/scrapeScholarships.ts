'use server'

import { tavily } from '@tavily/core'
import Anthropic from '@anthropic-ai/sdk'
import type { Scholarship, ApplicantProfile } from '@/lib/types'

type TavilyResult = { title: string; url: string; content: string; score: number }

function buildQueries(profile?: ApplicantProfile): string[] {
  return [
    'computer science AI scholarships Indiana University undergraduate 2026 2027 apply',
    'technology consulting scholarships undergraduate STEM student 2026 2027',
    'first generation college student technology scholarships 2026 2027 apply now',
    profile?.orgs?.toLowerCase().includes('kappa')
      ? 'Kappa Theta Pi foundation scholarship professional technology fraternity'
      : 'Greek technology organization scholarship professional fraternity 2026',
    `${profile?.major ?? 'computer science'} scholarships sophomore junior undergraduate 2026 2027`,
  ]
}

export async function scrapeScholarships(profile?: ApplicantProfile): Promise<Scholarship[]> {
  const tavilyKey = process.env.TAVILY_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!tavilyKey) throw new Error('TAVILY_API_KEY not set in .env.local')
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set in .env.local')

  const client = tavily({ apiKey: tavilyKey })
  const queries = buildQueries(profile)

  const searchResults = await Promise.all(
    queries.map(q =>
      client.search(q, { maxResults: 6, searchDepth: 'basic', includeAnswer: false }),
    ),
  )

  const allResults: TavilyResult[] = searchResults
    .flatMap(r => r.results as TavilyResult[])
    .filter(r => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)

  if (allResults.length === 0) throw new Error('No search results returned from Tavily.')

  const context = allResults
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join('\n\n---\n\n')

  const profileSummary = profile
    ? `School: ${profile.school} | Major: ${profile.major} | Year: ${profile.year} | GPA: ${profile.gpa} | Honors: ${profile.honors} | Orgs: ${profile.orgs} | Career: ${profile.careerTarget}`
    : 'CS/AI student, Indiana University, sophomore, 3.2 GPA, tech organizations, consulting career goal'

  const anthropic = new Anthropic({ apiKey: anthropicKey })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are extracting scholarship data from live web search results.

Student profile: ${profileSummary}

Web search results:
${context}

Extract every distinct scholarship mentioned across all results. For each one, return a JSON object. If a field isn't clearly stated, make a reasonable inference or leave it as an empty string — do NOT skip scholarships just because some fields are missing.

Return ONLY a valid JSON array, no markdown fences, no explanation:
[
  {
    "id": "unique-kebab-case-id",
    "name": "Official Scholarship Name",
    "amount": "$X,XXX or Varies",
    "deadline": "Month Day, 2027",
    "eligibility": "1-2 sentence summary",
    "description": "2-3 sentences about the scholarship mission and focus.",
    "prompts": ["Essay prompt if mentioned, otherwise empty array"],
    "tags": ["relevant", "tags"],
    "url": "direct application or info URL from the search results"
  }
]

Rules:
- Use the actual URL from the search result for each scholarship
- Set deadlines to the 2026-2027 cycle. If a search result shows a 2025 date, assume the scholarship is annual and update to 2026 (same month/day). Never use 2025 dates.
- Deduplicate — include each scholarship only once
- Include only scholarships this student could realistically apply to
- Return 8-15 scholarships`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  const json = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  let parsed: Scholarship[]
  try {
    parsed = JSON.parse(json) as Scholarship[]
  } catch {
    throw new Error(`Claude returned invalid JSON. Raw response: ${raw.slice(0, 200)}`)
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Claude extracted 0 scholarships from the search results. Try again or check Tavily results.')
  }

  return parsed.map(s => ({
    ...s,
    tags: [...(s.tags ?? []), 'ai-suggested'],
  }))
}
