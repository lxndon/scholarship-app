'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadProfile, loadScores, loadResume } from '@/lib/profile'
import { generateResponse } from '@/app/actions/generate'
import type { Scholarship, MatchScore } from '@/lib/types'

interface Props {
  scholarship: Scholarship
}

function Spinner() {
  return <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
}

function SparkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function tierCardClass(tier: string) {
  if (tier === 'high') return 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
  if (tier === 'medium') return 'bg-amber-950/60 border-amber-800/60 text-amber-400'
  return 'bg-red-950/60 border-red-800/60 text-red-400'
}

export default function DetailClient({ scholarship }: Props) {
  const [profileReady, setProfileReady] = useState(false)
  const [score, setScore] = useState<MatchScore | null>(null)
  const [responses, setResponses] = useState<Record<number, string>>({})
  const [generating, setGenerating] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    const scores = loadScores()
    setScore(scores[scholarship.id] ?? null)
    setProfileReady(true)
  }, [scholarship.id])

  async function handleGenerate(promptIndex: number) {
    setGenerating(prev => ({ ...prev, [promptIndex]: true }))
    setErrors(prev => ({ ...prev, [promptIndex]: '' }))
    try {
      const profile = loadProfile()
      const resume = loadResume() || undefined
      const text = await generateResponse(profile, scholarship, scholarship.prompts[promptIndex], resume)
      setResponses(prev => ({ ...prev, [promptIndex]: text }))
    } catch (e) {
      setErrors(prev => ({
        ...prev,
        [promptIndex]: e instanceof Error ? e.message : 'Generation failed.',
      }))
    } finally {
      setGenerating(prev => ({ ...prev, [promptIndex]: false }))
    }
  }

  async function handleCopy(index: number) {
    const text = responses[index]
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  function updateResponse(index: number, value: string) {
    setResponses(prev => ({ ...prev, [index]: value }))
  }

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeftIcon />
        Back to Feed
      </Link>

      {/* Scholarship header card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-5">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-zinc-100 leading-snug">{scholarship.name}</h1>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-sm font-semibold text-amber-400">{scholarship.amount}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-sm text-zinc-400">Deadline: {scholarship.deadline}</span>
              {scholarship.url && (
                <>
                  <span className="text-zinc-700">·</span>
                  <a
                    href={scholarship.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Apply ↗
                  </a>
                </>
              )}
            </div>
          </div>

          {score && (
            <div className={`shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border ${tierCardClass(score.win_probability_tier)}`}>
              <span className="text-2xl font-bold leading-none">{score.match_score}</span>
              <span className="text-[10px] uppercase tracking-wider mt-1 opacity-80">{score.win_probability_tier}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800/70 flex flex-col gap-2">
          <p className="text-sm text-zinc-400 leading-relaxed">{scholarship.description}</p>
          <p className="text-xs text-zinc-500">
            <span className="text-zinc-600">Eligibility:</span> {scholarship.eligibility}
          </p>
          {score && (
            <p className="text-xs text-zinc-500 italic mt-1">&ldquo;{score.reason}&rdquo;</p>
          )}
          {!score && profileReady && (
            <p className="text-xs text-zinc-600 mt-1">
              No match score yet —{' '}
              <Link href="/feed" className="text-blue-500 hover:text-blue-400 underline underline-offset-2">
                score from the feed
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* Essay prompts */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-100">
          Essay Prompts
          <span className="ml-2 text-xs font-normal text-zinc-500">({scholarship.prompts.length})</span>
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {scholarship.prompts.map((prompt, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            {/* Prompt header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-400 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed">{prompt}</p>
              </div>
              <button
                onClick={() => handleGenerate(i)}
                disabled={generating[i] || !profileReady}
                className="shrink-0 btn-glass btn-glass-primary btn-glass-sm"
              >
                {generating[i] ? <Spinner /> : <SparkIcon />}
                {generating[i] ? 'Writing…' : responses[i] ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {errors[i] && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 px-3 py-2 rounded-lg">
                {errors[i]}
              </p>
            )}

            {generating[i] && !responses[i] && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 px-3 py-2.5 rounded-lg">
                <Spinner />
                Claude is writing your response…
              </div>
            )}

            {responses[i] && (
              <div className="flex flex-col gap-2.5">
                <textarea
                  value={responses[i]}
                  onChange={e => updateResponse(i, e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-blue-500/70 resize-y transition-colors leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 tabular-nums">
                    {responses[i].split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button
                    onClick={() => handleCopy(i)}
                    className="btn-glass btn-glass-secondary btn-glass-sm"
                  >
                    {copied === i ? <CheckIcon /> : <CopyIcon />}
                    {copied === i ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
