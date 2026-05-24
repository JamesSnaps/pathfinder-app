"use client";

import { useState } from "react";
import nextDynamic from "next/dynamic";
import { Map, List } from "lucide-react";
import type { MapPlace } from "@/components/places/places-map";
import { ExperiencePlacesEditor } from "./experience-places-editor";

const PlacesMap = nextDynamic(
  () => import("@/components/places/places-map").then((m) => ({ default: m.PlacesMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 h-64 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

type LinkedPlace = {
  id: string;
  minimumAgeMonthsOverride: number | null;
  notes: string | null;
  place: {
    id: string;
    name: string;
    location: string | null;
    distanceMinutes: number | null;
    phone: string | null;
    websiteUrl: string | null;
    bookingUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  };
};

type Props = {
  experienceId: string;
  linkedPlaces: LinkedPlace[];
  allPlaces: { id: string; name: string }[];
  homeLocation?: { lat: number; lng: number } | null;
};

export function ExperiencePlacesMapPanel({ experienceId, linkedPlaces, allPlaces, homeLocation }: Props) {
  const [view, setView] = useState<"list" | "map">("list");

  const mappable: MapPlace[] = linkedPlaces
    .filter((ep) => ep.place.latitude != null && ep.place.longitude != null)
    .map((ep) => ({
      id: ep.place.id,
      name: ep.place.name,
      location: ep.place.location,
      distanceMinutes: ep.place.distanceMinutes,
      latitude: ep.place.latitude!,
      longitude: ep.place.longitude!,
    }));

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-md border overflow-hidden text-xs">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
              view === "list"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <List className="h-3 w-3" />
            List
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
              view === "map"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Map className="h-3 w-3" />
            Map
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="space-y-2">
          <PlacesMap places={mappable} height="320px" linkToDetail homeLocation={homeLocation ?? undefined} />
          {mappable.length < linkedPlaces.length && (
            <p className="text-xs text-muted-foreground">
              {linkedPlaces.length - mappable.length} place
              {linkedPlaces.length - mappable.length !== 1 ? "s" : ""} without coordinates not shown on map.
            </p>
          )}
        </div>
      ) : (
        <ExperiencePlacesEditor
          experienceId={experienceId}
          linkedPlaces={linkedPlaces}
          allPlaces={allPlaces}
          homeLocation={homeLocation ?? null}
        />
      )}
    </div>
  );
}
