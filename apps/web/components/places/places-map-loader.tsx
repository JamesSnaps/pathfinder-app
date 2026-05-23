"use client";

import nextDynamic from "next/dynamic";
import type { MapPlace } from "./places-map";

const PlacesMap = nextDynamic(
  () => import("./places-map").then((m) => ({ default: m.PlacesMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground" style={{ height: "520px" }}>
        Loading map…
      </div>
    ),
  }
);

export function PlacesMapLoader({ places, height }: { places: MapPlace[]; height?: string }) {
  return <PlacesMap places={places} height={height} />;
}
