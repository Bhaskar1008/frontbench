/**
 * Executor Agent
 * Executes planned actions using appropriate tools and agents
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { PlanStep } from './PlannerAgent.js';
import { AgentOrchestrator } from './orchestrator/AgentOrchestrator.js';

export interface ExecutionResult {
  stepId: string;
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ExecutorAgent extends BaseAgent {
  private orchestrator: AgentOrchestrator;

  constructor(config: AgentConfig & { orchestrator: AgentOrchestrator }) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.3,
    });

    this.orchestrator = config.orchestrator;
  }

  protected registerTools(): void {
    // Executor uses orchestrator to execute steps
  }

  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are an execution agent responsible for carrying out planned tasks.

Your responsibilities:
- Execute steps according to the plan
- Handle errors gracefully
- Report execution status
- Coordinate with other agents via the orchestrator

When executing a step:
1. Identify the required agent
2. Prepare the input data
3. Execute via orchestrator
4. Validate the output
5. Report results

Be efficient and accurate in execution.`,
    };
  }

  /**
   * Execute a single plan step
   */
  async executeStep(step: PlanStep): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const result = await this.orchestrator.executeTask({
        id: step.id,
        type: this.mapAgentToTaskType(step.agent),
        description: step.description,
        input: step.input,
        priority: step.priority,
      });

      const executionTime = Date.now() - startTime;

      return {
        stepId: step.id,
        success: true,
        output: result.result,
        executionTime,
        tokenUsage: result.tokenUsage,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        stepId: step.id,
        success: false,
        output: null,
        error: error.message,
        executionTime,
      };
    }
  }

  /**
   * Execute multiple steps in order (respecting dependencies)
   */
  async executePlan(steps: PlanStep[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    const completedSteps = new Set<string>();

    // Sort steps by priority
    const sortedSteps = [...steps].sort((a, b) => a.priority - b.priority);

    for (const step of sortedSteps) {
      // Check dependencies
      if (step.dependencies && step.dependencies.length > 0) {
        const allDependenciesMet = step.dependencies.every((dep) =>
          completedSteps.has(dep)
        );

        if (!allDependenciesMet) {
          results.push({
            stepId: step.id,
            success: false,
            output: null,
            error: `Dependencies not met: ${step.dependencies.join(', ')}`,
            executionTime: 0,
          });
          continue;
        }
      }

      const result = await this.executeStep(step);
      results.push(result);

      if (result.success) {
        completedSteps.add(step.id);
      }
    }

    return results;
  }

  /**
   * Map agent name to task type
   */
  private mapAgentToTaskType(agentName: string): 'analysis' | 'research' | 'generation' | 'validation' {
    if (agentName.includes('analysis')) return 'analysis';
    if (agentName.includes('research')) return 'research';
    if (agentName.includes('validator')) return 'validation';
    return 'generation';
  }
}
