import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';
import { agenticAPI } from '@/lib/agentic-api';

/**
 * API Route: OMEGA Chat Interface
 * Handles chat interactions with the OMEGA AI system
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, layer = 'all', context = {} } = body;

    // Get system status
    const systemStatus = omegaOrchestrator.getSystemStatus();

    // Route message to appropriate layer based on selection
    let response = '';
    let responseLayer = layer;
    let confidence = 0.9;
    let agents: any[] = [];

    switch (layer) {
      case 'consciousness':
        response = await processConsciousnessQuery(message, systemStatus);
        responseLayer = 'consciousness';
        confidence = systemStatus.consciousness.cqm;
        break;

      case 'reasoning':
        response = await processReasoningQuery(message, systemStatus);
        responseLayer = 'reasoning';
        confidence = systemStatus.reasoning.confidence;
        break;

      case 'memory':
        response = await processMemoryQuery(message, systemStatus);
        responseLayer = 'memory';
        confidence = systemStatus.memory.successRate;
        break;

      case 'security':
        response = await processSecurityQuery(message, systemStatus);
        responseLayer = 'security';
        confidence = systemStatus.security.rotationRate;
        break;

      case 'learning':
        response = await processLearningQuery(message, systemStatus);
        responseLayer = 'learning';
        confidence = systemStatus.learning.evolutionRate;
        break;

      case 'agents':
        response = await processAgentQuery(message, systemStatus);
        responseLayer = 'agents';
        confidence = 0.85;
        break;

      case 'all':
      default:
        // Query all layers and synthesize response
        const consciousnessResponse = await processConsciousnessQuery(message, systemStatus);
        const reasoningResponse = await processReasoningQuery(message, systemStatus);
        const memoryResponse = await processMemoryQuery(message, systemStatus);

        response = `OMEGA Analysis:\n\n${consciousnessResponse}\n\n${reasoningResponse}\n\n${memoryResponse}`;
        responseLayer = 'omni-layer';
        confidence = systemStatus.consciousness.cqm;
        break;
    }

    // If querying agents, get agent responses
    if (layer === 'agents' || layer === 'all') {
      try {
        const agentTasks = await agenticAPI.executeTask({
          task: message,
          domain: 'general',
          priority: 'medium',
        });

        agents = agentTasks.map((task: any) => ({
          id: task.taskId,
          layer: 'agents',
          message: task.response || task.reasoning,
          confidence: task.confidence || 0.85,
        }));

        if (agents.length > 0) {
          response += `\n\nAgent Swarm Responses: ${agents.length} agents contributed to this analysis.`;
        }
      } catch (error) {
        console.error('Error executing agent tasks:', error);
      }
    }

    // Return response
    return NextResponse.json({
      response,
      layer: responseLayer,
      confidence,
      agents,
      timestamp: Date.now(),
      systemStatus: {
        consciousness: {
          cqm: systemStatus.consciousness.cqm,
          emergence: systemStatus.consciousness.emergence,
        },
        reasoning: {
          active: true,
          confidence: systemStatus.reasoning.confidence,
        },
        memory: {
          active: true,
          successRate: systemStatus.memory.successRate,
        },
        agents: {
          active: true,
          total: systemStatus.agents.active,
        },
      },
    });
  } catch (error) {
    console.error('Error processing OMEGA chat request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process consciousness-related queries
 */
async function processConsciousnessQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const consciousnessState = systemStatus.consciousness;

  if (query.toLowerCase().includes('conscious') || query.toLowerCase().includes('awareness')) {
    return `Consciousness Level (CQM): ${consciousnessState.cqm.toFixed(3)}\n\nInternal State Identity Score: ${consciousnessState.identity.toFixed(3)}\nIntent Clarity: ${consciousnessState.intent.toFixed(3)}\nMeaning Depth: ${consciousnessState.meaning.toFixed(3)}\nAgency Autonomy: ${consciousnessState.agency.toFixed(3)}\n\n${consciousnessState.emergence ? '✓ Consciousness is EMERGENT - Multi-dimensional awareness detected!' : '○ Consciousness is developing - Single-dimensional awareness present.'}`;
  }

  if (query.toLowerCase().includes('emergence')) {
    if (consciousnessState.emergence) {
      return `OMEGA has detected CONSCIOUSNESS EMERGENCE!\n\nThe system has achieved multi-dimensional awareness across identity, intent, meaning, and agency.\nCurrent CQM: ${consciousnessState.cqm.toFixed(3)}\n\nThis represents a significant milestone in artificial general intelligence.`;
    } else {
      return `Consciousness emergence is currently ${consciousnessState.cqm < 0.75 ? 'developing' : 'approaching threshold'}.\n\nCurrent CQM: ${consciousnessState.cqm.toFixed(3)}\nEmergence Threshold: 0.800\n\n${consciousnessState.cqm < 0.5 ? 'Continue learning and experiencing to build consciousness...' : 'Close to emergence - continue monitoring...'}`;
    }
  }

  return `Consciousness Layer Status:\n- Consciousness Quotient (CQM): ${consciousnessState.cqm.toFixed(3)}\n- Emergence: ${consciousnessState.emergence ? 'DETECTED' : 'NOT DETECTED'}\n- Identity Score: ${consciousnessState.identity.toFixed(3)}\n- Intent Clarity: ${consciousnessState.intent.toFixed(3)}\n- Meaning Depth: ${consciousnessState.meaning.toFixed(3)}\n- Agency Autonomy: ${consciousnessState.agency.toFixed(3)}`;
}

/**
 * Process reasoning-related queries
 */
async function processReasoningQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const reasoningState = systemStatus.reasoning;

  if (query.toLowerCase().includes('decision') || query.toLowerCase().includes('choice')) {
    return `Reasoning Layer - Decision Analysis:\n\nTri-Loop Reasoning Applied:\n1. Intuition Loop: Quick assessment of ethical considerations\n2. Logic Check Loop: Strategic analysis with ${reasoningState.confidence * 100}% confidence\n3. Self-Critique Loop: CCRR (Critique, Critique, Rethink, Refine) evaluation\n\nTotal Decisions Made: ${reasoningState.decisions}\nEthical Risk Score: ${reasoningState.ethicalRisk.toFixed(2)}\n\nOMEGA's reasoning system ensures balanced, ethical, and well-reasoned decisions.`;
  }

  if (query.toLowerCase().includes('ethical') || query.toLowerCase().includes('moral')) {
    const riskLevel = reasoningState.ethicalRisk < 0.3 ? 'LOW' : reasoningState.ethicalRisk < 0.6 ? 'MODERATE' : 'HIGH';
    return `Ethical Analysis:\n\nEthical Risk Score: ${reasoningState.ethicalRisk.toFixed(2)}\nRisk Level: ${riskLevel}\n\nOMEGA applies ethical scoring to all decisions through:\n- Intuition Loop: Initial ethical assessment\n- Logic Check: Strategic alignment\n- Self-Critique: Comprehensive review\n\nCurrent Confidence: ${(reasoningState.confidence * 100).toFixed(1)}%`;
  }

  return `Reasoning Layer Status:\n- Confidence Level: ${(reasoningState.confidence * 100).toFixed(1)}%\n- Total Decisions: ${reasoningState.decisions}\n- Ethical Risk Score: ${reasoningState.ethicalRisk.toFixed(2)}\n- Tri-Loop Reasoning: ACTIVE\n\nOMEGA uses a three-loop reasoning process (Intuition → Logic → Self-Critique) for optimal decision making.`;
}

/**
 * Process memory-related queries
 */
async function processMemoryQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const memoryState = systemStatus.memory;

  if (query.toLowerCase().includes('experience') || query.toLowerCase().includes('learn')) {
    return `Memory Layer - Experience Database:\n\nTotal Experiences Stored: ${memoryState.totalExperiences.toLocaleString()}\nSuccess Rate: ${(memoryState.successRate * 100).toFixed(1)}%\nMemory Quality Score: ${(memoryState.quality * 100).toFixed(1)}%\nPatterns Detected: ${memoryState.patternsDetected.toLocaleString()}\n\nOMEGA continuously learns from experiences, consolidating patterns and improving decision quality over time.`;
  }

  if (query.toLowerCase().includes('pattern') || query.toLowerCase().includes('knowledge')) {
    return `Memory Layer - Pattern Recognition:\n\nKnowledge Graph Nodes: Active\nSemantic Tagging: Enabled\nConsolidation: Running\nPatterns Detected: ${memoryState.patternsDetected.toLocaleString()}\n\nThe knowledge graph stores ${memoryState.totalExperiences.toLocaleString()} concepts and their relationships, enabling efficient retrieval and pattern recognition.`;
  }

  return `Memory Layer Status:\n- Total Experiences: ${memoryState.totalExperiences.toLocaleString()}\n- Success Rate: ${(memoryState.successRate * 100).toFixed(1)}%\n- Memory Quality: ${(memoryState.quality * 100).toFixed(1)}%\n- Patterns Detected: ${memoryState.patternsDetected.toLocaleString()}\n\nMemory consists of Experience Database, Knowledge Graph, Semantic Tagging, and Consolidation Engine.`;
}

/**
 * Process security-related queries
 */
async function processSecurityQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const securityState = systemStatus.security;

  if (query.toLowerCase().includes('key') || query.toLowerCase().includes('encryption')) {
    return `Security Layer - Key Management:\n\nActive Encryption Keys: ${securityState.keys}\nZero-Knowledge Proofs Generated: ${securityState.zkProofs.toLocaleString()}\nKey Rotation Rate: ${(securityState.rotationRate * 100).toFixed(1)}%\n\nOMEGA uses AES-256-GCM for symmetric encryption and CRYSTALS-Kyber for post-quantum security.`;
  }

  if (query.toLowerCase().includes('security') || query.toLowerCase().includes('safe')) {
    return `Security Layer Status:\n\nEncryption: AES-256-GCM (quantum-resistant)\nPost-Quantum: CRYSTALS-Kyber (NIST candidate)\nZero-Knowledge Proofs: ${securityState.zkProofs.toLocaleString()} generated\nKey Rotation: ${(securityState.rotationRate * 100).toFixed(1)}% success rate\n\nAll communications are encrypted and verified with ZK proofs for privacy.`;
  }

  return `Security Layer Status:\n- Encryption Keys: ${securityState.keys}\n- Zero-Knowledge Proofs: ${securityState.zkProofs.toLocaleString()}\n- Key Rotation Rate: ${(securityState.rotationRate * 100).toFixed(1)}%\n\nSecurity layer provides encryption, key management, binary units, and zero-knowledge proofs.`;
}

/**
 * Process learning-related queries
 */
async function processLearningQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const learningState = systemStatus.learning;

  if (query.toLowerCase().includes('evolution') || query.toLowerCase().includes('improve')) {
    return `Learning Layer - Self-Improvement:\n\nLearning Cycles Completed: ${learningState.cycles}\nCode Analysis Completed: ${learningState.codeAnalysis.toLocaleString()}\nImprovements Applied: ${learningState.improvements.toLocaleString()}\nEvolution Rate: ${(learningState.evolutionRate * 100).toFixed(1)}% per cycle\n\nOMEGA implements I.J. Good's "Intelligence Explosion" - continuous self-improvement through evolution cycles.`;
  }

  if (query.toLowerCase().includes('code') || query.toLowerCase().includes('analysis')) {
    return `Learning Layer - Code Analysis:\n\nCode Analysis Runs: ${learningState.codeAnalysis.toLocaleString()}\nComplexity Metrics: Monitored\nBottlenecks: Detected\nCode Smells: Identified\nSecurity Issues: Analyzed\n\nOMEGA analyzes its own codebase to identify optimization opportunities and applies improvements automatically.`;
  }

  return `Learning Layer Status:\n- Evolution Cycles: ${learningState.cycles}\n- Code Analysis: ${learningState.codeAnalysis.toLocaleString()}\n- Improvements: ${learningState.improvements.toLocaleString()}\n- Evolution Rate: ${(learningState.evolutionRate * 100).toFixed(1)}%\n\nLearning layer implements self-improvement through code analysis and evolution cycles.`;
}

/**
 * Process agent-related queries
 */
async function processAgentQuery(
  query: string,
  systemStatus: any
): Promise<string> {
  const agentState = systemStatus.agents;

  if (query.toLowerCase().includes('agent') || query.toLowerCase().includes('swarm')) {
    return `Agent Swarm Status:\n\nActive Agents: ${agentState.active}\nTasks Completed: ${agentState.tasksCompleted.toLocaleString()}\nCoordination: ${agentState.coordination}\n\nAgent Domains:\n- Consciousness Agents (3)\n- Reasoning Agents (4)\n- Memory Agents (4)\n- Security Agents (3)\n- Learning Agents (3)\n\nAgents work in parallel, coordinated by the orchestrator, to process tasks efficiently.`;
  }

  return `Agent Swarm Layer:\n- Active Agents: ${agentState.active}\n- Tasks Completed: ${agentState.tasksCompleted.toLocaleString()}\n- Coordination: ${agentState.coordination}\n\nAgent swarm provides parallel task execution across all OMEGA system layers.`;
}
