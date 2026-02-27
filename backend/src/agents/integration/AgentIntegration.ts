/**
 * Agent Integration Layer
 * Integrates LangChain agents with existing Frontbench API endpoints
 */

import { ResumeAnalysisAgent } from '../ResumeAnalysisAgent.js';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';
import { VectorStoreManager } from '../../vector-store/VectorStoreManager.js';
import { DocumentProcessor } from '../../document-processing/DocumentProcessor.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { Guardrails } from '../../security/Guardrails.js';
import { Langfuse } from 'langfuse';
import { Session } from '../../models/Session.js';

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

  /**
   * Register all agents with orchestrator
   */
  private registerAgents(langfuseClient: Langfuse): void {
    const resumeAgent = new ResumeAnalysisAgent({
      langfuseClient,
      traceId: `trace-${this.sessionId}`,
      vectorStoreManager: this.vectorStoreManager,
    });

    this.orchestrator.registerAgent('resume_analysis', resumeAgent);
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
    // This would use a BenchmarkAgent (to be implemented)
    // For now, return placeholder
    throw new Error('BenchmarkAgent not yet implemented');
  }

  /**
   * Generate career trajectory using agentic AI
   */
  async generateTrajectory(resumeAnalysis: any): Promise<{
    trajectory: any;
    tokenUsage: any;
  }> {
    // This would use a TrajectoryAgent (to be implemented)
    throw new Error('TrajectoryAgent not yet implemented');
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
    // This would use a LearningPathAgent (to be implemented)
    throw new Error('LearningPathAgent not yet implemented');
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
