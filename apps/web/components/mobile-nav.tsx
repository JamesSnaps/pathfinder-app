"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ScrollText,
  MoreHorizontal,
  Compass,
  CalendarDays,
  MapPin,
  Settings,
} from "lucide-react";
import { cn } from "@pathfinder/ui";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@pathfinder/ui";

const PRIMARY_NAV = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/children",     label: "Children",    icon: Users },
  { href: "/experiences",  label: "Experiences", icon: BookOpen },
  { href: "/plans",        label: "Plans",       icon: ScrollText },
];

const MORE_NAV = [
  { href: "/soon",      label: "What can we do?", icon: Compass },
  { href: "/places",    label: "Places",           icon: MapPin },
  { href: "/calendar",  label: "Calendar",         icon: CalendarDays },
  { href: "/settings",  label: "Settings",         icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_NAV.some((item) => pathname.startsWith(item.href));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(152_45%_20%)] flex items-stretch border-t border-white/10 safe-area-bottom">
      {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-white" : "text-white/50"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-white" : "text-white/50")} />
            {label}
          </Link>
        );
      })}

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isMoreActive ? "text-white" : "text-white/50"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", isMoreActive ? "text-white" : "text-white/50")} />
            More
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2">
            {MORE_NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
