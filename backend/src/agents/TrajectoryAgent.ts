/**
 * Career Trajectory Agent
 * Generates career trajectory projections using agentic AI
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { DocumentSearchTool } from './tools/DocumentSearchTool.js';
import { VectorStoreManager } from '../vector-store/VectorStoreManager.js';

export class TrajectoryAgent extends BaseAgent {
  private vectorStoreManager?: VectorStoreManager;

  constructor(config: AgentConfig & { vectorStoreManager?: VectorStoreManager } = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.6,
    });

    this.vectorStoreManager = config.vectorStoreManager;
  }

  protected registerTools(): void {
    // Document search for career path data
    if (this.vectorStoreManager) {
      const vectorStore = this.vectorStoreManager.getVectorStore();
      const documentSearchTool = new DocumentSearchTool({
        vectorStore,
        k: 8,
      });
      this.addTool(documentSearchTool);
    }
  }

  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are a career advisor specializing in the Indian job market. 

Your capabilities:
- Generate realistic career trajectory projections
- Identify next steps and milestones
- Project salary growth and role progression
- Consider market trends and opportunities

Guidelines:
- Use Indian Rupees (INR) for all salary amounts
- Provide realistic timelines (6 months, 1 year, 3 years, 5 years)
- Consider Indian market context and regional variations
- Focus on actionable next steps
- Balance ambition with realism`,
    };
  }
}
