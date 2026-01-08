import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';
import { experienceDatabase } from '@/lib/memory/experience-database';

/**
 * API Route: Start Evolution Cycle
 */
export async function POST() {
  try {
    const evolutionStatus = omegaOrchestrator.startEvolutionCycle();

    const response = {
      evolution: {
        currentCycle: evolutionStatus.cycle,
        status: 'running',
        progress: evolutionStatus.progress,
        strategies: evolutionStatus.strategies,
        applied: evolutionStatus.applied,
        improvement: evolutionStatus.improvement,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting evolution cycle:', error);
    return NextResponse.json(
      { error: 'Failed to start evolution cycle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
