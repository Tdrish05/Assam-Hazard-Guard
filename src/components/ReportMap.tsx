'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Orange pin for user-reported incident
const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ReportMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  lat: number | null;
  lng: number | null;
}

// Sub-component to capture map click events
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Sub-component to pan/fly map when parent coordinates update from dropdown selection
function MapUpdateController({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null) {
      map.setView([lat, lng], 10, { animate: true, duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function ReportMap({ onLocationSelect, lat, lng }: ReportMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : null
  );

  // Sync internal marker position when parent props change
  useEffect(() => {
    if (lat !== null && lng !== null) {
      setPosition([lat, lng]);
    } else {
      setPosition(null);
    }
  }, [lat, lng]);

  // Center of Assam
  const defaultCenter: [number, number] = [26.2006, 92.9376];

  const handleMapClick = (clickLat: number, clickLng: number) => {
    const latRounded = parseFloat(clickLat.toFixed(5));
    const lngRounded = parseFloat(clickLng.toFixed(5));
    setPosition([latRounded, lngRounded]);
    onLocationSelect(latRounded, lngRounded);
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '340px', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onMapClick={handleMapClick} />
        <MapUpdateController lat={lat} lng={lng} />

        {position && (
          <Marker position={position} icon={incidentIcon} />
        )}
      </MapContainer>
    </div>
  );
}
