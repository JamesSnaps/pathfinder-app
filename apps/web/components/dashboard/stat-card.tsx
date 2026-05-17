import { cn } from "@pathfinder/ui";

interface StatCardProps {
  label: string;
  value: number;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 text-center", className)}>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
