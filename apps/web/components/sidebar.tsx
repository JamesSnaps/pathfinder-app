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
} from "lucide-react";
import { cn } from "@pathfinder/ui";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/experiences", label: "Experiences", icon: BookOpen },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/plans", label: "My Plans", icon: ScrollText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center px-4 border-b">
        <span className="font-semibold text-primary text-lg">Pathfinder</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </div>
    </aside>
  );
}
