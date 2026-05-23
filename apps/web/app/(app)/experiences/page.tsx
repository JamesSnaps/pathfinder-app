import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getExperiences } from "@/lib/experience-queries";
import { getAllChildren } from "@/lib/children-queries";
import { FilterBar } from "@/components/experiences/filter-bar";
import { Badge, cn } from "@pathfinder/ui";
import type { CostBand } from "@pathfinder/shared";
import { COST_BAND_LABELS } from "@pathfinder/shared";
import { SuggestExperiencesDialog } from "@/components/experiences/suggest-experiences-dialog";

export const dynamic = "force-dynamic";

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

const CATEGORY_BG: Record<string, string> = {
  Adventure: "bg-orange-100",
  Nature: "bg-green-100",
  Culture: "bg-purple-100",
  Sport: "bg-blue-100",
  "Practical Skill": "bg-yellow-100",
  Independence: "bg-teal-100",
  Travel: "bg-sky-100",
  "People & Community": "bg-pink-100",
  STEM: "bg-indigo-100",
  "Family Tradition": "bg-rose-100",
};

const CATEGORY_ICONS: Record<string, string> = {
  Adventure: "🧗",
  Nature: "🌿",
  Culture: "🎭",
  Sport: "⚽",
  "Practical Skill": "🔧",
  Independence: "🗺️",
  Travel: "✈️",
  "People & Community": "🤝",
  STEM: "🔬",
  "Family Tradition": "🏡",
};

const SEASON_ICONS: Record<string, string> = {
  spring: "🌱",
  summer: "☀️",
  autumn: "🍂",
  winter: "❄️",
  any: "",
};

function minAgeLabel(months: number | null): string {
  if (!months) return "Any age";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y+`;
  return `${years}y ${rem}mo+`;
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function ExperiencesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "grid";

  const [experiences, activeChildren] = await Promise.all([
    getExperiences({
      category: params.category,
      season: params.season,
      cost: params.cost,
      repeatable: params.repeatable === "true" ? true : undefined,
      q: params.q,
    }),
    getAllChildren(),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Experience Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {experiences.length} experience{experiences.length !== 1 ? "s" : ""}
          </p>
        </div>
        <SuggestExperiencesDialog children={activeChildren} />
      </div>

      <Suspense>
        <FilterBar />
      </Suspense>

      {experiences.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Nothing matches your filters — try widening them.
        </p>
      ) : view === "list" ? (
        <div className="flex flex-col divide-y rounded-lg border bg-card overflow-hidden">
          {experiences.map((exp) => {
            const catColour = CATEGORY_COLOURS[exp.category] ?? "bg-muted text-muted-foreground";
            return (
              <Link
                key={exp.id}
                href={`/experiences/${exp.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                {/* Category colour strip */}
                <span className={cn("shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-medium", catColour)}>
                  {exp.category}
                </span>

                {/* Title + description */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{exp.title}</p>
                  {exp.description && (
                    <p className="text-xs text-muted-foreground truncate">{exp.description}</p>
                  )}
                </div>

                {/* Meta badges */}
                <div className="hidden sm:flex shrink-0 flex-wrap gap-1.5 justify-end">
                  <Badge variant="outline" className="text-xs">
                    {minAgeLabel(exp.minimumAgeMonths)}
                  </Badge>
                  {exp.season && exp.season !== "any" && (
                    <Badge variant="outline" className="text-xs">
                      {SEASON_ICONS[exp.season]} {exp.season}
                    </Badge>
                  )}
                  {exp.costBand && (
                    <Badge variant="outline" className="text-xs">
                      {COST_BAND_LABELS[exp.costBand as CostBand]}
                    </Badge>
                  )}
                  {exp.typicalDurationHours && (
                    <Badge variant="outline" className="text-xs">
                      {exp.typicalDurationHours}h
                    </Badge>
                  )}
                  {exp.repeatable && (
                    <Badge variant="secondary" className="text-xs">
                      Repeatable
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => {
            const catColour = CATEGORY_COLOURS[exp.category] ?? "bg-muted text-muted-foreground";
            const catBg = CATEGORY_BG[exp.category] ?? "bg-muted";
            return (
              <Link
                key={exp.id}
                href={`/experiences/${exp.id}`}
                className="flex flex-col rounded-lg border bg-card hover:bg-accent/50 transition-colors overflow-hidden"
              >
                {/* Image / fallback */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  {exp.imageUrl ? (
                    <Image
                      src={exp.imageUrl}
                      alt={exp.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", catBg)}>
                      <span className="text-3xl select-none">{CATEGORY_ICONS[exp.category] ?? "🌟"}</span>
                    </div>
                  )}
                  <span className={cn("absolute top-2 left-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium", catColour)}>
                    {exp.category}
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-4">
                  <p className="text-sm font-medium text-foreground leading-snug">{exp.title}</p>

                  {exp.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{exp.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    <Badge variant="outline" className="text-xs">
                      {minAgeLabel(exp.minimumAgeMonths)}
                    </Badge>
                    {exp.season && exp.season !== "any" && (
                      <Badge variant="outline" className="text-xs">
                        {SEASON_ICONS[exp.season]} {exp.season}
                      </Badge>
                    )}
                    {exp.costBand && (
                      <Badge variant="outline" className="text-xs">
                        {COST_BAND_LABELS[exp.costBand as CostBand]}
                      </Badge>
                    )}
                    {exp.typicalDurationHours && (
                      <Badge variant="outline" className="text-xs">
                        {exp.typicalDurationHours}h
                      </Badge>
                    )}
                    {exp.repeatable && (
                      <Badge variant="secondary" className="text-xs">
                        Repeatable
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
