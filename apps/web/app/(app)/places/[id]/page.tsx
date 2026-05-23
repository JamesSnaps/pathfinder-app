import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlaceDetail } from "@/lib/places-queries";
import { DashboardSection } from "@/components/dashboard/section";
import { ArrowLeft, MapPin, Phone, Globe, ExternalLink, Clock } from "lucide-react";
import { EditPlaceDialog } from "@/components/places/edit-place-dialog";
import { PlaceExperiencesSection } from "@/components/places/place-experiences-section";

export const dynamic = "force-dynamic";

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = await getPlaceDetail(id);
  if (!place) notFound();

  const mapsQuery = encodeURIComponent(
    [place.name, place.location, place.postcode].filter(Boolean).join(", ")
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/places"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All places
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-semibold text-foreground flex-1">{place.name}</h1>
          <EditPlaceDialog
            place={{
              id: place.id,
              name: place.name,
              location: place.location,
              postcode: place.postcode,
              websiteUrl: place.websiteUrl,
              bookingUrl: place.bookingUrl,
              phone: place.phone,
              distanceMinutes: place.distanceMinutes,
              notes: place.notes,
            }}
          />
        </div>

        {(place.location || place.postcode || place.distanceMinutes) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {[place.location, place.postcode].filter(Boolean).join(", ")}
            {place.distanceMinutes && (
              <span className="flex items-center gap-1 ml-1">
                <Clock className="h-3.5 w-3.5" />
                {place.distanceMinutes} min away
              </span>
            )}
          </div>
        )}

        {/* Contact & links */}
        <div className="flex flex-wrap gap-3">
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              {place.phone}
            </a>
          )}
          {place.websiteUrl && (
            <a
              href={place.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {place.bookingUrl && (
            <a
              href={place.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Book online
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4" />
            View on map
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {place.notes && (
          <p className="text-sm text-muted-foreground italic border-l-2 pl-3">{place.notes}</p>
        )}
      </div>

      {/* Map embed */}
      {(place.postcode || place.location) && (
        <div className="rounded-lg overflow-hidden border">
          <iframe
            title={`Map of ${place.name}`}
            width="100%"
            height="280"
            src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block"
          />
        </div>
      )}

      {/* Linked experiences — always visible, interactive */}
      <DashboardSection title="Experiences here">
        <PlaceExperiencesSection
          placeId={place.id}
          linkedExperiences={place.experiencePlaces.map((ep) => ({
            id: ep.id,
            experienceId: ep.experienceId,
            minimumAgeMonthsOverride: ep.minimumAgeMonthsOverride,
            notes: ep.notes,
            experience: {
              id: ep.experience.id,
              title: ep.experience.title,
              category: ep.experience.category,
            },
          }))}
          unlinkedExperiences={place.unlinkedExperiences}
        />
      </DashboardSection>
    </div>
  );
}
