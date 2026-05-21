'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { ApplicantProfile, Scholarship, MatchScore } from '@/lib/types'

const client = new Anthropic()

export async function scoreScholarships(
  profile: ApplicantProfile,
  scholarships: Scholarship[],
  resumeText?: string
): Promise<Record<string, MatchScore>> {
  const list = scholarships
    .map(
      s =>
        `ID: ${s.id}\nName: ${s.name}\nAmount: ${s.amount}\nEligibility: ${s.eligibility}\nDescription: ${s.description}`
    )
    .join('\n\n---\n\n')

  const resumeSection = resumeText
    ? `\nRESUME (use for richer eligibility matching):\n${resumeText.slice(0, 3000)}`
    : ''

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `You are a scholarship advisor. Score each scholarship match for this applicant.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{"<id>": {"match_score": <0-100>, "win_probability_tier": "<high|medium|low>", "reason": "<1 concise sentence>"}, ...}

Score every single scholarship in the list — do not skip any.
Use these tiers: high = 70+, medium = 40-69, low = 0-39.
Keep reasons short (under 15 words) to stay within token limits.

APPLICANT:
Name: ${profile.name}
School: ${profile.school}
Major: ${profile.major}
Year: ${profile.year}
GPA: ${profile.gpa}
Honors: ${profile.honors}
Organizations: ${profile.orgs}
Skills: ${profile.skills}
Career Goal: ${profile.careerTarget}
Background: ${profile.background || 'Not provided'}${resumeSection}

SCHOLARSHIPS:
${list}`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return {}
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, MatchScore>
}
