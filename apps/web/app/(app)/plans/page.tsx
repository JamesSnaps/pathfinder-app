import Link from "next/link";
import { getPlans } from "@/lib/plans-queries";
import { BookCheck, ClipboardList } from "lucide-react";
import { PlanCard } from "@/components/plans/plan-card";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const { booked, planned } = await getPlans();
  const total = booked.length + planned.length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total === 0
            ? "Nothing planned yet — add experiences from the library."
            : `${total} experience${total !== 1 ? "s" : ""} across all children`}
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            What could we try next?{" "}
            <Link href="/experiences" className="text-primary underline underline-offset-2">
              Browse the experience library
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}

      {booked.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookCheck className="h-4 w-4 text-green-600" />
            <h2 className="text-sm font-semibold text-foreground">
              Booked ({booked.length})
            </h2>
          </div>
          <div className="space-y-2">
            {booked.map((item) => (
              <PlanCard key={item.id} item={item} />
            ))}

          </div>
        </section>
      )}

      {planned.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-yellow-600" />
            <h2 className="text-sm font-semibold text-foreground">
              Planned ({planned.length})
            </h2>
          </div>
          <div className="space-y-2">
            {planned.map((item) => (
              <PlanCard key={item.id} item={item} />
            ))}

          </div>
        </section>
      )}
    </div>
  );
}
