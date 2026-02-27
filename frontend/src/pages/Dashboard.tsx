import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { apiClient } from '../utils/api'
import { Loader2 } from 'lucide-react'
import ResumeAnalysis from '../components/ResumeAnalysis'
import Benchmarks from '../components/Benchmarks'
import CareerTrajectory from '../components/CareerTrajectory'
import LearningPath from '../components/LearningPath'
import PlatformInfo from '../components/PlatformInfo'

interface AnalysisData {
  analysis: any
  benchmarks?: any
  trajectory?: any
  learningPath?: any
  tokenUsage?: {
    totalTokens: number
    promptTokens?: number
    completionTokens?: number
    estimatedCost: number
    breakdown?: Array<{
      operation: string
      tokens: number
      cost: number
      model: string
      createdAt: string
    }>
  }
}

export default function Dashboard() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'benchmarks' | 'trajectory' | 'learning' | 'info'>('info')

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session ID')
      setLoading(false)
      return
    }

    loadData()
  }, [sessionId])

  const loadData = async () => {
    try {
      // First, get the analysis
      const analysisResponse = await apiClient.get(`/api/analysis/${sessionId}`)
      if (analysisResponse.data.success) {
        const responseData = analysisResponse.data.data
        setData({
          analysis: responseData.analysis,
          benchmarks: responseData.benchmarks,
          trajectory: responseData.trajectory,
          learningPath: responseData.learningPath,
          tokenUsage: responseData.tokenUsage,
        })
        setLoading(false)

        // Load benchmarks, trajectory, and learning path if not already loaded
        if (!responseData.benchmarks) {
          loadBenchmarks()
        }
        if (!responseData.trajectory) {
          loadTrajectory()
        }
        // Learning path will be loaded after trajectory
      } else {
        setError('Failed to load analysis')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data')
      setLoading(false)
    }
  }

  const loadLearningPath = useCallback(async () => {
    if (!sessionId) return
    try {
      console.log('Loading learning path for session:', sessionId)
      const response = await apiClient.post('/api/learning-path', { sessionId })
      console.log('Learning path response:', response.data)
      if (response.data.success) {
        setData((prevData) => {
          if (!prevData) return prevData
          const updatedTokenUsage = {
            ...prevData.tokenUsage,
            totalTokens: (prevData.tokenUsage?.totalTokens || 0) + (response.data.tokenUsage?.totalTokens || 0),
            promptTokens: (prevData.tokenUsage?.promptTokens || 0) + (response.data.tokenUsage?.promptTokens || 0),
            completionTokens: (prevData.tokenUsage?.completionTokens || 0) + (response.data.tokenUsage?.completionTokens || 0),
            estimatedCost: (prevData.tokenUsage?.estimatedCost || 0) + (response.data.tokenUsage?.estimatedCost || 0),
          }
          return { 
            ...prevData, 
            learningPath: response.data.learningPath,
            tokenUsage: updatedTokenUsage,
          }
        })
      } else {
        console.error('Failed to load learning path:', response.data.error)
        setError(response.data.error || 'Failed to load learning path')
      }
    } catch (err: any) {
      console.error('Failed to load learning path:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load learning path'
      setError(errorMsg)
    }
  }, [sessionId])

  const loadTrajectory = useCallback(async () => {
    if (!sessionId) return
    try {
      console.log('Loading trajectory for session:', sessionId)
      const response = await apiClient.post('/api/trajectory', { sessionId })
      console.log('Trajectory response:', response.data)
      if (response.data.success) {
        setData((prevData) => {
          if (!prevData) return prevData
          const updatedTokenUsage = {
            ...prevData.tokenUsage,
            totalTokens: (prevData.tokenUsage?.totalTokens || 0) + (response.data.tokenUsage?.totalTokens || 0),
            promptTokens: (prevData.tokenUsage?.promptTokens || 0) + (response.data.tokenUsage?.promptTokens || 0),
            completionTokens: (prevData.tokenUsage?.completionTokens || 0) + (response.data.tokenUsage?.completionTokens || 0),
            estimatedCost: (prevData.tokenUsage?.estimatedCost || 0) + (response.data.tokenUsage?.estimatedCost || 0),
          }
          return { 
            ...prevData, 
            trajectory: response.data.trajectory,
            tokenUsage: updatedTokenUsage,
          }
        })
        // After trajectory loads, load learning path
        setTimeout(() => loadLearningPath(), 500)
      } else {
        console.error('Failed to load trajectory:', response.data.error)
        setError(response.data.error || 'Failed to load trajectory')
      }
    } catch (err: any) {
      console.error('Failed to load trajectory:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load trajectory'
      setError(errorMsg)
    }
  }, [sessionId, loadLearningPath])

  const loadBenchmarks = useCallback(async () => {
    if (!sessionId) return
    try {
      console.log('Loading benchmarks for session:', sessionId)
      const response = await apiClient.post('/api/benchmarks', { sessionId })
      console.log('Benchmarks response:', response.data)
      if (response.data.success) {
        setData((prevData) => {
          if (!prevData) return prevData
          const updatedTokenUsage = {
            ...prevData.tokenUsage,
            totalTokens: (prevData.tokenUsage?.totalTokens || 0) + (response.data.tokenUsage?.totalTokens || 0),
            promptTokens: (prevData.tokenUsage?.promptTokens || 0) + (response.data.tokenUsage?.promptTokens || 0),
            completionTokens: (prevData.tokenUsage?.completionTokens || 0) + (response.data.tokenUsage?.completionTokens || 0),
            estimatedCost: (prevData.tokenUsage?.estimatedCost || 0) + (response.data.tokenUsage?.estimatedCost || 0),
          }
          return { 
            ...prevData, 
            benchmarks: response.data.benchmarks,
            tokenUsage: updatedTokenUsage,
          }
        })
      } else {
        console.error('Failed to load benchmarks:', response.data.error)
        setError(response.data.error || 'Failed to load benchmarks')
      }
    } catch (err: any) {
      console.error('Failed to load benchmarks:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load benchmarks'
      setError(errorMsg)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80">Analyzing your resume...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Failed to load data'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Token Usage Banner */}
      {data.tokenUsage && (
        <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-white/70 text-sm">Total Tokens Used</p>
                <p className="text-white font-bold text-lg">{data.tokenUsage.totalTokens?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Estimated Cost</p>
                <p className="text-green-400 font-bold text-lg">₹{data.tokenUsage.estimatedCost?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            {data.tokenUsage.breakdown && data.tokenUsage.breakdown.length > 0 && (
              <div className="text-right">
                <p className="text-white/70 text-sm">Operations</p>
                <p className="text-white font-semibold">{data.tokenUsage.breakdown.length}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-white/20">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'info', label: 'Platform Info' },
              { id: 'analysis', label: 'Resume Analysis' },
              { id: 'benchmarks', label: 'Benchmarks' },
              { id: 'trajectory', label: 'Career Trajectory' },
              { id: 'learning', label: 'Learning Path' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === 'analysis' && <ResumeAnalysis analysis={data.analysis} />}
        {activeTab === 'benchmarks' && (
          <Benchmarks
            benchmarks={data.benchmarks}
            onLoad={loadBenchmarks}
            loading={!data.benchmarks}
          />
        )}
        {activeTab === 'trajectory' && (
          <CareerTrajectory
            trajectory={data.trajectory}
            onLoad={loadTrajectory}
            loading={!data.trajectory}
          />
        )}
        {activeTab === 'learning' && (
          <LearningPath
            learningPath={data.learningPath}
            onLoad={loadLearningPath}
            loading={!data.learningPath}
          />
        )}
        {activeTab === 'info' && <PlatformInfo />}
      </div>
    </div>
  )
}
