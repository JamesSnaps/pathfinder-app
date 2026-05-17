import Link from "next/link";
import { Badge, cn } from "@pathfinder/ui";
import { STATUS_LABELS } from "@pathfinder/shared";
import type { ChildExperienceStatus } from "@pathfinder/shared";

interface ExperienceCardProps {
  id: string;
  title: string;
  childName: string;
  status: ChildExperienceStatus;
  category: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
  meta?: string;
  className?: string;
}

const CATEGORY_COLOURS: Record<string, string> = {
  Adventure: "bg-orange-100 text-orange-700",
  Nature: "bg-green-100 text-green-700",
  Culture: "bg-purple-100 text-purple-700",
  Sport: "bg-blue-100 text-blue-700",
  "Practical Skill": "bg-yellow-100 text-yellow-700",
  Independence: "bg-teal-100 text-teal-700",
  Travel: "bg-sky-100 text-sky-700",
  "People & Community": "bg-pink-100 text-pink-700",
  STEM: "bg-indigo-100 text-indigo-700",
  "Family Tradition": "bg-rose-100 text-rose-700",
};

export function ExperienceCard({
  id,
  title,
  childName,
  status,
  category,
  badge,
  meta,
  className,
}: ExperienceCardProps) {
  const categoryColour = CATEGORY_COLOURS[category] ?? "bg-muted text-muted-foreground";

  return (
    <Link
      href={`/experiences/${id}`}
      className={cn(
        "flex items-start justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {childName} · {STATUS_LABELS[status]}
        </p>
        {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
      </div>
      <div className="ml-3 shrink-0 flex flex-col items-end gap-1">
        <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", categoryColour)}>
          {category}
        </span>
        {badge && (
          <span className="text-xs text-muted-foreground">{badge}</span>
        )}
      </div>
    </Link>
  );
}
