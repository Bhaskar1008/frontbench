import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Database, 
  Brain, 
  Zap, 
  Shield, 
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Code,
  Users,
  Server,
  Cloud,
  Layers,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { apiClient } from '../utils/api';

interface PlatformStats {
  session: {
    sessionId: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    analysisComplete: boolean;
    benchmarksComplete: boolean;
    trajectoryComplete: boolean;
    learningPathComplete: boolean;
  };
  workflow: {
    steps: Array<{
      step: number;
      name: string;
      status: string;
      description: string;
      timestamp: Date;
      icon: string;
    }>;
    totalSteps: number;
    completedSteps: number;
  };
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
    breakdown?: Array<{
      operation: string;
      tokens: number;
      cost: number;
      model: string;
      createdAt: string;
    }>;
  };
  rag: {
    enabled: boolean;
    status: string;
    chunksIndexed: number;
    collectionName: string;
  };
  database: {
    connected: boolean;
    sessionStored: boolean;
    collection: string;
  };
}

interface PlatformInfoProps {
  sessionId?: string;
}

export default function PlatformInfo({ sessionId }: PlatformInfoProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'realtime']));
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch real-time platform stats if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      setLoadingStats(true);
      apiClient.get(`/api/platform-stats/${sessionId}`)
        .then((response) => {
          if (response.data.success) {
            setPlatformStats(response.data);
          }
        })
        .catch((error) => {
          console.error('Failed to fetch platform stats:', error);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    }
  }, [sessionId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 mb-4">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 text-gray-300 space-y-3">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-blue-400" />
          Frontbench Platform Architecture
        </h1>
        <p className="text-gray-300 text-lg">
          {sessionId ? 'Real-Time Platform Information' : 'Production-Ready Agentic AI System for Career Intelligence'}
        </p>
        {sessionId && (
          <p className="text-blue-400 text-sm mt-2">
            Showing real-time data for session: {sessionId.substring(0, 8)}...
          </p>
        )}
      </div>

      {/* Real-Time Workflow Section - Only show when sessionId exists */}
      {sessionId && (
        <Section id="realtime" title="Real-Time Workflow Status" icon={Clock}>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-gray-300">Loading real-time platform data...</span>
            </div>
          ) : platformStats ? (
            <div className="space-y-4">
              {/* Workflow Steps */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-300 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Processing Workflow ({platformStats.workflow.completedSteps}/{platformStats.workflow.totalSteps} completed)
                </h4>
                <div className="space-y-3">
                  {platformStats.workflow.steps.map((step, index) => (
                    <div key={step.step} className="flex gap-3 items-start">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        step.status === 'completed' ? 'bg-green-500' : 'bg-gray-500'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{step.icon}</span>
                          <span className="font-semibold text-white">{step.name}</span>
                          {step.status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-300">{step.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Session Details
                  </h5>
                  <ul className="text-sm space-y-2 text-gray-300">
                    <li>• <strong>File:</strong> {platformStats.session.fileName}</li>
                    <li>• <strong>Size:</strong> {(platformStats.session.fileSize / 1024 / 1024).toFixed(2)} MB</li>
                    <li>• <strong>Uploaded:</strong> {new Date(platformStats.session.uploadedAt).toLocaleString()}</li>
                    <li>• <strong>Session ID:</strong> <code className="bg-black/30 px-1 rounded text-xs">{platformStats.session.sessionId.substring(0, 16)}...</code></li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-400" />
                    RAG & ChromaDB Status
                  </h5>
                  <ul className="text-sm space-y-2 text-gray-300">
                    <li>• <strong>RAG Enabled:</strong> {platformStats.rag.enabled ? '✅ Yes' : '❌ No'}</li>
                    <li>• <strong>Status:</strong> <span className={`${
                      platformStats.rag.status === 'connected' ? 'text-green-400' : 
                      platformStats.rag.status === 'error' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {platformStats.rag.status === 'connected' ? '✅ Connected' : 
                       platformStats.rag.status === 'error' ? '❌ Error' : 
                       platformStats.rag.status === 'disabled' ? '⚠️ Disabled' : '⏳ Checking...'}
                    </span></li>
                    <li>• <strong>Collection:</strong> {platformStats.rag.collectionName}</li>
                    <li>• <strong>Database:</strong> {platformStats.database.collection}</li>
                  </ul>
                </div>
              </div>

              {/* Token Usage */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h5 className="font-semibold text-purple-300 mb-3">Token Usage & Costs</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Total Tokens</p>
                    <p className="text-white font-bold text-lg">{platformStats.tokenUsage.totalTokens.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Prompt Tokens</p>
                    <p className="text-blue-400 font-semibold">{platformStats.tokenUsage.promptTokens.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Completion Tokens</p>
                    <p className="text-green-400 font-semibold">{platformStats.tokenUsage.completionTokens.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Estimated Cost</p>
                    <p className="text-yellow-400 font-bold text-lg">₹{platformStats.tokenUsage.estimatedCost.toFixed(2)}</p>
                  </div>
                </div>
                {platformStats.tokenUsage.breakdown && platformStats.tokenUsage.breakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-2">Operation Breakdown:</p>
                    <div className="space-y-1">
                      {platformStats.tokenUsage.breakdown.map((op, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-300">{op.operation}</span>
                          <span className="text-white">{op.tokens.toLocaleString()} tokens (₹{op.cost.toFixed(4)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Failed to load real-time platform data
            </div>
          )}
        </Section>
      )}

      {/* Overview Section */}
      <Section id="overview" title="Platform Overview" icon={BookOpen}>
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">What is Frontbench?</h4>
            <p className="text-sm">
              Frontbench is an advanced AI-powered career intelligence platform that analyzes resumes, 
              generates market benchmarks, projects career trajectories, and creates personalized learning paths. 
              Built with production-grade architecture, it leverages Agentic AI, RAG (Retrieval-Augmented Generation), 
              and vector databases to deliver intelligent, context-aware insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-green-300">Customer Value</span>
              </div>
              <p className="text-xs">Get personalized career insights, market benchmarks, and actionable learning recommendations</p>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-300">Technical Excellence</span>
              </div>
              <p className="text-xs">Built with LangChain, MongoDB, Chroma, and modern AI architectures</p>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="font-semibold text-orange-300">Scalable & Secure</span>
              </div>
              <p className="text-xs">Production-ready with security guardrails, audit logging, and horizontal scaling</p>
            </div>
          </div>
        </div>
      </Section>

      {/* RAG & Chroma Section */}
      <Section id="rag" title="RAG & Chroma Vector Database" icon={Database}>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
              <Search className="w-5 h-5" />
              What is RAG (Retrieval-Augmented Generation)?
            </h4>
            <p className="text-sm mb-3">
              RAG enhances AI responses by retrieving relevant information from your uploaded documents 
              before generating answers. This makes the AI more accurate, context-aware, and able to cite 
              specific parts of your resume.
            </p>
            <div className="bg-black/20 rounded p-3 text-xs font-mono">
              {sessionId && platformStats ? (
                <>
                  <div className={`${platformStats.workflow.steps[0]?.status === 'completed' ? 'text-green-400' : 'text-gray-500'}`}>
                    1. Upload Resume → Extract Text {platformStats.workflow.steps[0]?.status === 'completed' && '✅'}
                  </div>
                  <div className={`ml-4 ${platformStats.rag.status === 'connected' ? 'text-blue-400' : 'text-gray-500'}`}>
                    2. Chunk Text → Create Embeddings {platformStats.rag.status === 'connected' && '✅'}
                  </div>
                  <div className={`ml-4 ${platformStats.rag.status === 'connected' ? 'text-purple-400' : 'text-gray-500'}`}>
                    3. Store in Chroma Vector DB {platformStats.rag.status === 'connected' && '✅'}
                  </div>
                  <div className="text-yellow-400 ml-4">
                    4. AI Queries → Semantic Search
                  </div>
                  <div className="text-pink-400 ml-4">
                    5. Retrieve Relevant Chunks → Generate Answer
                  </div>
                </>
              ) : (
                <>
                  <div className="text-green-400">1. Upload Resume → Extract Text</div>
                  <div className="text-blue-400 ml-4">2. Chunk Text → Create Embeddings</div>
                  <div className="text-purple-400 ml-4">3. Store in Chroma Vector DB</div>
                  <div className="text-yellow-400 ml-4">4. AI Queries → Semantic Search</div>
                  <div className="text-pink-400 ml-4">5. Retrieve Relevant Chunks → Generate Answer</div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                Chroma Vector Database
              </h5>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• <strong>Purpose:</strong> Stores document embeddings for semantic search</li>
                <li>• <strong>When Used:</strong> Every resume upload is indexed automatically</li>
                <li>• <strong>Benefits:</strong> Enables AI to "remember" and reference your resume content</li>
                <li>• <strong>Status:</strong> {
                  sessionId && platformStats ? (
                    <span className={platformStats.rag.status === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                      {platformStats.rag.status === 'connected' ? '✅ Connected' : 
                       platformStats.rag.status === 'error' ? '❌ Error' : 
                       platformStats.rag.status === 'disabled' ? '⚠️ Disabled' : '⏳ Checking...'}
                    </span>
                  ) : (
                    import.meta.env.VITE_ENABLE_RAG === 'true' ? '✅ Enabled' : '⚠️ Check backend config'
                  )
                }</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                Document Processing
              </h5>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• <strong>Supported:</strong> PDF, DOCX, TXT, JSON, HTML</li>
                <li>• <strong>Chunking:</strong> Smart semantic chunking (1000 chars, 200 overlap)</li>
                <li>• <strong>Metadata:</strong> Extracts title, author, page count, word count</li>
                <li>• <strong>Embeddings:</strong> OpenAI text-embedding-3-small model</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h5 className="font-semibold text-yellow-300 mb-2">💡 Why No Records in Chroma?</h5>
            <p className="text-sm text-gray-300">
              If you don't see records in Chroma after uploading, check:
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1 ml-4">
              <li>1. <code className="bg-black/30 px-1 rounded">ENABLE_RAG=true</code> in backend environment</li>
              <li>2. Chroma Cloud credentials configured (CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE)</li>
              <li>3. Check backend logs for "✅ Vector store created" message</li>
              <li>4. Verify health endpoint: <code className="bg-black/30 px-1 rounded">/api/health</code> shows chroma.status: "connected"</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Agentic AI Architecture */}
      <Section id="agents" title="Agentic AI Architecture" icon={Brain}>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-3">Multi-Agent System</h4>
            <p className="text-sm mb-3">
              Frontbench uses specialized AI agents that work together to provide comprehensive career intelligence:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-black/20 rounded p-3">
                <div className="font-semibold text-blue-300 mb-1">📊 Resume Analysis Agent</div>
                <p className="text-xs text-gray-400">Extracts structured data from resumes</p>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="font-semibold text-green-300 mb-1">📈 Benchmark Agent</div>
                <p className="text-xs text-gray-400">Generates market salary and skill benchmarks</p>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="font-semibold text-yellow-300 mb-1">🚀 Trajectory Agent</div>
                <p className="text-xs text-gray-400">Projects career growth paths</p>
              </div>
              <div className="bg-black/20 rounded p-3">
                <div className="font-semibold text-pink-300 mb-1">📚 Learning Path Agent</div>
                <p className="text-xs text-gray-400">Creates personalized learning recommendations</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="font-semibold text-white mb-2">Agent Orchestration</h5>
            <div className="text-sm space-y-2 text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <div>
                  <strong>Planner Agent:</strong> Breaks down complex tasks into steps
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <div>
                  <strong>Executor Agent:</strong> Executes planned steps using available tools
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <div>
                  <strong>Validator Agent:</strong> Validates outputs for quality and accuracy
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <div>
                  <strong>Tools Available:</strong> Document Search (RAG), Resume Analysis, Web Search (future)
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Architecture & Scalability */}
      <Section id="architecture" title="Architecture & Scalability" icon={Layers}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" />
                Backend Architecture
              </h5>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• <strong>Framework:</strong> Node.js + Express</li>
                <li>• <strong>Database:</strong> MongoDB Atlas (cloud-hosted)</li>
                <li>• <strong>Vector DB:</strong> Chroma Cloud / Self-hosted</li>
                <li>• <strong>AI Framework:</strong> LangChain + OpenAI</li>
                <li>• <strong>Observability:</strong> Langfuse tracing</li>
                <li>• <strong>Deployment:</strong> Railway (auto-scaling)</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Frontend Architecture
              </h5>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• <strong>Framework:</strong> React + TypeScript</li>
                <li>• <strong>Styling:</strong> Tailwind CSS</li>
                <li>• <strong>Build Tool:</strong> Vite</li>
                <li>• <strong>State:</strong> React Hooks</li>
                <li>• <strong>Deployment:</strong> Netlify (CDN)</li>
                <li>• <strong>API Client:</strong> Axios with environment-based URLs</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="font-semibold text-green-300 mb-3">Scalability Features</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-semibold text-white mb-1">Horizontal Scaling</div>
                <p className="text-gray-300 text-xs">Stateless API design, Railway auto-scaling, MongoDB connection pooling</p>
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Async Processing</div>
                <p className="text-gray-300 text-xs">Job queue system for long-running tasks, background processing</p>
              </div>
              <div>
                <div className="font-semibold text-white mb-1">Caching Strategy</div>
                <p className="text-gray-300 text-xs">Session-based caching, MongoDB indexes, vector store caching</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Security & Production Features */}
      <Section id="security" title="Security & Production Features" icon={Shield}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h5 className="font-semibold text-red-300 mb-2">Security Guardrails</h5>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✅ Prompt injection detection</li>
                <li>✅ PII (Personal Info) masking</li>
                <li>✅ Output validation & sanitization</li>
                <li>✅ Toxicity detection</li>
                <li>✅ Input sanitization</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h5 className="font-semibold text-blue-300 mb-2">Production Features</h5>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>✅ Comprehensive audit logging</li>
                <li>✅ Token usage tracking & cost estimation</li>
                <li>✅ Error handling & graceful degradation</li>
                <li>✅ CORS configuration</li>
                <li>✅ Environment-based configuration</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="font-semibold text-white mb-2">Data Privacy & Compliance</h5>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• All resume data is stored securely in MongoDB Atlas with encryption at rest</p>
              <p>• Session-based isolation ensures user data privacy</p>
              <p>• Audit logs track all operations for compliance</p>
              <p>• PII masking prevents sensitive data leakage in AI responses</p>
            </div>
          </div>
        </div>
      </Section>

      {/* How It Works (Customer Perspective) */}
      <Section id="customer" title="How It Works (Customer Perspective)" icon={Users}>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-3">Simple 3-Step Process</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">Upload Your Resume</div>
                  <p className="text-sm text-gray-300">Simply drag and drop your PDF resume. Our AI extracts all information automatically.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">AI Analysis</div>
                  <p className="text-sm text-gray-300">Our agentic AI system analyzes your resume, benchmarks it against the market, and projects your career trajectory.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">Get Insights</div>
                  <p className="text-sm text-gray-300">Receive detailed analysis, market benchmarks, career trajectory projections, and personalized learning paths.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="font-semibold text-white mb-2">What You Get</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-semibold text-blue-300 mb-1">📊 Resume Analysis</div>
                <p className="text-gray-300 text-xs">Structured extraction of skills, experience, education, and achievements</p>
              </div>
              <div>
                <div className="font-semibold text-green-300 mb-1">📈 Market Benchmarks</div>
                <p className="text-gray-300 text-xs">Salary ranges, skill demand, and market positioning</p>
              </div>
              <div>
                <div className="font-semibold text-yellow-300 mb-1">🚀 Career Trajectory</div>
                <p className="text-gray-300 text-xs">5-year career growth projections and role progression paths</p>
              </div>
              <div>
                <div className="font-semibold text-pink-300 mb-1">📚 Learning Path</div>
                <p className="text-gray-300 text-xs">Personalized courses, certifications, and skill development recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Technical Stack */}
      <Section id="techstack" title="Technology Stack" icon={Code}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-2">AI & ML</h5>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• OpenAI GPT-4o-mini</li>
                <li>• LangChain Framework</li>
                <li>• OpenAI Embeddings</li>
                <li>• Langfuse Tracing</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-2">Backend</h5>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• Node.js + Express</li>
                <li>• TypeScript</li>
                <li>• MongoDB + Mongoose</li>
                <li>• Chroma Vector DB</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h5 className="font-semibold text-white mb-2">Frontend</h5>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• React 18</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Vite</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center mt-8 text-gray-400 text-sm">
        <p>Built with ❤️ using cutting-edge AI technologies</p>
        <p className="mt-2">Production-ready • Scalable • Secure</p>
      </div>
    </div>
  );
}
