/**
 * Agent Integration Layer
 * Integrates LangChain agents with existing Frontbench API endpoints
 */

import { ResumeAnalysisAgent } from '../ResumeAnalysisAgent.js';
import { BenchmarkAgent } from '../BenchmarkAgent.js';
import { TrajectoryAgent } from '../TrajectoryAgent.js';
import { LearningPathAgent } from '../LearningPathAgent.js';
import { PlannerAgent } from '../PlannerAgent.js';
import { ExecutorAgent } from '../ExecutorAgent.js';
import { ValidatorAgent } from '../ValidatorAgent.js';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';
import { VectorStoreManager } from '../../vector-store/VectorStoreManager.js';
import { DocumentProcessor } from '../../document-processing/DocumentProcessor.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { Guardrails } from '../../security/Guardrails.js';
import { AgentJobProcessor } from '../../jobs/AgentJobProcessor.js';
import { Langfuse } from 'langfuse';
import { Session } from '../../models/Session.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export interface AgentIntegrationConfig {
  sessionId: string;
  langfuseClient?: Langfuse;
  enableRAG?: boolean;
  enableMemory?: boolean;
}

export class AgentIntegration {
  private orchestrator: AgentOrchestrator;
  private vectorStoreManager?: VectorStoreManager;
  private documentProcessor: DocumentProcessor;
  private memoryManager?: MemoryManager;
  private guardrails: Guardrails;
  private sessionId: string;

  constructor(config: AgentIntegrationConfig) {
    this.sessionId = config.sessionId;

    // Initialize Langfuse if not provided
    const langfuseClient =
      config.langfuseClient ||
      new Langfuse({
        secretKey: process.env.LANGFUSE_SECRET_KEY!,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
        baseUrl: process.env.LANGFUSE_BASE_URL,
      });

    // Initialize orchestrator
    this.orchestrator = new AgentOrchestrator({
      langfuseClient,
      traceId: `trace-${config.sessionId}`,
    });

    // Initialize vector store if RAG is enabled
    if (config.enableRAG) {
      this.vectorStoreManager = new VectorStoreManager({
        collectionName: process.env.CHROMA_COLLECTION || 'frontbench_documents',
      });
    }

    // Initialize document processor
    this.documentProcessor = new DocumentProcessor();

    // Initialize memory if enabled
    if (config.enableMemory) {
      this.memoryManager = new MemoryManager({
        sessionId: config.sessionId,
        memoryType: 'hybrid',
      });
    }

    // Initialize guardrails
    this.guardrails = new Guardrails({
      enablePromptInjectionDetection: true,
      enableOutputValidation: true,
      enablePIIDetection: true,
    });

    // Register agents
    this.registerAgents(langfuseClient);
  }

  private planner?: PlannerAgent;
  private executor?: ExecutorAgent;
  private validator?: ValidatorAgent;
  private jobProcessor?: AgentJobProcessor;

  /**
   * Register all agents with orchestrator
   */
  private registerAgents(langfuseClient: Langfuse): void {
    // Core agents
    const resumeAgent = new ResumeAnalysisAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      vectorStoreManager: this.vectorStoreManager,
    });

    const benchmarkAgent = new BenchmarkAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      vectorStoreManager: this.vectorStoreManager,
    });

    const trajectoryAgent = new TrajectoryAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      vectorStoreManager: this.vectorStoreManager,
    });

    const learningPathAgent = new LearningPathAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      vectorStoreManager: this.vectorStoreManager,
    });

    // Register with orchestrator
    this.orchestrator.registerAgent('resume_analysis', resumeAgent);
    this.orchestrator.registerAgent('benchmark', benchmarkAgent);
    this.orchestrator.registerAgent('trajectory', trajectoryAgent);
    this.orchestrator.registerAgent('learning_path', learningPathAgent);

    // Planning and execution agents
    this.planner = new PlannerAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
    });

    this.executor = new ExecutorAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      orchestrator: this.orchestrator,
    });

    this.validator = new ValidatorAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
    });

    // Job processor for async execution
    this.jobProcessor = new AgentJobProcessor(
      this.orchestrator,
      this.planner,
      this.executor,
      this.validator,
      { concurrency: 3 }
    );
  }

  /**
   * Process resume upload with agentic AI
   */
  async processResumeUpload(
    resumeText: string,
    filePath?: string
  ): Promise<{
    analysis: any;
    tokenUsage: any;
  }> {
    // Validate input
    const validation = this.guardrails.validateInput(resumeText);
    if (!validation.isValid) {
      console.warn('Input validation warnings:', validation.warnings);
    }

    const sanitizedInput = validation.sanitized;

    // Process document if file path provided
    if (filePath && this.vectorStoreManager) {
      try {
        const document = await this.documentProcessor.processFile(filePath);
        const chunks = this.documentProcessor.chunkDocument(document, 1000, 200);

        // Add to vector store for RAG
        await this.vectorStoreManager.addDocuments(chunks, {
          sessionId: this.sessionId,
          documentType: 'resume',
        });
      } catch (error: any) {
        console.error('Failed to process document:', error.message);
      }
    }

    // Initialize memory if enabled
    if (this.memoryManager) {
      await this.memoryManager.initialize();
    }

    // Execute agent task
    const result = await this.orchestrator.executeTask({
      id: `task-${Date.now()}`,
      type: 'analysis',
      description: 'Analyze resume and extract structured information',
      input: { resumeText: sanitizedInput },
    });

    // Save to memory if enabled
    if (this.memoryManager) {
      await this.memoryManager.saveContext(
        sanitizedInput.substring(0, 500),
        result.result
      );
    }

    // Parse result
    let analysis;
    try {
      analysis = JSON.parse(result.result);
    } catch {
      analysis = { raw: result.result };
    }

    return {
      analysis,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Generate benchmarks using agentic AI
   */
  async generateBenchmarks(resumeAnalysis: any): Promise<{
    benchmarks: any;
    tokenUsage: any;
  }> {
    const task = {
      id: `benchmark-${Date.now()}`,
      type: 'generation' as const,
      description: 'Generate benchmark data for resume analysis',
      input: { resumeAnalysis },
      priority: 1,
    };

    const result = await this.orchestrator.executeTask(task);

    await logAuditEvent({
      sessionId: this.sessionId,
      action: 'agent_execution',
      status: 'success',
      metadata: {
        agentName: 'benchmark',
        operation: 'generate_benchmarks',
      },
    } as any);

    return {
      benchmarks: JSON.parse(result.result),
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Generate career trajectory using agentic AI
   */
  async generateTrajectory(resumeAnalysis: any): Promise<{
    trajectory: any;
    tokenUsage: any;
  }> {
    const task = {
      id: `trajectory-${Date.now()}`,
      type: 'generation' as const,
      description: 'Generate career trajectory for resume analysis',
      input: { resumeAnalysis },
      priority: 1,
    };

    const result = await this.orchestrator.executeTask(task);

    await logAuditEvent({
      sessionId: this.sessionId,
      action: 'agent_execution',
      status: 'success',
      metadata: {
        agentName: 'trajectory',
        operation: 'generate_trajectory',
      },
    } as any);

    return {
      trajectory: JSON.parse(result.result),
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Generate learning path using agentic AI
   */
  async generateLearningPath(
    resumeAnalysis: any,
    trajectory?: any
  ): Promise<{
    learningPath: any;
    tokenUsage: any;
  }> {
    const task = {
      id: `learning-path-${Date.now()}`,
      type: 'generation' as const,
      description: 'Generate learning path for career development',
      input: { resumeAnalysis, trajectory },
      priority: 1,
    };

    const result = await this.orchestrator.executeTask(task);

    await logAuditEvent({
      sessionId: this.sessionId,
      action: 'agent_execution',
      status: 'success',
      metadata: {
        agentName: 'learning_path',
        operation: 'generate_learning_path',
      },
    } as any);

    return {
      learningPath: JSON.parse(result.result),
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Execute full analysis workflow (async)
   */
  async executeFullAnalysisAsync(resumeText: string): Promise<string> {
    if (!this.jobProcessor) {
      throw new Error('Job processor not initialized');
    }

    const jobId = await this.jobProcessor.addJob('full_analysis', {
      task: 'Perform complete resume analysis including benchmarks, trajectory, and learning path',
      context: { resumeText },
      sessionId: this.sessionId,
      validate: true,
    });

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): any {
    if (!this.jobProcessor) {
      throw new Error('Job processor not initialized');
    }

    return this.jobProcessor.getJobStatus(jobId);
  }

  /**
   * Search documents using RAG
   */
  async searchDocuments(query: string, k: number = 5): Promise<any[]> {
    if (!this.vectorStoreManager) {
      throw new Error('RAG is not enabled. Set enableRAG: true in config.');
    }

    const results = await this.vectorStoreManager.similaritySearch(query, k);
    return results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }
}
