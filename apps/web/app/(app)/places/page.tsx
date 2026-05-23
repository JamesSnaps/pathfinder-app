import Link from "next/link";
import { getAllPlaces } from "@/lib/places-queries";
import { MapPin, Phone, Globe, ExternalLink, Map, List } from "lucide-react";
import { PlacesMapLoader } from "@/components/places/places-map-loader";
import type { MapPlace } from "@/components/places/places-map";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ view?: string }> };

export default async function PlacesPage({ searchParams }: Props) {
  const { view } = await searchParams;
  const isMapView = view === "map";

  const places = await getAllPlaces();

  const mappablePlaces: MapPlace[] = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      distanceMinutes: p.distanceMinutes,
      latitude: p.latitude!,
      longitude: p.longitude!,
      experienceCount: p.experiencePlaces.length,
    }));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Places</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {places.length} provider{places.length !== 1 ? "s" : ""} and locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden text-sm">
            <Link
              href="/places"
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                !isMapView
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Link>
            <Link
              href="/places?view=map"
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                isMapView
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              Map
            </Link>
          </div>
        </div>
      </div>

      {isMapView ? (
        <div className="space-y-4">
          <PlacesMapLoader places={mappablePlaces} height="520px" />
          {mappablePlaces.length < places.length && (
            <p className="text-xs text-muted-foreground">
              {places.length - mappablePlaces.length} place{places.length - mappablePlaces.length !== 1 ? "s" : ""} without coordinates — edit them to add to the map.
            </p>
          )}
        </div>
      ) : places.length === 0 ? (
        <p className="text-sm text-muted-foreground">No places added yet.</p>
      ) : (
        <div className="space-y-3">
          {places.map((place) => {
            const mapsQuery = encodeURIComponent(
              [place.name, place.postcode || place.location].filter(Boolean).join(", ") + ", UK"
            );
            return (
              <Link
                key={place.id}
                href={`/places/${place.id}`}
                className="flex items-stretch gap-0 rounded-lg border bg-card hover:bg-accent/50 transition-colors overflow-hidden"
              >
                {/* Mini map */}
                {(place.postcode || place.location) && (
                  <div className="shrink-0 w-[160px] hidden sm:block">
                    <iframe
                      title={`Map: ${place.name}`}
                      width="160"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed&zoom=13`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="block w-full h-full pointer-events-none border-r"
                      style={{ minHeight: "120px" }}
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex flex-1 items-start justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-medium text-foreground">{place.name}</p>

                    {(place.location || place.distanceMinutes) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {place.location}
                        {place.distanceMinutes && (
                          <span className="text-muted-foreground/70">
                            · {place.distanceMinutes} min away
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {place.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {place.phone}
                        </span>
                      )}
                      {place.websiteUrl && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Website
                        </span>
                      )}
                      {place.bookingUrl && (
                        <span className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Book online
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {place.experiencePlaces.length} experience
                      {place.experiencePlaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
