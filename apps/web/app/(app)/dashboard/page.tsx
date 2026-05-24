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
import { WeekendPlannerWidget } from "@/components/dashboard/weekend-planner-widget";
import type { ChildExperienceStatus } from "@pathfinder/shared";
import {
  Compass,
  Clock,
  Zap,
  CalendarCheck,
  CheckCircle2,
  Star,
} from "lucide-react";

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
      <div className="rounded-xl bg-gradient-to-br from-[hsl(152_45%_22%)] to-[hsl(152_45%_16%)] p-6 text-white shadow-md">
        <p className="text-sm font-medium text-white/60 mb-1">{greeting()}</p>
        <h1 className="text-2xl font-bold">What adventure is next?</h1>
        <p className="mt-1.5 text-sm text-white/70">
          {counts.availableNow} experience{counts.availableNow !== 1 ? "s" : ""} ready now
          {counts.booked > 0 && ` · ${counts.booked} booked`}
          {counts.needsAction > 0 && ` · ${counts.needsAction} need${counts.needsAction !== 1 ? "" : "s"} a next step`}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard label="Available now"   value={counts.availableNow} icon={Compass}      accent="text-green-600"  iconBg="bg-green-50" />
        <StatCard label="Coming up"       value={counts.comingSoon}   icon={Clock}        accent="text-amber-600"  iconBg="bg-amber-50" />
        <StatCard label="Needs next step" value={counts.needsAction}  icon={Zap}          accent="text-red-500"    iconBg="bg-red-50" />
        <StatCard label="Booked"          value={counts.booked}       icon={CalendarCheck} accent="text-blue-600"  iconBg="bg-blue-50" />
        <StatCard label="Completed"       value={counts.completed}    icon={CheckCircle2} accent="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Favourites"      value={counts.favourites}   icon={Star}         accent="text-rose-500"   iconBg="bg-rose-50" />
      </div>

      {/* Weekend planner — full width */}
      <WeekendPlannerWidget />

      {/* Main sections — two column on larger screens */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                childAvatarUrl={ce.child.avatarUrl}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
              />
            ))}
          </div>
        </DashboardSection>

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
                  childAvatarUrl={ce.child.avatarUrl}
                  status={ce.status as ChildExperienceStatus}
                  category={ce.experience.category}
                  meta={`Ready in ~${months} month${months !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        </DashboardSection>

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
                childAvatarUrl={ce.child.avatarUrl}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
              />
            ))}
          </div>
        </DashboardSection>

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
                childAvatarUrl={ce.child.avatarUrl}
                status={ce.status as ChildExperienceStatus}
                category={ce.experience.category}
                meta={
                  ce.targetDate
                    ? `Target: ${new Date(ce.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : undefined
                }
              />
            ))}
          </div>
        </DashboardSection>

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
                  childAvatarUrl={ce.child.avatarUrl}
                  status={ce.status as ChildExperienceStatus}
                  category={ce.experience.category}
                  badge={log?.rating ? "★".repeat(log.rating) : undefined}
                  meta={
                    ce.completedDate
                      ? new Date(ce.completedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      : undefined
                  }
                />
              );
            })}
          </div>
        </DashboardSection>

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
                childAvatarUrl={log.childExperience.child.avatarUrl}
                status={log.childExperience.status as ChildExperienceStatus}
                category={log.childExperience.experience.category}
                badge={log.rating ? "★".repeat(log.rating) : undefined}
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
                childAvatarUrl={m.child.avatarUrl}
                experienceTitle={m.experience.title}
                experienceId={m.experience.id}
                category={m.experience.category}
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
