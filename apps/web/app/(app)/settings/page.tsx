import Link from "next/link";
import { ExternalLink, MapPin, BookOpen, Users, Home } from "lucide-react";
import { getAllChildren } from "@/lib/children-queries";
import { getExperiences } from "@/lib/experience-queries";
import { getAllPlaces } from "@/lib/places-queries";
import { getAppConfig } from "@/lib/settings-queries";
import { EditChildDialog } from "@/components/children/edit-child-dialog";
import { ArchiveChildButton } from "@/components/children/archive-child-button";
import { EditPlaceDialog } from "@/components/places/edit-place-dialog";
import { AddChildDialog } from "@/components/children/add-child-dialog";
import { AddExperienceDialog } from "@/components/experiences/add-experience-dialog";
import { AddPlaceDialog } from "@/components/places/add-place-dialog";
import { HomeLocationForm } from "@/components/settings/home-location-form";

export const dynamic = "force-dynamic";

function SectionHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function ageFromDOB(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear() -
    (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  return `${years}y`;
}

export default async function SettingsPage() {
  const [allChildren, allExperiences, allPlaces, config] = await Promise.all([
    getAllChildren(),
    getExperiences(),
    getAllPlaces(),
    getAppConfig(),
  ]);

  const activeChildren = allChildren.filter((c) => c.active);
  const archivedChildren = allChildren.filter((c) => !c.active);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage children, experiences, and places.
        </p>
      </div>

      {/* ── Home location ── */}
      <section id="location">
        <SectionHeader title="Location" icon={Home} />
        <div className="rounded-lg border bg-card p-4">
          <HomeLocationForm
            currentPostcode={config?.homePostcode ?? null}
            hasCoords={config?.homeLatitude != null}
          />
        </div>
      </section>

      {/* ── Children ── */}
      <section id="children">
        <SectionHeader
          title="Children"
          icon={Users}
          action={<AddChildDialog />}
        />

        <div className="rounded-lg border overflow-hidden divide-y">
          {activeChildren.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-card"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {child.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {child.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ageFromDOB(child.dateOfBirth)} old · born{" "}
                    {new Date(child.dateOfBirth).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <EditChildDialog child={child} />
                <ArchiveChildButton childId={child.id} active={true} />
              </div>
            </div>
          ))}

          {activeChildren.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center bg-card">
              No active children. Add one to get started.
            </div>
          )}
        </div>

        {archivedChildren.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Archived
            </p>
            <div className="rounded-lg border overflow-hidden divide-y opacity-60">
              {archivedChildren.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {child.name[0]}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {child.name}
                    </p>
                  </div>
                  <ArchiveChildButton childId={child.id} active={false} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Experiences ── */}
      <section id="experiences">
        <SectionHeader
          title="Experiences"
          icon={BookOpen}
          action={<AddExperienceDialog />}
        />

        <div className="rounded-lg border overflow-hidden divide-y">
          {allExperiences.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-card"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {exp.title}
                </p>
                <p className="text-xs text-muted-foreground">{exp.category}</p>
              </div>
              <Link
                href={`/experiences/${exp.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Edit
              </Link>
            </div>
          ))}

          {allExperiences.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center bg-card">
              No experiences yet.
            </div>
          )}
        </div>
      </section>

      {/* ── Places ── */}
      <section id="places">
        <SectionHeader
          title="Places"
          icon={MapPin}
          action={<AddPlaceDialog />}
        />

        <div className="rounded-lg border overflow-hidden divide-y">
          {allPlaces.map((place) => (
            <div
              key={place.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-card"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {place.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[place.location, place.distanceMinutes ? `${place.distanceMinutes} min` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <EditPlaceDialog place={place} />
            </div>
          ))}

          {allPlaces.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center bg-card">
              No places yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
