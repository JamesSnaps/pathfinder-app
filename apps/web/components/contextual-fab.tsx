"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, MapPin, Users, BookOpen } from "lucide-react";
import { Button } from "@pathfinder/ui";
import { AddExperienceDialog } from "@/components/experiences/add-experience-dialog";
import { AddPlaceDialog } from "@/components/places/add-place-dialog";
import { AddChildDialog } from "@/components/children/add-child-dialog";
import { QuickAddModal } from "@/components/quick-add-modal";

type DialogType = "experience" | "place" | "child" | "quick-add";

interface FabConfig {
  type: DialogType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getConfig(pathname: string): FabConfig | null {
  if (pathname.startsWith("/experiences"))
    return { type: "experience", label: "Add experience", Icon: BookOpen };
  if (pathname.startsWith("/places"))
    return { type: "place", label: "Add place", Icon: MapPin };
  if (pathname.startsWith("/children"))
    return { type: "child", label: "Add child", Icon: Users };
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/soon")
  )
    return { type: "quick-add", label: "Quick add", Icon: Plus };
  return null;
}

interface ContextualFABProps {
  activeChildren: { id: string; name: string }[];
  experiences: { id: string; title: string; category: string }[];
}

export function ContextualFAB({ activeChildren, experiences }: ContextualFABProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const config = getConfig(pathname);
  if (!config) return null;

  const { type, label, Icon } = config;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-12 rounded-full shadow-lg z-50 gap-2 pl-4 pr-5"
        aria-label={label}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </Button>

      {type === "experience" && (
        <AddExperienceDialog open={open} onOpenChange={setOpen} />
      )}
      {type === "place" && (
        <AddPlaceDialog open={open} onOpenChange={setOpen} />
      )}
      {type === "child" && (
        <AddChildDialog open={open} onOpenChange={setOpen} />
      )}
      {type === "quick-add" && (
        <QuickAddModal
          open={open}
          onOpenChange={setOpen}
          activeChildren={activeChildren}
          experiences={experiences}
        />
      )}
    </>
  );
}
