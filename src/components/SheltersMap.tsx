'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shelter } from '@/lib/shelters';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

// Sub-component to handle map centering dynamically
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 9, { animate: true, duration: 1.2 });
  }, [center, map]);
  return null;
}

interface SheltersMapProps {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
}

export default function SheltersMap({ shelters, selectedShelter }: SheltersMapProps) {
  // Center of Assam
  const defaultCenter: [number, number] = [26.2006, 92.9376];
  const centerPosition = selectedShelter 
    ? [selectedShelter.latitude, selectedShelter.longitude] as [number, number]
    : defaultCenter;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '380px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedShelter && <MapCenterController center={centerPosition} />}

        {shelters.map((shelter) => (
          <Marker
            key={shelter.id}
            position={[shelter.latitude, shelter.longitude]}
            icon={shelterIcon}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong style={{ color: '#10b981', display: 'block', fontSize: '0.85rem' }}>
                  {shelter.name}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{shelter.locationName}</span>
                <div style={{ marginTop: '0.4rem', fontSize: '0.725rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.3rem' }}>
                  Occupancy: <strong>{shelter.occupied} / {shelter.capacity}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
