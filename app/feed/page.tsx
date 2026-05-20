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

// ── Icons ───────────────────────────────────────────────────────────────────

function SparkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function Spinner() {
  return <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
}

// ── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const r = 19
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  const colors: Record<string, { stroke: string; glow: string; text: string }> = {
    high:   { stroke: '#34d399', glow: '#10b981', text: 'text-emerald-400' },
    medium: { stroke: '#fbbf24', glow: '#f59e0b', text: 'text-amber-400' },
    low:    { stroke: '#fb7185', glow: '#f43f5e', text: 'text-rose-400' },
  }
  const c = colors[tier] ?? colors.low

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke={c.stroke}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 5px ${c.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`text-sm font-bold leading-none ${c.text}`}>{score}</span>
        <span className="text-[8px] uppercase tracking-widest text-white/30 leading-none font-medium">{tier}</span>
      </div>
    </div>
  )
}

// ── Tag colors (hashed) ──────────────────────────────────────────────────────

const TAG_PALETTES = [
  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'bg-orange-500/10 text-orange-400 border-orange-500/20',
]

function tagPalette(tag: string) {
  const hash = tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return TAG_PALETTES[hash % TAG_PALETTES.length]
}

// ── Card gradient border ─────────────────────────────────────────────────────

function cardBorder(tier: string | undefined) {
  if (tier === 'high')   return 'from-emerald-500/40 via-emerald-500/10 to-transparent hover:from-emerald-400/70 hover:via-emerald-500/20 hover:shadow-emerald-500/10'
  if (tier === 'medium') return 'from-amber-500/40 via-amber-500/10 to-transparent hover:from-amber-400/70 hover:via-amber-500/20 hover:shadow-amber-500/10'
  if (tier === 'low')    return 'from-rose-500/40 via-rose-500/10 to-transparent hover:from-rose-400/70 hover:via-rose-500/20 hover:shadow-rose-500/10'
  return 'from-indigo-500/20 via-blue-500/5 to-transparent hover:from-indigo-400/50 hover:via-blue-500/15 hover:shadow-indigo-500/10'
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isDeadlinePast(deadline: string): boolean {
  const d = new Date(deadline)
  return !isNaN(d.getTime()) && d < new Date()
}

function mergeScholarships(base: Scholarship[], live: Scholarship[]): Scholarship[] {
  const seen = new Set<string>()
  const result: Scholarship[] = []
  for (const s of [...base, ...live]) {
    const key = s.name.toLowerCase().trim()
    if (!seen.has(key)) { seen.add(key); result.push(s) }
  }
  return result
}

function formatLastUpdated(iso: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
  } catch { return '' }
}

// ── Page ─────────────────────────────────────────────────────────────────────

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

  const allScholarships = useMemo(() => mergeScholarships(hardcoded, liveScholarships), [liveScholarships])
  const { eligible, hiddenCount } = useMemo(() => {
    const eligible = allScholarships.filter(s => !isDeadlinePast(s.deadline))
    return { eligible, hiddenCount: allScholarships.length - eligible.length }
  }, [allScholarships])

  const sorted = useMemo(() =>
    [...eligible].sort((a, b) => {
      const sa = scores[a.id]?.match_score ?? -1
      const sb = scores[b.id]?.match_score ?? -1
      if (sa !== sb) return sb - sa
      return (new Date(a.deadline).getTime() || Infinity) - (new Date(b.deadline).getTime() || Infinity)
    }),
    [eligible, scores],
  )

  const isScored = Object.keys(scores).length > 0
  const avgScore = isScored
    ? Math.round(Object.values(scores).reduce((s, v) => s + v.match_score, 0) / Object.values(scores).length)
    : null

  async function handleScore() {
    if (!profile) return
    setScoring(true); setScoreError(null)
    try {
      const result = await scoreScholarships(profile, eligible, resumeText || undefined)
      setScores(result); saveScores(result)
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : 'Scoring failed.')
    } finally { setScoring(false) }
  }

  async function handleScrape() {
    setScraping(true); setScrapeError(null); setScrapeSuccess(null)
    try {
      const live = await scrapeScholarships(profile ?? undefined)
      const now = new Date().toISOString()
      saveLiveScholarships(live); saveLastUpdated(now)
      setLiveScholarships(live); setLastUpdated(now)
      setScrapeSuccess(`Found ${live.length} AI-suggested scholarships.`)
    } catch (e) {
      setScrapeError(e instanceof Error ? e.message : 'Scrape failed.')
    } finally { setScraping(false) }
  }

  return (
    <div className="relative">
      {/* Ambient glow behind header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-indigo-600/8 blur-3xl rounded-full pointer-events-none" />

      {/* ── Header ── */}
      <div className="relative flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Scholarship Feed
          </h1>
          <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
            <span className="text-sm font-medium text-slate-300">{eligible.length} open</span>
            {hiddenCount > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-sm text-slate-600">{hiddenCount} expired</span>
              </>
            )}
            {avgScore !== null && (
              <>
                <span className="text-slate-700">·</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                  avg score {avgScore}
                </span>
              </>
            )}
            {!isScored && (
              <>
                <span className="text-slate-700">·</span>
                <span className="text-sm text-slate-600">score with AI to rank by fit</span>
              </>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs text-slate-600 mt-1.5">
              AI suggestions refreshed {formatLastUpdated(lastUpdated)} · verify deadlines before applying
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* AI Discover */}
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="btn-glass btn-glass-secondary"
          >
            {scraping ? <Spinner /> : <SearchIcon />}
            {scraping ? 'Discovering…' : 'AI Discover'}
          </button>

          {/* Score with AI */}
          <button
            onClick={handleScore}
            disabled={scoring || !profile}
            className="btn-glass btn-glass-primary"
          >
            {scoring ? <Spinner /> : <SparkIcon />}
            {scoring ? 'Scoring…' : isScored ? 'Re-score' : 'Score with AI'}
          </button>
        </div>
      </div>

      {/* ── Status messages ── */}
      {scoreError && (
        <div className="mb-5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm px-4 py-3 rounded-xl">
          {scoreError}
        </div>
      )}
      {scrapeError && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm px-4 py-3 rounded-xl">
          {scrapeError}
        </div>
      )}
      {scrapeSuccess && (
        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
          <SparkIcon size={13} />
          {scrapeSuccess} Look for the <span className="font-bold text-blue-400">AI Pick</span> badge.
        </div>
      )}
      {(scoring || scraping) && (
        <div className="mb-5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
          <Spinner />
          {scoring
            ? 'Claude is scoring all scholarships against your profile… ~10–20 seconds.'
            : 'Searching with Tavily + Claude for scholarships tailored to you… ~15–25 seconds.'}
        </div>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map(scholarship => {
          const score = scores[scholarship.id]
          const tier = score?.win_probability_tier
          const isAI = scholarship.tags.includes('ai-suggested')
          const cleanTags = scholarship.tags.filter(t => t !== 'ai-suggested').slice(0, 3)

          return (
            /* Gradient border wrapper */
            <div
              key={scholarship.id}
              className={`p-[1px] rounded-2xl bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl cursor-default ${cardBorder(tier)}`}
            >
              {/* Card body */}
              <div className="bg-[#0a0a1e] rounded-[15px] p-5 flex flex-col gap-4 h-full">

                {/* Top row: badges + score ring */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {isAI && (
                      <span className="inline-flex items-center gap-1.5 w-fit text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-blue-500/15 to-violet-500/15 border border-blue-500/25 text-blue-300 px-2.5 py-1 rounded-full">
                        <SparkIcon size={9} />
                        AI Pick
                      </span>
                    )}
                    <h3 className="text-[15px] font-semibold text-white/90 leading-snug">
                      {scholarship.name}
                    </h3>
                  </div>
                  {score && <ScoreRing score={score.match_score} tier={tier!} />}
                </div>

                {/* Amount + deadline */}
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
                    {scholarship.amount}
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400">Due {scholarship.deadline}</span>
                </div>

                {/* Eligibility */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {scholarship.eligibility}
                </p>

                {/* AI reason */}
                {score && (
                  <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">
                    &ldquo;{score.reason}&rdquo;
                  </p>
                )}

                {/* Tags */}
                {cleanTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cleanTags.map(tag => (
                      <span
                        key={tag}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${tagPalette(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href={`/scholarship/${scholarship.id}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View & Generate →
                  </Link>
                  {scholarship.url && (
                    <a
                      href={scholarship.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      Apply ↗
                    </a>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && !scoring && (
        <div className="text-center py-24">
          <p className="text-slate-500 text-sm">No open scholarships found.</p>
          <p className="text-slate-700 text-xs mt-1">Try AI Discover to find new opportunities.</p>
        </div>
      )}
    </div>
  )
}
