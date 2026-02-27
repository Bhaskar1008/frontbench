/**
 * Planner Agent
 * Breaks down complex tasks into actionable steps
 */

import { BaseAgent, AgentConfig } from './base/BaseAgent.js';
import { Tool } from '@langchain/core/tools';
import { z } from 'zod';

export interface Plan {
  steps: PlanStep[];
  estimatedTime?: number;
  dependencies?: string[];
}

export interface PlanStep {
  id: string;
  description: string;
  agent: string;
  tool?: string;
  input: any;
  priority: number;
  dependencies?: string[];
}

export class PlannerAgent extends BaseAgent {
  constructor(config: AgentConfig = {}) {
    super({
      ...config,
      modelName: config.modelName || 'gpt-4o-mini',
      temperature: config.temperature ?? 0.2, // Lower temperature for planning
    });
  }

  protected registerTools(): void {
    // Planner doesn't need tools, it creates plans
  }

  protected async getPromptTemplate(): Promise<any> {
    return {
      systemMessage: `You are an expert task planner for an AI agent system. Your role is to break down complex tasks into actionable steps.

When given a task, analyze it and create a detailed plan with:
1. Sequential steps that need to be executed
2. The appropriate agent for each step
3. Required tools for each step
4. Dependencies between steps
5. Priority ordering

Available agents:
- resume_analysis: Analyzes resumes and extracts information
- benchmark: Generates market benchmark data
- trajectory: Creates career trajectory projections
- learning_path: Generates learning recommendations
- validator: Validates outputs and checks quality
- research: Searches knowledge base and documents

Return a JSON plan with this structure:
{
  "steps": [
    {
      "id": "step-1",
      "description": "What needs to be done",
      "agent": "agent_name",
      "tool": "optional_tool_name",
      "input": {...},
      "priority": 1,
      "dependencies": []
    }
  ],
  "estimatedTime": 30,
  "dependencies": []
}`,
    };
  }

  /**
   * Create a plan for a given task
   */
  async createPlan(taskDescription: string, context?: any): Promise<Plan> {
    const prompt = `Create a detailed execution plan for the following task:

Task: ${taskDescription}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ''}

Analyze the task and break it down into sequential steps. Consider:
- What information is needed?
- What agents should be involved?
- What are the dependencies between steps?
- What is the optimal execution order?

Return ONLY valid JSON with the plan structure.`;

    const result = await this.execute(prompt);

    try {
      const plan = JSON.parse(result.output) as Plan;
      
      // Validate plan structure
      this.validatePlan(plan);
      
      return plan;
    } catch (error: any) {
      throw new Error(`Failed to parse plan: ${error.message}`);
    }
  }

  /**
   * Validate plan structure
   */
  private validatePlan(plan: Plan): void {
    if (!plan.steps || !Array.isArray(plan.steps)) {
      throw new Error('Plan must have a steps array');
    }

    plan.steps.forEach((step, index) => {
      if (!step.id) {
        throw new Error(`Step ${index} missing id`);
      }
      if (!step.description) {
        throw new Error(`Step ${index} missing description`);
      }
      if (!step.agent) {
        throw new Error(`Step ${index} missing agent`);
      }
      if (typeof step.priority !== 'number') {
        throw new Error(`Step ${index} missing priority`);
      }
    });
  }
}
