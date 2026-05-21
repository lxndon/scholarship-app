import type { ApplicantProfile, MatchScore, TrackerStage } from './types'

export const DEFAULT_PROFILE: ApplicantProfile = {
  name: 'Landon Hill',
  school: 'Indiana University, Luddy School of Informatics',
  major: 'Computer Science, AI specialization',
  year: 'Sophomore (Class of 2028)',
  gpa: '3.23',
  honors: 'Hudson & Holland Scholar',
  orgs: 'Kappa Theta Pi, 812 Consulting',
  skills: 'n8n, Make.com, Apify, Next.js, Java, Python, AI/ML, automation',
  careerTarget: 'Tech-focused management consulting',
  background: '',
  location: 'Indiana',
  essays: ['', '', ''],
}

const KEYS = {
  profile: 'scholarship-profile',
  scores: 'scholarship-scores',
  tracker: 'scholarship-tracker',
  resume: 'resume_text',
} as const

function safeRead<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadProfile(): ApplicantProfile {
  return { ...DEFAULT_PROFILE, ...safeRead<Partial<ApplicantProfile>>(KEYS.profile, {}) }
}

export function saveProfile(profile: ApplicantProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile))
}

export function loadScores(): Record<string, MatchScore> {
  return safeRead<Record<string, MatchScore>>(KEYS.scores, {})
}

export function saveScores(scores: Record<string, MatchScore>): void {
  localStorage.setItem(KEYS.scores, JSON.stringify(scores))
}

export function loadTracker(): Record<string, TrackerStage> {
  return safeRead<Record<string, TrackerStage>>(KEYS.tracker, {})
}

export function saveTracker(tracker: Record<string, TrackerStage>): void {
  localStorage.setItem(KEYS.tracker, JSON.stringify(tracker))
}

export function loadResume(): string {
  try {
    return localStorage.getItem(KEYS.resume) ?? ''
  } catch {
    return ''
  }
}

export function saveResume(text: string): void {
  localStorage.setItem(KEYS.resume, text)
}

export function clearResume(): void {
  localStorage.removeItem(KEYS.resume)
}

export function loadLiveScholarships(): import('./types').Scholarship[] {
  return safeRead<import('./types').Scholarship[]>('scholarship-live', [])
}

export function saveLiveScholarships(scholarships: import('./types').Scholarship[]): void {
  localStorage.setItem('scholarship-live', JSON.stringify(scholarships))
}

export function loadLastUpdated(): string {
  try {
    return localStorage.getItem('scholarship-last-updated') ?? ''
  } catch {
    return ''
  }
}

export function saveLastUpdated(iso: string): void {
  localStorage.setItem('scholarship-last-updated', iso)
}
