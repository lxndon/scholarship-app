'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { ApplicantProfile, Scholarship } from '@/lib/types'

const client = new Anthropic()

export async function generateResponse(
  profile: ApplicantProfile,
  scholarship: Scholarship,
  prompt: string,
  resumeText?: string
): Promise<string> {
  const sampleEssays = profile.essays.filter(e => e.trim().length > 0)
  const resumeSection = resumeText
    ? `\nRESUME (draw specific experiences, roles, and achievements from this):\n${resumeText.slice(0, 5000)}`
    : ''

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Write a 250-300 word scholarship essay response. Voice: direct, achievement-focused, specific. No clichés. Lead with a concrete fact or accomplishment. First person.

APPLICANT:
${profile.name} | ${profile.school} | ${profile.major} | ${profile.year}
GPA: ${profile.gpa} | Honors: ${profile.honors}
Organizations: ${profile.orgs}
Skills: ${profile.skills}
Career Goal: ${profile.careerTarget}
${profile.background ? `Background: ${profile.background}` : ''}${resumeSection}
${sampleEssays.length > 0 ? `\nVOICE SAMPLES — match this tone exactly:\n${sampleEssays.join('\n\n')}` : ''}

SCHOLARSHIP: ${scholarship.name} (${scholarship.amount})
${scholarship.description}

PROMPT: ${prompt}

Write ONLY the essay. No title, no intro, no preamble.`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
