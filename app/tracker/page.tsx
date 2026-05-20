'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadTracker, saveTracker, loadScores } from '@/lib/profile'
import { scholarships } from '@/data/scholarships'
import type { TrackerStage, MatchScore } from '@/lib/types'

const STAGES: { id: TrackerStage; label: string; color: string }[] = [
  { id: 'not_started', label: 'Not Started', color: 'text-zinc-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400' },
  { id: 'submitted', label: 'Submitted', color: 'text-yellow-400' },
  { id: 'won', label: 'Won', color: 'text-green-400' },
  { id: 'lost', label: 'Lost', color: 'text-red-400' },
]

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Application Tracker</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {stats.inProgress} in progress · {stats.submitted} submitted · {stats.won} won
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {STAGES.map((stage, stageIdx) => (
          <div key={stage.id}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${stage.color}`}>
                {stage.label}
              </h2>
              <span className="text-xs text-zinc-600">({byStage[stage.id].length})</span>
            </div>

            {byStage[stage.id].length === 0 ? (
              <p className="text-xs text-zinc-700 pl-1">—</p>
            ) : (
              <div className="flex flex-col gap-2">
                {byStage[stage.id].map(sch => {
                  const score = scores[sch.id]
                  return (
                    <div
                      key={sch.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/scholarship/${sch.id}`}
                            className="text-sm font-medium text-zinc-100 hover:text-blue-400 truncate transition-colors"
                          >
                            {sch.name}
                          </Link>
                          {score && (
                            <span
                              className={`shrink-0 text-xs font-bold ${
                                score.win_probability_tier === 'high'
                                  ? 'text-green-400'
                                  : score.win_probability_tier === 'medium'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {score.match_score}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {sch.amount} · Due {sch.deadline}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {stageIdx > 0 && (
                          <button
                            onClick={() => moveStage(sch.id, -1)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            ← {STAGES[stageIdx - 1].label}
                          </button>
                        )}
                        {stageIdx < STAGES.length - 1 && (
                          <button
                            onClick={() => moveStage(sch.id, 1)}
                            className="text-xs text-blue-500 hover:text-blue-400 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                          >
                            {STAGES[stageIdx + 1].label} →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
