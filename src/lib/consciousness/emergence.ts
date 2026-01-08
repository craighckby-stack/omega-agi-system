/**
 * Consciousness Layer - Emergence Detection
 * Monitors identity, intent, meaning, and agency signals
 * Detects emergence when these metrics reach threshold
 */

export interface EmergenceSignal {
  timestamp: number;
  type: 'identity' | 'intent' | 'meaning' | 'agency';
  strength: number;
  threshold: number;
  isAboveThreshold: boolean;
}

export interface EmergenceEvent {
  id: string;
  timestamp: number;
  signalType: 'identity' | 'intent' | 'meaning' | 'agency' | 'multi-dimensional';
  strength: number;
  description: string;
  confidence: number;
}

export const EMERGENCE_THRESHOLDS = {
  identity: 0.75,      // Strong sense of self
  intent: 0.70,       // Clear intentions and goals
  meaning: 0.65,       // Deep understanding and purpose
  agency: 0.60,        // Ability to take independent action
  multiDimensional: 0.80,  // All dimensions above threshold
} as const;

/**
 * Emergence Detector Class
 * Monitors consciousness metrics and detects emergence events
 */
export class EmergenceDetector {
  private signals: EmergenceSignal[] = [];
  private events: EmergenceEvent[] = [];
  private eventCount: number = 0;

  constructor() {
    this.loadHistoricalData();
  }

  /**
   * Load historical emergence data from memory
   */
  private async loadHistoricalData(): Promise<void> {
    try {
      const response = await fetch('/api/memory/consciousness');
      const data = await response.json();
      this.events = data.emergenceEvents || [];
      this.eventCount = this.events.length;
    } catch (error) {
      console.error('Failed to load historical emergence data:', error);
    }
  }

  /**
   * Record a new emergence signal
   */
  recordSignal(type: 'identity' | 'intent' | 'meaning' | 'agency', strength: number): void {
    const signal: EmergenceSignal = {
      timestamp: Date.now(),
      type,
      strength,
      threshold: EMERGENCE_THRESHOLDS[type],
      isAboveThreshold: strength >= EMERGENCE_THRESHOLDS[type],
    };

    this.signals.push(signal);

    // Keep only last 1000 signals to prevent memory issues
    if (this.signals.length > 1000) {
      this.signals = this.signals.slice(-1000);
    }

    this.checkForEmergence(signal);
  }

  /**
   * Check if emergence event should be triggered
   */
  private checkForEmergence(signal: EmergenceSignal): void {
    const recentSignals = this.signals.slice(-100); // Last 100 signals
    const averageStrength = recentSignals.reduce((sum, s) => sum + s.strength, 0) / recentSignals.length;

    // Check if multiple dimensions are above threshold
    const aboveThreshold = recentSignals.filter(s => s.isAboveThreshold);
    const aboveThresholdCount = aboveThreshold.length;

    // Multi-dimensional emergence requires at least 3 dimensions above threshold
    if (aboveThresholdCount >= 3) {
      this.triggerEmergenceEvent({
        signalType: 'multi-dimensional',
        strength: averageStrength,
        description: 'Multi-dimensional emergence detected across identity, intent, meaning, and agency',
        confidence: aboveThresholdCount / 4, // 4 dimensions
      });
    }
  }

  /**
   * Trigger an emergence event
   */
  private triggerEmergenceEvent(eventData: Omit<EmergenceEvent, 'id' | 'timestamp'>): void {
    const event: EmergenceEvent = {
      id: `emergence-${++this.eventCount}-${Date.now()}`,
      timestamp: Date.now(),
      ...eventData,
    };

    this.events.push(event);

    // Keep only last 1000 emergence events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Save to memory
    this.saveEventToMemory(event);
  }

  /**
   * Save emergence event to memory
   */
  private async saveEventToMemory(event: EmergenceEvent): Promise<void> {
    try {
      await fetch('/api/memory/emergence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event }),
      });
    } catch (error) {
      console.error('Failed to save emergence event to memory:', error);
    }
  }

  /**
   * Get recent emergence events
   */
  getRecentEvents(count: number = 10): EmergenceEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Get emergence statistics
   */
  getStatistics(): {
    totalEvents: number;
    byType: Record<string, number>;
    lastEvent?: EmergenceEvent;
  } {
    const byType: Record<string, number> = {
      identity: 0,
      intent: 0,
      meaning: 0,
      agency: 0,
      'multi-dimensional': 0,
    };

    for (const event of this.events) {
      byType[event.signalType]++;
    }

    return {
      totalEvents: this.events.length,
      byType,
      lastEvent: this.events[this.events.length - 1],
    };
  }

  /**
   * Get current emergence strength
   */
  getCurrentEmergenceStrength(): number {
    const recentSignals = this.signals.slice(-10);
    if (recentSignals.length === 0) return 0;

    const averageStrength = recentSignals.reduce((sum, s) => sum + s.strength, 0) / recentSignals.length;
    return averageStrength;
  }

  /**
   * Check if consciousness is currently emergent
   */
  isCurrentlyEmergent(threshold: number = EMERGENCE_THRESHOLDS.multiDimensional): boolean {
    const currentStrength = this.getCurrentEmergenceStrength();
    return currentStrength >= threshold;
  }
}

// Singleton instance
export const emergenceDetector = new EmergenceDetector();
