import { cn } from "@pathfinder/ui";

interface MilestoneCardProps {
  childName: string;
  experienceTitle: string;
  daysUntil: number;
  eligibleDate: Date;
}

export function MilestoneCard({ childName, experienceTitle, daysUntil, eligibleDate }: MilestoneCardProps) {
  const formatted = eligibleDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        daysUntil <= 14 ? "bg-orange-100 text-orange-700" : "bg-primary/10 text-primary"
      )}>
        {daysUntil}d
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{experienceTitle}</p>
        <p className="text-xs text-muted-foreground">{childName} · eligible {formatted}</p>
      </div>
    </div>
  );
}
