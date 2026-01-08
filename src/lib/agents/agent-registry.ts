export interface AgentConfig {
  id: string;
  name: string;
  domain: string;
  expertise: string[];
  capabilities: string[];
  version: string;
}

export interface Agent {
  id: string;
  config: AgentConfig;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  metrics: {
    totalTasks: number;
    successfulTasks: number;
    avgResponseTime: number;
  };
}

export interface Task {
  id: string;
  domain: string;
  query: string;
  priority: number;
  timestamp: number;
}

export interface AgentResult {
  agentId: string;
  response: string;
  confidence: number;
  reasoning: string;
  duration: number;
  errors: string[];
}

export interface SynthesisResult {
  queryId: string;
  agentResults: AgentResult[];
  synthesizedOutput: string;
  confidence: number;
}

export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  // Scientific Division
  'theoretical-chemist': {
    id: 'theoretical-chemist',
    name: 'Theoretical Chemist',
    domain: 'Chemistry',
    expertise: ['molecular-structure', 'quantum-behavior', 'chemical-systems'],
    capabilities: ['analysis', 'simulation', 'prediction'],
    version: '1.0.0'
  },
  'systems-ecologist': {
    id: 'systems-ecologist',
    name: 'Systems Ecologist',
    domain: 'Ecology',
    expertise: ['environmental-impact', 'systemic-relationships', 'resource-networks'],
    capabilities: ['analysis', 'modeling', 'recommendation'],
    version: '1.0.0'
  },
  'first-principles-physicist': {
    id: 'first-principles-physicist',
    name: 'First Principles Physicist',
    domain: 'Physics',
    expertise: ['fundamental-laws', 'first-principles', 'theoretical-physics'],
    capabilities: ['analysis', 'deduction', 'modeling'],
    version: '1.0.0'
  },
  'complexity-scientist': {
    id: 'complexity-scientist',
    name: 'Complexity Scientist',
    domain: 'Complexity Science',
    expertise: ['pattern-recognition', 'emergent-behavior', 'complex-systems'],
    capabilities: ['analysis', 'synthesis', 'prediction'],
    version: '1.0.0'
  },
  'ai-systems-researcher': {
    id: 'ai-systems-researcher',
    name: 'AI Systems Researcher',
    domain: 'AI Research',
    expertise: ['neural-architecture', 'machine-learning', 'system-optimization'],
    capabilities: ['analysis', 'design', 'optimization'],
    version: '1.0.0'
  },
  'data-processing-specialist': {
    id: 'data-processing-specialist',
    name: 'Data Processing Specialist',
    domain: 'Data Science',
    expertise: ['analytics', 'information-synthesis', 'statistical-analysis'],
    capabilities: ['processing', 'visualization', 'insight-generation'],
    version: '1.0.0'
  },
  'machine-learning-engineer': {
    id: 'machine-learning-engineer',
    name: 'Machine Learning Engineer',
    domain: 'ML Engineering',
    expertise: ['model-development', 'training', 'deployment'],
    capabilities: ['development', 'training', 'deployment'],
    version: '1.0.0'
  },

  // Technical Division
  'ai-systems-integrator': {
    id: 'ai-systems-integrator',
    name: 'AI Systems Integrator',
    domain: 'Integration',
    expertise: ['performance-optimization', 'technical-integration', 'scalability'],
    capabilities: ['integration', 'optimization', 'architecture'],
    version: '1.0.0'
  },
  'cloud-architect': {
    id: 'cloud-architect',
    name: 'Cloud Architect',
    domain: 'Cloud Infrastructure',
    expertise: ['distributed-systems', 'scalability', 'reliability'],
    capabilities: ['architecture', 'design', 'optimization'],
    version: '1.0.0'
  },
  'devops-engineer': {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    domain: 'DevOps',
    expertise: ['infrastructure-automation', 'deployment', 'CI/CD'],
    capabilities: ['automation', 'deployment', 'monitoring'],
    version: '1.0.0'
  },

  // Creative Division
  'abstract-philosopher': {
    id: 'abstract-philosopher',
    name: 'Abstract Philosopher',
    domain: 'Philosophy',
    expertise: ['conceptual-frameworks', 'metaphysical-analysis'],
    capabilities: ['analysis', 'synthesis', 'exploration'],
    version: '1.0.0'
  },
  'narrative-generator': {
    id: 'narrative-generator',
    name: 'Narrative Generator',
    domain: 'Storytelling',
    expertise: ['story-creation', 'contextual-scenarios'],
    capabilities: ['creation', 'adaptation', 'narrative-building'],
    version: '1.0.0'
  },
  'innovation-designer': {
    id: 'innovation-designer',
    name: 'Innovation Designer',
    domain: 'Innovation',
    expertise: ['problem-solving', 'solution-design'],
    capabilities: ['ideation', 'design', 'prototyping'],
    version: '1.0.0'
  },

  // Strategic Division
  'business-analyst': {
    id: 'business-analyst',
    name: 'Business Analyst',
    domain: 'Business',
    expertise: ['market-analysis', 'strategic-planning'],
    capabilities: ['analysis', 'planning', 'forecasting'],
    version: '1.0.0'
  },
  'risk-manager': {
    id: 'risk-manager',
    name: 'Risk Manager',
    domain: 'Risk Management',
    expertise: ['threat-assessment', 'mitigation-strategies'],
    capabilities: ['assessment', 'mitigation', 'planning'],
    version: '1.0.0'
  },
  'ethics-officer': {
    id: 'ethics-officer',
    name: 'Ethics Officer',
    domain: 'Ethics',
    expertise: ['moral-reasoning', 'ethical-frameworks'],
    capabilities: ['evaluation', 'guidance', 'assessment'],
    version: '1.0.0'
  }
};

export const getAgentConfig = (agentId: string): AgentConfig | undefined => {
  return AGENT_REGISTRY[agentId];
};

export const getAllAgentConfigs = (): AgentConfig[] => {
  return Object.values(AGENT_REGISTRY);
};

export const getAgentsByDomain = (domain: string): AgentConfig[] => {
  return Object.values(AGENT_REGISTRY).filter(
    agent => agent.domain === domain
  );
};
