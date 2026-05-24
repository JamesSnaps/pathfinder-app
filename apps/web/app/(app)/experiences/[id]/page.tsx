import { notFound } from "next/navigation";
import Link from "next/link";
import { getExperienceDetail } from "@/lib/experience-queries";
import { getAllPlaces } from "@/lib/places-queries";
import { getAppConfig } from "@/lib/settings-queries";
import { ArrowLeft } from "lucide-react";
import { ExperienceInlineEditor } from "@/components/experiences/experience-inline-editor";
import { ExperiencePlacesMapPanel } from "@/components/experiences/experience-places-map-panel";
import { ChildExperienceCards } from "@/components/experiences/child-experience-cards";
import { ActionsPanel } from "@/components/experiences/actions-panel";
import { MemoriesPanel } from "@/components/experiences/memories-panel";

export const dynamic = "force-dynamic";

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-medium">
          {count}
        </span>
      )}
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exp, allPlaces, config] = await Promise.all([getExperienceDetail(id), getAllPlaces(), getAppConfig()]);
  const homeLocation = config?.homeLatitude != null && config.homeLongitude != null
    ? { lat: config.homeLatitude, lng: config.homeLongitude }
    : null;
  if (!exp) notFound();

  // Serialize dates so perChild data is safe to pass to client components
  const perChildForClient = exp.perChild.map((pc) => ({
    child: {
      id: pc.child.id,
      name: pc.child.name,
      dateOfBirth: pc.child.dateOfBirth,
    },
    childExperience: pc.childExperience
      ? {
          id: pc.childExperience.id,
          status: pc.childExperience.status,
          priority: pc.childExperience.priority,
          targetDate: pc.childExperience.targetDate,
          completedDate: pc.childExperience.completedDate,
          bookingReference: pc.childExperience.bookingReference,
          planningNotes: pc.childExperience.planningNotes,
          actions: pc.childExperience.actions.map((a) => ({
            id: a.id,
            description: a.description,
            actionType: a.actionType,
            completedAt: a.completedAt?.toISOString() ?? null,
            dueDate: a.dueDate,
            notes: a.notes,
          })),
          activityLog: pc.childExperience.activityLog.map((l) => ({
            id: l.id,
            date: l.date,
            whatHappened: l.whatHappened,
            childReaction: l.childReaction,
            parentNotes: l.parentNotes,
            rating: l.rating,
            wouldRepeat: l.wouldRepeat,
            costActual: l.costActual,
            durationMinutes: l.durationMinutes,
          })),
        }
      : null,
    isEligible: pc.isEligible,
    monthsUntilEligible: pc.monthsUntilEligible,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/experiences"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Experience library
      </Link>

      {/* Hero header — inline editable */}
      <ExperienceInlineEditor
        experience={{
          id: exp.id,
          title: exp.title,
          description: exp.description,
          category: exp.category,
          minimumAgeMonths: exp.minimumAgeMonths,
          idealAgeMinMonths: exp.idealAgeMinMonths,
          idealAgeMaxMonths: exp.idealAgeMaxMonths,
          season: exp.season,
          costBand: exp.costBand,
          typicalDurationHours: exp.typicalDurationHours,
          parentConfidenceRequired: exp.parentConfidenceRequired,
          repeatable: exp.repeatable,
          notes: exp.notes,
          imageUrl: exp.imageUrl ?? null,
        }}
      />

      {/* Per-child status */}
      <ChildExperienceCards
        experienceId={exp.id}
        experienceTitle={exp.title}
        perChild={perChildForClient}
      />

      {/* Places */}
      <section className="space-y-0">
        <SectionHeader title="Places" />
        <ExperiencePlacesMapPanel
          experienceId={exp.id}
          linkedPlaces={exp.experiencePlaces.map((ep) => ({
            id: ep.id,
            minimumAgeMonthsOverride: ep.minimumAgeMonthsOverride,
            notes: ep.notes,
            place: {
              id: ep.place.id,
              name: ep.place.name,
              location: ep.place.location,
              distanceMinutes: ep.place.distanceMinutes,
              phone: ep.place.phone,
              websiteUrl: ep.place.websiteUrl,
              bookingUrl: ep.place.bookingUrl,
              latitude: ep.place.latitude,
              longitude: ep.place.longitude,
            },
          }))}
          allPlaces={allPlaces.map((p) => ({ id: p.id, name: p.name }))}
          homeLocation={homeLocation}
        />
      </section>

      {/* Actions */}
      <ActionsPanel
        experienceId={exp.id}
        experienceTitle={exp.title}
        experienceCategory={exp.category}
        perChild={perChildForClient}
      />

      {/* Memories */}
      <MemoriesPanel
        experienceId={exp.id}
        experienceTitle={exp.title}
        experienceCategory={exp.category}
        perChild={perChildForClient}
      />
    </div>
  );
}
