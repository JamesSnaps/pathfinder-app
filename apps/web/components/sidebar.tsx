"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  CalendarDays,
  ScrollText,
  Settings,
  Users,
  Compass,
} from "lucide-react";
import { cn } from "@pathfinder/ui";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard },
  { href: "/soon",         label: "What can we do?", icon: Compass },
  { href: "/children",     label: "Children",        icon: Users },
  { href: "/experiences",  label: "Experiences",     icon: BookOpen },
  { href: "/places",       label: "Places",          icon: MapPin },
  { href: "/plans",        label: "My Plans",        icon: ScrollText },
  { href: "/calendar",     label: "Calendar",        icon: CalendarDays },
  { href: "/settings",     label: "Settings",        icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col bg-[hsl(152_45%_20%)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-white/10">
        <span className="text-xl select-none" aria-hidden>🧭</span>
        <span className="font-bold text-white text-lg tracking-tight">Pathfinder</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-white/50")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/30" suppressHydrationWarning>v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </div>
    </aside>
  );
}
