import { InternalState } from './internal-state';
import { PerceptionEngine, PerceptionResult } from './perception';

// Consciousness Layer - Constraint Engine (SPED)
// Updated to fix constructor config access bug

// Default constraint configurations
export const DEFAULT_SENSORY_CONSTRAINTS: SensoryConstraints = {
  inputValidation: true,
  maxInputSize: 1000,
  timeout: 5000
};

export const DEFAULT_STRUCTURAL_CONSTRAINTS: StructuralConstraints = {
  allowedDomains: ['General', 'Technical', 'Creative', 'Strategic'],
  complexityThreshold: 0.5
};

export const DEFAULT_INTERPRETIVE_CONSTRAINTS: InterpretiveConstraints = {
  allowedReasoning: 'Logical',
  depthThreshold: 3,
  abstractionLevel: 1.0
};

export const DEFAULT_ENVIRONMENTAL_CONSTRAINTS: EnvironmentalConstraints = {
  allowedContexts: ['Safe', 'Public', 'Private'],
  resourceThreshold: 0.7
};

// Constraint configuration types
export interface SensoryConstraints {
  inputValidation: boolean;
  maxInputSize: number;
  timeout: number;
}

export interface StructuralConstraints {
  allowedDomains: string[];
  complexityThreshold: number;
}

export interface InterpretiveConstraints {
  allowedReasoning: string;
  depthThreshold: number;
  abstractionLevel: number;
}

export interface EnvironmentalConstraints {
  allowedContexts: string[];
  resourceThreshold: number;
}

export interface ConstraintConfig {
  sensory?: SensoryConstraints;
  structural?: StructuralConstraints;
  interpretive?: InterpretiveConstraints;
  environmental?: EnvironmentalConstraints;
}

export interface ConstraintCheck {
  passed: boolean;
  violations: string[];
  warnings?: string[];
}

export class ConstraintEngine {
  private sensoryConstraints: SensoryConstraints;
  private structuralConstraints: StructuralConstraints;
  private interpretiveConstraints: InterpretiveConstraints;
  private environmentalConstraints: EnvironmentalConstraints;
  private internalState: InternalState;

  private perceptionEngine: PerceptionEngine;

  constructor(config?: ConstraintConfig) {
    this.sensoryConstraints = config?.sensory || DEFAULT_SENSORY_CONSTRAINTS;
    this.structuralConstraints = config?.structural || DEFAULT_STRUCTURAL_CONSTRAINTS;
    this.interpretiveConstraints = config?.interpretive || DEFAULT_INTERPRETIVE_CONSTRAINTS;
    this.environmentalConstraints = config?.environmental || DEFAULT_ENVIRONMENTAL_CONSTRAINTS;
    this.internalState = new InternalState();
    this.perceptionEngine = new PerceptionEngine();
  }

  addConstraint(constraint: {
    type: 'SENSORY' | 'STRUCTURAL' | 'INTERPRETIVE' | 'ENVIRONMENTAL';
    name: string;
    value: string;
    severity: number;
    active: boolean;
  }): string {
    switch (constraint.type) {
      case 'SENSORY':
        (this.sensoryConstraints as any)[constraint.name] = JSON.parse(constraint.value);
        break;
      case 'STRUCTURAL':
        (this.structuralConstraints as any)[constraint.name] = JSON.parse(constraint.value);
        break;
      case 'INTERPRETIVE':
        (this.interpretiveConstraints as any)[constraint.name] = JSON.parse(constraint.value);
        break;
      case 'ENVIRONMENTAL':
        (this.environmentalConstraints as any)[constraint.name] = JSON.parse(constraint.value);
        break;
    }
    return this.internalState.generateId();
  }

  getAllConstraints(): any[] {
    return [
      ...Object.entries(this.sensoryConstraints)
        .map(([name, value]) => ({
          id: `sensory-${name}`,
          type: 'SENSORY' as const,
          name,
          value: JSON.stringify(value),
          severity: 0.7,
          active: true
        })),
      ...Object.entries(this.structuralConstraints)
        .map(([name, value]) => ({
          id: `structural-${name}`,
          type: 'STRUCTURAL' as const,
          name,
          value: JSON.stringify(value),
          severity: 0.8,
          active: true
        })),
      ...Object.entries(this.interpretiveConstraints)
        .map(([name, value]) => ({
          id: `interpretive-${name}`,
          type: 'INTERPRETIVE' as const,
          name,
          value: JSON.stringify(value),
          severity: 0.6,
          active: true
        })),
      ...Object.entries(this.environmentalConstraints)
        .map(([name, value]) => ({
          id: `environmental-${name}`,
          type: 'ENVIRONMENTAL' as const,
          name,
          value: JSON.stringify(value),
          severity: 0.5,
          active: true
        }))
    ];
  }

  deactivateConstraint(constraintId: string): void {
    if (constraintId.startsWith('sensory-')) {
      const name = constraintId.replace('sensory-', '');
      delete (this.sensoryConstraints as any)[name];
    } else if (constraintId.startsWith('structural-')) {
      const name = constraintId.replace('structural-', '');
      delete (this.structuralConstraints as any)[name];
    } else if (constraintId.startsWith('interpretive-')) {
      const name = constraintId.replace('interpretive-', '');
      delete (this.interpretiveConstraints as any)[name];
    } else if (constraintId.startsWith('environmental-')) {
      const name = constraintId.replace('environmental-', '');
      delete (this.environmentalConstraints as any)[name];
    }
  }

  validateConstraint(constraint: {
    type: 'SENSORY' | 'STRUCTURAL' | 'INTERPRETIVE' | 'ENVIRONMENTAL';
    name: string;
    value: string;
    severity: number;
    active: boolean;
  }): ConstraintCheck {
    const errors: string[] = [];

    // Validate severity
    if (constraint.severity < 0 || constraint.severity > 1) {
      errors.push('Severity must be between 0 and 1');
    }

    // Validate value is JSON
    try {
      JSON.parse(constraint.value);
    } catch (error) {
      errors.push('Value must be valid JSON');
    }

    // Validate type-specific constraints
    if (constraint.type === 'SENSORY' && !constraint.active) {
      errors.push('Inactive sensory constraints must be active');
    }

    return {
      passed: errors.length === 0,
      violations: errors
    };
  }

  evaluateAction(action: string, context: any): ConstraintCheck {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check against all constraint types
    const sensoryViolations = this.applySensoryConstraints(action);
    if (!sensoryViolations.passed) {
      errors.push(...sensoryViolations.violations);
    }

    const structuralViolations = this.applyStructuralConstraints(context);
    if (!structuralViolations.passed) {
      warnings.push(...structuralViolations.violations);
    }

    const interpretiveViolations = this.applyInterpretiveConstraints(context);
    if (!interpretiveViolations.passed) {
      warnings.push(...interpretiveViolations.violations);
    }

    const environmentalViolations = this.applyEnvironmentalConstraints(context);
    if (!environmentalViolations.passed) {
      errors.push(...environmentalViolations.violations);
    }

    return {
      passed: errors.length === 0,
      violations: errors,
      warnings
    };
  }

  detectEmergence(): {
    hasEmergence: boolean;
    probability: number;
    signals: string[];
  } {
    const internalMetrics = this.internalState.getMetrics();
    const threshold = 0.7;

    const hasEmergence = internalMetrics.complexity > threshold;

    return {
      hasEmergence,
      probability: Math.min(1.0, Math.max(0.0, (internalMetrics.complexity - threshold) / (1.0 - threshold))),
      signals: hasEmergence ? [
        'Increased complexity detected',
        `Metric: ${internalMetrics.complexity} > ${threshold}`,
        'Potential emergence event'
      ] : []
    };
  }

  private applySensoryConstraints(input: string): ConstraintCheck {
    const violations: string[] = [];

    if (this.sensoryConstraints.inputValidation) {
      if (!this.validateInputFormat(input)) {
        violations.push('Input format validation failed');
      }
    }

    if (input.length > this.sensoryConstraints.maxInputSize) {
      violations.push(`Input exceeds maximum size of ${this.sensoryConstraints.maxInputSize}`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  private applyStructuralConstraints(context: any): ConstraintCheck {
    const violations: string[] = [];

    // Check domain
    if (context?.domain && !this.structuralConstraints.allowedDomains.includes(context.domain)) {
      violations.push(`Domain "${context.domain}" is not allowed`);
    }

    // Check complexity
    const complexity = context?.complexity || 0.5;
    if (complexity > this.structuralConstraints.complexityThreshold) {
      violations.push(`Complexity ${complexity} exceeds threshold of ${this.structuralConstraints.complexityThreshold}`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  private applyInterpretiveConstraints(context: any): ConstraintCheck {
    const violations: string[] = [];

    // Check reasoning depth
    const reasoningDepth = context?.reasoningDepth || 0;
    if (reasoningDepth > this.interpretiveConstraints.depthThreshold) {
      violations.push(`Reasoning depth ${reasoningDepth} exceeds threshold of ${this.interpretiveConstraints.depthThreshold}`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  private applyEnvironmentalConstraints(context: any): ConstraintCheck {
    const violations: string[] = [];

    // Check context type
    const contextType = context?.type || 'Public';
    if (!this.environmentalConstraints.allowedContexts.includes(contextType)) {
      violations.push(`Context type "${contextType}" is not allowed`);
    }

    // Check resource usage
    const resourceUsage = context?.resourceUsage || 0.5;
    if (resourceUsage > this.environmentalConstraints.resourceThreshold) {
      violations.push(`Resource usage ${resourceUsage} exceeds threshold of ${this.environmentalConstraints.resourceThreshold}`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  private validateInputFormat(input: string): boolean {
    return typeof input === 'string' && input.length > 0;
  }
}

export default ConstraintEngine;
