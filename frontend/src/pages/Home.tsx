import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'
import { uploadClient } from '../utils/api'

interface HomeProps {
  onResumeUploaded: (sessionId: string) => void
}

export default function Home({ onResumeUploaded }: HomeProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a resume file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await uploadClient.post('/api/resume/upload', formData)

      if (response.data.success) {
        const sessionId = response.data.sessionId
        onResumeUploaded(sessionId)
        navigate(`/dashboard/${sessionId}`)
      } else {
        setError(response.data.error || 'Failed to upload resume')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload resume. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Unlock Your{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Career Potential
          </span>
        </h1>
        <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
          Upload your resume and discover benchmark data, career trajectory insights, and
          personalized learning paths to become future-ready.
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
            <p className="text-white/70">PDF format recommended</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Select Resume File
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer cursor-pointer"
                  disabled={uploading}
                />
              </div>
              {file && (
                <div className="mt-3 flex items-center space-x-2 text-white/80">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Resume...</span>
                </>
              ) : (
                <>
                  <span>Analyze My Resume</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 grid md:grid-cols-3 gap-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Benchmark Analysis</h3>
          <p className="text-white/70">
            Compare your skills and experience with market standards and industry benchmarks.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Career Trajectory</h3>
          <p className="text-white/70">
            Visualize your potential career path and future opportunities based on your profile.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Learning Path</h3>
          <p className="text-white/70">
            Get personalized recommendations and resources to advance your career.
          </p>
        </div>
      </div>
    </div>
  )
}
