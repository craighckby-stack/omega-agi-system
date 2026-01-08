/**
 * Memory Layer - Semantic Tagging System
 * Automatically tags experiences with semantic categories for retrieval
 */

export interface SemanticTag {
  id: string;
  name: string;
  category: 'domain' | 'task_type' | 'difficulty' | 'outcome' | 'quality' | 'pattern' | 'custom';
  confidence: number; // 0.0 to 1.0
  color?: string;
  icon?: string;
}

export interface TaggedExperience {
  experienceId: string;
  tags: SemanticTag[];
  semanticVector: number[]; // Embedding vector for semantic search
  similarityScore: number;
}

export const TAG_CATEGORIES = {
  domain: {
    description: 'Domain-specific tags',
    icon: 'Globe',
    color: '#3B82F6',
  },
  task_type: {
    description: 'Task classification tags',
    icon: 'Zap',
    color: '#F59E0B',
  },
  difficulty: {
    description: 'Complexity and difficulty tags',
    icon: 'Target',
    color: '#EF4444',
  },
  outcome: {
    description: 'Result outcome tags',
    icon: 'CheckCircle',
    color: '#10B981',
  },
  quality: {
    description: 'Quality assessment tags',
    icon: 'Star',
    color: '#FBBF24',
  },
  pattern: {
    description: 'Recurring pattern tags',
    icon: 'Layers',
    color: '#8B5CF6',
  },
  custom: {
    description: 'User-defined custom tags',
    icon: 'Tag',
    color: '#6B7280',
  },
} as const;

/**
 * Semantic Tagging Engine
 * Analyzes experiences and applies semantic tags automatically
 */
export class SemanticTaggingEngine {
  private tagDefinitions: Map<string, SemanticTag[]> = new Map();
  private taggedExperiences: Map<string, TaggedExperience> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.initializeTagDefinitions();
  }

  /**
   * Initialize default tag definitions
   */
  private initializeTagDefinitions(): void {
    // Domain tags
    this.tagDefinitions.set('domain', [
      { id: 'dom-web', name: 'Web Development', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Globe' },
      { id: 'dom-ml', name: 'Machine Learning', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Brain' },
      { id: 'dom-data', name: 'Data Science', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Database' },
      { id: 'dom-security', name: 'Security', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Shield' },
      { id: 'dom-devops', name: 'DevOps', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Server' },
      { id: 'dom-nlp', name: 'NLP', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'MessageSquare' },
      { id: 'dom-computer-vision', name: 'Computer Vision', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Eye' },
      { id: 'dom-robotics', name: 'Robotics', category: 'domain', confidence: 0.9, color: '#3B82F6', icon: 'Bot' },
    ]);

    // Task type tags
    this.tagDefinitions.set('task_type', [
      { id: 'type-analysis', name: 'Analysis', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'Search' },
      { id: 'type-generation', name: 'Generation', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'Sparkles' },
      { id: 'type-classification', name: 'Classification', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'Layers' },
      { id: 'type-optimization', name: 'Optimization', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'Zap' },
      { id: 'type-debugging', name: 'Debugging', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'Bug' },
      { id: 'type-testing', name: 'Testing', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'CheckSquare' },
      { id: 'type-refactoring', name: 'Refactoring', category: 'task_type', confidence: 0.9, color: '#F59E0B', icon: 'RefreshCw' },
    ]);

    // Difficulty tags
    this.tagDefinitions.set('difficulty', [
      { id: 'diff-trivial', name: 'Trivial', category: 'difficulty', confidence: 0.9, color: '#10B981', icon: 'Target' },
      { id: 'diff-easy', name: 'Easy', category: 'difficulty', confidence: 0.9, color: '#10B981', icon: 'Target' },
      { id: 'diff-medium', name: 'Medium', category: 'difficulty', confidence: 0.9, color: '#F59E0B', icon: 'Target' },
      { id: 'diff-hard', name: 'Hard', category: 'difficulty', confidence: 0.9, color: '#EF4444', icon: 'Target' },
      { id: 'diff-expert', name: 'Expert', category: 'difficulty', confidence: 0.9, color: '#EF4444', icon: 'Target' },
    ]);

    // Outcome tags
    this.tagDefinitions.set('outcome', [
      { id: 'out-success', name: 'Success', category: 'outcome', confidence: 0.95, color: '#10B981', icon: 'CheckCircle' },
      { id: 'out-partial', name: 'Partial Success', category: 'outcome', confidence: 0.9, color: '#F59E0B', icon: 'MinusCircle' },
      { id: 'out-failure', name: 'Failure', category: 'outcome', confidence: 0.95, color: '#EF4444', icon: 'XCircle' },
      { id: 'out-timeout', name: 'Timeout', category: 'outcome', confidence: 0.9, color: '#F59E0B', icon: 'Clock' },
      { id: 'out-error', name: 'Error', category: 'outcome', confidence: 0.95, color: '#EF4444', icon: 'AlertTriangle' },
    ]);

    // Quality tags
    this.tagDefinitions.set('quality', [
      { id: 'qual-excellent', name: 'Excellent', category: 'quality', confidence: 0.9, color: '#10B981', icon: 'Star' },
      { id: 'qual-good', name: 'Good', category: 'quality', confidence: 0.85, color: '#FBBF24', icon: 'Star' },
      { id: 'qual-acceptable', name: 'Acceptable', category: 'quality', confidence: 0.75, color: '#F59E0B', icon: 'Star' },
      { id: 'qual-poor', name: 'Poor', category: 'quality', confidence: 0.6, color: '#EF4444', icon: 'Star' },
      { id: 'qual-critical', name: 'Critical', category: 'quality', confidence: 0.9, color: '#EF4444', icon: 'AlertTriangle' },
    ]);

    // Pattern tags
    this.tagDefinitions.set('pattern', [
      { id: 'pat-recurring', name: 'Recurring Issue', category: 'pattern', confidence: 0.8, color: '#8B5CF6', icon: 'RotateCcw' },
      { id: 'pat-first-time', name: 'First Time Issue', category: 'pattern', confidence: 0.7, color: '#3B82F6', icon: 'HelpCircle' },
      { id: 'pat-high-frequency', name: 'High Frequency', category: 'pattern', confidence: 0.9, color: '#F59E0B', icon: 'Activity' },
      { id: 'pat-seasonal', name: 'Seasonal Pattern', category: 'pattern', confidence: 0.75, color: '#FBBF24', icon: 'Calendar' },
    ]);
  }

  /**
   * Auto-tag an experience
   */
  async tagExperience(experience: {
    id: string;
    description: string;
    taskType: string;
    domain: string;
    duration: number;
    success: boolean;
    performance: {
      accuracy: number;
      efficiency: number;
      quality: number;
    };
  }): Promise<TaggedExperience> {
    const tags: SemanticTag[] = [];

    // Auto-tag based on experience properties

    // Domain tag
    const domainTag = this.findMatchingDomainTag(experience.domain);
    if (domainTag) {
      tags.push(domainTag);
    }

    // Task type tag
    const taskTypeTag = this.findMatchingTaskTypeTag(experience.taskType);
    if (taskTypeTag) {
      tags.push(taskTypeTag);
    }

    // Difficulty tag
    const difficultyTag = this.calculateDifficultyTag(experience);
    if (difficultyTag) {
      tags.push(difficultyTag);
    }

    // Outcome tag
    const outcomeTag = this.determineOutcomeTag(experience.success, experience.performance);
    if (outcomeTag) {
      tags.push(outcomeTag);
    }

    // Quality tag
    const qualityTag = this.calculateQualityTag(experience.performance);
    if (qualityTag) {
      tags.push(qualityTag);
    }

    // Pattern tags
    const patternTags = await this.detectPatterns(experience);
    tags.push(...patternTags);

    // Generate semantic vector
    const semanticVector = this.generateSemanticVector(experience);

    // Calculate similarity scores
    const similarityScores = await this.calculateTagSimilarity(tags, experience);

    const taggedExperience: TaggedExperience = {
      experienceId: experience.id,
      tags: tags.map(tag => ({
        ...tag,
        confidence: tag.confidence * similarityScores[tag.id],
      })),
      semanticVector,
      similarityScore: similarityScores.global,
    };

    // Cache and save
    this.embeddingCache.set(experience.id, semanticVector);
    this.taggedExperiences.set(experience.id, taggedExperience);
    await this.saveTaggedExperience(taggedExperience);

    return taggedExperience;
  }

  /**
   * Find matching domain tag
   */
  private findMatchingDomainTag(domain: string): SemanticTag | null {
    const domainTags = this.tagDefinitions.get('domain') || [];

    const exactMatch = domainTags.find(tag =>
      tag.name.toLowerCase() === domain.toLowerCase()
    );

    if (exactMatch) {
      return { ...exactMatch, confidence: 1.0 };
    }

    // Partial match
    const partialMatch = domainTags.find(tag =>
      tag.name.toLowerCase().includes(domain.toLowerCase()) ||
      domain.toLowerCase().includes(tag.name.toLowerCase())
    );

    if (partialMatch) {
      return { ...partialMatch, confidence: 0.85 };
    }

    // Keyword match
    const domainKeywords = new Map<string, string>([
      ['web', 'frontend', 'frontend', 'backend', 'fullstack', 'api', 'http', 'css', 'html', 'javascript'], 'dom-web',
      ['machine', 'learning', 'ml', 'deep', 'neural', 'model', 'ai', 'training', 'data', 'algorithm', 'python', 'tensorflow', 'pytorch'], 'dom-ml',
      ['data', 'science', 'analytics', 'statistics', 'sql', 'database', 'etl', 'pipeline', 'visualization'], 'dom-data',
      ['security', 'cyber', 'auth', 'encryption', 'crypto', 'firewall', 'vulnerability', 'penetration', 'hack'], 'dom-security',
      ['devops', 'ops', 'deploy', 'ci/cd', 'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'infrastructure', 'server'], 'dom-devops',
      ['nlp', 'text', 'language', 'sentiment', 'tokenization', 'embedding', 'transformer', 'gpt', 'llm', 'chatbot'], 'dom-nlp',
      ['vision', 'image', 'video', 'detection', 'recognition', 'segmentation', 'object', 'classification', 'yolo', 'opencv'], 'dom-computer-vision',
      ['robot', 'robotics', 'autonomous', 'control', 'navigation', 'planning', 'pathfinding', 'manipulation', 'simulator'], 'dom-robotics',
    ]);

    for (const [domain, keywords] of domainKeywords.entries()) {
      if (keywords.some(keyword => experience.domain.toLowerCase().includes(keyword))) {
        const tag = domainTags.find(t => t.id === domain);
        return tag ? { ...tag, confidence: 0.7 } : null;
      }
    }

    return null;
  }

  /**
   * Find matching task type tag
   */
  private findMatchingTaskTypeTag(taskType: string): SemanticTag | null {
    const taskTypeTags = this.tagDefinitions.get('task_type') || [];

    const exactMatch = taskTypeTags.find(tag =>
      tag.name.toLowerCase() === taskType.toLowerCase()
    );

    if (exactMatch) {
      return { ...exactMatch, confidence: 1.0 };
    }

    const partialMatch = taskTypeTags.find(tag =>
      tag.name.toLowerCase().includes(taskType.toLowerCase()) ||
      taskType.toLowerCase().includes(tag.name.toLowerCase())
    );

    if (partialMatch) {
      return { ...partialMatch, confidence: 0.85 };
    }

    return null;
  }

  /**
   * Calculate difficulty tag
   */
  private calculateDifficultyTag(experience: {
    duration: number;
    success: boolean;
  }): SemanticTag | null {
    const difficultyTags = this.tagDefinitions.get('difficulty') || [];

    // Based on duration and success
    if (experience.success) {
      if (experience.duration < 60000) { // < 1 minute
        return { ...difficultyTags[0], confidence: 0.8 }; // Trivial
      } else if (experience.duration < 600000) { // < 10 minutes
        return { ...difficultyTags[1], confidence: 0.85 }; // Easy
      } else if (experience.duration < 3600000) { // < 1 hour
        return { ...difficultyTags[2], confidence: 0.9 }; // Medium
      } else if (experience.duration < 14400000) { // < 4 hours
        return { ...difficultyTags[3], confidence: 0.85 }; // Hard
      } else {
        return { ...difficultyTags[4], confidence: 0.8 }; // Expert
      }
    } else {
      // Failed tasks are usually at least medium
      if (experience.duration < 3600000) { // < 1 hour
        return { ...difficultyTags[2], confidence: 0.75 }; // Medium
      } else {
        return { ...difficultyTags[3], confidence: 0.7 }; // Hard
      }
    }
  }

  /**
   * Determine outcome tag
   */
  private determineOutcomeTag(success: boolean, performance: any): SemanticTag | null {
    const outcomeTags = this.tagDefinitions.get('outcome') || [];

    if (!success) {
      if (performance && performance.error) {
        return { ...outcomeTags[4], confidence: 0.95 }; // Error
      } else {
        return { ...outcomeTags[2], confidence: 0.9 }; // Failure
      }
    } else {
      return { ...outcomeTags[0], confidence: 1.0 }; // Success
    }
  }

  /**
   * Calculate quality tag
   */
  private calculateQualityTag(performance: {
    accuracy: number;
    efficiency: number;
    quality: number;
  }): SemanticTag | null {
    const qualityTags = this.tagDefinitions.get('quality') || [];

    // Average the performance metrics
    const averageScore = (performance.accuracy + performance.efficiency + performance.quality) / 3;

    if (averageScore >= 0.9) {
      return { ...qualityTags[0], confidence: 0.9 }; // Excellent
    } else if (averageScore >= 0.8) {
      return { ...qualityTags[1], confidence: 0.85 }; // Good
    } else if (averageScore >= 0.6) {
      return { ...qualityTags[2], confidence: 0.8 }; // Acceptable
    } else if (averageScore >= 0.4) {
      return { ...qualityTags[3], confidence: 0.75 }; // Poor
    } else {
      return { ...qualityTags[4], confidence: 0.7 }; // Critical
    }
  }

  /**
   * Detect patterns in experience
   */
  private async detectPatterns(experience: {
    id: string;
    description: string;
  }): Promise<SemanticTag[]> {
    const patternTags: SemanticTag[] = [];

    // This would query the experience database to look for patterns
    // For now, we'll add some basic pattern detection

    // Check for "first time" patterns (simplified)
    // In a real implementation, this would query similar experiences
    // and check if this is a recurring issue

    return patternTags;
  }

  /**
   * Generate semantic vector for text
   */
  private generateSemanticVector(experience: any): number[] {
    // In a real implementation, this would:
    // 1. Use a word embedding model (e.g., BERT, GPT)
    // 2. Generate embeddings for experience text
    // 3. Return the vector for semantic search

    // For now, we'll create a simple hash-based vector
    const text = `${experience.description || ''} ${experience.taskType || ''} ${experience.domain || ''}`;
    const vector = new Array(384).fill(0); // 384-dimensional embedding

    // Simple hash-based vector (for demo purposes)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash + text.charCodeAt(i) * 31) % 2147483647;
      vector[i % 384] = (hash % 1000) / 1000; // Normalize to 0-1
    }

    return vector;
  }

  /**
   * Calculate tag similarity
   */
  private async calculateTagSimilarity(tags: SemanticTag[], experience: any): Promise<Record<string, number> & { global: number }> {
    const similarities: Record<string, number> = {};

    // Calculate how similar each tag is to the experience
    for (const tag of tags) {
      let similarity = 0;

      // Domain similarity
      if (tag.category === 'domain' && tag.id === `dom-${experience.domain.toLowerCase().replace(/\s+/g, '-')}`) {
        similarity += 0.3;
      }

      // Task type similarity
      if (tag.category === 'task_type' && tag.id === `type-${experience.taskType.toLowerCase()}`) {
        similarity += 0.3;
      }

      // Outcome similarity
      if (tag.category === 'outcome') {
        const outcome = experience.success ? 'success' : 'failure';
        if (tag.id === `out-${outcome}`) {
          similarity += 0.3;
        }
      }

      similarities[tag.id] = similarity;
    }

    // Calculate global similarity
    const global = Object.values(similarities).reduce((sum, s) => sum + s, 0) / Object.keys(similarities).length;

    return { ...similarities, global };
  }

  /**
   * Query tagged experiences
   */
  queryExperiences(query: {
    tags?: string[];
    categories?: string[];
    threshold?: number;
    limit?: number;
  }): TaggedExperience[] {
    let results = Array.from(this.taggedExperiences.values());

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(exp =>
        query.tags.some(tagId =>
          exp.tags.some(t => t.id === tagId)
        )
      );
    }

    // Filter by categories
    if (query.categories && query.categories.length > 0) {
      results = results.filter(exp =>
        query.categories.some(category =>
          exp.tags.some(t => t.category === category)
        )
      );
    }

    // Filter by similarity threshold
    if (query.threshold !== undefined && query.threshold > 0) {
      results = results.filter(exp => exp.similarityScore >= query.threshold);
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarityScore - a.similarityScore);

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get all tags
   */
  getAllTags(category?: string): SemanticTag[] {
    if (category) {
      return this.tagDefinitions.get(category) || [];
    }

    const allTags: SemanticTag[] = [];
    for (const [cat, tags] of this.tagDefinitions.entries()) {
      allTags.push(...tags);
    }

    return allTags;
  }

  /**
   * Add custom tag
   */
  addCustomTag(tag: Omit<SemanticTag, 'id'>): SemanticTag {
    const newTag: SemanticTag = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      category: 'custom',
      confidence: 1.0,
      ...tag,
    };

    const existingTags = this.tagDefinitions.get('custom') || [];
    existingTags.push(newTag);
    this.tagDefinitions.set('custom', existingTags);

    // Save to memory
    this.saveTagDefinition(newTag);

    return newTag;
  }

  /**
   * Remove tag
   */
  removeTag(tagId: string): void {
    for (const [category, tags] of this.tagDefinitions.entries()) {
      const index = tags.findIndex(t => t.id === tagId);
      if (index !== -1) {
        tags.splice(index, 1);
        this.tagDefinitions.set(category, tags);
        break;
      }
    }
  }

  /**
   * Save tag definition to memory
   */
  private async saveTagDefinition(tag: SemanticTag): Promise<void> {
    try {
      await fetch('/api/memory/semantic-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tag_definition',
          data: tag,
        }),
      });
    } catch (error) {
      console.error('Failed to save tag definition:', error);
    }
  }

  /**
   * Save tagged experience to memory
   */
  private async saveTaggedExperience(tagged: TaggedExperience): Promise<void> {
    try {
      await fetch('/api/memory/semantic-tagging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tagged_experience',
          data: tagged,
        }),
      });
    } catch (error) {
      console.error('Failed to save tagged experience:', error);
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalExperiences: number;
    totalTags: number;
    byCategory: Record<string, number>;
    averageTagsPerExperience: number;
    mostUsedTags: Array<{ tag: SemanticTag; count: number }>;
  } {
    const totalExperiences = this.taggedExperiences.size;

    const totalTags = Array.from(this.tagDefinitions.values())
      .flat()
      .length;

    const byCategory: Record<string, number> = {};
    for (const [category, tags] of this.tagDefinitions.entries()) {
      byCategory[category] = tags.length;
    }

    let totalTagsApplied = 0;
    for (const tagged of this.taggedExperiences.values()) {
      totalTagsApplied += tagged.tags.length;
    }

    const averageTagsPerExperience = totalExperiences > 0 ? totalTagsApplied / totalExperiences : 0;

    // Count tag usage
    const tagUsageCount = new Map<string, number>();
    for (const tagged of this.taggedExperiences.values()) {
      for (const tag of tagged.tags) {
        const count = tagUsageCount.get(tag.id) || 0;
        tagUsageCount.set(tag.id, count + 1);
      }
    }

    const mostUsedTags = Array.from(tagUsageCount.entries())
      .map(([tagId, count]) => ({
        tag: this.findTagById(tagId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({ tag: item.tag!, count: item.count }));

    return {
      totalExperiences,
      totalTags,
      byCategory,
      averageTagsPerExperience,
      mostUsedTags,
    };
  }

  /**
   * Find tag by ID
   */
  private findTagById(tagId: string): SemanticTag | null {
    for (const tags of this.tagDefinitions.values()) {
      const tag = tags.find(t => t.id === tagId);
      if (tag) return tag;
    }
    return null;
  }
}

// Singleton instance
export const semanticTaggingEngine = new SemanticTaggingEngine();
