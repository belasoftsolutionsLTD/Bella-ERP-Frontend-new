'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

// Leaflet's default marker icon references image files by a relative path that
// webpack/Next's bundler doesn't resolve — the standard fix is pointing the default
// icon at CDN-hosted copies of the same images instead of trying to bundle them.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Free, no-API-key OpenStreetMap map — click anywhere to drop/move the pin. Deliberately
// not Google Maps: this org would otherwise need to set up a paid Google Cloud billing
// account just to get a key, the same friction that pushed the CAPTCHA choice toward
// Cloudflare Turnstile earlier in this batch.
export default function LocationPickerMap({
  lat, lng, onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  // Default view: Nairobi, Kenya — this deployment's home market (KES currency,
  // Kenya-specific payroll/statutory logic elsewhere in the app).
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : [-1.2921, 36.8219];

  useEffect(() => {
    if (mapRef.current && lat != null && lng != null) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <MapContainer
      center={center}
      zoom={lat != null ? 15 : 12}
      style={{ height: '320px', width: '100%', borderRadius: '0.75rem' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {lat != null && lng != null && <Marker position={[lat, lng]} />}
      <ClickHandler onPick={onPick} />
    </MapContainer>
  );
}
