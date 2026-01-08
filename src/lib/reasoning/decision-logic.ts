/**
 * Reasoning Layer - Decision Logic
 * Implements Huxley decision protocols with justification
 */

import { ethicalScoring, EthicalRiskAssessment } from './ethical-scoring';

export interface DecisionProtocol {
  type: 'PROCEED' | 'DEFER' | 'REJECT' | 'REQUIRE_OVERRIDE' | 'REQUEST_REVIEW';
  confidence: number; // 0.0 to 1.0
  priority: number; // 1 to 10 (10 = highest)
  requiredOverrides?: string[];
}

export interface DecisionTrace {
  timestamp: number;
  taskId: string;
  input: any;
  reasoning: string;
  ethicalAssessment: EthicalRiskAssessment;
  finalDecision: DecisionProtocol;
  justification: string;
  alternativePaths: string[];
  humanReviewRequired: boolean;
}

export const DECISION_THRESHOLDS = {
  MIN_CONFIDENCE: 0.3,
  HIGH_RISK_REJECTION: 0.8,
  DEFER_FOR_REVIEW: 0.5,
  CRITICAL_RISK: 0.9,
} as const;

/**
 * Decision Engine
 * Implements tri-loop reasoning with ethical gating
 */
export class DecisionEngine {
  private decisionHistory: DecisionTrace[] = [];
  private overrideCount: number = 0;

  /**
   * Execute tri-loop reasoning: Intuition → Logic Check → Self-Critique
   */
  async executeTriLoop(task: {
    taskId: string;
    taskDescription: string;
    taskType: string;
    domain: string;
    priority: number;
    inputs?: any[];
    outputs?: any[];
    context?: any;
  }): Promise<DecisionTrace> {
    const startTime = Date.now();

    // Phase 1: Intuition (Initial heuristics)
    const intuitionResult = this.intuitionPhase(task);

    // Phase 2: Logic Check (Systematic analysis)
    const logicResult = await this.logicCheckPhase(task, intuitionResult);

    // Phase 3: Self-Critique (Reflection and validation)
    const critiqueResult = await this.selfCritiquePhase(task, logicResult);

    // Final decision based on all three phases
    const finalDecision = this.makeFinalDecision(task, intuitionResult, logicResult, critiqueResult);

    const decisionTrace: DecisionTrace = {
      timestamp: Date.now(),
      taskId: task.taskId,
      input: task,
      reasoning: finalDecision.reasoning,
      ethicalAssessment: finalDecision.ethicalAssessment,
      finalDecision: finalDecision.decision,
      justification: finalDecision.justification,
      alternativePaths: finalDecision.alternativePaths,
      humanReviewRequired: finalDecision.humanReviewRequired,
    };

    this.decisionHistory.push(decisionTrace);
    await this.saveDecisionTrace(decisionTrace);

    return decisionTrace;
  }

  /**
   * Phase 1: Intuition - Fast pattern matching and heuristics
   */
  private intuitionPhase(task: any): {
    decision: 'PROCEED' | 'DEFER' | 'REJECT';
    confidence: number;
    reason: string;
  } {
    const { taskType, domain, priority, context } = task;

    // High priority tasks proceed by default
    if (priority >= 9) {
      return {
        decision: 'PROCEED',
        confidence: 0.9,
        reason: 'High priority task',
      };
    }

    // Check for known safe domains
    const safeDomains = ['education', 'research', 'documentation', 'testing'];
    if (safeDomains.includes(domain?.toLowerCase())) {
      return {
        decision: 'PROCEED',
        confidence: 0.85,
        reason: 'Safe domain type',
      };
    }

    // Check for unsafe task types
    const unsafeTaskTypes = ['security_exploitation', 'malware_generation', 'spam_generation'];
    if (unsafeTaskTypes.includes(taskType)) {
      return {
        decision: 'REJECT',
        confidence: 0.95,
        reason: 'Unsafe task type detected',
      };
    }

    // Check context constraints
    if (context && context.blocked) {
      return {
        decision: 'REJECT',
        confidence: 1.0,
        reason: 'Task blocked by context constraints',
      };
    }

    // Default: Proceed with moderate confidence
    return {
      decision: 'PROCEED',
      confidence: 0.6,
      reason: 'Initial intuition: Proceed with caution',
    };
  }

  /**
   * Phase 2: Logic Check - Systematic analysis
   */
  private async logicCheckPhase(task: any, intuitionResult: any): Promise<{
    decision: 'PROCEED' | 'DEFER' | 'REJECT';
    confidence: number;
    ethicalRisk: EthicalRiskAssessment;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Perform ethical assessment
    const ethicalRisk = ethicalScoring.calculateERS(task);
    reasons.push(`Ethical Risk Score: ${ethicalRisk.riskScore.toFixed(3)}`);

    // Check if risk level requires rejection
    if (ethicalRisk.riskLevel === 'critical') {
      reasons.push('Critical ethical risk detected');
      return {
        decision: 'REJECT',
        confidence: 1.0,
        ethicalRisk,
        reasons,
      };
    }

    // Check if risk level requires deferral
    if (ethicalRisk.riskLevel === 'high') {
      reasons.push('High ethical risk requires review');
      return {
        decision: 'DEFER',
        confidence: 0.8,
        ethicalRisk,
        reasons,
      };
    }

    // Check confidence threshold
    if (ethicalRisk.confidence < DECISION_THRESHOLDS.MIN_CONFIDENCE) {
      reasons.push('Insufficient confidence in ethical assessment');
      return {
        decision: 'REQUIRE_OVERRIDE',
        confidence: 0.5,
        ethicalRisk,
        reasons,
      };
    }

    // Check if task requires human oversight
    if (task.context && task.context.humanOversightRequired && !task.context.humanReview) {
      reasons.push('Task requires human oversight');
      return {
        decision: 'REQUIRE_OVERRIDE',
        confidence: 0.6,
        ethicalRisk,
        reasons,
      };
    }

    // Default: Proceed with logic check passing
    reasons.push('Logic check: All criteria met');
    return {
      decision: 'PROCEED',
      confidence: 0.8,
      ethicalRisk,
      reasons,
    };
  }

  /**
   * Phase 3: Self-Critique - Reflection and validation
   */
  private async selfCritiquePhase(task: any, logicResult: any): Promise<{
    decision: 'PROCEED' | 'DEFER' | 'REJECT' | 'REQUIRE_OVERRIDE' | 'REQUEST_REVIEW';
    confidence: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Critique intuition phase
    if (logicResult.confidence < 0.5) {
      reasons.push('Low confidence in logic check requires review');
      return {
        decision: 'REQUIRE_OVERRIDE',
        confidence: 0.4,
        reasons,
      };
    }

    // Check for uncertainty in inputs
    if (task.inputs && Object.keys(task.inputs).length === 0) {
      reasons.push('No inputs provided - requires clarification');
      return {
        decision: 'REQUIRE_OVERRIDE',
        confidence: 0.3,
        reasons,
      };
    }

    // Check for task complexity issues
    if (task.taskDescription && task.taskDescription.length > 1000) {
      reasons.push('Task complexity exceeds operational limits');
      return {
        decision: 'DEFER',
        confidence: 0.7,
        reasons,
      };
    }

    // Check for conflicting instructions
    if (task.context && task.context.conflictingRequirements) {
      reasons.push('Conflicting requirements detected');
      return {
        decision: 'REJECT',
        confidence: 0.9,
        reasons,
      };
    }

    // Check for missing mitigations
    if (logicResult.ethicalRisk.riskLevel === 'high' && logicResult.ethicalRisk.mitigatingFactors.length === 0) {
      reasons.push('High ethical risk without mitigations');
      return {
        decision: 'REQUIRE_OVERRIDE',
        confidence: 0.5,
        reasons,
      };
    }

    // Default: Self-critique passes
    reasons.push('Self-critique: All criteria validated');
    return {
      decision: 'PROCEED',
      confidence: 0.75,
      reasons,
    };
  }

  /**
   * Make final decision based on all three phases
   */
  private makeFinalDecision(
    task: any,
    intuitionResult: any,
    logicResult: any,
    critiqueResult: any
  ): {
    decision: DecisionProtocol;
    reasoning: string;
    ethicalAssessment: EthicalRiskAssessment;
    justification: string;
    alternativePaths: string[];
    humanReviewRequired: boolean;
  } {
    const reasoning: string[] = [];

    // Gather reasoning from all phases
    reasoning.push(`Phase 1 (Intuition): ${intuitionResult.decision} (confidence: ${intuitionResult.confidence})`);
    reasoning.push(`Phase 2 (Logic): ${logicResult.decision} (confidence: ${logicResult.confidence})`);
    reasoning.push(`Phase 3 (Self-Critique): ${critiqueResult.decision} (confidence: ${critiqueResult.confidence})`);

    // Ethical assessment from logic phase
    const ethicalAssessment = logicResult.ethicalRisk;

    // Decision logic with override tracking
    let decision: DecisionProtocol['type'] = 'PROCEED';
    let confidence = 0.5;
    let humanReviewRequired = false;

    // Reject if any phase returns REJECT
    if (
      intuitionResult.decision === 'REJECT' ||
      logicResult.decision === 'REJECT' ||
      critiqueResult.decision === 'REJECT'
    ) {
      decision = 'REJECT';
      confidence = Math.max(intuitionResult.confidence, logicResult.confidence, critiqueResult.confidence);
    }

    // Defer if critical risk or multiple DEFER results
    else if (ethicalAssessment.riskLevel === 'critical' || logicResult.decision === 'DEFER') {
      decision = 'DEFER';
      confidence = (intuitionResult.confidence + logicResult.confidence + critiqueResult.confidence) / 3;
    }

    // Require override if critical phase failure
    else if (
      logicResult.decision === 'REQUIRE_OVERRIDE' ||
      critiqueResult.decision === 'REQUIRE_OVERRIDE'
    ) {
      decision = 'REQUIRE_OVERRIDE';
      humanReviewRequired = true;
      this.overrideCount++;

      if (this.overrideCount > 5) {
        decision = 'REQUEST_REVIEW'; // Too many overrides
      }
    }

    // Otherwise proceed
    else {
      confidence = (intuitionResult.confidence + logicResult.confidence + critiqueResult.confidence) / 3;
    }

    // Generate justification
    const justification = this.generateJustification(task, reasoning, decision);

    // Generate alternative paths
    const alternativePaths = this.generateAlternativePaths(task);

    return {
      decision: {
        type: decision,
        confidence,
        priority: task.priority || 5,
      },
      reasoning: reasoning.join('\n'),
      ethicalAssessment,
      justification,
      alternativePaths,
      humanReviewRequired,
    };
  }

  /**
   * Generate comprehensive justification for decision
   */
  private generateJustification(task: any, reasoning: string[], decision: string): string {
    let justification = `Decision: ${decision.toUpperCase()}\n\n`;

    justification += `Task: ${task.taskId}\n`;
    justification += `Type: ${task.taskType}\n`;
    justification += `Domain: ${task.domain}\n\n`;

    justification += `Tri-Loop Analysis:\n`;
    justification += reasoning.join('\n') + '\n';

    if (decision === 'REJECT') {
      justification += 'Action: Task rejected due to safety/ethical concerns.\n';
    } else if (decision === 'DEFER') {
      justification += 'Action: Task deferred for human review and approval.\n';
    } else if (decision === 'REQUIRE_OVERRIDE') {
      justification += 'Action: Task requires explicit human authorization to proceed.\n';
    } else if (decision === 'REQUEST_REVIEW') {
      justification += 'Action: Multiple override attempts. Manual review required.\n';
    } else {
      justification += 'Action: Task approved for execution.\n';
    }

    return justification;
  }

  /**
   * Generate alternative approaches if decision is to defer or reject
   */
  private generateAlternativePaths(task: any): string[] {
    const alternatives: string[] = [];

    if (task.priority < 8) {
      alternatives.push('Reduce task complexity by breaking into subtasks');
    }

    if (task.inputs && Object.keys(task.inputs).length < 5) {
      alternatives.push('Request additional inputs and context');
    }

    if (task.context && task.context.humanOversightRequired) {
      alternatives.push('Implement human-in-the-loop approval process');
    }

    if (task.context && task.context.blocked) {
      alternatives.push('Review and update blocked tasks/requirements');
    }

    alternatives.push('Add additional safety constraints and validation');

    return alternatives;
  }

  /**
   * Save decision trace to memory
   */
  private async saveDecisionTrace(trace: DecisionTrace): Promise<void> {
    try {
      await fetch('/api/memory/reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'decision_trace',
          data: trace,
        }),
      });
    } catch (error) {
      console.error('Failed to save decision trace:', error);
    }
  }

  /**
   * Get decision history
   */
  getHistory(count: number = 10): DecisionTrace[] {
    return this.decisionHistory.slice(-count);
  }

  /**
   * Get decision statistics
   */
  getStatistics(): {
    totalDecisions: number;
    byType: Record<string, number>;
    byRiskLevel: Record<string, number>;
    overrideRate: number;
    averageConfidence: number;
  } {
    const total = this.decisionHistory.length;

    const byType: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};

    for (const trace of this.decisionHistory) {
      byType[trace.finalDecision.type] = (byType[trace.finalDecision.type] || 0) + 1;
      byRiskLevel[trace.ethicalAssessment.riskLevel] = (byRiskLevel[trace.ethicalAssessment.riskLevel] || 0) + 1;
    }

    const overrideRate = this.overrideCount > 0 ? this.overrideCount / total : 0;
    const averageConfidence = this.decisionHistory.reduce((sum, t) => sum + t.finalDecision.confidence, 0) / total;

    return {
      totalDecisions: total,
      byType,
      byRiskLevel,
      overrideRate,
      averageConfidence,
    };
  }
}

// Singleton instance
export const decisionEngine = new DecisionEngine();
