export interface CategoryTheme {
  bg: string;       // gradient background
  strip: string;    // solid accent strip colour
  border: string;   // border colour
  badge: string;    // pill badge classes
  text: string;     // accent text colour
  emoji: string;
}

export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  Adventure:            { bg: "bg-gradient-to-br from-orange-50 to-amber-50/60",  strip: "bg-orange-400", border: "border-orange-200", badge: "bg-orange-100 text-orange-700",   text: "text-orange-600", emoji: "🧗" },
  Nature:               { bg: "bg-gradient-to-br from-green-50 to-emerald-50/60", strip: "bg-green-500",  border: "border-green-200",  badge: "bg-green-100 text-green-700",     text: "text-green-600",  emoji: "🌿" },
  Culture:              { bg: "bg-gradient-to-br from-purple-50 to-violet-50/60", strip: "bg-purple-500", border: "border-purple-200", badge: "bg-purple-100 text-purple-700",   text: "text-purple-600", emoji: "🎭" },
  Sport:                { bg: "bg-gradient-to-br from-blue-50 to-sky-50/60",      strip: "bg-blue-500",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",       text: "text-blue-600",   emoji: "⚽" },
  "Practical Skill":    { bg: "bg-gradient-to-br from-yellow-50 to-amber-50/60",  strip: "bg-yellow-500", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700",   text: "text-yellow-600", emoji: "🔧" },
  Independence:         { bg: "bg-gradient-to-br from-teal-50 to-cyan-50/60",     strip: "bg-teal-500",   border: "border-teal-200",   badge: "bg-teal-100 text-teal-700",       text: "text-teal-600",   emoji: "⭐" },
  Travel:               { bg: "bg-gradient-to-br from-sky-50 to-blue-50/60",      strip: "bg-sky-500",    border: "border-sky-200",    badge: "bg-sky-100 text-sky-700",         text: "text-sky-600",    emoji: "✈️" },
  "People & Community": { bg: "bg-gradient-to-br from-pink-50 to-rose-50/60",    strip: "bg-pink-500",   border: "border-pink-200",   badge: "bg-pink-100 text-pink-700",       text: "text-pink-600",   emoji: "🤝" },
  STEM:                 { bg: "bg-gradient-to-br from-indigo-50 to-blue-50/60",   strip: "bg-indigo-500", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700",   text: "text-indigo-600", emoji: "🔬" },
  "Family Tradition":   { bg: "bg-gradient-to-br from-rose-50 to-pink-50/60",    strip: "bg-rose-500",   border: "border-rose-200",   badge: "bg-rose-100 text-rose-700",       text: "text-rose-600",   emoji: "❤️" },
};

export const FALLBACK_THEME: CategoryTheme = {
  bg: "bg-muted/30", strip: "bg-muted", border: "border-border", badge: "bg-muted text-muted-foreground", text: "text-muted-foreground", emoji: "✨",
};

export function getCategoryTheme(category: string): CategoryTheme {
  return CATEGORY_THEME[category] ?? FALLBACK_THEME;
}
