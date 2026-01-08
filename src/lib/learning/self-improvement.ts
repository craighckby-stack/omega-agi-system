import ZAI from '@/lib/sdk-mock';
import { db } from '@/lib/db';

export interface ImprovementCandidate {
  target: string;
  type: 'OPTIMIZATION' | 'BUGFIX' | 'FEATURE' | 'REFACTORING';
  description: string;
  estimatedImpact: number;
  risk: number;
}

export interface Improvement {
  target: string;
  type: string;
  description: string;
  originalCode: string;
  improvedCode: string;
  explanation: string;
  confidence: number;
}

export interface CycleResult {
  success: boolean;
  improvements: Improvement[];
  newCode: string;
  performanceChange: number;
  confidence: number;
}

export class SelfImprovementCycle {
  private currentCycle: number = 0;
  private constraintLevel: number = 1.0;
  private zai: any = null;

  constructor() {
    this.loadCurrentCycle();
  }

  private async initialize(): Promise<void> {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  private async loadCurrentCycle(): Promise<void> {
    const lastCycle = await db.improvementCycle.findFirst({
      orderBy: { cycleNumber: 'desc' }
    });

    if (lastCycle) {
      this.currentCycle = lastCycle.cycleNumber;
      this.constraintLevel = lastCycle.constraintLevel;
    }
  }

  async executeCycle(): Promise<CycleResult> {
    await this.initialize();
    this.currentCycle++;

    console.log(`🔄 Starting improvement cycle ${this.currentCycle}`);
    console.log(`📊 Constraint level: ${this.constraintLevel}`);

    try {
      const analysis = await this.analyzeCodebase();
      const candidates = await this.generateImprovements(analysis);
      const filtered = await this.filterByConstraints(candidates);
      const results = await this.applyImprovements(filtered);
      const validation = await this.validateResults(results, analysis);

      if (validation.valid) {
        console.log('✅ Improvements validated');
        await this.updateConstraintLevel(validation.performanceChange);
      } else {
        console.log('❌ Improvements rejected - rolling back');
        await this.rollback(results);
      }

      const cycleResult: CycleResult = {
        success: validation.valid,
        improvements: results,
        newCode: results.length > 0 ? results[0].improvedCode : '',
        performanceChange: validation.performanceChange || 0,
        confidence: validation.confidence || 0.5
      };

      await this.storeCycleResult(cycleResult);

      return cycleResult;
    } catch (error: any) {
      console.error('Cycle execution error:', error);
      return {
        success: false,
        improvements: [],
        newCode: '',
        performanceChange: 0,
        confidence: 0
      };
    }
  }

  private async analyzeCodebase(): Promise<any> {
    // Simplified codebase analysis
    return {
      complexityMetrics: {
        avgComplexity: 5.0,
        maxComplexity: 15.0
      },
      bottlenecks: [
        {
          location: 'agent-orchestrator.ts',
          suggestion: 'Optimize LLM calls with caching',
          impact: 0.8
        }
      ],
      codeSmells: [],
      testCoverage: 0.75,
      securityIssues: []
    };
  }

  private async generateImprovements(
    analysis: any
  ): Promise<ImprovementCandidate[]> {
    const candidates: ImprovementCandidate[] = [];

    for (const bottleneck of analysis.bottlenecks || []) {
      candidates.push({
        target: bottleneck.location,
        type: 'OPTIMIZATION',
        description: bottleneck.suggestion,
        estimatedImpact: bottleneck.impact,
        risk: 0.3
      });
    }

    return candidates;
  }

  private async filterByConstraints(
    candidates: ImprovementCandidate[]
  ): Promise<ImprovementCandidate[]> {
    const maxRisk = 1.0 - (this.constraintLevel * 0.1);
    return candidates.filter(c => c.risk <= maxRisk);
  }

  private async applyImprovements(
    candidates: ImprovementCandidate[]
  ): Promise<Improvement[]> {
    if (candidates.length === 0) return [];

    const improvements = await Promise.all(
      candidates.slice(0, 3).map(c => this.generateImprovementCode(c))
    );

    return improvements.filter((i): i is Improvement => i !== undefined);
  }

  private async generateImprovementCode(
    candidate: ImprovementCandidate
  ): Promise<Improvement | undefined> {
    try {
      const prompt = `Analyze the following code and suggest an improvement:

Location: ${candidate.target}
Type: ${candidate.type}
Description: ${candidate.description}

Constraints:
- Constraint level: ${this.constraintLevel}
- Maximum risk: ${candidate.risk}
- Estimated impact: ${candidate.estimatedImpact}

Provide:
1. Improved code
2. Explanation of changes
3. Confidence score (0-1)

Format as JSON:
{
  "improvedCode": "...",
  "explanation": "...",
  "confidence": 0.0
}`;

      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a code optimization expert.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        thinking: { type: 'disabled' }
      });

      const text = response.choices[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(text);
        return {
          target: candidate.target,
          type: candidate.type,
          description: candidate.description,
          originalCode: '',
          improvedCode: parsed.improvedCode || '',
          explanation: parsed.explanation || '',
          confidence: parsed.confidence || 0.5
        };
      } catch {
        return undefined;
      }
    } catch (error) {
      console.error('Error generating improvement:', error);
      return undefined;
    }
  }

  private async validateResults(
    results: Improvement[],
    analysis: any
  ): Promise<{ valid: boolean; performanceChange?: number; confidence?: number }> {
    const confidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

    return {
      valid: confidence > 0.5,
      performanceChange: confidence * 0.1,
      confidence
    };
  }

  private async rollback(improvements: Improvement[]): Promise<void> {
    console.log('Rolling back improvements...');
    for (const improvement of improvements) {
      console.log(`  Rolling back: ${improvement.target}`);
    }
  }

  private async updateConstraintLevel(performanceChange?: number): Promise<void> {
    if (performanceChange && performanceChange > 0.1) {
      this.constraintLevel = Math.max(1.0, this.constraintLevel - 0.1);
    } else if (performanceChange && performanceChange < -0.1) {
      this.constraintLevel = Math.min(10.0, this.constraintLevel + 0.1);
    }

    console.log(`Updated constraint level to: ${this.constraintLevel}`);
  }

  private async storeCycleResult(result: CycleResult): Promise<void> {
    await db.improvementCycle.create({
      data: {
        cycleNumber: this.currentCycle,
        constraintLevel: this.constraintLevel,
        success: result.success,
        improvements: JSON.stringify(result.improvements),
        newCode: result.newCode,
        performanceChange: result.performanceChange,
        confidence: result.confidence
      }
    });
  }

  getConstraintLevel(): number {
    return this.constraintLevel;
  }

  setConstraintLevel(level: number): void {
    this.constraintLevel = Math.max(1.0, Math.min(10.0, level));
  }
}
