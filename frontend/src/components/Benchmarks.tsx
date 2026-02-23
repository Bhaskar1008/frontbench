import { useEffect, useState } from 'react'
import { TrendingUp, BarChart3, Target, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import { exportToPDF } from '../utils/pdfExport'

interface BenchmarksProps {
  benchmarks?: any
  onLoad: () => void
  loading: boolean
}

export default function Benchmarks({ benchmarks, onLoad, loading }: BenchmarksProps) {
  const [hasTriedLoad, setHasTriedLoad] = useState(false)

  useEffect(() => {
    if (!benchmarks && loading && !hasTriedLoad) {
      setHasTriedLoad(true)
      onLoad()
    }
  }, [benchmarks, loading, hasTriedLoad, onLoad])

  // Reset hasTriedLoad if benchmarks become available
  useEffect(() => {
    if (benchmarks) {
      setHasTriedLoad(false)
    }
  }, [benchmarks])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80">Generating benchmark data...</p>
        </div>
      </div>
    )
  }

  const handleExportPDF = () => {
    exportToPDF('benchmarks-content', 'Benchmarks-Report', 'Career Benchmarks Report')
  }

  if (!benchmarks) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
        <p className="text-white/80">No benchmark data available</p>
      </div>
    )
  }

  const skillData = benchmarks.skillBenchmarks?.map((skill: any) => ({
    skill: skill.skill,
    yourLevel: getLevelValue(skill.yourLevel),
    marketAverage: getLevelValue(skill.marketAverage),
    gap: skill.gap,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Career Benchmarks</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>
      <div id="benchmarks-content" className="space-y-6">
      {/* Market Data */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl text-green-400 mr-2">₹</span>
            <h3 className="text-xl font-bold text-white">Salary Range</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Minimum:</span>
              <span className="text-white font-semibold">
                ₹{benchmarks.marketData?.averageSalary?.min?.toLocaleString('en-IN') || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Median:</span>
              <span className="text-white font-semibold">
                ₹{benchmarks.marketData?.averageSalary?.median?.toLocaleString('en-IN') || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Maximum:</span>
              <span className="text-white font-semibold">
                ₹{benchmarks.marketData?.averageSalary?.max?.toLocaleString('en-IN') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Market Insights</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-white/70">Experience Level: </span>
              <span className="text-white font-semibold">
                {benchmarks.marketData?.experienceLevel || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-white/70">Market Demand: </span>
              <span className={`font-semibold ${
                benchmarks.marketData?.marketDemand === 'Very High' ? 'text-green-400' :
                benchmarks.marketData?.marketDemand === 'High' ? 'text-blue-400' :
                benchmarks.marketData?.marketDemand === 'Medium' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {benchmarks.marketData?.marketDemand || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-white/70">Growth Rate: </span>
              <span className="text-green-400 font-semibold">
                {benchmarks.marketData?.growthRate || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Position */}
      {benchmarks.competitivePosition && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-purple-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Competitive Position</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/70">Percentile</span>
                  <span className="text-white font-bold text-2xl">
                    {benchmarks.competitivePosition.percentile || 0}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all"
                    style={{ width: `${benchmarks.competitivePosition.percentile || 0}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-white/80">
                Position: <span className="font-semibold text-white">
                  {benchmarks.competitivePosition.position || 'N/A'}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {benchmarks.competitivePosition.strengths?.slice(0, 3).map((s: string, idx: number) => (
                    <li key={idx} className="text-green-400 text-sm">✓ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Weaknesses</h4>
                <ul className="space-y-1">
                  {benchmarks.competitivePosition.weaknesses?.slice(0, 3).map((w: string, idx: number) => (
                    <li key={idx} className="text-yellow-400 text-sm">→ {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Benchmarks Chart */}
      {skillData.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-6 h-6 text-blue-400 mr-2" />
            <h3 className="text-xl font-bold text-white">Skill Benchmarks</h3>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={skillData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="skill" stroke="#ffffff80" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="yourLevel" fill="#3b82f6" name="Your Level" />
              <Bar dataKey="marketAverage" fill="#8b5cf6" name="Market Average" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Technology Benchmarks */}
      {benchmarks.technologyBenchmarks && benchmarks.technologyBenchmarks.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Technology Benchmarks</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks.technologyBenchmarks.map((tech: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-semibold">{tech.technology}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    tech.marketDemand === 'Very High' ? 'bg-green-500/20 text-green-400' :
                    tech.marketDemand === 'High' ? 'bg-blue-500/20 text-blue-400' :
                    tech.marketDemand === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tech.marketDemand}
                  </span>
                </div>
                <p className="text-white/70 text-sm mb-2">Your Level: {tech.yourLevel}</p>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${tech.relevance}%` }}
                  ></div>
                </div>
                <p className="text-white/60 text-xs mt-1">Relevance: {tech.relevance}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function getLevelValue(level: string): number {
  const levels: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Expert: 4,
  }
  return levels[level] || 0
}
