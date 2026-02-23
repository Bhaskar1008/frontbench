import { useEffect, useState } from 'react'
import { TrendingUp, ArrowRight, Target, Clock, Download } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { exportToPDF } from '../utils/pdfExport'

interface CareerTrajectoryProps {
  trajectory?: any
  onLoad: () => void
  loading: boolean
}

export default function CareerTrajectory({ trajectory, onLoad, loading }: CareerTrajectoryProps) {
  const [hasTriedLoad, setHasTriedLoad] = useState(false)

  useEffect(() => {
    if (!trajectory && loading && !hasTriedLoad) {
      setHasTriedLoad(true)
      onLoad()
    }
  }, [trajectory, loading, hasTriedLoad, onLoad])

  // Reset hasTriedLoad if trajectory becomes available
  useEffect(() => {
    if (trajectory) {
      setHasTriedLoad(false)
    }
  }, [trajectory])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80">Generating career trajectory...</p>
        </div>
      </div>
    )
  }

  const handleExportPDF = () => {
    exportToPDF('trajectory-content', 'Career-Trajectory', 'Career Trajectory Report')
  }

  if (!trajectory) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
        <p className="text-white/80">No trajectory data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Career Trajectory</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>
      <div id="trajectory-content" className="space-y-6">
      {/* Current Position */}
      {trajectory.currentPosition && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Current Position</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Role</p>
              <p className="text-white font-semibold text-lg">{trajectory.currentPosition.role}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Level</p>
              <p className="text-white font-semibold text-lg">{trajectory.currentPosition.level}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Estimated Salary</p>
              <p className="text-white font-semibold text-lg">
                ₹{trajectory.currentPosition.estimatedSalary?.min?.toLocaleString('en-IN')} - ₹
                {trajectory.currentPosition.estimatedSalary?.max?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {trajectory.nextSteps && trajectory.nextSteps.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-green-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Next Career Steps</h3>
          </div>
          <div className="space-y-4">
            {trajectory.nextSteps.map((step: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-5 border border-white/10 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">{step.role}</h4>
                    <div className="flex items-center space-x-4 text-sm text-white/70">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{step.timeline}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg mr-1">₹</span>
                        <span>
                          {step.estimatedSalary?.min?.toLocaleString('en-IN')} - ₹
                          {step.estimatedSalary?.max?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                      <span className="text-blue-400 font-semibold">{step.probability}%</span>
                    </div>
                    <p className="text-white/60 text-xs mt-1">Probability</p>
                  </div>
                </div>
                {step.requirements && step.requirements.length > 0 && (
                  <div className="mt-3">
                    <p className="text-white/70 text-sm mb-2">Key Requirements:</p>
                    <ul className="space-y-1">
                      {step.requirements.map((req: string, reqIdx: number) => (
                        <li key={reqIdx} className="flex items-start text-white/80 text-sm">
                          <ArrowRight className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Long-term Vision */}
      {trajectory.longTermVision && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-purple-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Long-term Career Vision</h3>
          </div>
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">
              Target Role: {trajectory.longTermVision.targetRole}
            </h4>
            <p className="text-white/70 mb-4">Timeline: {trajectory.longTermVision.timeline}</p>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/70 text-sm mb-2">Estimated Salary Range:</p>
              <p className="text-white font-semibold text-lg">
                ₹{trajectory.longTermVision.estimatedSalary?.min?.toLocaleString('en-IN')} - ₹
                {trajectory.longTermVision.estimatedSalary?.max?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Career Path */}
          {trajectory.longTermVision.path && trajectory.longTermVision.path.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-4">Career Path</h4>
              {trajectory.longTermVision.path.map((pathStep: any, idx: number) => (
                <div
                  key={idx}
                  className="relative pl-8 pb-6 border-l-2 border-blue-500/50 last:border-l-0"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white/20"></div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-white font-semibold">{pathStep.role}</h5>
                        <p className="text-white/70 text-sm">{pathStep.step}</p>
                      </div>
                      <span className="text-blue-400 text-sm font-medium">{pathStep.timeline}</span>
                    </div>
                    {pathStep.keyMilestones && pathStep.keyMilestones.length > 0 && (
                      <div className="mt-3">
                        <p className="text-white/70 text-sm mb-2">Key Milestones:</p>
                        <ul className="space-y-1">
                          {pathStep.keyMilestones.map((milestone: string, mIdx: number) => (
                            <li key={mIdx} className="flex items-start text-white/80 text-sm">
                              <span className="text-green-400 mr-2">✓</span>
                              <span>{milestone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Growth Areas */}
      {trajectory.growthAreas && trajectory.growthAreas.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Key Growth Areas</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {trajectory.growthAreas.map((area: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-semibold">{area.area}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      area.importance === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      area.importance === 'High' ? 'bg-orange-500/20 text-orange-400' :
                      area.importance === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {area.importance}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{area.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
