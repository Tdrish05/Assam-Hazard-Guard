import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const ALLOWED_CATEGORIES = ['waterlogging', 'road_closure', 'pothole', 'power_outage', 'other'];

/**
 * GET: Fetch all alerts from the PostgreSQL database.
 * Returns only active alerts sorted by timestamp descending.
 */
export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE', // Filter out resolved issues for active map display
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(alerts, { status: 200 });
  } catch (error) {
    console.error('API Error [GET /api/alerts]:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to fetch alerts.', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new community alert.
 * Expects { latitude: number, longitude: number, description: string, category: string } in request body.
 * Validates fields and saves the record in PostgreSQL via Prisma.
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const { latitude, longitude, description, category } = body;

    // Validate Latitude
    if (latitude === undefined || latitude === null || typeof latitude !== 'number') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Latitude is required and must be a number.' },
        { status: 400 }
      );
    }
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Latitude must be between -90 and 90.' },
        { status: 400 }
      );
    }

    // Validate Longitude
    if (longitude === undefined || longitude === null || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Longitude is required and must be a number.' },
        { status: 400 }
      );
    }
    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Longitude must be between -180 and 180.' },
        { status: 400 }
      );
    }

    // Validate Description
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Description is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // Validate Category
    if (!category || typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: `Category is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create the alert in database
    const newAlert = await prisma.alert.create({
      data: {
        latitude: parseFloat(latitude.toFixed(6)),   // Normalize precision to 6 decimal places (~10cm accuracy)
        longitude: parseFloat(longitude.toFixed(6)),
        description: description.trim(),
        category: category,
      },
    });

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('API Error [POST /api/alerts]:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to create alert.', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Upvote or Resolve an existing community alert.
 * Expects { id: number, action: 'upvote' | 'resolve' } in request body.
 * Secure: Resolve action requires authorized coordinator cookie session validation.
 */
export async function PATCH(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const { id, action } = body;

    // Validate ID
    if (id === undefined || id === null || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Alert ID is required and must be a number.' },
        { status: 400 }
      );
    }

    // Validate Action
    if (!action || (action !== 'upvote' && action !== 'resolve')) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Action is required and must be "upvote" or "resolve".' },
        { status: 400 }
      );
    }

    let updatedAlert;

    if (action === 'upvote') {
      // Increment upvotes by 1
      updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          upvotes: {
            increment: 1
          }
        }
      });
    } else {
      // Verify Authorization Session Cookie for Resolve Action
      const cookieStore = await cookies();
      const session = cookieStore.get('session');
      if (!session || session.value !== 'authorized-coordinator-token-2026') {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Only authorized emergency coordinators can resolve database incidents.' },
          { status: 401 }
        );
      }

      // Mark status as RESOLVED
      updatedAlert = await prisma.alert.update({
        where: { id },
        data: {
          status: 'RESOLVED'
        }
      });
    }

    return NextResponse.json(updatedAlert, { status: 200 });
  } catch (error) {
    console.error('API Error [PATCH /api/alerts]:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to update alert.', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
