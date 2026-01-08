/**
 * Reasoning Layer - Temporal Logic Engine
 * Handles time-aware decision making, planning, and causal reasoning
 */

export interface TemporalEvent {
  id: string;
  timestamp: number;
  eventType: 'instant' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
  description: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

export interface TemporalConstraint {
  id: string;
  type: 'deadline' | 'duration' | 'sequence' | 'concurrent' | 'recurrence';
  value: number | string | Date;
  severity: 'soft' | 'hard' | 'critical';
  description: string;
}

export interface TemporalPlan {
  id: string;
  horizon: 'short' | 'medium' | 'long' | 'very_long';
  startTime: number;
  endTime: number;
  phases: TemporalPhase[];
  constraints: TemporalConstraint[];
  totalDuration: number;
}

export interface TemporalPhase {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
}

export interface CausalRelationship {
  id: string;
  causeEventId: string;
  effectEventId: string;
  type: 'direct' | 'indirect' | 'contributing' | 'preventing';
  confidence: number; // 0.0 to 1.0
  strength: number; // 0.0 to 1.0
}

export const TEMPORAL_ABSTRACTIONS = {
  INSTANT: {
    level: 0,
    description: 'Immediate action with no delay',
    duration_ms: 0,
  },
  SECONDS: {
    level: 1,
    description: 'Actions within seconds time horizon',
    duration_ms: 1000,
  },
  MINUTES: {
    level: 2,
    description: 'Actions within minutes time horizon',
    duration_ms: 60000,
  },
  HOURS: {
    level: 3,
    description: 'Actions within hours time horizon',
    duration_ms: 3600000,
  },
  DAYS: {
    level: 4,
    description: 'Actions within days time horizon',
    duration_ms: 86400000,
  },
  WEEKS: {
    level: 5,
    description: 'Actions within weeks time horizon',
    duration_ms: 604800000,
  },
} as const;

/**
 * Temporal Logic Engine
 * Manages time-aware reasoning, planning, and causal analysis
 */
export class TemporalLogic {
  private events: TemporalEvent[] = [];
  private constraints: TemporalConstraint[] = [];
  private causalRelationships: CausalRelationship[] = [];
  private plans: TemporalPlan[] = [];

  constructor() {
    this.loadTemporalState();
  }

  /**
   * Load temporal state from memory
   */
  private async loadTemporalState(): Promise<void> {
    try {
      const response = await fetch('/api/memory/temporal');
      const data = await response.json();
      this.events = data.events || [];
      this.constraints = data.constraints || [];
      this.causalRelationships = data.causalRelationships || [];
      this.plans = data.plans || [];
    } catch (error) {
      console.error('Failed to load temporal state:', error);
    }
  }

  /**
   * Create a temporal event
   */
  createEvent(event: Omit<TemporalEvent, 'id'>): TemporalEvent {
    const newEvent: TemporalEvent = {
      id: `temporal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...event,
    };

    this.events.push(newEvent);

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    return newEvent;
  }

  /**
   * Get events within a time window
   */
  getEventsInWindow(
    startTime: number,
    endTime: number = Date.now(),
    eventType?: 'instant' | 'seconds' | 'minutes' | 'hours' | 'days'
  ): TemporalEvent[] {
    return this.events.filter(event => {
      const inTimeWindow = event.timestamp >= startTime && event.timestamp <= endTime;
      const matchesType = !eventType || event.eventType === eventType;
      return inTimeWindow && matchesType;
    }).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Add temporal constraint
   */
  addConstraint(constraint: Omit<TemporalConstraint, 'id'>): TemporalConstraint {
    const newConstraint: TemporalConstraint = {
      id: `constraint-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...constraint,
    };

    this.constraints.push(newConstraint);

    // Keep only last 1000 constraints
    if (this.constraints.length > 1000) {
      this.constraints = this.constraints.slice(-1000);
    }

    return newConstraint;
  }

  /**
   * Check if constraint is satisfied
   */
  checkConstraint(constraintId: string): {
    satisfied: boolean;
    remaining: number;
    description: string;
  } {
    const constraint = this.constraints.find(c => c.id === constraintId);
    if (!constraint) {
      return {
        satisfied: true,
        remaining: 0,
        description: 'Constraint not found',
      };
    }

    const now = Date.now();
    const nowMs = now;

    switch (constraint.type) {
      case 'deadline':
        const deadlineMs = constraint.value instanceof Date
          ? constraint.value.getTime()
          : new Date(constraint.value).getTime();
        const remaining = deadlineMs - nowMs;

        return {
          satisfied: remaining >= 0,
          remaining: Math.max(0, remaining),
          description: constraint.severity === 'critical' && remaining < 0
            ? 'Critical deadline exceeded'
            : constraint.severity === 'hard' && remaining < 0
            ? 'Hard deadline exceeded'
            : `Deadline ${remaining >= 0 ? 'in' : 'missed by'} ${Math.abs(remaining)}ms`,
        };

      case 'duration':
        const durationMs = typeof constraint.value === 'number'
          ? constraint.value * 1000
          : typeof constraint.value === 'string'
          ? this.parseDuration(constraint.value)
          : 0;
        // For duration constraints, check if events fit within duration
        return {
          satisfied: true,
          remaining: durationMs,
          description: `Duration constraint: ${durationMs}ms`,
        };

      default:
        return {
          satisfied: true,
          remaining: 0,
          description: `Constraint type ${constraint.type} not implemented`,
        };
    }
  }

  /**
   * Parse duration string (e.g., "2h 30m" to milliseconds)
   */
  private parseDuration(duration: string): number {
    const patterns = {
      s: 1000,
      m: 60000,
      h: 360000,
      d: 86400000,
      w: 604800000,
      mo: 2629800000,
      y: 31536000000,
    };

    let totalMs = 0;
    const regex = /(\d+)([smhdwy])/gi;
    let match;

    while ((match = regex.exec(duration)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      totalMs += value * patterns[unit as keyof typeof patterns];
    }

    return totalMs;
  }

  /**
   * Create a causal relationship
   */
  createCausalRelationship(relationship: Omit<CausalRelationship, 'id'>): CausalRelationship {
    const newRelationship: CausalRelationship = {
      id: `causal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ...relationship,
    };

    this.causalRelationships.push(newRelationship);

    // Keep only last 5000 relationships
    if (this.causalRelationships.length > 5000) {
      this.causalRelationships = this.causalRelationships.slice(-5000);
    }

    return newRelationship;
  }

  /**
   * Analyze causal chain
   */
  analyzeCausalChain(startEventId: string, maxDepth: number = 10): {
    chain: CausalRelationship[];
    loops: string[][];
    confidence: number;
    longestPath: string[];
  } {
    const chain: CausalRelationship[] = [];
    const loops: string[] = [];
    const visited: Set<string> = new Set();

    let currentEventId = startEventId;
    let depth = 0;

    while (currentEventId && depth < maxDepth) {
      if (visited.has(currentEventId)) {
        loops.push(currentEventId);
        break;
      }

      visited.add(currentEventId);

      // Find all effects of current event
      const effects = this.causalRelationships
        .filter(r => r.causeEventId === currentEventId)
        .sort((a, b) => b.confidence - a.confidence); // Sort by confidence descending

      if (effects.length === 0) {
        break; // No more effects, end of chain
      }

      // Pick highest confidence effect
      const strongestEffect = effects[0];
      chain.push(strongestEffect);
      currentEventId = strongestEffect.effectEventId;
      depth++;

      // Prevent infinite loops
      if (depth > maxDepth * 2) {
        break;
      }
    }

    // Calculate confidence based on chain strength
    const averageConfidence = chain.length > 0
      ? chain.reduce((sum, r) => sum + r.confidence, 0) / chain.length
      : 0;

    return {
      chain,
      loops,
      confidence: averageConfidence,
      longestPath: chain.map(r => r.effectEventId),
    };
  }

  /**
   * Predict future events
   */
  predictFutureEvents(horizon: 'short' | 'medium' | 'long' = 'medium'): {
    predictedEvents: TemporalEvent[];
    confidence: number;
    reasoning: string;
  } {
    const now = Date.now();
    let horizonMs: number;

    switch (horizon) {
      case 'short':
        horizonMs = TEMPORAL_ABSTRACTIONS.MINUTES.duration_ms; // 1 hour
        break;
      case 'medium':
        horizonMs = TEMPORAL_ABSTRACTIONS.HOURS.duration_ms; // 1 day
        break;
      case 'long':
        horizonMs = TEMPORAL_ABSTRACTIONS.DAYS.duration_ms; // 1 week
        break;
    }

    // Get recent events within last 7 days
    const recentEvents = this.getEventsInWindow(now - 7 * 24 * 60 * 60 * 1000, now);

    // Predict future events based on patterns in recent events
    const predictedEvents: TemporalEvent[] = [];

    // Look for repeating patterns
    const eventPatterns = new Map<string, number>();

    for (const event of recentEvents) {
      const patternKey = `${event.eventType}-${event.description.substring(0, 50)}`;
      eventPatterns.set(patternKey, (eventPatterns.get(patternKey) || 0) + 1);
    }

    // Generate predictions for repeating patterns
    for (const [patternKey, count] of eventPatterns.entries()) {
      if (count >= 2) { // Pattern repeated at least twice
        const [eventType, description] = patternKey.split('-');

        // Predict next occurrence based on average interval
        const relatedEvents = recentEvents.filter(e =>
          e.eventType === eventType && e.description.startsWith(description)
        );

        if (relatedEvents.length >= 2) {
          const intervals: number[] = [];
          for (let i = 1; i < relatedEvents.length; i++) {
            intervals.push(relatedEvents[i].timestamp - relatedEvents[i - 1].timestamp);
          }

          const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
          const lastEventTime = relatedEvents[relatedEvents.length - 1].timestamp;
          const nextPredictedTime = lastEventTime + avgInterval;

          if (nextPredictedTime <= now + horizonMs) {
            predictedEvents.push({
              id: `prediction-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              timestamp: nextPredictedTime,
              eventType: eventType as any,
              description: `Predicted: ${description}`,
              duration: avgInterval,
            });
          }
        }
      }
    }

    // Calculate confidence based on pattern strength
    const confidence = predictedEvents.length > 0
      ? Math.min(0.5 + (predictedEvents.length * 0.05), 0.9)
      : 0.0;

    return {
      predictedEvents,
      confidence,
      reasoning: confidence > 0.3
        ? `Predictions based on ${predictedEvents.length} repeating patterns`
        : 'Insufficient pattern data for reliable predictions',
    };
  }

  /**
   * Create temporal plan
   */
  createTemporalPlan(params: {
    horizon: 'short' | 'medium' | 'long' | 'very_long';
    phases: Array<{
      name: string;
      duration: number;
      dependencies: string[];
    }>;
    constraints?: TemporalConstraint[];
  }): TemporalPlan {
    const now = Date.now();
    let totalDurationMs: number;

    // Calculate total duration based on phases
    totalDurationMs = params.phases.reduce((sum, phase) => sum + phase.duration, 0);

    // Adjust total duration based on horizon
    let horizonMs: number;
    switch (params.horizon) {
      case 'short':
        horizonMs = TEMPORAL_ABSTRACTIONS.MINUTES.duration_ms; // 1 hour
        break;
      case 'medium':
        horizonMs = TEMPORAL_ABSTRACTIONS.HOURS.duration_ms; // 1 day
        break;
      case 'long':
        horizonMs = TEMPORAL_ABSTRACTIONS.DAYS.duration_ms; // 1 week
        break;
      case 'very_long':
        horizonMs = TEMPORAL_ABSTRACTIONS.WEEKS.duration_ms; // 1 month
        break;
    }

    // Ensure plan doesn't exceed horizon
    if (totalDurationMs > horizonMs) {
      totalDurationMs = horizonMs;
    }

    // Create phases with timestamps
    const phases: TemporalPhase[] = [];
    let currentStartTime = now;

    for (let i = 0; i < params.phases.length; i++) {
      const phase = params.phases[i];
      const endTime = currentStartTime + phase.duration;

      phases.push({
        id: `phase-${Date.now()}-${i}`,
        name: phase.name,
        startTime: currentStartTime,
        endTime,
        duration: phase.duration,
        dependencies: phase.dependencies || [],
        status: i === 0 ? 'pending' : 'blocked',
      });

      currentStartTime = endTime;
    }

    // Check if all constraints are satisfied
    const activeConstraints = params.constraints || [];
    const constraintViolations: string[] = [];

    for (const constraint of activeConstraints) {
      const check = this.checkConstraint(constraint.id);
      if (!check.satisfied) {
        constraintViolations.push(check.description);
      }
    }

    const plan: TemporalPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      horizon: params.horizon,
      startTime: now,
      endTime: now + totalDurationMs,
      phases,
      constraints: activeConstraints,
      totalDuration: totalDurationMs,
    };

    this.plans.push(plan);

    // Keep only last 100 plans
    if (this.plans.length > 100) {
      this.plans = this.plans.slice(-100);
    }

    // Save plan to memory
    this.savePlanToMemory(plan);

    return plan;
  }

  /**
   * Save plan to memory
   */
  private async savePlanToMemory(plan: TemporalPlan): Promise<void> {
    try {
      await fetch('/api/memory/temporal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'plan',
          data: plan,
        }),
      });
    } catch (error) {
      console.error('Failed to save plan to memory:', error);
    }
  }

  /**
   * Get temporal statistics
   */
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    totalConstraints: number;
    constraintsBySeverity: Record<string, number>;
    totalCausalRelationships: number;
    averageCausalStrength: number;
    totalPlans: number;
    activePlans: number;
    completedPlans: number;
    failedPlans: number;
  } {
    const eventsByType: Record<string, number> = {
      instant: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
    };

    for (const event of this.events) {
      eventsByType[event.eventType]++;
    }

    const constraintsBySeverity: Record<string, number> = {
      soft: 0,
      hard: 0,
      critical: 0,
    };

    for (const constraint of this.constraints) {
      constraintsBySeverity[constraint.severity]++;
    }

    const totalCausalRelationships = this.causalRelationships.length;
    const averageCausalStrength = totalCausalRelationships > 0
      ? this.causalRelationships.reduce((sum, r) => sum + r.strength, 0) / totalCausalRelationships
      : 0;

    const activePlans = this.plans.filter(p => {
      const now = Date.now();
      return p.startTime <= now && p.endTime >= now && p.phases.some(ph => ph.status === 'in_progress');
    }).length;

    const completedPlans = this.plans.filter(p =>
      p.phases.every(ph => ph.status === 'completed')
    ).length;

    const failedPlans = this.plans.filter(p =>
      p.phases.some(ph => ph.status === 'failed')
    ).length;

    return {
      totalEvents: this.events.length,
      eventsByType,
      totalConstraints: this.constraints.length,
      constraintsBySeverity,
      totalCausalRelationships,
      averageCausalStrength,
      totalPlans: this.plans.length,
      activePlans,
      completedPlans,
      failedPlans,
    };
  }

  /**
   * Get current time abstraction level
   */
  getCurrentAbstractionLevel(): 'instant' | 'seconds' | 'minutes' | 'hours' | 'days' {
    // Determine based on most recent events
    if (this.events.length === 0) {
      return 'instant';
    }

    const mostRecentEvent = this.events[this.events.length - 1];
    const timeSinceEvent = Date.now() - mostRecentEvent.timestamp;

    if (timeSinceEvent < TEMPORAL_ABSTRACTIONS.SECONDS.duration_ms) {
      return 'instant';
    } else if (timeSinceEvent < TEMPORAL_ABSTRACTIONS.MINUTES.duration_ms) {
      return 'seconds';
    } else if (timeSinceEvent < TEMPORAL_ABSTRACTIONS.HOURS.duration_ms) {
      return 'minutes';
    } else if (timeSinceEvent < TEMPORAL_ABSTRACTIONS.DAYS.duration_ms) {
      return 'hours';
    } else {
      return 'days';
    }
  }
}

// Singleton instance
export const temporalLogic = new TemporalLogic();
