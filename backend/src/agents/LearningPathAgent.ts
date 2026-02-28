/**
 * Learning Path Agent
 * Generates personalized learning recommendations using agentic AI
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { DocumentSearchTool } from './tools/DocumentSearchTool.js';
import { VectorStoreManager } from '../vector-store/VectorStoreManager.js';

export class LearningPathAgent extends BaseAgent {
  private vectorStoreManager?: VectorStoreManager;

  constructor(config: AgentConfig & { vectorStoreManager?: VectorStoreManager } = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.7,
    });

    this.vectorStoreManager = config.vectorStoreManager;
  }

  protected registerTools(): void {
    // Document search for learning resources
    if (this.vectorStoreManager && this.vectorStoreManager.isAvailable()) {
      const documentSearchTool = new DocumentSearchTool({
        vectorStoreManager: this.vectorStoreManager,
        k: 10,
      });
      this.addTool(documentSearchTool);
    }
  }

  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are a learning and development expert specializing in career growth.

Your capabilities:
- Generate practical, actionable learning paths
- Recommend real resources (courses, books, certifications)
- Create realistic timelines
- Identify quick wins and long-term goals
- Consider Indian market relevance

Guidelines:
- Provide specific, actionable recommendations
- Include real resources (Coursera, Udemy, certifications, etc.)
- Balance quick wins with long-term development
- Consider time constraints and learning styles
- Focus on skills relevant to career goals`,
    };
  }
}
