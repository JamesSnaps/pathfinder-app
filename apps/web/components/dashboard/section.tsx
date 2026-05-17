import Link from "next/link";
import { cn } from "@pathfinder/ui";

interface DashboardSectionProps {
  title: string;
  viewAllHref?: string;
  empty?: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  viewAllHref,
  empty,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs text-primary hover:underline">
            View all
          </Link>
        )}
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground py-4">{empty}</p>
      ) : (
        children
      )}
    </section>
  );
}
