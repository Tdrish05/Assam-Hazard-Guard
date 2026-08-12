export interface Shelter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locationName: string;
  district: string;
  capacity: number;
  occupied: number;
  contactNumber: string;
  supplies: {
    food: 'adequate' | 'low' | 'critical';
    medicine: 'adequate' | 'low' | 'critical';
    powerGenerator: boolean;
  };
  description: string;
}

// Database of evacuation and relief shelters across Assam
export const SHELTERS_DB: Shelter[] = [
  {
    id: 's-guwahati',
    name: 'Guwahati Sports Complex Relief Hub',
    latitude: 26.1440,
    longitude: 91.7580,
    locationName: 'Nehru Stadium Road, Guwahati',
    district: 'Kamrup Metropolitan',
    capacity: 600,
    occupied: 245,
    contactNumber: '+91 361 245 8899',
    supplies: { food: 'adequate', medicine: 'adequate', powerGenerator: true },
    description: 'Equipped with dry ration reserves, drinking water storage, and 24/7 medical station.'
  },
  {
    id: 's-dibrugarh',
    name: 'Dibrugarh University Relief camp',
    latitude: 27.4580,
    longitude: 94.8980,
    locationName: 'University Campus, Dibrugarh',
    district: 'Dibrugarh',
    capacity: 450,
    occupied: 380,
    contactNumber: '+91 373 237 0243',
    supplies: { food: 'low', medicine: 'adequate', powerGenerator: true },
    description: 'Large shelter in upper Assam river sector. High capacity but currently operating near limits.'
  },
  {
    id: 's-jorhat',
    name: 'Jorhat Town Hall Relief Station',
    latitude: 26.7580,
    longitude: 94.2250,
    locationName: 'KB Road, Jorhat',
    district: 'Jorhat',
    capacity: 350,
    occupied: 98,
    contactNumber: '+91 376 230 1199',
    supplies: { food: 'adequate', medicine: 'low', powerGenerator: false },
    description: 'Municipal stadium camp serving Central/Upper Assam districts. Dry ground and toilet blocks active.'
  },
  {
    id: 's-silchar',
    name: 'Silchar Government Relief Center',
    latitude: 24.8180,
    longitude: 92.7780,
    locationName: 'College Road, Silchar',
    district: 'Cachar',
    capacity: 500,
    occupied: 410,
    contactNumber: '+91 384 223 0941',
    supplies: { food: 'critical', medicine: 'critical', powerGenerator: true },
    description: 'Barak Valley shelter. High occupancy due to recent flash river overflows. Emergency supply shipments requested.'
  },
  {
    id: 's-tezpur',
    name: 'Tezpur Government College Camp',
    latitude: 26.6260,
    longitude: 92.7980,
    locationName: 'Tezpur College Ground, Tezpur',
    district: 'Sonitpur',
    capacity: 300,
    occupied: 72,
    contactNumber: '+91 371 222 0541',
    supplies: { food: 'adequate', medicine: 'adequate', powerGenerator: false },
    description: 'Safe high-ground shelter. Serves central districts. Active community kitchen running.'
  },
  {
    id: 's-haflong',
    name: 'Haflong District Community Hall',
    latitude: 25.1780,
    longitude: 93.0200,
    locationName: 'Hill View Road, Haflong',
    district: 'Dima Hasao',
    capacity: 250,
    occupied: 115,
    contactNumber: '+91 367 323 6245',
    supplies: { food: 'adequate', medicine: 'adequate', powerGenerator: true },
    description: 'Landslide safety refuge in Southern hills. Equipped with heavy earthmoving response units nearby.'
  }
];

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula.
 * Returns the distance in kilometers.
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2)); // Round to 2 decimal places
}

export interface NearestShelterResult extends Shelter {
  distance: number; // distance in km to the target coordinates
}

/**
 * Queries and sorts shelters to find the closest ones to a given coordinate.
 */
export function getNearestShelters(
  lat: number,
  lng: number,
  count: number = 3
): NearestShelterResult[] {
  return SHELTERS_DB.map((shelter) => {
    const dist = getHaversineDistance(lat, lng, shelter.latitude, shelter.longitude);
    return {
      ...shelter,
      distance: dist,
    };
  })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}
