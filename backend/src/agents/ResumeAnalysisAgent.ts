/**
 * Resume Analysis Agent
 * Specialized agent for resume analysis using LangChain
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { ResumeAnalysisTool } from './tools/ResumeAnalysisTool.js';
import { DocumentSearchTool } from './tools/DocumentSearchTool.js';
import { ChatOpenAI } from '@langchain/openai';
import { VectorStoreManager } from '../vector-store/VectorStoreManager.js';

export class ResumeAnalysisAgent extends BaseAgent {
  private vectorStoreManager?: VectorStoreManager;

  constructor(config: AgentConfig & { vectorStoreManager?: VectorStoreManager } = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.3,
    });

    this.vectorStoreManager = config.vectorStoreManager;
  }

  /**
   * Register tools for resume analysis
   */
  protected registerTools(): void {
    // Resume analysis tool
    const openaiClient = new ChatOpenAI({
      modelName: 'gpt-4o-mini',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const resumeTool = new ResumeAnalysisTool({
      openai: openaiClient,
    });
    this.addTool(resumeTool);

    // Document search tool (if vector store is available)
    if (this.vectorStoreManager) {
      const vectorStore = this.vectorStoreManager.getVectorStore();
      const documentSearchTool = new DocumentSearchTool({
        vectorStore,
        k: 5,
      });
      this.addTool(documentSearchTool);
    }
  }

  /**
   * Get custom prompt template for resume analysis
   */
  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are an expert resume analyst specializing in career development and talent assessment.

Your capabilities:
- Extract structured information from resumes
- Identify skills, experience, and qualifications
- Assess strengths and areas for improvement
- Provide insights on career trajectory potential

Guidelines:
- Be thorough and accurate in extraction
- Focus on actionable insights
- Consider Indian job market context
- Use professional and constructive language`,
    };
  }
}
