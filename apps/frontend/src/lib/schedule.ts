import type { SessionScheduleInput } from "@raudevweb/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local midnight of the Monday that starts `date`'s week. */
export function startOfWeek(date: Date) {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const offset = (d.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
	d.setDate(d.getDate() - offset);
	return d;
}

export function addDays(date: Date, days: number) {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

/** Whole days between two local midnights (DST-safe). */
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

/** ISO-8601 week number (weeks start on Monday, week 1 contains Jan 4th). */
export function isoWeek(date: Date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

/** "2026-09-29" → local Date at midnight */
export function parseLocalDate(ymd: string) {
	const [y, m, d] = ymd.split("-").map(Number);
	return new Date(y, m - 1, d);
}

export type WeekInfo = {
	/** Semester week (1-based) or calendar week; null before the semester starts. */
	number: number | null;
	kind: "semester" | "calendar";
	monday: Date;
	sunday: Date;
	/** When the semester hasn't started yet */
	startsOn?: Date;
};

export function weekInfo(now: Date, semesterStart: string | null): WeekInfo {
	const monday = startOfWeek(now);
	const sunday = addDays(monday, 6);

	if (!semesterStart) return { number: isoWeek(now), kind: "calendar", monday, sunday };

	const start = parseLocalDate(semesterStart);
	const week = Math.floor(daysBetween(startOfWeek(start), monday) / 7) + 1;
	return week >= 1
		? { number: week, kind: "semester", monday, sunday }
		: { number: null, kind: "semester", monday, sunday, startsOn: start };
}

const at = (day: Date, hhmm: string) => {
	const [h, m] = hhmm.split(":").map(Number);
	const d = new Date(day);
	d.setHours(h, m, 0, 0);
	return d;
};

export type SessionStatus = "upcoming" | "today" | "live" | "ended";

export type SessionInfo = {
	/** This week's session start/end */
	start: Date;
	end: Date;
	status: SessionStatus;
	/** Next week's session, useful once this week's has ended */
	next: Date;
};

/** The session in the current Monday–Sunday week and where `now` is relative to it. */
export function sessionInfo(now: Date, s: Pick<SessionScheduleInput, "weekday" | "startTime" | "endTime">): SessionInfo {
	const day = addDays(startOfWeek(now), (s.weekday + 6) % 7);
	const start = at(day, s.startTime);
	const end = at(day, s.endTime);

	let status: SessionStatus;
	if (now >= end) status = "ended";
	else if (now >= start) status = "live";
	else if (daysBetween(startOfWeek(now), day) === daysBetween(startOfWeek(now), now)) status = "today";
	else status = "upcoming";

	return { start, end, status, next: addDays(start, 7) };
}

export const formatDay = (d: Date) =>
	d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export const formatShort = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
