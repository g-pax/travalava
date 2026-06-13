"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  color?: string;
  popup?: ReactNode;
}

export interface LeafletMapProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
  fitToMarkers?: boolean;
}

const DEFAULT_CENTER = { lat: 38.7223, lng: -9.1393 }; // Lisbon

/** Teardrop pin as a div icon — avoids the broken default-icon bundler issue
 *  and lets us tint per marker. Color comes from a CSS var so themes apply. */
function pinIcon(color: string) {
  const fill = color || "var(--primary, #b8472e)";
  return L.divIcon({
    className: "",
    html: `<svg width="26" height="34" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="${fill}"/>
      <circle cx="12" cy="12" r="4.5" fill="#fff"/>
    </svg>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [markers, map]);
  return null;
}

export default function LeafletMapImpl({
  markers = [],
  center,
  zoom = 13,
  className,
  onMapClick,
  fitToMarkers = true,
}: LeafletMapProps) {
  const start = center ?? markers[0] ?? DEFAULT_CENTER;
  return (
    <MapContainer
      center={[start.lat, start.lng]}
      zoom={zoom}
      scrollWheelZoom
      className={className}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={pinIcon(m.color || "")}
          title={m.title}
        >
          {m.popup ? <Popup>{m.popup}</Popup> : null}
        </Marker>
      ))}
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      {fitToMarkers && markers.length > 0 && <FitBounds markers={markers} />}
    </MapContainer>
  );
}
