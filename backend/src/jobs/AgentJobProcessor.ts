/**
 * Agent Job Processor
 * Processes agentic AI jobs asynchronously
 */

import { JobQueue, Job } from './JobQueue.js';
import { AgentOrchestrator } from '../agents/orchestrator/AgentOrchestrator.js';
import { PlannerAgent } from '../agents/PlannerAgent.js';
import { ExecutorAgent } from '../agents/ExecutorAgent.js';
import { ValidatorAgent } from '../agents/ValidatorAgent.js';

export interface AgentJobData {
  task: string;
  context?: any;
  sessionId: string;
  validate?: boolean;
}

export class AgentJobProcessor extends JobQueue {
  private orchestrator: AgentOrchestrator;
  private planner: PlannerAgent;
  private executor: ExecutorAgent;
  private validator: ValidatorAgent;

  constructor(
    orchestrator: AgentOrchestrator,
    planner: PlannerAgent,
    executor: ExecutorAgent,
    validator: ValidatorAgent,
    config?: { concurrency?: number }
  ) {
    super(config);
    this.orchestrator = orchestrator;
    this.planner = planner;
    this.executor = executor;
    this.validator = validator;

    // Register job handlers
    this.registerHandler('resume_analysis', this.handleResumeAnalysis.bind(this));
    this.registerHandler('benchmark_generation', this.handleBenchmarkGeneration.bind(this));
    this.registerHandler('trajectory_generation', this.handleTrajectoryGeneration.bind(this));
    this.registerHandler('learning_path_generation', this.handleLearningPathGeneration.bind(this));
    this.registerHandler('full_analysis', this.handleFullAnalysis.bind(this));
  }

  /**
   * Override executeJob to use handlers
   */
  protected async executeJob(job: Job): Promise<any> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${job.type}`);
    }

    return handler(job.data);
  }

  /**
   * Handle resume analysis job
   */
  private async handleResumeAnalysis(data: AgentJobData): Promise<any> {
    const plan = await this.planner.createPlan(data.task, data.context);
    const results = await this.executor.executePlan(plan.steps);

    if (data.validate) {
      // Validate results
      for (const result of results) {
        if (result.success && result.output) {
          const validation = await this.validator.validateQuality(result.output);
          result.output = {
            ...result.output,
            validation,
          };
        }
      }
    }

    return results;
  }

  /**
   * Handle benchmark generation job
   */
  private async handleBenchmarkGeneration(data: AgentJobData): Promise<any> {
    const plan = await this.planner.createPlan(
      `Generate benchmark data for: ${data.task}`,
      data.context
    );
    return this.executor.executePlan(plan.steps);
  }

  /**
   * Handle trajectory generation job
   */
  private async handleTrajectoryGeneration(data: AgentJobData): Promise<any> {
    const plan = await this.planner.createPlan(
      `Generate career trajectory for: ${data.task}`,
      data.context
    );
    return this.executor.executePlan(plan.steps);
  }

  /**
   * Handle learning path generation job
   */
  private async handleLearningPathGeneration(data: AgentJobData): Promise<any> {
    const plan = await this.planner.createPlan(
      `Generate learning path for: ${data.task}`,
      data.context
    );
    return this.executor.executePlan(plan.steps);
  }

  /**
   * Handle full analysis job (resume + benchmark + trajectory + learning path)
   */
  private async handleFullAnalysis(data: AgentJobData): Promise<any> {
    const steps = [
      {
        id: 'step-1',
        description: 'Analyze resume',
        agent: 'resume_analysis',
        input: data.context,
        priority: 1,
        dependencies: [],
      },
      {
        id: 'step-2',
        description: 'Generate benchmarks',
        agent: 'benchmark',
        input: { analysis: 'step-1-output' },
        priority: 2,
        dependencies: ['step-1'],
      },
      {
        id: 'step-3',
        description: 'Generate trajectory',
        agent: 'trajectory',
        input: { analysis: 'step-1-output' },
        priority: 2,
        dependencies: ['step-1'],
      },
      {
        id: 'step-4',
        description: 'Generate learning path',
        agent: 'learning_path',
        input: {
          analysis: 'step-1-output',
          trajectory: 'step-3-output',
        },
        priority: 3,
        dependencies: ['step-1', 'step-3'],
      },
    ];

    const results = await this.executor.executePlan(steps as any);

    // Validate all outputs
    if (data.validate) {
      for (const result of results) {
        if (result.success && result.output) {
          const validation = await this.validator.validateQuality(result.output);
          result.output = {
            ...result.output,
            validation,
          };
        }
      }
    }

    return results;
  }
}
