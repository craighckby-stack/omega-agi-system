import { NextResponse } from 'next/server';
import { omegaOrchestrator } from '@/lib/omega-orchestrator';

/**
 * API Route: Pause Evolution
 */
export async function POST() {
  try {
    omegaOrchestrator.pauseEvolution();

    const response = {
      evolution: {
        currentCycle: 1,
        status: 'paused',
        progress: omegaOrchestrator.getCurrentProgress(),
        strategies: [],
        applied: 0,
        improvement: 0.0,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error pausing evolution:', error);
    return NextResponse.json(
      { error: 'Failed to pause evolution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
