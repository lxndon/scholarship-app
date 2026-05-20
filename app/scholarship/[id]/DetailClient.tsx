'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadProfile, loadScores, loadResume } from '@/lib/profile'
import { generateResponse } from '@/app/actions/generate'
import type { Scholarship, MatchScore } from '@/lib/types'

interface Props {
  scholarship: Scholarship
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
      <div className="mb-5">
        <Link href="/feed" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          ← Back to Feed
        </Link>
      </div>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{scholarship.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-purple-400 font-medium">{scholarship.amount}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400">Deadline: {scholarship.deadline}</span>
            </div>
          </div>
          {score && (
            <div
              className={`shrink-0 text-center px-4 py-2 rounded-lg border ${tierCard(score.win_probability_tier)}`}
            >
              <div className="text-2xl font-bold leading-none">{score.match_score}</div>
              <div className="text-xs uppercase tracking-wide mt-0.5">{score.win_probability_tier}</div>
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{scholarship.description}</p>
        <p className="text-xs text-zinc-500 mt-2">Eligibility: {scholarship.eligibility}</p>
        {score && <p className="text-xs text-zinc-500 italic mt-2">{score.reason}</p>}
        {!score && profileReady && (
          <p className="text-xs text-zinc-600 mt-2">
            No match score yet —{' '}
            <Link href="/feed" className="text-blue-500 hover:text-blue-400">
              score from the feed
            </Link>
            .
          </p>
        )}
      </div>

      {/* Essay Prompts */}
      <h2 className="text-base font-semibold text-zinc-100 mb-4">
        Essay Prompts ({scholarship.prompts.length})
      </h2>
      <div className="flex flex-col gap-4">
        {scholarship.prompts.map((prompt, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-zinc-300 leading-relaxed">{prompt}</p>
              <button
                onClick={() => handleGenerate(i)}
                disabled={generating[i] || !profileReady}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
              >
                {generating[i] ? 'Writing…' : responses[i] ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {errors[i] && (
              <p className="text-xs text-red-400">{errors[i]}</p>
            )}

            {responses[i] && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={responses[i]}
                  onChange={e => updateResponse(i, e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 resize-y"
                />
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{responses[i].split(/\s+/).filter(Boolean).length} words</span>
                  <button
                    onClick={() => handleCopy(i)}
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {copied === i ? 'Copied!' : 'Copy to clipboard'}
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

function tierCard(tier: string) {
  if (tier === 'high') return 'bg-green-950 border-green-800 text-green-400'
  if (tier === 'medium') return 'bg-yellow-950 border-yellow-800 text-yellow-400'
  return 'bg-red-950 border-red-800 text-red-400'
}
