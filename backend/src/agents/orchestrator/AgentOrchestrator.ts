/**
 * Agent Orchestrator
 * Coordinates multiple agents to accomplish complex tasks
 */

import { BaseAgent } from '../base/BaseAgent.js';
import { Langfuse } from 'langfuse';

export interface OrchestrationConfig {
  langfuseClient?: Langfuse;
  traceId?: string;
}

export interface Task {
  id: string;
  type: 'analysis' | 'research' | 'generation' | 'validation';
  description: string;
  input: any;
  priority?: number;
}

export interface OrchestrationResult {
  taskId: string;
  agent: string;
  result: any;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private langfuseClient?: Langfuse;
  private traceId?: string;

  constructor(config: OrchestrationConfig = {}) {
    this.langfuseClient = config.langfuseClient;
    this.traceId = config.traceId;
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(name: string, agent: BaseAgent): void {
    this.agents.set(name, agent);
  }

  /**
   * Execute a single task with the appropriate agent
   */
  async executeTask(task: Task): Promise<OrchestrationResult> {
    const agent = this.selectAgent(task);
    
    if (!agent) {
      throw new Error(`No suitable agent found for task type: ${task.type}`);
    }

    const trace = this.langfuseClient?.trace({
      id: this.traceId,
      name: 'agent_orchestration',
      metadata: {
        taskId: task.id,
        taskType: task.type,
        agentName: agent.constructor.name,
      },
    });

    try {
      const result = await agent.execute(JSON.stringify(task.input));

      trace?.update({
        output: result.output,
        metadata: {
          taskId: task.id,
          tokenUsage: result.tokenUsage,
        },
      });

      return {
        taskId: task.id,
        agent: agent.constructor.name,
        result: result.output,
        tokenUsage: result.tokenUsage,
      };
    } catch (error: any) {
      trace?.update({
        metadata: {
          error: true,
          errorMessage: error.message,
          status: 'error',
        },
      });

      throw error;
    }
  }

  /**
   * Execute multiple tasks in sequence or parallel
   */
  async executeTasks(
    tasks: Task[],
    parallel: boolean = false
  ): Promise<OrchestrationResult[]> {
    if (parallel) {
      return Promise.all(tasks.map((task) => this.executeTask(task)));
    } else {
      const results: OrchestrationResult[] = [];
      for (const task of tasks) {
        const result = await this.executeTask(task);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Select the appropriate agent for a task
   */
  private selectAgent(task: Task): BaseAgent | undefined {
    // Simple agent selection logic
    // Can be enhanced with more sophisticated routing
    for (const [name, agent] of this.agents.entries()) {
      if (name.toLowerCase().includes(task.type)) {
        return agent;
      }
    }

    // Fallback to first available agent
    return this.agents.values().next().value;
  }

  /**
   * Get all registered agents
   */
  getAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}
