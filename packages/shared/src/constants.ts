// Plain values with no zod dependency, so the public landing page can import them
// (via "@raudevweb/shared/constants") without pulling zod into the first download.

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** XP for ticking a problem/exercise as done. Problems are harder, so they're worth double. */
export const COMPLETION_XP = { exercises: 10, problems: 20 } as const;

/** Content types that can be ticked as done. */
export type CompletableType = keyof typeof COMPLETION_XP;
