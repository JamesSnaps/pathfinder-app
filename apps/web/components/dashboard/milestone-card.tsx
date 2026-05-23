import Link from "next/link";
import { getCategoryTheme } from "@/lib/category-theme";
import { ChildAvatar } from "@/components/children/child-avatar";

interface MilestoneCardProps {
  childName: string;
  childAvatarUrl?: string | null;
  experienceTitle: string;
  experienceId: string;
  category: string;
  daysUntil: number;
  eligibleDate: Date;
}

export function MilestoneCard({
  childName,
  childAvatarUrl,
  experienceTitle,
  experienceId,
  category,
  daysUntil,
  eligibleDate,
}: MilestoneCardProps) {
  const theme = getCategoryTheme(category);
  const formatted = eligibleDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const urgent = daysUntil <= 14;

  return (
    <Link
      href={`/experiences/${experienceId}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-all group"
    >
      {/* Countdown bubble */}
      <div
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-white ${urgent ? "bg-orange-500" : theme.strip}`}
      >
        <span className="text-lg font-bold leading-none">{daysUntil}</span>
        <span className="text-[9px] uppercase tracking-wide opacity-80 mt-0.5">days</span>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base leading-none select-none" aria-hidden>{theme.emoji}</span>
          <p className="text-sm font-semibold text-foreground truncate">{experienceTitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ChildAvatar name={childName} avatarUrl={childAvatarUrl} size="xs" />
          {childName} · ready {formatted}
        </div>
      </div>
    </Link>
  );
}
