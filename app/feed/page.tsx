'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  loadProfile,
  loadScores,
  saveScores,
  loadResume,
  loadLiveScholarships,
  saveLiveScholarships,
  loadLastUpdated,
  saveLastUpdated,
} from '@/lib/profile'
import { scholarships as hardcoded } from '@/data/scholarships'
import { scoreScholarships } from '@/app/actions/score'
import { scrapeScholarships } from '@/app/actions/scrapeScholarships'
import type { ApplicantProfile, MatchScore, Scholarship } from '@/lib/types'

function isDeadlinePast(deadline: string): boolean {
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return false
  return d < new Date()
}

function mergeScholarships(base: Scholarship[], live: Scholarship[]): Scholarship[] {
  const seen = new Set<string>()
  const result: Scholarship[] = []
  for (const s of [...base, ...live]) {
    const key = s.name.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(s)
    }
  }
  return result
}

function formatLastUpdated(iso: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

export default function FeedPage() {
  const [profile, setProfile] = useState<ApplicantProfile | null>(null)
  const [scores, setScores] = useState<Record<string, MatchScore>>({})
  const [resumeText, setResumeText] = useState('')
  const [liveScholarships, setLiveScholarships] = useState<Scholarship[]>([])
  const [lastUpdated, setLastUpdated] = useState('')
  const [scoring, setScoring] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [scrapeSuccess, setScrapeSuccess] = useState<string | null>(null)

  useEffect(() => {
    setProfile(loadProfile())
    setScores(loadScores())
    setResumeText(loadResume())
    setLiveScholarships(loadLiveScholarships())
    setLastUpdated(loadLastUpdated())
  }, [])

  const allScholarships = useMemo(
    () => mergeScholarships(hardcoded, liveScholarships),
    [liveScholarships],
  )

  const { eligible, hiddenCount } = useMemo(() => {
    const eligible = allScholarships.filter(s => !isDeadlinePast(s.deadline))
    const hiddenCount = allScholarships.length - eligible.length
    return { eligible, hiddenCount }
  }, [allScholarships])

  const sorted = useMemo(
    () =>
      [...eligible].sort((a, b) => {
        const sa = scores[a.id]?.match_score ?? -1
        const sb = scores[b.id]?.match_score ?? -1
        if (sa !== sb) return sb - sa
        const da = new Date(a.deadline).getTime() || Infinity
        const db = new Date(b.deadline).getTime() || Infinity
        return da - db
      }),
    [eligible, scores],
  )

  const isScored = Object.keys(scores).length > 0

  async function handleScore() {
    if (!profile) return
    setScoring(true)
    setScoreError(null)
    try {
      const result = await scoreScholarships(profile, eligible, resumeText || undefined)
      setScores(result)
      saveScores(result)
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : 'Scoring failed. Check your API key.')
    } finally {
      setScoring(false)
    }
  }

  async function handleScrape() {
    setScraping(true)
    setScrapeError(null)
    setScrapeSuccess(null)
    try {
      const live = await scrapeScholarships(profile ?? undefined)
      const now = new Date().toISOString()
      saveLiveScholarships(live)
      saveLastUpdated(now)
      setLiveScholarships(live)
      setLastUpdated(now)
      setScrapeSuccess(`Found ${live.length} AI-suggested scholarships.`)
    } catch (e) {
      setScrapeError(
        e instanceof Error ? e.message : 'Scrape failed. Check your TAVILY_API_KEY.',
      )
    } finally {
      setScraping(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Scholarship Feed</h1>
          <p className="text-sm text-zinc-400 mt-1">
            {eligible.length} open scholarships
            {hiddenCount > 0 && (
              <span className="text-zinc-600"> · {hiddenCount} expired hidden</span>
            )}
            {isScored ? ' · sorted by match score' : ' · score with AI to rank by fit'}
          </p>
          {lastUpdated && (
            <p className="text-xs text-zinc-600 mt-0.5">
              AI suggestions last refreshed {formatLastUpdated(lastUpdated)} · verify deadlines before applying
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="shrink-0 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 text-sm font-medium px-4 py-2 rounded transition-colors border border-zinc-700"
          >
            {scraping ? 'Discovering…' : 'AI Discover'}
          </button>
          <button
            onClick={handleScore}
            disabled={scoring || !profile}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded transition-colors"
          >
            {scoring ? 'Scoring…' : isScored ? 'Re-score' : 'Score with AI'}
          </button>
        </div>
      </div>

      {scoreError && (
        <div className="mb-4 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded">
          {scoreError}
        </div>
      )}
      {scrapeError && (
        <div className="mb-4 bg-yellow-950 border border-yellow-800 text-yellow-300 text-sm px-4 py-3 rounded">
          {scrapeError}
        </div>
      )}
      {scrapeSuccess && (
        <div className="mb-4 bg-green-950 border border-green-800 text-green-300 text-sm px-4 py-3 rounded">
          {scrapeSuccess} Look for cards with the <span className="font-semibold">AI</span> badge.
        </div>
      )}

      {scoring && (
        <div className="mb-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm px-4 py-3 rounded">
          Calling Claude to score all scholarships against your profile… ~10–20 seconds.
        </div>
      )}
      {scraping && (
        <div className="mb-4 bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm px-4 py-3 rounded">
          Searching with Tavily + Claude for scholarships tailored to your profile… ~15–25 seconds.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(scholarship => {
          const score = scores[scholarship.id]
          return (
            <div
              key={scholarship.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
                    {scholarship.name}
                  </h3>
                  {scholarship.tags.includes('ai-suggested') && (
                    <span className="text-xs bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  )}
                </div>
                {score && (
                  <span
                    className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${tierBadge(score.win_probability_tier)}`}
                  >
                    {score.match_score}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-purple-400 font-medium">{scholarship.amount}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">Due {scholarship.deadline}</span>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2">{scholarship.eligibility}</p>

              {score && <p className="text-xs text-zinc-500 italic">{score.reason}</p>}

              <div className="flex flex-wrap gap-1 mt-auto pt-1">
                {scholarship.tags.filter(t => t !== 'ai-suggested').slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/scholarship/${scholarship.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  View & Generate Responses →
                </Link>
                {scholarship.url && (
                  <a
                    href={scholarship.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Apply ↗
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function tierBadge(tier: string) {
  if (tier === 'high') return 'bg-green-950 text-green-400'
  if (tier === 'medium') return 'bg-yellow-950 text-yellow-400'
  return 'bg-red-950 text-red-400'
}
