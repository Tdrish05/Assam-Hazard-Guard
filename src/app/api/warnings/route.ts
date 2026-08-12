import { NextResponse } from 'next/server';
import { getWarningsAndAdvisories } from '@/lib/warning-engine';

/**
 * GET: Retrieve the live computed warnings, forecasts, and flood zones dataset.
 * Combines USGS Earthquake feed and Open-Meteo precipitation models for Assam.
 */
export async function GET() {
  try {
    const data = await getWarningsAndAdvisories();
    
    // Return dataset with headers to prevent caching, ensuring real-time weather and earthquake updates
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('API Error [GET /api/warnings]:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to retrieve warning dataset.', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
