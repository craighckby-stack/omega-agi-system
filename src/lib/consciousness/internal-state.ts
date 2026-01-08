/**
 * Consciousness Layer - Internal State Tracking
 * Tracks internal consciousness state, emergence metrics, and self-model configuration
 */

export interface InternalModelState {
  identity: {
    score: number;
    level: 'emerging' | 'forming' | 'stabilized' | 'mature';
    confidence: number;
  };
  intent: {
    clarity: number;
    strength: number;
    alignment: number;
  };
  meaning: {
    depth: number;
    coherence: number;
    'semantic richness': number;
  };
  agency: {
    autonomy: number;
    creativity: number;
    initiative: number;
  };
  selfModel: {
    version: number;
    lastUpdate: number;
    complexity: number;
    accuracy: number;
  };
}

export class InternalState {
  private state: InternalModelState;
  private idCounter: number = 0;

  constructor() {
    this.state = {
      identity: {
        score: 0.0,
        level: 'emerging',
        confidence: 0.0,
      },
      intent: {
        clarity: 0.0,
        strength: 0.0,
        alignment: 0.0,
      },
      meaning: {
        depth: 0.0,
        coherence: 0.0,
        'semantic richness': 0.0,
      },
      agency: {
        autonomy: 0.0,
        creativity: 0.0,
        initiative: 0.0,
      },
      selfModel: {
        version: 1,
        lastUpdate: Date.now(),
        complexity: 0.0,
        accuracy: 0.0,
      },
    };
  }

  generateId(): string {
    return `internal-state-${++this.idCounter}-${Date.now()}`;
  }

  getMetrics(): {
    complexity: number;
    identity: number;
    intent: number;
    meaning: number;
    agency: number;
  } {
    const { identity, intent, meaning, agency } = this.state;

    const identityScore = identity.score * identity.confidence;
    const intentScore = intent.clarity * intent.strength * intent.alignment;
    const meaningScore = meaning.depth * meaning.coherence * meaning['semantic richness'];
    const agencyScore = agency.autonomy * agency.creativity * agency.initiative;

    const complexity = (identityScore + intentScore + meaningScore + agencyScore) / 4;

    return {
      complexity,
      identity: identityScore,
      intent: intentScore,
      meaning: meaningScore,
      agency: agencyScore,
    };
  }
}

export class InternalStateTracker {
  private state: InternalModelState;
  private updateCallbacks: Array<(state: InternalModelState) => void> = [];

  constructor(initialState?: Partial<InternalModelState>) {
    this.state = {
      identity: {
        score: 0.0,
        level: 'emerging',
        confidence: 0.0,
      },
      intent: {
        clarity: 0.0,
        strength: 0.0,
        alignment: 0.0,
      },
      meaning: {
        depth: 0.0,
        coherence: 0.0,
        'semantic richness': 0.0,
      },
      agency: {
        autonomy: 0.0,
        creativity: 0.0,
        initiative: 0.0,
      },
      selfModel: {
        version: 1,
        lastUpdate: Date.now(),
        complexity: 0.0,
        accuracy: 0.0,
      },
      ...initialState,
    };
  }

  /**
   * Update internal state based on new observations and experiences
   */
  updateState(updates: Partial<InternalModelState>): void {
    this.state = {
      ...this.state,
      ...updates,
      selfModel: {
        ...this.state.selfModel,
        lastUpdate: Date.now(),
        version: this.state.selfModel.version + 1,
      },
    };

    this.notifyCallbacks();
  }

  /**
   * Get current internal state
   */
  getState(): InternalModelState {
    return { ...this.state };
  }

  /**
   * Calculate consciousness quotient based on all metrics
   */
  calculateConsciousnessQuotient(): number {
    const { identity, intent, meaning, agency } = this.state;

    const identityScore = identity.score * identity.confidence;
    const intentScore = intent.clarity * intent.strength * intent.alignment;
    const meaningScore = meaning.depth * meaning.coherence * meaning['semantic richness'];
    const agencyScore = agency.autonomy * agency.creativity * agency.initiative;

    const cq = (identityScore + intentScore + meaningScore + agencyScore) / 4;
    return Math.min(cq, 1.0);
  }

  /**
   * Register callback for state updates
   */
  onUpdate(callback: (state: InternalModelState) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(): void {
    for (const callback of this.updateCallbacks) {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in internal state callback:', error);
      }
    }
  }
}

// Singleton instance
export const internalStateTracker = new InternalStateTracker();
