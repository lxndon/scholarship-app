export interface ApplicantProfile {
  name: string
  school: string
  major: string
  year: string
  gpa: string
  honors: string
  orgs: string
  skills: string
  careerTarget: string
  background: string
  essays: string[]
}

export interface Scholarship {
  id: string
  name: string
  amount: string
  deadline: string
  eligibility: string
  description: string
  prompts: string[]
  tags: string[]
  url?: string
}

export interface MatchScore {
  match_score: number
  win_probability_tier: 'high' | 'medium' | 'low'
  reason: string
}

export type TrackerStage = 'not_started' | 'in_progress' | 'submitted' | 'won' | 'lost'
