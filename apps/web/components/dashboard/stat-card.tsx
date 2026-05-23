import { cn } from "@pathfinder/ui";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;   // icon + border-top colour classes
  iconBg: string;   // icon background
  className?: string;
}

export function StatCard({ label, value, icon: Icon, accent, iconBg, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg p-2", iconBg)}>
          <Icon className={cn("h-4 w-4", accent)} />
        </div>
        <span className={cn("text-2xl font-bold tabular-nums", "text-foreground")}>{value}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
