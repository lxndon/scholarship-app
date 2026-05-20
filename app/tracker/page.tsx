'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadTracker, saveTracker, loadScores } from '@/lib/profile'
import { scholarships } from '@/data/scholarships'
import type { TrackerStage, MatchScore } from '@/lib/types'

const STAGES: { id: TrackerStage; label: string; dotColor: string; textColor: string; bgColor: string; borderColor: string }[] = [
  {
    id: 'not_started',
    label: 'Not Started',
    dotColor: 'bg-zinc-500',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-800/30',
    borderColor: 'border-zinc-700/40',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-800/30',
  },
  {
    id: 'submitted',
    label: 'Submitted',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-900/20',
    borderColor: 'border-amber-800/30',
  },
  {
    id: 'won',
    label: 'Won',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-800/30',
  },
  {
    id: 'lost',
    label: 'Lost',
    dotColor: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-800/30',
  },
]

function scoreColor(tier: string) {
  if (tier === 'high') return 'text-emerald-400'
  if (tier === 'medium') return 'text-amber-400'
  return 'text-red-400'
}

export default function TrackerPage() {
  const [tracker, setTracker] = useState<Record<string, TrackerStage>>({})
  const [scores, setScores] = useState<Record<string, MatchScore>>({})

  useEffect(() => {
    setTracker(loadTracker())
    setScores(loadScores())
  }, [])

  function getStage(id: string): TrackerStage {
    return tracker[id] ?? 'not_started'
  }

  function moveStage(id: string, delta: -1 | 1) {
    const currentIdx = STAGES.findIndex(s => s.id === getStage(id))
    const nextIdx = currentIdx + delta
    if (nextIdx < 0 || nextIdx >= STAGES.length) return
    const updated = { ...tracker, [id]: STAGES[nextIdx].id }
    setTracker(updated)
    saveTracker(updated)
  }

  const byStage = Object.fromEntries(
    STAGES.map(s => [s.id, scholarships.filter(sch => getStage(sch.id) === s.id)])
  ) as Record<TrackerStage, typeof scholarships>

  const stats = {
    inProgress: byStage.in_progress.length,
    submitted: byStage.submitted.length,
    won: byStage.won.length,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Application Tracker</h1>
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {stats.inProgress} in progress
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {stats.submitted} submitted
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {stats.won} won
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-5 gap-3 min-h-[480px]">
        {STAGES.map((stage, stageIdx) => {
          const cards = byStage[stage.id]
          return (
            <div key={stage.id} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${stage.textColor}`}>
                  {stage.label}
                </span>
                <span className="ml-auto text-xs text-zinc-600 font-medium tabular-nums">
                  {cards.length}
                </span>
              </div>

              {/* Column drop zone */}
              <div className={`flex-1 rounded-xl border ${stage.borderColor} ${stage.bgColor} p-2 flex flex-col gap-2 min-h-[420px]`}>
                {cards.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-zinc-700">Empty</p>
                  </div>
                ) : (
                  cards.map(sch => {
                    const score = scores[sch.id]
                    return (
                      <div
                        key={sch.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2.5 hover:border-zinc-700 transition-colors"
                      >
                        <Link
                          href={`/scholarship/${sch.id}`}
                          className="text-xs font-semibold text-zinc-100 hover:text-blue-400 transition-colors leading-snug block"
                        >
                          {sch.name}
                        </Link>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-medium text-amber-400">{sch.amount}</span>
                          {score && (
                            <>
                              <span className="text-zinc-700">·</span>
                              <span className={`text-[11px] font-bold ${scoreColor(score.win_probability_tier)}`}>
                                {score.match_score}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-600">Due {sch.deadline}</p>

                        {/* Move buttons */}
                        <div className="flex gap-1 pt-0.5">
                          {stageIdx > 0 && (
                            <button
                              onClick={() => moveStage(sch.id, -1)}
                              className="flex-1 btn-glass btn-glass-ghost btn-glass-sm"
                            >
                              ← Back
                            </button>
                          )}
                          {stageIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => moveStage(sch.id, 1)}
                              className="flex-1 btn-glass btn-glass-blue btn-glass-sm"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
