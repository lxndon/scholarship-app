'use client'

import { useState, useEffect, useRef } from 'react'
import { loadProfile, saveProfile, DEFAULT_PROFILE, loadResume, saveResume, clearResume } from '@/lib/profile'
import { parseResume } from '@/app/actions/parse-resume'
import type { ApplicantProfile } from '@/lib/types'

function Spinner() {
  return <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ApplicantProfile>(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProfile(loadProfile())
    setResumeText(loadResume())
  }, [])

  function update<K extends keyof ApplicantProfile>(key: K, value: ApplicantProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function updateEssay(index: number, value: string) {
    const essays = [...profile.essays]
    essays[index] = value
    setProfile(prev => ({ ...prev, essays }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      const text = await parseResume(fd)
      saveResume(text)
      setResumeText(text)
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Failed to parse PDF.')
    } finally {
      setUploading(false)
    }
  }

  function handleClearResume() {
    clearResume()
    setResumeText('')
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Applicant Profile</h1>
        <p className="text-sm text-zinc-400 mt-1.5">
          Injected into every Claude API call for scoring and response generation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Section title="Basic Info">
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Name">
              <input type="text" value={profile.name} onChange={e => update('name', e.target.value)}
                placeholder="Your full name" className={inputCls} />
            </Field>
            <Field label="School">
              <input type="text" value={profile.school} onChange={e => update('school', e.target.value)}
                placeholder="University name" className={inputCls} />
            </Field>
            <Field label="Major">
              <input type="text" value={profile.major} onChange={e => update('major', e.target.value)}
                placeholder="Major / specialization" className={inputCls} />
            </Field>
            <Field label="Year">
              <input type="text" value={profile.year} onChange={e => update('year', e.target.value)}
                placeholder="e.g. Sophomore (Class of 2028)" className={inputCls} />
            </Field>
            <Field label="GPA">
              <input type="text" value={profile.gpa} onChange={e => update('gpa', e.target.value)}
                placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Hometown / State">
              <input type="text" value={profile.location ?? ''} onChange={e => update('location', e.target.value)}
                placeholder="e.g. Indiana, Chicago IL, Monroe County IN" className={inputCls} />
            </Field>
            <Field label="Honors & Scholarships" className="col-span-2">
              <input type="text" value={profile.honors} onChange={e => update('honors', e.target.value)}
                placeholder="e.g. Hudson & Holland Scholar" className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Activities & Goals">
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Organizations">
              <input type="text" value={profile.orgs} onChange={e => update('orgs', e.target.value)}
                placeholder="e.g. Kappa Theta Pi, 812 Consulting" className={inputCls} />
            </Field>
            <Field label="Skills">
              <input type="text" value={profile.skills} onChange={e => update('skills', e.target.value)}
                placeholder="Technical and professional skills" className={inputCls} />
            </Field>
            <Field label="Career Target" className="col-span-2">
              <input type="text" value={profile.careerTarget} onChange={e => update('careerTarget', e.target.value)}
                placeholder="e.g. Tech-focused management consulting" className={inputCls} />
            </Field>
          </div>
          <Field label="Background">
            <textarea
              value={profile.background}
              onChange={e => update('background', e.target.value)}
              placeholder="First-gen, Indiana resident, relevant personal context..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </Section>

        {/* Resume */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Resume</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Upload a PDF — extracted text is injected into all Claude calls for richer context.
            </p>
          </div>

          {resumeText ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-zinc-300 font-medium">
                    {resumeText.split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearResume}
                  className="btn-glass btn-glass-danger btn-glass-sm"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-zinc-600 font-mono leading-relaxed line-clamp-2 px-0.5">
                {resumeText.slice(0, 200)}…
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">No resume uploaded yet.</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                setSelectedFile(e.target.files?.[0] ?? null)
                setUploadError(null)
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-glass btn-glass-secondary"
            >
              <UploadIcon />
              Choose PDF
            </button>
            {selectedFile && (
              <>
                <span className="text-xs text-slate-400 truncate max-w-xs">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-glass btn-glass-primary"
                >
                  {uploading ? <Spinner /> : <UploadIcon />}
                  {uploading ? 'Parsing…' : 'Upload & Parse'}
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-red-400">{uploadError}</p>
          )}
        </div>

        <Section
          title="Sample Essays"
          subtitle="Paste 2–3 paragraphs you've written. Claude matches your voice when generating responses."
        >
          {profile.essays.map((essay, i) => (
            <Field key={i} label={`Essay Sample ${i + 1}`}>
              <textarea
                value={essay}
                onChange={e => updateEssay(i, e.target.value)}
                placeholder="Paste a paragraph from a previous essay or personal statement..."
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>
          ))}
        </Section>

        {/* Save */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="btn-glass btn-glass-primary"
          >
            Save Profile
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
              <CheckIcon />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

const inputCls =
  'w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/70 focus:bg-zinc-800 transition-colors'

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}
