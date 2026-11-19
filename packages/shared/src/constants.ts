// Plain values with no zod dependency, so the public landing page can import them
// (via "@raudevweb/shared/constants") without pulling zod into the first download.

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
