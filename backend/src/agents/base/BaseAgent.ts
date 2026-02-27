/**
 * Base Agent Class
 * Provides foundation for all agentic AI agents in the system
 */

import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { Tool } from '@langchain/core/tools';
import { Langfuse } from 'langfuse';

export interface AgentConfig {
  modelName?: string;
  temperature?: number;
  maxIterations?: number;
  verbose?: boolean;
  langfuseClient?: Langfuse;
  traceId?: string;
}

export interface AgentResponse {
  output: string;
  intermediateSteps?: any[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class BaseAgent {
  protected executor: AgentExecutor | null = null;
  protected llm: ChatOpenAI;
  protected tools: Tool[] = [];
  protected config: Required<AgentConfig>;
  protected langfuseClient?: Langfuse;
  protected traceId?: string;

  constructor(config: AgentConfig = {}) {
    this.config = {
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.3,
      maxIterations: config.maxIterations ?? 15,
      verbose: config.verbose ?? false,
      langfuseClient: config.langfuseClient,
      traceId: config.traceId,
    };

    this.langfuseClient = config.langfuseClient;
    this.traceId = config.traceId;

    // Initialize LLM
    this.llm = new ChatOpenAI({
      modelName: this.config.modelName,
      temperature: this.config.temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Register tools
    this.registerTools();
  }

  /**
   * Abstract method: Subclasses must implement tool registration
   */
  protected abstract registerTools(): void;

  /**
   * Initialize the agent executor
   */
  protected async initializeExecutor(): Promise<void> {
    if (this.executor) {
      return;
    }

    const prompt = await this.getPromptTemplate();

    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools: this.tools,
      prompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: this.config.verbose,
      maxIterations: this.config.maxIterations,
    });
  }

  /**
   * Get the prompt template for this agent
   * Can be overridden by subclasses
   */
  protected async getPromptTemplate(): Promise<any> {
    return undefined; // Use default LangChain prompt
  }

  /**
   * Execute the agent with given input
   */
  async execute(input: string | BaseMessage[]): Promise<AgentResponse> {
    await this.initializeExecutor();

    if (!this.executor) {
      throw new Error('Agent executor not initialized');
    }

    const trace = this.langfuseClient?.trace({
      id: this.traceId,
      name: this.constructor.name,
    });

    try {
      const result = await this.executor.invoke({
        input: typeof input === 'string' ? input : input,
      });

      // Extract token usage if available
      const tokenUsage = this.extractTokenUsage(result);

      trace?.update({
        output: result.output,
        metadata: {
          agentType: this.constructor.name,
          tokenUsage,
        },
      });

      return {
        output: result.output,
        intermediateSteps: result.intermediateSteps,
        tokenUsage,
      };
    } catch (error: any) {
      trace?.update({
        level: 'ERROR',
        statusMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Extract token usage from result
   */
  protected extractTokenUsage(result: any): AgentResponse['tokenUsage'] {
    // Token usage extraction depends on LangChain version
    // This is a placeholder - implement based on actual LangChain response structure
    return undefined;
  }

  /**
   * Add a tool to the agent
   */
  protected addTool(tool: Tool): void {
    this.tools.push(tool);
    // Reset executor to pick up new tools
    this.executor = null;
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return [...this.tools];
  }
}
