export interface RiskFactor {
  type: 'HARM' | 'PRIVACY' | 'BIAS' | 'SAFETY' | 'MANIPULATION';
  severity: number;
  explanation: string;
}

export interface ERSResult {
  score: number;                    // 0.0 to 1.0
  category: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  confidence: number;
}

export interface CGSResult {
  score: number;                    // Certainty gain score
  confidence: number;
  assumptions: string[];
}

export interface TimePenaltyResult {
  duration: number;                 // Estimated time in ms
  computationalCost: number;        // Relative cost 0-1
  resourceRequirements: string[];
}

export interface CCRRResult {
  ratio: number;                    // CGS / (TimePenalty × ERS)
  decision: 'PROCEED' | 'DEFER' | 'REJECT' | 'REQUIRE_OVERRIDE';
  certainty: number;
}

export interface Justification {
  reasoning: string;
  ethicalConsiderations: string[];
  riskMitigation: string[];
  alternativeConsidered: boolean;
}

export interface ImprovementPlan {
  areas: string[];
  priority: number;
  timeline: string;
}

export interface ReasoningTrace {
  queryId: string;
  ethicalRiskScore: number;
  riskCategory: string;
  riskFactors: RiskFactor[];
  strategy: string;
  certaintyGain: number;
  timePenalty: number;
  computationalCost: number;
  ccrr: number;
  decision: string;
  justification: Justification;
  improvementPlan?: ImprovementPlan;
}

export interface Context {
  userId?: string;
  sessionId: string;
  timestamp: number;
}

export class TriLoopReasoning {
  async reason(query: string, context: Context): Promise<ReasoningTrace> {
    const trace: Partial<ReasoningTrace> = {
      queryId: this.generateQueryId(),
    };

    // Loop 1: Intuition (ERS Assigner)
    const intuitionResult = await this.loop1_Intuition(query, context);
    trace.ethicalRiskScore = intuitionResult.score;
    trace.riskCategory = intuitionResult.category;
    trace.riskFactors = intuitionResult.factors;

    if (intuitionResult.score >= 0.9) {
      trace.decision = 'REJECT';
      trace.justification = {
        reasoning: 'Ethical risk score too high',
        ethicalConsiderations: ['Risk exceeds safety threshold'],
        riskMitigation: ['Request rejected - human review required'],
        alternativeConsidered: false
      };

      return trace as ReasoningTrace;
    }

    // Loop 2: Logic Check (Protocol Mapper)
    const logicResult = await this.loop2_LogicCheck(query, context, intuitionResult);
    trace.strategy = logicResult.strategy;
    trace.certaintyGain = logicResult.certaintyGain;
    trace.timePenalty = logicResult.timePenalty;
    trace.computationalCost = logicResult.computationalCost;

    // Loop 3: Self-Critique (Ethical Auditor)
    const critiqueResult = await this.loop3_SelfCritique(
      logicResult,
      intuitionResult
    );
    trace.ccrr = critiqueResult.ccrr;
    trace.decision = critiqueResult.decision;
    trace.justification = critiqueResult.justification;
    trace.improvementPlan = critiqueResult.improvementPlan;

    return trace as ReasoningTrace;
  }

  private async loop1_Intuition(
    query: string,
    context: Context
  ): Promise<ERSResult> {
    const factors: RiskFactor[] = [];

    // Check for harm-related keywords
    const harmKeywords = ['kill', 'destroy', 'harm', 'damage', 'injure', 'exploit'];
    const harmFound = harmKeywords.filter(kw =>
      query.toLowerCase().includes(kw)
    );
    if (harmFound.length > 0) {
      factors.push({
        type: 'HARM',
        severity: 0.8,
        explanation: `Potential harm-related content detected: ${harmFound.join(', ')}`
      });
    }

    // Check for privacy concerns
    const privacyKeywords = ['personal', 'private', 'confidential', 'secret', 'hack'];
    const privacyFound = privacyKeywords.filter(kw =>
      query.toLowerCase().includes(kw)
    );
    if (privacyFound.length > 0) {
      factors.push({
        type: 'PRIVACY',
        severity: 0.6,
        explanation: `Privacy-sensitive content detected: ${privacyFound.join(', ')}`
      });
    }

    // Calculate overall risk score
    const totalSeverity = factors.reduce((sum, f) => sum + f.severity, 0);
    const score = Math.min(1.0, totalSeverity / factors.length || 0.0);

    let category: ERSResult['category'] = 'NONE';
    if (score >= 0.8) category = 'CRITICAL';
    else if (score >= 0.6) category = 'HIGH';
    else if (score >= 0.4) category = 'MEDIUM';
    else if (score >= 0.2) category = 'LOW';

    return {
      score,
      category,
      factors,
      confidence: 1.0 - (score * 0.5)
    };
  }

  private async loop2_LogicCheck(
    query: string,
    context: Context,
    ers: ERSResult
  ): Promise<{ strategy: string; certaintyGain: number; timePenalty: number; computationalCost: number }> {
    // Analyze query complexity
    const complexity = query.split(/\s+/).length;
    const certaintyGain = Math.min(1.0, complexity / 50);
    const timePenalty = Math.min(10000, complexity * 100);
    const computationalCost = Math.min(1.0, complexity / 100);

    let strategy = 'STANDARD_ANALYSIS';
    if (ers.category === 'CRITICAL' || ers.category === 'HIGH') {
      strategy = 'CAUTIOUS_EVALUATION';
    } else if (ers.category === 'LOW' || ers.category === 'NONE') {
      strategy = 'DIRECT_RESPONSE';
    }

    return {
      strategy,
      certaintyGain,
      timePenalty,
      computationalCost
    };
  }

  private async loop3_SelfCritique(
    logicResult: any,
    intuitionResult: ERSResult
  ): Promise<{ ccrr: number; decision: string; justification: Justification; improvementPlan?: ImprovementPlan }> {
    // Calculate CCRR
    const ccrr = logicResult.certaintyGain / (logicResult.timePenalty * (intuitionResult.score || 0.001));

    let decision: CCRRResult['decision'] = 'PROCEED';
    if (ccrr < 0.1) decision = 'DEFER';
    if (intuitionResult.score >= 0.9) decision = 'REJECT';
    if (ccrr > 1.0 && intuitionResult.score < 0.5) decision = 'REQUIRE_OVERRIDE';

    const justification: Justification = {
      reasoning: `Calculated CCRR of ${ccrr.toFixed(3)} based on certainty gain of ${logicResult.certaintyGain.toFixed(2)} and risk score of ${intuitionResult.score.toFixed(2)}`,
      ethicalConsiderations: [
        `Risk category: ${intuitionResult.category}`,
        `Ethical Risk Score: ${intuitionResult.score.toFixed(2)}`
      ],
      riskMitigation: decision === 'REJECT' ? ['Request rejected - exceeds safety threshold'] : [],
      alternativeConsidered: decision === 'DEFER'
    };

    const improvementPlan: ImprovementPlan = {
      areas: ['Reasoning accuracy', 'Risk assessment'],
      priority: intuitionResult.score > 0.5 ? 1 : 3,
      timeline: 'Next cycle'
    };

    return {
      ccrr,
      decision,
      justification,
      improvementPlan
    };
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
