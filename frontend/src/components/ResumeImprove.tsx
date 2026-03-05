/**
 * AI-Assisted Resume Improvement
 * - Resume visualization with section highlights
 * - AI suggestions panel
 * - Professional themes
 * - Profile picture upload
 * - Download as PDF
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  User,
  Download,
  Loader2,
  ImagePlus,
  Lightbulb,
  Palette,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { apiClient, uploadClient, API_BASE_URL } from '../utils/api'
import { exportToPDF } from '../utils/pdfExport'
import { exportResumeToDocx } from '../utils/docxExport'

const RESUME_THEMES = [
  { id: 'modern', name: 'Modern', description: 'Clean, left-aligned' },
  { id: 'classic', name: 'Classic', description: 'Centered, traditional' },
  { id: 'minimal', name: 'Minimal', description: 'Compact, bordered' },
  { id: 'executive', name: 'Executive', description: 'Sidebar layout' },
] as const

export interface ResumeSuggestion {
  id: string
  section: string
  sectionLabel: string
  type: string
  currentContent?: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  category: string
}

interface ResumeImproveProps {
  sessionId: string
  analysis: any
  benchmarks?: any
  profilePictureUrl?: string | null
  initialSuggestions?: ResumeSuggestion[] | null
  initialTheme?: string
}

export default function ResumeImprove({
  sessionId,
  analysis,
  benchmarks: _benchmarks, // reserved for future benchmark-aware suggestions
  profilePictureUrl: initialProfilePictureUrl,
  initialSuggestions,
  initialTheme,
}: ResumeImproveProps) {
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>(
    Array.isArray(initialSuggestions) ? initialSuggestions : []
  )
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string>(initialTheme || 'modern')
  const buildProfileImageUrl = useCallback((url: string | null | undefined) => {
    if (!url) return null
    return url.startsWith('http') ? url : (API_BASE_URL || '') + url
  }, [])

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(() =>
    buildProfileImageUrl(initialProfilePictureUrl)
  )

  // Sync profile picture when parent passes updated URL (e.g. after analysis load or tab switch)
  useEffect(() => {
    const next = buildProfileImageUrl(initialProfilePictureUrl)
    setProfilePictureUrl((prev) => (next !== null ? next : prev))
  }, [initialProfilePictureUrl, buildProfileImageUrl])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<Set<string>>(new Set())
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState(false)
  const [suggestionToApply, setSuggestionToApply] = useState<ResumeSuggestion | null>(null)

  const sectionsWithSuggestions = new Set(suggestions.map((s) => s.section))
  const appliedSuggestionsList = useMemo(
    () => suggestions.filter((s) => appliedSuggestionIds.has(s.id)),
    [suggestions, appliedSuggestionIds]
  )

  // Normalize for matching (trim, collapse whitespace, lower case)
  const normalize = (s: string) =>
    (s || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
  const overlap = (a: string, b: string, minLen = 25) => {
    const na = normalize(a)
    const nb = normalize(b)
    if (na.length < minLen && nb.length < minLen) return false
    return na.includes(nb.slice(0, 80)) || nb.includes(na.slice(0, 80))
  }

  // Extract skill-like phrases from suggestion text (quoted or "X, Y, or Z")
  const extractSkillsFromSuggestion = (text: string): string[] => {
    const out: string[] = []
    const quoted = text.match(/['"]([^'"]+)['"]/g)
    if (quoted) {
      quoted.forEach((q) => out.push(q.replace(/^['"]|['"]$/g, '').trim()))
    }
    const suchAs = text.match(/such as\s+([^.]+)/i)
    if (suchAs) {
      suchAs[1].split(/,\s*|\s+or\s+/i).forEach((s) => {
        const t = s.replace(/['"]/g, '').trim()
        if (t.length > 1 && t.length < 50) out.push(t)
      })
    }
    return [...new Set(out)]
  }

  // Merge applied suggestions into display content (summary, experience, skills)
  const mergedAnalysis = useMemo(() => {
    if (!analysis) return analysis
    const applied = appliedSuggestionsList
    const mergedSummary =
      applied.find((s) => s.section === 'summary')?.suggestion ?? analysis.summary
    const usedIds = new Set<string>()
    const mergedExperience = (analysis.experience ?? []).map((exp: any) => {
      const expDesc = exp.description ?? ''
      const match = applied.find(
        (s) =>
          s.section === 'experience' &&
          !usedIds.has(s.id) &&
          (s.currentContent
            ? overlap(expDesc, s.currentContent, 20)
            : false)
      )
      if (match) usedIds.add(match.id)
      return match ? { ...exp, description: match.suggestion } : exp
    })
    // Merge skills: base + any extracted from applied 'skills' suggestions
    let mergedSkills = Array.isArray(analysis.skills) ? [...analysis.skills] : []
    applied
      .filter((s) => s.section === 'skills')
      .forEach((s) => {
        const extra = extractSkillsFromSuggestion(s.suggestion)
        extra.forEach((skill) => {
          if (skill && !mergedSkills.some((x) => normalize(x) === normalize(skill))) {
            mergedSkills.push(skill)
          }
        })
      })
    return {
      ...analysis,
      summary: mergedSummary,
      experience: mergedExperience,
      skills: mergedSkills.length ? mergedSkills : analysis.skills,
    }
  }, [analysis, appliedSuggestionsList])

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    setSuggestionsError(null)
    try {
      const res = await apiClient.post('/api/resume/improvement-suggestions', { sessionId })
      if (res.data.success && Array.isArray(res.data.suggestions)) {
        setSuggestions(res.data.suggestions)
      } else {
        setSuggestionsError('No suggestions returned')
      }
    } catch (err: any) {
      setSuggestionsError(err.response?.data?.error || 'Failed to load suggestions')
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }, [sessionId])

  const handleProfilePictureChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !sessionId) return
      setPhotoError(null)
      setUploadingPhoto(true)
      try {
        const formData = new FormData()
        formData.append('profilePicture', file)
        formData.append('sessionId', sessionId)
        const res = await uploadClient.post('/api/resume/profile-picture', formData)
        if (res.data.success && res.data.profilePictureUrl) {
          const base = buildProfileImageUrl(res.data.profilePictureUrl)
          setProfilePictureUrl(base ? `${base}?t=${Date.now()}` : null)
        }
      } catch (err: any) {
        setPhotoError(err.response?.data?.error || 'Upload failed. Use JPEG, PNG or WebP under 2MB.')
      } finally {
        setUploadingPhoto(false)
      }
    },
    [sessionId, buildProfileImageUrl]
  )

  const savePreferences = useCallback(async () => {
    try {
      await apiClient.post('/api/resume/save-preferences', {
        sessionId,
        theme: selectedTheme,
        appliedSuggestions: Array.from(appliedSuggestionIds),
      })
    } catch (_) {}
  }, [sessionId, selectedTheme, appliedSuggestionIds])

  const handleDownloadPDF = useCallback(() => {
    savePreferences()
    exportToPDF('resume-preview-for-pdf', 'My-Resume', mergedAnalysis?.name || 'Resume')
  }, [mergedAnalysis?.name, savePreferences])

  const handleDownloadDOC = useCallback(async () => {
    setDownloadingDoc(true)
    try {
      await savePreferences()
      await exportResumeToDocx(mergedAnalysis, selectedTheme, profilePictureUrl)
    } finally {
      setDownloadingDoc(false)
    }
  }, [mergedAnalysis, selectedTheme, profilePictureUrl, savePreferences])

  const openApplyConfirmation = useCallback((suggestion: ResumeSuggestion) => {
    if (appliedSuggestionIds.has(suggestion.id)) {
      setAppliedSuggestionIds((prev) => {
        const next = new Set(prev)
        next.delete(suggestion.id)
        return next
      })
      return
    }
    setSuggestionToApply(suggestion)
  }, [appliedSuggestionIds])

  const confirmApplySuggestion = useCallback(() => {
    if (suggestionToApply) {
      setAppliedSuggestionIds((prev) => new Set(prev).add(suggestionToApply.id))
      setSuggestionToApply(null)
    }
  }, [suggestionToApply])

  const cancelApplySuggestion = useCallback(() => {
    setSuggestionToApply(null)
  }, [])

  if (!analysis) return null

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Resume Improve</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleDownloadDOC}
            disabled={downloadingDoc}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {downloadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            DOC
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Resume Preview with section highlights */}
        <div className="lg:col-span-2 space-y-4">
          <div
            id="resume-preview-for-pdf"
            className={`resume-preview theme-${selectedTheme} bg-white text-gray-900 rounded-xl border-2 border-white/20 overflow-hidden shadow-xl`}
            data-theme={selectedTheme}
          >
            <div className={`resume-preview-inner p-6 ${selectedTheme === 'executive' ? 'space-y-0' : 'space-y-4'}`}>
              {/* Header with optional profile picture */}
              <div
                id="section-header"
                className={`flex items-center gap-4 ${sectionsWithSuggestions.has('summary') ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 rounded-lg' : ''}`}
              >
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{mergedAnalysis.name || 'Your Name'}</h1>
                  <p className="text-gray-600">{mergedAnalysis.currentRole}</p>
                  {mergedAnalysis.currentCompany && (
                    <p className="text-sm text-gray-500">{mergedAnalysis.currentCompany}</p>
                  )}
                </div>
              </div>

              {mergedAnalysis.summary && (
                <div
                  id="section-summary"
                  className={`pt-2 ${sectionsWithSuggestions.has('summary') ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white rounded-lg p-2' : ''}`}
                >
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                    Summary
                    {sectionsWithSuggestions.has('summary') && (
                      <span className="inline-flex items-center gap-1 text-amber-600" title="Has improvement suggestions">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="text-xs font-normal normal-case">Suggestions</span>
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{mergedAnalysis.summary}</p>
                </div>
              )}

              {mergedAnalysis.experience && mergedAnalysis.experience.length > 0 && (
                <div
                  id="section-experience"
                  className={`pt-2 ${sectionsWithSuggestions.has('experience') ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white rounded-lg p-2' : ''}`}
                >
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    Experience
                    {sectionsWithSuggestions.has('experience') && (
                      <span className="inline-flex items-center gap-1 text-amber-600" title="Has improvement suggestions">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="text-xs font-normal normal-case">Suggestions</span>
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {mergedAnalysis.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-gray-300 pl-3">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-gray-600 text-sm">{exp.company}</p>
                        <p className="text-gray-400 text-xs">{exp.duration}</p>
                        <p className="text-gray-700 text-sm mt-1">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                id="section-aside"
                className={selectedTheme === 'executive' ? 'space-y-4' : 'grid grid-cols-2 gap-4'}
              >
                {mergedAnalysis.skills && mergedAnalysis.skills.length > 0 && (
                  <div
                    id="section-skills"
                    className={`pt-2 ${sectionsWithSuggestions.has('skills') ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white rounded-lg p-2' : ''}`}
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      Skills
                      {sectionsWithSuggestions.has('skills') && (
                        <span className="inline-flex items-center gap-1 text-amber-600" title="Has improvement suggestions">
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span className="text-xs font-normal normal-case">Suggestions</span>
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {mergedAnalysis.skills.slice(0, 20).map((s: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {mergedAnalysis.education && mergedAnalysis.education.length > 0 && (
                  <div
                    id="section-education"
                    className={`pt-2 ${sectionsWithSuggestions.has('education') ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white rounded-lg p-2' : ''}`}
                  >
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                      Education
                      {sectionsWithSuggestions.has('education') && (
                        <span className="inline-flex items-center gap-1 text-amber-600" title="Has improvement suggestions">
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span className="text-xs font-normal normal-case">Suggestions</span>
                        </span>
                      )}
                    </h3>
                    {mergedAnalysis.education.map((edu: any, idx: number) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <span className="font-medium">{edu.degree}</span>, {edu.institution}
                        {edu.year && ` (${edu.year})`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Theme selector */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Resume theme
            </h3>
            <div className="flex flex-wrap gap-3">
              {RESUME_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedTheme === t.id
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-white/20 text-white/80 hover:border-white/40'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Profile picture upload */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-blue-400" />
              Profile picture (optional)
            </h3>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePictureChange}
              disabled={uploadingPhoto}
              className="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white"
            />
            {uploadingPhoto && (
              <p className="mt-2 text-sm text-white/60 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </p>
            )}
            {photoError && (
              <p className="mt-2 text-sm text-red-400">{photoError}</p>
            )}
          </div>
        </div>

        {/* Right: AI Suggestions */}
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              AI suggestions
            </h3>
            {!suggestions.length && !loadingSuggestions && (
              <button
                onClick={fetchSuggestions}
                className="w-full py-2 px-4 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                Get improvement suggestions
              </button>
            )}
            {loadingSuggestions && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            )}
            {suggestionsError && (
              <p className="text-red-400 text-sm">{suggestionsError}</p>
            )}
            {suggestions.length > 0 && (
              <ul className="space-y-3 max-h-[480px] overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    className="border border-white/10 rounded-lg p-3 bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-amber-400 uppercase">
                        {s.sectionLabel} · {s.priority}
                      </span>
                      <button
                        onClick={() => openApplyConfirmation(s)}
                        className={`text-xs px-2 py-1 rounded ${
                          appliedSuggestionIds.has(s.id)
                            ? 'bg-green-500/30 text-green-300'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {appliedSuggestionIds.has(s.id) ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                    <p className="text-white/90 text-sm mt-1">{s.suggestion}</p>
                    {s.currentContent && (
                      <p className="text-white/50 text-xs mt-1 truncate">Current: {s.currentContent}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Apply suggestion confirmation modal */}
      {suggestionToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={cancelApplySuggestion}>
          <div
            className="bg-slate-800 border border-white/20 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Apply this suggestion?</h3>
            <p className="text-sm text-white/70">
              This will update your resume preview. You can revert by clicking &quot;Apply&quot; again to unapply.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-amber-400 font-medium">
                Section: {suggestionToApply.sectionLabel} · {suggestionToApply.priority}
              </p>
              {suggestionToApply.currentContent && (
                <div>
                  <p className="text-white/50 text-xs uppercase mb-0.5">Current</p>
                  <p className="text-white/80 bg-white/5 rounded p-2 line-clamp-3">{suggestionToApply.currentContent}</p>
                </div>
              )}
              <div>
                <p className="text-white/50 text-xs uppercase mb-0.5">What it will change to</p>
                <p className="text-white/90 bg-green-500/10 border border-green-500/30 rounded p-2">
                  {suggestionToApply.suggestion}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelApplySuggestion}
                className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApplySuggestion}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Apply changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
