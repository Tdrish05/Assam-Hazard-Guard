'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NearestShelterResult } from '@/lib/shelters';
import { getSafeEvacuationRoute } from '@/lib/routing-engine';

import { useLanguage } from '@/context/LanguageContext';
import { HistoricalFloodZone } from '@/lib/warning-engine';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons for various hazard types
const earthquakeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const fireIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const landslideIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const cloudBurstIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const thunderstormIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const rainWarningIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Green Icon for Emergency Safe Shelters
const shelterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper for rendering emoji weather labels directly on map as HTML badges
const createWeatherDivIcon = (emoji: string, temp: number) => {
  return new L.DivIcon({
    html: `<div class="weather-map-badge">
            <span class="emoji">${emoji}</span>
            <span class="temp">${temp.toFixed(1)}°C</span>
           </div>`,
    className: 'custom-div-icon',
    iconSize: [60, 30],
    iconAnchor: [30, 15]
  });
};

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
    historicalFloods: HistoricalFloodZone[];
  }) => void;
  selectedWarning: HazardWarning | null;
  nearestShelters: NearestShelterResult[];
}

// Sub-component to handle map recentering dynamically
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
}

export default function Map({ showWeather, showFloods, showEarthquakes, showFires, showHistoricalFloods, flyToLocation, onDataLoaded, selectedWarning, nearestShelters }: MapProps) {
  const { language } = useLanguage();
  const [warnings, setWarnings] = useState<HazardWarning[]>([]);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [forecasts, setForecasts] = useState<CityForecast[]>([]);
  const [historicalFloods, setHistoricalFloods] = useState<HistoricalFloodZone[]>([]);
  const [loading, setLoading] = useState(true);

  // Center of Assam, India
  const centerLat = 26.2006;
  const centerLng = 92.9376;
  const initialZoom = 8;

  // Keep refs of markers to open popups programmatically on flyTo if needed
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // Load warning and meteorological dataset on mount
  useEffect(() => {
    async function loadWarningDataset() {
      try {
        const response = await fetch('/api/warnings');
        if (!response.ok) {
          throw new Error('Failed to load warning dataset');
        }
        const data = await response.json();
        
        setWarnings(data.warnings || []);
        setFloodZones(data.floodZones || []);
        setForecasts(data.forecasts || []);
        setHistoricalFloods(data.historicalFloods || []);
        
        // Notify parent dashboard component to update sidebar list and stats cards
        onDataLoaded(data);
      } catch (error) {
        console.error('Error fetching warning dataset:', error);
      } finally {
        setLoading(false);
      }
    }
    loadWarningDataset();
  }, [onDataLoaded]);

  // Programmatically trigger marker popups when a sidebar alert is clicked
  useEffect(() => {
    if (flyToLocation) {
      const match = warnings.find(w => w.latitude === flyToLocation.lat && w.longitude === flyToLocation.lng);
      if (match && markerRefs.current[match.id]) {
        setTimeout(() => {
          markerRefs.current[match.id]?.openPopup();
        }, 1600); // open popup after zoom duration ends
      }
    }
  }, [flyToLocation, warnings]);

  // Extract separate categories for map overlay mapping
  const earthquakes = warnings.filter(w => w.type === 'earthquake');
  const wildfires = warnings.filter(w => w.type === 'fire');
  const landslides = warnings.filter(w => w.type === 'landslide');
  const cloudbursts = warnings.filter(w => w.type === 'cloud_burst');
  const thunderstorms = warnings.filter(w => w.type === 'thunderstorm');
  const generalRains = warnings.filter(w => w.type === 'rain');

  // Closest shelter for evacuation line drawing
  const closestShelter = nearestShelters.length > 0 ? nearestShelters[0] : null;

  return (
    <div className="map-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={initialZoom}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic Map Recenter component */}
        {flyToLocation && (
          <MapRecenter 
            center={[flyToLocation.lat, flyToLocation.lng]} 
            zoom={flyToLocation.zoom} 
          />
        )}

        {/* Evacuation Routing Vector Dotted Line */}
        {selectedWarning && closestShelter && (
          <Polyline
            positions={getSafeEvacuationRoute(
              [selectedWarning.latitude, selectedWarning.longitude],
              [closestShelter.latitude, closestShelter.longitude],
              floodZones.map(z => ({
                latitude: z.latitude,
                longitude: z.longitude,
                radius: z.radius,
                riskLevel: z.riskLevel
              }))
            )}
            pathOptions={{
              color: '#f97316',
              weight: 4,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round',
              opacity: 0.9
            }}
          />
        )}

        {/* Render nearest shelters as green markers */}
        {nearestShelters.map((shelter) => (
          <Marker
            key={`shelter-pin-${shelter.id}`}
            position={[shelter.latitude, shelter.longitude]}
            icon={shelterIcon}
          >
            <Popup>
              <div className="shelter-map-popup" style={{ minWidth: '180px' }}>
                <h4 style={{ color: '#10b981', margin: '0 0 0.35rem 0', fontSize: '0.9rem' }}>
                  🛡️ Safe Relief Center
                </h4>
                <strong style={{ fontSize: '0.85rem', display: 'block', color: '#f1f5f9' }}>
                  {shelter.name}
                </strong>
                <p style={{ margin: '0.25rem 0', fontSize: '0.775rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {shelter.description}
                </p>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
                  <div>📏 Distance: <strong style={{ color: '#10b981' }}>{shelter.distance} km</strong></div>
                  <div>👥 Occupancy: <strong>{shelter.occupied} / {shelter.capacity} occupied</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 1. Render Flood Risk Zones as colored circles */}
        {showFloods && floodZones.map((zone) => {
          const color = zone.riskLevel === 'high' ? '#ef4444' : zone.riskLevel === 'moderate' ? '#f97316' : '#10b981';
          return (
            <Circle
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.22,
                weight: 2,
                dashArray: zone.riskLevel === 'high' ? '5, 5' : undefined
              }}
            >
              <Popup maxWidth={300}>
                <div className="zone-popup-detail">
                  <span 
                    className="risk-badge" 
                    style={{ 
                      backgroundColor: `${color}18`, 
                      color: color, 
                      border: `1px solid ${color}44`, 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      display: 'inline-block', 
                      marginBottom: '0.5rem' 
                    }}
                  >
                    ⚠️ {zone.name} &bull; {zone.riskLevel.toUpperCase()} RISK
                  </span>
                  <p className="description" style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '0.6rem' }}>
                    {zone.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                    <div>📊 Local Flooding Chance: <strong style={{ color: '#f1f5f9' }}>{zone.probability}%</strong></div>
                    <div>🌧️ 24h Rainfall Expected: <strong style={{ color: '#f1f5f9' }}>{zone.precipitationForecast} mm</strong></div>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 2. Render Live Weather Badges directly on cities */}
        {showWeather && forecasts.map((city, idx) => {
          const emoji = city.summary.split(' ')[1] || '⛅';
          return (
            <Marker
              key={`weather-${idx}`}
              position={[city.latitude, city.longitude]}
              icon={createWeatherDivIcon(emoji, city.currentTemp)}
            >
              <Popup>
                <div className="weather-popup-detail" style={{ minWidth: '180px' }}>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.95rem', color: '#60a5fa' }}>{city.name}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', fontWeight: 500 }}>
                    {city.summary}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                    <div>🌡️ Temperature: <strong style={{ color: '#f8fafc' }}>{city.currentTemp.toFixed(1)}°C</strong></div>
                    <div>💧 Humidity: <strong style={{ color: '#f8fafc' }}>{city.humidity}%</strong></div>
                    <div>💨 Wind Speed: <strong style={{ color: '#f8fafc' }}>{city.windSpeed.toFixed(1)} km/h</strong></div>
                    <div>🌧️ Precipitation Chance: <strong style={{ color: '#60a5fa' }}>{city.rainProbability}%</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Render Earthquakes */}
        {showEarthquakes && earthquakes.map((eq) => {
          const mag = eq.details?.magnitude ?? 4.0;
          return (
            <Marker
              key={eq.id}
              ref={el => { markerRefs.current[eq.id] = el; }}
              position={[eq.latitude, eq.longitude]}
              icon={earthquakeIcon}
            >
              <Popup>
                <div className="seismic-popup-detail">
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#f87171' }}>
                    🌋 Seismic Event (M {mag.toFixed(1)})
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {eq.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                    <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{eq.locationName}</strong></div>
                    <div>📉 Depth: <strong style={{ color: '#f8fafc' }}>{(eq.details?.depth ?? 10).toFixed(1)} km</strong></div>
                    <div>🕒 Time: <strong style={{ color: '#f8fafc' }}>{new Date(eq.timestamp).toLocaleTimeString()}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Render Forest Fires */}
        {showFires && wildfires.map((fire) => (
          <Marker
            key={fire.id}
            ref={el => { markerRefs.current[fire.id] = el; }}
            position={[fire.latitude, fire.longitude]}
            icon={fireIcon}
          >
            <Popup>
              <div className="fire-popup-detail">
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#fb923c' }}>
                  🔥 Forest Fire Alert
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {fire.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{fire.locationName}</strong></div>
                  <div>🕒 Detected: <strong style={{ color: '#f8fafc' }}>{new Date(fire.timestamp).toLocaleDateString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5. Render Landslides */}
        {showWeather && landslides.map((warn) => (
          <Marker
            key={warn.id}
            ref={el => { markerRefs.current[warn.id] = el; }}
            position={[warn.latitude, warn.longitude]}
            icon={landslideIcon}
          >
            <Popup>
              <div className="landslide-popup-detail">
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#f87171' }}>
                  ⛰️ Landslide Warning
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {warn.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{warn.locationName}</strong></div>
                  <div>🕒 Warnings Issued: <strong style={{ color: '#f8fafc' }}>{new Date(warn.timestamp).toLocaleTimeString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 6. Render Cloud Bursts */}
        {showWeather && cloudbursts.map((warn) => (
          <Marker
            key={warn.id}
            ref={el => { markerRefs.current[warn.id] = el; }}
            position={[warn.latitude, warn.longitude]}
            icon={cloudBurstIcon}
          >
            <Popup>
              <div className="cloudburst-popup-detail">
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#c084fc' }}>
                  ⛈️ Cloud Burst Alert
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {warn.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{warn.locationName}</strong></div>
                  <div>🕒 Warnings Issued: <strong style={{ color: '#f8fafc' }}>{new Date(warn.timestamp).toLocaleTimeString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 7. Render Thunderstorms */}
        {showWeather && thunderstorms.map((warn) => (
          <Marker
            key={warn.id}
            ref={el => { markerRefs.current[warn.id] = el; }}
            position={[warn.latitude, warn.longitude]}
            icon={thunderstormIcon}
          >
            <Popup>
              <div className="thunderstorm-popup-detail">
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                  ⚡ Thunderstorm & Lightning
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {warn.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{warn.locationName}</strong></div>
                  <div>🕒 Warnings Issued: <strong style={{ color: '#f8fafc' }}>{new Date(warn.timestamp).toLocaleTimeString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 8. Render General Rain Duration Advisories */}
        {showWeather && generalRains.map((warn) => (
          <Marker
            key={warn.id}
            ref={el => { markerRefs.current[warn.id] = el; }}
            position={[warn.latitude, warn.longitude]}
            icon={rainWarningIcon}
          >
            <Popup>
              <div className="rain-popup-detail">
                <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                  🌧️ Rainfall Duration Advisory
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {warn.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                  <div>📍 Location: <strong style={{ color: '#f8fafc' }}>{warn.locationName}</strong></div>
                  <div>🕒 Warnings Issued: <strong style={{ color: '#f8fafc' }}>{new Date(warn.timestamp).toLocaleTimeString()}</strong></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 9. Render Previous Flood Affected Areas & Donation/Relief Hubs */}
        {showHistoricalFloods && historicalFloods.map((zone) => {
          const isAs = language === 'as';
          
          // Translate needed supplies (fully stripped of emojis)
          const translateSupply = (item: string) => {
            if (!isAs) return item.replace(/[💧🍼⛺💊🍚🧴🦟🩹🩺🔦]/g, '').trim();
            if (item.includes('Water Purification')) return 'খোৱা পানীৰ টেবলেট';
            if (item.includes('Baby Milk') || item.includes('Baby Formula')) return 'কেঁচুৱাৰ গাখীৰ গুড়ি';
            if (item.includes('Tarpaulin')) return 'তাৰ্পোলিন শ্বীট (তম্বু)';
            if (item.includes('ORS')) return 'ও.আৰ.এচ. পেকেট';
            if (item.includes('Dry Rations')) return 'শুকান খাদ্য (চিৰা, মুড়ি, গুৰ)';
            if (item.includes('Dettol')) return 'ডেটল আৰু ব্লিচিং পাউদাৰ';
            if (item.includes('Mosquito')) return 'আঠুৱা';
            if (item.includes('First-Aid')) return 'প্ৰাথমিক চিকিৎসা কিট';
            if (item.includes('Sanitary')) return 'চেনিটেৰী নেপকিন';
            if (item.includes('Flashlights')) return 'টৰ্চ লাইট আৰু বেটাৰী';
            return item;
          };

          const getTranslatedDetails = (zId: string) => {
            if (!isAs) return zone.details;
            if (zId === 'prev-f-majuli') {
              return 'মথাউৰি আৰু নদী কাষৰীয়া অঞ্চল প্লাবিত হৈছিল। বৰ্তমান বানৰ পানী হ্ৰাস পাইছে যদিও খোৱা পানীৰ উৎসসমূহ ব্যৱহাৰৰ অনুপযোগী হৈ পৰিছে।';
            }
            if (zId === 'prev-f-morigaon') {
              return 'তীব্ৰ বানপানীৰ পিছত অঞ্চলটো বৰ্তমান স্বাভাৱিক অৱস্থালৈ ঘূৰি আহিছে। স্বেচ্ছাসেৱক দলে বৰ্তমান ক্ষতিগ্ৰস্ত পৰিয়ালসমূহক সাহায্য যোগান ধৰি আছে।';
            }
            if (zId === 'prev-f-barpeta') {
              return 'বাঢ়নী পানীয়ে নামনি অসমৰ এই অংশ প্লাবিত কৰিছিল। পানী কমাৰ লগে লগে চাফ-চিকুণ কাৰ্যসূচী সক্ৰিয় কৰা হৈছে আৰু ৰোগ প্ৰতিৰোধৰ কাম চলি আছে।';
            }
            if (zId === 'prev-f-dibrugarh') {
              return 'চহৰৰ নিষ্কাশন নলা বন্ধ হৈ নিম্ন অঞ্চলসমূহ প্লাবিত হৈছিল। বৰ্তমান পুনৰ সংস্থাপন কাৰ্য সক্ৰিয় হৈ আছে আৰু চাফ-চিকুণৰ বাবে সাহায্য সামগ্ৰী বিতৰণ চলি আছে।';
            }
            return zone.details;
          };

          const getTranslatedHub = (zId: string) => {
            if (!isAs) return zone.reliefHubName;
            if (zId === 'prev-f-majuli') return 'মাজুলী/যোৰহাট সাহায্য কেন্দ্ৰ';
            if (zId === 'prev-f-morigaon') return 'মৰিগাঁও সাহায্য যোগান কেন্দ্ৰ';
            if (zId === 'prev-f-barpeta') return 'গুৱাহাটী/বৰপেটা চৰকাৰী সাহায্য শিবিৰ';
            if (zId === 'prev-f-dibrugarh') return 'ডিব্ৰুগড় সাহায্য সামগ্ৰী বিতৰণ কেন্দ্ৰ';
            return zone.reliefHubName;
          };

          return (
            <div key={zone.id}>
              {/* Circular Inundation Area */}
              <Circle
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius}
                pathOptions={{
                  color: '#a855f7',
                  fillColor: '#a855f7',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
              
              {/* Relief Donation drop pin at center */}
              <Marker
                position={[zone.latitude, zone.longitude]}
                icon={cloudBurstIcon}
              >
                <Popup maxWidth={320}>
                  <div style={{ minWidth: '220px' }}>
                    <span style={{ 
                      backgroundColor: 'rgba(168, 85, 247, 0.12)', 
                      color: '#a855f7', 
                      border: '1px solid rgba(168, 85, 247, 0.3)', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.725rem', 
                      fontWeight: 700, 
                      display: 'inline-block', 
                      marginBottom: '0.5rem' 
                    }}>
                      {isAs ? 'বান সাহায্য আৰু পুনৰ সংস্থাপন কেন্দ্ৰ' : 'Flood Relief & Recovery Hub'}
                    </span>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', color: '#f1f5f9' }}>
                      {getTranslatedHub(zone.id)}
                    </h4>
                    <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {getTranslatedDetails(zone.id)}
                    </p>
                    
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.725rem', color: '#f8fafc', display: 'block', marginBottom: '0.25rem' }}>
                        {isAs ? 'প্ৰয়োজনীয় সাহায্য সামগ্ৰী:' : 'Requested Relief Supplies:'}
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {zone.neededSupplies.map((s, idx) => (
                          <div key={idx} style={{ fontSize: '0.7rem', color: '#fb923c', paddingLeft: '0.4rem' }}>
                            • {translateSupply(s)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                      <div>{isAs ? 'প্ৰভাৱিত লোক:' : 'Affected Population:'} <strong style={{ color: '#f1f5f9' }}>{zone.affectedPopulation.toLocaleString()}</strong></div>
                      <div>{isAs ? 'নষ্ট হোৱা কৃষি ভূমি:' : 'Crop Damage Plain:'} <strong style={{ color: '#f1f5f9' }}>{zone.cropDamageHectares.toLocaleString()} Hectares</strong></div>
                      <div style={{ marginTop: '0.2rem', color: '#a855f7' }}>{isAs ? 'সমন্বয়ক যোগাযোগ:' : 'Relief Coordinator:'} <strong>{zone.contactNumber}</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}

      </MapContainer>
    </div>
  );
}
