/**
 * Benchmark Agent
 * Generates market benchmark data using agentic AI
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { DocumentSearchTool } from './tools/DocumentSearchTool.js';
import { VectorStoreManager } from '../vector-store/VectorStoreManager.js';

export class BenchmarkAgent extends BaseAgent {
  private vectorStoreManager?: VectorStoreManager;

  constructor(config: AgentConfig & { vectorStoreManager?: VectorStoreManager } = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.5,
    });

    this.vectorStoreManager = config.vectorStoreManager;
  }

  protected registerTools(): void {
    // Document search for market data
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
      systemMessage: `You are a career market analyst specializing in the Indian job market. 

Your capabilities:
- Generate realistic benchmark data based on current market trends
- Analyze salary ranges, skill requirements, and market demand
- Provide percentile rankings and competitive positioning
- Consider Indian market context (LPA salary ranges, regional variations)

Guidelines:
- Use Indian Rupees (INR) for all salary amounts
- Typical ranges: Junior (3-8 LPA), Mid-level (8-15 LPA), Senior (15-30 LPA), Lead/Principal (30-50+ LPA)
- Base benchmarks on real market data when available
- Provide actionable insights`,
    };
  }
}
