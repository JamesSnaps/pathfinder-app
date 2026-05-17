export const CHILD_EXPERIENCE_STATUSES = [
  "idea",
  "researching",
  "planned",
  "booked",
  "done",
  "repeat",
  "not_interested",
  "paused",
] as const;

export type ChildExperienceStatus = (typeof CHILD_EXPERIENCE_STATUSES)[number];

export const ACTION_TYPES = ["task", "checklist", "kit_item", "reminder"] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const COST_BANDS = ["free", "low", "medium", "high"] as const;
export type CostBand = (typeof COST_BANDS)[number];

export const SEASONS = ["any", "spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const EXPERIENCE_CATEGORIES = [
  "Adventure",
  "Nature",
  "Culture",
  "Sport",
  "Practical Skill",
  "Independence",
  "Travel",
  "People & Community",
  "STEM",
  "Family Tradition",
] as const;

export type ExperienceCategory = (typeof EXPERIENCE_CATEGORIES)[number];

export const CONFIDENCE_LEVELS = ["none", "low", "medium", "high"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type AgeEligibility =
  | "available_now"
  | "coming_soon"
  | "too_young"
  | "done"
  | "repeatable";

export interface AutheliaUser {
  username: string;
  displayName: string;
  groups: string[];
}

export const STATUS_LABELS: Record<ChildExperienceStatus, string> = {
  idea: "Idea",
  researching: "Researching",
  planned: "Planned",
  booked: "Booked",
  done: "Done",
  repeat: "Worth repeating",
  not_interested: "Not interested",
  paused: "Paused",
};

export const COST_BAND_LABELS: Record<CostBand, string> = {
  free: "Free",
  low: "Low cost",
  medium: "Medium cost",
  high: "High cost",
};
