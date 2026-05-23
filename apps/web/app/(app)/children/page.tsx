import Link from "next/link";
import { getAllChildrenWithStats } from "@/lib/children-queries";
import { Card, CardContent } from "@pathfinder/ui";
import { formatAge } from "@/lib/age";
import { ChildAvatar } from "@/components/children/child-avatar";

export const dynamic = "force-dynamic";

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function ChildrenPage() {
  const childrenWithStats = await getAllChildrenWithStats();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Children</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a child to see their experiences and adventures.
          </p>
        </div>
      </div>

      {childrenWithStats.length === 0 ? (
        <p className="text-sm text-muted-foreground">No children added yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {childrenWithStats.map((child) => (
            <Link key={child.id} href={`/children/${child.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {child.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Age {formatAge(child.dateOfBirth)}
                      </p>
                    </div>
                    <ChildAvatar name={child.name} avatarUrl={child.avatarUrl} size="sm" />
                  </div>
                  <div className="grid grid-cols-4 divide-x">
                    <StatPill label="Ready" value={child.stats.availableNow} />
                    <StatPill label="Planned" value={child.stats.planned} />
                    <StatPill label="Booked" value={child.stats.booked} />
                    <StatPill label="Done" value={child.stats.done} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
