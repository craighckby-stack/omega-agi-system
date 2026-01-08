/**
 * AGENTIC API - Simple Interface for Agent Swarm
 * Provides easy access to agent capabilities and task submission
 */

import { agentRegistry } from './agents/agent-registry';
import { orchestrator } from './agents/orchestrator';

/**
 * Agent Capability
 */
export interface AgentCapability {
  agentId: string;
  name: string;
  domain: string;
  capabilities: string[];
  availability: 'available' | 'busy' | 'offline';
  priority: number;
}

/**
 * Task Submission
 */
export interface TaskSubmission {
  taskId: string;
  taskDescription: string;
  taskType: string;
  domain: string;
  priority: number;
  inputs?: any;
  context?: any;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Task Status
 */
export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';
  assignedAgent?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  progress: number; // 0.0 to 1.0
  result?: any;
  error?: string;
}

/**
 * Agentic API Class
 * Provides simple interface for agent swarm operations
 */
export class AgenticAPI {
  private static instance: AgenticAPI;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AgenticAPI {
    if (!AgenticAPI.instance) {
      AgenticAPI.instance = new AgenticAPI();
    }
    return AgenticAPI.instance;
  }

  /**
   * Get all available agents
   */
  async getAvailableAgents(): Promise<AgentCapability[]> {
    const agents = agentRegistry.getAllAgents();

    const capabilities: AgentCapability[] = agents.map(agent => ({
      agentId: agent.id,
      name: agent.name,
      domain: agent.domain,
      capabilities: agent.capabilities,
      availability: agent.status === 'idle' ? 'available' : 'busy',
      priority: agent.priority,
    }));

    return capabilities;
  }

  /**
   * Get agent by domain
   */
  async getAgentsByDomain(domain: string): Promise<AgentCapability[]> {
    const agents = await this.getAvailableAgents();

    return agents.filter(agent => agent.domain.toLowerCase() === domain.toLowerCase());
  }

  /**
   * Submit task to agent swarm
   */
  async submitTask(submission: TaskSubmission): Promise<TaskStatus> {
    console.log(`AgenticAPI: Submitting task ${submission.taskId} - ${submission.taskDescription}`);

    const task = {
      id: submission.taskId,
      description: submission.taskDescription,
      type: submission.taskType,
      domain: submission.domain,
      priority: submission.priority,
      inputs: submission.inputs || {},
      context: submission.context || {},
    };

    const result = await orchestrator.executeTask(task, {
      timeout: submission.timeoutMs,
      maxRetries: submission.maxRetries || 3,
    });

    const taskStatus: TaskStatus = {
      taskId: submission.taskId,
      status: result.success ? 'completed' : 'failed',
      assignedAgent: result.agentId,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      progress: result.success ? 1.0 : 0.0,
      result: result.output,
      error: result.error,
    };

    console.log(`AgenticAPI: Task ${submission.taskId} ${taskStatus.status}`);

    return taskStatus;
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const result = await orchestrator.getTaskResult(taskId);

    return {
      taskId,
      status: result.success ? 'completed' : 'failed',
      assignedAgent: result.agentId,
      startTime: result.startTime,
      endTime: result.endTime,
      duration: result.duration,
      progress: result.success ? 1.0 : 0.0,
      result: result.output,
      error: result.error,
    };
  }

  /**
   * Batch submit tasks
   */
  async batchSubmitTasks(submissions: TaskSubmission[]): Promise<TaskStatus[]> {
    const taskStatuses: TaskStatus[] = [];

    for (const submission of submissions) {
      const status = await this.submitTask(submission);
      taskStatuses.push(status);
    }

    return taskStatuses;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    console.log(`AgenticAPI: Cancelling task ${taskId}`);

    const result = await orchestrator.cancelTask(taskId);

    return result;
  }

  /**
   * Get agent statistics
   */
  async getAgentStatistics(): Promise<{
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    offlineAgents: number;
    byDomain: Record<string, number>;
    tasksCompleted: number;
    averageTaskDuration: number;
  }> {
    const agents = agentRegistry.getAllAgents();
    const total = agents.length;
    const available = agents.filter(agent => agent.status === 'idle').length;
    const busy = agents.filter(agent => agent.status === 'busy').length;
    const offline = agents.filter(agent => agent.status === 'offline').length;

    const byDomain: Record<string, number> = {};
    for (const agent of agents) {
      const domain = agent.domain;
      byDomain[domain] = (byDomain[domain] || 0) + 1;
    }

    const taskResults = orchestrator.getTaskResults();
    const completedTasks = taskResults.filter(result => result.success).length;
    const avgDuration = completedTasks > 0
      ? taskResults.reduce((sum, result) => sum + (result.duration || 0), 0) / completedTasks
      : 0;

    return {
      totalAgents: total,
      availableAgents: available,
      busyAgents: busy,
      offlineAgents: offline,
      byDomain,
      tasksCompleted: completedTasks,
      averageTaskDuration: avgDuration,
    };
  }

  /**
   * Get swarm health status
   */
  async getSwarmHealth(): Promise<{
    healthy: boolean;
    activeAgents: number;
    totalCapacity: number;
    currentLoad: number;
    loadPercentage: number;
    recommendedActions: string[];
  }> {
    const agents = agentRegistry.getAllAgents();
    const activeAgents = agents.filter(agent => agent.status === 'idle' || agent.status === 'busy').length;
    const totalCapacity = agents.length;
    const currentLoad = agents.filter(agent => agent.status === 'busy').length;
    const loadPercentage = totalCapacity > 0 ? (currentLoad / totalCapacity) * 100 : 0;

    const healthy = loadPercentage < 80 && activeAgents > 0;

    const recommendedActions: string[] = [];

    if (loadPercentage > 90) {
      recommendedActions.push('Agent swarm near capacity - consider adding more agents');
    }

    if (activeAgents < totalCapacity * 0.5) {
      recommendedActions.push('Low agent utilization - consider reducing agent pool');
    }

    if (!healthy) {
      recommendedActions.push('Agent swarm unhealthy - investigate agent failures');
    }

    return {
      healthy,
      activeAgents,
      totalCapacity,
      currentLoad,
      loadPercentage: Math.round(loadPercentage * 100) / 100,
      recommendedActions,
    };
  }

  /**
   * Register new agent
   */
  async registerAgent(agent: {
    id: string;
    name: string;
    domain: string;
    capabilities: string[];
    priority: number;
  }): Promise<boolean> {
    console.log(`AgenticAPI: Registering agent ${agent.id}`);

    try {
      agentRegistry.registerAgent(agent);
      return true;
    } catch (error) {
      console.error(`AgenticAPI: Failed to register agent ${agent.id}:`, error);
      return false;
    }
  }

  /**
   * Unregister agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    console.log(`AgenticAPI: Unregistering agent ${agentId}`);

    try {
      agentRegistry.unregisterAgent(agentId);
      return true;
    } catch (error) {
      console.error(`AgenticAPI: Failed to unregister agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Get agent capabilities
   */
  async getAgentCapabilities(agentId: string): Promise<AgentCapability | null> {
    const agents = await this.getAvailableAgents();
    const agent = agents.find(a => a.agentId === agentId);

    return agent || null;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): Promise<boolean> {
    try {
      agentRegistry.updateAgentStatus(agentId, status);
      return true;
    } catch (error) {
      console.error(`AgenticAPI: Failed to update agent ${agentId} status:`, error);
      return false;
    }
  }

  /**
   * Get task queue status
   */
  async getTaskQueueStatus(): Promise<{
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageQueueWaitTime: number;
    longestWaitTime: number;
  }> {
    const taskResults = orchestrator.getTaskResults();

    const pending = taskResults.filter(result => !result.completed && !result.failed).length;
    const inProgress = taskResults.filter(result => result.inProgress).length;
    const completed = taskResults.filter(result => result.completed && result.success).length;
    const failed = taskResults.filter(result => result.completed && !result.success).length;

    // Calculate wait times
    const waitTimes: number[] = taskResults
      .filter(result => result.startTime && result.submissionTime)
      .map(result => result.startTime - result.submissionTime);

    const avgWait = waitTimes.length > 0
      ? waitTimes.reduce((sum, wait) => sum + wait, 0) / waitTimes.length
      : 0;

    const longestWait = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0;

    return {
      pendingTasks: pending,
      inProgressTasks: inProgress,
      completedTasks: completed,
      failedTasks: failed,
      averageQueueWaitTime: avgWait,
      longestWaitTime: longestWait,
    };
  }
}

// Singleton instance
export const agenticAPI = AgenticAPI.getInstance();
