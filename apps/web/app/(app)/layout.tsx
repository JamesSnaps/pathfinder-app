import { eq } from "drizzle-orm";
import { db } from "@pathfinder/db/client";
import { children, experiences } from "@pathfinder/db/schema";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ContextualFAB } from "@/components/contextual-fab";

export default async function AppLayout({ children: pageChildren }: { children: React.ReactNode }) {
  const [activeChildren, allExperiences] = await Promise.all([
    db.query.children.findMany({
      where: eq(children.active, true),
      columns: { id: true, name: true },
      orderBy: (c, { asc }) => [asc(c.name)],
    }),
    db.query.experiences.findMany({
      columns: { id: true, title: true, category: true },
    }),
  ]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        {pageChildren}
      </main>
      <MobileNav />
      <ContextualFAB activeChildren={activeChildren} experiences={allExperiences} />
    </div>
  );
}
