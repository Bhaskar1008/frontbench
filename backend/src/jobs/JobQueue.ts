/**
 * Job Queue System
 * Handles async job processing for agentic workflows
 */

import { EventEmitter } from 'events';

export interface Job {
  id: string;
  type: string;
  data: any;
  priority?: number;
  retries?: number;
  maxRetries?: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface JobQueueConfig {
  concurrency?: number;
  retryDelay?: number;
  maxRetries?: number;
}

export class JobQueue extends EventEmitter {
  private queue: Job[] = [];
  private processing: Set<string> = new Set();
  private concurrency: number;
  private retryDelay: number;
  private maxRetries: number;

  constructor(config: JobQueueConfig = {}) {
    super();
    this.concurrency = config.concurrency || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    type: string,
    data: any,
    priority: number = 0
  ): Promise<string> {
    const job: Job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority,
      retries: 0,
      maxRetries: this.maxRetries,
      createdAt: new Date(),
      status: 'pending',
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex((j) => (j.priority || 0) < priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.emit('job:added', job);
    this.processQueue();

    return job.id;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more jobs
    if (this.processing.size >= this.concurrency) {
      return;
    }

    // Get next job
    const job = this.queue.shift();
    if (!job) {
      return;
    }

    // Start processing
    this.processing.add(job.id);
    job.status = 'processing';
    this.emit('job:started', job);

    try {
      const result = await this.executeJob(job);
      job.status = 'completed';
      job.result = result;
      this.emit('job:completed', job);
    } catch (error: any) {
      job.retries = (job.retries || 0) + 1;

      if (job.retries >= (job.maxRetries || this.maxRetries)) {
        job.status = 'failed';
        job.error = error.message;
        this.emit('job:failed', job);
      } else {
        // Retry after delay
        job.status = 'pending';
        setTimeout(() => {
          this.queue.push(job);
          this.processQueue();
        }, this.retryDelay);
        this.emit('job:retry', job);
      }
    } finally {
      this.processing.delete(job.id);
      // Process next job
      this.processQueue();
    }
  }

  /**
   * Execute a job (to be implemented by subclasses or via handlers)
   */
  protected async executeJob(job: Job): Promise<any> {
    throw new Error('executeJob must be implemented');
  }

  /**
   * Register a job handler
   */
  protected handlers: Map<string, (data: any) => Promise<any>> = new Map();

  registerHandler(type: string, handler: (data: any) => Promise<any>): void {
    this.handlers.set(type, handler);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Job | undefined {
    const job = this.queue.find((j) => j.id === jobId);
    if (job) return job;

    // Check processing jobs
    for (const processingJob of Array.from(this.processing)) {
      if (processingJob === jobId) {
        return { id: jobId, status: 'processing' } as Job;
      }
    }

    return undefined;
  }

  /**
   * Get queue stats
   */
  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      pending: this.queue.filter((j) => j.status === 'pending').length,
      processing: this.processing.size,
      completed: 0, // Would need to track completed jobs
      failed: 0, // Would need to track failed jobs
    };
  }
}
