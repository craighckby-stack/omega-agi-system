/**
 * Learning Layer - Code Analysis System
 * Analyzes code complexity, bottlenecks, and code smells
 */

export interface ComplexityMetric {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface CodeSmell {
  id: string;
  type: 'duplicate_code' | 'long_method' | 'long_parameter_list' | 'god_class' | 'complex_conditional' | 'data_clumps' | 'feature_envy' | 'magic_numbers' | 'dead_code' | 'uncommented_code';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestion: string;
}

export interface Bottleneck {
  id: string;
  type: 'performance' | 'memory' | 'io' | 'concurrency' | 'database' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  impact: string;
  suggestion: string;
}

export interface CodeAnalysisReport {
  timestamp: number;
  filePath: string;
  language: string;
  complexity: ComplexityMetric;
  codeSmells: CodeSmell[];
  bottlenecks: Bottleneck[];
  qualityScore: number; // 0.0 to 1.0
  improvementSuggestions: string[];
  estimatedRefactorTime: number;
}

export const LANGUAGE_SUPPORT = {
  typescript: {
    extensions: ['.ts', '.tsx'],
    complexityMultipliers: {
      functions: 1.0,
      classes: 1.2,
      interfaces: 0.8,
      enums: 0.6,
    },
  },
  javascript: {
    extensions: ['.js', '.jsx'],
    complexityMultipliers: {
      functions: 1.1,
      classes: 1.3,
      objects: 1.0,
      prototypes: 1.2,
    },
  },
  python: {
    extensions: ['.py'],
    complexityMultipliers: {
      functions: 0.9,
      classes: 1.1,
      modules: 1.0,
      methods: 1.0,
    },
  },
} as const;

/**
 * Code Analyzer
 * Analyzes code for complexity, smells, and bottlenecks
 */
export class CodeAnalyzer {
  /**
   * Analyze a code file
   */
  async analyzeCode(params: {
    filePath: string;
    language?: string;
    content?: string;
    includeDetailedAnalysis?: boolean;
  }): Promise<CodeAnalysisReport> {
    const { filePath, language, content } = params;

    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(filePath);
    const languageSupport = LANGUAGE_SUPPORT[detectedLanguage as keyof typeof LANGUAGE_SUPPORT];

    if (!languageSupport) {
      throw new Error(`Unsupported language: ${detectedLanguage}`);
    }

    // Get or read content
    const fileContent = content || await this.readFileContent(filePath);

    // Calculate complexity metrics
    const complexity = this.calculateComplexity(fileContent, languageSupport.complexityMultipliers);

    // Detect code smells
    const codeSmells = this.detectCodeSmells(fileContent, detectedLanguage);

    // Detect bottlenecks
    const bottlenecks = this.detectBottlenecks(fileContent, detectedLanguage);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(complexity, codeSmells, bottlenecks);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateSuggestions(complexity, codeSmells, bottlenecks);

    // Estimate refactor time
    const estimatedRefactorTime = this.estimateRefactorTime(complexity, codeSmells, bottlenecks);

    const report: CodeAnalysisReport = {
      timestamp: Date.now(),
      filePath,
      language: detectedLanguage,
      complexity,
      codeSmells,
      bottlenecks,
      qualityScore,
      improvementSuggestions,
      estimatedRefactorTime,
    };

    // Save report to memory
    await this.saveReport(report);

    return report;
  }

  /**
   * Detect programming language
   */
  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();

    if (!extension) return 'typescript';

    const languageExtensions: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
    };

    return languageExtensions[extension] || 'typescript';
  }

  /**
   * Read file content
   */
  private async readFileContent(filePath: string): Promise<string> {
    // In a real implementation, this would read from file system
    // For now, we'll return mock content
    return 'Mock file content for analysis';
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexity(content: string, multipliers: any): ComplexityMetric {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;

    // Estimate cyclomatic complexity
    const cyclomaticComplexity = this.estimateCyclomaticComplexity(content);

    // Estimate cognitive complexity
    const cognitiveComplexity = this.estimateCognitiveComplexity(content);

    // Calculate maintainability index (simplified)
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode
    );

    // Estimate technical debt
    const technicalDebt = this.estimateTechnicalDebt(
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode
    );

    return {
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex,
      technicalDebt,
    };
  }

  /**
   * Estimate cyclomatic complexity
   */
  private estimateCyclomaticComplexity(content: string): number {
    // Count decision points: if, for, while, case, catch, ternary, logical operators
    const decisionPoints = (content.match(/if|for|while|case|catch|&&|\|\||\?/gi) || []).length;

    // Cyclomatic complexity = decision points + 1
    return Math.max(1, decisionPoints + 1);
  }

  /**
   * Estimate cognitive complexity
   */
  private estimateCognitiveComplexity(content: string): number {
    // Count nesting levels, function calls, and other complexity indicators
    const nestingLevels = (content.match(/\{/gi) || []).length;

    // Count function calls
    const functionCalls = (content.match(/\w+\(/gi) || []).length;

    // Cognitive complexity (simplified)
    const cognitiveComplexity = nestingLevels + Math.floor(functionCalls / 10);

    return Math.max(1, cognitiveComplexity);
  }

  /**
   * Calculate maintainability index
   */
  private calculateMaintainabilityIndex(
    cyclomaticComplexity: number,
    cognitiveComplexity: number,
    linesOfCode: number
  ): number {
    // Normalize values to 0-1 range
    const normalizedCyclomatic = Math.min(1, cyclomaticComplexity / 20);
    const normalizedCognitive = Math.min(1, cognitiveComplexity / 15);
    const normalizedLines = Math.min(1, linesOfCode / 1000);

    // Maintainability index (higher is worse)
    const maintainabilityIndex = (normalizedCyclomatic + normalizedCognitive + normalizedLines) / 3;

    return maintainabilityIndex;
  }

  /**
   * Estimate technical debt
   */
  private estimateTechnicalDebt(
    cyclomaticComplexity: number,
    cognitiveComplexity: number,
    linesOfCode: number
  ): number {
    // Technical debt = complexity * time * cost
    // Average time to fix = 1 hour per complexity point
    // Average cost = $100 per hour
    const timePerComplexity = 1; // hours
    const costPerHour = 100; // dollars

    const totalComplexity = cyclomaticComplexity + cognitiveComplexity;
    const technicalDebt = totalComplexity * timePerComplexity * costPerHour;

    return technicalDebt;
  }

  /**
   * Detect code smells
   */
  private detectCodeSmells(content: string, language: string): CodeSmell[] {
    const codeSmells: CodeSmell[] = [];

    // Detect duplicate code
    const duplicateCodeSmell = this.detectDuplicateCode(content);
    if (duplicateCodeSmell) {
      codeSmells.push(duplicateCodeSmell);
    }

    // Detect long methods/functions
    const longMethodSmells = this.detectLongMethods(content, language);
    codeSmells.push(...longMethodSmells);

    // Detect god class
    const godClassSmell = this.detectGodClass(content, language);
    if (godClassSmell) {
      codeSmells.push(godClassSmell);
    }

    // Detect complex conditionals
    const complexConditionalSmells = this.detectComplexConditionals(content);
    codeSmells.push(...complexConditionalSmells);

    // Detect magic numbers
    const magicNumberSmells = this.detectMagicNumbers(content);
    codeSmells.push(...magicNumberSmells);

    // Detect dead code
    const deadCodeSmells = this.detectDeadCode(content, language);
    codeSmells.push(...deadCodeSmells);

    // Detect long parameter lists
    const longParameterSmell = this.detectLongParameters(content);
    codeSmells.push(...longParameterSmell);

    return codeSmells;
  }

  /**
   * Detect duplicate code
   */
  private detectDuplicateCode(content: string): CodeSmell | null {
    const lines = content.split('\n');
    const lineCounts: Map<string, number> = new Map();

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 20) { // Only check lines with significant content
        lineCounts.set(trimmed, (lineCounts.get(trimmed) || 0) + 1);
      }
    }

    // Find duplicates
    const duplicates: Array<[string, number]> = [];
    for (const [line, count] of lineCounts.entries()) {
      if (count >= 3) { // Same line appears 3+ times
        duplicates.push([line, count]);
      }
    }

    if (duplicates.length > 0) {
      return {
        id: `duplicate_code-${Date.now()}`,
        type: 'duplicate_code',
        severity: duplicates.length > 10 ? 'critical' : 'high',
        description: `${duplicates.length} duplicate lines detected`,
        location: 'Multiple locations',
        suggestion: 'Extract duplicate code into reusable functions',
      };
    }

    return null;
  }

  /**
   * Detect long methods
   */
  private detectLongMethods(content: string, language: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const methodPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/gi;
    let match;

    while ((match = methodPattern.exec(content)) !== null) {
      const methodName = match[1];
      const methodStart = match.index;
      const openingBrace = content.indexOf('{', methodStart);
      const closingBrace = this.findMatchingBrace(content, openingBrace + 1);
      const methodLength = closingBrace - openingBrace;

      if (methodLength > 100) { // More than 100 lines
        smells.push({
          id: `long_method-${Date.now()}-${smells.length}`,
          type: 'long_method',
          severity: methodLength > 200 ? 'critical' : 'high',
          description: `Method ${methodName} exceeds ${methodLength} lines`,
          location: `Line ${this.getLineNumber(content, methodStart)}`,
          suggestion: 'Break down method into smaller functions',
        });
      }
    }

    return smells;
  }

  /**
   * Detect god class
   */
  private detectGodClass(content: string, language: string): CodeSmell | null {
    // Count methods in a class
    const classPattern = /class\s+(\w+)\s*\{([\s\S]*?)\}/gi;
    const classMatch = classPattern.exec(content);

    if (!classMatch) {
      return null;
    }

    const className = classMatch[1];
    const classBody = classMatch[2];

    // Count methods
    const methodCount = (classBody.match(/function\s+\w+/gi) || []).length;

    // Count lines in class
    const classLines = classBody.split('\n').length;

    // God class: many methods and many lines
    if (methodCount > 20 && classLines > 500) {
      return {
        id: `god_class-${Date.now()}`,
        type: 'god_class',
        severity: 'critical',
        description: `Class ${className} has ${methodCount} methods and ${classLines} lines`,
        location: 'Class level',
        suggestion: 'Split into smaller, focused classes',
      };
    }

    return null;
  }

  /**
   * Detect complex conditionals
   */
  private detectComplexConditionals(content: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nestingLevel = (line.match(/\{/g) || []).length;

      // Complex conditional: deeply nested or multiple conditions
      const andOrCount = (line.match(/&&|\|\|/g) || []).length;

      if (nestingLevel >= 4 && andOrCount >= 3) {
        smells.push({
          id: `complex_conditional-${Date.now()}-${smells.length}`,
          type: 'complex_conditional',
          severity: 'high',
          description: `Complex conditional with ${nestingLevel} levels and ${andOrCount} operators`,
          location: `Line ${i + 1}`,
          suggestion: 'Extract nested conditions into separate methods',
        });
      }
    }

    return smells;
  }

  /**
   * Detect magic numbers
   */
  private detectMagicNumbers(content: string): CodeSmell[] {
    const smells: CodeSmell[] = [];
    const numberPattern = /[^a-zA-Z](\d+)(?!\s*=\s*[a-zA-Z])/g; // Not followed by variable assignment
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = numberPattern.exec(line)) !== null) {
        const number = parseInt(match[1]);

        // Skip common numbers (0, 1, -1, 100, 1000, etc.)
        const commonNumbers = [0, 1, -1, 100, 1000, 8, 16, 32, 64, 128, 256, 512, 1024];
        if (commonNumbers.includes(number)) {
          continue;
        }

        smells.push({
          id: `magic_number-${Date.now()}-${smells.length}`,
          type: 'magic_numbers',
          severity: 'medium',
          description: `Magic number ${number} detected`,
          location: `Line ${i + 1}`,
          suggestion: 'Replace with named constant',
        });
      }
    }

    return smells;
  }

  /**
   * Detect dead code
   */
  private detectDeadCode(content: string, language: string): CodeSmell[] {
    const smells: CodeSmell[] = [];

    // Detect commented out code
    const commentedCodePattern = /^\s*\/\/.*\S/;
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for large blocks of commented code
      if (commentedCodePattern.test(line)) {
        // Look ahead for more commented lines
        let commentBlockStart = i;
        let commentBlockLength = 1;

        for (let j = i + 1; j < lines.length && commentedCodePattern.test(lines[j]); j++) {
          commentBlockLength++;
        }

        if (commentBlockLength >= 10) {
          smells.push({
            id: `dead_code-${Date.now()}-${smells.length}`,
            type: 'dead_code',
            severity: 'low',
            description: `Large commented code block (${commentBlockLength} lines) detected`,
            location: `Lines ${commentBlockStart + 1}-${j + 1}`,
            suggestion: 'Remove or uncomment the code',
          });
        }

        i = j - 1; // Skip ahead
      }
    }

    return smells;
  }

  /**
   * Detect long parameter lists
   */
  private detectLongParameters(content: string): CodeSmell | null {
    const functionPattern = /function\s+(\w+)\s*\(([^)]*)\)/gi;
    let match;

    while ((match = functionPattern.exec(content)) !== null) {
      const parameters = match[1].split(',').map(p => p.trim());

      if (parameters.length > 8) {
        return {
          id: `long_parameter-${Date.now()}`,
          type: 'long_parameter_list',
          severity: 'high',
          description: `Function ${match[2]} has ${parameters.length} parameters`,
          location: 'Function signature',
          suggestion: 'Use an object or parameter object instead',
        };
      }
    }

    return null;
  }

  /**
   * Detect bottlenecks
   */
  private detectBottlenecks(content: string, language: string): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Detect performance bottlenecks
    const performancePatterns = [
      /for\s*\(.*\)\s*{[\s\S]*?}\s*while\s*\(/gi, // Nested loops
      /\.forEach\s*\(\s*\w+\s*=>\s*\.forEach\s*\(/gi, // Nested forEach
      /setInterval\s*\(/gi, // Unoptimized timers
      /document\.\w+\s*\(\s*\w+\)/gi, // Frequent DOM access
      /JSON\.stringify\s*\(.*\)/gi, // Large JSON serialization
    ];

    let match;
    for (const pattern of performancePatterns) {
      while ((match = pattern.exec(content)) !== null) {
        bottlenecks.push({
          id: `performance-${Date.now()}-${bottlenecks.length}`,
          type: 'performance',
          severity: 'medium',
          description: `Potential performance bottleneck detected`,
          location: `Line ${this.getLineNumber(content, match.index)}`,
          impact: 'Degraded performance',
          suggestion: 'Optimize loop structure or use memoization',
        });
      }
    }

    // Detect I/O bottlenecks
    const ioPatterns = [
      /fs\.readFileSync\s*\(/gi, // Synchronous file I/O
      /fs\.writeFileSync\s*\(/gi, // Synchronous file write
      /require\s*\([\s\S]*\)\s*\.read/gi, // Synchronous module require
    ];

    for (const pattern of ioPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        bottlenecks.push({
          id: `io-${Date.now()}-${bottlenecks.length}`,
          type: 'io',
          severity: 'high',
          description: `Synchronous I/O operation detected`,
          location: `Line ${this.getLineNumber(content, match.index)}`,
          impact: 'Blocked event loop',
          suggestion: 'Use async/await and Promise-based I/O',
        });
      }
    }

    // Detect memory bottlenecks
    const memoryPatterns = [
      /new\s+Array\s*\(\s*\d{4,}\)/gi, // Large array allocation
      /\[\s*new\s+Array\s*\(\s*\d{3,}\)\s*,\s*\]/gi, // Multiple large arrays
      /Object\.keys\s*\(.*\)\s*\.forEach\s*\(/gi, // Iterating large objects
    ];

    for (const pattern of memoryPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        bottlenecks.push({
          id: `memory-${Date.now()}-${bottlenecks.length}`,
          type: 'memory',
          severity: 'medium',
          description: `Potential memory bottleneck: Large data structure`,
          location: `Line ${this.getLineNumber(content, match.index)}`,
          impact: 'High memory usage',
          suggestion: 'Use pagination or lazy loading',
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(
    complexity: ComplexityMetric,
    codeSmells: CodeSmell[],
    bottlenecks: Bottleneck[]
  ): number {
    let qualityScore = 1.0; // Start with perfect score

    // Deduct for high complexity
    if (complexity.cyclomaticComplexity > 10) {
      qualityScore -= 0.2;
    } else if (complexity.cyclomaticComplexity > 20) {
      qualityScore -= 0.4;
    }

    // Deduct for high cognitive complexity
    if (complexity.cognitiveComplexity > 15) {
      qualityScore -= 0.2;
    } else if (complexity.cognitiveComplexity > 25) {
      qualityScore -= 0.4;
    }

    // Deduct for low maintainability
    if (complexity.maintainabilityIndex > 0.6) {
      qualityScore -= 0.2;
    } else if (complexity.maintainabilityIndex > 0.8) {
      qualityScore -= 0.4;
    }

    // Deduct for code smells
    const criticalSmells = codeSmells.filter(s => s.severity === 'critical').length;
    const highSmells = codeSmells.filter(s => s.severity === 'high').length;
    const mediumSmells = codeSmells.filter(s => s.severity === 'medium').length;

    qualityScore -= (criticalSmells * 0.15) + (highSmells * 0.1) + (mediumSmells * 0.05);

    // Deduct for bottlenecks
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;

    qualityScore -= (criticalBottlenecks * 0.2) + (highBottlenecks * 0.1);

    return Math.max(0.0, qualityScore);
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    complexity: ComplexityMetric,
    codeSmells: CodeSmell[],
    bottlenecks: Bottleneck[]
  ): string[] {
    const suggestions: string[] = [];

    // Complexity-based suggestions
    if (complexity.cyclomaticComplexity > 15) {
      suggestions.push('Consider breaking down complex functions into smaller units');
    }

    if (complexity.cognitiveComplexity > 20) {
      suggestions.push('Reduce nesting depth to improve readability');
    }

    // Code smell suggestions
    for (const smell of codeSmells) {
      suggestions.push(smell.suggestion);
    }

    // Bottleneck suggestions
    for (const bottleneck of bottlenecks) {
      suggestions.push(bottleneck.suggestion);
    }

    return suggestions;
  }

  /**
   * Estimate refactor time
   */
  private estimateRefactorTime(
    complexity: ComplexityMetric,
    codeSmells: CodeSmell[],
    bottlenecks: Bottleneck[]
  ): number {
    // Base time: 1 hour per 100 lines of code
    const baseTime = (complexity.linesOfCode / 100) * 3600000; // Convert to milliseconds

    // Add time for code smells
    let additionalTime = 0;
    for (const smell of codeSmells) {
      switch (smell.severity) {
        case 'critical':
          additionalTime += 4 * 3600000; // 4 hours
          break;
        case 'high':
          additionalTime += 2 * 3600000; // 2 hours
          break;
        case 'medium':
          additionalTime += 1 * 3600000; // 1 hour
          break;
        case 'low':
          additionalTime += 30 * 60000; // 30 minutes
          break;
      }
    }

    // Add time for bottlenecks
    for (const bottleneck of bottlenecks) {
      switch (bottleneck.severity) {
        case 'critical':
          additionalTime += 3 * 3600000; // 3 hours
          break;
        case 'high':
          additionalTime += 1.5 * 3600000; // 1.5 hours
          break;
        case 'medium':
          additionalTime += 1 * 3600000; // 1 hour
          break;
        case 'low':
          additionalTime += 30 * 60000; // 30 minutes
          break;
      }
    }

    return baseTime + additionalTime;
  }

  /**
   * Find matching brace for code analysis
   */
  private findMatchingBrace(content: string, startIndex: number): number {
    let braceCount = 0;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i;
        }
      }
    }

    return content.length; // Not found, return end
  }

  /**
   * Get line number from index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length + 1;
  }

  /**
   * Save report to memory
   */
  private async saveReport(report: CodeAnalysisReport): Promise<void> {
    try {
      await fetch('/api/learning/code-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'code_analysis',
          data: report,
        }),
      });
    } catch (error) {
      console.error('Failed to save code analysis report:', error);
    }
  }

  /**
   * Batch analyze multiple files
   */
  async batchAnalyze(files: Array<{
    filePath: string;
    language?: string;
  }>): Promise<CodeAnalysisReport[]> {
    const reports: CodeAnalysisReport[] = [];

    for (const file of files) {
      const report = await this.analyzeCode(file);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Get analysis statistics
   */
  getStatistics(): {
    totalAnalyses: number;
    averageQualityScore: number;
    byLanguage: Record<string, number>;
    totalCodeSmells: number;
    totalBottlenecks: number;
    bySeverity: Record<string, number>;
  } {
    // This would query stored analysis reports from memory
    // For now, we'll return mock statistics
    return {
      totalAnalyses: 0,
      averageQualityScore: 0.75,
      byLanguage: {
        typescript: 0,
        javascript: 0,
        python: 0,
      },
      totalCodeSmells: 0,
      totalBottlenecks: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
}

// Singleton instance
export const codeAnalyzer = new CodeAnalyzer();
