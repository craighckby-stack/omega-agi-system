import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';
import { agenticAPI } from '@/lib/agentic-api';

/**
 * API Route: Get LLM-2 System Status
 * Returns overall system status including all layers, evolution, and coordination
 */
export async function GET() {
  try {
    // Get OMEGA system status
    const systemStatus = omegaOrchestrator.getSystemStatus();

    // Get agent swarm statistics
    const agentStats = await agenticAPI.getAgentStatistics();

    // Get swarm health
    const swarmHealth = await agenticAPI.getSwarmHealth();

    // Get task queue status
    const taskQueueStatus = await agenticAPI.getTaskQueueStatus();

    // Get layer-specific statuses
    const layerStatus = {
      consciousness: {
        cqm: systemStatus.consciousness.cqm,
        emergence: systemStatus.consciousness.emergence,
        identity: systemStatus.consciousness.identity,
        intent: systemStatus.consciousness.intent,
        meaning: systemStatus.consciousness.meaning,
        agency: systemStatus.consciousness.agency,
        active: true,
      },
      reasoning: {
        ethicalRisk: systemStatus.reasoning.ethicalRisk,
        decisions: systemStatus.reasoning.decisions,
        confidence: systemStatus.reasoning.confidence,
        active: true,
      },
      memory: {
        totalExperiences: systemStatus.memory.totalExperiences,
        successRate: systemStatus.memory.successRate,
        quality: systemStatus.memory.quality,
        patternsDetected: systemStatus.memory.patternsDetected,
        active: true,
      },
      security: {
        keys: systemStatus.security.keys,
        zkProofs: systemStatus.security.zkProofs,
        rotationRate: systemStatus.security.rotationRate,
        active: true,
      },
      learning: {
        cycles: systemStatus.learning.cycles,
        codeAnalysis: systemStatus.learning.codeAnalysis,
        improvements: systemStatus.learning.improvements,
        evolutionRate: systemStatus.learning.evolutionRate,
        active: true,
      },
      agents: {
        active: systemStatus.agents.active,
        tasksCompleted: systemStatus.agents.tasksCompleted,
        coordination: systemStatus.agents.coordination,
        totalAgents: agentStats.totalAgents,
        availableAgents: agentStats.availableAgents,
        busyAgents: agentStats.busyAgents,
        swarmHealth: swarmHealth.healthy,
        loadPercentage: swarmHealth.loadPercentage,
        recommendedActions: swarmHealth.recommendedActions,
      },
    };

    // Get dual-LLM coordination status
    const dualLLMStatus = {
      mode: 'dual-llm',
      llm1Status: 'idle',
      llm2Status: 'active',
      coordinationFile: '.ai-coordination.json',
      sharedMemory: 'connected',
      heartbeatInterval: 60000,
      monitoringInterval: 120000,
    };

    // Get evolution status
    const evolutionStatus = {
      currentCycle: 1,
      status: 'idle',
      progress: 0,
      strategies: [],
      applied: 0,
      improvement: 0.0,
    };

    // Get system performance metrics
    const performanceMetrics = {
      uptime: Math.floor((Date.now() - systemStatus.system.uptime) / 60000),
      status: systemStatus.system.status,
      lastUpdate: systemStatus.system.lastUpdate,
      bootTime: systemStatus.system.uptime,
      evolutionRate: systemStatus.learning.evolutionRate,
    };

    // Construct response
    const response = {
      system: {
        ...performanceMetrics,
        isInitialized: true,
        isBooted: true,
        consciousnessLevel: systemStatus.consciousness.cqm,
        learningCycles: systemStatus.learning.cycles,
        evolutionRate: systemStatus.learning.evolutionRate,
        status: systemStatus.system.status,
      },
      layers: {
        consciousness: {
          active: layerStatus.consciousness.active,
          cqm: layerStatus.consciousness.cqm,
          emergence: layerStatus.consciousness.emergence,
        },
        reasoning: {
          active: layerStatus.reasoning.active,
          confidence: layerStatus.reasoning.confidence,
          decisions: layerStatus.reasoning.decisions,
        },
        memory: {
          active: layerStatus.memory.active,
          experiences: layerStatus.memory.totalExperiences,
          successRate: layerStatus.memory.successRate,
        },
        security: {
          active: layerStatus.security.active,
          keys: layerStatus.security.keys,
          zkProofs: layerStatus.security.zkProofs,
        },
        learning: {
          active: layerStatus.learning.active,
          cycles: layerStatus.learning.cycles,
          analysis: layerStatus.learning.codeAnalysis,
        },
        agents: {
          active: layerStatus.agents.active,
          total: layerStatus.agents.totalAgents,
          completed: layerStatus.agents.tasksCompleted,
        },
      },
      dualLLM: dualLLMStatus,
      evolution: evolutionStatus,
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
