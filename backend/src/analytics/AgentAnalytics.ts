/**
 * Agent Analytics & Monitoring
 * Tracks agent performance, token usage, and workflow metrics
 */

import { Session } from '../models/Session.js';
import { TokenUsage } from '../models/TokenUsage.js';
import { AuditLog } from '../models/AuditLog.js';

export interface AgentMetrics {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
  lastExecution?: Date;
}

export interface WorkflowMetrics {
  workflowType: string;
  totalRuns: number;
  averageSteps: number;
  averageExecutionTime: number;
  successRate: number;
  averageTokens: number;
  averageCost: number;
}

export class AgentAnalytics {
  /**
   * Get metrics for a specific agent
   */
  async getAgentMetrics(
    agentName: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AgentMetrics> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    // Get token usage for this agent
    const tokenUsageRecords = await TokenUsage.find({
      ...dateFilter,
      'metadata.agentName': agentName,
    });

    const totalTokens = tokenUsageRecords.reduce(
      (sum, record) => sum + (record.totalTokens || 0),
      0
    );
    const totalCost = tokenUsageRecords.reduce(
      (sum, record) => sum + (record.estimatedCost || 0),
      0
    );

    // Get audit logs for execution tracking
    const auditLogs = await AuditLog.find({
      ...dateFilter,
      action: 'agent_execution',
      'metadata.agentName': agentName,
    });

    const totalExecutions = auditLogs.length;
    const successfulExecutions = auditLogs.filter(
      (log) => log.status === 'success'
    ).length;
    const failedExecutions = auditLogs.filter(
      (log) => log.status === 'error'
    ).length;

    const executionTimes = auditLogs
      .map((log) => log.metadata?.executionTime)
      .filter((time): time is number => typeof time === 'number');

    const averageExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    const lastExecution = auditLogs.length > 0 ? auditLogs[0].createdAt : undefined;

    return {
      agentName,
      totalExecutions,
      successRate:
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageExecutionTime,
      totalTokens,
      totalCost,
      errorRate:
        totalExecutions > 0 ? failedExecutions / totalExecutions : 0,
      lastExecution,
    };
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(
    workflowType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<WorkflowMetrics> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const auditLogs = await AuditLog.find({
      ...dateFilter,
      action: 'workflow_execution',
      'metadata.workflowType': workflowType,
    });

    const totalRuns = auditLogs.length;
    const successfulRuns = auditLogs.filter(
      (log) => log.status === 'success'
    ).length;

    const workflows = auditLogs.map((log) => ({
      steps: log.metadata?.steps || 0,
      executionTime: log.metadata?.executionTime || 0,
      tokens: log.metadata?.totalTokens || 0,
      cost: log.metadata?.totalCost || 0,
    }));

    const averageSteps =
      workflows.length > 0
        ? workflows.reduce((sum, w) => sum + w.steps, 0) / workflows.length
        : 0;

    const averageExecutionTime =
      workflows.length > 0
        ? workflows.reduce((sum, w) => sum + w.executionTime, 0) /
          workflows.length
        : 0;

    const averageTokens =
      workflows.length > 0
        ? workflows.reduce((sum, w) => sum + w.tokens, 0) / workflows.length
        : 0;

    const averageCost =
      workflows.length > 0
        ? workflows.reduce((sum, w) => sum + w.cost, 0) / workflows.length
        : 0;

    return {
      workflowType,
      totalRuns,
      averageSteps,
      averageExecutionTime,
      successRate: totalRuns > 0 ? successfulRuns / totalRuns : 0,
      averageTokens,
      averageCost,
    };
  }

  /**
   * Get token usage breakdown by agent
   */
  async getTokenUsageByAgent(
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, { tokens: number; cost: number }>> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const tokenUsageRecords = await TokenUsage.find(dateFilter);

    const breakdown: Record<string, { tokens: number; cost: number }> = {};

    tokenUsageRecords.forEach((record) => {
      const agentName =
        record.metadata?.agentName || record.operation || 'unknown';
      if (!breakdown[agentName]) {
        breakdown[agentName] = { tokens: 0, cost: 0 };
      }
      breakdown[agentName].tokens += record.totalTokens || 0;
      breakdown[agentName].cost += record.estimatedCost || 0;
    });

    return breakdown;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<{
    totalAgentsUsed: number;
    totalTokens: number;
    totalCost: number;
    executionTime: number;
    agents: string[];
  }> {
    const session = await Session.findOne({ sessionId });
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const tokenUsageRecords = await TokenUsage.find({ sessionId });
    const auditLogs = await AuditLog.find({
      sessionId,
      action: 'agent_execution',
    });

    const agents = new Set<string>();
    auditLogs.forEach((log) => {
      if (log.metadata?.agentName) {
        agents.add(log.metadata.agentName);
      }
    });

    const totalTokens = tokenUsageRecords.reduce(
      (sum, record) => sum + (record.totalTokens || 0),
      0
    );
    const totalCost = tokenUsageRecords.reduce(
      (sum, record) => sum + (record.estimatedCost || 0),
      0
    );

    const executionTimes = auditLogs
      .map((log) => log.metadata?.executionTime)
      .filter((time): time is number => typeof time === 'number');

    const executionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0)
        : 0;

    return {
      totalAgentsUsed: agents.size,
      totalTokens,
      totalCost,
      executionTime,
      agents: Array.from(agents),
    };
  }

  /**
   * Get top performing agents
   */
  async getTopAgents(limit: number = 10): Promise<AgentMetrics[]> {
    const auditLogs = await AuditLog.find({
      action: 'agent_execution',
    });

    const agentStats: Record<string, AgentMetrics> = {};

    auditLogs.forEach((log) => {
      const agentName = log.metadata?.agentName || 'unknown';
      if (!agentStats[agentName]) {
        agentStats[agentName] = {
          agentName,
          totalExecutions: 0,
          successRate: 0,
          averageExecutionTime: 0,
          totalTokens: 0,
          totalCost: 0,
          errorRate: 0,
        };
      }

      agentStats[agentName].totalExecutions++;
      if (log.status === 'success') {
        agentStats[agentName].successRate += 1;
      } else if (log.status === 'error') {
        agentStats[agentName].errorRate += 1;
      }
    });

    // Calculate averages
    Object.values(agentStats).forEach((stats) => {
      stats.successRate /= stats.totalExecutions;
      stats.errorRate /= stats.totalExecutions;
    });

    // Get token usage
    const tokenBreakdown = await this.getTokenUsageByAgent();
    Object.entries(tokenBreakdown).forEach(([agentName, usage]) => {
      if (agentStats[agentName]) {
        agentStats[agentName].totalTokens = usage.tokens;
        agentStats[agentName].totalCost = usage.cost;
      }
    });

    return Object.values(agentStats)
      .sort((a, b) => b.totalExecutions - a.totalExecutions)
      .slice(0, limit);
  }
}
