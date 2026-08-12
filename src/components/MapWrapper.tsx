'use client';

import dynamic from 'next/dynamic';
import { NearestShelterResult } from '@/lib/shelters';

interface HazardWarning {
  id: string;
  type: 'rain' | 'flood' | 'earthquake' | 'fire' | 'landslide' | 'cloud_burst' | 'thunderstorm';
  severity: 'red' | 'orange' | 'yellow';
  title: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  details?: Record<string, any>;
}

interface FloodZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  riskLevel: 'high' | 'moderate' | 'low';
  probability: number;
  precipitationForecast: number;
  description: string;
}

interface CityForecast {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  weatherCode: number;
  summary: string;
}

interface MapProps {
  showWeather: boolean;
  showFloods: boolean;
  showEarthquakes: boolean;
  showFires: boolean;
  showHistoricalFloods: boolean;
  flyToLocation: { lat: number; lng: number; zoom: number } | null;
  onDataLoaded: (data: {
    warnings: HazardWarning[];
    floodZones: FloodZone[];
    forecasts: CityForecast[];
    historicalFloods?: any[];
  }) => void;
  selectedWarning: HazardWarning | null;
  nearestShelters: NearestShelterResult[];
}

// Dynamically import the Map component with SSR disabled
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: '#0b0f17',
      borderRadius: '12px',
      color: '#94a3b8',
      fontSize: '1.1rem',
      fontWeight: '500',
      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '4px solid #1e293b',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px auto'
        }} />
        Initializing Geospatial Layers...
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  ),
});

export default function MapWrapper(props: MapProps) {
  return <Map {...props} />;
}
