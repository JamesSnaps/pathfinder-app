import {
  getDashboardCounts,
  getAvailableNow,
  getComingSoon,
  getNeedsAction,
  getBooked,
  getRecentlyCompleted,
  getRepeatableFavourites,
  getUpcomingMilestones,
} from "@/lib/dashboard-queries";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardSection } from "@/components/dashboard/section";
import { ExperienceCard } from "@/components/dashboard/experience-card";
import { MilestoneCard } from "@/components/dashboard/milestone-card";
import type { ChildExperienceStatus } from "@pathfinder/shared";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [
    counts,
    availableNow,
    comingSoon,
    needsAction,
    booked,
    recentlyCompleted,
    repeatableFavourites,
    milestones,
  ] = await Promise.all([
    getDashboardCounts(),
    getAvailableNow(),
    getComingSoon(),
    getNeedsAction(),
    getBooked(),
    getRecentlyCompleted(),
    getRepeatableFavourites(),
    getUpcomingMilestones(),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{greeting()}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your adventure plans.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard label="Available now" value={counts.availableNow} />
        <StatCard label="Coming up soon" value={counts.comingSoon} />
        <StatCard label="Needs next step" value={counts.needsAction} />
        <StatCard label="Booked" value={counts.booked} />
        <StatCard label="Completed" value={counts.completed} />
        <StatCard label="Favourites" value={counts.favourites} />
      </div>

      {/* Main sections — two column on larger screens */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Available now */}
        <DashboardSection
          title="Available now"
          viewAllHref="/experiences?filter=available"
          empty={availableNow.length === 0 ? "Nothing available yet — add some experiences to get started." : undefined}
        >
          <div className="space-y-2">
            {availableNow.map((ce) => (
              <ExperienceCard
                key={ce.id}
                id={ce.experienceId}
                title={ce.experience.title}
                childName={ce.child.name}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Coming up soon */}
        <DashboardSection
          title="Coming up soon"
          viewAllHref="/experiences?filter=soon"
          empty={comingSoon.length === 0 ? "Nothing becoming available in the next 6 months." : undefined}
        >
          <div className="space-y-2">
            {comingSoon.map((ce) => {
              const months = Math.ceil(
                (new Date(ce.child.dateOfBirth).getTime() +
                  (ce.experience.minimumAgeMonths ?? 0) * 30 * 24 * 60 * 60 * 1000 -
                  Date.now()) /
                  (30 * 24 * 60 * 60 * 1000)
              );
              return (
                <ExperienceCard
                  key={ce.id}
                  id={ce.experienceId}
                  title={ce.experience.title}
                  childName={ce.child.name}
                  status={ce.status as ChildExperienceStatus}
                  category={ce.experience.category}
                  meta={`Available in ~${months} month${months !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        </DashboardSection>

        {/* Needs next action */}
        <DashboardSection
          title="Needs a tiny next step"
          viewAllHref="/plans"
          empty={needsAction.length === 0 ? "Every planned experience has a next step. Nice work." : undefined}
        >
          <div className="space-y-2">
            {needsAction.map((ce) => (
              <ExperienceCard
                key={ce.id}
                id={ce.experienceId}
                title={ce.experience.title}
                childName={ce.child.name}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Booked */}
        <DashboardSection
          title="Booked"
          viewAllHref="/plans"
          empty={booked.length === 0 ? "Nothing booked yet." : undefined}
        >
          <div className="space-y-2">
            {booked.map((ce) => (
              <ExperienceCard
                key={ce.id}
                id={ce.experienceId}
                title={ce.experience.title}
                childName={ce.child.name}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
                meta={ce.targetDate ? `Target: ${new Date(ce.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : undefined}
              />
            ))}
          </div>
        </DashboardSection>

        {/* Recently completed */}
        <DashboardSection
          title="Recently completed"
          viewAllHref="/experiences?filter=done"
          empty={recentlyCompleted.length === 0 ? "No experiences completed in the last 60 days." : undefined}
        >
          <div className="space-y-2">
            {recentlyCompleted.map((ce) => {
              const log = ce.activityLog[0];
              return (
                <ExperienceCard
                  key={ce.id}
                  id={ce.experienceId}
                  title={ce.experience.title}
                  childName={ce.child.name}
                  status={ce.status as ChildExperienceStatus}
                  category={ce.experience.category}
                  badge={log?.rating ? `${"★".repeat(log.rating)}` : undefined}
                  meta={ce.completedDate ? new Date(ce.completedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : undefined}
                />
              );
            })}
          </div>
        </DashboardSection>

        {/* Repeatable favourites */}
        <DashboardSection
          title="Worth doing again"
          empty={repeatableFavourites.length === 0 ? "Mark an activity log entry as 'would repeat' to see it here." : undefined}
        >
          <div className="space-y-2">
            {repeatableFavourites.map((log) => (
              <ExperienceCard
                key={log.id}
                id={log.childExperience.experienceId}
                title={log.childExperience.experience.title}
                childName={log.childExperience.child.name}
                status={log.childExperience.status as ChildExperienceStatus}
                category={log.childExperience.experience.category}
                badge={log.rating ? `${"★".repeat(log.rating)}` : undefined}
              />
            ))}
          </div>
        </DashboardSection>
      </div>

      {/* Age milestones — full width */}
      {milestones.length > 0 && (
        <DashboardSection title="Coming up for eligibility">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {milestones.map((m, i) => (
              <MilestoneCard
                key={i}
                childName={m.child.name}
                experienceTitle={m.experience.title}
                daysUntil={m.daysUntil}
                eligibleDate={m.eligibleDate}
              />
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
