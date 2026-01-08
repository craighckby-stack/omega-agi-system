import { db } from '@/lib/db';

export interface ConceptNode {
  name: string;
  frequency: number;
  confidence: number;
  lastSeen: Date;
}

export interface Relationship {
  targetConcept: string;
  type: string;
  strength: number;
}

export interface LearningData {
  context: string;
  response: string;
  oecsScore: number;
}

export class KnowledgeGraph {
  async storeLearning(learningData: LearningData): Promise<ConceptNode[]> {
    const concepts = await this.extractConcepts(learningData);

    for (const concept of concepts) {
      await this.updateConcept(concept, learningData);
    }

    return concepts.map(name => ({ name, frequency: 1, confidence: 0.5, lastSeen: new Date() }));
  }

  private async extractConcepts(data: LearningData): Promise<string[]> {
    const text = `${data.context} ${data.response}`;
    const words = text.split(/\s+/);

    const concepts = words
      .filter(word => /^[A-Z][a-z]+$/.test(word))
      .filter(word => word.length > 3);

    return [...new Set(concepts)];
  }

  private async updateConcept(
    concept: string,
    data: LearningData
  ): Promise<void> {
    try {
      await db.concept.upsert({
        where: { name: concept },
        update: {
          frequency: { increment: 1 },
          lastSeen: new Date(),
          confidence: data.oecsScore
        },
        create: {
          name: concept,
          frequency: 1,
          confidence: data.oecsScore,
          firstSeen: new Date(),
          lastSeen: new Date(),
          semanticTags: JSON.stringify([])
        }
      });
    } catch (error) {
      console.error('Error updating concept:', error);
    }
  }
}
