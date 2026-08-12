import { getHaversineDistance } from './shelters';

interface HazardZone {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  riskLevel: 'high' | 'moderate' | 'low';
}

/**
 * Dynamic Evacuation Routing Algorithm (Hazard-Avoidance Router)
 * If the straight vector from origin to destination intersects an active hazard zone,
 * it calculates a detour waypoint shifted outside the hazard's radius to bypass the threat.
 */
export function getSafeEvacuationRoute(
  origin: [number, number],
  destination: [number, number],
  hazardZones: HazardZone[]
): [number, number][] {
  const routePoints: [number, number][] = [origin];
  const originLat = origin[0];
  const originLng = origin[1];
  const destLat = destination[0];
  const destLng = destination[1];

  // Calculate midpoint of direct trajectory
  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  let activeDetour: [number, number] | null = null;

  // Check if midpoint falls inside any high or moderate hazard zone
  for (const hazard of hazardZones) {
    if (hazard.riskLevel === 'low') continue; // low-risk zones don't block evacuations

    const distToCenter = getHaversineDistance(midLat, midLng, hazard.latitude, hazard.longitude);
    const radiusInKm = hazard.radius / 1000;

    // Check if the route intersects or gets too close to the hazard center
    if (distToCenter < radiusInKm * 1.1) {
      // Direct path passes through hazard! Calculate detour coordinate.
      // Vector from hazard center to route midpoint
      let dLat = midLat - hazard.latitude;
      let dLng = midLng - hazard.longitude;
      
      const len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.001;
      
      // Normalize vector and scale to shift coordinate 1.35x beyond the hazard radius
      // Convert km to approximate lat/lng degrees (1 degree ~ 111.32 km)
      const shiftDistanceDegrees = (radiusInKm * 1.35) / 111.32;
      
      const detourLat = hazard.latitude + (dLat / len) * shiftDistanceDegrees;
      const detourLng = hazard.longitude + (dLng / len) * shiftDistanceDegrees;

      activeDetour = [parseFloat(detourLat.toFixed(5)), parseFloat(detourLng.toFixed(5))];
      break; // apply primary detour and exit loop
    }
  }

  if (activeDetour) {
    routePoints.push(activeDetour);
  }

  routePoints.push(destination);
  return routePoints;
}

interface TrustScoreResult {
  confidence: number;
  status: 'verified' | 'unverified' | 'corroborated';
  label: string;
  reasons: string[];
}

/**
 * Citizen Trust and Consensus Verification Algorithm
 * Computes a trust percentage based on community votes, coordinate clustering, and local sensor data.
 */
export function calculateTrustScore(
  report: { category: string; latitude: number; longitude: number; upvotes: number },
  nearbyReports: { category: string; latitude: number; longitude: number }[],
  rainForecast: number // Forecast sum in trigger city
): TrustScoreResult {
  let confidence = 30; // Base confidence for any user report
  const reasons: string[] = ['Submitted by citizen account (Base: 30%)'];

  // 1. Upvote Consensus Weighting (+10% per upvote, cap at +30%)
  if (report.upvotes > 0) {
    const upvoteBonus = Math.min(report.upvotes * 10, 30);
    confidence += upvoteBonus;
    reasons.push(`Community consensus votes (+${upvoteBonus}%)`);
  }

  // 2. Geospatial Clustering (Consensus Matching)
  // Check if other reports of the same category exist within 2km logged recently
  const clusterMatches = nearbyReports.filter((other) => {
    if (other.category !== report.category) return false;
    const distance = getHaversineDistance(report.latitude, report.longitude, other.latitude, other.longitude);
    // Ignore self-matching (distance === 0)
    return distance > 0.01 && distance <= 2.0; 
  });

  if (clusterMatches.length > 0) {
    confidence += 30;
    reasons.push(`Geospatial consensus: corroborated by ${clusterMatches.length} nearby reports (+30%)`);
  }

  // 3. Meteorological Sensor Verification
  // Verify reporting validity against forecast rain sensors
  if (report.category === 'waterlogging') {
    if (rainForecast > 15.0) {
      confidence += 10;
      reasons.push('Meteorological consensus: Heavy precipitation forecasts match waterlogging (+10%)');
    }
  } else if (report.category === 'road_closure' || report.category === 'power_outage') {
    if (rainForecast > 30.0) {
      confidence += 10;
      reasons.push('Meteorological consensus: Severe winds & storm forecasts match infrastructure blocks (+10%)');
    }
  }

  // Final scoring limits
  confidence = Math.min(confidence, 100);

  let label = 'Unverified (Potential False Alert)';
  let status: 'verified' | 'unverified' | 'corroborated' = 'unverified';

  if (confidence >= 70) {
    label = 'Verified Alert';
    status = 'verified';
  } else if (confidence >= 45) {
    label = 'Corroborated Alert';
    status = 'corroborated';
  }

  return {
    confidence,
    status,
    label,
    reasons
  };
}
