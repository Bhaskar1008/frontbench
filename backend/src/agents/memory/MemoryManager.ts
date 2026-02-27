/**
 * Memory Manager
 * Handles short-term and long-term memory for agents
 */

import { BufferMemory, ConversationSummaryMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/memory';
import { Session } from '../../models/Session.js';
import { BaseMessage } from '@langchain/core/messages';

export interface MemoryConfig {
  sessionId: string;
  memoryType?: 'buffer' | 'summary' | 'hybrid';
  maxTokenLimit?: number;
}

export class MemoryManager {
  private sessionId: string;
  private bufferMemory?: BufferMemory;
  private summaryMemory?: ConversationSummaryMemory;
  private memoryType: 'buffer' | 'summary' | 'hybrid';

  constructor(config: MemoryConfig) {
    this.sessionId = config.sessionId;
    this.memoryType = config.memoryType || 'hybrid';
  }

  /**
   * Initialize memory based on type
   */
  async initialize(): Promise<void> {
    const chatHistory = new ChatMessageHistory();

    // Load existing conversation history from database
    const session = await Session.findOne({ sessionId: this.sessionId });
    if (session?.metadata?.conversationHistory) {
      // Restore conversation history
      // Implementation depends on how we store messages
    }

    if (this.memoryType === 'buffer' || this.memoryType === 'hybrid') {
      this.bufferMemory = new BufferMemory({
        chatHistory,
        returnMessages: true,
        memoryKey: 'history',
      });
    }

    if (this.memoryType === 'summary' || this.memoryType === 'hybrid') {
      this.summaryMemory = new ConversationSummaryMemory({
        llm: new (await import('@langchain/openai')).ChatOpenAI({
          modelName: 'gpt-4o-mini',
          openAIApiKey: process.env.OPENAI_API_KEY,
        }),
        chatHistory,
        memoryKey: 'history',
      });
    }
  }

  /**
   * Save messages to memory
   */
  async saveContext(input: string, output: string): Promise<void> {
    if (this.bufferMemory) {
      await this.bufferMemory.saveContext({ input }, { output });
    }

    if (this.summaryMemory) {
      await this.summaryMemory.saveContext({ input }, { output });
    }

    // Persist to database
    await this.persistToDatabase(input, output);
  }

  /**
   * Load conversation history
   */
  async loadMemory(): Promise<BaseMessage[]> {
    if (this.bufferMemory) {
      const history = await this.bufferMemory.loadMemoryVariables({});
      return history.history || [];
    }

    return [];
  }

  /**
   * Get memory variables for agent
   */
  async getMemoryVariables(): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    if (this.bufferMemory) {
      const bufferVars = await this.bufferMemory.loadMemoryVariables({});
      variables.history = bufferVars.history;
    }

    if (this.summaryMemory) {
      const summaryVars = await this.summaryMemory.loadMemoryVariables({});
      variables.summary = summaryVars.summary;
    }

    return variables;
  }

  /**
   * Clear memory
   */
  async clearMemory(): Promise<void> {
    if (this.bufferMemory) {
      await this.bufferMemory.clear();
    }

    if (this.summaryMemory) {
      await this.summaryMemory.clear();
    }

    // Clear from database
    await Session.updateOne(
      { sessionId: this.sessionId },
      { $unset: { 'metadata.conversationHistory': '' } }
    );
  }

  /**
   * Persist memory to database
   */
  private async persistToDatabase(input: string, output: string): Promise<void> {
    try {
      await Session.updateOne(
        { sessionId: this.sessionId },
        {
          $push: {
            'metadata.conversationHistory': {
              input,
              output,
              timestamp: new Date(),
            },
          },
        }
      );
    } catch (error: any) {
      console.error('Failed to persist memory to database:', error.message);
    }
  }
}
