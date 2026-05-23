"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Clock } from "lucide-react";

export type MapPlace = {
  id: string;
  name: string;
  location: string | null;
  distanceMinutes: number | null;
  latitude: number;
  longitude: number;
  experienceCount?: number;
};

function buildIcon() {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.4)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

function center(places: MapPlace[]): [number, number] {
  const lats = places.map((p) => p.latitude);
  const lngs = places.map((p) => p.longitude);
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
}

type Props = {
  places: MapPlace[];
  height?: string;
  linkToDetail?: boolean;
};

export function PlacesMap({ places, height = "480px", linkToDetail = true }: Props) {
  useEffect(() => {
    // Patch Leaflet's default icon resolution issue with bundlers
    // (using divIcon above so this is just a safety guard)
  }, []);

  if (places.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground" style={{ height }}>
        No mapped locations
      </div>
    );
  }

  const icon = buildIcon();
  const mapCenter = places.length === 1 ? [places[0].latitude, places[0].longitude] as [number, number] : center(places);
  const zoom = places.length === 1 ? 13 : 9;

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {places.map((place) => (
          <Marker key={place.id} position={[place.latitude, place.longitude]} icon={icon}>
            <Popup>
              <div className="space-y-1 min-w-[140px]">
                {linkToDetail ? (
                  <Link href={`/places/${place.id}`} className="font-medium text-sm hover:underline">
                    {place.name}
                  </Link>
                ) : (
                  <p className="font-medium text-sm">{place.name}</p>
                )}
                {place.location && (
                  <p className="text-xs text-gray-500">{place.location}</p>
                )}
                {place.distanceMinutes && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={10} />
                    {place.distanceMinutes} min away
                  </p>
                )}
                {place.experienceCount !== undefined && (
                  <p className="text-xs text-gray-500">
                    {place.experienceCount} experience{place.experienceCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
