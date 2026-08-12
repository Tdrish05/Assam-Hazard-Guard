'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * Server Action: Mark a reported incident as RESOLVED.
 * Secured: Requires validated session cookie.
 */
export async function resolveAlert(id: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (session?.value !== 'authorized-coordinator-token-2026') {
      return { success: false, error: 'Unauthorized credentials.' };
    }

    await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED'
      }
    });

    // Revalidate cached paths
    revalidatePath('/history');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error [resolveAlert]:', error);
    return { success: false, error: error.message || 'Failed to update record.' };
  }
}

/**
 * Server Action: Validate/Verify an incident, boosting upvotes/trust score immediately.
 * Secured: Requires validated session cookie.
 */
export async function verifyAlert(id: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (session?.value !== 'authorized-coordinator-token-2026') {
      return { success: false, error: 'Unauthorized credentials.' };
    }

    // Boost upvotes by 5 to verify report immediately
    await prisma.alert.update({
      where: { id },
      data: {
        upvotes: {
          increment: 5
        }
      }
    });

    revalidatePath('/history');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error [verifyAlert]:', error);
    return { success: false, error: error.message || 'Failed to update trust.' };
  }
}

/**
 * Server Action: Clear the session cookie to log out.
 */
export async function logoutCoordinator() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    revalidatePath('/history');
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error [logoutCoordinator]:', error);
    return { success: false, error: 'Failed to terminate session.' };
  }
}
