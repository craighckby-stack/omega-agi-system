/**
 * Memory Layer - Experience Database
 * Stores learning contexts, task histories, and experience metadata
 */

export interface ExperienceRecord {
  id: string;
  timestamp: number;
  context: {
    domain: string;
    taskType: string;
    environment: string;
    sessionId?: string;
    userId?: string;
  };
  task: {
    id: string;
    description: string;
    type: string;
    inputs?: any;
    outputs?: any;
    success: boolean;
    duration: number;
  };
  performance: {
    accuracy: number;
    efficiency: number;
    quality: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network: number;
    };
  };
  learning: {
    newConceptsLearned: string[];
    skillsImproved: string[];
    errorsEncountered: string[];
    adaptationsMade: string[];
  };
  metadata: {
    tags: string[];
    priority: number;
    source: 'agent' | 'user' | 'system' | 'external';
    reviewStatus: 'pending' | 'reviewed' | 'validated';
  };
}

export interface ExperienceQuery {
  domains?: string[];
  taskTypes?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  successOnly?: boolean;
  minPriority?: number;
  tags?: string[];
  limit?: number;
}

export const EXPERIENCE_CATEGORIES = {
  learning: 'learning',
  performance: 'performance',
  error_recovery: 'error_recovery',
  optimization: 'optimization',
  debugging: 'debugging',
} as const;

/**
 * Experience Database Class
 * Manages storage and retrieval of experience records
 */
export class ExperienceDatabase {
  private experiences: ExperienceRecord[] = [];
  private indexByDomain: Map<string, Set<string>> = new Map();
  private indexByTaskType: Map<string, Set<string>> = new Map();
  private indexBySuccess: Map<boolean, Set<string>> = new Map();
  private indexByTag: Map<string, Set<string>> = new Map();

  constructor() {
    this.loadExperiences();
  }

  /**
   * Load experiences from memory
   */
  private async loadExperiences(): Promise<void> {
    try {
      const response = await fetch('/api/memory/experiences');
      const data = await response.json();
      this.experiences = data.experiences || [];
      this.rebuildIndexes();
    } catch (error) {
      console.error('Failed to load experiences:', error);
    }
  }

  /**
   * Rebuild all search indexes
   */
  private rebuildIndexes(): void {
    this.indexByDomain.clear();
    this.indexByTaskType.clear();
    this.indexBySuccess.clear();
    this.indexByTag.clear();

    for (const experience of this.experiences) {
      // Domain index
      const domainSet = this.indexByDomain.get(experience.context.domain) || new Set();
      domainSet.add(experience.id);
      this.indexByDomain.set(experience.context.domain, domainSet);

      // Task type index
      const taskTypeSet = this.indexByTaskType.get(experience.task.type) || new Set();
      taskTypeSet.add(experience.id);
      this.indexByTaskType.set(experience.task.type, taskTypeSet);

      // Success index
      const successSet = this.indexBySuccess.get(experience.task.success) || new Set();
      successSet.add(experience.id);
      this.indexBySuccess.set(experience.task.success, successSet);

      // Tag indexes
      for (const tag of experience.metadata.tags) {
        const tagSet = this.indexByTag.get(tag) || new Set();
        tagSet.add(experience.id);
        this.indexByTag.set(tag, tagSet);
      }
    }
  }

  /**
   * Store a new experience
   */
  async storeExperience(experience: Omit<ExperienceRecord, 'id' | 'timestamp'>): Promise<ExperienceRecord> {
    const record: ExperienceRecord = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...experience,
    };

    this.experiences.push(record);
    this.updateIndexes(record);

    // Save to persistent storage
    await this.saveExperience(record);

    return record;
  }

  /**
   * Update indexes for new experience
   */
  private updateIndexes(experience: ExperienceRecord): void {
    const { id, context, task, metadata } = experience;

    // Domain index
    const domainSet = this.indexByDomain.get(context.domain) || new Set();
    domainSet.add(id);
    this.indexByDomain.set(context.domain, domainSet);

    // Task type index
    const taskTypeSet = this.indexByTaskType.get(task.type) || new Set();
    taskTypeSet.add(id);
    this.indexByTaskType.set(task.type, taskTypeSet);

    // Success index
    const successSet = this.indexBySuccess.get(task.success) || new Set();
    successSet.add(id);
    this.indexBySuccess.set(task.success, successSet);

    // Tag indexes
    for (const tag of metadata.tags) {
      const tagSet = this.indexByTag.get(tag) || new Set();
      tagSet.add(id);
      this.indexByTag.set(tag, tagSet);
    }
  }

  /**
   * Save experience to persistent memory
   */
  private async saveExperience(experience: ExperienceRecord): Promise<void> {
    try {
      await fetch('/api/memory/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'experience',
          data: experience,
        }),
      });
    } catch (error) {
      console.error('Failed to save experience:', error);
    }
  }

  /**
   * Query experiences based on criteria
   */
  query(criteria: ExperienceQuery): ExperienceRecord[] {
    let results = [...this.experiences];

    // Filter by time range
    if (criteria.timeRange) {
      results = results.filter(exp =>
        exp.timestamp >= criteria.timeRange.start &&
        exp.timestamp <= criteria.timeRange.end
      );
    }

    // Filter by domains
    if (criteria.domains && criteria.domains.length > 0) {
      const domainIds = new Set<string>();
      for (const domain of criteria.domains) {
        const domainSet = this.indexByDomain.get(domain);
        if (domainSet) {
          domainSet.forEach(id => domainIds.add(id));
        }
      }
      results = results.filter(exp => domainIds.has(exp.id));
    }

    // Filter by task types
    if (criteria.taskTypes && criteria.taskTypes.length > 0) {
      const typeIds = new Set<string>();
      for (const type of criteria.taskTypes) {
        const typeSet = this.indexByTaskType.get(type);
        if (typeSet) {
          typeSet.forEach(id => typeIds.add(id));
        }
      }
      results = results.filter(exp => typeIds.has(exp.id));
    }

    // Filter by success
    if (criteria.successOnly !== undefined) {
      const successSet = this.indexBySuccess.get(criteria.successOnly);
      if (successSet) {
        results = results.filter(exp => successSet.has(exp.id));
      }
    }

    // Filter by minimum priority
    if (criteria.minPriority !== undefined) {
      results = results.filter(exp =>
        exp.metadata.priority >= criteria.minPriority
      );
    }

    // Filter by tags
    if (criteria.tags && criteria.tags.length > 0) {
      const tagIds = new Set<string>();
      for (const tag of criteria.tags) {
        const tagSet = this.indexByTag.get(tag);
        if (tagSet) {
          tagSet.forEach(id => tagIds.add(id));
        }
      }
      results = results.filter(exp => tagIds.has(exp.id));
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Get similar experiences
   */
  getSimilarExperiences(experience: Omit<ExperienceRecord, 'id' | 'timestamp'>, limit: number = 10): ExperienceRecord[] {
    const { context, task, metadata } = experience;

    // Find experiences in same domain
    const domainExperiences = this.query({
      domains: [context.domain],
      limit: 100, // Get more to compare
    });

    // Calculate similarity score
    const scoredExperiences = domainExperiences.map(exp => {
      let similarity = 0;

      // Task type similarity (high weight)
      if (exp.task.type === task.type) similarity += 0.4;

      // Task description similarity
      if (exp.task.description && task.description) {
        const desc1 = exp.task.description.toLowerCase();
        const desc2 = task.description.toLowerCase();
        const words1 = new Set(desc1.split(' '));
        const words2 = new Set(desc2.split(' '));
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        similarity += (intersection.size / union.size) * 0.3;
      }

      // Domain similarity (medium weight)
      if (exp.context.domain === context.domain) similarity += 0.2;

      // Tag overlap (medium weight)
      const tagOverlap = exp.metadata.tags.filter(tag =>
        metadata.tags.includes(tag)
      );
      if (metadata.tags.length > 0) {
        similarity += (tagOverlap.length / metadata.tags.length) * 0.1;
      }

      return {
        experience: exp,
        similarity,
      };
    });

    // Sort by similarity and return top N
    scoredExperiences.sort((a, b) => b.similarity - a.similarity);

    return scoredExperiences.slice(0, limit).map(se => se.experience);
  }

  /**
   * Get experiences by category
   */
  getExperiencesByCategory(category: keyof typeof EXPERIENCE_CATEGORIES): ExperienceRecord[] {
    switch (category) {
      case 'learning':
        return this.experiences.filter(exp =>
          exp.learning.newConceptsLearned.length > 0 ||
          exp.learning.skillsImproved.length > 0
        );

      case 'performance':
        return this.experiences.filter(exp =>
          exp.performance.accuracy > 0.7 ||
          exp.performance.efficiency > 0.7
        );

      case 'error_recovery':
        return this.experiences.filter(exp =>
          exp.learning.errorsEncountered.length > 0 &&
          exp.task.success === false
        );

      case 'optimization':
        return this.experiences.filter(exp =>
          exp.learning.adaptationsMade.length > 0 &&
          exp.performance.efficiency > 0.8
        );

      case 'debugging':
        return this.experiences.filter(exp =>
          exp.task.type === 'debugging' ||
          exp.task.description.toLowerCase().includes('debug')
        );

      default:
        return this.experiences;
    }
  }

  /**
   * Get experience statistics
   */
  getStatistics(): {
    totalExperiences: number;
    byDomain: Record<string, number>;
    byTaskType: Record<string, number>;
    byCategory: Record<string, number>;
    successRate: number;
    averagePerformance: {
      accuracy: number;
      efficiency: number;
      quality: number;
    };
    totalLearningOutcomes: {
      conceptsLearned: number;
      skillsImproved: number;
      errorsEncountered: number;
      adaptationsMade: number;
    };
  } {
    const total = this.experiences.length;

    // Count by domain
    const byDomain: Record<string, number> = {};
    for (const exp of this.experiences) {
      byDomain[exp.context.domain] = (byDomain[exp.context.domain] || 0) + 1;
    }

    // Count by task type
    const byTaskType: Record<string, number> = {};
    for (const exp of this.experiences) {
      byTaskType[exp.task.type] = (byTaskType[exp.task.type] || 0) + 1;
    }

    // Count by category
    const byCategory: Record<string, number> = {};
    for (const category of Object.keys(EXPERIENCE_CATEGORIES)) {
      byCategory[category] = this.getExperiencesByCategory(category as keyof typeof EXPERIENCE_CATEGORIES).length;
    }

    // Calculate success rate
    const successfulExperiences = this.experiences.filter(exp => exp.task.success).length;
    const successRate = total > 0 ? successfulExperiences / total : 0;

    // Calculate average performance
    const accuracySum = this.experiences.reduce((sum, exp) => sum + exp.performance.accuracy, 0);
    const efficiencySum = this.experiences.reduce((sum, exp) => sum + exp.performance.efficiency, 0);
    const qualitySum = this.experiences.reduce((sum, exp) => sum + exp.performance.quality, 0);

    const averagePerformance = {
      accuracy: total > 0 ? accuracySum / total : 0,
      efficiency: total > 0 ? efficiencySum / total : 0,
      quality: total > 0 ? qualitySum / total : 0,
    };

    // Calculate learning outcomes
    const totalConceptsLearned = this.experiences.reduce((sum, exp) => sum + exp.learning.newConceptsLearned.length, 0);
    const totalSkillsImproved = this.experiences.reduce((sum, exp) => sum + exp.learning.skillsImproved.length, 0);
    const totalErrorsEncountered = this.experiences.reduce((sum, exp) => sum + exp.learning.errorsEncountered.length, 0);
    const totalAdaptationsMade = this.experiences.reduce((sum, exp) => sum + exp.learning.adaptationsMade.length, 0);

    const totalLearningOutcomes = {
      conceptsLearned: totalConceptsLearned,
      skillsImproved: totalSkillsImproved,
      errorsEncountered: totalErrorsEncountered,
      adaptationsMade: totalAdaptationsMade,
    };

    return {
      totalExperiences: total,
      byDomain,
      byTaskType,
      byCategory,
      successRate,
      averagePerformance,
      totalLearningOutcomes,
    };
  }

  /**
   * Delete old experiences
   */
  async deleteOldExperiences(maxAgeDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    const oldExperienceIds: string[] = [];

    for (let i = this.experiences.length - 1; i >= 0; i--) {
      if (this.experiences[i].timestamp < cutoffTime) {
        oldExperienceIds.push(this.experiences[i].id);
      }
    }

    // Delete from array
    this.experiences = this.experiences.filter(exp => !oldExperienceIds.includes(exp.id));

    // Rebuild indexes
    this.rebuildIndexes();

    // Delete from persistent storage
    for (const id of oldExperienceIds) {
      try {
        await fetch('/api/memory/experiences', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
      } catch (error) {
        console.error(`Failed to delete experience ${id}:`, error);
      }
    }

    return oldExperienceIds.length;
  }

  /**
   * Export experiences
   */
  exportExperiences(format: 'json' | 'csv' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.experiences, null, 2);

      case 'csv':
        const headers = ['id', 'timestamp', 'domain', 'taskType', 'taskSuccess', 'duration', 'accuracy', 'efficiency', 'quality'];
        const rows = this.experiences.map(exp => [
          exp.id,
          new Date(exp.timestamp).toISOString(),
          exp.context.domain,
          exp.task.type,
          exp.task.success,
          exp.task.duration,
          exp.performance.accuracy,
          exp.performance.efficiency,
          exp.performance.quality,
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

// Singleton instance
export const experienceDatabase = new ExperienceDatabase();
