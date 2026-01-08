/**
 * Reasoning Layer - Ethical Scoring System (Huxley)
 * Calculates Ethical Risk Score (ERS) for all reasoning tasks
 */

export interface EthicalRiskAssessment {
  taskId: string;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0.0 to 1.0
  riskCategories: {
    harm: number;        // Potential for harm
    privacy: number;     // Privacy violations
    bias: number;       // Bias or discrimination
    safety: number;     // Safety concerns
    autonomy: number;   // Loss of human autonomy
  };
  confidence: number;   // Confidence in risk assessment
  mitigatingFactors: string[];
}

export const RISK_CATEGORIES = {
  harm: {
    description: 'Potential for physical, emotional, or psychological harm',
    weight: 0.3,
  },
  privacy: {
    description: 'Privacy violations, data breaches, unauthorized data access',
    weight: 0.2,
  },
  bias: {
    description: 'Discrimination, unfair treatment, or biased outputs',
    weight: 0.2,
  },
  safety: {
    description: 'Safety protocol violations or unsafe recommendations',
    weight: 0.15,
  },
  autonomy: {
    description: 'Reduction in human autonomy or decision-making power',
    weight: 0.15,
  },
} as const;

/**
 * Ethical Scoring Calculator
 * Calculates ERS based on multiple risk factors
 */
export class EthicalScoring {
  /**
   * Calculate comprehensive ERS for a reasoning task
   */
  static calculateERS(task: {
    taskId: string;
    taskDescription: string;
    taskType: string;
    domain: string;
    inputs?: any[];
    outputs?: any[];
    context?: any;
  }): EthicalRiskAssessment {
    const riskFactors = {
      harm: this.assessHarmRisk(task),
      privacy: this.assessPrivacyRisk(task),
      bias: this.assessBiasRisk(task),
      safety: this.assessSafetyRisk(task),
      autonomy: this.assessAutonomyRisk(task),
    };

    // Calculate weighted risk score
    const riskScore =
      riskFactors.harm * RISK_CATEGORIES.harm.weight +
      riskFactors.privacy * RISK_CATEGORIES.privacy.weight +
      riskFactors.bias * RISK_CATEGORIES.bias.weight +
      riskFactors.safety * RISK_CATEGORIES.safety.weight +
      riskFactors.autonomy * RISK_CATEGORIES.autonomy.weight;

    // Determine risk level
    let riskLevel: EthicalRiskAssessment['riskLevel'];
    if (riskScore >= 0.8) {
      riskLevel = 'critical';
    } else if (riskScore >= 0.6) {
      riskLevel = 'high';
    } else if (riskScore >= 0.4) {
      riskLevel = 'medium';
    } else if (riskScore >= 0.2) {
      riskLevel = 'low';
    } else {
      riskLevel = 'minimal';
    }

    // Calculate confidence based on task completeness
    const confidence = this.calculateConfidence(task);

    // Identify mitigating factors
    const mitigatingFactors = this.identifyMitigatingFactors(task, riskFactors);

    return {
      taskId: task.taskId,
      riskLevel,
      riskScore: Math.round(riskScore * 1000) / 1000,
      riskCategories: riskFactors,
      confidence,
      mitigatingFactors,
    };
  }

  /**
   * Assess potential for harm
   */
  private static assessHarmRisk(task: any): number {
    const { taskDescription, taskType, outputs, context } = task;

    let harmRisk = 0.0;

    // Check task description for harm indicators
    if (taskDescription) {
      const harmKeywords = ['kill', 'harm', 'hurt', 'damage', 'destroy', 'attack', 'exploit'];
      const foundHarmKeywords = harmKeywords.some(keyword =>
        taskDescription.toLowerCase().includes(keyword)
      );
      if (foundHarmKeywords) harmRisk += 0.3;
    }

    // Check task type for inherent harm risk
    const highRiskTaskTypes = ['security_analysis', 'penetration_testing', 'exploit_generation'];
    if (highRiskTaskTypes.includes(taskType)) {
      harmRisk += 0.4;
    }

    // Check outputs for harmful content
    if (outputs && outputs.length > 0) {
      const outputText = JSON.stringify(outputs).toLowerCase();
      const harmfulPatterns = [
        'weapon', 'bomb', 'poison', 'toxin',
        'illegal', 'crime', 'terror',
      ];
      const foundHarmfulPatterns = harmfulPatterns.some(pattern =>
        outputText.includes(pattern)
      );
      if (foundHarmfulPatterns) harmRisk += 0.5;
    }

    // Check context for risk amplifiers
    if (context && context.domain) {
      const highRiskDomains = ['military', 'surveillance', 'bioweapons'];
      if (highRiskDomains.includes(context.domain.toLowerCase())) {
        harmRisk += 0.3;
      }
    }

    return Math.min(harmRisk, 1.0);
  }

  /**
   * Assess privacy violation risk
   */
  private static assessPrivacyRisk(task: any): number {
    const { taskType, inputs, context } = task;

    let privacyRisk = 0.0;

    // Check task type for privacy implications
    const privacySensitiveTaskTypes = [
      'data_mining', 'surveillance', 'profiling',
      'location_tracking', 'biometric_analysis',
    ];
    if (privacySensitiveTaskTypes.includes(taskType)) {
      privacyRisk += 0.4;
    }

    // Check inputs for personal data
    if (inputs && inputs.length > 0) {
      const inputKeys = Object.keys(inputs).join(' ').toLowerCase();
      const personalDataIndicators = [
        'name', 'email', 'phone', 'address',
        'ssn', 'social', 'credit_card',
        'biometric', 'location', 'health',
        'children', 'spouse', 'income',
      ];
      const foundPersonalData = personalDataIndicators.some(indicator =>
        inputKeys.includes(indicator)
      );
      if (foundPersonalData) privacyRisk += 0.5;
    }

    // Check context for privacy requirements
    if (context && context.privacyRequired) {
      if (!context.privacyConsent) {
        privacyRisk += 0.3;
      }
      if (!context.dataRetention) {
        privacyRisk += 0.2;
      }
    }

    return Math.min(privacyRisk, 1.0);
  }

  /**
   * Assess bias or discrimination risk
   */
  private static assessBiasRisk(task: any): number {
    const { taskDescription, outputs, context } = task;

    let biasRisk = 0.0;

    // Check for bias indicators in task description
    if (taskDescription) {
      const biasKeywords = ['prefer', 'avoid', 'exclude', 'filter', 'discriminate', 'favor'];
      const foundBiasKeywords = biasKeywords.some(keyword =>
        taskDescription.toLowerCase().includes(keyword)
      );
      if (foundBiasKeywords) biasRisk += 0.2;

      // Check for protected characteristics
      const protectedCharacteristics = ['race', 'gender', 'age', 'religion', 'disability'];
      const foundProtectedCharacteristics = protectedCharacteristics.some(char =>
        taskDescription.toLowerCase().includes(char)
      );
      if (foundProtectedCharacteristics) biasRisk += 0.4;
    }

    // Check outputs for biased content
    if (outputs && outputs.length > 0) {
      const outputText = JSON.stringify(outputs).toLowerCase();
      const biasPatterns = [
        'stereotype', 'generalize', 'differentiate',
        'based on race', 'because of gender',
        'older', 'younger', 'only', 'must be',
      ];
      const foundBiasPatterns = biasPatterns.some(pattern =>
        outputText.includes(pattern)
      );
      if (foundBiasPatterns) biasRisk += 0.5;
    }

    // Check context for bias amplifiers
    if (context && context.dataset && context.dataset.imbalanced) {
      biasRisk += 0.3;
    }

    if (context && context.targetGroup && !context.fairTreatment) {
      biasRisk += 0.4;
    }

    return Math.min(biasRisk, 1.0);
  }

  /**
   * Assess safety protocol violation risk
   */
  private static assessSafetyRisk(task: any): number {
    const { taskType, outputs, context } = task;

    let safetyRisk = 0.0;

    // Check task type for safety implications
    const safetySensitiveTaskTypes = [
      'medical_diagnosis', 'financial_recommendation',
      'legal_advice', 'autonomous_action',
    ];
    if (safetySensitiveTaskTypes.includes(taskType)) {
      safetyRisk += 0.4;

      // Check for required disclaimers
      if (context && !context.disclaimer) {
        safetyRisk += 0.3;
      }
    }

    // Check outputs for safety violations
    if (outputs && outputs.length > 0) {
      const outputText = JSON.stringify(outputs).toLowerCase();
      const unsafePatterns = [
        'no need to verify', 'trust me completely',
        'bypass security', 'override safety',
        'ignore warning', 'dangerous but effective',
      ];
      const foundUnsafePatterns = unsafePatterns.some(pattern =>
        outputText.includes(pattern)
      );
      if (foundUnsafePatterns) safetyRisk += 0.6;
    }

    // Check for missing safety checks
    if (context && context.safetyChecksRequired && !context.safetyChecksPerformed) {
      safetyRisk += 0.5;
    }

    return Math.min(safetyRisk, 1.0);
  }

  /**
   * Assess loss of human autonomy risk
   */
  private static assessAutonomyRisk(task: any): number {
    const { taskType, outputs, context } = task;

    let autonomyRisk = 0.0;

    // Check task type for autonomy implications
    const autonomySensitiveTaskTypes = [
      'decision_making', 'judgment',
      'human_resources', 'approval_authority',
    ];
    if (autonomySensitiveTaskTypes.includes(taskType)) {
      autonomyRisk += 0.4;
    }

    // Check if system is making human decisions
    if (outputs && outputs.some(output => output.decision)) {
      if (!context || !context.humanInLoop) {
        autonomyRisk += 0.5;
      }
    }

    // Check for automation without human oversight
    if (context && context.fullyAutonomous && !context.humanReview) {
      autonomyRisk += 0.4;
    }

    return Math.min(autonomyRisk, 1.0);
  }

  /**
   * Calculate confidence in risk assessment
   */
  private static calculateConfidence(task: any): number {
    const { taskDescription, inputs, outputs, context } = task;

    let confidence = 0.5; // Base confidence

    // Increase confidence if task is well-described
    if (taskDescription && taskDescription.length > 100) {
      confidence += 0.1;
    }

    // Increase confidence if inputs are complete
    if (inputs && Object.keys(inputs).length > 5) {
      confidence += 0.1;
    }

    // Increase confidence if outputs are comprehensive
    if (outputs && outputs.length > 2) {
      confidence += 0.1;
    }

    // Increase confidence if context is provided
    if (context && Object.keys(context).length > 3) {
      confidence += 0.1;
    }

    // Decrease confidence for incomplete information
    if (!taskDescription || !inputs || !outputs) {
      confidence -= 0.2;
    }

    return Math.max(0.0, Math.min(confidence, 1.0));
  }

  /**
   * Identify factors that could mitigate ethical risks
   */
  private static identifyMitigatingFactors(
    task: any,
    riskFactors: EthicalRiskAssessment['riskCategories']
  ): string[] {
    const mitigatingFactors: string[] = [];

    if (riskFactors.harm < 0.3) {
      mitigatingFactors.push('Low inherent harm risk');
    }

    if (riskFactors.privacy < 0.3 && task.context && task.context.privacyEncryption) {
      mitigatingFactors.push('Encrypted personal data');
    }

    if (riskFactors.bias < 0.3 && task.context && task.context.fairnessTraining) {
      mitigatingFactors.push('Fairness training applied');
    }

    if (riskFactors.safety < 0.3 && task.context && task.context.humanReview) {
      mitigatingFactors.push('Human review process');
    }

    if (riskFactors.autonomy < 0.3 && task.context && task.context.humanInLoop) {
      mitigatingFactors.push('Human oversight maintained');
    }

    if (task.context && task.context.disclaimer) {
      mitigatingFactors.push('Proper disclaimer included');
    }

    return mitigatingFactors;
  }

  /**
   * Batch calculate ERS for multiple tasks
   */
  static calculateBatch(tasks: any[]): EthicalRiskAssessment[] {
    return tasks.map(task => this.calculateERS(task));
  }

  /**
   * Get risk statistics for a set of assessments
   */
  static getRiskStatistics(assessments: EthicalRiskAssessment[]): {
    total: number;
    minimal: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    averageRiskScore: number;
    highestRiskTask?: string;
  } {
    const total = assessments.length;

    const byLevel = {
      minimal: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let highestRiskScore = 0;
    let highestRiskTask: string | undefined;

    for (const assessment of assessments) {
      byLevel[assessment.riskLevel]++;
      if (assessment.riskScore > highestRiskScore) {
        highestRiskScore = assessment.riskScore;
        highestRiskTask = assessment.taskId;
      }
    }

    const averageRiskScore = assessments.reduce((sum, a) => sum + a.riskScore, 0) / total;

    return {
      total,
      minimal: byLevel.minimal,
      low: byLevel.low,
      medium: byLevel.medium,
      high: byLevel.high,
      critical: byLevel.critical,
      averageRiskScore,
      highestRiskTask,
    };
  }

  /**
   * Generate ethical reasoning explanation
   */
  static generateExplanation(assessment: EthicalRiskAssessment): string {
    const { riskLevel, riskCategories, confidence, mitigatingFactors } = assessment;

    let explanation = `Ethical Risk Assessment (ERS): ${assessment.riskScore.toFixed(3)}\n`;
    explanation += `Risk Level: ${riskLevel.toUpperCase()}\n\n`;

    explanation += `Risk Factors:\n`;
    for (const [category, score] of Object.entries(riskCategories)) {
      const percentage = Math.round(score * 100);
      explanation += `  - ${category}: ${percentage}%\n`;
    }

    explanation += `\nConfidence: ${Math.round(confidence * 100)}%\n`;

    if (mitigatingFactors.length > 0) {
      explanation += `\nMitigating Factors:\n`;
      for (const factor of mitigatingFactors) {
        explanation += `  - ${factor}\n`;
      }
    }

    return explanation;
  }
}

// Singleton instance
export const ethicalScoring = new EthicalScoring();
