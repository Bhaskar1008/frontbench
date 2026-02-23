import { useEffect, useState } from 'react'
import { BookOpen, Clock, Target, Zap, ExternalLink, CheckCircle, Download } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { exportToPDF } from '../utils/pdfExport'

interface LearningPathProps {
  learningPath?: any
  onLoad: () => void
  loading: boolean
}

export default function LearningPath({ learningPath, onLoad, loading }: LearningPathProps) {
  const [hasTriedLoad, setHasTriedLoad] = useState(false)

  useEffect(() => {
    if (!learningPath && loading && !hasTriedLoad) {
      setHasTriedLoad(true)
      onLoad()
    }
  }, [learningPath, loading, hasTriedLoad, onLoad])

  // Reset hasTriedLoad if learningPath becomes available
  useEffect(() => {
    if (learningPath) {
      setHasTriedLoad(false)
    }
  }, [learningPath])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80">Generating learning path...</p>
        </div>
      </div>
    )
  }

  const handleExportPDF = () => {
    exportToPDF('learning-path-content', 'Learning-Path', 'Learning Path Report')
  }

  if (!learningPath) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
        <p className="text-white/80">No learning path data available</p>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Course':
        return '📚'
      case 'Book':
        return '📖'
      case 'Project':
        return '💻'
      case 'Certification':
        return '🎓'
      case 'Practice':
        return '🏋️'
      case 'Community':
        return '👥'
      default:
        return '📝'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Learning Path</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>
      <div id="learning-path-content" className="space-y-6">
      {/* Overview */}
      {learningPath.overview && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Learning Path Overview</h3>
          </div>
          <p className="text-white/80 leading-relaxed">{learningPath.overview}</p>
        </div>
      )}

      {/* Quick Wins */}
      {learningPath.quickWins && learningPath.quickWins.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <Zap className="w-6 h-6 text-yellow-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Quick Wins</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {learningPath.quickWins.map((win: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-yellow-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold flex-1">{win.title}</h4>
                  <span className="text-yellow-400 text-sm font-medium ml-2">{win.timeToComplete}</span>
                </div>
                <p className="text-white/70 text-sm mb-2">{win.description}</p>
                <p className="text-yellow-400/80 text-xs">
                  <strong>Impact:</strong> {win.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Phases */}
      {learningPath.phases && learningPath.phases.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <Target className="w-6 h-6 mr-2 text-purple-400" />
            Learning Phases
          </h3>
          {learningPath.phases.map((phase: any, idx: number) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold">{phase.phase}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{phase.name}</h4>
                      <div className="flex items-center text-white/70 text-sm mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{phase.duration}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/80 mt-2">{phase.description}</p>
                </div>
              </div>

              {/* Goals */}
              {phase.goals && phase.goals.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-semibold mb-2">Goals:</h5>
                  <ul className="space-y-1">
                    {phase.goals.map((goal: string, goalIdx: number) => (
                      <li key={goalIdx} className="flex items-start text-white/80 text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {phase.resources && phase.resources.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-white font-semibold mb-3">Learning Resources:</h5>
                  <div className="grid md:grid-cols-2 gap-3">
                    {phase.resources.map((resource: any, resIdx: number) => (
                      <div
                        key={resIdx}
                        className="bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start flex-1">
                            <span className="text-2xl mr-2">{getResourceIcon(resource.type)}</span>
                            <div className="flex-1">
                              <h6 className="text-white font-medium">{resource.title}</h6>
                              <p className="text-white/70 text-xs mt-1">{resource.description}</p>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getPriorityColor(resource.priority)}`}
                          >
                            {resource.priority}
                          </span>
                        </div>
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-xs hover:text-blue-300 flex items-center mt-2"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit Resource
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {phase.milestones && phase.milestones.length > 0 && (
                <div>
                  <h5 className="text-white font-semibold mb-2">Milestones:</h5>
                  <div className="flex flex-wrap gap-2">
                    {phase.milestones.map((milestone: string, mIdx: number) => (
                      <span
                        key={mIdx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                      >
                        {milestone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Focus Areas */}
      {learningPath.focusAreas && learningPath.focusAreas.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Focus Areas</h3>
          <div className="space-y-4">
            {learningPath.focusAreas.map((area: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold">{area.area}</h4>
                  <span className="text-white/60 text-sm">{area.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-white/70 mb-2">
                  <span>Current: <span className="text-white">{area.currentLevel}</span></span>
                  <span>→</span>
                  <span>Target: <span className="text-green-400">{area.targetLevel}</span></span>
                </div>
                {area.learningResources && area.learningResources.length > 0 && (
                  <div className="mt-2">
                    <p className="text-white/70 text-sm mb-1">Resources:</p>
                    <div className="flex flex-wrap gap-2">
                      {area.learningResources.map((resource: string, resIdx: number) => (
                        <span
                          key={resIdx}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Long-term Goals */}
      {learningPath.longTermGoals && learningPath.longTermGoals.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Long-term Goals</h3>
          <div className="space-y-4">
            {learningPath.longTermGoals.map((goal: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold">{goal.goal}</h4>
                  <span className="text-blue-400 text-sm font-medium">{goal.timeline}</span>
                </div>
                {goal.steps && goal.steps.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {goal.steps.map((step: string, stepIdx: number) => (
                      <li key={stepIdx} className="flex items-start text-white/80 text-sm">
                        <span className="text-blue-400 mr-2">→</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
