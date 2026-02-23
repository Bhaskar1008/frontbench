import { User, Briefcase, GraduationCap, Award, Target, Download } from 'lucide-react'
import { exportToPDF } from '../utils/pdfExport'

interface ResumeAnalysisProps {
  analysis: any
}

export default function ResumeAnalysis({ analysis }: ResumeAnalysisProps) {
  if (!analysis) return null

  const handleExportPDF = () => {
    exportToPDF('resume-analysis-content', 'Resume-Analysis', 'Resume Analysis Report')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Resume Analysis</h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>
      <div id="resume-analysis-content" className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{analysis.name || 'Unknown'}</h2>
            <p className="text-white/70">{analysis.currentRole}</p>
            {analysis.currentCompany && (
              <p className="text-white/60 text-sm">{analysis.currentCompany}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Professional Summary
          </h3>
          <p className="text-white/80 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* Experience */}
      {analysis.experience && analysis.experience.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
            Experience
          </h3>
          <div className="space-y-4">
            {analysis.experience.map((exp: any, idx: number) => (
              <div key={idx} className="border-l-2 border-blue-500 pl-4">
                <h4 className="text-lg font-semibold text-white">{exp.title}</h4>
                <p className="text-blue-400">{exp.company}</p>
                <p className="text-white/60 text-sm mb-2">{exp.duration}</p>
                <p className="text-white/80 text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills & Technologies */}
      <div className="grid md:grid-cols-2 gap-6">
        {analysis.skills && analysis.skills.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-400" />
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.skills.map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis.technologies && analysis.technologies.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-green-400" />
              Technologies
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.technologies.map((tech: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Education */}
      {analysis.education && analysis.education.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-400" />
            Education
          </h3>
          <div className="space-y-3">
            {analysis.education.map((edu: any, idx: number) => (
              <div key={idx} className="flex items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">{edu.degree}</h4>
                  <p className="text-white/70">{edu.institution}</p>
                  {edu.year && <p className="text-white/60 text-sm">{edu.year}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Areas for Improvement */}
      <div className="grid md:grid-cols-2 gap-6">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Strengths</h3>
            <ul className="space-y-2">
              {analysis.strengths.map((strength: string, idx: number) => (
                <li key={idx} className="flex items-start text-white/80">
                  <span className="text-green-400 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.areasForImprovement && analysis.areasForImprovement.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              {analysis.areasForImprovement.map((area: string, idx: number) => (
                <li key={idx} className="flex items-start text-white/80">
                  <span className="text-yellow-400 mr-2">→</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
