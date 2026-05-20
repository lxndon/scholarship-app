'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { ApplicantProfile, Scholarship } from '@/lib/types'

const client = new Anthropic()

const BANNED_PHRASES = [
  'Furthermore', 'Moreover', 'Additionally', 'In conclusion', 'In summary',
  'It is important to note', 'It is worth noting', 'I am passionate about',
  'I have always been', 'From a young age', 'journey', 'tapestry', 'testament',
  'delve', 'multifaceted', 'not only...but also', "In today's world",
  'I believe that', 'I feel that', 'It goes without saying', 'needless to say',
  'at the end of the day', 'game-changer', 'cutting-edge', 'leverage',
  'synergy', 'holistic', 'transformative', 'impactful', 'I am excited to',
  'I am honored to', 'I am thrilled', 'unique opportunity', 'ever-changing',
  'I strive to', 'it has taught me', 'this experience has shaped',
].join(', ')

export async function generateResponse(
  profile: ApplicantProfile,
  scholarship: Scholarship,
  prompt: string,
  resumeText?: string
): Promise<string> {
  const sampleEssays = profile.essays.filter(e => e.trim().length > 0)

  const resumeSection = resumeText
    ? `\nRESUME — pull exact roles, real numbers, and specific outcomes. Prefer "led a 6-person team" over "led a team":\n${resumeText.slice(0, 5000)}`
    : ''

  const voiceSection = sampleEssays.length > 0
    ? `\nVOICE SAMPLES — ${profile.name} actually wrote these. Mirror the sentence rhythm, vocabulary level, and cadence exactly. If they use fragments, use fragments. If they're terse, be terse:\n${sampleEssays.join('\n\n---\n\n')}`
    : ''

  const system = `You are ${profile.name}, a college student writing this scholarship essay yourself. You are not an AI assistant — you ARE this applicant. Write entirely in first person with a natural, slightly uneven rhythm that sounds like a real person, not a writing service.

WRITING RULES:
- Vary sentence length aggressively. Short punchy sentences matter. Then longer ones that build context and carry more weight across multiple clauses.
- Use contractions naturally: I've, I'm, it's, that's, didn't, wasn't, I'd, you'd
- Open with a specific moment, number, or concrete fact — never a vague claim or abstract value statement
- Show, don't tell: "I debugged a production outage at 2am" beats "I am dedicated and hardworking"
- Paragraphs can be 1–2 sentences — don't pad to fill space
- Use natural transitions only: "That's when", "Which is why", "But", "So", "Here's the thing"
- End with forward momentum — what you're going to do next — not a summary or grand declaration
- Specific always beats vague: real numbers, real project names, real outcomes
- Never start two consecutive sentences with "I"
- A claim must be followed immediately by a specific detail that proves it

BANNED PHRASES (never use any of these): ${BANNED_PHRASES}

BANNED STRUCTURES:
- Never open with "I have always..." or "From a young age..." or "Ever since..."
- Never list exactly three parallel points (it reads as AI)
- Never write a conclusion paragraph that restates the intro
- Never make a sweeping statement about changing the world or making an impact
- Never use a rhetorical question as an opener`

  const userContent = `Write a 250–300 word scholarship essay. Stay under 300 — do not pad.

APPLICANT:
${profile.name} | ${profile.school} | ${profile.major} | ${profile.year}
GPA: ${profile.gpa} | Honors: ${profile.honors}
Organizations: ${profile.orgs}
Skills: ${profile.skills}
Career Goal: ${profile.careerTarget}
${profile.background ? `Background: ${profile.background}` : ''}${resumeSection}${voiceSection}

SCHOLARSHIP: ${scholarship.name} (${scholarship.amount})
${scholarship.description}

PROMPT: ${prompt}

Write ONLY the essay. No title, no label, no preamble. Drop the reader directly into a specific moment or concrete fact on the very first word.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system,
    messages: [{ role: 'user', content: userContent }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
