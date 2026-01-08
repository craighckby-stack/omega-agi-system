import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: 'Experience stored',
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to store experience',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
