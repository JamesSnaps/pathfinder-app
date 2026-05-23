import Link from "next/link";
import { cn } from "@pathfinder/ui";
import { STATUS_LABELS } from "@pathfinder/shared";
import type { ChildExperienceStatus } from "@pathfinder/shared";
import { getCategoryTheme } from "@/lib/category-theme";
import { ArrowRight } from "lucide-react";
import { ChildAvatar } from "@/components/children/child-avatar";

interface ExperienceCardProps {
  id: string;
  title: string;
  childName: string;
  childAvatarUrl?: string | null;
  status: ChildExperienceStatus;
  category: string;
  meta?: string;
  badge?: string;
  className?: string;
}

const STATUS_COLOURS: Record<ChildExperienceStatus, string> = {
  idea:           "bg-slate-100 text-slate-600",
  researching:    "bg-blue-100 text-blue-700",
  planned:        "bg-amber-100 text-amber-700",
  booked:         "bg-green-100 text-green-700",
  done:           "bg-purple-100 text-purple-700",
  repeat:         "bg-rose-100 text-rose-700",
  not_interested: "bg-muted text-muted-foreground",
  paused:         "bg-muted text-muted-foreground",
};

export function ExperienceCard({
  id,
  title,
  childName,
  childAvatarUrl,
  status,
  category,
  meta,
  badge,
  className,
}: ExperienceCardProps) {
  const theme = getCategoryTheme(category);

  return (
    <Link
      href={`/experiences/${id}`}
      className={cn(
        "group flex items-stretch rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-all",
        className
      )}
    >
      {/* Category strip + emoji */}
      <div className={cn("flex flex-col items-center justify-center w-12 shrink-0 gap-1", theme.bg)}>
        <span className="text-xl leading-none select-none" aria-hidden>{theme.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2.5 flex items-center gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{title}</p>
          <div className="flex flex-wrap items-center gap-1.5">
              <ChildAvatar name={childName} avatarUrl={childAvatarUrl} size="xs" />
              <span className="text-xs text-muted-foreground">{childName}</span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_COLOURS[status])}>
              {STATUS_LABELS[status]}
            </span>
            {badge && (
              <span className="text-xs text-amber-500 font-medium">{badge}</span>
            )}
            {meta && (
              <span className="text-xs text-muted-foreground">{meta}</span>
            )}
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
      </div>
    </Link>
  );
}
