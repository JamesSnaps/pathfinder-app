import { notFound } from "next/navigation";
import Link from "next/link";
import { getChildProfile } from "@/lib/children-queries";
import { DashboardSection } from "@/components/dashboard/section";
import { MilestoneCard } from "@/components/dashboard/milestone-card";
import { formatAge } from "@/lib/age";
import { Badge } from "@pathfinder/ui";
import { ArrowLeft } from "lucide-react";
import { EditChildDialog } from "@/components/children/edit-child-dialog";
import { ChildAvatar } from "@/components/children/child-avatar";
import { AddMemoryDialog } from "@/components/children/add-memory-dialog";
import { TrackExperienceDialog } from "@/components/children/track-experience-dialog";
import { ProfileExperienceCard } from "@/components/children/profile-experience-card";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getChildProfile(id);

  if (!profile) notFound();

  const years = Math.floor(profile.ageMonths / 12);
  const months = profile.ageMonths % 12;
  const ageLabel = months > 0 ? `${years} years, ${months} months` : `${years} years`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Back nav */}
      <Link
        href="/children"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All children
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <ChildAvatar name={profile.name} avatarUrl={profile.avatarUrl} size="md" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{ageLabel}</p>
        </div>
        <EditChildDialog
          child={{
            id: profile.id,
            name: profile.name,
            dateOfBirth: profile.dateOfBirth,
            avatarUrl: profile.avatarUrl,
            notes: profile.notes,
            active: profile.active,
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Ready now" value={profile.availableNow.length} />
        <StatCard label="In planning" value={profile.plannedAndBooked.length} />
        <StatCard label="Coming up soon" value={profile.comingSoon.length} />
        <StatCard label="Done" value={profile.completed.length} />
      </div>

      {/* Track experience button */}
      <div className="flex justify-end">
        <TrackExperienceDialog
          childId={profile.id}
          childName={profile.name}
          untrackedExperiences={profile.untrackedExperiences}
        />
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Available now */}
        <DashboardSection
          title="Available now"
          empty={
            profile.availableNow.length === 0
              ? "Nothing available yet — track some experiences to get started."
              : undefined
          }
        >
          <div className="space-y-2">
            {profile.availableNow.map((ce) => (
              <ProfileExperienceCard
                key={ce.id}
                childExperienceId={ce.id}
                experienceId={ce.experienceId}
                childId={profile.id}
                title={ce.experience.title}
                status={ce.status}
                category={ce.experience.category}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Planned & Booked */}
        <DashboardSection
          title="Planned & booked"
          empty={
            profile.plannedAndBooked.length === 0
              ? "Nothing planned yet."
              : undefined
          }
        >
          <div className="space-y-2">
            {profile.plannedAndBooked.map((ce) => (
              <ProfileExperienceCard
                key={ce.id}
                childExperienceId={ce.id}
                experienceId={ce.experienceId}
                childId={profile.id}
                title={ce.experience.title}
                status={ce.status}
                category={ce.experience.category}
                meta={
                  ce.targetDate
                    ? `Target: ${new Date(ce.targetDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`
                    : undefined
                }
              />
            ))}
          </div>
        </DashboardSection>

        {/* Coming up soon */}
        {profile.comingSoon.length > 0 && (
          <DashboardSection title="Coming up for eligibility">
            <div className="space-y-2">
              {profile.comingSoon.map((ce) => {
                const months = Math.ceil(
                  (new Date(profile.dateOfBirth).getTime() +
                    (ce.experience.minimumAgeMonths ?? 0) * 30 * 24 * 60 * 60 * 1000 -
                    Date.now()) /
                    (30 * 24 * 60 * 60 * 1000)
                );
                return (
                  <ProfileExperienceCard
                    key={ce.id}
                    childExperienceId={ce.id}
                    experienceId={ce.experienceId}
                    childId={profile.id}
                    title={ce.experience.title}
                    status={ce.status}
                    category={ce.experience.category}
                    meta={`Available in ~${months} month${months !== 1 ? "s" : ""}`}
                  />
                );
              })}
            </div>
          </DashboardSection>
        )}

        {/* Completed */}
        <DashboardSection
          title="Completed"
          empty={
            profile.completed.length === 0
              ? "No completed experiences yet."
              : undefined
          }
        >
          <div className="space-y-2">
            {profile.completed.map((ce) => {
              const log = ce.activityLog[0];
              return (
                <ProfileExperienceCard
                  key={ce.id}
                  childExperienceId={ce.id}
                  experienceId={ce.experienceId}
                  childId={profile.id}
                  title={ce.experience.title}
                  status={ce.status}
                  category={ce.experience.category}
                  meta={
                    ce.completedDate
                      ? new Date(ce.completedDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : log?.rating
                      ? `${"★".repeat(log.rating)}`
                      : undefined
                  }
                />
              );
            })}
          </div>
        </DashboardSection>
      </div>

      {/* Upcoming milestones */}
      {profile.milestones.length > 0 && (
        <DashboardSection title="Coming up for eligibility (not yet added)">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {profile.milestones.map((m, i) => (
              <MilestoneCard
                key={i}
                childName={profile.name}
                experienceTitle={m.experienceTitle}
                experienceId={m.experienceId}
                category={m.category}
                daysUntil={m.daysUntil}
                eligibleDate={m.eligibleDate}
              />
            ))}
          </div>
        </DashboardSection>
      )}

      {/* Memories */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Memories</h2>
          <AddMemoryDialog
            childId={profile.id}
            childName={profile.name}
            experiences={[
              ...profile.availableNow,
              ...profile.plannedAndBooked,
              ...profile.completed,
            ].map((ce) => ({
              childExperienceId: ce.id,
              experienceId: ce.experienceId,
              title: ce.experience.title,
            }))}
          />
        </div>

        {profile.memories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No memories yet — add one after you&apos;ve done something together.
          </p>
        ) : (
          <div className="space-y-3">
            {profile.memories.map((log) => (
              <div key={log.id} className="rounded-lg border bg-card p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {log.childExperience.experience.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.rating && (
                      <span className="text-xs text-amber-500">
                        {"★".repeat(log.rating)}
                      </span>
                    )}
                    {log.date && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {(log.whatHappened || log.childReaction) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {log.whatHappened ?? log.childReaction}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {log.costActual && <span>£{log.costActual}</span>}
                  {log.durationMinutes && (
                    <span>{Math.round(log.durationMinutes / 60 * 10) / 10}h</span>
                  )}
                  {log.wouldRepeat && (
                    <Badge variant="secondary" className="text-xs py-0">
                      Worth repeating
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
