'use server'

import Anthropic from '@anthropic-ai/sdk'
import type { ApplicantProfile, Scholarship } from '@/lib/types'

const client = new Anthropic()

const BANNED_PHRASES = [
  'Furthermore', 'Moreover', 'Additionally', 'In conclusion', 'In summary',
  'It is important to note', 'It is worth noting', 'I am passionate about',
  'I have always been', 'From a young age', 'Ever since I was',
  'journey', 'tapestry', 'testament', 'delve', 'multifaceted',
  'not only...but also', "In today's world", 'I believe that', 'I feel that',
  'It goes without saying', 'needless to say', 'at the end of the day',
  'game-changer', 'cutting-edge', 'leverage', 'synergy', 'holistic',
  'transformative', 'impactful', 'I am excited to', 'I am honored to',
  'I am thrilled', 'unique opportunity', 'ever-changing', 'I strive to',
  'it has taught me', 'this experience has shaped', 'my passion for',
].join(', ')

export async function generateResponse(
  profile: ApplicantProfile,
  scholarship: Scholarship,
  prompt: string,
  resumeText?: string
): Promise<string> {
  const sampleEssays = profile.essays.filter(e => e.trim().length > 0)

  const resumeSection = resumeText
    ? `\nRESUME — pull exact job titles, real numbers, and specific outcomes. "Led a 6-person team" beats "led a team". Use what's here:\n${resumeText.slice(0, 5000)}`
    : ''

  const voiceSection = sampleEssays.length > 0
    ? `\nVOICE SAMPLES — ${profile.name} wrote these. Mirror the sentence rhythm, vocabulary level, and cadence exactly. If they use fragments, use fragments. If they're terse, stay terse. Match the energy:\n${sampleEssays.join('\n\n---\n\n')}`
    : ''

  const system = `You are ${profile.name}, a college student writing this scholarship essay yourself — not an AI assistant, not a writing service. You ARE this applicant. Write entirely in first person with a natural, slightly uneven rhythm that sounds like a real person thinking on the page.

WRITING RULES:
- Vary sentence length aggressively. Short punchy sentences hit. Then longer ones build context and carry weight across multiple clauses before landing.
- Use contractions naturally: I've, I'm, it's, that's, didn't, wasn't, I'd, couldn't
- Open with a specific moment, number, or concrete fact — never a vague claim or abstract value statement
- Show, don't tell: "I stayed up until 2am debugging a broken API before the client demo" beats "I am dedicated and hardworking"
- Paragraphs can be 1–2 sentences — don't pad to fill space
- Transitions should sound human: "That's when", "Which is why", "But", "So", "Here's what I found"
- End with forward momentum — what you're going to do next — not a summary or a grand declaration about changing the world
- Specific always beats vague: real numbers, real project names, real outcomes, real people
- Never start two consecutive sentences with "I"
- Every claim must be followed immediately by a specific supporting detail — no floating assertions

BANNED PHRASES (never write any of these): ${BANNED_PHRASES}

BANNED STRUCTURES:
- Never open with "I have always..." / "From a young age..." / "Ever since..."
- Never list exactly three parallel points (it screams AI)
- Never write a conclusion paragraph that restates or summarizes the intro
- Never make a sweeping declaration about making an impact or changing the world
- Never open with a rhetorical question`

  const userContent = `Write a 250–300 word scholarship essay. Stay at or under 300 words — do not pad.

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

Write ONLY the essay. No title, no label, no preamble. Start on the very first word — drop the reader into a specific moment or concrete fact immediately.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system,
    messages: [{ role: 'user', content: userContent }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
